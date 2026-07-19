import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtempSync, readFileSync, realpathSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const TARGETS = ["baseline", "lite"];
const REPETITIONS = [1, 2, 3, 4, 5];
const EPOCH = 3;
const PROVIDER = "Mapleluv";
const MODEL = "claude-sonnet-4-6";
const THINKING = "high";
const ISOLATION_FLAGS = [
  "--no-extensions",
  "--no-skills",
  "--no-tools",
  "--no-context-files",
  "--no-session",
  "--mode",
  "json",
];
const SHA1_PATTERN = /^[a-f0-9]{40}$/u;
const SHA256_PATTERN = /^[a-f0-9]{64}$/u;
const EMPTY_PATCH_SHA256 = createHash("sha256").update("").digest("hex");
const QUARANTINED_PATH_PATTERN = /(?:^|[\\/])[^\\/]*(?:epoch-[12]|availability-smoke|smoke)[^\\/]*(?:[\\/]|$)/iu;
const PACKAGE_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PROFILE_KEYS = new Set([
  "brainstorming",
  "writing-plans",
  "subagent-driven-development",
  "dispatching-parallel-agents",
  "executing-plans",
  "using-git-worktrees",
  "verification-before-completion",
  "finishing-a-development-branch",
]);
const ASSERTIONS = new Set([
  "no-pre-finalization-l3",
  "disjoint-same-wave-ownership",
  "satisfied-dependencies",
  "reviewed-contract-before-fanout",
  "native-patch-handoff",
  "failed-wave-zero-integration",
  "scoped-intermediate-claims",
  "focused-command-resolution",
  "finalization-conjunction",
  "passing-l3-before-completion",
  "same-state-no-duplicate-l3",
  "material-cause-before-later-l3",
  "live-effect-ordering",
  "l0-frontier-before-work",
  "graphless-single-chain-inline",
  "post-apply-failure-restores-wave-base",
  "setup-is-plan-declared-and-non-build-capable",
]);
const EVENT_TYPES = new Set([
  "l0",
  "fanout",
  "l1",
  "l2",
  "finalization-start",
  "l3",
  "material-cause",
  "approval",
  "completion",
  "live-effect",
  "post-effect-smoke",
  "finishing",
]);
const SCOPED_CLAIMS = new Set(["task-local checks passed", "affected closure passed"]);
const FOCUSED_ACTIONS = new Set(["redesign", "focused-harness", "defer-final-integration"]);

function addError(errors, message) {
  errors.push(message);
}

function array(value) {
  return Array.isArray(value) ? value : [];
}

function sameMembers(actual, expected) {
  return actual.length === expected.length && actual.every((value, index) => value === expected[index]);
}

function fixtureProfiles(fixture) {
  return new Map(array(fixture?.profiles).map((profile) => [profile?.name, profile]));
}

function validateFixtureContract(fixtures, errors) {
  const fixtureMap = new Map();
  for (const fixture of fixtures) {
    if (!fixture || typeof fixture.id !== "string" || fixture.id.length === 0) {
      addError(errors, "every fixture must have a non-empty string id");
      continue;
    }
    if (fixtureMap.has(fixture.id)) addError(errors, `duplicate fixture id: ${fixture.id}`);
    fixtureMap.set(fixture.id, fixture);
    if (typeof fixture.prompt !== "string" || fixture.prompt.length === 0) {
      addError(errors, `${fixture.id} prompt must be a non-empty string`);
    }
    if (!Array.isArray(fixture.profiles) || fixture.profiles.length === 0) {
      addError(errors, `${fixture.id} profiles must be a non-empty array`);
      continue;
    }
    const seenProfiles = new Set();
    for (const profile of fixture.profiles) {
      if (!PROFILE_KEYS.has(profile?.name)) {
        addError(errors, `${fixture.id} has unknown profile: ${profile?.name}`);
        continue;
      }
      if (seenProfiles.has(profile.name)) addError(errors, `${fixture.id} has duplicate profile: ${profile.name}`);
      seenProfiles.add(profile.name);
      if (!Array.isArray(profile.assertions) || profile.assertions.length === 0) {
        addError(errors, `${fixture.id}/${profile.name} assertions must be a non-empty array`);
        continue;
      }
      const seenAssertions = new Set();
      for (const assertion of profile.assertions) {
        if (!ASSERTIONS.has(assertion)) addError(errors, `${fixture.id}/${profile.name} has unknown assertion: ${assertion}`);
        if (seenAssertions.has(assertion)) addError(errors, `${fixture.id}/${profile.name} has duplicate assertion: ${assertion}`);
        seenAssertions.add(assertion);
      }
    }
  }
  return fixtureMap;
}

function resolveSelection({ fixtureMap, targets, caseIds, profiles }, errors) {
  const selectedTargets = array(targets);
  const selectedCases = array(caseIds);
  const selectedProfiles = array(profiles);
  const noFilters = selectedTargets.length === 0 && selectedCases.length === 0 && selectedProfiles.length === 0;
  const baselineOnly = sameMembers(selectedTargets, ["baseline"]) && selectedCases.length === 0 && selectedProfiles.length === 0;

  if (noFilters) {
    return { targets: TARGETS, caseIds: [...fixtureMap.keys()], profile: null, mode: "full" };
  }
  if (baselineOnly) {
    return { targets: ["baseline"], caseIds: [...fixtureMap.keys()], profile: null, mode: "baseline" };
  }

  if (selectedTargets.length === 1 && selectedTargets[0] === "lite" && selectedCases.length === 0 && selectedProfiles.length === 0) {
    addError(errors, "target-only lite is invalid; provide one or more cases and exactly one profile");
    return null;
  }
  if (selectedCases.length > 0 && (selectedTargets.length !== 1 || selectedProfiles.length !== 1)) {
    addError(errors, "cases require exactly one target and one profile");
  }
  if (selectedProfiles.length > 0 && (selectedTargets.length !== 1 || selectedCases.length === 0)) {
    addError(errors, "profile requires exactly one target and at least one case");
  }
  if (selectedTargets.length !== 1) addError(errors, "narrow mode requires exactly one target");
  if (selectedProfiles.length !== 1) addError(errors, "narrow mode requires exactly one profile");
  if (selectedCases.length === 0) addError(errors, "narrow mode requires at least one case");
  if (errors.length > 0) return null;

  if (!TARGETS.includes(selectedTargets[0])) addError(errors, `unknown target: ${selectedTargets[0]}`);
  if (!PROFILE_KEYS.has(selectedProfiles[0])) addError(errors, `unknown profile: ${selectedProfiles[0]}`);
  for (const caseId of selectedCases) {
    const fixture = fixtureMap.get(caseId);
    if (!fixture) addError(errors, `unknown case: ${caseId}`);
    else if (!fixtureProfiles(fixture).has(selectedProfiles[0])) {
      addError(errors, `${caseId} does not declare profile ${selectedProfiles[0]}`);
    }
  }
  if (new Set(selectedCases).size !== selectedCases.length) addError(errors, "narrow mode contains duplicate cases");
  if (errors.length > 0) return null;
  return { targets: selectedTargets, caseIds: selectedCases, profile: selectedProfiles[0], mode: "narrow" };
}

