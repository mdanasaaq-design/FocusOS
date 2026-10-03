import { addDoc, collection, deleteDoc, doc, limit as firestoreLimit, onSnapshot, query, serverTimestamp, setDoc, updateDoc, where } from "firebase/firestore";
import { db } from "../lib/firebase";

const path = (uid) => ["users", uid, "activity"];

function normalizeActivity(activity = {}) {
  return {
    pageId: activity.pageId || null,
    nodeId: activity.nodeId || null,
    capability: activity.capability || "activity",
    type: activity.type || "activity",
    title: String(activity.title || "").trim(),
    date: activity.date || null,
    status: activity.status || "completed",
    durationMinutes: Number.isFinite(Number(activity.durationMinutes)) ? Number(activity.durationMinutes) : null,
    dueDate: activity.dueDate || null,
    priority: activity.priority || "normal",
    value: activity.value ?? null,
    unit: activity.unit || null,
    metadata: activity.metadata && typeof activity.metadata === "object" && !Array.isArray(activity.metadata) ? activity.metadata : {},
    targetId: activity.targetId || null,
    scheduleId: activity.scheduleId || null,
    source: activity.source || "page",
    deletedAt: activity.deletedAt || null,
  };
}

export async function addCapabilityActivity(uid, activity = {}) {
  if (!uid) throw new Error("uid is required.");
  if (!activity.type) throw new Error("activity.type is required.");
  return addDoc(collection(db, ...path(uid)), { ...normalizeActivity(activity), createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
}

export async function setCapabilityActivity(uid, activityId, activity = {}) {
  if (!uid || !activityId) throw new Error("uid and activityId are required.");
  return setDoc(doc(db, ...path(uid), activityId), { ...normalizeActivity(activity), updatedAt: serverTimestamp() }, { merge: true });
}

export function subscribeCapabilityActivity(uid, { pageId, capabilities, limit = 0, sinceDate = null, onError } = {}, cb) {
  if (!uid) return () => {};
  const constraints = [];
  if (pageId) constraints.push(where("pageId", "==", pageId));
  if (sinceDate) constraints.push(where("date", ">=", sinceDate));
  if (limit > 0) constraints.push(firestoreLimit(limit));
  const activityQuery = constraints.length ? query(collection(db, ...path(uid)), ...constraints) : query(collection(db, ...path(uid)));
  return onSnapshot(activityQuery, (snap) => {
    let items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
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
  return updateDoc(doc(db, ...path(uid), activityId), { ...patch, updatedAt: serverTimestamp() });
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
