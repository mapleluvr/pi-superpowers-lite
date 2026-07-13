import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const packageMetadata = await import(new URL("../package.json", import.meta.url), { with: { type: "json" } });
const extension = await import(new URL(`../.pi/extensions/superpowers.ts?case=${Date.now()}`, import.meta.url));

const { bootstrapMarker, buildBootstrapContent, createSuperpowersPiExtension, piToolMapping } = extension;

function createSkill(root, name, body = `# ${name}\n\nComplete ${name} instructions.\n`) {
  const skillPath = path.join(root, name, "SKILL.md");
  mkdirSync(path.dirname(skillPath), { recursive: true });
  writeFileSync(skillPath, `---\nname: ${name}\ndescription: ${name} description\n---\n\n${body}`, "utf8");
  return skillPath;
}

function createHarness(factory = extension.default) {
  const tools = new Map();
  const commands = new Map();
  const handlers = new Map();

  factory({
    registerTool(tool) {
      tools.set(tool.name, tool);
    },
    registerCommand(name, command) {
      commands.set(name, command);
    },
    on(name, handler) {
      assert.equal(handlers.has(name), false, `only one ${name} lifecycle handler is expected`);
      handlers.set(name, handler);
    },
  });

  return {
    commands,
    handlers,
    tools,
    async emit(name, event = {}, context = { hasUI: false, ui: { notify() {} } }) {
      const handler = handlers.get(name);
      assert.ok(handler, `${name} handler should be registered`);
      return handler({ type: name, ...event }, context);
    },
  };
}

function textMessage(text) {
  return { role: "user", content: [{ type: "text", text }], timestamp: 1 };
}

function textOf(result) {
  const text = result.content.find((part) => part.type === "text");
  assert.ok(text, "tool result should contain text");
  return text.text;
}

function wordCount(value) {
  return value.trim().split(/\s+/).filter(Boolean).length;
}

assert.equal(packageMetadata.default.pi.extensions.length, 1);
assert.equal(packageMetadata.default.pi.skills.length, 1);
const manifest = JSON.parse(readFileSync(path.join(ROOT, "upstream-manifest.json"), "utf8"));
assert.deepEqual(
  manifest.files.find((entry) => entry.path === ".pi/extensions/superpowers.ts"),
  {
    path: ".pi/extensions/superpowers.ts",
    upstreamHash: "39c27000c047f8a1399a76e032e4cd239d7bdb0be168a121f46a2ac719deaae0",
    status: "pi-adapted",
  },
  "the extension must be registered as a Pi adaptation of the upstream lifecycle",
);
assert.equal(bootstrapMarker, "superpowers:using-superpowers bootstrap for pi");
assert.ok(wordCount(piToolMapping()) <= 150, "Pi mapping must stay within its 150-word budget");
for (const instruction of [
  'Use Skill({ skill: "name" }) for an installed skill.',
  "Use lowercase Pi tools for file and shell work.",
  "Use subagent from pi-subagents when available.",
  "Do not invent Task calls when no subagent tool exists.",
  "Use TodoWrite when an installed todo tool is available.",
]) {
  assert.match(piToolMapping(), new RegExp(instruction.replace(/[{}()[\].?*+^$|\\]/g, "\\$&")));
}
assert.match(buildBootstrapContent("---\nname: test\n---\n\nbody"), /\nbody\n/);
assert.doesNotMatch(buildBootstrapContent("---\nname: test\n---\n\nbody"), /name: test/);

const tempRoot = mkdtempSync(path.join(os.tmpdir(), "pi-superpowers-lite-extension-"));
const localSkills = path.join(tempRoot, "skills");
const exposedPath = createSkill(localSkills, "exposed", "# Exposed\n\nThe complete exposed body.\n");
const duplicatePath = createSkill(localSkills, "duplicate", "# First duplicate\n");
const duplicateReplacementPath = createSkill(path.join(tempRoot, "other"), "duplicate", "# Second duplicate\n");
const diskOnlyPath = createSkill(localSkills, "disk-only");
const outsideUsingSuperpowersPath = createSkill(path.join(tempRoot, "outside"), "using-superpowers");
const unreadableSkillPath = path.join(tempRoot, "missing", "SKILL.md");