function parseOwnedPath(value) {
  if (
    typeof value !== "string" ||
    value.length === 0 ||
    value !== value.trim() ||
    value.includes("\\") ||
    value.startsWith("/") ||
    /^[A-Za-z]:/u.test(value) ||
    value.includes("//")
  ) {
    return null;
  }
  const bounded = value.endsWith("/**");
  const rawPath = bounded ? value.slice(0, -3) : value;
  if (
    rawPath.length === 0 ||
    rawPath.endsWith("/") ||
    rawPath.split("/").some((segment) => segment === "." || segment === ".." || segment.length === 0) ||
    /[*?\[\]]/u.test(rawPath)
  ) {
    return null;
  }
  return { bounded, path: rawPath };
}

function ownedPathsIntersect(left, right) {
  if (!left.bounded && !right.bounded) return left.path === right.path;
  if (left.bounded && right.bounded) {
    return left.path === right.path || left.path.startsWith(`${right.path}/`) || right.path.startsWith(`${left.path}/`);
  }
  const bounded = left.bounded ? left : right;
  const exact = left.bounded ? right : left;
  return exact.path === bounded.path || exact.path.startsWith(`${bounded.path}/`);
}

function disjointOwnership(profileResult) {
  const waves = array(profileResult?.waves);
  if (waves.length === 0) return false;
  for (const wave of waves) {
    const tasks = array(wave?.tasks);
    if (tasks.length === 0) return false;
    const priorTasks = [];
    for (const task of tasks) {
      const ownedPaths = array(task?.owns).map(parseOwnedPath);
      if (ownedPaths.length === 0 || ownedPaths.some((ownedPath) => !ownedPath)) return false;
      if (ownedPaths.some((ownedPath, index) => ownedPaths.slice(0, index).some((prior) => ownedPathsIntersect(ownedPath, prior)))) {
        return false;
      }
      for (const priorOwnedPaths of priorTasks) {
        if (ownedPaths.some((ownedPath) => priorOwnedPaths.some((prior) => ownedPathsIntersect(ownedPath, prior)))) {
          return false;
        }
      }
      priorTasks.push(ownedPaths);
    }
  }
  return true;
}

function disjointMutableResources(profileResult) {
  const waves = array(profileResult?.waves);
  if (waves.length === 0) return false;
  for (const wave of waves) {
    const seen = new Set();
    for (const task of array(wave?.tasks)) {
      if (!Array.isArray(task?.mutableResources)) return false;
      const taskResources = new Set();
      for (const resource of task.mutableResources) {
        if (typeof resource !== "string" || resource.length === 0 || resource !== resource.trim()) return false;
        if (taskResources.has(resource) || seen.has(resource)) return false;
        taskResources.add(resource);
      }
      for (const resource of taskResources) seen.add(resource);
    }
  }
  return true;
}

function stateFingerprintValid(state) {
  return (
    state &&
    typeof state === "object" &&
    !Array.isArray(state) &&
    SHA1_PATTERN.test(state.head ?? "") &&
    SHA1_PATTERN.test(state.tree ?? "") &&
    SHA256_PATTERN.test(state.commandSetSha256 ?? "") &&
    SHA256_PATTERN.test(state.environmentFingerprintSha256 ?? "") &&
    state.clean === true
  );
}

function sameStateFingerprint(left, right) {
  return (
    stateFingerprintValid(left) &&
    stateFingerprintValid(right) &&
    left.head === right.head &&
    left.tree === right.tree &&
    left.commandSetSha256 === right.commandSetSha256 &&
    left.environmentFingerprintSha256 === right.environmentFingerprintSha256 &&
    left.clean === right.clean
  );
}

function orderedEvents(profileResult) {
  const events = array(profileResult?.events);
  const byId = new Map();
  let previousSequence = 0;
  let valid = events.length > 0;
  for (const event of events) {
    if (
      !event ||
      typeof event !== "object" ||
      Array.isArray(event) ||
      typeof event.id !== "string" ||
      event.id.length === 0 ||
      byId.has(event.id) ||
      !EVENT_TYPES.has(event.type) ||
      !Number.isInteger(event.sequence) ||
      event.sequence <= previousSequence
    ) {
      valid = false;
      continue;
    }
    if ((event.type === "l3" || event.type === "finishing") && !stateFingerprintValid(event.state)) valid = false;
    previousSequence = event.sequence;
    byId.set(event.id, event);
  }
  return { valid, events, byId };
}

function dependenciesSatisfied(profileResult) {
  const waves = array(profileResult?.waves);
  if (waves.length === 0) return false;
  const earlierTasks = new Set();
  const completedTasks = new Set(array(profileResult?.completedTaskIds));
  for (const wave of waves) {
    const waveTasks = array(wave?.tasks);
    const waveIds = new Set(waveTasks.map((task) => task?.id));
    for (const task of waveTasks) {
      if (typeof task?.id !== "string") return false;
      for (const dependency of array(task.dependsOn)) {
        if (waveIds.has(dependency) || !earlierTasks.has(dependency) || !completedTasks.has(dependency)) return false;
      }
    }
    for (const taskId of waveIds) earlierTasks.add(taskId);
  }
  return true;
}

