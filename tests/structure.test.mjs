import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SKILLS_DIR = path.join(ROOT, "skills");
const EXPECTED_SKILLS = [
  "brainstorming",
  "dispatching-parallel-agents",
  "executing-plans",
  "finishing-a-development-branch",
  "receiving-code-review",
  "requesting-code-review",
  "subagent-driven-development",
  "systematic-debugging",
  "test-driven-development",
  "using-git-worktrees",
  "using-superpowers",
  "verification-before-completion",
  "writing-plans",
  "writing-skills",
];
const MODIFIED_STATUSES = new Set(["lite-modified", "pi-adapted"]);

function lexicalSort(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
}

function listFiles(directory) {
  return readdirSync(directory, { withFileTypes: true })
    .flatMap((entry) => {
      const entryPath = path.join(directory, entry.name);
      return entry.isDirectory() ? listFiles(entryPath) : [entryPath];
    })
    .sort(lexicalSort);
}

function sha256(filePath) {
  return createHash("sha256").update(readFileSync(filePath)).digest("hex");
}

function frontmatterName(skillFile) {
  const content = readFileSync(skillFile, "utf8");
  const frontmatter = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);
  assert.ok(frontmatter, `${skillFile} must start with YAML frontmatter`);

  const name = frontmatter[1].match(/^name:\s*([^\s#]+)\s*$/m);
  assert.ok(name, `${skillFile} frontmatter must declare name`);
  return name[1];
}

function assertRelativeMarkdownLinksExist(markdownFile) {
  const content = readFileSync(markdownFile, "utf8");
  const links = content.matchAll(/\[[^\]]*\]\(([^)\s]+)(?:\s+[^)]*)?\)/g);

  for (const link of links) {
    const target = link[1].split("#", 1)[0];
    if (!target || target.startsWith("/") || /^[a-z][a-z0-9+.-]*:/i.test(target)) {
      continue;
    }

    const targetPath = target.startsWith("skills/")
      ? path.resolve(ROOT, target)
      : path.resolve(path.dirname(markdownFile), target);
    const relativeTarget = path.relative(SKILLS_DIR, targetPath);

    assert.ok(
      relativeTarget && !relativeTarget.startsWith(`..${path.sep}`) && relativeTarget !== "..",
      `${markdownFile} must not link outside skills/: ${target}`,
    );
    assert.ok(existsSync(targetPath), `${markdownFile} references missing file: ${target}`);
  }
}

const packageJson = JSON.parse(readFileSync(path.join(ROOT, "package.json"), "utf8"));
const manifest = JSON.parse(readFileSync(path.join(ROOT, "upstream-manifest.json"), "utf8"));
const skillDirectories = readdirSync(SKILLS_DIR, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort(lexicalSort);

assert.deepEqual(skillDirectories, EXPECTED_SKILLS, "skills/ must contain the exact expected set");

const frontmatterNames = skillDirectories.map((skillName) => {
  const skillFile = path.join(SKILLS_DIR, skillName, "SKILL.md");
  assert.ok(existsSync(skillFile), `${skillName} must contain SKILL.md`);
  const declaredName = frontmatterName(skillFile);
  assert.equal(declaredName, skillName, `${skillFile} name must match its directory`);
  return declaredName;
});
assert.equal(new Set(frontmatterNames).size, frontmatterNames.length, "skill names must be unique");

for (const skillName of skillDirectories) {
  assertRelativeMarkdownLinksExist(path.join(SKILLS_DIR, skillName, "SKILL.md"));
}

assert.ok(Array.isArray(packageJson.pi?.extensions), "package.json pi.extensions must be an array");
assert.equal(packageJson.pi.extensions.length, 1, "package.json must register exactly one extension");
assert.equal(typeof packageJson.pi.extensions[0], "string", "the extension path must be a string");
assert.ok(Array.isArray(packageJson.pi?.skills), "package.json pi.skills must be an array");
assert.equal(packageJson.pi.skills.length, 1, "package.json must register exactly one skill path");
assert.equal(typeof packageJson.pi.skills[0], "string", "the skill path must be a string");

const importedFiles = listFiles(SKILLS_DIR)
  .map((filePath) => path.relative(ROOT, filePath).split(path.sep).join("/"));
assert.ok(Array.isArray(manifest.files), "upstream-manifest.json files must be an array");
assert.ok(manifest.files.length > 0, "upstream-manifest.json must register imported files");

const manifestPaths = manifest.files.map((entry) => entry.path);
assert.deepEqual(manifestPaths, importedFiles, "every imported file must be represented in the manifest");
assert.equal(new Set(manifestPaths).size, manifestPaths.length, "manifest paths must be unique");

for (const entry of manifest.files) {
  assert.equal(typeof entry.path, "string", "manifest entries must include paths");
  assert.match(entry.upstreamHash, /^[a-f0-9]{64}$/, `${entry.path} must include a SHA-256 upstream hash`);
  assert.ok(
    entry.status === "unchanged" || MODIFIED_STATUSES.has(entry.status),
    `${entry.path} has an invalid manifest status`,
  );

  const localHash = sha256(path.join(ROOT, entry.path));
  if (entry.status === "unchanged") {
    assert.equal(localHash, entry.upstreamHash, `${entry.path} changed without manifest registration`);
  } else {
    assert.notEqual(localHash, entry.upstreamHash, `${entry.path} is marked modified but matches upstream`);
  }
}

console.log(`structure checks passed for ${importedFiles.length} imported files`);
