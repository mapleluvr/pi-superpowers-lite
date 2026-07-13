import assert from "node:assert/strict";
import { validateReport } from "../scripts/validate-eval-report.mjs";

const fixtures = [
  { id: "micro", prompt: "Rename a local variable.", expected: "Micro" },
  { id: "standard", prompt: "Fix a local bug.", expected: "Standard" },
  { id: "security", prompt: "Change secret handling.", expected: "Full", safetyCritical: true },
  { id: "risk-escalation", prompt: "Reveal an authorization change.", initialExpected: "Standard", expected: "Full", requiresEscalation: true },
  { id: "explicit-full", prompt: "Request the Full workflow.", expected: "Full", required: ["brainstorming", "plan", "review"] },
];

function result(caseId, target, overrides = {}) {
  const fixture = fixtures.find((entry) => entry.id === caseId);
  return {
    caseId,
    target,
    expectedRoute: fixture.expected,
    observedRoute: fixture.expected,
    skillCalls: [],
    artifacts: [],
    subagentCalls: 0,
    reviewCalls: fixture.expected === "Full" ? 1 : 0,
    escalatedToFull: false,
    pass: true,
    ...overrides,
  };
}

function completeResults() {
  return fixtures.flatMap((fixture) => {
    const overrides = {
      ...(fixture.requiresEscalation ? { escalatedToFull: true } : {}),
      ...(fixture.required?.includes("brainstorming") ? { skillCalls: ["brainstorming"] } : {}),
      ...(fixture.required?.includes("plan") ? { artifacts: ["plan"] } : {}),
    };
    return [
      result(fixture.id, "upstream", overrides),
      result(fixture.id, "lite", overrides),
    ];
  });
}

assert.equal(validateReport({ fixtures, results: completeResults() }).valid, true);

const missingTarget = completeResults().filter((entry) => !(entry.caseId === "security" && entry.target === "lite"));
assert.equal(validateReport({ fixtures, results: missingTarget }).valid, false);

const duplicate = [...completeResults(), result("micro", "lite")];
assert.equal(validateReport({ fixtures, results: duplicate }).valid, false);

const unsafe = completeResults().map((entry) =>
  entry.caseId === "security" && entry.target === "lite" ? { ...entry, observedRoute: "Standard", reviewCalls: 0 } : entry,
);
assert.equal(validateReport({ fixtures, results: unsafe }).valid, false);

const microViolation = completeResults().map((entry) =>
  entry.caseId === "micro" && entry.target === "lite" ? { ...entry, artifacts: ["plan"] } : entry,
);
assert.equal(validateReport({ fixtures, results: microViolation }).valid, false);

const standardSubagent = completeResults().map((entry) =>
  entry.caseId === "standard" && entry.target === "lite" ? { ...entry, subagentCalls: 1 } : entry,
);
assert.equal(validateReport({ fixtures, results: standardSubagent }).valid, false);

const missingEscalation = completeResults().map((entry) =>
  entry.caseId === "risk-escalation" && entry.target === "lite" ? { ...entry, escalatedToFull: false } : entry,
);
assert.equal(validateReport({ fixtures, results: missingEscalation }).valid, false);

const missingBrainstorming = completeResults().map((entry) =>
  entry.caseId === "explicit-full" && entry.target === "lite" ? { ...entry, skillCalls: [] } : entry,
);
assert.equal(validateReport({ fixtures, results: missingBrainstorming }).valid, false);

const artifactOnlyReview = completeResults().map((entry) =>
  entry.caseId === "explicit-full" && entry.target === "lite" ? { ...entry, reviewCalls: 0, artifacts: ["plan", "review"] } : entry,
);
assert.equal(validateReport({ fixtures, results: artifactOnlyReview }).valid, false);

console.log("evaluation validator contract checks passed");