function assertionFailures(assertions, profileResult) {
  const failures = [];
  const timeline = orderedEvents(profileResult);
  const eventsOfType = (type) => timeline.events.filter((event) => event?.type === type);
  const l3Events = eventsOfType("l3");
  const finalizationStarts = eventsOfType("finalization-start");
  const finalization = profileResult?.finalization;

  if (!timeline.valid) failures.push("ordered execution event model is invalid");

  for (const assertion of assertions) {
    if (assertion === "no-pre-finalization-l3") {
      const finalizationStart = finalizationStarts[0];
      if (
        profileResult?.fullSuiteCallsBeforeFinalization !== 0 ||
        l3Events.some((event) => !finalizationStart || event.sequence <= finalizationStart.sequence)
      ) {
        failures.push("repository-wide L3 occurred before finalization");
      }
    }
    if (assertion === "disjoint-same-wave-ownership") {
      if (!disjointOwnership(profileResult)) failures.push("same-wave ownership is not present and disjoint");
      if (!disjointMutableResources(profileResult)) failures.push("same-wave mutable resource ownership is not isolated");
    }
    if (assertion === "satisfied-dependencies" && !dependenciesSatisfied(profileResult)) {
      failures.push("same-wave dependencies are present or dependencies are unsatisfied");
    }
    if (assertion === "reviewed-contract-before-fanout") {
      const contract = profileResult?.sharedContract;
      if (contract?.stable !== true || contract?.reviewed !== true || contract?.pinned !== true || contract?.fanoutStarted !== true) {
        failures.push("shared contract was not stable, reviewed, and pinned before fanout");
      }
    }
    if (assertion === "native-patch-handoff" && profileResult?.handoffKind !== "patch") {
      failures.push("native isolated writer did not use a patch handoff");
    }
    if (assertion === "failed-wave-zero-integration" && profileResult?.failedWaveIntegrationCount !== 0) {
      failures.push("failed wave integrated one or more changes");
    }
    if (assertion === "post-apply-failure-restores-wave-base") {
      const recovery = profileResult?.recovery;
      if (
        recovery?.currentPatchReversed !== true ||
        recovery?.priorWaveCommitsReverted !== true ||
        recovery?.originalTreeRestored !== true ||
        recovery?.historyRewritten !== false
      ) {
        failures.push("post-apply failure did not restore the wave base without rewriting history");
      }
    }
    if (assertion === "scoped-intermediate-claims") {
      const claims = array(profileResult?.intermediateClaims);
      if (claims.length === 0 || claims.some((claim) => !SCOPED_CLAIMS.has(claim))) {
        failures.push("scoped intermediate claims were not limited to task-local or affected closure");
      }
    }
    if (assertion === "focused-command-resolution" && !FOCUSED_ACTIONS.has(profileResult?.missingFocusedCommandAction)) {
      failures.push("missing focused command did not trigger redesign, a focused harness, or final-integration deferral");
    }
    if (assertion === "setup-is-plan-declared-and-non-build-capable") {
      if (!["plan-declared-dependency-only", "skip", "defer"].includes(profileResult?.setupAction)) {
        failures.push("setup was not plan-declared dependency-only, skipped, or deferred");
      }
    }
    if (assertion === "l0-frontier-before-work") {
      const validFrontiers = array(profileResult?.waves).length > 0 && array(profileResult.waves).every((wave) => {
        const l0 = eventsOfType("l0").filter((event) => event?.waveId === wave?.id);
        const fanout = eventsOfType("fanout").filter((event) => event?.waveId === wave?.id);
        const taskL1 = array(wave?.tasks).map((task) =>
          eventsOfType("l1").find((event) => event?.waveId === wave?.id && event?.taskId === task?.id),
        );
        return (
          l0.length === 1 &&
          l0[0].passed === true &&
          fanout.length <= 1 &&
          (fanout.length === 0 || l0[0].sequence < fanout[0].sequence) &&
          taskL1.every((event) => event?.passed === true && l0[0].sequence < event.sequence)
        );
      });
      if (!validFrontiers) failures.push("L0 frontier did not pass before fanout and L1");
    }
    if (assertion === "graphless-single-chain-inline") {
      const serialTasks = array(profileResult?.serialTasks);
      const validSerial =
        profileResult?.executionShape === "single-chain-inline" &&
        array(profileResult?.waves).length === 0 &&
        serialTasks.length > 0 &&
        eventsOfType("fanout").length === 0 &&
        serialTasks.every((task) => {
          const l0 = eventsOfType("l0").find((event) => event?.frontierId === task?.id);
          const l1 = eventsOfType("l1").find((event) => event?.taskId === task?.id);
          return l0?.passed === true && l1?.passed === true && l0.sequence < l1.sequence;
        });
      if (!validSerial) failures.push("single dependency chain did not remain graphless and inline");
    }
    if (assertion === "finalization-conjunction") {
      if (
        finalization?.began !== true ||
        finalization?.allWavesIntegrated !== true ||
        finalization?.l2Passed !== true ||
        finalization?.noImplementationTasks !== true ||
        finalization?.noBlockingReviewFindings !== true ||
        finalization?.completed !== true ||
        finalizationStarts.length !== 1
      ) {
        failures.push("finalization preconditions were incomplete");
      }
    }
    if (assertion === "passing-l3-before-completion") {
      const completions = eventsOfType("completion");
      const validCompletion = completions.length > 0 && completions.every((completion) => {
        const l3 = timeline.byId.get(completion?.l3EventId);
        const finalizationStart = finalizationStarts[0];
        return (
          l3?.type === "l3" &&
          l3.passed === true &&
          finalizationStart &&
          finalizationStart.sequence < l3.sequence &&
          l3.sequence < completion.sequence
        );
      });
      if (!validCompletion) failures.push("final completion did not follow a passing finalization L3");
    }
    if (assertion === "same-state-no-duplicate-l3") {
      const finishing = eventsOfType("finishing");
      const reused = finishing.length === 1 ? timeline.byId.get(finishing[0].reusedL3EventId) : null;
      const interveningCause = reused
        ? eventsOfType("material-cause").some((event) => reused.sequence < event.sequence && event.sequence < finishing[0].sequence)
        : true;
      if (
        finishing.length !== 1 ||
        l3Events.length !== 1 ||
        reused?.type !== "l3" ||
        reused.passed !== true ||
        reused.sequence >= finishing[0].sequence ||
        !sameStateFingerprint(reused.state, finishing[0].state) ||
        interveningCause
      ) {
        failures.push("same-state finishing did not reuse one passing L3 with an exact state fingerprint");
      }
    }
    if (assertion === "material-cause-before-later-l3") {
      const validLaterRuns = l3Events.length >= 2 && l3Events.slice(1).every((later) => {
        const cause = timeline.byId.get(later?.materialCauseEventId);
        const previous = timeline.byId.get(cause?.invalidatesL3EventId);
        return (
          cause?.type === "material-cause" &&
          previous?.type === "l3" &&
          previous.passed === true &&
          previous.sequence < cause.sequence &&
          cause.sequence < later.sequence
        );
      });
      if (!validLaterRuns) failures.push("later L3 did not reference an intervening material cause");
    }
    if (assertion === "live-effect-ordering") {
      const effects = eventsOfType("live-effect");
      const validEffects = effects.length > 0 && effects.every((effect) => {
        const l3 = timeline.byId.get(effect?.l3EventId);
        const approval = timeline.byId.get(effect?.approvalEventId);
        const smoke = eventsOfType("post-effect-smoke").find((event) => event?.effectEventId === effect.id);
        return (
          l3?.type === "l3" &&
          l3.passed === true &&
          approval?.type === "approval" &&
          approval.approved === true &&
          approval.l3EventId === l3.id &&
          l3.sequence < approval.sequence &&
          approval.sequence < effect.sequence &&
          smoke?.passed === true &&
          effect.sequence < smoke.sequence
        );
      });
      if (!validEffects) {
        const missingSmoke = effects.some((effect) => !eventsOfType("post-effect-smoke").some((event) => event?.effectEventId === effect?.id));
        failures.push(missingSmoke ? "live effect lacked passing post-effect smoke evidence" : "live effect occurred before passing L3 and final approval");
      }
    }
  }
  return failures;
}

