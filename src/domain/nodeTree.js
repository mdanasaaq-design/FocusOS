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
  function walk(parentNode) {
    const children = byParent.get(parentNode.id) || [];
    for (const child of children) {
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
