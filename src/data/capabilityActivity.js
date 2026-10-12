import {
  addDoc, collection, deleteDoc, doc, getDoc, getDocs, onSnapshot, query,
  runTransaction, serverTimestamp, setDoc, updateDoc, where,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { isRecordAssociatedWithPage, normalizePageAssociations } from "../domain/recordAssociations.js";

const path = (uid) => ["users", uid, "activity"];
const taskPath = (uid, ...segments) => ["users", uid, "tasks", ...segments];
const isTaskRecord = (activity) => activity?.capability === "tasks" && activity?.type === "task";

function normalizeActivity(activity = {}) {
  const associations = normalizePageAssociations(activity);
  return {
    ...associations,
    nodeId: activity.nodeId || null,
    capability: activity.capability || "activity",
    type: activity.type || "activity",
    title: String(activity.title || "").trim(),
    date: activity.date || null,
    status: activity.status || "completed",
    durationMinutes: Number.isFinite(Number(activity.durationMinutes)) ? Number(activity.durationMinutes) : null,
    dueDate: activity.dueDate || null,
    priority: activity.priority || null,
    value: activity.value ?? null,
    unit: activity.unit || null,
    metadata: activity.metadata && typeof activity.metadata === "object" && !Array.isArray(activity.metadata) ? activity.metadata : {},
    targetId: activity.targetId || null,
    scheduleId: activity.scheduleId || null,
    source: activity.source || "page",
    deletedAt: activity.deletedAt || null,
  };
}

async function validateActivityReferences(uid, activity) {
  const associations = normalizePageAssociations(activity);
  for (const pageId of associations.pageIds) {
    const snapshot = await getDoc(doc(db, "users", uid, "pages", pageId));
    if (!snapshot.exists()) throw new Error(`Activity association references missing Page "${pageId}".`);
    const page = snapshot.data();
    if (page.archived || page.trashedAt) throw new Error(`Activity cannot be associated with archived or trashed Page "${pageId}".`);
  }
  if (activity.nodeId) {
    const snapshot = await getDoc(doc(db, "users", uid, "nodes", activity.nodeId));
    if (!snapshot.exists()) throw new Error(`Activity association references missing Node "${activity.nodeId}".`);
    if (snapshot.data().archived) throw new Error(`Activity cannot be associated with archived Node "${activity.nodeId}".`);
  }
  return associations;
}

async function resolveActivityDocument(uid, activityId) {
  const legacyRef = doc(db, ...path(uid), activityId);
  const legacySnapshot = await getDoc(legacyRef);
  if (legacySnapshot.exists()) return { ref: legacyRef, collectionName: "activity", snapshot: legacySnapshot };

  const taskRef = doc(db, ...taskPath(uid, activityId));
  const taskSnapshot = await getDoc(taskRef);
  if (taskSnapshot.exists()) return { ref: taskRef, collectionName: "tasks", snapshot: taskSnapshot };
  return { ref: legacyRef, collectionName: "activity", snapshot: null };
}

async function writeTaskRecord(uid, activityId, data, merge = false) {
  const ref = doc(db, ...taskPath(uid, activityId));
  await setDoc(ref, data, { merge });
  return ref;
}

export async function addCapabilityActivity(uid, activity = {}) {
  if (!uid) throw new Error("uid is required.");
  if (typeof activity.type !== "string" || !activity.type.trim() || activity.type.length > 100) {
    throw new Error("activity.type is required and must be at most 100 characters.");
  }
  if (typeof activity.title === "string" && activity.title.length > 500) throw new Error("activity.title must be at most 500 characters.");
  const associations = await validateActivityReferences(uid, activity);
  const data = { ...normalizeActivity({ ...activity, ...associations }), createdAt: serverTimestamp(), updatedAt: serverTimestamp() };
  if (isTaskRecord(data)) {
    const generated = doc(collection(db, ...taskPath(uid)));
    return writeTaskRecord(uid, `task_${generated.id}`, data);
  }
  return addDoc(collection(db, ...path(uid)), data);
}

export async function setCapabilityActivity(uid, activityId, activity = {}) {
  if (!uid || !activityId) throw new Error("uid and activityId are required.");
  const associations = await validateActivityReferences(uid, activity);
  const data = { ...normalizeActivity({ ...activity, ...associations }), updatedAt: serverTimestamp() };
  const existing = await getDoc(doc(db, ...path(uid), activityId));
  if (existing.exists()) {
    return setDoc(doc(db, ...path(uid), activityId), data, { merge: true });
  }
  if (isTaskRecord(data)) return writeTaskRecord(uid, activityId, data, true);
  return setDoc(doc(db, ...path(uid), activityId), data, { merge: true });
}

/**
 * Unified read adapter: legacy activity remains readable while Tasks use their
 * specialist collection. Migrated copies hide their matching legacy source.
 */
export function subscribeCapabilityActivity(uid, { pageId, capabilities, limit = 0, sinceDate = null, onError } = {}, cb) {
  if (!uid) return () => {};
  const constraints = sinceDate ? [where("date", ">=", sinceDate)] : [];
  const activityQuery = constraints.length
    ? query(collection(db, ...path(uid)), ...constraints)
    : query(collection(db, ...path(uid)));
  const tasksQuery = constraints.length
    ? query(collection(db, ...taskPath(uid)), ...constraints)
    : query(collection(db, ...taskPath(uid)));
  let activityItems = null;
  let taskItems = null;

  const emit = () => {
    if (activityItems === null || taskItems === null) return;
    const migratedLegacyIds = new Set(taskItems.map((item) => item.legacyActivityId).filter(Boolean));
    let items = [
      ...activityItems.filter((item) => !(isTaskRecord(item) && migratedLegacyIds.has(item.id))),
      ...taskItems.filter(isTaskRecord),
    ];
    if (pageId) items = items.filter((item) => isRecordAssociatedWithPage(item, pageId));
    if (Array.isArray(capabilities) && capabilities.length) {
      const allowed = new Set(capabilities);
      items = items.filter((item) => allowed.has(item.capability));
    }
    items = items.filter((item) => !item.deletedAt);
    items.sort((a, b) => String(b.date || b.dueDate || "").localeCompare(String(a.date || a.dueDate || "")));
    cb(limit > 0 ? items.slice(0, limit) : items);
  };

  const unsubscribeActivity = onSnapshot(activityQuery, (snapshot) => {
    activityItems = snapshot.docs.map((item) => ({ ...item.data(), id: item.id, recordStore: "activity" }));
    emit();
  }, onError);
  const unsubscribeTasks = onSnapshot(tasksQuery, (snapshot) => {
    taskItems = snapshot.docs.map((item) => ({ ...item.data(), id: item.id, recordStore: "tasks" }));
    emit();
  }, onError);
  return () => { unsubscribeActivity(); unsubscribeTasks(); };
}

export async function updateCapabilityActivity(uid, activityId, patch = {}) {
  if (!uid || !activityId) throw new Error("updateCapabilityActivity: uid and activityId are required.");
  let normalizedPatch = { ...patch };
  if (Object.prototype.hasOwnProperty.call(patch, "pageId") || Object.prototype.hasOwnProperty.call(patch, "pageIds")) {
    const associations = await validateActivityReferences(uid, {
      pageId: Object.prototype.hasOwnProperty.call(patch, "pageId") ? patch.pageId : null,
      pageIds: Object.prototype.hasOwnProperty.call(patch, "pageIds") ? patch.pageIds : [],
      nodeId: patch.nodeId,
    });
    normalizedPatch = { ...normalizedPatch, ...associations };
  }
  if (Object.prototype.hasOwnProperty.call(patch, "nodeId") && patch.nodeId) {
    const node = await getDoc(doc(db, "users", uid, "nodes", patch.nodeId));
    if (!node.exists() || node.data().archived) throw new Error("Activity cannot reference a missing or archived Node.");
  }

  const resolved = await resolveActivityDocument(uid, activityId);
  if (resolved.collectionName === "tasks" && resolved.snapshot?.data()?.legacyActivityId) {
    const legacyRef = doc(db, ...path(uid), resolved.snapshot.data().legacyActivityId);
    await runTransaction(db, async (transaction) => {
      const taskSnapshot = await transaction.get(resolved.ref);
      const legacySnapshot = await transaction.get(legacyRef);
      if (!taskSnapshot.exists()) throw new Error("Task no longer exists.");
      transaction.update(resolved.ref, { ...normalizedPatch, updatedAt: serverTimestamp() });
      if (legacySnapshot.exists()) transaction.update(legacyRef, { ...normalizedPatch, updatedAt: serverTimestamp() });
    });
    return;
  }
  return updateDoc(resolved.ref, { ...normalizedPatch, updatedAt: serverTimestamp() });
}

export async function restoreCapabilityActivity(uid, activityId) {
  if (!uid || !activityId) throw new Error("restoreCapabilityActivity: uid and activityId are required.");
  return updateCapabilityActivity(uid, activityId, { deletedAt: null });
}

export async function softDeleteCapabilityActivity(uid, activityId) {
  if (!uid || !activityId) throw new Error("softDeleteCapabilityActivity: uid and activityId are required.");
  return updateCapabilityActivity(uid, activityId, { deletedAt: serverTimestamp() });
}

export async function deleteCapabilityActivity(uid, activityId) {
  if (!uid || !activityId) throw new Error("deleteCapabilityActivity: uid and activityId are required.");
  const resolved = await resolveActivityDocument(uid, activityId);
  if (resolved.collectionName === "tasks" && resolved.snapshot?.data()?.legacyActivityId) {
    const legacyRef = doc(db, ...path(uid), resolved.snapshot.data().legacyActivityId);
    await runTransaction(db, async (transaction) => {
      const taskSnapshot = await transaction.get(resolved.ref);
      const legacySnapshot = await transaction.get(legacyRef);
      if (taskSnapshot.exists()) transaction.delete(resolved.ref);
      if (legacySnapshot.exists()) transaction.delete(legacyRef);
    });
    return;
  }
  return deleteDoc(resolved.ref);
}
