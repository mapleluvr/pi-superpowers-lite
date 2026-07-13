import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import {
  existsSync,
  mkdtempSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
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
const PINNED_UPSTREAM = Object.freeze({
  repository: "https://github.com/obra/superpowers",
  tag: "v6.1.1",
  commit: "d884ae04edebef577e82ff7c4e143debd0bbec99",
});
const MODIFIED_STATUSES = new Set(["lite-modified", "pi-adapted"]);
const OPERATIONAL_FILE_EXTENSIONS = "(?:md|js|mjs|cjs|sh|ts|html|dot)";
const OPERATIONAL_PATH_PATTERN = new RegExp(
  `(?:\\.{1,2}/|skills/|references/|scripts/|examples/)?[A-Za-z0-9][A-Za-z0-9_.-]*(?:/[A-Za-z0-9][A-Za-z0-9_.-]*)*\\.${OPERATIONAL_FILE_EXTENSIONS}`,
  "gi",
);

function lexicalSort(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
}

function toPortablePath(filePath) {
  return filePath.split(path.sep).join("/");
}

function listFiles(directory) {
  return readdirSync(directory, { withFileTypes: true })
    .flatMap((entry) => {
      const entryPath = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        return listFiles(entryPath);
      }
      return entry.isFile() ? [entryPath] : [];
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

function isInside(directory, targetPath) {
  const relativeTarget = path.relative(directory, targetPath);
  return relativeTarget && !relativeTarget.startsWith(`..${path.sep}`) && relativeTarget !== "..";
}

function isExplicitRelativeSkillPath(candidate) {
  return /^(?:\.{1,2}\/|skills\/|references\/|scripts\/|examples\/)/.test(candidate);
}

function isClearlyIllustrativeLine(line) {
  return /(?:\u2713|\u2717|\b(?:good|bad|avoid)\b)/i.test(line);
}

function forEachOperationalPath(text, callback) {
  for (const match of text.matchAll(OPERATIONAL_PATH_PATTERN)) {
    const candidate = match[0];
    const previousCharacter = text[match.index - 1];
    const nextCharacter = text[match.index + candidate.length];
    if (previousCharacter && /[A-Za-z0-9_@./-]/.test(previousCharacter)) {
      continue;
    }
    if (nextCharacter && /[A-Za-z0-9_./-]/.test(nextCharacter)) {
      continue;
    }
    if (candidate.includes("/path/") || candidate.startsWith("path/") || candidate.startsWith("exact/")) {
      continue;
    }
    callback(candidate, match.index);
  }
}

function resolveRelativeSkillPath({ rootDir, skillsDir, markdownFile, target }) {
  const cleanTarget = target.trim().replace(/^<|>$/g, "").split(/[?#]/, 1)[0];
  if (!cleanTarget || cleanTarget.startsWith("/") || /^[a-z][a-z0-9+.-]*:/i.test(cleanTarget)) {
    return null;
  }

  const targetPath = cleanTarget.startsWith("skills/")
    ? path.resolve(rootDir, cleanTarget)
    : path.resolve(path.dirname(markdownFile), cleanTarget);
  assert.ok(
    isInside(skillsDir, targetPath),
    `${markdownFile} must not reference outside skills/: ${target}`,
  );
  return targetPath;
}

function collectOperationalReferences({ rootDir, markdownFile }) {
  const skillsDir = path.join(rootDir, "skills");
  const references = [];
  const seen = new Set();
  const addReference = (target) => {
    const targetPath = resolveRelativeSkillPath({ rootDir, skillsDir, markdownFile, target });
    if (targetPath && !seen.has(targetPath)) {
      seen.add(targetPath);
      references.push({ target, targetPath });
    }
  };

  let fence;
  for (const line of readFileSync(markdownFile, "utf8").split(/\r?\n/)) {
    const fenceMatch = line.match(/^\s*(`{3,}|~{3,})/);
    if (fenceMatch) {
      const marker = fenceMatch[1];
      if (!fence) {
        fence = marker;
        continue;
      }
      if (marker[0] === fence[0] && marker.length >= fence.length) {
        fence = undefined;
      }
      continue;
    }
    if (fence) {
      continue;
    }

    for (const link of line.matchAll(/\[[^\]]*\]\(([^)\s]+)(?:\s+[^)]*)?\)/g)) {
      addReference(link[1]);
    }

    const withoutLinks = line.replace(/\[[^\]]*\]\([^)]+\)/g, " ");
    const codeSpans = [...withoutLinks.matchAll(/`([^`\n]+)`/g)];
    for (const codeSpan of codeSpans) {
      if (isClearlyIllustrativeLine(line)) {
        continue;
      }
      forEachOperationalPath(codeSpan[1], (candidate, index) => {
        const prefix = `${withoutLinks.slice(0, codeSpan.index)}${codeSpan[1].slice(0, index)}`;
        const isBoldReferenceListItem = /^\s*[-*]\s+\*\*`/.test(line);
        if (
          isExplicitRelativeSkillPath(candidate)
          || isBoldReferenceListItem
          || /\b(?:see|read|load|use|run)\s+(?:the\s+)?(?:detailed\s+)?(?:guide|reference|file)?\s*$/i.test(prefix)
        ) {
          addReference(candidate);
        }
      });
    }

    const prose = withoutLinks.replace(/`[^`\n]+`/g, " ");
    forEachOperationalPath(prose, (candidate, index) => {
      const prefix = prose.slice(Math.max(0, index - 80), index);
      if (/\b(?:see|read|load)\s+(?:the\s+)?(?:detailed\s+)?(?:guide|reference|file)?\s*$/i.test(prefix)) {
        addReference(candidate);
      }
    });
  }

  return references;
}

function assertOperationalRelativeReferencesExist(rootDir, entryFiles) {
  const pending = [...entryFiles];
  const scanned = new Set();

  while (pending.length > 0) {
    const markdownFile = pending.pop();
    if (scanned.has(markdownFile)) {
      continue;
    }
    scanned.add(markdownFile);

    for (const reference of collectOperationalReferences({ rootDir, markdownFile })) {
      assert.ok(
        existsSync(reference.targetPath),
        `${markdownFile} references missing file: ${reference.target}`,
      );
      if (path.extname(reference.targetPath).toLowerCase() === ".md") {
        pending.push(reference.targetPath);
      }
    }
  }
}

export function assertPackageStructure({ rootDir = ROOT, expectedSkills = EXPECTED_SKILLS } = {}) {
  const skillsDir = path.join(rootDir, "skills");
  const packageJson = JSON.parse(readFileSync(path.join(rootDir, "package.json"), "utf8"));
  const manifest = JSON.parse(readFileSync(path.join(rootDir, "upstream-manifest.json"), "utf8"));
  const skillDirectories = readdirSync(skillsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort(lexicalSort);

  assert.deepEqual(skillDirectories, expectedSkills, "skills/ must contain the exact expected set");

  const skillFiles = skillDirectories.map((skillName) => {
    const skillFile = path.join(skillsDir, skillName, "SKILL.md");
    assert.ok(existsSync(skillFile), `${skillName} must contain SKILL.md`);
    assert.equal(frontmatterName(skillFile), skillName, `${skillFile} name must match its directory`);
    return skillFile;
  });
  assert.equal(new Set(skillDirectories).size, skillDirectories.length, "skill names must be unique");
  assertOperationalRelativeReferencesExist(rootDir, skillFiles);

  assert.deepEqual(packageJson.pi?.extensions, ["./.pi/extensions/superpowers.ts"], "package.json must register the planned extension path exactly");
  assert.deepEqual(packageJson.pi?.skills, ["./skills"], "package.json must register the skills path exactly");
  assert.ok(existsSync(path.resolve(rootDir, packageJson.pi.skills[0])), "package.json skill path must exist");

  assert.equal(manifest.repository, PINNED_UPSTREAM.repository, "manifest repository must match the upstream pin");
  assert.equal(manifest.tag, PINNED_UPSTREAM.tag, "manifest tag must match the upstream pin");
  assert.equal(manifest.commit, PINNED_UPSTREAM.commit, "manifest commit must match the upstream pin");

  const importedFiles = listFiles(skillsDir)
    .map((filePath) => toPortablePath(path.relative(rootDir, filePath)));
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

    const localHash = sha256(path.join(rootDir, entry.path));
    if (entry.status === "unchanged") {
      assert.equal(localHash, entry.upstreamHash, `${entry.path} changed without manifest registration`);
    } else {
      assert.notEqual(localHash, entry.upstreamHash, `${entry.path} is marked modified but matches upstream`);
    }
  }

  return { importedFiles };
}

function writeFile(filePath, content) {
  mkdirSync(path.dirname(filePath), { recursive: true });
  writeFileSync(filePath, content);
}

function writeFixtureManifest(rootDir) {
  const skillsDir = path.join(rootDir, "skills");
  const files = listFiles(skillsDir).map((filePath) => ({
    path: toPortablePath(path.relative(rootDir, filePath)),
    upstreamHash: sha256(filePath),
    status: "unchanged",
  }));
  writeFile(
    path.join(rootDir, "upstream-manifest.json"),
    `${JSON.stringify({ ...PINNED_UPSTREAM, files }, null, 2)}\n`,
  );
}

function assertReferenceFixture() {
  const fixtureRoot = mkdtempSync(path.join(os.tmpdir(), "pi-superpowers-structure-"));
  const skillDir = path.join(fixtureRoot, "skills", "alpha");

  try {
    writeFile(
      path.join(fixtureRoot, "package.json"),
      `${JSON.stringify({
        pi: {
          extensions: ["./.pi/extensions/superpowers.ts"],
          skills: ["./skills"],
        },
      }, null, 2)}\n`,
    );
    writeFile(
      path.join(skillDir, "SKILL.md"),
      "---\nname: alpha\n---\nRead [the guide](references/guide.md).\n",
    );
    writeFile(
      path.join(skillDir, "references", "guide.md"),
      "Run `scripts/worker.js` and see notes.md before release.\n```markdown\nSee [missing.md](missing.md) and `scripts/missing.js`.\n```\n",
    );
    writeFile(path.join(skillDir, "references", "notes.md"), "Operational reference notes.\n");
    writeFile(path.join(skillDir, "references", "scripts", "worker.js"), "export default 1;\n");
    writeFixtureManifest(fixtureRoot);

    assertPackageStructure({ rootDir: fixtureRoot, expectedSkills: ["alpha"] });

    rmSync(path.join(skillDir, "references", "scripts", "worker.js"));
    writeFixtureManifest(fixtureRoot);
    assert.throws(
      () => assertPackageStructure({ rootDir: fixtureRoot, expectedSkills: ["alpha"] }),
      /references missing file: scripts\/worker\.js/,
      "a missing recursively referenced asset fails even after its manifest entry is removed",
    );
  } finally {
    rmSync(fixtureRoot, { recursive: true, force: true });
  }
}

function isMainModule() {
  return process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
}

if (isMainModule()) {
  const { importedFiles } = assertPackageStructure();
  assertReferenceFixture();
  console.log(`structure checks passed for ${importedFiles.length} imported files`);
}
