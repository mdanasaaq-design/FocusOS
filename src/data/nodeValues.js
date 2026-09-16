// FocusOS — Universal node custom-field values
// =====================================================================
// Stores user-entered values separately from the node definition so field
// schemas can evolve without rewriting historical records.

import { collection, doc, getDoc, getDocs, onSnapshot, setDoc, serverTimestamp, query, orderBy, where, documentId } from "firebase/firestore";
import { db } from "../lib/firebase";

const nodeValuesPath = (uid, nodeId, ...segments) => ["users", uid, "nodes", nodeId, "values", ...segments];

export async function setNodeFieldValues(uid, nodeId, values, dateKey) {
  if (!uid || !nodeId || !dateKey) throw new Error("setNodeFieldValues: uid, nodeId and dateKey are required.");
  if (!values || typeof values !== "object" || Array.isArray(values)) throw new Error("setNodeFieldValues: values must be an object.");
  return setDoc(doc(db, ...nodeValuesPath(uid, nodeId, dateKey)), { values, updatedAt: serverTimestamp() }, { merge: true });
}

export async function getNodeFieldValues(uid, nodeId, dateKey) {
  const snap = await getDoc(doc(db, ...nodeValuesPath(uid, nodeId, dateKey)));
  return snap.exists() ? snap.data().values || {} : {};
}

export function subscribeNodeFieldValues(uid, nodeId, dateKey, cb) {
  return onSnapshot(doc(db, ...nodeValuesPath(uid, nodeId, dateKey)), (snap) => cb(snap.exists() ? snap.data().values || {} : {}));
}

export async function getNodeFieldValueRange(uid, nodeId, startKey, endKey) {
  const ref = collection(db, ...nodeValuesPath(uid, nodeId));
  const q = query(ref, where(documentId(), ">=", startKey), where(documentId(), "<=", endKey), orderBy(documentId()));
  const snap = await getDocs(q);
  const result = {};
  snap.docs.forEach((item) => { result[item.id] = item.data().values || {}; });
  return result;
}
