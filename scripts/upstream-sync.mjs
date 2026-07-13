import { createHash } from "node:crypto";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  renameSync,
  statSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const MANIFEST_FILE = "upstream-manifest.json";
const SKILLS_PREFIX = "skills/";
const MODIFIED_STATUSES = new Set(["lite-modified", "pi-adapted"]);

function lexicalSort(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
}

function toPortablePath(filePath) {
  return filePath.split(path.sep).join("/");
}

function listFiles(directory) {
  if (!existsSync(directory)) {
    return [];
  }

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

function listSkillPaths(rootDir) {
  const skillsDir = path.join(rootDir, "skills");
  return listFiles(skillsDir)
    .map((filePath) => toPortablePath(path.relative(rootDir, filePath)))
    .sort(lexicalSort);
}

function hashFile(filePath) {
  return createHash("sha256").update(readFileSync(filePath)).digest("hex");
}

function resolveGitDirectory(sourceDir) {
  const dotGit = path.join(sourceDir, ".git");
  if (!existsSync(dotGit)) {
    throw new Error(`Source checkout has no .git directory: ${sourceDir}`);
  }

  if (statSync(dotGit).isDirectory()) {
    return dotGit;
  }

  const pointer = readFileSync(dotGit, "utf8").trim();
  const match = pointer.match(/^gitdir:\s*(.+)$/);
  if (!match) {
    throw new Error(`Source checkout has an invalid .git pointer: ${dotGit}`);
  }

  const gitDir = path.resolve(sourceDir, match[1]);
  if (!existsSync(gitDir) || !statSync(gitDir).isDirectory()) {
    throw new Error(`Source checkout points to a missing Git directory: ${gitDir}`);
  }
  return gitDir;
}

function validCommit(value) {
  return /^[a-f0-9]{40}$/i.test(value);
}

function readGitHead(sourceDir) {
  const gitDir = resolveGitDirectory(sourceDir);
  const head = readFileSync(path.join(gitDir, "HEAD"), "utf8").trim();
  if (validCommit(head)) {
    return head.toLowerCase();
  }

  const refMatch = head.match(/^ref:\s*(.+)$/);
  if (!refMatch) {
    throw new Error(`Source checkout has an invalid Git HEAD: ${head}`);
  }

  const refName = refMatch[1];
  const refPath = path.resolve(gitDir, refName);
  const relativeRef = path.relative(gitDir, refPath);
  if (!relativeRef || relativeRef.startsWith(`..${path.sep}`) || relativeRef === "..") {
    throw new Error(`Source checkout Git HEAD references an invalid ref: ${refName}`);
  }

  if (existsSync(refPath)) {
    const commit = readFileSync(refPath, "utf8").trim();
    if (validCommit(commit)) {
      return commit.toLowerCase();
    }
  }

  const packedRefsPath = path.join(gitDir, "packed-refs");
  if (existsSync(packedRefsPath)) {
    for (const line of readFileSync(packedRefsPath, "utf8").split(/\r?\n/)) {
      const [commit, ref] = line.split(" ");
      if (ref === refName && validCommit(commit)) {
        return commit.toLowerCase();
      }
    }
  }

  throw new Error(`Source checkout cannot resolve Git HEAD ref: ${refName}`);
}

function readManifest(packageDir) {
  const manifestPath = path.join(packageDir, MANIFEST_FILE);
  if (!existsSync(manifestPath)) {
    throw new Error(`Missing ${MANIFEST_FILE}: ${manifestPath}`);
  }

  let manifest;
  try {
    manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  } catch (error) {
    throw new Error(`Invalid ${MANIFEST_FILE}: ${error.message}`);
  }

  if (!Array.isArray(manifest.files)) {
    throw new Error(`${MANIFEST_FILE} must contain a files array`);
  }
  return manifest;
}

function writeManifest(packageDir, manifest) {
  const manifestPath = path.join(packageDir, MANIFEST_FILE);
  const temporaryPath = `${manifestPath}.tmp-${process.pid}`;
  writeFileSync(temporaryPath, `${JSON.stringify(manifest, null, 2)}\n`);
  renameSync(temporaryPath, manifestPath);
}

function assertExpectedCommit(sourceDir, expectedCommit) {
  if (!validCommit(expectedCommit)) {
    throw new Error(`Expected commit must be a 40-character Git SHA: ${expectedCommit}`);
  }

  const actualCommit = readGitHead(sourceDir);
  if (actualCommit !== expectedCommit.toLowerCase()) {
    throw new Error(`Source checkout HEAD ${actualCommit} does not match expected commit ${expectedCommit}`);
  }
}

function assertSkillPath(relativePath) {
  if (typeof relativePath !== "string" || !relativePath.startsWith(SKILLS_PREFIX)) {
    throw new Error(`Manifest path must be under skills/: ${relativePath}`);
  }

  const normalized = path.posix.normalize(relativePath);
  if (normalized !== relativePath || normalized.startsWith("../") || normalized.includes("/../")) {
    throw new Error(`Manifest path must not escape skills/: ${relativePath}`);
  }
}

function absoluteSkillPath(rootDir, relativePath) {
  assertSkillPath(relativePath);
  return path.join(rootDir, ...relativePath.split("/"));
}

function summarizeDrift({ manifest, packageDir, sourceDir }) {
  const sourcePaths = listSkillPaths(sourceDir);
  const localPaths = listSkillPaths(packageDir);
  const sourcePathSet = new Set(sourcePaths);
  const localPathSet = new Set(localPaths);
  const trackedPaths = new Map();
  const summary = {
    additions: [],
    deletions: [],
    modified: [],
    statusMismatches: [],
    copied: [],
  };

  for (const entry of manifest.files) {
    if (!entry || typeof entry !== "object") {
      summary.statusMismatches.push("invalid manifest entry");
      continue;
    }

    try {
      assertSkillPath(entry.path);
    } catch (error) {
      summary.statusMismatches.push(error.message);
      continue;
    }

    if (trackedPaths.has(entry.path)) {
      summary.statusMismatches.push(`${entry.path}: duplicate manifest entry`);
      continue;
    }
    trackedPaths.set(entry.path, entry);

    if (!/^[a-f0-9]{64}$/i.test(entry.upstreamHash)) {
      summary.statusMismatches.push(`${entry.path}: invalid upstream SHA-256 hash`);
    }
  }

  for (const sourcePath of sourcePaths) {
    if (!trackedPaths.has(sourcePath)) {
      summary.additions.push(sourcePath);
    }
  }

  for (const localPath of localPaths) {
    if (!trackedPaths.has(localPath)) {
      summary.statusMismatches.push(`${localPath}: local file is not registered in the manifest`);
    }
  }

  for (const [relativePath, entry] of trackedPaths) {
    const localExists = localPathSet.has(relativePath);
    const sourceExists = sourcePathSet.has(relativePath);

    if (!sourceExists) {
      summary.deletions.push(relativePath);
    }
    if (!localExists) {
      summary.statusMismatches.push(`${relativePath}: local file is missing`);
    }
    if (!sourceExists || !localExists || !/^[a-f0-9]{64}$/i.test(entry.upstreamHash)) {
      continue;
    }

    const localHash = hashFile(absoluteSkillPath(packageDir, relativePath));
    const sourceHash = hashFile(absoluteSkillPath(sourceDir, relativePath));
    if (sourceHash !== entry.upstreamHash) {
      summary.modified.push(relativePath);
    }

    if (entry.status === "unchanged") {
      if (localHash !== entry.upstreamHash) {
        summary.statusMismatches.push(`${relativePath}: status is unchanged but local hash differs from upstream`);
      }
    } else if (MODIFIED_STATUSES.has(entry.status)) {
      if (localHash === entry.upstreamHash) {
        summary.statusMismatches.push(`${relativePath}: status is ${entry.status} but local hash matches upstream`);
      }
    } else {
      summary.statusMismatches.push(`${relativePath}: invalid manifest status ${entry.status}`);
    }
  }

  for (const key of ["additions", "deletions", "modified", "statusMismatches"]) {
    summary[key].sort(lexicalSort);
  }
  return summary;
}

function hasUnexpectedDrift(summary) {
  return summary.additions.length > 0
    || summary.deletions.length > 0
    || summary.modified.length > 0
    || summary.statusMismatches.length > 0;
}

function driftError(message, summary) {
  const error = new Error(message);
  error.summary = summary;
  return error;
}

function initialize({ manifest, packageDir, sourceDir }) {
  const localPaths = listSkillPaths(packageDir);
  const entries = [];
  const mismatches = [];

  for (const relativePath of localPaths) {
    const localPath = absoluteSkillPath(packageDir, relativePath);
    const sourcePath = absoluteSkillPath(sourceDir, relativePath);
    if (!existsSync(sourcePath)) {
      mismatches.push(`${relativePath}: missing from source checkout`);
      continue;
    }

    const localHash = hashFile(localPath);
    const sourceHash = hashFile(sourcePath);
    if (localHash !== sourceHash) {
      mismatches.push(`${relativePath}: local hash does not match source checkout`);
      continue;
    }

    entries.push({ path: relativePath, upstreamHash: sourceHash, status: "unchanged" });
  }

  if (mismatches.length > 0) {
    throw new Error(`Cannot initialize upstream manifest:\n${mismatches.join("\n")}`);
  }

  manifest.files = entries;
  writeManifest(packageDir, manifest);
  return {
    additions: [],
    deletions: [],
    modified: [],
    statusMismatches: [],
    copied: [],
    initialized: entries.length,
  };
}

function synchronize({ manifest, packageDir, sourceDir, summary }) {
  if (summary.additions.length || summary.deletions.length || summary.statusMismatches.length) {
    throw driftError("Cannot sync while additions, deletions, or manifest status mismatches are present", summary);
  }

  const trackedPaths = new Map(manifest.files.map((entry) => [entry.path, entry]));
  const protectedPaths = summary.modified.filter((relativePath) => {
    const entry = trackedPaths.get(relativePath);
    return entry.status === "lite-modified" || entry.status === "pi-adapted";
  });
  if (protectedPaths.length > 0) {
    throw driftError(
      `Refusing to overwrite modified Lite file(s): ${protectedPaths.join(", ")}`,
      summary,
    );
  }

  for (const relativePath of summary.modified) {
    const entry = trackedPaths.get(relativePath);
    const sourcePath = absoluteSkillPath(sourceDir, relativePath);
    const localPath = absoluteSkillPath(packageDir, relativePath);
    mkdirSync(path.dirname(localPath), { recursive: true });
    copyFileSync(sourcePath, localPath);

    const sourceHash = hashFile(sourcePath);
    if (hashFile(localPath) !== sourceHash) {
      throw new Error(`Copy verification failed for ${relativePath}`);
    }
    entry.upstreamHash = sourceHash;
    summary.copied.push(relativePath);
  }

  if (summary.copied.length > 0) {
    writeManifest(packageDir, manifest);
  }
  return summary;
}

export function runSync({ mode, sourceDir, packageDir, expectedCommit } = {}) {
  if (!new Set(["init", "check", "sync"]).has(mode)) {
    throw new Error(`Unsupported mode: ${mode}`);
  }
  if (!sourceDir || !packageDir) {
    throw new Error("sourceDir and packageDir are required");
  }

  const resolvedSourceDir = path.resolve(sourceDir);
  const resolvedPackageDir = path.resolve(packageDir);
  const manifest = readManifest(resolvedPackageDir);
  const commit = expectedCommit ?? manifest.commit;
  assertExpectedCommit(resolvedSourceDir, commit);

  if (mode === "init") {
    return initialize({ manifest, packageDir: resolvedPackageDir, sourceDir: resolvedSourceDir });
  }

  const summary = summarizeDrift({ manifest, packageDir: resolvedPackageDir, sourceDir: resolvedSourceDir });
  if (mode === "check") {
    if (hasUnexpectedDrift(summary)) {
      throw driftError("Unexpected upstream drift detected", summary);
    }
    return summary;
  }

  return synchronize({ manifest, packageDir: resolvedPackageDir, sourceDir: resolvedSourceDir, summary });
}

function printSummary(summary) {
  for (const [label, entries] of [
    ["additions", summary.additions],
    ["deletions", summary.deletions],
    ["modified files", summary.modified],
    ["manifest status mismatches", summary.statusMismatches],
  ]) {
    console.log(`${label}: ${entries.length}`);
    for (const entry of entries) {
      console.log(`  ${entry}`);
    }
  }
  if (summary.copied.length > 0) {
    console.log(`copied files: ${summary.copied.length}`);
    for (const entry of summary.copied) {
      console.log(`  ${entry}`);
    }
  }
}

function parseCommandLine(argv) {
  const [mode, ...options] = argv;
  if (!mode || options.length !== 2 || options[0] !== "--source" || !options[1]) {
    throw new Error("Usage: node scripts/upstream-sync.mjs <init|check|sync> --source <checkout-path>");
  }
  return { mode, sourceDir: options[1] };
}

function isMainModule() {
  return process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
}

if (isMainModule()) {
  try {
    const { mode, sourceDir } = parseCommandLine(process.argv.slice(2));
    const packageDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
    const summary = runSync({ mode, sourceDir, packageDir });
    printSummary(summary);
    console.log(mode === "init" ? `initialized ${summary.initialized} imported files` : `${mode} completed`);
  } catch (error) {
    if (error.summary) {
      printSummary(error.summary);
    }
    console.error(error.message);
    process.exitCode = 1;
  }
}
