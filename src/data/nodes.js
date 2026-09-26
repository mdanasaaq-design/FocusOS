// FocusOS — Generic Node Data Layer
// =====================================================================
// Firestore CRUD for the universal user-defined hierarchy/progress node
// system. Generic nodes use moduleKey "core". The legacy "study" namespace
// remains readable while Study is migrated into this model.

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
  normalizeFields,
  normalizeNodeIdentity,
} from "./nodeValidation";
import { normalizeCapabilities } from "../modules/capabilities";

const UNIVERSAL_NODE_MODULE_KEY = "core";
const userPath = (uid, ...segments) => ["users", uid, ...segments];
const nodesPath = (uid, ...segments) => userPath(uid, "nodes", ...segments);

export async function addNode(
  uid,
  {
    moduleKey = UNIVERSAL_NODE_MODULE_KEY,
    parentId = null,
    name,
    description = "",
    icon,
    color,
    order = 0,
    tracking,
    capabilities = [],
    fields = [],
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
    ...normalizeNodeIdentity({ description, icon, color }),
    order,
    archived: false,
    tracking: normalizeTracking(tracking),
    capabilities: normalizeCapabilities(capabilities),
    capabilityConfig: {},
    fields: normalizeFields(fields),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function getNode(uid, nodeId) {
  const snap = await getDoc(doc(db, ...nodesPath(uid, nodeId)));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function updateNode(uid, nodeId, data) {
  if (data.parentId !== undefined || data.path !== undefined || data.moduleKey !== undefined) {
    throw new Error(
      "updateNode: cannot change parentId/path/moduleKey here — use reparentNode() for parent changes."
    );
  }
  const patch = { updatedAt: serverTimestamp() };
  if (data.name !== undefined) patch.name = data.name;
  if (data.description !== undefined || data.icon !== undefined || data.color !== undefined) {
    Object.assign(patch, normalizeNodeIdentity(data));
  }
  if (data.order !== undefined) patch.order = data.order;
  if (data.tracking !== undefined) patch.tracking = normalizeTracking(data.tracking);
  if (data.capabilities !== undefined) patch.capabilities = normalizeCapabilities(data.capabilities);
  if (data.capabilityConfig !== undefined) patch.capabilityConfig = data.capabilityConfig && typeof data.capabilityConfig === "object" && !Array.isArray(data.capabilityConfig) ? data.capabilityConfig : {};
  if (data.fields !== undefined) patch.fields = normalizeFields(data.fields);
  return updateDoc(doc(db, ...nodesPath(uid, nodeId)), patch);
}

export const archiveNode = (uid, nodeId, archived) =>
  updateDoc(doc(db, ...nodesPath(uid, nodeId)), { archived, updatedAt: serverTimestamp() });

export async function getNodes(uid, moduleKey = UNIVERSAL_NODE_MODULE_KEY, { includeArchived = false } = {}) {
  assertValidModuleKey(moduleKey);
  const q = query(collection(db, ...nodesPath(uid)), where("moduleKey", "==", moduleKey));
  const snap = await getDocs(q);
  let nodes = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  if (!includeArchived) nodes = nodes.filter((n) => !n.archived);
  return nodes.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

export function subscribeNodes(uid, moduleKey = UNIVERSAL_NODE_MODULE_KEY, cb, { includeArchived = false } = {}) {
  assertValidModuleKey(moduleKey);
  const q = query(collection(db, ...nodesPath(uid)), where("moduleKey", "==", moduleKey));
  return onSnapshot(q, (snap) => {
    let nodes = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    if (!includeArchived) nodes = nodes.filter((n) => !n.archived);
    nodes.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    cb(nodes);
  });
}

export const rootNodes = (allNodes) => allNodes.filter((n) => n.parentId === null);

async function _allNodesInModuleIncludingArchived(uid, moduleKey) {
  const q = query(collection(db, ...nodesPath(uid)), where("moduleKey", "==", moduleKey));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function reparentNode(uid, nodeId, newParentId) {
  if (newParentId === nodeId) throw new Error("reparentNode: a node cannot be its own parent.");
  const nodeSnap = await getDoc(doc(db, ...nodesPath(uid, nodeId)));
  if (!nodeSnap.exists()) throw new Error(`reparentNode: node "${nodeId}" not found.`);
  const node = { id: nodeSnap.id, ...nodeSnap.data() };
  let newParent = null;
  if (newParentId) {
    const parentSnap = await getDoc(doc(db, ...nodesPath(uid, newParentId)));
    if (!parentSnap.exists()) throw new Error(`reparentNode: new parent "${newParentId}" not found.`);
    newParent = { id: parentSnap.id, ...parentSnap.data() };
    if (newParent.moduleKey !== node.moduleKey) throw new Error("reparentNode: cannot move a node to a parent in a different namespace.");
  }
  if (wouldCreateCycle(node, newParentId, newParent)) throw new Error("reparentNode: cannot move a node under its own descendant — this would create a cycle.");
  const newPath = computeNodePath(newParent);
  const updatedNode = { ...node, path: newPath };
  const allNodesInModule = await _allNodesInModuleIncludingArchived(uid, node.moduleKey);
  const descendantUpdates = computeDescendantPathUpdates(allNodesInModule, updatedNode);
  const batch = writeBatch(db);
  batch.update(doc(db, ...nodesPath(uid, nodeId)), { parentId: newParentId, path: newPath, updatedAt: serverTimestamp() });
  for (const u of descendantUpdates) batch.update(doc(db, ...nodesPath(uid, u.id)), { path: u.path });
  await batch.commit();
}

export const setNodeValue = (uid, nodeId, value, dateKey = todayKey()) =>
  setDoc(doc(db, ...nodesPath(uid, nodeId, "values", dateKey)), { value, updatedAt: serverTimestamp() });

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
  const q = query(ref, where(documentId(), ">=", startKey), where(documentId(), "<=", endKey), orderBy(documentId()));
  const snap = await getDocs(q);
  const result = {};
  for (const d of snap.docs) result[d.id] = d.data().value;
  return result;
}
