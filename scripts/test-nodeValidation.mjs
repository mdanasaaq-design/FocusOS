// Plain-node verification for data/nodeValidation.js — run with:
//   node scripts/test-nodeValidation.mjs
//
// NOTE: data/nodes.js itself (the actual Firestore CRUD) is NOT tested
// here or anywhere with plain `node` — it transitively imports
// lib/firebase.js, which reads Vite's `import.meta.env` and throws
// immediately outside a Vite build. This matches existing project
// precedent: lib/data.js has never had direct unit tests for the same
// reason; only its pure logic (dates.js, reminders.js, timetable.js) was
// ever testable this way. This file tests everything from the node data
// layer that COULD be pulled out into pure, Firebase-free logic:
// moduleKey validation, tracking validation/normalization, name
// validation. The Firestore CRUD itself (create/read/update/archive/
// list/re-parent/daily values) was verified by code review against this
// validation layer and against the already-tested domain/nodeTree.js +
// domain/progress.js contracts, not by an automated test — there is no
// test framework or Firestore emulator set up in this environment. This
// gap is recorded honestly in PROJECT_STATUS.md rather than papered
// over with tests that don't actually exercise Firestore.

import {
  assertValidModuleKey,
  assertValidTracking,
  normalizeTracking,
  isValidNodeName,
} from "../src/data/nodeValidation.js";
import { NODE_MODULE_KEYS, MODULES } from "../src/modules/registry.js";

let failures = 0;
function check(label, actual, expected) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (!ok) {
    failures++;
    console.error(`FAIL  ${label}\n      expected: ${JSON.stringify(expected)}\n      actual:   ${JSON.stringify(actual)}`);
  } else {
    console.log(`ok    ${label}`);
  }
}
function checkThrows(label, fn) {
  try {
    fn();
    failures++;
    console.error(`FAIL  ${label} (expected throw, none happened)`);
  } catch {
    console.log(`ok    ${label}`);
  }
}
function checkNoThrow(label, fn) {
  try {
    fn();
    console.log(`ok    ${label}`);
  } catch (e) {
    failures++;
    console.error(`FAIL  ${label} (unexpected throw: ${e.message})`);
  }
}

// --- moduleKey validation ---
check("NODE_MODULE_KEYS derived from MODULES, currently just [study]", NODE_MODULE_KEYS, ["study"]);
checkNoThrow("assertValidModuleKey('study') does not throw", () => assertValidModuleKey("study"));
checkThrows("assertValidModuleKey('pomodoro') throws — nav module, not a node module", () =>
  assertValidModuleKey("pomodoro")
);
checkThrows("assertValidModuleKey('goals') throws — not yet a registered node module", () =>
  assertValidModuleKey("goals")
);
checkThrows("assertValidModuleKey(undefined) throws", () => assertValidModuleKey(undefined));
checkThrows("assertValidModuleKey('') throws", () => assertValidModuleKey(""));

// sanity: every MODULES entry with isNodeModule true is a study-like capability
check(
  "exactly one MODULES entry is currently node-backed",
  MODULES.filter((m) => m.isNodeModule).map((m) => m.key),
  ["study"]
);

// --- tracking type validation ---
for (const type of ["checkbox", "count", "duration", "target", "percentage", "manual", "derived"]) {
  checkNoThrow(`assertValidTracking accepts "${type}"`, () => assertValidTracking({ type }));
}
checkThrows("assertValidTracking rejects unknown type", () => assertValidTracking({ type: "nonsense" }));
checkThrows("assertValidTracking rejects missing type", () => assertValidTracking({}));

// --- tracking normalization (defaults + preservation) ---
check(
  "normalizeTracking fills target/unit=null, period=daily when omitted",
  normalizeTracking({ type: "checkbox" }),
  { type: "checkbox", target: null, unit: null, period: "daily" }
);
check(
  "normalizeTracking preserves explicit target/unit/period",
  normalizeTracking({ type: "count", target: 20, unit: "pages", period: "daily" }),
  { type: "count", target: 20, unit: "pages", period: "daily" }
);
check(
  "normalizeTracking preserves target: 0 (falsy but valid) rather than nulling it",
  normalizeTracking({ type: "duration", target: 0 }).target,
  0
);
checkThrows("normalizeTracking still validates type", () => normalizeTracking({ type: "bogus" }));

// --- node name validation ---
check("isValidNodeName true for normal string", isValidNodeName("UPSC"), true);
check("isValidNodeName false for empty string", isValidNodeName(""), false);
check("isValidNodeName false for whitespace-only string", isValidNodeName("   "), false);
check("isValidNodeName false for null", isValidNodeName(null), false);
check("isValidNodeName false for undefined", isValidNodeName(undefined), false);
check("isValidNodeName false for a number", isValidNodeName(42), false);

console.log(`\n${failures === 0 ? "ALL PASS" : `${failures} FAILURE(S)`}`);
process.exit(failures === 0 ? 0 : 1);
