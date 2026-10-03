import { addDoc, collection, doc, getDocs, onSnapshot, query, serverTimestamp, updateDoc, where, writeBatch } from "firebase/firestore";
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
    trashedAt: null,
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
  return updatePage(uid, pageId, { archived, ...(archived ? {} : { trashedAt: null }) });
}

async function getPageSubtree(uid, pageId) {
  const snapshot = await getDocs(collection(db, ...pagesPath(uid)));
  const allPages = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
  const ids = new Set([pageId]);
  let changed = true;
  while (changed) {
    changed = false;
    for (const page of allPages) {
      if (page.parentId && ids.has(page.parentId) && !ids.has(page.id)) {
        ids.add(page.id);
        changed = true;
      }
    }
  }
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

async function deletePageRelatedDocs(uid, collectionName, pageIds) {
  for (let i = 0; i < pageIds.length; i += 10) {
    const ids = pageIds.slice(i, i + 10);
    const snapshot = await getDocs(query(collection(db, "users", uid, collectionName), where("pageId", "in", ids)));
    if (snapshot.empty) continue;
    let batch = writeBatch(db);
    let count = 0;
    for (const item of snapshot.docs) {
      batch.delete(item.ref);
      count += 1;
      if (count >= 400) {
        await batch.commit();
        batch = writeBatch(db);
        count = 0;
      }
    }
    if (count) await batch.commit();
  }
}

async function deletePageNodeSubcollections(uid, pageIds) {
  const nodeIds = [];
  for (let i = 0; i < pageIds.length; i += 10) {
    const ids = pageIds.slice(i, i + 10);
    const snapshot = await getDocs(query(
      collection(db, "users", uid, "nodes"),
      where("pageId", "in", ids)
    ));
    snapshot.docs.forEach((item) => nodeIds.push(item.id));
  }

  for (const nodeId of nodeIds) {
    const subcollections = [
      collection(db, "users", uid, "nodes", nodeId, "activity"),
      collection(db, "users", uid, "nodes", nodeId, "values"),
    ];

    for (const subcollectionRef of subcollections) {
      const snapshot = await getDocs(subcollectionRef);
      if (snapshot.empty) continue;

      let batch = writeBatch(db);
      let count = 0;
      for (const item of snapshot.docs) {
        batch.delete(item.ref);
        count += 1;
        if (count >= 400) {
          await batch.commit();
          batch = writeBatch(db);
          count = 0;
        }
      }
      if (count) await batch.commit();
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
  const ids = new Set([pageId]);
  let changed = true;
  while (changed) {
    changed = false;
    for (const page of allPages) {
      if (page.parentId && ids.has(page.parentId) && !ids.has(page.id)) {
        ids.add(page.id);
        changed = true;
      }
    }
  }

  const pageIds = [...ids];

  // Delete nested Node history before deleting the Node documents that own it.
  await deletePageNodeSubcollections(uid, pageIds);
  // Delete Page-scoped activity and Node documents in bounded batches.
  await deletePageRelatedDocs(uid, "activity", pageIds);
  await deletePageRelatedDocs(uid, "nodes", pageIds);
  // Finally remove the Page documents themselves without exceeding Firestore's batch limit.
  await deletePageDocuments(uid, pageIds);
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
  if (dateKey) return updateDoc(doc(db, ...pagesPath(uid, pageId)), { [`values.${dateKey}`]: values, updatedAt: serverTimestamp() });
  return updateDoc(doc(db, ...pagesPath(uid, pageId)), { fieldValues: values, updatedAt: serverTimestamp() });
}

