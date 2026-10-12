import { addDoc, collection, doc, getDoc, getDocs, onSnapshot, query, serverTimestamp, updateDoc, where, writeBatch } from "firebase/firestore";
import { db } from "../lib/firebase";
import { collectPageSubtreeIds } from "../domain/pageLifecycle";
import { deletePageWorkspace } from "../application/pageLifecycle";
import { normalizeToolViewPlacements } from "../tools/registry.js";
import { reparentPageInTree, reorderPageSiblings } from "../domain/pageTree.js";
import { removePageAssociations } from "../domain/recordAssociations.js";

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
/** Reorder a Page among its siblings without changing hierarchy or associations. */
export async function reorderPage(uid, pageId, direction) {
  if (!uid || !pageId) throw new Error("uid and pageId are required.");
  const snapshot = await getDocs(collection(db, ...pagesPath(uid)));
  const pages = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
  const reordered = reorderPageSiblings(pages, pageId, direction);
  const byId = new Map(pages.map((page) => [page.id, page]));
  const changed = reordered.filter((page) => {
    const before = byId.get(page.id);
    return before && Number(before.config?.navigationOrder || 0) !== Number(page.config?.navigationOrder || 0);
  });
  for (let index = 0; index < changed.length; index += 400) {
    const batch = writeBatch(db);
    changed.slice(index, index + 400).forEach((page) => {
      batch.update(doc(db, ...pagesPath(uid, page.id)), {
        config: normalizePageConfig(page.config),
        updatedAt: serverTimestamp(),
      });
    });
    await batch.commit();
  }
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
async function detachPageReferences(uid, collectionName, removedPageIds) {
  for (let i = 0; i < removedPageIds.length; i += 10) {
    const ids = removedPageIds.slice(i, i + 10);
    const base = collection(db, "users", uid, collectionName);
    const snapshots = [];
    snapshots.push(await getDocs(query(base, where("pageId", "in", ids))));
    if (collectionName === "activity") {
      snapshots.push(await getDocs(query(base, where("pageIds", "array-contains-any", ids))));
    }
    const uniqueDocuments = new Map();
    for (const snapshot of snapshots) {
      for (const item of snapshot.docs) uniqueDocuments.set(item.id, item);
    }
    const documents = [...uniqueDocuments.values()];
    for (let j = 0; j < documents.length; j += 400) {
      const batch = writeBatch(db);
      documents.slice(j, j + 400).forEach((item) => {
        if (collectionName === "nodes") {
          batch.update(item.ref, { pageId: null, updatedAt: serverTimestamp() });
        } else {
          const associations = removePageAssociations(item.data(), removedPageIds);
          batch.update(item.ref, { ...associations, updatedAt: serverTimestamp() });
        }
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
  const now = Date.now();
  const expired = source.filter((page) => {
    const expiry = trashExpiresAt(page);
    return page.trashedAt && expiry && expiry.getTime() <= now;
  });
  for (const page of expired) await permanentlyDeletePage(uid, page.id);
  return expired.length;
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