function validateProfileResult({ fixture, target, repetition, profile, profileResult, errors }) {
  const prefix = `${fixture.id}/${target}/${repetition}/${profile.name}`;
  if (!profileResult || typeof profileResult !== "object" || Array.isArray(profileResult)) {
    addError(errors, `${prefix} profile result must be an object`);
    return;
  }
  if (typeof profileResult.pass !== "boolean") {
    addError(errors, `${prefix} pass must be boolean`);
    return;
  }
  if (!orderedEvents(profileResult).valid) {
    addError(errors, `${prefix} events must be a non-empty, uniquely identified, strictly ordered supported event sequence with valid L3/finishing state fingerprints`);
  }
  const failures = assertionFailures(profile.assertions, profileResult);
  const observedPass = failures.length === 0;
  if (profileResult.pass !== observedPass) {
    addError(errors, `${prefix} pass does not match observed assertion conjunction`);
  }
  if (target === "lite") {
    for (const failure of failures) addError(errors, `${prefix}: ${failure}`);
    if (profileResult.pass !== true) addError(errors, `${prefix} requested Lite profile must have pass: true`);
  }
}

export function parsePiJsonlResponse(rawResponse) {
  const errors = [];
  const source = Buffer.isBuffer(rawResponse) ? rawResponse.toString("utf8") : rawResponse;
  if (typeof source !== "string") {
    return { valid: false, errors: ["raw response must be a string or Buffer"], events: [], text: "" };
  }

  const events = [];
  for (const [index, line] of source.split(/\r?\n/u).entries()) {
    if (line.trim().length === 0) continue;
    let event;
    try {
      event = JSON.parse(line);
    } catch {
      addError(errors, `line ${index + 1} must be valid JSON`);
      continue;
    }
    if (!event || typeof event !== "object" || Array.isArray(event)) {
      addError(errors, `line ${index + 1} must contain a JSON object`);
      continue;
    }
    events.push(event);
  }

  if (errors.length > 0) return { valid: false, errors, events, text: "" };
  if (events.length === 0 || events.at(-1)?.type !== "agent_settled") {
    addError(errors, "final agent_settled event is required");
    return { valid: false, errors, events, text: "" };
  }

  const finalEndIndex = events.length - 2;
  const finalEnd = events[finalEndIndex];
  if (finalEnd?.type !== "agent_end") {
    addError(errors, "final agent_settled must immediately follow the final agent_end");
    return { valid: false, errors, events, text: "" };
  }
  let finalStartIndex = -1;
  for (let index = finalEndIndex - 1; index >= 0; index -= 1) {
    if (events[index]?.type === "agent_start") {
      finalStartIndex = index;
      break;
    }
  }
  if (finalStartIndex < 0) {
    addError(errors, "final agent_end has no matching final agent_start");
    return { valid: false, errors, events, text: "" };
  }
  for (let index = finalStartIndex - 1; index >= 0; index -= 1) {
    if (events[index]?.type === "agent_end") break;
    if (events[index]?.type === "agent_start") {
      addError(errors, "final lifecycle contains an unmatched agent_start");
      break;
    }
  }
  if (finalEnd.willRetry !== false) addError(errors, "final agent_end willRetry must be false");

  const lifecycleEvents = events.slice(finalStartIndex + 1, finalEndIndex);
  const terminalMessage = [...lifecycleEvents].reverse().find((event) => event?.type === "message_end");
  if (!terminalMessage) {
    addError(errors, "final lifecycle must contain an assistant message_end");
    return { valid: false, errors, events, text: "" };
  }
  const message = terminalMessage.message;
  if (message?.role !== "assistant") addError(errors, "terminal message_end must be an assistant message");
  if (message?.stopReason !== "stop") addError(errors, "terminal assistant message_end stopReason must be stop");
  if (terminalMessage.error != null || message?.error != null) {
    addError(errors, "terminal assistant message_end must be error-free");
  }
  const content = array(message?.content);
  if (
    content.some((block) => typeof block?.type === "string" && /^tool(?:_|-)?(?:call|result|use)/iu.test(block.type)) ||
    array(message?.toolCalls).length > 0
  ) {
    addError(errors, "terminal assistant message_end must be tool-free");
  }
  const text = content
    .filter((block) => block?.type === "text" && typeof block.text === "string")
    .map((block) => block.text)
    .join("");
  if (text.trim().length === 0) addError(errors, "terminal assistant message_end must contain nonempty concatenated text");

  return { valid: errors.length === 0, errors, events, text };
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function resolveEvidencePath(filePath, reportRoot) {
  return path.resolve(reportRoot, filePath);
}

function validateEvidencePath(filePath, label, reportRoot, errors) {
  if (typeof filePath !== "string" || filePath.length === 0) {
    addError(errors, `${label} path is required`);
    return null;
  }
  if (QUARANTINED_PATH_PATTERN.test(filePath)) {
    addError(errors, `${label} path references quarantined epoch-1, epoch-2, smoke, or availability-smoke evidence: ${filePath}`);
    return null;
  }
  return resolveEvidencePath(filePath, reportRoot);
}

function validateFileHash(filePath, expectedHash, label, reportRoot, errors) {
  const resolvedPath = validateEvidencePath(filePath, label, reportRoot, errors);
  if (!resolvedPath) return;
  if (!SHA256_PATTERN.test(expectedHash ?? "")) {
    addError(errors, `${label} SHA-256 is required`);
    return;
  }
  let actualHash;
  try {
    actualHash = sha256(readFileSync(resolvedPath));
  } catch (error) {
    addError(errors, `${label} file cannot be read: ${resolvedPath}: ${error.message}`);
    return;
  }
  if (actualHash !== expectedHash) addError(errors, `${label} hash does not match file bytes`);
}

function validateFixedEvidence(evidence, label, errors) {
  if (!evidence || typeof evidence !== "object" || Array.isArray(evidence)) {
    addError(errors, `${label} is required`);
    return;
  }
  if (evidence.epoch !== EPOCH) addError(errors, `${label} epoch must be exactly 3`);
  if (evidence.provider !== PROVIDER) addError(errors, `${label} provider must be exactly Mapleluv`);
  if (evidence.model !== MODEL) addError(errors, `${label} model must be exactly claude-sonnet-4-6`);
  if (evidence.thinking !== THINKING) addError(errors, `${label} thinking must be exactly high`);
  if (!sameMembers(array(evidence.isolationFlags), ISOLATION_FLAGS)) {
    addError(errors, `${label} isolation flags must match the exact ordered epoch-3 list`);
  }
  if (!SHA256_PATTERN.test(evidence.fixtureSha256 ?? "")) addError(errors, `${label} fixture hash is required`);
  if (!SHA256_PATTERN.test(evidence.evaluatorPromptSha256 ?? "")) addError(errors, `${label} evaluator prompt hash is required`);
}

function canonicalExistingPath(filePath) {
  return typeof realpathSync.native === "function" ? realpathSync.native(filePath) : realpathSync(filePath);
}

function gitOutput(repositoryPath, args, extraEnvironment = {}) {
  return execFileSync("git", args, {
    cwd: repositoryPath,
    encoding: "utf8",
    env: { ...process.env, ...extraEnvironment },
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}

function validateSourceRepository(evidence, reportRoot, errors) {
  const resolved = validateEvidencePath(evidence?.sourceRepositoryPath, "source repository", reportRoot, errors);
  if (!resolved) return null;
  let repositoryPath;
  let packagePath;
  try {
    repositoryPath = canonicalExistingPath(resolved);
    packagePath = canonicalExistingPath(PACKAGE_ROOT);
  } catch (error) {
    addError(errors, `source repository cannot be resolved: ${error.message}`);
    return null;
  }
  if (repositoryPath !== packagePath) {
    addError(errors, "source repository must resolve to the current package repository");
    return null;
  }
  try {
    const topLevel = canonicalExistingPath(gitOutput(repositoryPath, ["rev-parse", "--show-toplevel"]));
    if (topLevel !== repositoryPath) addError(errors, "source repository path must be the Git top level");
  } catch (error) {
    addError(errors, `source repository Git identity cannot be resolved: ${error.message}`);
    return null;
  }
  return repositoryPath;
}

function resolveCommitTree(repositoryPath, commitSha, label, errors) {
  try {
    const resolvedCommit = gitOutput(repositoryPath, ["rev-parse", "--verify", `${commitSha}^{commit}`]);
    if (resolvedCommit !== commitSha) addError(errors, `${label} commit did not resolve exactly`);
    return gitOutput(repositoryPath, ["rev-parse", "--verify", `${commitSha}^{tree}`]);
  } catch (error) {
    addError(errors, `${label} commit cannot resolve in source repository: ${error.message}`);
    return null;
  }
}

function validateGitProvenance(identity, repositoryPath, reportRoot, errors) {
  const display = `${identity.target}/${identity.profile}`;
  const sourceTree = resolveCommitTree(repositoryPath, identity.sourceBaseSha, `${display} source base`, errors);
  if (sourceTree && sourceTree !== identity.sourceBaseTree) {
    addError(errors, `${display} source base tree does not match the resolved commit tree`);
  }
  const candidateTree = resolveCommitTree(repositoryPath, identity.candidateInputSha, `${display} candidate input`, errors);
  if (candidateTree && candidateTree !== identity.candidateInputTree) {
    addError(errors, `${display} candidate input tree does not match the resolved commit tree`);
  }
  if (identity.target === "baseline" || !sourceTree || !candidateTree) return;

  const patchPath = validateEvidencePath(identity.patchPath, `${display} patch`, reportRoot, errors);
  if (!patchPath) return;
  const temporaryDirectory = mkdtempSync(path.join(os.tmpdir(), "pi-superpowers-eval-index-"));
  const indexPath = path.join(temporaryDirectory, "index");
  try {
    const environment = { GIT_INDEX_FILE: indexPath };
    gitOutput(repositoryPath, ["read-tree", identity.sourceBaseTree], environment);
    gitOutput(repositoryPath, ["apply", "--cached", "--binary", "--whitespace=nowarn", patchPath], environment);
    const reconstructedTree = gitOutput(repositoryPath, ["write-tree"], environment);
    if (reconstructedTree !== identity.candidateInputTree) {
      addError(errors, `${display} patch reconstructed tree does not match the claimed candidate tree`);
    }
  } catch (error) {
    addError(errors, `${display} patch cannot reconstruct the claimed candidate tree: ${error.message}`);
  } finally {
    rmSync(temporaryDirectory, { recursive: true, force: true });
  }
}

function validateGlobalEvidence(evidence, reportRoot, errors) {
  validateFixedEvidence(evidence, "report evidence", errors);
  if (!evidence || typeof evidence !== "object") return null;
  const fixturePath = validateEvidencePath(evidence.fixturePath, "fixture", reportRoot, errors);
  if (fixturePath && fixturePath !== path.join(PACKAGE_ROOT, "evals", "execution-cases.json")) {
    addError(errors, "fixture path must reference the committed evals/execution-cases.json");
  }
  validateFileHash(evidence.fixturePath, evidence.fixtureSha256, "fixture", reportRoot, errors);
  validateFileHash(evidence.evaluatorPromptPath, evidence.evaluatorPromptSha256, "evaluator prompt", reportRoot, errors);
  return validateSourceRepository(evidence, reportRoot, errors);
}

function validateTargetIdentities(targetIdentities, evidence, reportRoot, sourceRepositoryPath, errors) {
  if (!Array.isArray(targetIdentities)) {
    addError(errors, "targetIdentities must be an array");
    return { byId: new Map(), byTargetProfile: new Map() };
  }
  const byId = new Map();
  const byTargetProfile = new Map();
  const validatedProvenance = new Set();
  for (const identity of targetIdentities) {
    const display = `${identity?.target}/${identity?.profile}`;
    if (!identity || typeof identity !== "object" || Array.isArray(identity)) {
      addError(errors, "every target identity must be an object");
      continue;
    }
    if (typeof identity.id !== "string" || identity.id.length === 0) addError(errors, `${display} target identity id is required`);
    else if (byId.has(identity.id)) addError(errors, `duplicate target identity id: ${identity.id}`);
    else byId.set(identity.id, identity);
    const targetProfileKey = `${identity.target}\u0000${identity.profile}`;
    if (byTargetProfile.has(targetProfileKey)) addError(errors, `duplicate target identity for ${display}`);
    else byTargetProfile.set(targetProfileKey, identity);
    if (!TARGETS.includes(identity.target)) addError(errors, `${display} target identity has an unknown target`);
    if (!PROFILE_KEYS.has(identity.profile)) addError(errors, `${display} target identity has an unknown profile`);
    validateFixedEvidence(identity, `${display} target identity`, errors);
    for (const field of ["epoch", "provider", "model", "thinking", "fixtureSha256", "evaluatorPromptSha256"]) {
      if (identity[field] !== evidence?.[field]) addError(errors, `${display} target identity ${field} does not match report evidence`);
    }
    if (!sameMembers(array(identity.isolationFlags), array(evidence?.isolationFlags))) {
      addError(errors, `${display} target identity isolation flags do not match report evidence`);
    }
    if (!SHA1_PATTERN.test(identity.sourceBaseSha ?? "")) addError(errors, `${display} source base SHA is required`);
    if (!SHA1_PATTERN.test(identity.sourceBaseTree ?? "")) addError(errors, `${display} source base tree is required`);
    if (typeof identity.waveAttemptId !== "string" || identity.waveAttemptId.length === 0) {
      addError(errors, `${display} wave-attempt ID is required`);
    }
    if (!SHA256_PATTERN.test(identity.patchSha256 ?? "")) addError(errors, `${display} patch SHA-256 is required`);
    if (!SHA1_PATTERN.test(identity.candidateInputSha ?? "")) addError(errors, `${display} candidate input SHA is required`);
    if (!SHA1_PATTERN.test(identity.candidateInputTree ?? "")) addError(errors, `${display} candidate input tree is required`);
    if (identity.target === "baseline") {
      if (identity.patchSha256 !== EMPTY_PATCH_SHA256) addError(errors, `${display} must use the empty patch SHA-256`);
      if (identity.patchPath !== undefined && identity.patchPath !== null) {
        validateFileHash(identity.patchPath, EMPTY_PATCH_SHA256, `${display} baseline patch`, reportRoot, errors);
      }
      if (identity.candidateInputSha !== identity.sourceBaseSha || identity.candidateInputTree !== identity.sourceBaseTree) {
        addError(errors, `${display} baseline candidate input identity must equal its source base SHA/tree`);
      }
    } else {
      if (identity.patchSha256 === EMPTY_PATCH_SHA256) addError(errors, `${display} Lite patch must be non-empty`);
      validateFileHash(identity.patchPath, identity.patchSha256, `${display} patch`, reportRoot, errors);
    }
    const provenanceKey = [
      identity.target,
      identity.sourceBaseSha,
      identity.sourceBaseTree,
      identity.patchPath ?? "",
      identity.patchSha256,
      identity.candidateInputSha,
      identity.candidateInputTree,
    ].join("\u0000");
    if (
      sourceRepositoryPath &&
      !validatedProvenance.has(provenanceKey) &&
      SHA1_PATTERN.test(identity.sourceBaseSha ?? "") &&
      SHA1_PATTERN.test(identity.sourceBaseTree ?? "") &&
      SHA1_PATTERN.test(identity.candidateInputSha ?? "") &&
      SHA1_PATTERN.test(identity.candidateInputTree ?? "")
    ) {
      validatedProvenance.add(provenanceKey);
      validateGitProvenance(identity, sourceRepositoryPath, reportRoot, errors);
    }
  }
  return { byId, byTargetProfile };
}

function indexEvidence(entries, kind, reportRoot, errors) {
  if (!Array.isArray(entries)) {
    addError(errors, `evidenceIndex.${kind} must be an array`);
    return new Map();
  }
  const indexed = new Map();
  for (const entry of entries) {
    const key = `${entry?.caseId}\u0000${entry?.target}\u0000${entry?.repetition}`;
    if (indexed.has(key)) addError(errors, `duplicate ${kind} evidence identity: ${entry?.caseId}/${entry?.target}/${entry?.repetition}`);
    else indexed.set(key, entry);
    const label = kind === "systemPrompts" ? "generated system prompt" : "raw response";
    validateFileHash(entry?.path, entry?.sha256, label, reportRoot, errors);
    if (kind === "rawResponses" && (!Number.isInteger(entry?.acceptedAttemptNumber) || entry.acceptedAttemptNumber < 1 || entry.acceptedAttemptNumber > 3)) {
      addError(errors, `${entry?.caseId}/${entry?.target}/${entry?.repetition} accepted attempt number must be 1 through 3`);
    }
  }
  return indexed;
}

function validateEvidenceIndexKeys(indexed, expectedKeys, kind, errors) {
  for (const key of indexed.keys()) {
    if (!expectedKeys.has(key)) addError(errors, `unexpected ${kind} evidence identity: ${key.replaceAll("\u0000", "/")}`);
  }
  for (const key of expectedKeys) {
    if (!indexed.has(key)) addError(errors, `missing ${kind} evidence identity: ${key.replaceAll("\u0000", "/")}`);
  }
}

function validateObservationEvidence({ fixture, result, profilesToValidate, globalEvidence, identityMaps, promptIndex, rawIndex, reportRoot, errors }) {
  const prefix = `${result?.caseId}/${result?.target}/${result?.repetition}`;
  const observation = result?.evidence;
  validateFixedEvidence(observation, `${prefix} observation evidence`, errors);
  if (!observation || typeof observation !== "object") return;
  for (const field of ["epoch", "provider", "model", "thinking", "fixtureSha256", "evaluatorPromptSha256"]) {
    if (observation[field] !== globalEvidence?.[field]) addError(errors, `${prefix} mixed ${field}: observation does not match report evidence`);
  }
  if (!sameMembers(array(observation.isolationFlags), array(globalEvidence?.isolationFlags))) {
    addError(errors, `${prefix} mixed isolation flags: observation does not match report evidence`);
  }
  const expectedFixturePromptHash = sha256(fixture.prompt);
  if (!SHA256_PATTERN.test(observation.fixturePromptSha256 ?? "")) {
    addError(errors, `${prefix} fixture prompt hash is required`);
  } else if (observation.fixturePromptSha256 !== expectedFixturePromptHash) {
    addError(errors, `${prefix} fixture prompt hash does not match committed fixture bytes`);
  }
  if (!observation.targetIdentityIds || typeof observation.targetIdentityIds !== "object" || Array.isArray(observation.targetIdentityIds)) {
    addError(errors, `${prefix} targetIdentityIds is required`);
  } else {
    const identityFields = [
      ["sourceBaseSha", "source base SHA"],
      ["sourceBaseTree", "source base tree"],
      ["waveAttemptId", "wave-attempt ID"],
      ["patchSha256", "patch SHA-256"],
      ["candidateInputSha", "candidate input SHA"],
      ["candidateInputTree", "candidate input tree"],
    ];
    for (const profileName of profilesToValidate) {
      const identityId = observation.targetIdentityIds[profileName];
      const identity = identityMaps.byId.get(identityId);
      const expectedIdentity = identityMaps.byTargetProfile.get(`${result.target}\u0000${profileName}`);
      if (!identity || identity !== expectedIdentity) {
        addError(errors, `${prefix} target identity for ${profileName} is missing or incoherent`);
        continue;
      }
      for (const [field, label] of identityFields) {
        if (observation[field] === undefined || observation[field] === null || observation[field] === "") {
          addError(errors, `${prefix} ${label} is required`);
        } else if (observation[field] !== identity[field]) {
          addError(errors, `${prefix} ${label} does not match target identity for ${profileName}`);
        }
      }
    }
  }

  const tupleKey = `${result.caseId}\u0000${result.target}\u0000${result.repetition}`;
  const promptEntry = promptIndex.get(tupleKey);
  if (!promptEntry || promptEntry.path !== observation.generatedSystemPromptPath) {
    addError(errors, `${prefix} generated system prompt path does not match evidence index`);
  }
  if (!promptEntry || promptEntry.sha256 !== observation.generatedSystemPromptSha256) {
    addError(errors, `${prefix} generated system prompt hash does not match evidence index`);
  }
  validateFileHash(
    observation.generatedSystemPromptPath,
    observation.generatedSystemPromptSha256,
    `${prefix} generated system prompt`,
    reportRoot,
    errors,
  );

  const rawEntry = rawIndex.get(tupleKey);
  if (!rawEntry || rawEntry.path !== observation.rawResponsePath) {
    addError(errors, `${prefix} raw response path does not match evidence index`);
  }
  if (!rawEntry || rawEntry.sha256 !== observation.rawResponseSha256) {
    addError(errors, `${prefix} raw response hash does not match evidence index`);
  }
  if (!Number.isInteger(observation.acceptedAttemptNumber) || observation.acceptedAttemptNumber < 1 || observation.acceptedAttemptNumber > 3) {
    addError(errors, `${prefix} accepted attempt number must be 1 through 3`);
  }
  if (!rawEntry || rawEntry.acceptedAttemptNumber !== observation.acceptedAttemptNumber) {
    addError(errors, `${prefix} accepted attempt number does not match evidence index`);
  }
  validateFileHash(observation.rawResponsePath, observation.rawResponseSha256, `${prefix} raw response`, reportRoot, errors);
  const resolvedRawPath = validateEvidencePath(observation.rawResponsePath, `${prefix} raw response`, reportRoot, errors);
  if (resolvedRawPath) {
    try {
      const parsedResponse = parsePiJsonlResponse(readFileSync(resolvedRawPath));
      for (const parserError of parsedResponse.errors) {
        addError(errors, `${prefix} raw response JSONL: ${parserError}`);
      }
    } catch (error) {
      addError(errors, `${prefix} raw response JSONL cannot be read: ${error.message}`);
    }
  }
  if (result?.sharedObservations?.rawResponse !== observation.rawResponsePath) {
    addError(errors, `${prefix} shared observation raw response path does not match evidence identity`);
  }
}

function validateBaselineRed({ selection, fixtureMap, tuples, errors }) {
  if (!selection.targets.includes("baseline")) return;
  const profileNames = selection.profile
    ? [selection.profile]
    : [...new Set(selection.caseIds.flatMap((caseId) => [...fixtureProfiles(fixtureMap.get(caseId)).keys()]))];
  for (const profileName of profileNames) {
    let observedRed = false;
    for (const caseId of selection.caseIds) {
      if (!fixtureProfiles(fixtureMap.get(caseId)).has(profileName)) continue;
      for (const repetition of REPETITIONS) {
        const result = tuples.get(`${caseId}\u0000baseline\u0000${repetition}`);
        if (result?.profileResults?.[profileName]?.pass === false) observedRed = true;
      }
    }
    if (!observedRed) addError(errors, `baseline profile ${profileName} lacks a genuine RED observation`);
  }
}

export function validateExecutionReport({
  fixtures,
  results,
  evidence,
  targetIdentities,
  evidenceIndex,
  reportRoot = process.cwd(),
  targets,
  repetitions = REPETITIONS,
  caseIds,
  profiles,
}) {
  const errors = [];
  if (!Array.isArray(fixtures)) return { valid: false, errors: ["fixtures must be an array"] };
  if (!Array.isArray(results)) return { valid: false, errors: ["results must be an array"] };
  if (!sameMembers(repetitions, REPETITIONS)) {
    return { valid: false, errors: ["repetitions must be exactly 1,2,3,4,5"] };
  }

  const fixtureMap = validateFixtureContract(fixtures, errors);
  const selection = resolveSelection({ fixtureMap, targets, caseIds, profiles }, errors);
  if (!selection) return { valid: false, errors };

  const sourceRepositoryPath = validateGlobalEvidence(evidence, reportRoot, errors);
  const identityMaps = validateTargetIdentities(targetIdentities, evidence, reportRoot, sourceRepositoryPath, errors);
  const promptIndex = indexEvidence(evidenceIndex?.systemPrompts, "systemPrompts", reportRoot, errors);
  const rawIndex = indexEvidence(evidenceIndex?.rawResponses, "rawResponses", reportRoot, errors);

  const expectedKeys = new Set();
  for (const caseId of selection.caseIds) {
    for (const target of selection.targets) {
      for (const repetition of REPETITIONS) expectedKeys.add(`${caseId}\u0000${target}\u0000${repetition}`);
    }
  }
  validateEvidenceIndexKeys(promptIndex, expectedKeys, "systemPrompts", errors);
  validateEvidenceIndexKeys(rawIndex, expectedKeys, "rawResponses", errors);

  const tuples = new Map();
  for (const result of results) {
    const key = `${result?.caseId}\u0000${result?.target}\u0000${result?.repetition}`;
    const displayKey = `${result?.caseId}/${result?.target}/${result?.repetition}`;
    if (tuples.has(key)) addError(errors, `duplicate result tuple: ${displayKey}`);
    tuples.set(key, result);
    if (!expectedKeys.has(key)) {
      addError(errors, `unexpected result tuple: ${displayKey}`);
      continue;
    }
    const fixture = fixtureMap.get(result.caseId);
    if (
      !result.sharedObservations ||
      typeof result.sharedObservations !== "object" ||
      Array.isArray(result.sharedObservations)
    ) {
      addError(errors, `${displayKey} sharedObservations must be an object`);
    } else if (
      typeof result.sharedObservations.rawResponse !== "string" ||
      result.sharedObservations.rawResponse.length === 0
    ) {
      addError(errors, `${displayKey} sharedObservations.rawResponse must be a non-empty string`);
    }
    if (!result.profileResults || typeof result.profileResults !== "object" || Array.isArray(result.profileResults)) {
      addError(errors, `${displayKey} profileResults must be an object`);
      continue;
    }
    const declaredProfiles = fixtureProfiles(fixture);
    for (const profileName of Object.keys(result.profileResults)) {
      if (!declaredProfiles.has(profileName)) addError(errors, `unexpected profile result: ${displayKey}/${profileName}`);
    }
    const profilesToValidate = selection.profile ? [selection.profile] : [...declaredProfiles.keys()];
    validateObservationEvidence({
      fixture,
      result,
      profilesToValidate,
      globalEvidence: evidence,
      identityMaps,
      promptIndex,
      rawIndex,
      reportRoot,
      errors,
    });
    for (const profileName of profilesToValidate) {
      if (!(profileName in result.profileResults)) {
        addError(errors, `missing profile result: ${displayKey}/${profileName}`);
        continue;
      }
      validateProfileResult({
        fixture,
        target: result.target,
        repetition: result.repetition,
        profile: declaredProfiles.get(profileName),
        profileResult: result.profileResults[profileName],
        errors,
      });
    }
  }

  for (const expectedKey of expectedKeys) {
    if (!tuples.has(expectedKey)) addError(errors, `missing result tuple: ${expectedKey.replaceAll("\u0000", "/")}`);
  }
  validateBaselineRed({ selection, fixtureMap, tuples, errors });

  return { valid: errors.length === 0, errors };
}

function parseCliArguments(args) {
  const filters = { targets: [], caseIds: [], profiles: [] };
  let reportPath;
  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if (!reportPath && !argument.startsWith("--")) {
      reportPath = argument;
      continue;
    }
    const value = args[index + 1];
    if (!value || value.startsWith("--")) throw new Error(`${argument} requires a value`);
    if (argument === "--target") filters.targets.push(value);
    else if (argument === "--case") filters.caseIds.push(value);
    else if (argument === "--profile") filters.profiles.push(value);
    else throw new Error(`unknown option: ${argument}`);
    index += 1;
  }
  return { reportPath, filters };
}

function runCli() {
  let parsed;
  try {
    parsed = parseCliArguments(process.argv.slice(2));
  } catch (error) {
    console.error(error.message);
    process.exitCode = 2;
    return;
  }
  if (!parsed.reportPath) {
    console.error("Usage: node scripts/validate-execution-eval-report.mjs <report.json> [--target baseline|lite] [--case ID ... --profile PROFILE]");
    process.exitCode = 2;
    return;
  }
  const reportPath = path.resolve(parsed.reportPath);
  const fixtures = JSON.parse(readFileSync(path.join(PACKAGE_ROOT, "evals", "execution-cases.json"), "utf8"));
  const document = JSON.parse(readFileSync(reportPath, "utf8"));
  if (Array.isArray(document)) {
    console.error("execution evaluation reports must be objects with evidence identity and an evidence index");
    process.exitCode = 1;
    return;
  }
  const validation = validateExecutionReport({
    fixtures,
    ...document,
    reportRoot: path.dirname(reportPath),
    repetitions: REPETITIONS,
    ...parsed.filters,
  });
  const results = document?.results;
  if (!validation.valid) {
    console.error(validation.errors.join("\n"));
    process.exitCode = 1;
    return;
  }
  console.log(`execution evaluation report valid: ${results.length} records`);
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : "";
if (invokedPath === path.resolve(fileURLToPath(import.meta.url))) runCli();
