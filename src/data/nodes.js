// FocusOS — Generic Node Data Layer
// =====================================================================
// Firestore CRUD for the universal user-defined hierarchy/progress node
// system. Generic nodes use moduleKey "core". The legacy "study"
// namespace remains readable while Study is migrated into this model.

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
import { normalizeCapabilities } from "../modules/capabilities";

const UNIVERSAL_NODE_MODULE_KEY = "core";
const userPath = (uid, ...segments) => ["users", uid, ...segments];
const nodesPath = (uid, ...segments) => userPath(uid, "nodes", ...segments);

// ---------- Node CRUD ----------

/**
 * Create a node in the universal user-defined hierarchy.
 * moduleKey is optional for callers: new nodes always default to "core".
 * The legacy "study" namespace is accepted only for existing migration
 * code and remains subject to the same parent namespace constraint.
 *
 * @param {string} uid
 * @param {{moduleKey?: string, parentId?: string|null, name: string, order?: number, tracking: object, capabilities?: string[]}} input
 */
export async function addNode(
  uid,
  {
    moduleKey = UNIVERSAL_NODE_MODULE_KEY,
    parentId = null,
    name,
    order = 0,
    tracking,
    capabilities = [],
  }
) {
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
          `the new node's moduleKey ("${moduleKey}"). Nodes in one hierarchy must share a namespace.`
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
    capabilities: normalizeCapabilities(capabilities),
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
 * Generic field update — name, order, tracking, capabilities. Parent/path/moduleKey are
 * structural fields and cannot be changed here; use reparentNode() for
 * parent changes.
 */
export async function updateNode(uid, nodeId, data) {
  if (data.parentId !== undefined || data.path !== undefined || data.moduleKey !== undefined) {
    throw new Error(
      "updateNode: cannot change parentId/path/moduleKey here — use reparentNode() for parent changes."
    );
  }
  const patch = { updatedAt: serverTimestamp() };
  if (data.name !== undefined) patch.name = data.name;
  if (data.order !== undefined) patch.order = data.order;
  if (data.tracking !== undefined) patch.tracking = normalizeTracking(data.tracking);
  if (data.capabilities !== undefined) {
    patch.capabilities = normalizeCapabilities(data.capabilities);
  }
  return updateDoc(doc(db, ...nodesPath(uid, nodeId)), patch);
}

export const archiveNode = (uid, nodeId, archived) =>
  updateDoc(doc(db, ...nodesPath(uid, nodeId)), { archived, updatedAt: serverTimestamp() });

// Normal node removal is intentionally non-destructive. Historical values
// must remain available, so callers archive rather than hard-delete nodes.

// ---------- Listing / filtering ----------

/**
 * One-time fetch of all nodes in a namespace. Generic callers should use
 * the default "core" namespace; the optional argument is retained for
 * legacy Study migration.
 */
export async function getNodes(uid, moduleKey = UNIVERSAL_NODE_MODULE_KEY, { includeArchived = false } = {}) {
  assertValidModuleKey(moduleKey);
  const q = query(collection(db, ...nodesPath(uid)), where("moduleKey", "==", moduleKey));
  const snap = await getDocs(q);
  let nodes = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  if (!includeArchived) nodes = nodes.filter((n) => !n.archived);
  return nodes.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

/** Live subscription to all nodes in a namespace. */
export function subscribeNodes(
  uid,
  moduleKey = UNIVERSAL_NODE_MODULE_KEY,
  cb,
  { includeArchived = false } = {}
) {
  assertValidModuleKey(moduleKey);
  const q = query(collection(db, ...nodesPath(uid)), where("moduleKey", "==", moduleKey));
  return onSnapshot(q, (snap) => {
    let nodes = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    if (!includeArchived) nodes = nodes.filter((n) => !n.archived);
    nodes.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    cb(nodes);
  });
}

/** Root nodes (parentId === null) from an already-fetched node list. */
export const rootNodes = (allNodes) => allNodes.filter((n) => n.parentId === null);

// ---------- Re-parenting ----------

async function _allNodesInModuleIncludingArchived(uid, moduleKey) {
  const q = query(collection(db, ...nodesPath(uid)), where("moduleKey", "==", moduleKey));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/**
 * Move a node under a new parent, or to the root when newParentId is null.
 * Recomputes paths for the moved node and all descendants atomically.
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
      throw new Error("reparentNode: cannot move a node to a parent in a different namespace.");
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

// ---------- Per-node daily values ----------

export const setNodeValue = (uid, nodeId, value, dateKey = todayKey()) =>
  setDoc(doc(db, ...nodesPath(uid, nodeId, "values", dateKey)), {
    value,
    updatedAt: serverTimestamp(),
  });

export async function getNodeValue(uid, nodeId, dateKey = todayKey()) {
  const snap = await getDoc(doc(db, ...nodesPath(uid, nodeId, "values", dateKey)));
  return snap.exists() ? snap.data().value : null;
}

export function subscribeNodeValue(uid, nodeId, cb, dateKey = todayKey()) {
  const ref = doc(db, ...nodesPath(uid, nodeId, "values", dateKey));
  return onSnapshot(ref, (snap) => cb(snap.exists() ? snap.data().value : null));
}

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
  for (const d of snap.docs) result[d.id] = d.data().value;
  return result;
}
