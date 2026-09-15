// FocusOS — Generic Node Data Layer (Phase 1)
// =====================================================================
// Firestore CRUD for the generic hierarchy/progress node system. See
// CLAUDE.md "Generic node system" for the full architecture decision
// record. This file owns Firebase access; all hierarchy/path math is
// delegated to ../domain/nodeTree.js, all progress math to
// ../domain/progress.js — this file does not reimplement either.
//
// Collections:
//   users/{uid}/nodes/{nodeId}
//   users/{uid}/nodes/{nodeId}/values/{date}     (subcollection)
//
// Dependency direction (per CLAUDE.md): this file may import from
// ../domain/* and Firebase. It must never be imported by ../domain/*,
// and pages should call these functions rather than importing Firestore
// directly.

import {
  collection,
  doc,
  addDoc,
  updateDoc,
  setDoc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  where,
  orderBy,
  documentId,
  serverTimestamp,
  writeBatch,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { todayKey } from "../lib/dates";
import {
  computeNodePath,
  computeDescendantPathUpdates,
  wouldCreateCycle,
} from "../domain/nodeTree";
import {
  assertValidModuleKey,
  normalizeTracking,
  isValidNodeName,
} from "./nodeValidation";

const userPath = (uid, ...segments) => ["users", uid, ...segments];
const nodesPath = (uid, ...segments) => userPath(uid, "nodes", ...segments);

// ---------- Node CRUD ----------

/**
 * Create a new node. If parentId is given, the parent must already exist
 * (invalid-parent validation) — its `path`/`id` are used to derive the
 * new node's `path` via domain/nodeTree.js's computeNodePath, never
 * written directly. A node's moduleKey must match its parent's.
 *
 * @param {string} uid
 * @param {{moduleKey: string, parentId?: string|null, name: string, order?: number, tracking: object}} input
 */
export async function addNode(uid, { moduleKey, parentId = null, name, order = 0, tracking }) {
  assertValidModuleKey(moduleKey);
  if (!isValidNodeName(name)) {
    throw new Error("addNode: name is required and must be a non-empty string.");
  }

  let parent = null;
  if (parentId) {
    const parentSnap = await getDoc(doc(db, ...nodesPath(uid, parentId)));
    if (!parentSnap.exists()) {
      throw new Error(`addNode: parent node "${parentId}" does not exist.`);
    }
    parent = { id: parentSnap.id, ...parentSnap.data() };
    if (parent.moduleKey !== moduleKey) {
      throw new Error(
        `addNode: parent node's moduleKey ("${parent.moduleKey}") does not match ` +
          `the new node's moduleKey ("${moduleKey}"). A node's moduleKey must match its parent's.`
      );
    }
  }

  const path = computeNodePath(parent);

  return addDoc(collection(db, ...nodesPath(uid)), {
    moduleKey,
    parentId,
    path,
    name,
    order,
    archived: false,
    tracking: normalizeTracking(tracking),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

/**
 * @param {string} uid
 * @param {string} nodeId
 * @returns {Promise<object|null>}
 */
export async function getNode(uid, nodeId) {
  const snap = await getDoc(doc(db, ...nodesPath(uid, nodeId)));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

/**
 * Generic field update — name, order, tracking. Does NOT allow changing
 * parentId/path/moduleKey here; use reparentNode() for parent changes,
 * since those require descendant path updates and cycle checks, and
 * moduleKey is immutable once a node is created.
 *
 * @param {string} uid
 * @param {string} nodeId
 * @param {{name?: string, order?: number, tracking?: object}} data
 */
export async function updateNode(uid, nodeId, data) {
  if (data.parentId !== undefined || data.path !== undefined || data.moduleKey !== undefined) {
    throw new Error(
      "updateNode: cannot change parentId/path/moduleKey here — use reparentNode() " +
        "for parent changes (moduleKey is immutable once a node is created)."
    );
  }
  const patch = { updatedAt: serverTimestamp() };
  if (data.name !== undefined) patch.name = data.name;
  if (data.order !== undefined) patch.order = data.order;
  if (data.tracking !== undefined) patch.tracking = normalizeTracking(data.tracking);
  return updateDoc(doc(db, ...nodesPath(uid, nodeId)), patch);
}

/**
 * Archive/unarchive a node. Archiving NEVER touches
 * nodes/{nodeId}/values/{date} — historical daily values are preserved
 * regardless of archived state, and reappear untouched if unarchived.
 *
 * @param {string} uid
 * @param {string} nodeId
 * @param {boolean} archived
 */
export const archiveNode = (uid, nodeId, archived) =>
  updateDoc(doc(db, ...nodesPath(uid, nodeId)), { archived, updatedAt: serverTimestamp() });

// Intentionally no deleteNode(). Node removal is non-destructive by
// design — callers must use archiveNode(uid, nodeId, true). Historical
// nodes/{nodeId}/values/{date} documents, and the node's place in the
// hierarchy, must never be destroyed by a "remove" action. If a real
// hard-delete primitive is ever needed (e.g. a GDPR-style purge tool),
// it should be added deliberately and separately — not as part of the
// normal node-removal path.

// ---------- Listing / filtering ----------

/**
 * One-time fetch of all nodes for a module, optionally including
 * archived ones. Sorted by `order` client-side (avoids requiring a
 * composite index for order + moduleKey together).
 *
 * @param {string} uid
 * @param {string} moduleKey
 * @param {{includeArchived?: boolean}} [opts]
 * @returns {Promise<object[]>}
 */
export async function getNodes(uid, moduleKey, { includeArchived = false } = {}) {
  assertValidModuleKey(moduleKey);
  const q = query(collection(db, ...nodesPath(uid)), where("moduleKey", "==", moduleKey));
  const snap = await getDocs(q);
  let nodes = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  if (!includeArchived) nodes = nodes.filter((n) => !n.archived);
  return nodes.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

/**
 * Live subscription to all nodes for a module (same filtering as
 * getNodes). Returns the unsubscribe function.
 *
 * @param {string} uid
 * @param {string} moduleKey
 * @param {(nodes: object[]) => void} cb
 * @param {{includeArchived?: boolean}} [opts]
 */
export function subscribeNodes(uid, moduleKey, cb, { includeArchived = false } = {}) {
  assertValidModuleKey(moduleKey);
  const q = query(collection(db, ...nodesPath(uid)), where("moduleKey", "==", moduleKey));
  return onSnapshot(q, (snap) => {
    let nodes = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    if (!includeArchived) nodes = nodes.filter((n) => !n.archived);
    nodes.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    cb(nodes);
  });
}

/**
 * Root nodes (parentId === null) for a module, from an already-fetched
 * node list — thin convenience wrapper, does not hit Firestore itself.
 * @param {object[]} allNodes
 */
export const rootNodes = (allNodes) => allNodes.filter((n) => n.parentId === null);

// ---------- Re-parenting ----------

/**
 * Fetch every node in a module, archived or not — internal helper for
 * reparentNode. NOT exported: unlike getNodes()/subscribeNodes() (which
 * default to excluding archived nodes for UI listing purposes),
 * reparentNode's descendant walk must always see the complete tree,
 * including archived descendants, or it will silently fail to update
 * their `path` when an ancestor moves. Deliberately does not delegate to
 * getNodes() so that behavior can never be accidentally narrowed by a
 * caller-supplied {includeArchived: false} (or omitted) option.
 *
 * @param {string} uid
 * @param {string} moduleKey
 * @returns {Promise<object[]>}
 */
async function _allNodesInModuleIncludingArchived(uid, moduleKey) {
  const q = query(collection(db, ...nodesPath(uid)), where("moduleKey", "==", moduleKey));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/**
 * Move a node under a new parent (or to root if newParentId is null).
 * Validates against self-parenting and cycles (via domain/nodeTree.js's
 * wouldCreateCycle), then recomputes the node's own path and batch-writes
 * every descendant's path to match (via computeDescendantPathUpdates).
 *
 * Fetches the complete node list for the module itself — including
 * archived nodes — rather than accepting one from the caller. An
 * archived descendant (e.g. moving A when the tree is
 * A -> B -> C(archived)) must still get its `path` updated; relying on a
 * caller-supplied list risks that list having come from getNodes()'s
 * default archived-excluding behavior, silently corrupting archived
 * nodes' paths.
 *
 * @param {string} uid
 * @param {string} nodeId
 * @param {string|null} newParentId
 */
export async function reparentNode(uid, nodeId, newParentId) {
  if (newParentId === nodeId) {
    throw new Error("reparentNode: a node cannot be its own parent.");
  }

  const nodeSnap = await getDoc(doc(db, ...nodesPath(uid, nodeId)));
  if (!nodeSnap.exists()) throw new Error(`reparentNode: node "${nodeId}" not found.`);
  const node = { id: nodeSnap.id, ...nodeSnap.data() };

  let newParent = null;
  if (newParentId) {
    const parentSnap = await getDoc(doc(db, ...nodesPath(uid, newParentId)));
    if (!parentSnap.exists()) {
      throw new Error(`reparentNode: new parent "${newParentId}" not found.`);
    }
    newParent = { id: parentSnap.id, ...parentSnap.data() };
    if (newParent.moduleKey !== node.moduleKey) {
      throw new Error("reparentNode: cannot move a node to a parent in a different moduleKey.");
    }
  }

  if (wouldCreateCycle(node, newParentId, newParent)) {
    throw new Error(
      "reparentNode: cannot move a node under its own descendant — this would create a cycle."
    );
  }

  const newPath = computeNodePath(newParent);
  const updatedNode = { ...node, path: newPath };
  const allNodesInModule = await _allNodesInModuleIncludingArchived(uid, node.moduleKey);
  const descendantUpdates = computeDescendantPathUpdates(allNodesInModule, updatedNode);

  const batch = writeBatch(db);
  batch.update(doc(db, ...nodesPath(uid, nodeId)), {
    parentId: newParentId,
    path: newPath,
    updatedAt: serverTimestamp(),
  });
  for (const u of descendantUpdates) {
    batch.update(doc(db, ...nodesPath(uid, u.id)), { path: u.path });
  }
  await batch.commit();
}

// ---------- Per-node daily values: nodes/{nodeId}/values/{date} ----------

/**
 * Write a node's value for a given date (defaults to today). Uses
 * lib/dates.js's todayKey() for the deterministic "YYYY-MM-DD" date key
 * — never a second, ad-hoc date-formatting implementation (per
 * CLAUDE.md). Overwrites any existing value for that date (setDoc, not
 * addDoc) — this is intentional: a date can only have one value per node.
 *
 * @param {string} uid
 * @param {string} nodeId
 * @param {boolean|number} value
 * @param {string} [dateKey] - defaults to today
 */
export const setNodeValue = (uid, nodeId, value, dateKey = todayKey()) =>
  setDoc(doc(db, ...nodesPath(uid, nodeId, "values", dateKey)), {
    value,
    updatedAt: serverTimestamp(),
  });

/**
 * Read a node's value for a given date (defaults to today). Returns null
 * if no value has been recorded for that date.
 *
 * @param {string} uid
 * @param {string} nodeId
 * @param {string} [dateKey]
 * @returns {Promise<boolean|number|null>}
 */
export async function getNodeValue(uid, nodeId, dateKey = todayKey()) {
  const snap = await getDoc(doc(db, ...nodesPath(uid, nodeId, "values", dateKey)));
  return snap.exists() ? snap.data().value : null;
}

/**
 * Live subscription to a single node's value for a given date.
 *
 * @param {string} uid
 * @param {string} nodeId
 * @param {(value: boolean|number|null) => void} cb
 * @param {string} [dateKey]
 */
export function subscribeNodeValue(uid, nodeId, cb, dateKey = todayKey()) {
  const ref = doc(db, ...nodesPath(uid, nodeId, "values", dateKey));
  return onSnapshot(ref, (snap) => cb(snap.exists() ? snap.data().value : null));
}

/**
 * Read a node's values across an inclusive date range [startKey, endKey]
 * (both "YYYY-MM-DD" strings — deterministic and lexicographically
 * sortable, so a plain range query on the document ID works with no
 * composite index needed). Returns { [dateKey]: value }.
 *
 * @param {string} uid
 * @param {string} nodeId
 * @param {string} startKey
 * @param {string} endKey
 * @returns {Promise<Record<string, boolean|number>>}
 */
export async function getNodeValueRange(uid, nodeId, startKey, endKey) {
  const ref = collection(db, ...nodesPath(uid, nodeId, "values"));
  const q = query(
    ref,
    where(documentId(), ">=", startKey),
    where(documentId(), "<=", endKey),
    orderBy(documentId())
  );
  const snap = await getDocs(q);
  const result = {};
  for (const d of snap.docs) {
    result[d.id] = d.data().value;
  }
  return result;
}
