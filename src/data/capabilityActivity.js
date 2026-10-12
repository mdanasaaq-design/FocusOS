import { addDoc, collection, deleteDoc, doc, limit as firestoreLimit, onSnapshot, orderBy, query, serverTimestamp, setDoc, updateDoc, where } from "firebase/firestore";
import { db } from "../lib/firebase";

const path = (uid) => ["users", uid, "activity"];

function normalizeActivity(activity = {}) {
  const pageIds = [...new Set([
    ...(Array.isArray(activity.pageIds) ? activity.pageIds : []),
    ...(activity.pageId ? [activity.pageId] : []),
  ].filter((id) => typeof id === "string" && id.trim()))];
  return {
    pageId: activity.pageId || pageIds[0] || null,
    pageIds,
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
  let primaryItems = [];
  let associatedItems = [];

  const emit = () => {
    const merged = new Map();
    [...primaryItems, ...associatedItems].forEach((item) => merged.set(item.id, item));
    let items = [...merged.values()];
    if (Array.isArray(capabilities) && capabilities.length) {
      const allowed = new Set(capabilities);
      items = items.filter((item) => allowed.has(item.capability));
    }
    items = items.filter((item) => !item.deletedAt && (!sinceDate || String(item.date || "") >= sinceDate));
    items.sort((a, b) => String(b.date || b.dueDate || "").localeCompare(String(a.date || a.dueDate || "")));
    cb(limit > 0 ? items.slice(0, limit) : items);
  };

  if (pageId) {
    const base = collection(db, ...path(uid));
    const stopPrimary = onSnapshot(query(base, where("pageId", "==", pageId)), (snap) => {
      primaryItems = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      emit();
    }, onError);
    const stopAssociated = onSnapshot(query(base, where("pageIds", "array-contains", pageId)), (snap) => {
      associatedItems = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      emit();
    }, onError);
    return () => {
      stopPrimary();
      stopAssociated();
    };
  }

  const constraints = [];
  if (sinceDate) constraints.push(where("date", ">=", sinceDate));
  constraints.push(orderBy("date", "desc"));
  if (limit > 0) constraints.push(firestoreLimit(limit));
  return onSnapshot(query(collection(db, ...path(uid)), ...constraints), (snap) => {
    primaryItems = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    associatedItems = [];
    emit();
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
