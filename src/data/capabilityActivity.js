import { addDoc, collection, deleteDoc, doc, onSnapshot, query, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
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

export function subscribeCapabilityActivity(uid, { pageId, capabilities, limit = 500 } = {}, cb) {
  if (!uid) return () => {};
  return onSnapshot(query(collection(db, ...path(uid))), (snap) => {
    let items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    if (pageId) items = items.filter((item) => item.pageId === pageId);
    if (Array.isArray(capabilities) && capabilities.length) {
      const allowed = new Set(capabilities);
      items = items.filter((item) => allowed.has(item.capability));
    }
    items.sort((a, b) => String(b.date || b.dueDate || "").localeCompare(String(a.date || a.dueDate || "")));
    cb(items.slice(0, limit));
  });
}

export async function updateCapabilityActivity(uid, activityId, patch = {}) {
  if (!uid || !activityId) throw new Error("updateCapabilityActivity: uid and activityId are required.");
  return updateDoc(doc(db, ...path(uid), activityId), { ...patch, updatedAt: serverTimestamp() });
}


export async function deleteCapabilityActivity(uid, activityId) {
  if (!uid || !activityId) throw new Error("deleteCapabilityActivity: uid and activityId are required.");
  return deleteDoc(doc(db, ...path(uid), activityId));
}
