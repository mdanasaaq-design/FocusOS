import { addDoc, collection, limit, onSnapshot, orderBy, query, serverTimestamp } from "firebase/firestore";
import { db } from "../lib/firebase";

const activityPath = (uid, nodeId, ...segments) => ["users", uid, "nodes", nodeId, "activity", ...segments];

export async function logNodeActivity(uid, nodeId, { type, message, changes = [] } = {}) {
  if (!uid || !nodeId || !type) return;
  return addDoc(collection(db, ...activityPath(uid, nodeId)), {
    type,
    message: message || type,
    changes: Array.isArray(changes) ? changes : [],
    createdAt: serverTimestamp(),
  });
}

export function subscribeNodeActivity(uid, nodeId, cb, maxItems = 30) {
  if (!uid || !nodeId) return () => {};
  const q = query(
    collection(db, ...activityPath(uid, nodeId)),
    orderBy("createdAt", "desc"),
    limit(maxItems)
  );
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((item) => ({ id: item.id, ...item.data() })));
  });
}
