// Plain-node verification for domain/progress.js — run with:
//   node scripts/test-progress.mjs
// Follows the project's existing testing convention (see CLAUDE.md
// "Testing discipline" — recurrence/timetable math verified with
// one-off node scripts, no test framework installed).

import {
  calculateLeafProgress,
  aggregateChildrenProgress,
  computeNodeProgress,
  TRACKING_TYPES,
} from "../src/domain/progress.js";

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

// --- checkbox ---
check("checkbox true -> 100", calculateLeafProgress({ type: "checkbox" }, true), 100);
check("checkbox false -> 0", calculateLeafProgress({ type: "checkbox" }, false), 0);
check("checkbox undefined -> 0", calculateLeafProgress({ type: "checkbox" }, undefined), 0);

// --- count/duration/target ratio ---
check("count 5/10 -> 50", calculateLeafProgress({ type: "count", target: 10 }, 5), 50);
check("count 10/10 -> 100", calculateLeafProgress({ type: "count", target: 10 }, 10), 100);
check("count over target clamps to 100", calculateLeafProgress({ type: "count", target: 10 }, 15), 100);
check("duration 15/60 -> 25", calculateLeafProgress({ type: "duration", target: 60 }, 15), 25);
check("target with no target set -> 0", calculateLeafProgress({ type: "target", target: null }, 5), 0);
check("target with target=0 -> 0 (no div by zero)", calculateLeafProgress({ type: "target", target: 0 }, 5), 0);
check("count with negative actual -> 0", calculateLeafProgress({ type: "count", target: 10 }, -5), 0);

// --- percentage / manual ---
check("percentage direct", calculateLeafProgress({ type: "percentage" }, 42), 42);
check("percentage clamps over 100", calculateLeafProgress({ type: "percentage" }, 150), 100);
check("percentage clamps under 0", calculateLeafProgress({ type: "percentage" }, -10), 0);
check("manual direct", calculateLeafProgress({ type: "manual" }, 77), 77);

// --- derived throws when called via calculateLeafProgress directly ---
try {
  calculateLeafProgress({ type: "derived" }, 50);
  failures++;
  console.error("FAIL  derived should throw via calculateLeafProgress");
} catch (e) {
  console.log("ok    derived throws via calculateLeafProgress:", e.message.slice(0, 40) + "...");
}

// --- unsupported/missing type throws ---
try {
  calculateLeafProgress({ type: "nonsense" }, 1);
  failures++;
  console.error("FAIL  unsupported type should throw");
} catch {
  console.log("ok    unsupported type throws");
}

// --- aggregateChildrenProgress ---
check("average of [100, 0, 50] -> 50", aggregateChildrenProgress([100, 0, 50]), 50);
check("average of [80, 80, 80, 0, 0] (4/5 done, Namaz-style) -> 32", aggregateChildrenProgress([100, 100, 100, 100, 0]), 80);
check("empty children -> 0", aggregateChildrenProgress([]), 0);
check("non-array -> 0", aggregateChildrenProgress(null), 0);
check("out-of-range child values get clamped before averaging", aggregateChildrenProgress([150, -50]), 50);

// --- computeNodeProgress dispatch ---
check(
  "computeNodeProgress derived dispatches to aggregation",
  computeNodeProgress({ tracking: { type: "derived" } }, null, [100, 50]),
  75
);
check(
  "computeNodeProgress leaf dispatches to calculateLeafProgress",
  computeNodeProgress({ tracking: { type: "checkbox" } }, true, []),
  100
);

// --- TRACKING_TYPES sanity ---
check("all 7 tracking types present", TRACKING_TYPES.length, 7);

console.log(`\n${failures === 0 ? "ALL PASS" : `${failures} FAILURE(S)`}`);
process.exit(failures === 0 ? 0 : 1);
