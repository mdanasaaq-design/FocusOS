import { addDoc, collection, doc, getDoc, getDocs, onSnapshot, query, serverTimestamp, updateDoc, where, writeBatch } from "firebase/firestore";
import { db } from "../lib/firebase";
import { collectPageSubtreeIds, getExpiredTrashPlan } from "../domain/pageLifecycle";
import { deletePageWorkspace } from "../application/pageLifecycle";
import { normalizeToolViewPlacements } from "../tools/registry.js";
import { reparentPageInTree } from "../domain/pageTree.js";

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
  toolViews: [],
};

export function normalizePageConfig(config = {}) {
  return {
    fields: Array.isArray(config.fields) ? config.fields : [],
    capabilities: Array.isArray(config.capabilities) ? config.capabilities : [],
    showChildren: config.showChildren === true,
    showInNavigation: config.showInNavigation === true || config.showOnDashboard === true,
    navigationOrder: Number.isFinite(config.navigationOrder) ? Math.max(0, config.navigationOrder) : 0,
    showOnDashboard: config.showOnDashboard === true,
    dashboardWidgets: Array.isArray(config.dashboardWidgets) ? config.dashboardWidgets : [],
    trackers: Array.isArray(config.trackers) ? config.trackers.map((tracker, index) => ({ id: tracker.id || `tracker-${index + 1}`, name: String(tracker.name || `Tracker ${index + 1}`), type: tracker.type || "number", unit: String(tracker.unit || ""), target: tracker.target ?? "", color: tracker.color || "#428475" })) : [],
    capabilityConfig: config.capabilityConfig && typeof config.capabilityConfig === "object" && !Array.isArray(config.capabilityConfig) ? config.capabilityConfig : {},
    toolViews: normalizeToolViewPlacements(config.toolViews),
  };
}

