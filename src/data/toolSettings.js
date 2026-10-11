import { doc, onSnapshot, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { TOOL_DEFINITIONS, normalizeToolGlobalConfig } from "../tools/registry.js";

const settingsPath = (uid) => ["users", uid, "config", "tools"];

/** Return validated defaults for every registered tool, including tools without settings. */
export function normalizeUserToolSettings(value = {}) {
  const source = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  const global = source.global && typeof source.global === "object" && !Array.isArray(source.global) ? source.global : {};
  return Object.fromEntries(
    TOOL_DEFINITIONS.map((tool) => [tool.key, normalizeToolGlobalConfig(tool.key, global[tool.key])])
  );
}

export function subscribeToolSettings(uid, callback, onError) {
  if (!uid) return () => {};
  return onSnapshot(doc(db, ...settingsPath(uid)), (snapshot) => {
    callback(normalizeUserToolSettings(snapshot.exists() ? snapshot.data() : {}));
  }, onError);
}

export async function updateToolGlobalConfig(uid, toolKey, config = {}) {
  if (!uid) throw new Error("updateToolGlobalConfig: uid is required.");
  const normalized = normalizeToolGlobalConfig(toolKey, config);
  return setDoc(doc(db, ...settingsPath(uid)), {
    global: { [toolKey]: normalized },
    updatedAt: serverTimestamp(),
  }, { merge: true });
}
