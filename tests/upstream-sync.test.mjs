import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { runSync } from "../scripts/upstream-sync.mjs";

const PINNED_REPOSITORY = "https://github.com/obra/superpowers";
const PINNED_TAG = "v6.1.1";
const PINNED_COMMIT = "d884ae04edebef577e82ff7c4e143debd0bbec99";
const TEST_COMMIT = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
const SYNC_SCRIPT = fileURLToPath(new URL("../scripts/upstream-sync.mjs", import.meta.url));

function writeFile(filePath, content) {
  mkdirSync(path.dirname(filePath), { recursive: true });
  writeFileSync(filePath, content);
}

function writeSourceHead(sourceDir, commit = PINNED_COMMIT) {
  writeFile(path.join(sourceDir, ".git", "HEAD"), "ref: refs/heads/main\n");
  writeFile(path.join(sourceDir, ".git", "refs", "heads", "main"), `${commit}\n`);
}

function writeManifest(packageDir, metadata = {}) {
  writeFile(
    path.join(packageDir, "upstream-manifest.json"),
    `${JSON.stringify({
      repository: PINNED_REPOSITORY,
      tag: PINNED_TAG,
      commit: PINNED_COMMIT,
      files: [],
      ...metadata,
    }, null, 2)}\n`,
  );
}

function readManifest(packageDir) {
  return JSON.parse(readFileSync(path.join(packageDir, "upstream-manifest.json"), "utf8"));
}

function writeFixture(sourceDir, packageDir, commit = PINNED_COMMIT) {
  writeSourceHead(sourceDir, commit);
  writeFile(path.join(sourceDir, "skills", "alpha", "SKILL.md"), "---\nname: alpha\n---\n");
  writeFile(path.join(sourceDir, "skills", "alpha", "guide.md"), "upstream version 1\n");
  writeFile(path.join(packageDir, "skills", "alpha", "SKILL.md"), "---\nname: alpha\n---\n");
  writeFile(path.join(packageDir, "skills", "alpha", "guide.md"), "upstream version 1\n");
  writeManifest(packageDir, { commit });
}

const temporaryRoot = mkdtempSync(path.join(os.tmpdir(), "pi-superpowers-upstream-sync-"));
const sourceDir = path.join(temporaryRoot, "source");
const packageDir = path.join(temporaryRoot, "package");

try {
  writeFixture(sourceDir, packageDir);

  runSync({ mode: "init", sourceDir, packageDir });
  let manifest = readManifest(packageDir);
  assert.deepEqual(
    manifest.files.map((entry) => entry.path),
    ["skills/alpha/SKILL.md", "skills/alpha/guide.md"],
    "init registers every copied file in lexical order",
  );
  assert.ok(manifest.files.every((entry) => entry.status === "unchanged"));

  for (const [field, invalidValue] of [
    ["repository", "https://example.invalid/not-superpowers"],
    ["tag", "v0.0.0"],
    ["commit", TEST_COMMIT],
  ]) {
    const mismatchedManifest = { ...manifest, [field]: invalidValue };
    writeFile(path.join(packageDir, "upstream-manifest.json"), `${JSON.stringify(mismatchedManifest, null, 2)}\n`);
    assert.throws(
      () => runSync({ mode: "check", sourceDir, packageDir }),
      /manifest metadata/i,
      `check rejects manifest ${field} disagreement with the immutable upstream pin`,
    );
  }
  writeFile(path.join(packageDir, "upstream-manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);

  writeFile(path.join(sourceDir, "skills", "alpha", "guide.md"), "upstream version 2\n");
  assert.throws(
    () => runSync({ mode: "check", sourceDir, packageDir }),
    /unexpected upstream drift/i,
    "check reports changed upstream files",
  );

  runSync({ mode: "sync", sourceDir, packageDir });
  assert.equal(readFileSync(path.join(packageDir, "skills", "alpha", "guide.md"), "utf8"), "upstream version 2\n");

  manifest = readManifest(packageDir);
  const guideEntry = manifest.files.find((entry) => entry.path === "skills/alpha/guide.md");
  guideEntry.status = "lite-modified";
  writeFile(path.join(packageDir, "skills", "alpha", "guide.md"), "local adaptation\n");
  writeFile(path.join(packageDir, "upstream-manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
  writeFile(path.join(sourceDir, "skills", "alpha", "guide.md"), "upstream version 3\n");

  assert.throws(
    () => runSync({ mode: "sync", sourceDir, packageDir }),
    /refusing to overwrite/i,
    "sync refuses to overwrite a modified Lite file after upstream drift",
  );
  assert.equal(readFileSync(path.join(packageDir, "skills", "alpha", "guide.md"), "utf8"), "local adaptation\n");

  writeSourceHead(sourceDir, TEST_COMMIT);
  assert.throws(
    () => runSync({ mode: "check", sourceDir, packageDir }),
    /expected commit/i,
    "the default production pin rejects a source checkout at a different commit",
  );

  const injectedSourceDir = path.join(temporaryRoot, "injected-source");
  const injectedPackageDir = path.join(temporaryRoot, "injected-package");
  writeFixture(injectedSourceDir, injectedPackageDir, TEST_COMMIT);
  runSync({
    mode: "init",
    sourceDir: injectedSourceDir,
    packageDir: injectedPackageDir,
    expectedCommit: TEST_COMMIT,
  });
  assert.equal(
    readManifest(injectedPackageDir).commit,
    TEST_COMMIT,
    "the exported API preserves commit injection for isolated test fixtures",
  );

  const cliOverride = spawnSync(
    process.execPath,
    [SYNC_SCRIPT, "check", "--source", injectedSourceDir, "--expected-commit", TEST_COMMIT],
    { encoding: "utf8" },
  );
  assert.equal(cliOverride.status, 1, "the production CLI rejects an attempted commit override");
  assert.match(cliOverride.stderr, /Usage:/, "the CLI accepts only an explicit source checkout");

  console.log("upstream sync checks passed");
} finally {
  rmSync(temporaryRoot, { recursive: true, force: true });
}
