import assert from "node:assert/strict";
import { readRepoFile } from "../helpers/skill-contract.mjs";

const routing = readRepoFile("skills/using-superpowers/SKILL.md");
const brainstorming = readRepoFile("skills/brainstorming/SKILL.md");
const planning = readRepoFile("skills/writing-plans/SKILL.md");

assert.match(routing, /docs\/superpowers\/work\/<feature>|durable authority/i,
  "Full routing must name the durable-authority handoff");
assert.match(routing, /\.superpowers\/work\/<run-id>|dynamic (?:workspace|frontier)/i,
  "Full routing must name the derived runtime workspace");
assert.doesNotMatch(routing, /intent-level plan/i,
  "Full routing must not require a committed intent-level implementation plan");

assert.match(brainstorming, /durable authority/i,
  "brainstorming must identify its output as durable authority");
assert.match(planning, /derived (?:execution )?state|runtime state/i,
  "writing-plans must identify its output as derived runtime state");
assert.match(planning, /authority.*(?:cannot|must not|does not).*(?:override|change)|(?:cannot|must not|does not).*override.*authority/is,
  "derived planning must not override durable authority");
assert.match(planning, /authority.*(?:change|hash).*(?:invalidate|stop)|(?:invalidate|stop).*(?:authority|hash)/is,
  "authority changes must invalidate derived work");
assert.match(planning, /task decomposition.*(?:does not|is not).*(?:amend|authority)|(?:does not|is not).*authority.*task decomposition/is,
  "runtime task decomposition must remain outside durable authority");

console.log("progressive workspace integration contract checks passed");
