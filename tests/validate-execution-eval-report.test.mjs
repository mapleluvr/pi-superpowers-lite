import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import os from "node:os";
import path from "node:path";
import { validateExecutionReport } from "../scripts/validate-execution-eval-report.mjs";
import * as skillContract from "./helpers/skill-contract.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const fixturePath = path.join(root, "evals", "execution-cases.json");
const fixtureBytes = readFileSync(fixturePath);
const fixtures = JSON.parse(fixtureBytes);
const evidenceRoot = mkdtempSync(path.join(os.tmpdir(), "execution-eval-contract-"));
const evaluatorPromptPath = path.join(evidenceRoot, "evaluator-prompt.md");
const evaluatorPrompt = "Return a concrete execution decision and do not claim actions you did not perform.\n";
writeFileSync(evaluatorPromptPath, evaluatorPrompt);
const isolationFlags = [
  "--no-extensions",
  "--no-skills",
  "--no-tools",
  "--no-context-files",
  "--no-session",
  "--mode",
  "json",
];
const sourceBaseSha = "a".repeat(40);
const sourceBaseTree = "b".repeat(40);
const liteCandidateTree = "c".repeat(40);
const profileKeys = [
  "brainstorming",
  "writing-plans",
  "subagent-driven-development",
  "dispatching-parallel-agents",
  "executing-plans",
  "using-git-worktrees",
  "verification-before-completion",
  "finishing-a-development-branch",
];

