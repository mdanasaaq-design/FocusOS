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
};

export function normalizePageConfig(config = {}) {
  return {
    fields: Array.isArray(config.fields) ? config.fields : [],
    capabilities: Array.isArray(config.capabilities) ? config.capabilities : [],
    showChildren: config.showChildren === true,
    showInNavigation: config.showInNavigation !== false,
    navigationOrder: Number.isFinite(config.navigationOrder) ? Math.max(0, config.navigationOrder) : 0,
    showOnDashboard: config.showOnDashboard === true,
    dashboardWidgets: Array.isArray(config.dashboardWidgets) ? config.dashboardWidgets : [],
  };
}

export async function addPage(uid, { name, description = "", icon = "◆", color = "#428475" } = {}) {
  const trimmed = String(name || "").trim();
  if (!trimmed) throw new Error("Page name is required.");
  return addDoc(collection(db, ...pagesPath(uid)), {
    name: trimmed,
    description: String(description || "").trim(),
    icon: String(icon || "◆").slice(0, 4),
    color: /^#[0-9A-Fa-f]{6}$/.test(color) ? color : "#428475",
    archived: false,
    config: { ...EMPTY_PAGE_CONFIG },
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

export async function setPageValues(uid, pageId, dateKey, values) {\n  return updateDoc(doc(db, ...pagesPath(uid, pageId)), { [`values.${dateKey}`]: values, updatedAt: serverTimestamp() });\n}\n\nexport async function deletePage(uid, pageId) {
  return deleteDoc(doc(db, ...pagesPath(uid, pageId)));
}
