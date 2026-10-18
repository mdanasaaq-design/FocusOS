// Plain-node verification for domain/nodeTree.js — run with:
//   node scripts/test-nodeTree.mjs

import { commitNodePathWriteChunks } from "../src/application/nodePathWrites.js";
import {
  computeNodePath,
  computeNodePathFromParentIds,
  computeDescendantPathUpdates,
  childrenOf,
  hasAncestor,
  wouldCreateCycle,
  wouldCreateCycleByParentIds,
  hasInvalidParentChain,
  validateNodeReparent,
  rebuildNodePaths,
  chunkNodePathWrites,
  planNodePathRepair,
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

function checkThrows(label, action) {
  let threw = false;
  try { action(); } catch { threw = true; }
  check(label, threw, true);
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

// --- parentId-authoritative path derivation and corruption checks ---
const authoritativeNodes = [
  { id: "root", parentId: null, path: [] },
  { id: "child", parentId: "root", path: ["wrong-cache"] },
  { id: "grandchild", parentId: "child", path: ["stale"] },
];
check(
  "computeNodePathFromParentIds ignores stale cached paths",
  computeNodePathFromParentIds(authoritativeNodes, "grandchild"),
  ["root", "child", "grandchild"]
);
check(
  "computeNodePathFromParentIds root -> []",
  computeNodePathFromParentIds(authoritativeNodes, null),
  []
);
checkThrows(
  "computeNodePathFromParentIds rejects missing ancestors",
  () => computeNodePathFromParentIds([{ id: "child", parentId: "missing" }], "child")
);
checkThrows(
  "computeNodePathFromParentIds rejects parentId cycles",
  () => computeNodePathFromParentIds([
    { id: "a", parentId: "b" },
    { id: "b", parentId: "a" },
  ], "a")
);
check(
  "wouldCreateCycleByParentIds catches descendants even with stale paths",
  wouldCreateCycleByParentIds([
    { id: "root", parentId: null, path: [] },
    { id: "child", parentId: "root", path: [] },
    { id: "leaf", parentId: "child", path: [] },
  ], "root", "leaf"),
  true
);
check(
  "wouldCreateCycleByParentIds allows a valid parent chain",
  wouldCreateCycleByParentIds(authoritativeNodes, "grandchild", "root"),
  false
);
check(
  "wouldCreateCycleByParentIds fails closed on corrupt parent chains",
  wouldCreateCycleByParentIds([
    { id: "a", parentId: "b" },
    { id: "b", parentId: "a" },
  ], "new-node", "a"),
  true
);
check("hasInvalidParentChain accepts a valid tree", hasInvalidParentChain(authoritativeNodes), false);
check("hasInvalidParentChain detects a missing ancestor", hasInvalidParentChain([{ id: "child", parentId: "missing" }]), true);
check("hasInvalidParentChain detects a cycle", hasInvalidParentChain([{ id: "a", parentId: "b" }, { id: "b", parentId: "a" }]), true);

const nodeMoveTree = [
  { id: "root-a", parentId: null, path: [], moduleKey: "notes" },
  { id: "root-b", parentId: null, path: [], moduleKey: "notes" },
  { id: "child", parentId: "root-a", path: ["stale"], moduleKey: "notes" },
  { id: "leaf", parentId: "child", path: ["stale"], moduleKey: "notes" },
];
check(
  "validateNodeReparent derives a destination path from parentId",
  validateNodeReparent(nodeMoveTree, "child", "root-b"),
  { nodeId: "child", parentId: "root-b", path: ["root-b"] }
);
check(
  "validateNodeReparent allows moving a Node to root",
  validateNodeReparent(nodeMoveTree, "child", null),
  { nodeId: "child", parentId: null, path: [] }
);
checkThrows("validateNodeReparent rejects self-parenting", () => validateNodeReparent(nodeMoveTree, "child", "child"));
checkThrows("validateNodeReparent rejects a descendant as parent", () => validateNodeReparent(nodeMoveTree, "root-a", "leaf"));
checkThrows(
  "validateNodeReparent rejects an archived Node",
  () => validateNodeReparent(nodeMoveTree.map((node) => node.id === "child" ? { ...node, archived: true } : node), "child", "root-b")
);
checkThrows(
  "validateNodeReparent rejects an archived parent",
  () => validateNodeReparent(nodeMoveTree.map((node) => node.id === "root-b" ? { ...node, archived: true } : node), "child", "root-b")
);
checkThrows(
  "validateNodeReparent rejects an archived ancestor",
  () => validateNodeReparent(nodeMoveTree.map((node) => node.id === "root-a" ? { ...node, archived: true } : node), "leaf", "child")
);
checkThrows(
  "validateNodeReparent rejects a parent from another module",
  () => validateNodeReparent([...nodeMoveTree, { id: "other-module-root", parentId: null, path: [], moduleKey: "habits" }], "child", "other-module-root")
);
checkThrows(
  "validateNodeReparent rejects a broken destination chain",
  () => validateNodeReparent([{ id: "child", parentId: null, moduleKey: "notes" }, { id: "parent", parentId: "missing", moduleKey: "notes" }], "child", "parent")
);
check(
  "validateNodeReparent permits moving a Node to root to break an existing cycle",
  validateNodeReparent([{ id: "a", parentId: "b", moduleKey: "notes" }, { id: "b", parentId: "a", moduleKey: "notes" }], "a", null),
  { nodeId: "a", parentId: null, path: [] }
);
check(
  "descendant path recomputation terminates on a persisted cycle",
  computeDescendantPathUpdates([
    { id: "a", parentId: "b", path: ["b"] },
    { id: "b", parentId: "a", path: ["a"] },
  ], { id: "a", path: ["new"] }).map((node) => node.id),
  ["b"]
);


const repairableTree = [
  { id: "root", parentId: null, path: ["stale"], moduleKey: "notes" },
  { id: "child", parentId: "root", path: [], moduleKey: "notes" },
  { id: "grandchild", parentId: "child", path: ["wrong"], moduleKey: "notes" },
];
check(
  "rebuildNodePaths reconstructs all paths from authoritative parentId links",
  rebuildNodePaths(repairableTree),
  [
    { id: "root", path: [] },
    { id: "child", path: ["root"] },
    { id: "grandchild", path: ["root", "child"] },
  ]
);
checkThrows(
  "rebuildNodePaths rejects missing parents",
  () => rebuildNodePaths([{ id: "child", parentId: "missing" }])
);
checkThrows(
  "rebuildNodePaths rejects parent cycles",
  () => rebuildNodePaths([{ id: "a", parentId: "b" }, { id: "b", parentId: "a" }])
);
checkThrows(
  "rebuildNodePaths rejects duplicate IDs",
  () => rebuildNodePaths([{ id: "same", parentId: null }, { id: "same", parentId: null }])
);


const manyWrites = Array.from({ length: 1001 }, (_, index) => ({ id: String(index) }));
check("Node path writes are split below Firestore's 500-write limit", chunkNodePathWrites(manyWrites).map((chunk) => chunk.length), [450, 450, 101]);
checkThrows("Node path write chunk size cannot exceed Firestore batch limit", () => chunkNodePathWrites(manyWrites, 500));

const plannedRepair = planNodePathRepair(repairableTree);
check("path repair plans only stale cached paths", plannedRepair, [
  { id: "root", path: [] },
  { id: "child", path: ["root"] },
  { id: "grandchild", path: ["root", "child"] },
]);
const firstCommittedChunk = chunkNodePathWrites(plannedRepair, 1)[0];
let partiallyRepairedTree = repairableTree.map((node) => {
  const update = firstCommittedChunk.find((item) => item.id === node.id);
  return update ? { ...node, path: update.path } : node;
});
const retryPlan = planNodePathRepair(partiallyRepairedTree);
check("repair retry excludes the already committed chunk and plans only remaining stale paths", retryPlan, [
  { id: "child", path: ["root"] },
  { id: "grandchild", path: ["root", "child"] },
]);
partiallyRepairedTree = partiallyRepairedTree.map((node) => {
  const update = retryPlan.find((item) => item.id === node.id);
  return update ? { ...node, path: update.path } : node;
});
check("a second repair pass is idempotent after reconciling a partial write", planNodePathRepair(partiallyRepairedTree), []);


 // --- Failure-injected chunk execution and retry ---
const failureInjectedTree = Array.from({ length: 451 }, (_, index) => ({
  id: `node-${index}`,
  parentId: null,
  path: ["stale-cache"],
  moduleKey: "notes",
  name: `Preserved node ${index}`,
  customData: { stable: true, index },
}));
const persistedTree = failureInjectedTree.map((node) => ({ ...node }));
let commitCount = 0;
let failedAsExpected = false;
try {
  await commitNodePathWriteChunks(planNodePathRepair(persistedTree), async (chunk) => {
    commitCount++;
    if (commitCount === 2) throw new Error("Injected second-chunk failure");
    for (const update of chunk) {
      const index = persistedTree.findIndex((node) => node.id === update.id);
      persistedTree[index] = { ...persistedTree[index], path: update.path };
    }
  });
} catch (error) {
  failedAsExpected = error.message === "Injected second-chunk failure";
}
check("chunk executor propagates a later chunk failure after earlier chunk commits", failedAsExpected, true);
check("failure injection confirms first chunk committed", persistedTree.filter((node) => node.path.length === 0).length, 450);
check("failed chunk remains stale and available for repair", persistedTree.filter((node) => node.path[0] === "stale-cache").length, 1);
check("failure does not alter unrelated persisted node data", persistedTree[0].customData, { stable: true, index: 0 });

const retryWrites = planNodePathRepair(persistedTree);
check("retry plans only the remaining stale path", retryWrites.map((node) => node.id), ["node-450"]);
await commitNodePathWriteChunks(retryWrites, async (chunk) => {
  for (const update of chunk) {
    const index = persistedTree.findIndex((node) => node.id === update.id);
    persistedTree[index] = { ...persistedTree[index], path: update.path };
  }
});
check("retry repairs every path after partial chunk success", planNodePathRepair(persistedTree), []);
check("retry preserves unrelated node data across all chunks", persistedTree.every((node, index) => node.customData?.index === index && node.name === `Preserved node ${index}`), true);

console.log(`\n${failures === 0 ? "ALL PASS" : `${failures} FAILURE(S)`}`);
process.exit(failures === 0 ? 0 : 1);
