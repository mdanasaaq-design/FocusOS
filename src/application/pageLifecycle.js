import { collectPageSubtreeIds } from "../domain/pageLifecycle.js";

/**
 * Remove a Page workspace subtree without deleting records that were shown
 * in it. Persistence operations are injected so the lifecycle contract can
 * be tested without connecting to Firestore.
 */
export async function deletePageWorkspace({
  uid,
  pageId,
  pages,
  detachPageReferences,
  deletePageDocuments,
}) {
  if (!uid || !pageId) throw new Error("uid and pageId are required.");
  if (!Array.isArray(pages)) throw new Error("pages must be an array.");
  if (typeof detachPageReferences !== "function" || typeof deletePageDocuments !== "function") {
    throw new Error("Page deletion persistence adapters are required.");
  }

  const pageIds = collectPageSubtreeIds(pages, pageId);
  const subtree = new Map(pages.map((page) => [page.id, page]));
  const notTrashed = pageIds.filter((id) => !subtree.get(id)?.trashedAt);
  if (notTrashed.length) {
    throw new Error("A Page subtree can only be permanently deleted after every descendant is in Trash.");
  }
  await detachPageReferences(uid, "nodes", pageIds);
  await detachPageReferences(uid, "activity", pageIds);
  // Specialist records must survive Page deletion just like legacy activity.
  // Keep this collection boundary explicit so future Task storage cannot retain
  // dangling Page associations when its dedicated model is enabled.
  await detachPageReferences(uid, "tasks", pageIds);
  await deletePageDocuments(uid, pageIds);
  return pageIds;
}