try {
  const harness = createHarness();
  assert.deepEqual([...harness.tools.keys()].sort(), ["Skill", "TodoWrite"]);
  assert.deepEqual([...harness.commands.keys()].sort(), ["todo-clear", "todos"]);

  const initialMessages = [
    { role: "compactionSummary", content: "summary", timestamp: 1 },
    textMessage("normal context"),
  ];
  const firstContext = await harness.emit("context", { messages: initialMessages });
  assert.ok(firstContext, "first context should receive a bootstrap message");
  assert.equal(firstContext.messages.length, 3);
  assert.equal(firstContext.messages[1].content[0].text.includes(bootstrapMarker), true);

  const secondContext = await harness.emit("context", { messages: firstContext.messages });
  assert.equal(secondContext, undefined, "the marker prevents a second bootstrap in the same context");

  await harness.emit("session_compact");
  const compactedContext = await harness.emit("context", { messages: [textMessage("after compaction")] });
  assert.ok(compactedContext, "compaction re-enables bootstrap insertion");

  await harness.emit("agent_end");
  const afterAgentEnd = await harness.emit("context", { messages: [textMessage("later turn")] });
  assert.equal(afterAgentEnd, undefined, "agent_end prevents normal reinsertion");

  const warnings = [];
  const uiContext = {
    hasUI: true,
    ui: { notify(message, type) { warnings.push({ message, type }); } },
  };
  const exposedSkills = [
    { name: "exposed", description: "exposed description", filePath: exposedPath },
    { name: "duplicate", description: "first duplicate", filePath: duplicatePath },
    { name: "duplicate", description: "second duplicate", filePath: duplicateReplacementPath },
    { name: "using-superpowers", filePath: outsideUsingSuperpowersPath },
    { name: "unreadable", filePath: unreadableSkillPath },
  ];
  const originalWarn = console.warn;
  console.warn = () => {};
  try {
    await harness.emit("before_agent_start", { systemPromptOptions: { skills: exposedSkills } }, uiContext);
    await harness.emit("before_agent_start", { systemPromptOptions: { skills: exposedSkills } }, uiContext);
  } finally {
    console.warn = originalWarn;
  }
  assert.equal(warnings.length, 1, "an outside using-superpowers path warns once per session");
  assert.match(warnings[0].message, /outside this package/i);

  const exposed = await harness.tools.get("Skill").execute("test", { skill: "exposed" });
  assert.equal(exposed.isError, undefined, "an exposed skill should load");
  assert.match(textOf(exposed), /The complete exposed body\./);
  assert.doesNotMatch(textOf(exposed), /^name: exposed$/m, "Skill returns the body without frontmatter");

  const duplicate = await harness.tools.get("Skill").execute("test", { skill: "duplicate" });
  assert.match(textOf(duplicate), /First duplicate/);
  assert.doesNotMatch(textOf(duplicate), /Second duplicate/, "the first Pi duplicate wins");

  const diskOnly = await harness.tools.get("Skill").execute("test", { skill: "disk-only" });
  assert.equal(diskOnly.isError, true, "disk-only skills must not be read");
  assert.match(textOf(diskOnly), /Available skills:/);
  assert.doesNotMatch(textOf(diskOnly), /Complete disk-only instructions/);
  assert.ok(diskOnlyPath, "fixture should remain disk-only");

  const unreadable = await harness.tools.get("Skill").execute("test", { skill: "unreadable" });
  assert.equal(unreadable.isError, true);
  assert.match(textOf(unreadable), new RegExp(unreadableSkillPath.replace(/[\\]/g, "\\\\")));

  await harness.tools.get("TodoWrite").execute("test", {
    todos: [{ id: "one", content: "Persistent only for this session", status: "pending" }],
  });
  await harness.emit("session_start");
  const todoNotifications = [];
  await harness.commands.get("todos").handler("", {
    ui: { notify(message, type) { todoNotifications.push({ message, type }); } },
  });
  assert.match(todoNotifications[0].message, /No todos/);

  const missingBootstrapPath = path.join(tempRoot, "missing-bootstrap", "SKILL.md");
  const missingHarness = createHarness(createSuperpowersPiExtension({ bootstrapSkillPath: missingBootstrapPath }));
  const bootstrapErrors = [];
  const originalError = console.error;
  console.error = (...args) => bootstrapErrors.push(args.join(" "));
  try {
    const missingBootstrap = await missingHarness.emit(
      "context",
      { messages: [textMessage("no stale content")] },
      { hasUI: true, ui: { notify(message, type) { bootstrapErrors.push(`${type}: ${message}`); } } },
    );
    assert.equal(missingBootstrap, undefined, "an unreadable bootstrap must not inject stale content");
    assert.ok(bootstrapErrors.some((message) => message.includes(missingBootstrapPath)), "bootstrap failure names its path");
    const firstFailureCount = bootstrapErrors.length;
    const repeatedMissingBootstrap = await missingHarness.emit(
      "context",
      { messages: [textMessage("still no stale content")] },
      { hasUI: true, ui: { notify(message, type) { bootstrapErrors.push(`${type}: ${message}`); } } },
    );
    assert.equal(repeatedMissingBootstrap, undefined);
    assert.equal(bootstrapErrors.length, firstFailureCount, "a bootstrap read failure is cached for the session");
  } finally {
    console.error = originalError;
  }

  console.log("extension checks passed");
} finally {
  rmSync(tempRoot, { recursive: true, force: true });
}
