// FocusOS — Generic Node Hierarchy Contract
// =====================================================================
// Part of the approved architecture foundation (see CLAUDE.md and
// PROJECT_STATUS.md for the full decision record). Pure logic only: no
// Firebase, no React. Directly unit-testable with plain `node`.
//
// A node's hierarchy is defined by `parentId` (the single source of
// truth). `path` is a DERIVED, materialized convenience field — it
// exists only to make "fetch/identify a whole subtree" cheap, and is
// recomputed whenever a node is created or re-parented. Never write to
// `path` directly; always derive it from a walk of `parentId`.
//
// `path` contains ANCESTOR ids only, root-to-parent order, and EXCLUDES
// the node's own id. A root node (parentId === null) always has
// path: [].

/**
 * Compute the `path` array for a new (or re-parented) node, given its
 * new parent's own { id, path }. Pass `null` for a root-level node.
 *
 * @param {{id: string, path: string[]} | null} parent
 * @returns {string[]}
 */
export function computeNodePath(parent) {
  if (!parent) return [];
  return [...(parent.path || []), parent.id];
}

/**
 * Derive a node path by walking parentId links, never trusting a cached path.
 * Throws if an ancestor is missing or the parent chain already contains a cycle.
 */
export function computeNodePathFromParentIds(allNodes, parentId) {
  if (!parentId) return [];
  const byId = new Map(allNodes.map((node) => [node.id, node]));
  const ancestors = [];
  const visited = new Set();
  let currentId = parentId;
  while (currentId) {
    if (visited.has(currentId)) throw new Error("Node hierarchy contains a parentId cycle.");
    visited.add(currentId);
    const current = byId.get(currentId);
    if (!current) throw new Error(`Node parent "${currentId}" does not exist in this hierarchy.`);
    ancestors.push(currentId);
    currentId = current.parentId || null;
  }
  return ancestors.reverse();
}

/**
 * Validate a Node move against the authoritative parentId graph and return its
 * derived destination path. The caller should pass all Nodes from one module.
 */
export function validateNodeReparent(allNodes, nodeId, newParentId = null) {
  const node = allNodes.find((item) => item.id === nodeId);
  if (!node) throw new Error(`Node "${nodeId}" does not exist in this hierarchy.`);
  if (node.archived) throw new Error("Archived Nodes must be restored before they can be moved.");
  const parentId = newParentId || null;
  if (parentId) {
    const parent = allNodes.find((item) => item.id === parentId);
    if (!parent) throw new Error(`Parent Node "${parentId}" does not exist in this hierarchy.`);
    if (parent.archived) throw new Error("A Node cannot be moved beneath an archived parent.");
    if (parent.moduleKey !== node.moduleKey) throw new Error("A Node cannot be moved to a parent in a different module.");
  }
  if (wouldCreateCycleByParentIds(allNodes, nodeId, parentId)) {
    throw new Error("A Node cannot be moved beneath itself or one of its descendants.");
  }
  const path = computeNodePathFromParentIds(allNodes, parentId);
  if (path.some((ancestorId) => allNodes.some((ancestor) => ancestor.id === ancestorId && ancestor.archived))) {
    throw new Error("A Node cannot be moved beneath an archived ancestor.");
  }
  return { nodeId, parentId, path };
}

/**
 * Detect missing ancestors or cycles in a module's parentId graph.
 * A broken graph must be repaired before a reparent can safely recompute paths.
 */
export function hasInvalidParentChain(allNodes) {
  const byId = new Map(allNodes.map((node) => [node.id, node]));
  for (const node of allNodes) {
    const visited = new Set();
    let currentId = node.id;
    while (currentId) {
      if (visited.has(currentId)) return true;
      visited.add(currentId);
      const current = byId.get(currentId);
      if (!current) return true;
      currentId = current.parentId || null;
    }
  }
  return false;
}

/**
 * Validate a candidate parent using parentId links, which are authoritative.
 * Missing ancestors and pre-existing cycles fail closed instead of trusting path.
 */
export function wouldCreateCycleByParentIds(allNodes, nodeId, candidateParentId) {
  if (!candidateParentId) return false;
  const byId = new Map(allNodes.map((node) => [node.id, node]));
  const visited = new Set();
  let currentId = candidateParentId;
  while (currentId) {
    if (currentId === nodeId || visited.has(currentId)) return true;
    visited.add(currentId);
    const current = byId.get(currentId);
    if (!current) return true;
    currentId = current.parentId || null;
  }
  return false;
}

/**
 * Given the full list of nodes already fetched for a module/tree, and a
 * node whose own path just changed (e.g. it was re-parented), determine
 * which OTHER nodes need their `path` recomputed because this node is one
 * of their ancestors.
 *
 * Pure function — returns [{ id, path }] pairs. The caller performs the
 * actual Firestore batch write (see data/nodes.js, to be implemented
 * against this contract).
 *
 * @param {Array<{id: string, parentId: string|null, path: string[]}>} allNodes
 * @param {{id: string, path: string[]}} changedNode - the node whose path just changed
 * @returns {Array<{id: string, path: string[]}>}
 */