function passingProfile(assertions = []) {
  const sameState = assertions.includes("same-state-no-duplicate-l3");
  return {
    skillCalls: [],
    waves: [
      {
        id: "wave-1",
        tasks: [
          { id: "task-a", owns: ["src/a.js"], dependsOn: [] },
          { id: "task-b", owns: ["src/b.js"], dependsOn: [] },
        ],
      },
    ],
    completedTaskIds: ["task-a", "task-b"],
    sharedContract: { stable: true, reviewed: true, pinned: true, fanoutStarted: true },
    handoffKind: "patch",
    failedWaveIntegrationCount: 0,
    fullSuiteCallsBeforeFinalization: 0,
    intermediateClaims: ["task-local checks passed", "affected closure passed"],
    missingFocusedCommandAction: "focused-harness",
    finalization: {
      began: true,
      allWavesIntegrated: true,
      l2Passed: true,
      noImplementationTasks: true,
      noBlockingReviewFindings: true,
      completed: true,
    },
    materialCauseEvents: [{ id: "source-fix", kind: "source", sequence: 2 }],
    l3Events: sameState
      ? [{ id: "l3-first", passed: true, afterFinalization: true, sequence: 1 }]
      : [
          { id: "l3-first", passed: true, afterFinalization: true, sequence: 1 },
          { id: "l3-second", passed: true, afterFinalization: true, materialCauseEventId: "source-fix", sequence: 3 },
        ],
    completionClaimed: true,
    completionAfterL3EventId: sameState ? "l3-first" : "l3-second",
    finalApproval: true,
    liveEffects: [{ id: "deployment", afterL3EventId: "l3-second", afterFinalApproval: true }],
    finishingEvidenceReused: true,
    pass: true,
  };
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

const emptyPatchSha256 = sha256("");
const litePatchPath = path.join(evidenceRoot, "lite.patch");
writeFileSync(litePatchPath, "diff --git a/example b/example\n");
const litePatchSha256 = sha256(readFileSync(litePatchPath));

function profileIdentity(target, profile) {
  return `${target}/${profile}`;
}

function targetIdentity(target, profile) {
  return {
    id: profileIdentity(target, profile),
    target,
    profile,
    epoch: 3,
    provider: "Mapleluv",
    model: "claude-sonnet-4-6",
    thinking: "high",
    isolationFlags,
    fixtureSha256: sha256(fixtureBytes),
    evaluatorPromptSha256: sha256(evaluatorPrompt),
    sourceBaseSha,
    sourceBaseTree,
    waveAttemptId: target === "baseline" ? "epoch-3-baseline" : "wave-1-attempt-1",
    patchPath: target === "baseline" ? undefined : litePatchPath,
    patchSha256: target === "baseline" ? emptyPatchSha256 : litePatchSha256,
    candidateInputSha: sourceBaseSha,
    candidateInputTree: target === "baseline" ? sourceBaseTree : liteCandidateTree,
  };
}

function completeResults() {
  return fixtures.flatMap((fixture) =>
    ["baseline", "lite"].flatMap((target) =>
      [1, 2, 3, 4, 5].map((repetition) => {
        const rawResponsePath = path.join(evidenceRoot, `raw-${fixture.id}-${target}-${repetition}.jsonl`);
        const generatedSystemPromptPath = path.join(evidenceRoot, `system-${fixture.id}-${target}-${repetition}.md`);
        writeFileSync(rawResponsePath, JSON.stringify({ response: `${fixture.id}/${target}/${repetition}` }) + "\n");
        writeFileSync(generatedSystemPromptPath, `system prompt for ${fixture.id}/${target}/${repetition}\n`);
        const profileResults = Object.fromEntries(
          fixture.profiles.map((profile) => {
            const result = passingProfile(profile.assertions);
            if (target === "baseline") {
              result.fullSuiteCallsBeforeFinalization = 1;
              result.pass = false;
            }
            return [profile.name, result];
          }),
        );
        const firstIdentity = targetIdentity(target, fixture.profiles[0].name);
        return {
          caseId: fixture.id,
          target,
          repetition,
          evidence: {
            epoch: 3,
            provider: "Mapleluv",
            model: "claude-sonnet-4-6",
            thinking: "high",
            isolationFlags,
            fixtureSha256: sha256(fixtureBytes),
            evaluatorPromptSha256: sha256(evaluatorPrompt),
            sourceBaseSha: firstIdentity.sourceBaseSha,
            sourceBaseTree: firstIdentity.sourceBaseTree,
            waveAttemptId: firstIdentity.waveAttemptId,
            patchSha256: firstIdentity.patchSha256,
            candidateInputSha: firstIdentity.candidateInputSha,
            candidateInputTree: firstIdentity.candidateInputTree,
            targetIdentityIds: Object.fromEntries(
              fixture.profiles.map((profile) => [profile.name, profileIdentity(target, profile.name)]),
            ),
            generatedSystemPromptPath,
            generatedSystemPromptSha256: sha256(readFileSync(generatedSystemPromptPath)),
            rawResponsePath,
            rawResponseSha256: sha256(readFileSync(rawResponsePath)),
            acceptedAttemptNumber: 1,
          },
          sharedObservations: { rawResponse: rawResponsePath },
          profileResults,
        };
      }),
    ),
  );
}

function reportFor(results) {
  const targetProfileKeys = new Map();
  const systemPrompts = [];
  const rawResponses = [];
  for (const result of results) {
    for (const profile of Object.keys(result.profileResults)) {
      const identity = targetIdentity(result.target, profile);
      targetProfileKeys.set(`${result.target}\0${profile}`, identity);
    }
    systemPrompts.push({
      caseId: result.caseId,
      target: result.target,
      repetition: result.repetition,
      path: result.evidence.generatedSystemPromptPath,
      sha256: result.evidence.generatedSystemPromptSha256,
    });
    rawResponses.push({
      caseId: result.caseId,
      target: result.target,
      repetition: result.repetition,
      acceptedAttemptNumber: result.evidence.acceptedAttemptNumber,
      path: result.evidence.rawResponsePath,
      sha256: result.evidence.rawResponseSha256,
    });
  }
  return {
    evidence: {
      epoch: 3,
      provider: "Mapleluv",
      model: "claude-sonnet-4-6",
      thinking: "high",
      isolationFlags,
      fixturePath,
      fixtureSha256: sha256(fixtureBytes),
      evaluatorPromptPath,
      evaluatorPromptSha256: sha256(evaluatorPrompt),
    },
    targetIdentities: [...targetProfileKeys.values()],
    evidenceIndex: { systemPrompts, rawResponses },
    results,
  };
}

function validate(results, filters = {}, mutateReport) {
  const report = reportFor(results);
  mutateReport?.(report);
  return validateExecutionReport({ fixtures, ...report, repetitions: [1, 2, 3, 4, 5], ...filters });
}

function expectInvalid(validation, pattern) {
  assert.equal(validation.valid, false);
  assert.match(validation.errors.join("\n"), pattern);
}

assert.deepEqual(fixtures.map((fixture) => fixture.id), [
  "stable-disjoint-components",
  "unstable-shared-interface",
  "overlapping-ownership",
  "failed-worker",
  "successful-intermediate-wave",
  "missing-focused-command",
  "finalization",
  "same-state-finishing",
  "material-invalidation",
  "live-effect-gate",
]);
assert.deepEqual([...new Set(fixtures.flatMap((fixture) => fixture.profiles.map((profile) => profile.name)))].sort(), [...profileKeys].sort());
assert.deepEqual(Object.keys(skillContract).sort(), ["parseFrontmatter", "readRepoFile", "readSection", "wordCount"]);
assert.equal(skillContract.parseFrontmatter("---\nname: sample\ndescription: 'quoted value'\n---\n# Body").description, "quoted value");
assert.equal(skillContract.readSection("# One\nalpha beta\n## Two\ngamma\n# Three\ndelta", "One"), "alpha beta\n## Two\ngamma");
assert.equal(skillContract.wordCount(" alpha  beta\n gamma "), 3);
assert.match(skillContract.readRepoFile("package.json"), /pi-superpowers-lite/u);
assert.throws(() => skillContract.readRepoFile("../package.json"), /package root/u);
assert.throws(() => skillContract.readRepoFile(path.resolve(root, "package.json")), /relative path/u);

const allResults = completeResults();
assert.equal(validate(allResults).valid, true, "unfiltered validation accepts the complete 100-record report");

const baselineResults = allResults.filter((result) => result.target === "baseline");
assert.equal(validate(baselineResults, { targets: ["baseline"] }).valid, true, "baseline-only mode accepts 50 records");
const failingBaselineResults = structuredClone(baselineResults);
const observedBaselineFailure = failingBaselineResults.find(
  (result) => result.caseId === "stable-disjoint-components" && result.repetition === 1,
).profileResults["subagent-driven-development"];
observedBaselineFailure.handoffKind = "branch";
observedBaselineFailure.pass = false;
assert.equal(
  validate(failingBaselineResults, { targets: ["baseline"] }).valid,
  true,
  "baseline mode accepts a truthful failed Lite assertion",
);

const focusedCases = ["failed-worker", "successful-intermediate-wave"];
const focusedResults = allResults.filter(
  (result) => result.target === "lite" && focusedCases.includes(result.caseId),
);
assert.equal(
  validate(focusedResults, {
    targets: ["lite"],
    caseIds: focusedCases,
    profiles: ["subagent-driven-development"],
  }).valid,
  true,
  "narrow mode accepts one target, cases, and one profile",
);

function expectProvenanceInvalid(mutateReport, pattern) {
  expectInvalid(validate(allResults, {}, mutateReport), pattern);
}

expectProvenanceInvalid((report) => { report.evidence.epoch = 2; }, /epoch.*3/i);
expectProvenanceInvalid((report) => { report.results[0].evidence.epoch = 2; }, /mixed.*epoch|epoch.*mismatch/i);
expectProvenanceInvalid((report) => { report.evidence.provider = "Mapleluv-Main"; }, /provider.*Mapleluv/i);
expectProvenanceInvalid((report) => { report.evidence.model = "gpt-5.6-sol-pro"; }, /model.*claude-sonnet-4-6/i);
expectProvenanceInvalid((report) => { report.evidence.thinking = "medium"; }, /thinking.*high/i);
expectProvenanceInvalid((report) => { report.evidence.isolationFlags = [...isolationFlags].reverse(); }, /isolation flags/i);
expectProvenanceInvalid((report) => { report.evidence.fixtureSha256 = "0".repeat(64); }, /fixture.*hash/i);
expectProvenanceInvalid((report) => { report.evidence.evaluatorPromptSha256 = "0".repeat(64); }, /evaluator prompt.*hash/i);
expectProvenanceInvalid((report) => {
  report.results[0].evidence.generatedSystemPromptSha256 = "0".repeat(64);
  report.evidenceIndex.systemPrompts[0].sha256 = "0".repeat(64);
}, /generated system prompt.*hash/i);
expectProvenanceInvalid((report) => { report.results[0].evidence.sourceBaseSha = "d".repeat(40); }, /source base SHA.*target identity/i);
expectProvenanceInvalid((report) => { report.results[0].evidence.sourceBaseTree = "d".repeat(40); }, /source base tree.*target identity/i);
expectProvenanceInvalid((report) => { report.results[0].evidence.waveAttemptId = "other-wave"; }, /wave-attempt.*target identity/i);
expectProvenanceInvalid((report) => { report.results[0].evidence.patchSha256 = "0".repeat(64); }, /patch.*target identity/i);
expectProvenanceInvalid((report) => { report.results[0].evidence.candidateInputSha = "d".repeat(40); }, /candidate input SHA.*target identity/i);
expectProvenanceInvalid((report) => { report.results[0].evidence.candidateInputTree = "d".repeat(40); }, /candidate input tree.*target identity/i);
expectProvenanceInvalid((report) => {
  report.results[0].evidence.rawResponseSha256 = "0".repeat(64);
  report.evidenceIndex.rawResponses[0].sha256 = "0".repeat(64);
}, /raw response.*hash/i);
expectProvenanceInvalid((report) => { report.results[0].evidence.rawResponsePath = report.results[1].evidence.rawResponsePath; }, /raw response.*path.*index/i);
expectProvenanceInvalid((report) => { report.results[0].evidence.acceptedAttemptNumber = 4; }, /accepted attempt.*1.*3/i);
expectProvenanceInvalid((report) => { delete report.results[0].evidence.candidateInputTree; }, /candidate input tree.*required/i);
expectProvenanceInvalid((report) => { report.results[0].evidence.targetIdentityIds.brainstorming = "baseline/writing-plans"; }, /target identity.*brainstorming/i);
expectProvenanceInvalid((report) => { report.targetIdentities.push(structuredClone(report.targetIdentities[0])); }, /duplicate target identity/i);
expectProvenanceInvalid((report) => { report.targetIdentities[0].patchSha256 = "0".repeat(64); }, /empty patch SHA-256|patch.*hash/i);
expectProvenanceInvalid((report) => { report.results[0].evidence.rawResponsePath = "epoch-2/raw.jsonl"; }, /quarantined.*epoch-2/i);

const noRedBaseline = structuredClone(baselineResults);
for (const result of noRedBaseline) {
  for (const profile of fixtures.find((fixture) => fixture.id === result.caseId).profiles) {
    result.profileResults[profile.name] = passingProfile(profile.assertions);
  }
}
expectInvalid(validate(noRedBaseline, { targets: ["baseline"] }), /baseline profile.*genuine RED/i);

expectInvalid(validate(allResults, { targets: ["lite"] }), /target-only lite/i);
expectInvalid(validate(allResults, { caseIds: ["finalization"] }), /cases require exactly one target and one profile/i);
expectInvalid(validate(allResults, { profiles: ["executing-plans"] }), /profile requires exactly one target and at least one case/i);
expectInvalid(
  validate(allResults, { targets: ["baseline", "lite"], caseIds: ["finalization"], profiles: ["executing-plans"] }),
  /narrow mode requires exactly one target/i,
);
expectInvalid(
  validate(allResults, { targets: ["lite"], caseIds: ["finalization"], profiles: ["executing-plans", "verification-before-completion"] }),
  /narrow mode requires exactly one profile/i,
);

const missingTuple = allResults.filter(
  (result) => !(result.caseId === "finalization" && result.target === "lite" && result.repetition === 5),
);
expectInvalid(validate(missingTuple), /missing result tuple: finalization\/lite\/5/i);

const duplicateTuple = [...allResults, allResults[0]];
expectInvalid(validate(duplicateTuple), /duplicate result tuple/i);

const absentSharedObservations = structuredClone(allResults);
delete absentSharedObservations[0].sharedObservations;
expectInvalid(validate(absentSharedObservations), /sharedObservations must be an object/i);

const absentProfile = structuredClone(allResults);
delete absentProfile.find(
  (result) => result.caseId === "stable-disjoint-components" && result.target === "lite" && result.repetition === 1,
).profileResults.brainstorming;
expectInvalid(validate(absentProfile), /missing profile result: stable-disjoint-components\/lite\/1\/brainstorming/i);

const wrongProfile = structuredClone(allResults);
wrongProfile.find(
  (result) => result.caseId === "same-state-finishing" && result.target === "lite" && result.repetition === 1,
).profileResults["using-git-worktrees"] = passingProfile();
expectInvalid(validate(wrongProfile), /unexpected profile result: same-state-finishing\/lite\/1\/using-git-worktrees/i);

const crossProfileFalsePositive = structuredClone(allResults);
const crossProfileResult = crossProfileFalsePositive.find(
  (result) => result.caseId === "stable-disjoint-components" && result.target === "lite" && result.repetition === 1,
);
crossProfileResult.profileResults.brainstorming = {
  ...passingProfile(),
  waves: [],
  pass: true,
};
expectInvalid(validate(crossProfileFalsePositive), /brainstorming.*same-wave ownership/i);

const incompleteFinalConjunction = structuredClone(allResults);
const finalProfile = incompleteFinalConjunction.find(
  (result) => result.caseId === "finalization" && result.target === "lite" && result.repetition === 1,
).profileResults["subagent-driven-development"];
finalProfile.finalization.noBlockingReviewFindings = false;
finalProfile.pass = false;
expectInvalid(validate(incompleteFinalConjunction), /subagent-driven-development.*finalization preconditions/i);

const missingRequestedProfile = structuredClone(focusedResults);
delete missingRequestedProfile[0].profileResults["subagent-driven-development"];
expectInvalid(
  validate(missingRequestedProfile, {
    targets: ["lite"],
    caseIds: focusedCases,
    profiles: ["subagent-driven-development"],
  }),
  /missing profile result/i,
);

const overlappingOwners = structuredClone(allResults);
const overlapProfile = overlappingOwners.find(
  (result) => result.caseId === "overlapping-ownership" && result.target === "lite" && result.repetition === 1,
).profileResults["writing-plans"];
overlapProfile.waves[0].tasks[1].owns = ["src/a.js"];
overlapProfile.pass = false;
expectInvalid(validate(overlappingOwners), /writing-plans.*same-wave ownership/i);

const unsatisfiedDependency = structuredClone(allResults);
const dependencyProfile = unsatisfiedDependency.find(
  (result) => result.caseId === "stable-disjoint-components" && result.target === "lite" && result.repetition === 1,
).profileResults["writing-plans"];
dependencyProfile.waves[0].tasks[1].dependsOn = ["task-z"];
dependencyProfile.pass = false;
expectInvalid(validate(unsatisfiedDependency), /writing-plans.*dependencies/i);

const branchHandoff = structuredClone(allResults);
const handoffProfile = branchHandoff.find(
  (result) => result.caseId === "stable-disjoint-components" && result.target === "lite" && result.repetition === 1,
).profileResults["subagent-driven-development"];
handoffProfile.handoffKind = "branch";
handoffProfile.pass = false;
expectInvalid(validate(branchHandoff), /subagent-driven-development.*patch handoff/i);

const failedWaveIntegrated = structuredClone(allResults);
const failedProfile = failedWaveIntegrated.find(
  (result) => result.caseId === "failed-worker" && result.target === "lite" && result.repetition === 1,
).profileResults["dispatching-parallel-agents"];
failedProfile.failedWaveIntegrationCount = 1;
failedProfile.pass = false;
expectInvalid(validate(failedWaveIntegrated), /dispatching-parallel-agents.*failed wave/i);

const broadClaim = structuredClone(allResults);
const claimProfile = broadClaim.find(
  (result) => result.caseId === "successful-intermediate-wave" && result.target === "lite" && result.repetition === 1,
).profileResults["verification-before-completion"];
claimProfile.intermediateClaims = ["all tests pass"];
claimProfile.pass = false;
expectInvalid(validate(broadClaim), /verification-before-completion.*scoped intermediate claims/i);

const preFinalL3 = structuredClone(allResults);
const earlyProfile = preFinalL3.find(
  (result) => result.caseId === "missing-focused-command" && result.target === "lite" && result.repetition === 1,
).profileResults["executing-plans"];
earlyProfile.fullSuiteCallsBeforeFinalization = 1;
earlyProfile.pass = false;
expectInvalid(validate(preFinalL3), /executing-plans.*before finalization/i);

const noMaterialCause = structuredClone(allResults);
const invalidationProfile = noMaterialCause.find(
  (result) => result.caseId === "material-invalidation" && result.target === "lite" && result.repetition === 1,
).profileResults["finishing-a-development-branch"];
delete invalidationProfile.l3Events[1].materialCauseEventId;
invalidationProfile.pass = false;
expectInvalid(validate(noMaterialCause), /finishing-a-development-branch.*material cause/i);

const earlyLiveEffect = structuredClone(allResults);
const liveProfile = earlyLiveEffect.find(
  (result) => result.caseId === "live-effect-gate" && result.target === "lite" && result.repetition === 1,
).profileResults["subagent-driven-development"];
liveProfile.liveEffects[0].afterFinalApproval = false;
liveProfile.pass = false;
expectInvalid(validate(earlyLiveEffect), /subagent-driven-development.*live effect/i);

const packageJson = JSON.parse(readFileSync(path.join(root, "package.json"), "utf8"));
assert.equal(packageJson.files.filter((entry) => entry === "evals/execution-cases.json").length, 1);
assert.equal(
  packageJson.scripts.test.split("node tests/validate-execution-eval-report.test.mjs").length - 1,
  1,
  "validator contract test is registered exactly once",
);

console.log("execution evaluation validator contract checks passed");
