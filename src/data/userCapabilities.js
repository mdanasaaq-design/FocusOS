// FocusOS — User-created capability data layer
// =====================================================================
// Stores capability definitions created by the user. Built-in capabilities
// remain in modules/capabilities.js; these definitions extend the same
// capability concept without becoming hard-coded product features.

import { collection, addDoc, doc, updateDoc, onSnapshot, query, orderBy, serverTimestamp } from "firebase/firestore";
import { db } from "../lib/firebase";

const capabilitiesPath = (uid, ...segments) => ["users", uid, "capabilities", ...segments];

export async function addUserCapability(uid, { name, description = "", fields = [], config = {} }) {
  if (!uid) throw new Error("addUserCapability: uid is required.");
  if (typeof name !== "string" || !name.trim()) throw new Error("addUserCapability: name is required.");

  return addDoc(collection(db, ...capabilitiesPath(uid)), {
    name: name.trim(),
    description: typeof description === "string" ? description.trim() : "",
    fields: Array.isArray(fields) ? fields : [],
    config: config && typeof config === "object" && !Array.isArray(config) ? config : {},
    archived: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function updateUserCapability(uid, capabilityId, data) {
  if (!uid || !capabilityId) throw new Error("updateUserCapability: uid and capabilityId are required.");
  const patch = { updatedAt: serverTimestamp() };
  if (data.name !== undefined) patch.name = String(data.name).trim();
  if (data.description !== undefined) patch.description = String(data.description).trim();
  if (data.fields !== undefined) patch.fields = Array.isArray(data.fields) ? data.fields : [];
  if (data.config !== undefined) patch.config = data.config && typeof data.config === "object" && !Array.isArray(data.config) ? data.config : {};
  if (data.archived !== undefined) patch.archived = data.archived === true;
  return updateDoc(doc(db, ...capabilitiesPath(uid, capabilityId)), patch);
}

export function subscribeUserCapabilities(uid, cb, { includeArchived = false } = {}) {
  if (!uid) return () => {};
  const q = query(collection(db, ...capabilitiesPath(uid)), orderBy("createdAt", "asc"));
  return onSnapshot(q, (snap) => {
    let capabilities = snap.docs.map((item) => ({ id: item.id, ...item.data() }));
    if (!includeArchived) capabilities = capabilities.filter((capability) => !capability.archived);
    cb(capabilities);
  });
}
