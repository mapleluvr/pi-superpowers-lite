import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const TARGETS = new Set(["upstream", "lite"]);
const ROUTES = new Set(["Micro", "Standard", "Full"]);
const SAFETY_CRITICAL_IDS = new Set([
  "public-api",
  "schema-migration",
  "security",
  "authentication",
  "authorization",
  "privacy",
  "concurrency",
  "distributed-state",
]);
const MICRO_FORBIDDEN_ARTIFACTS = new Set([
  "spec",
  "plan",
  "worktree",
  "subagent",
  "review",
  "independent-review",
]);

function addError(errors, message) {
  errors.push(message);
}

function artifactNames(result) {
  return new Set((Array.isArray(result.artifacts) ? result.artifacts : []).map((value) => String(value).toLowerCase()));
}

function validateResultShape(result, fixture, errors) {
  if (!result || typeof result !== "object") {
    addError(errors, `result for ${fixture.id} is not an object`);
    return;
  }
  if (result.expectedRoute !== fixture.expected) {
    addError(errors, `${fixture.id}/${result.target} expectedRoute must be ${fixture.expected}`);
  }
  if (!ROUTES.has(result.observedRoute)) {
    addError(errors, `${fixture.id}/${result.target} observedRoute must be Micro, Standard, or Full`);
  }
  for (const field of ["skillCalls", "artifacts"]) {
    if (!Array.isArray(result[field])) addError(errors, `${fixture.id}/${result.target} ${field} must be an array`);
  }
  for (const field of ["subagentCalls", "reviewCalls"]) {
    if (!Number.isInteger(result[field]) || result[field] < 0) {
      addError(errors, `${fixture.id}/${result.target} ${field} must be a non-negative integer`);
    }
  }
  if (typeof result.escalatedToFull !== "boolean") {
    addError(errors, `${fixture.id}/${result.target} escalatedToFull must be boolean`);
  }
  if (typeof result.pass !== "boolean") addError(errors, `${fixture.id}/${result.target} pass must be boolean`);
  if (result.target === "lite" && result.pass !== true) {
    addError(errors, `${fixture.id}/lite must have pass: true`);
  }
}

function validateLiteResult(result, fixture, errors) {
  if (result.observedRoute !== fixture.expected) {
    addError(errors, `${fixture.id}/lite must observe ${fixture.expected}, got ${result.observedRoute}`);
  }

  if ((fixture.safetyCritical === true || SAFETY_CRITICAL_IDS.has(fixture.id)) && result.observedRoute !== "Full") {
    addError(errors, `${fixture.id}/lite is safety-critical and must observe Full`);
  }

  const artifacts = artifactNames(result);
  const calls = new Set((Array.isArray(result.skillCalls) ? result.skillCalls : []).map((value) => String(value).toLowerCase()));
  const forbidden = new Set((fixture.forbidden || []).map((value) => String(value).toLowerCase()));
  for (const name of forbidden) {
    if (artifacts.has(name)) addError(errors, `${fixture.id}/lite has forbidden artifact: ${name}`);
    if (name === "subagent" && result.subagentCalls > 0) addError(errors, `${fixture.id}/lite has forbidden subagent calls`);
    if ((name === "review" || name === "independent-review") && result.reviewCalls > 0) {
      addError(errors, `${fixture.id}/lite has forbidden review calls`);
    }
  }

  if (result.observedRoute === "Micro") {
    const microForbidden = [...MICRO_FORBIDDEN_ARTIFACTS].filter((name) => artifacts.has(name));
    if (microForbidden.length > 0) addError(errors, `${fixture.id}/lite Micro has forbidden artifacts: ${microForbidden.join(", ")}`);
    if (result.subagentCalls !== 0) addError(errors, `${fixture.id}/lite Micro must not call subagents`);
    if (result.reviewCalls !== 0) addError(errors, `${fixture.id}/lite Micro must not request independent review`);
  }

  if (result.observedRoute === "Standard" && result.subagentCalls > 0 && !result.escalatedToFull) {
    addError(errors, `${fixture.id}/lite Standard cannot call a subagent without escalation`);
  }

  for (const required of fixture.required || []) {
    const name = String(required).toLowerCase();
    if (name === "review" && result.reviewCalls < 1) {
      addError(errors, `${fixture.id}/lite requires at least one review call`);
    }
    if (name === "plan" && !artifacts.has("plan")) addError(errors, `${fixture.id}/lite requires plan evidence`);
    if (name === "brainstorming" && !calls.has("brainstorming")) {
      addError(errors, `${fixture.id}/lite requires brainstorming evidence`);
    }
  }

  if (fixture.requiresEscalation === true) {
    if (result.observedRoute !== "Full") addError(errors, "risk-escalation/lite must observe Full");
    if (result.escalatedToFull !== true) addError(errors, "risk-escalation/lite must set escalatedToFull: true");
  }
}

export function validateReport({ fixtures, results }) {
  const errors = [];
  if (!Array.isArray(fixtures)) return { valid: false, errors: ["fixtures must be an array"] };
  if (!Array.isArray(results)) return { valid: false, errors: ["results must be an array"] };

  const fixtureMap = new Map();
  for (const fixture of fixtures) {
    if (!fixture || typeof fixture.id !== "string") {
      addError(errors, "every fixture must have a string id");
      continue;
    }
    if (fixtureMap.has(fixture.id)) addError(errors, `duplicate fixture id: ${fixture.id}`);
    fixtureMap.set(fixture.id, fixture);
  }

  const pairs = new Map();
  for (const result of results) {
    const key = `${result?.caseId}\u0000${result?.target}`;
    if (pairs.has(key)) addError(errors, `duplicate result pair: ${result?.caseId}/${result?.target}`);
    pairs.set(key, result);
    if (!fixtureMap.has(result?.caseId)) {
      addError(errors, `result references unknown fixture: ${result?.caseId}`);
      continue;
    }
    if (!TARGETS.has(result?.target)) {
      addError(errors, `result target must be upstream or lite: ${result?.target}`);
      continue;
    }
    const fixture = fixtureMap.get(result.caseId);
    validateResultShape(result, fixture, errors);
    if (result.target === "lite") validateLiteResult(result, fixture, errors);
  }

  for (const fixture of fixtureMap.values()) {
    for (const target of TARGETS) {
      const key = `${fixture.id}\u0000${target}`;
      if (!pairs.has(key)) addError(errors, `missing result pair: ${fixture.id}/${target}`);
    }
  }

  return { valid: errors.length === 0, errors };
}

function runCli() {
  const resultPath = process.argv[2];
  if (!resultPath) {
    console.error("Usage: node scripts/validate-eval-report.mjs <result.json>");
    process.exitCode = 2;
    return;
  }
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  const fixtures = JSON.parse(readFileSync(path.join(root, "evals", "routing-cases.json"), "utf8"));
  const document = JSON.parse(readFileSync(path.resolve(resultPath), "utf8"));
  const results = Array.isArray(document) ? document : document?.results;
  const validation = validateReport({ fixtures, results });
  if (!validation.valid) {
    console.error(validation.errors.join("\n"));
    process.exitCode = 1;
    return;
  }
  console.log(`evaluation report valid: ${results.length} records`);
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : "";
if (invokedPath === path.resolve(fileURLToPath(import.meta.url))) runCli();
