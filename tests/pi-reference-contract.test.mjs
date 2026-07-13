import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function read(relativePath) {
  return readFileSync(path.join(ROOT, relativePath), "utf8");
}

function walkMarkdown(directory) {
  const files = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...walkMarkdown(absolute));
    else if (entry.name.endsWith(".md")) files.push(absolute);
  }
  return files;
}

const piMappingPath = "skills/using-superpowers/references/pi-tools.md";
const piMapping = read(piMappingPath);
for (const tool of ["read", "write", "edit", "bash", "Skill", "TodoWrite", "subagent"]) {
  assert.match(piMapping, new RegExp(`\\b${tool}\\b`), `Pi mapping must mention ${tool}`);
}
assert.match(piMapping, /package-provided `Skill`/i);
assert.match(piMapping, /optional.*`subagent`|`subagent`.*optional/is);
assert.match(piMapping, /do not fabricate `Task/i);
assert.match(piMapping, /no background bash/i);

for (const runtimePath of [
  "skills/executing-plans/SKILL.md",
  "skills/brainstorming/visual-companion.md",
]) {
  assert.doesNotMatch(
    read(runtimePath),
    /Claude Code|Codex(?: CLI| App|:)|Copilot CLI|OpenCode|Antigravity/i,
    `${runtimePath} must contain only Pi runtime instructions`,
  );
}

const historicalAllowlist = [
  /[/\\]examples[/\\]/,
  /CREATION-LOG\.md$/,
  /anthropic-best-practices\.md$/,
  /[/\\]using-superpowers[/\\]references[/\\](?:codex|antigravity)-tools\.md$/,
];
const forbiddenRuntimePatterns = [
  /\bTask\s*\(/,
  /registerTaskTool/,
  /Claude Code's `Skill` tool/,
];
for (const absolute of walkMarkdown(path.join(ROOT, "skills"))) {
  if (absolute.endsWith(path.normalize(piMappingPath))) continue;
  if (historicalAllowlist.some((pattern) => pattern.test(absolute))) continue;
  const content = readFileSync(absolute, "utf8");
  for (const pattern of forbiddenRuntimePatterns) {
    assert.doesNotMatch(content, pattern, `${path.relative(ROOT, absolute)} contains ${pattern}`);
  }
}

const visited = new Set();
function assertRelativeLinks(absolute) {
  if (visited.has(absolute)) return;
  visited.add(absolute);
  const content = readFileSync(absolute, "utf8");
  for (const match of content.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
    const raw = match[1].trim().replace(/^<|>$/g, "").split("#", 1)[0];
    if (!raw || /^(?:[a-z]+:|#)/i.test(raw)) continue;
    const target = path.resolve(path.dirname(absolute), decodeURIComponent(raw));
    assert.ok(existsSync(target), `${path.relative(ROOT, absolute)} has missing link ${raw}`);
    if (target.endsWith(".md")) assertRelativeLinks(target);
  }
}
for (const skillDir of readdirSync(path.join(ROOT, "skills"), { withFileTypes: true })) {
  if (!skillDir.isDirectory()) continue;
  assertRelativeLinks(path.join(ROOT, "skills", skillDir.name, "SKILL.md"));
}

const packageJson = JSON.parse(read("package.json"));
assert.equal(
  packageJson.scripts.test,
  "node tests/structure.test.mjs && node tests/upstream-sync.test.mjs && node tests/extension.test.mjs && node tests/skill-contracts.test.mjs && node tests/pi-reference-contract.test.mjs && node tests/validate-eval-report.test.mjs",
);

console.log(`Pi reference checks passed for ${visited.size} reachable markdown files`);