export async function addPage(uid, { name, description = "", icon = "◆", color = "#428475", parentId = null } = {}) {
  const trimmed = String(name || "").trim();
  if (!uid) throw new Error("uid is required.");
  if (!trimmed) throw new Error("Page name is required.");
  if (parentId) {
    const parentSnapshot = await getDoc(doc(db, ...pagesPath(uid, parentId)));
    if (!parentSnapshot.exists()) throw new Error("addPage: parent Page does not exist.");
    const parent = parentSnapshot.data();
    if (parent.archived || parent.trashedAt) throw new Error("addPage: cannot create a child under an archived or trashed Page.");
  }
  return addDoc(collection(db, ...pagesPath(uid)), {
    name: trimmed,
    description: String(description || "").trim(),
    icon: String(icon || "◆").slice(0, 4),
    color: /^#[0-9A-Fa-f]{6}$/.test(color) ? color : "#428475",
    parentId: parentId || null,
    archived: false,
    trashedAt: null,
    config: { ...EMPTY_PAGE_CONFIG, capabilityConfig: {} },
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

/** Move a Page by changing only its parentId. Descendants and records are untouched. */
export async function reparentPage(uid, pageId, newParentId = null) {
  if (!uid || !pageId) throw new Error("uid and pageId are required.");
  const snapshot = await getDocs(collection(db, ...pagesPath(uid)));
  const pages = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
  const updatedTree = reparentPageInTree(pages, pageId, newParentId);
  const movedPage = updatedTree.find((item) => item.id === pageId);
  const currentPage = pages.find((item) => item.id === pageId);
  if ((currentPage.parentId || null) === movedPage.parentId) return;
  await updateDoc(doc(db, ...pagesPath(uid, pageId)), {
    parentId: movedPage.parentId,
    updatedAt: serverTimestamp(),
  });
}
export async function updatePage(uid, pageId, data = {}) {
  if (Object.prototype.hasOwnProperty.call(data, "parentId")) {
    throw new Error("updatePage: parentId changes must use reparentPage().");
  }
  const patch = { ...data, updatedAt: serverTimestamp() };
  if (patch.config) patch.config = normalizePageConfig(patch.config);
  return updateDoc(doc(db, ...pagesPath(uid, pageId)), patch);
}

export async function archivePage(uid, pageId, archived = true) {
  return updatePage(uid, pageId, { archived, ...(archived ? {} : { trashedAt: null }) });
}

async function getPageSubtree(uid, pageId) {
  const snapshot = await getDocs(collection(db, ...pagesPath(uid)));
  const allPages = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
  const ids = new Set(collectPageSubtreeIds(allPages, pageId));
  return allPages.filter((page) => ids.has(page.id));
}

export async function trashPage(uid, pageId) {
  if (!uid || !pageId) throw new Error("uid and pageId are required.");
  const subtree = await getPageSubtree(uid, pageId);
  const trashedAt = serverTimestamp();
  for (let i = 0; i < subtree.length; i += 400) {
    const batch = writeBatch(db);
    subtree.slice(i, i + 400).forEach((page) => {
      batch.update(doc(db, ...pagesPath(uid, page.id)), { archived: true, trashedAt, updatedAt: trashedAt });
    });
    await batch.commit();
  }
}

export async function restorePage(uid, pageId) {
  if (!uid || !pageId) throw new Error("uid and pageId are required.");
  const subtree = await getPageSubtree(uid, pageId);
  for (let i = 0; i < subtree.length; i += 400) {
    const batch = writeBatch(db);
    subtree.slice(i, i + 400).forEach((page) => {
      batch.update(doc(db, ...pagesPath(uid, page.id)), { archived: false, trashedAt: null, updatedAt: serverTimestamp() });
    });
    await batch.commit();
  }
}

export function trashExpiresAt(page) {
  const raw = page?.trashedAt;
  const date = raw?.toDate ? raw.toDate() : raw ? new Date(raw) : null;
  if (!date || Number.isNaN(date.getTime())) return null;
  return new Date(date.getTime() + 30 * 24 * 60 * 60 * 1000);
}

// A Page is workspace structure, not the owner of the records displayed
// inside it. When the Page (or its subtree) is permanently removed, detach
// Page references from Nodes and activity records but preserve those records
// and all Node subcollections/history.
async function detachPageReferences(uid, collectionName, pageIds) {
  for (let i = 0; i < pageIds.length; i += 10) {
    const ids = pageIds.slice(i, i + 10);
    const source = collection(db, "users", uid, collectionName);
    const [primarySnapshot, associatedSnapshot] = await Promise.all([
      getDocs(query(source, where("pageId", "in", ids))),
      getDocs(query(source, where("pageIds", "array-contains-any", ids))),
    ]);
    const records = new Map();
    [...primarySnapshot.docs, ...associatedSnapshot.docs].forEach((item) => records.set(item.id, item));
    const matched = [...records.values()];
    if (!matched.length) continue;

    for (let j = 0; j < matched.length; j += 400) {
      const batch = writeBatch(db);
      matched.slice(j, j + 400).forEach((item) => {
        const data = item.data();
        const existingPageIds = Array.isArray(data.pageIds) ? data.pageIds : [];
        const remainingPageIds = existingPageIds.filter((id) => !ids.includes(id));
        const patch = {};
        if (ids.includes(data.pageId) || (!data.pageId && remainingPageIds.length)) patch.pageId = remainingPageIds[0] || null;
        if (Array.isArray(data.pageIds) || (collectionName === "activity" && ids.includes(data.pageId))) patch.pageIds = remainingPageIds;
        if (collectionName === "nodes") patch.updatedAt = serverTimestamp();
        batch.update(item.ref, patch);
      });
      await batch.commit();
    }
  }
}

async function deletePageDocuments(uid, pageIds) {
  for (let i = 0; i < pageIds.length; i += 400) {
    const batch = writeBatch(db);
    pageIds.slice(i, i + 400).forEach((id) => {
      batch.delete(doc(db, ...pagesPath(uid, id)));
    });
    await batch.commit();
  }
}

export async function permanentlyDeletePage(uid, pageId) {
  if (!uid || !pageId) throw new Error("uid and pageId are required.");
  const pagesSnapshot = await getDocs(collection(db, ...pagesPath(uid)));
  const allPages = pagesSnapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
  await deletePageWorkspace({
    uid,
    pageId,
    pages: allPages,
    detachPageReferences,
    deletePageDocuments,
  });
}

export async function purgeExpiredTrash(uid, pages = null) {
  if (!uid) return 0;
  const source = Array.isArray(pages) ? pages : (await getDocs(collection(db, ...pagesPath(uid)))).docs.map((item) => ({ id: item.id, ...item.data() }));
  const plan = getExpiredTrashPlan(source, Date.now());
  const expiredRoots = new Set(plan.rootIds);
  for (const page of source) {
    if (expiredRoots.has(page.id)) await permanentlyDeletePage(uid, page.id);
  }
  // Return the number of expired Page documents, not only the number of roots.
  return plan.expiredIds.length;
}

export function subscribePages(uid, cb, { includeArchived = false } = {}) {
  if (!uid) return () => {};
  return onSnapshot(collection(db, ...pagesPath(uid)), (snap) => {
    let pages = snap.docs.map((item) => ({ id: item.id, ...item.data() }));
    if (!includeArchived) pages = pages.filter((page) => !page.archived && !page.trashedAt);
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
  if (dateKey) return updateDoc(doc(db, ...pagesPath(uid, pageId)), { [`values.${dateKey}`]: values, updatedAt: serverTimestamp() });
  return updateDoc(doc(db, ...pagesPath(uid, pageId)), { fieldValues: values, updatedAt: serverTimestamp() });
}

