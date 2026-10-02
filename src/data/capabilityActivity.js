import { addDoc, collection, onSnapshot, query, serverTimestamp } from "firebase/firestore";
import { db } from "../lib/firebase";
const path = (uid) => ["users", uid, "activity"];
export async function addCapabilityActivity(uid, activity = {}) {
  if (!uid) throw new Error("uid is required.");
  if (!activity.type) throw new Error("activity.type is required.");
  return addDoc(collection(db, ...path(uid)), {
    pageId: activity.pageId || null, nodeId: activity.nodeId || null, capability: activity.capability || "activity",
    type: activity.type, title: String(activity.title || "").trim(), date: activity.date || null,
    status: activity.status || "completed", durationMinutes: Number.isFinite(Number(activity.durationMinutes)) ? Number(activity.durationMinutes) : null,
    dueDate: activity.dueDate || null, priority: activity.priority || "normal", value: activity.value ?? null, unit: activity.unit || null,
    metadata: activity.metadata && typeof activity.metadata === "object" ? activity.metadata : {}, createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
  });
}
export function subscribeCapabilityActivity(uid, { pageId, capabilities } = {}, cb) {
  if (!uid) return () => {};
  return onSnapshot(query(collection(db, ...path(uid))), (snap) => {
    let items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    if (pageId) items = items.filter((item) => item.pageId === pageId);
    if (Array.isArray(capabilities) && capabilities.length) { const allowed = new Set(capabilities); items = items.filter((item) => allowed.has(item.capability)); }
    items.sort((a,b) => String(b.date || b.dueDate || "").localeCompare(String(a.date || a.dueDate || "")));
    cb(items);
  });
}