export function computeDescendantPathUpdates(allNodes, changedNode) {
  const byParent = new Map();
  for (const n of allNodes) {
    if (!byParent.has(n.parentId)) byParent.set(n.parentId, []);
    byParent.get(n.parentId).push(n);
  }

  const updates = [];
  const visited = new Set([changedNode.id]);
  function walk(parentNode) {
    const children = byParent.get(parentNode.id) || [];
    for (const child of children) {
      if (visited.has(child.id)) continue;
      visited.add(child.id);
      const newPath = computeNodePath(parentNode);
      updates.push({ id: child.id, path: newPath });
      walk({ ...child, path: newPath });
    }
  }
  walk(changedNode);
  return updates;
}

/**
 * Direct children of a given parentId, sorted by `order`. Pure helper for
 * rendering a tree level and for bottom-up progress aggregation (compute
 * leaves first, walk up using this to find each level's children).
 *
 * @param {Array<{id: string, parentId: string|null, order?: number}>} allNodes
 * @param {string|null} parentId
 */
export function childrenOf(allNodes, parentId) {
  return allNodes
    .filter((n) => n.parentId === parentId)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

/**
 * Return root-level nodes (nodes without a parent), sorted by `order`.
 *
 * @param {Array<{parentId: string|null, order?: number}>} allNodes
 */
export function rootNodes(allNodes) {
  return childrenOf(allNodes, null);
}

/**
 * True if `maybeAncestorId` appears in `node.path` — i.e. is one of its
 * ancestors. Use this to block re-parenting a node under its own
 * descendant (which would create a cycle).
 *
 * @param {{path?: string[]}} node
 * @param {string} maybeAncestorId
 */
export function hasAncestor(node, maybeAncestorId) {
  return Array.isArray(node.path) && node.path.includes(maybeAncestorId);
}

/**
 * True if attempting to set `node`'s parent to `candidateParentId` would
 * be invalid: either the node onto itself, or the candidate parent is
 * actually a descendant of the node (which would create a cycle).
 *
 * @param {{id: string}} node
 * @param {string|null} candidateParentId
 * @param {{id: string, path?: string[]}|null} candidateParentNode - fetched separately
 */
export function wouldCreateCycle(node, candidateParentId, candidateParentNode) {
  if (candidateParentId === node.id) return true;
  if (candidateParentNode && hasAncestor(candidateParentNode, node.id)) return true;
  return false;
}

/**
 * Rebuild every materialized path from authoritative parentId links.
 * Reject missing parents and cycles rather than guessing a repaired hierarchy.
 */
export function rebuildNodePaths(allNodes) {
  if (!Array.isArray(allNodes)) throw new Error("rebuildNodePaths: nodes must be an array.");
  const byId = new Map();
  for (const node of allNodes) {
    if (!node || typeof node.id !== "string" || !node.id) throw new Error("rebuildNodePaths: every Node needs an id.");
    if (byId.has(node.id)) throw new Error(`rebuildNodePaths: duplicate Node id "${node.id}".`);
    byId.set(node.id, node);
  }
  const state = new Map();
  const paths = new Map();
  function resolve(node) {
    const currentState = state.get(node.id) || 0;
    if (currentState === 1) throw new Error(`rebuildNodePaths: hierarchy cycle detected at Node "${node.id}".`);
    if (currentState === 2) return paths.get(node.id);
    state.set(node.id, 1);
    let path = [];
    if (node.parentId) {
      const parent = byId.get(node.parentId);
      if (!parent) throw new Error(`rebuildNodePaths: parent "${node.parentId}" for Node "${node.id}" does not exist.`);
      path = [...resolve(parent), parent.id];
    }
    paths.set(node.id, path);
    state.set(node.id, 2);
    return path;
  }
  return allNodes.map((node) => ({ id: node.id, path: [...resolve(node)] }));
}
/** Split path writes into Firestore-safe chunks below the 500-write limit. */
export function chunkNodePathWrites(writes, chunkSize = 450) {
  if (!Array.isArray(writes)) throw new Error("chunkNodePathWrites: writes must be an array.");
  if (!Number.isInteger(chunkSize) || chunkSize < 1 || chunkSize >= 500) {
    throw new Error("chunkNodePathWrites: chunkSize must be an integer from 1 to 499.");
  }
  const chunks = [];
  for (let index = 0; index < writes.length; index += chunkSize) {
    chunks.push(writes.slice(index, index + chunkSize));
  }
  return chunks;
}

/** Plan only the stale path-cache updates; safe to recompute after partial writes. */
export function planNodePathRepair(nodes) {
  const expectedPaths = rebuildNodePaths(nodes);
  const byId = new Map(nodes.map((node) => [node.id, node]));
  return expectedPaths.filter(({ id, path }) => {
    const current = byId.get(id)?.path;
    return !Array.isArray(current) || current.length !== path.length || current.some((value, index) => value !== path[index]);
  });
}

