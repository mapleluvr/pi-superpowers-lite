import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { runSync } from "../scripts/upstream-sync.mjs";

const PINNED_COMMIT = "d884ae04edebef577e82ff7c4e143debd0bbec99";

function writeFile(filePath, content) {
  mkdirSync(path.dirname(filePath), { recursive: true });
  writeFileSync(filePath, content);
}

function writeSourceHead(sourceDir, commit = PINNED_COMMIT) {
  writeFile(path.join(sourceDir, ".git", "HEAD"), "ref: refs/heads/main\n");
  writeFile(path.join(sourceDir, ".git", "refs", "heads", "main"), `${commit}\n`);
}

function writeManifest(packageDir) {
  writeFile(
    path.join(packageDir, "upstream-manifest.json"),
    `${JSON.stringify({ repository: "test", tag: "test", commit: PINNED_COMMIT, files: [] }, null, 2)}\n`,
  );
}

const temporaryRoot = mkdtempSync(path.join(os.tmpdir(), "pi-superpowers-upstream-sync-"));
const sourceDir = path.join(temporaryRoot, "source");
const packageDir = path.join(temporaryRoot, "package");

try {
  writeSourceHead(sourceDir);
  writeFile(path.join(sourceDir, "skills", "alpha", "SKILL.md"), "---\nname: alpha\n---\n");
  writeFile(path.join(sourceDir, "skills", "alpha", "guide.md"), "upstream version 1\n");
  writeFile(path.join(packageDir, "skills", "alpha", "SKILL.md"), "---\nname: alpha\n---\n");
  writeFile(path.join(packageDir, "skills", "alpha", "guide.md"), "upstream version 1\n");
  writeManifest(packageDir);

  runSync({ mode: "init", sourceDir, packageDir, expectedCommit: PINNED_COMMIT });
  let manifest = JSON.parse(readFileSync(path.join(packageDir, "upstream-manifest.json"), "utf8"));
  assert.deepEqual(
    manifest.files.map((entry) => entry.path),
    ["skills/alpha/SKILL.md", "skills/alpha/guide.md"],
    "init registers every copied file in lexical order",
  );
  assert.ok(manifest.files.every((entry) => entry.status === "unchanged"));

  writeFile(path.join(sourceDir, "skills", "alpha", "guide.md"), "upstream version 2\n");
  assert.throws(
    () => runSync({ mode: "check", sourceDir, packageDir, expectedCommit: PINNED_COMMIT }),
    /unexpected upstream drift/i,
    "check reports changed upstream files",
  );

  runSync({ mode: "sync", sourceDir, packageDir, expectedCommit: PINNED_COMMIT });
  assert.equal(readFileSync(path.join(packageDir, "skills", "alpha", "guide.md"), "utf8"), "upstream version 2\n");

  manifest = JSON.parse(readFileSync(path.join(packageDir, "upstream-manifest.json"), "utf8"));
  const guideEntry = manifest.files.find((entry) => entry.path === "skills/alpha/guide.md");
  guideEntry.status = "lite-modified";
  writeFile(path.join(packageDir, "skills", "alpha", "guide.md"), "local adaptation\n");
  writeFile(path.join(packageDir, "upstream-manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
  writeFile(path.join(sourceDir, "skills", "alpha", "guide.md"), "upstream version 3\n");

  assert.throws(
    () => runSync({ mode: "sync", sourceDir, packageDir, expectedCommit: PINNED_COMMIT }),
    /refusing to overwrite/i,
    "sync refuses to overwrite a modified Lite file after upstream drift",
  );
  assert.equal(readFileSync(path.join(packageDir, "skills", "alpha", "guide.md"), "utf8"), "local adaptation\n");

  writeSourceHead(sourceDir, "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");
  assert.throws(
    () => runSync({ mode: "check", sourceDir, packageDir, expectedCommit: PINNED_COMMIT }),
    /expected commit/i,
    "check rejects a source checkout at a different commit",
  );

  console.log("upstream sync checks passed");
} finally {
  rmSync(temporaryRoot, { recursive: true, force: true });
}
