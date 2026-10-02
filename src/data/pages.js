import { addDoc, collection, deleteDoc, doc, onSnapshot, serverTimestamp, updateDoc } from "firebase/firestore";
import { db } from "../lib/firebase";

const pagesPath = (uid, ...segments) => ["users", uid, "pages", ...segments];

export const EMPTY_PAGE_CONFIG = {
  fields: [],
  capabilities: [],
  showChildren: false,
  showInNavigation: true,
  navigationOrder: 0,
  showOnDashboard: false,
  dashboardWidgets: [],
  trackers: [],
};

export function normalizePageConfig(config = {}) {
  return {
    fields: Array.isArray(config.fields) ? config.fields : [],
    capabilities: Array.isArray(config.capabilities) ? config.capabilities : [],
    showChildren: config.showChildren === true,
    showInNavigation: config.showInNavigation === true,
    navigationOrder: Number.isFinite(config.navigationOrder) ? Math.max(0, config.navigationOrder) : 0,
    showOnDashboard: config.showOnDashboard === true,
    dashboardWidgets: Array.isArray(config.dashboardWidgets) ? config.dashboardWidgets : [],
    trackers: Array.isArray(config.trackers) ? config.trackers.map((tracker, index) => ({ id: tracker.id || `tracker-${index + 1}`, name: String(tracker.name || `Tracker ${index + 1}`), type: tracker.type || "number", unit: String(tracker.unit || ""), target: tracker.target ?? "", color: tracker.color || "#428475" })) : [],
    capabilityConfig: config.capabilityConfig && typeof config.capabilityConfig === "object" && !Array.isArray(config.capabilityConfig) ? config.capabilityConfig : {},
  };
}

export async function addPage(uid, { name, description = "", icon = "◆", color = "#428475", parentId = null } = {}) {
  const trimmed = String(name || "").trim();
  if (!trimmed) throw new Error("Page name is required.");
  return addDoc(collection(db, ...pagesPath(uid)), {
    name: trimmed,
    description: String(description || "").trim(),
    icon: String(icon || "◆").slice(0, 4),
    color: /^#[0-9A-Fa-f]{6}$/.test(color) ? color : "#428475",
    parentId: parentId || null,
    archived: false,
    config: { ...EMPTY_PAGE_CONFIG, capabilityConfig: {} },
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function updatePage(uid, pageId, data = {}) {
  const patch = { ...data, updatedAt: serverTimestamp() };
  if (patch.config) patch.config = normalizePageConfig(patch.config);
  return updateDoc(doc(db, ...pagesPath(uid, pageId)), patch);
}

export async function archivePage(uid, pageId, archived = true) {
  return updatePage(uid, pageId, { archived });
}

export function subscribePages(uid, cb, { includeArchived = false } = {}) {
  if (!uid) return () => {};
  return onSnapshot(collection(db, ...pagesPath(uid)), (snap) => {
    let pages = snap.docs.map((item) => ({ id: item.id, ...item.data() }));
    if (!includeArchived) pages = pages.filter((page) => !page.archived);
    pages.sort((a, b) => (a.config?.navigationOrder ?? 0) - (b.config?.navigationOrder ?? 0) || a.name.localeCompare(b.name));
    cb(pages);
  });
}

export function subscribePage(uid, pageId, cb) {
  if (!uid || !pageId) return () => {};
  return onSnapshot(doc(db, ...pagesPath(uid, pageId)), (snap) => {
    cb(snap.exists() ? { id: snap.id, ...snap.data() } : null);
  });
}

export async function setPageValues(uid, pageId, dateKey, values) {
  return updateDoc(doc(db, ...pagesPath(uid, pageId)), { [`values.${dateKey}`]: values, updatedAt: serverTimestamp() });
}

export async function deletePage(uid, pageId) {
  return deleteDoc(doc(db, ...pagesPath(uid, pageId)));
}
