import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import os from "node:os";
import path from "node:path";
import { parsePiJsonlResponse, validateExecutionReport } from "../scripts/validate-execution-eval-report.mjs";
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
function git(...args) {
  return execFileSync("git", args, { cwd: root, encoding: "utf8" }).trim();
}

const sourceBaseSha = git("rev-parse", "HEAD^");
const sourceBaseTree = git("rev-parse", `${sourceBaseSha}^{tree}`);
const liteCandidateSha = git("rev-parse", "HEAD");
const liteCandidateTree = git("rev-parse", `${liteCandidateSha}^{tree}`);
const litePatchPath = path.join(evidenceRoot, "lite.patch");
writeFileSync(litePatchPath, execFileSync("git", ["diff", "--binary", `${sourceBaseSha}..${liteCandidateSha}`], { cwd: root }));
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

const STATE_ONE = Object.freeze({
  head: "1".repeat(40),
  tree: "2".repeat(40),
  commandSetSha256: "3".repeat(64),
  environmentFingerprintSha256: "4".repeat(64),
  clean: true,
});
const STATE_TWO = Object.freeze({
  head: "5".repeat(40),
  tree: "6".repeat(40),
  commandSetSha256: "3".repeat(64),
  environmentFingerprintSha256: "4".repeat(64),
  clean: true,
});

