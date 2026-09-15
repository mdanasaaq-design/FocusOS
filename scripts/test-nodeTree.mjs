// Plain-node verification for domain/nodeTree.js — run with:
//   node scripts/test-nodeTree.mjs

import {
  computeNodePath,
  computeDescendantPathUpdates,
  childrenOf,
  hasAncestor,
  wouldCreateCycle,
} from "../src/domain/nodeTree.js";

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

// --- computeNodePath ---
check("root node (no parent) -> []", computeNodePath(null), []);
check(
  "child of a root node",
  computeNodePath({ id: "upsc", path: [] }),
  ["upsc"]
);
check(
  "grandchild — parent's path is extended with parent's own id",
  computeNodePath({ id: "geography", path: ["upsc"] }),
  ["upsc", "geography"]
);
check(
  "5-level-deep example from the approved architecture " +
    "(College > Semester5 > AI > Unit1 > NeuralNetworks)",
  computeNodePath({ id: "unit1", path: ["college", "sem5", "ai"] }),
  ["college", "sem5", "ai", "unit1"]
);

// --- childrenOf ---
const nodes = [
  { id: "upsc", parentId: null, order: 0 },
  { id: "btech", parentId: null, order: 1 },
  { id: "geography", parentId: "upsc", order: 1 },
  { id: "polity", parentId: "upsc", order: 0 },
  { id: "ai", parentId: "btech", order: 0 },
];
check(
  "childrenOf root — sorted by order, btech(1) after upsc(0)",
  childrenOf(nodes, null).map((n) => n.id),
  ["upsc", "btech"]
);
check(
  "childrenOf upsc — polity(0) before geography(1) despite array order",
  childrenOf(nodes, "upsc").map((n) => n.id),
  ["polity", "geography"]
);
check("childrenOf a leaf node with no children -> []", childrenOf(nodes, "ai").length, 0);
check("childrenOf a truly childless node -> []", childrenOf(nodes, "geography"), []);

// --- computeDescendantPathUpdates ---
const treeWithPaths = [
  { id: "college", parentId: null, path: [] },
  { id: "sem5", parentId: "college", path: ["college"] },
  { id: "ai", parentId: "sem5", path: ["college", "sem5"] },
  { id: "unit1", parentId: "ai", path: ["college", "sem5", "ai"] },
];
// Simulate re-parenting "sem5" under a new root "archive" — its path
// becomes ["archive"], and every descendant (ai, unit1) must update.
const changedSem5 = { id: "sem5", path: ["archive"] };
const updates = computeDescendantPathUpdates(treeWithPaths, changedSem5);
check(
  "re-parenting sem5 updates both descendants (ai, unit1)",
  updates.map((u) => u.id).sort(),
  ["ai", "unit1"]
);
const aiUpdate = updates.find((u) => u.id === "ai");
const unit1Update = updates.find((u) => u.id === "unit1");
check("ai's new path includes archive + sem5", aiUpdate.path, ["archive", "sem5"]);
check("unit1's new path includes archive + sem5 + ai", unit1Update.path, ["archive", "sem5", "ai"]);

check(
  "a leaf with no descendants produces no updates",
  computeDescendantPathUpdates(treeWithPaths, { id: "unit1", path: ["x"] }),
  []
);

// --- hasAncestor / wouldCreateCycle ---
check("hasAncestor true case", hasAncestor({ path: ["college", "sem5"] }, "sem5"), true);
check("hasAncestor false case", hasAncestor({ path: ["college", "sem5"] }, "ai"), false);
check("hasAncestor with no path -> false", hasAncestor({}, "sem5"), false);

check(
  "wouldCreateCycle: node onto itself",
  wouldCreateCycle({ id: "sem5" }, "sem5", null),
  true
);
check(
  "wouldCreateCycle: candidate parent is actually a descendant",
  wouldCreateCycle({ id: "sem5" }, "unit1", { id: "unit1", path: ["college", "sem5"] }),
  true
);
check(
  "wouldCreateCycle: valid re-parent, no cycle",
  wouldCreateCycle({ id: "unit1" }, "btech", { id: "btech", path: [] }),
  false
);

console.log(`\n${failures === 0 ? "ALL PASS" : `${failures} FAILURE(S)`}`);
process.exit(failures === 0 ? 0 : 1);
