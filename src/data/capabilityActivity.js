import { addDoc, collection, deleteDoc, doc, getDoc, limit as firestoreLimit, onSnapshot, query, serverTimestamp, setDoc, updateDoc, where } from "firebase/firestore";
import { db } from "../lib/firebase";
import { isRecordAssociatedWithPage, normalizePageAssociations } from "../domain/recordAssociations.js";

const path = (uid) => ["users", uid, "activity"];

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

export async function addCapabilityActivity(uid, activity = {}) {
  if (!uid) throw new Error("uid is required.");
  if (typeof activity.type !== "string" || !activity.type.trim() || activity.type.length > 100) {
    throw new Error("activity.type is required and must be at most 100 characters.");
  }
  if (typeof activity.title === "string" && activity.title.length > 500) throw new Error("activity.title must be at most 500 characters.");
  const associations = await validateActivityReferences(uid, activity);
  return addDoc(collection(db, ...path(uid)), {
    ...normalizeActivity({ ...activity, ...associations }),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function setCapabilityActivity(uid, activityId, activity = {}) {
  if (!uid || !activityId) throw new Error("uid and activityId are required.");
  const associations = await validateActivityReferences(uid, activity);
  return setDoc(doc(db, ...path(uid), activityId), {
    ...normalizeActivity({ ...activity, ...associations }),
    updatedAt: serverTimestamp(),
  }, { merge: true });
}

export function subscribeCapabilityActivity(uid, { pageId, capabilities, limit = 0, sinceDate = null, onError } = {}, cb) {
  if (!uid) return () => {};
  const constraints = [];
  // Association arrays support legacy single-page records and multi-Page records.
  // Apply the Page association filter after reading because Firestore cannot OR
  // a legacy pageId query with pageIds array membership in one portable query.
  if (sinceDate) constraints.push(where("date", ">=", sinceDate));
  if (limit > 0 && !pageId) constraints.push(firestoreLimit(limit));
  const activityQuery = constraints.length
    ? query(collection(db, ...path(uid)), ...constraints)
    : query(collection(db, ...path(uid)));
  return onSnapshot(activityQuery, (snap) => {
    let items = snap.docs.map((document) => ({ id: document.id, ...document.data() }));
    if (pageId) items = items.filter((item) => isRecordAssociatedWithPage(item, pageId));
    if (Array.isArray(capabilities) && capabilities.length) {
      const allowed = new Set(capabilities);
      items = items.filter((item) => allowed.has(item.capability));
    }
    items = items.filter((item) => !item.deletedAt);
    items.sort((a, b) => String(b.date || b.dueDate || "").localeCompare(String(a.date || a.dueDate || "")));
    cb(limit > 0 ? items.slice(0, limit) : items);
  }, onError);
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
  return updateDoc(doc(db, ...path(uid), activityId), { ...normalizedPatch, updatedAt: serverTimestamp() });
}


export async function restoreCapabilityActivity(uid, activityId) {
  if (!uid || !activityId) throw new Error("restoreCapabilityActivity: uid and activityId are required.");
  return updateDoc(doc(db, ...path(uid), activityId), { deletedAt: null, updatedAt: serverTimestamp() });
}

export async function softDeleteCapabilityActivity(uid, activityId) {
  if (!uid || !activityId) throw new Error("softDeleteCapabilityActivity: uid and activityId are required.");
  return updateDoc(doc(db, ...path(uid), activityId), { deletedAt: serverTimestamp(), updatedAt: serverTimestamp() });
}

export async function deleteCapabilityActivity(uid, activityId) {
  if (!uid || !activityId) throw new Error("deleteCapabilityActivity: uid and activityId are required.");
  return deleteDoc(doc(db, ...path(uid), activityId));
}