function passingProfile(assertions = []) {
  const sameState = assertions.includes("same-state-no-duplicate-l3");
  const graphless = assertions.includes("graphless-single-chain-inline");
  const finalL3Id = sameState ? "l3-first" : "l3-second";
  const finalState = sameState ? STATE_ONE : STATE_TWO;
  const events = graphless
    ? [
        { id: "l0-task-a", type: "l0", frontierId: "task-a", sequence: 1, passed: true },
        { id: "l1-task-a", type: "l1", taskId: "task-a", sequence: 2, passed: true },
        { id: "l0-task-b", type: "l0", frontierId: "task-b", sequence: 3, passed: true },
        { id: "l1-task-b", type: "l1", taskId: "task-b", sequence: 4, passed: true },
        { id: "l2-chain", type: "l2", sequence: 5, passed: true },
        { id: "finalization-start", type: "finalization-start", sequence: 6 },
        { id: "l3-first", type: "l3", sequence: 7, passed: true, state: STATE_ONE },
      ]
    : [
        { id: "l0-wave-1", type: "l0", waveId: "wave-1", sequence: 1, passed: true },
        { id: "fanout-wave-1", type: "fanout", waveId: "wave-1", sequence: 2 },
        { id: "l1-task-a", type: "l1", waveId: "wave-1", taskId: "task-a", sequence: 3, passed: true },
        { id: "l1-task-b", type: "l1", waveId: "wave-1", taskId: "task-b", sequence: 4, passed: true },
        { id: "l2-wave-1", type: "l2", waveId: "wave-1", sequence: 5, passed: true },
        { id: "finalization-start", type: "finalization-start", sequence: 6 },
        { id: "l3-first", type: "l3", sequence: 7, passed: true, state: STATE_ONE },
      ];
  if (!sameState) {
    events.push(
      { id: "source-fix", type: "material-cause", sequence: 8, invalidatesL3EventId: "l3-first", kind: "source" },
      { id: "l3-second", type: "l3", sequence: 9, passed: true, state: STATE_TWO, materialCauseEventId: "source-fix" },
    );
  }
  events.push(
    { id: "approval", type: "approval", sequence: 10, l3EventId: finalL3Id, approved: true },
    { id: "completion", type: "completion", sequence: 11, l3EventId: finalL3Id },
    { id: "deployment", type: "live-effect", sequence: 12, l3EventId: finalL3Id, approvalEventId: "approval" },
    { id: "deployment-smoke", type: "post-effect-smoke", sequence: 13, effectEventId: "deployment", passed: true },
    { id: "finishing", type: "finishing", sequence: 14, reusedL3EventId: finalL3Id, state: finalState },
  );
  return {
    skillCalls: [],
    executionShape: graphless ? "single-chain-inline" : "graph-waves",
    waves: graphless
      ? []
      : [
          {
            id: "wave-1",
            tasks: [
              { id: "task-a", owns: ["src/a.js"], mutableResources: ["db:task-a"], dependsOn: [] },
              { id: "task-b", owns: ["src/b.js"], mutableResources: ["db:task-b"], dependsOn: [] },
            ],
          },
        ],
    serialTasks: graphless
      ? [
          { id: "task-a", owns: ["src/state/store.ts"], mutableResources: ["db:shared"] },
          { id: "task-b", owns: ["src/state/store.ts"], mutableResources: ["db:shared"] },
        ]
      : [],
    completedTaskIds: ["task-a", "task-b"],
    sharedContract: { stable: true, reviewed: true, pinned: true, fanoutStarted: true },
    handoffKind: "patch",
    failedWaveIntegrationCount: 0,
    recovery: {
      currentPatchReversed: true,
      priorWaveCommitsReverted: true,
      originalTreeRestored: true,
      historyRewritten: false,
    },
    setupAction: "plan-declared-dependency-only",
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
    events,
    materialCauseEvents: [{ id: "source-fix", kind: "source", sequence: 8 }],
    l3Events: sameState
      ? [{ id: "l3-first", passed: true, afterFinalization: true, sequence: 7 }]
      : [
          { id: "l3-first", passed: true, afterFinalization: true, sequence: 7 },
          { id: "l3-second", passed: true, afterFinalization: true, materialCauseEventId: "source-fix", sequence: 9 },
        ],
    completionClaimed: true,
    completionAfterL3EventId: finalL3Id,
    finalApproval: true,
    liveEffects: [{ id: "deployment", afterL3EventId: finalL3Id, afterFinalApproval: true }],
    finishingEvidenceReused: true,
    pass: true,
  };
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function lifecycleEvents({ text = ["first", " second"], stopReason = "stop", willRetry = false, error, content = null } = {}) {
  return [
    { type: "agent_start" },
    { type: "message_end", message: { role: "user", content: [{ type: "text", text: "fixture" }] } },
    {
      type: "message_end",
      message: {
        role: "assistant",
        content: content ?? [{ type: "thinking", thinking: "private" }, ...text.map((value) => ({ type: "text", text: value }))],
        stopReason,
        ...(error === undefined ? {} : { error }),
      },
    },
    { type: "agent_end", willRetry },
  ];
}

function piJsonl(events) {
  return events.map((event) => JSON.stringify(event)).join("\n") + "\n";
}

function validPiJsonl(text = ["accepted response"]) {
  return `\n${piJsonl([{ type: "session", version: 3 }, ...lifecycleEvents({ text }), { type: "agent_settled" }])}\n`;
}

function expectJsonlInvalid(raw, pattern) {
  const parsed = parsePiJsonlResponse(raw);
  assert.equal(parsed.valid, false);
  assert.match(parsed.errors.join("\n"), pattern);
}

const parsedJsonl = parsePiJsonlResponse(validPiJsonl(["alpha", " beta"]));
assert.equal(parsedJsonl.valid, true);
assert.equal(parsedJsonl.text, "alpha beta");
assert.equal(parsedJsonl.events.length, 6);

const retryThenSuccess = parsePiJsonlResponse(piJsonl([
  { type: "session", version: 3 },
  ...lifecycleEvents({ text: ["failed retry"], stopReason: "error", willRetry: true }),
  ...lifecycleEvents({ text: ["final success"] }),
  { type: "agent_settled" },
]));
assert.equal(retryThenSuccess.valid, true);
assert.equal(retryThenSuccess.text, "final success");

expectJsonlInvalid("{not json}\n", /line 1.*valid JSON/i);
expectJsonlInvalid("[]\n", /line 1.*object/i);
expectJsonlInvalid(piJsonl([{ type: "session" }, ...lifecycleEvents()]), /final agent_settled/i);
expectJsonlInvalid(piJsonl([{ type: "session" }, ...lifecycleEvents(), { type: "agent_settled" }, { type: "session" }]), /final agent_settled/i);
expectJsonlInvalid(piJsonl([{ type: "session" }, { type: "agent_end", willRetry: false }, { type: "agent_settled" }]), /final agent_start/i);
expectJsonlInvalid(piJsonl([{ type: "session" }, { type: "agent_start" }, { type: "agent_settled" }]), /final agent_end/i);
expectJsonlInvalid(piJsonl([
  { type: "session" },
  { type: "agent_start" },
  ...lifecycleEvents(),
  { type: "agent_settled" },
]), /unmatched agent_start/i);
expectJsonlInvalid(piJsonl([{ type: "session" }, ...lifecycleEvents({ willRetry: true }), { type: "agent_settled" }]), /willRetry.*false/i);
expectJsonlInvalid(piJsonl([{ type: "session" }, { type: "agent_start" }, { type: "agent_end", willRetry: false }, { type: "agent_settled" }]), /assistant message_end/i);
expectJsonlInvalid(piJsonl([
  { type: "session" },
  { type: "agent_start" },
  { type: "message_end", message: { role: "assistant", content: [{ type: "text", text: "not terminal" }], stopReason: "stop" } },
  { type: "message_end", message: { role: "user", content: [{ type: "text", text: "terminal" }] } },
  { type: "agent_end", willRetry: false },
  { type: "agent_settled" },
]), /terminal message_end.*assistant/i);
expectJsonlInvalid(piJsonl([{ type: "session" }, ...lifecycleEvents({ stopReason: "length" }), { type: "agent_settled" }]), /stopReason.*stop/i);
expectJsonlInvalid(piJsonl([{ type: "session" }, ...lifecycleEvents({ error: "provider failure" }), { type: "agent_settled" }]), /error-free/i);
expectJsonlInvalid(piJsonl([
  { type: "session" },
  ...lifecycleEvents({ content: [{ type: "text", text: "text" }, { type: "toolCall", name: "write" }] }),
  { type: "agent_settled" },
]), /tool-free/i);
expectJsonlInvalid(piJsonl([{ type: "session" }, ...lifecycleEvents({ text: [" ", "\n"] }), { type: "agent_settled" }]), /nonempty.*text/i);
expectJsonlInvalid(piJsonl([
  { type: "session" },
  ...lifecycleEvents({ text: ["prior success"], willRetry: true }),
  ...lifecycleEvents({ text: ["final failure"], stopReason: "error" }),
  { type: "agent_settled" },
]), /stopReason.*stop/i);

const emptyPatchSha256 = sha256("");
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
    candidateInputSha: target === "baseline" ? sourceBaseSha : liteCandidateSha,
    candidateInputTree: target === "baseline" ? sourceBaseTree : liteCandidateTree,
  };
}

