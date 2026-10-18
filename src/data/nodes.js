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
  computeNodePathFromParentIds,
  computeDescendantPathUpdates,
  validateNodeReparent,
  rebuildNodePaths,
} from "../domain/nodeTree";
import {
  assertValidModuleKey,
  normalizeTracking,
  isValidNodeName,
  normalizeFields,
  normalizeNodeIdentity,
  normalizeNodePresentation,
} from "./nodeValidation";
import { normalizeCapabilities } from "../modules/capabilities";
import { logNodeActivity } from "./nodeActivity";

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
    pageId = null,
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
    if (parent.archived) throw new Error("addNode: cannot create a child under an archived node.");
    if (parent.moduleKey !== moduleKey) {
      throw new Error(
        `addNode: parent node's moduleKey ("${parent.moduleKey}") does not match ` +
          `the new node's moduleKey ("${moduleKey}"). Nodes in one hierarchy must share a namespace.`
      );
    }
  }

  const allNodesForPath = parentId ? await _allNodesInModuleIncludingArchived(uid, moduleKey) : [];
  const path = computeNodePathFromParentIds(allNodesForPath, parentId);
  if (path.some((ancestorId) => allNodesForPath.some((ancestor) => ancestor.id === ancestorId && ancestor.archived))) {
    throw new Error("addNode: cannot create a child beneath an archived ancestor.");
  }

  const ref = await addDoc(collection(db, ...nodesPath(uid)), {
    moduleKey,
    pageId,
    parentId,
    path,
    name,
    ...normalizeNodeIdentity({ description, icon, color }),
    order,
    archived: false,
    tracking: normalizeTracking(tracking),
    capabilities: normalizeCapabilities(capabilities),
    capabilityConfig: {},
    presentation: normalizeNodePresentation(),
    fields: normalizeFields(fields),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  await logNodeActivity(uid, ref.id, { type: "created", message: `Created node “${name}”.` });
  return ref;
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
  const changes = Object.keys(data).filter((key) => !["parentId", "path", "moduleKey"].includes(key));
  if (data.name !== undefined) patch.name = data.name;
  if (data.description !== undefined || data.icon !== undefined || data.color !== undefined) {
    Object.assign(patch, normalizeNodeIdentity(data));
  }
  if (data.order !== undefined) patch.order = data.order;
  if (data.tracking !== undefined) patch.tracking = normalizeTracking(data.tracking);
  if (data.capabilities !== undefined) patch.capabilities = normalizeCapabilities(data.capabilities);
  if (data.capabilityConfig !== undefined) patch.capabilityConfig = data.capabilityConfig && typeof data.capabilityConfig === "object" && !Array.isArray(data.capabilityConfig) ? data.capabilityConfig : {};
  if (data.presentation !== undefined) patch.presentation = normalizeNodePresentation(data);
  if (data.fields !== undefined) patch.fields = normalizeFields(data.fields);
  const result = await updateDoc(doc(db, ...nodesPath(uid, nodeId)), patch);
  if (changes.length) await logNodeActivity(uid, nodeId, { type: "updated", message: `Updated node settings.`, changes });
  return result;
}

export async function archiveNode(uid, nodeId, archived) {
  const result = await updateDoc(doc(db, ...nodesPath(uid, nodeId)), { archived, updatedAt: serverTimestamp() });
  await logNodeActivity(uid, nodeId, { type: archived ? "archived" : "restored", message: `${archived ? "Archived" : "Restored"} node.` });
  return result;
}

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

export async function reparentNode(uid, nodeId, newParentId = null) {
  if (!uid || !nodeId) throw new Error("reparentNode: uid and nodeId are required.");
  const parentId = newParentId || null;
  if (parentId === nodeId) throw new Error("reparentNode: a node cannot be its own parent.");
  const nodeSnap = await getDoc(doc(db, ...nodesPath(uid, nodeId)));
  if (!nodeSnap.exists()) throw new Error(`reparentNode: node "${nodeId}" not found.`);
  const node = { id: nodeSnap.id, ...nodeSnap.data() };
  if (parentId) {
    const parentSnap = await getDoc(doc(db, ...nodesPath(uid, parentId)));
    if (!parentSnap.exists()) throw new Error(`reparentNode: new parent "${parentId}" not found.`);
    const parent = { id: parentSnap.id, ...parentSnap.data() };
    if (parent.moduleKey !== node.moduleKey) throw new Error("reparentNode: cannot move a node to a parent in a different namespace.");
  }

  const allNodes = await _allNodesInModuleIncludingArchived(uid, node.moduleKey);
  const validatedMove = validateNodeReparent(allNodes, nodeId, parentId);
  const parentChanged = (node.parentId || null) !== validatedMove.parentId;
  const proposedNodes = allNodes.map((item) => item.id === nodeId ? { ...item, parentId: validatedMove.parentId } : item);
  const expectedPaths = rebuildNodePaths(proposedNodes);
  const pathById = new Map(expectedPaths.map((item) => [item.id, item.path]));
  const byId = new Map(allNodes.map((item) => [item.id, item]));
  const writes = [];
  const movedPath = pathById.get(nodeId) || [];
  if (parentChanged || !Array.isArray(node.path) || node.path.length !== movedPath.length || node.path.some((value, index) => value !== movedPath[index])) {
    writes.push({ id: nodeId, data: { ...(parentChanged ? { parentId: validatedMove.parentId } : {}), path: movedPath, updatedAt: serverTimestamp() } });
  }
  for (const expected of expectedPaths) {
    if (expected.id === nodeId) continue;
    const current = byId.get(expected.id);
    const path = expected.path;
    if (!Array.isArray(current.path) || current.path.length !== path.length || current.path.some((value, index) => value !== path[index])) {
      writes.push({ id: expected.id, data: { path, updatedAt: serverTimestamp() } });
    }
  }

  // Keep parentId authoritative and chunk path-cache writes below Firestore's
  // 500-write limit. If a later chunk fails, repairNodePaths can reconcile
  // every cached path from the committed parent graph without guessing.
  for (let index = 0; index < writes.length; index += 450) {
    const batch = writeBatch(db);
    for (const write of writes.slice(index, index + 450)) {
      batch.update(doc(db, ...nodesPath(uid, write.id)), write.data);
    }
    await batch.commit();
  }
  if (parentChanged) {
    await logNodeActivity(uid, nodeId, { type: "moved", message: parentId ? "Moved node to a new parent." : "Moved node to the root." });
  }
}

/**
 * Repair derived Node paths from the authoritative parentId graph.
 * Safe to rerun; missing parents and cycles fail closed before any writes.
 */
export async function repairNodePaths(uid, moduleKey = UNIVERSAL_NODE_MODULE_KEY) {
  if (!uid) throw new Error("repairNodePaths: uid is required.");
  assertValidModuleKey(moduleKey);
  const nodes = await _allNodesInModuleIncludingArchived(uid, moduleKey);
  const expectedPaths = rebuildNodePaths(nodes);
  const byId = new Map(nodes.map((node) => [node.id, node]));
  const changed = expectedPaths.filter(({ id, path }) => {
    const current = byId.get(id)?.path;
    return !Array.isArray(current) || current.length !== path.length || current.some((value, index) => value !== path[index]);
  });
  for (let index = 0; index < changed.length; index += 450) {
    const batch = writeBatch(db);
    for (const update of changed.slice(index, index + 450)) {
      batch.update(doc(db, ...nodesPath(uid, update.id)), { path: update.path, updatedAt: serverTimestamp() });
    }
    await batch.commit();
  }
  return { inspected: nodes.length, repaired: changed.length };
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