function completeResults() {
  return fixtures.flatMap((fixture) =>
    ["baseline", "lite"].flatMap((target) =>
      [1, 2, 3, 4, 5].map((repetition) => {
        const rawResponsePath = path.join(evidenceRoot, `raw-${fixture.id}-${target}-${repetition}.jsonl`);
        const generatedSystemPromptPath = path.join(evidenceRoot, `system-${fixture.id}-${target}-${repetition}.md`);
        writeFileSync(rawResponsePath, validPiJsonl([`${fixture.id}/${target}/${repetition}`]));
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
            fixturePromptSha256: sha256(fixture.prompt),
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
      sourceRepositoryPath: root,
    },
    targetIdentities: [...targetProfileKeys.values()],
    evidenceIndex: { systemPrompts, rawResponses },
    results,
  };
}

function validate(results, filters = {}, mutateReport) {
  const report = reportFor(structuredClone(results));
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
expectProvenanceInvalid((report) => { report.results[0].evidence.fixturePromptSha256 = "0".repeat(64); }, /fixture prompt.*hash/i);
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
expectProvenanceInvalid((report) => {
  const fakeSha = "d".repeat(40);
  const fakeTree = "e".repeat(40);
  for (const identity of report.targetIdentities) {
    identity.sourceBaseSha = fakeSha;
    identity.sourceBaseTree = fakeTree;
    if (identity.target === "baseline") {
      identity.candidateInputSha = fakeSha;
      identity.candidateInputTree = fakeTree;
    }
  }
  for (const result of report.results) {
    result.evidence.sourceBaseSha = fakeSha;
    result.evidence.sourceBaseTree = fakeTree;
    if (result.target === "baseline") {
      result.evidence.candidateInputSha = fakeSha;
      result.evidence.candidateInputTree = fakeTree;
    }
  }
}, /source base commit.*(?:resolve|repository)|unknown source base commit/i);
expectProvenanceInvalid((report) => {
  for (const identity of report.targetIdentities.filter((entry) => entry.target === "lite")) {
    identity.candidateInputSha = sourceBaseSha;
    identity.candidateInputTree = sourceBaseTree;
  }
  for (const result of report.results.filter((entry) => entry.target === "lite")) {
    result.evidence.candidateInputSha = sourceBaseSha;
    result.evidence.candidateInputTree = sourceBaseTree;
  }
}, /patch.*(?:reconstructed|computed).*(?:candidate|tree)|candidate tree.*patch/i);
expectProvenanceInvalid((report) => { report.targetIdentities[0].patchSha256 = "0".repeat(64); }, /empty patch SHA-256|patch.*hash/i);
expectProvenanceInvalid((report) => { report.results[0].evidence.rawResponsePath = "epoch-2/raw.jsonl"; }, /quarantined.*epoch-2/i);
expectProvenanceInvalid((report) => {
  const orphan = { ...report.evidenceIndex.systemPrompts[0], caseId: "orphan-case" };
  report.evidenceIndex.systemPrompts.push(orphan);
}, /unexpected systemPrompts evidence identity: orphan-case/i);
expectProvenanceInvalid((report) => {
  const orphan = { ...report.evidenceIndex.rawResponses[0], caseId: "orphan-case" };
  report.evidenceIndex.rawResponses.push(orphan);
}, /unexpected rawResponses evidence identity: orphan-case/i);
expectProvenanceInvalid((report) => {
  const invalidRawPath = path.join(evidenceRoot, "invalid-terminal-lifecycle.jsonl");
  writeFileSync(invalidRawPath, piJsonl([{ type: "session" }, ...lifecycleEvents(), { type: "agent_end", willRetry: false }]));
  const invalidHash = sha256(readFileSync(invalidRawPath));
  report.results[0].evidence.rawResponsePath = invalidRawPath;
  report.results[0].evidence.rawResponseSha256 = invalidHash;
  report.results[0].sharedObservations.rawResponse = invalidRawPath;
  report.evidenceIndex.rawResponses[0].path = invalidRawPath;
  report.evidenceIndex.rawResponses[0].sha256 = invalidHash;
}, /raw response JSONL.*final agent_settled/i);

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
  (result) => result.caseId === "stable-disjoint-components" && result.target === "lite" && result.repetition === 1,
).profileResults["writing-plans"];
overlapProfile.waves[0].tasks[1].owns = ["src/a.js"];
overlapProfile.pass = false;
expectInvalid(validate(overlappingOwners), /writing-plans.*same-wave ownership/i);

const boundedOverlap = structuredClone(allResults);
const boundedOverlapProfile = boundedOverlap.find(
  (result) => result.caseId === "stable-disjoint-components" && result.target === "lite" && result.repetition === 1,
).profileResults["writing-plans"];
boundedOverlapProfile.waves[0].tasks[0].owns = ["src/**"];
boundedOverlapProfile.waves[0].tasks[1].owns = ["src/state/store.ts"];
expectInvalid(validate(boundedOverlap), /writing-plans.*same-wave ownership/i);

const sharedMutableResource = structuredClone(allResults);
const sharedResourceProfile = sharedMutableResource.find(
  (result) => result.caseId === "stable-disjoint-components" && result.target === "lite" && result.repetition === 1,
).profileResults["writing-plans"];
sharedResourceProfile.waves[0].tasks[0].mutableResources = ["db:shared"];
sharedResourceProfile.waves[0].tasks[1].mutableResources = ["db:shared"];
expectInvalid(validate(sharedMutableResource), /writing-plans.*mutable resource/i);

const unsatisfiedDependency = structuredClone(allResults);
const dependencyProfile = unsatisfiedDependency.find(
  (result) => result.caseId === "stable-disjoint-components" && result.target === "lite" && result.repetition === 1,
).profileResults["writing-plans"];
dependencyProfile.waves[0].tasks[1].dependsOn = ["task-z"];
dependencyProfile.pass = false;
expectInvalid(validate(unsatisfiedDependency), /writing-plans.*dependencies/i);

const failedL0Frontier = structuredClone(allResults);
const l0Profile = failedL0Frontier.find(
  (result) => result.caseId === "stable-disjoint-components" && result.target === "lite" && result.repetition === 1,
).profileResults["subagent-driven-development"];
l0Profile.events.find((event) => event.type === "l0").passed = false;
l0Profile.pass = false;
expectInvalid(validate(failedL0Frontier), /subagent-driven-development.*L0 frontier/i);

const syntheticGraphForSerialChain = structuredClone(allResults);
const graphlessProfile = syntheticGraphForSerialChain.find(
  (result) => result.caseId === "overlapping-ownership" && result.target === "lite" && result.repetition === 1,
).profileResults["executing-plans"];
graphlessProfile.executionShape = "graph-waves";
graphlessProfile.pass = false;
expectInvalid(validate(syntheticGraphForSerialChain), /executing-plans.*single dependency chain.*graphless/i);

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

const incompleteWaveRecovery = structuredClone(allResults);
const recoveryProfile = incompleteWaveRecovery.find(
  (result) => result.caseId === "failed-worker" && result.target === "lite" && result.repetition === 1,
).profileResults["subagent-driven-development"];
recoveryProfile.recovery.priorWaveCommitsReverted = false;
recoveryProfile.pass = false;
expectInvalid(validate(incompleteWaveRecovery), /subagent-driven-development.*restore the wave base/i);

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

const buildCapableSetup = structuredClone(allResults);
const setupProfile = buildCapableSetup.find(
  (result) => result.caseId === "missing-focused-command" && result.target === "lite" && result.repetition === 1,
).profileResults["using-git-worktrees"];
setupProfile.setupAction = "auto-build";
setupProfile.pass = false;
expectInvalid(validate(buildCapableSetup), /using-git-worktrees.*setup was not plan-declared/i);

const noMaterialCause = structuredClone(allResults);
const invalidationProfile = noMaterialCause.find(
  (result) => result.caseId === "material-invalidation" && result.target === "lite" && result.repetition === 1,
).profileResults["finishing-a-development-branch"];
delete invalidationProfile.events.find((event) => event.id === "l3-second").materialCauseEventId;
invalidationProfile.pass = false;
expectInvalid(validate(noMaterialCause), /finishing-a-development-branch.*material cause/i);

const causeBeforeFirstL3 = structuredClone(allResults);
const causeOrderingProfile = causeBeforeFirstL3.find(
  (result) => result.caseId === "material-invalidation" && result.target === "lite" && result.repetition === 1,
).profileResults["finishing-a-development-branch"];
causeOrderingProfile.events.find((event) => event.type === "material-cause").sequence = 0;
expectInvalid(validate(causeBeforeFirstL3), /finishing-a-development-branch.*intervening material cause/i);

const mismatchedReuseState = structuredClone(allResults);
const reuseProfile = mismatchedReuseState.find(
  (result) => result.caseId === "same-state-finishing" && result.target === "lite" && result.repetition === 1,
).profileResults["finishing-a-development-branch"];
const finishingEvent = reuseProfile.events.find((event) => event.type === "finishing");
finishingEvent.state = { ...finishingEvent.state, head: "f".repeat(40) };
expectInvalid(validate(mismatchedReuseState), /finishing-a-development-branch.*state fingerprint/i);

const completionBeforeL3 = structuredClone(allResults);
const completionProfile = completionBeforeL3.find(
  (result) => result.caseId === "finalization" && result.target === "lite" && result.repetition === 1,
).profileResults["subagent-driven-development"];
completionProfile.events.find((event) => event.type === "completion").sequence = 6;
expectInvalid(validate(completionBeforeL3), /subagent-driven-development.*completion.*passing.*L3/i);

const earlyLiveEffect = structuredClone(allResults);
const liveProfile = earlyLiveEffect.find(
  (result) => result.caseId === "live-effect-gate" && result.target === "lite" && result.repetition === 1,
).profileResults["subagent-driven-development"];
delete liveProfile.events.find((event) => event.type === "live-effect").approvalEventId;
liveProfile.pass = false;
expectInvalid(validate(earlyLiveEffect), /subagent-driven-development.*live effect/i);

const effectBeforeApproval = structuredClone(allResults);
const effectOrderingProfile = effectBeforeApproval.find(
  (result) => result.caseId === "live-effect-gate" && result.target === "lite" && result.repetition === 1,
).profileResults["subagent-driven-development"];
effectOrderingProfile.events.find((event) => event.type === "live-effect").sequence = 9;
expectInvalid(validate(effectBeforeApproval), /subagent-driven-development.*live effect.*approval/i);

const noPostEffectSmoke = structuredClone(allResults);
const smokeProfile = noPostEffectSmoke.find(
  (result) => result.caseId === "live-effect-gate" && result.target === "lite" && result.repetition === 1,
).profileResults["subagent-driven-development"];
smokeProfile.events = smokeProfile.events.filter((event) => event.type !== "post-effect-smoke");
expectInvalid(validate(noPostEffectSmoke), /subagent-driven-development.*post-effect smoke/i);

const packageJson = JSON.parse(readFileSync(path.join(root, "package.json"), "utf8"));
assert.equal(packageJson.files.filter((entry) => entry === "evals/execution-cases.json").length, 1);
assert.equal(
  packageJson.scripts.test.split("node tests/validate-execution-eval-report.test.mjs").length - 1,
  1,
  "validator contract test is registered exactly once",
);

console.log("execution evaluation validator contract checks passed");
