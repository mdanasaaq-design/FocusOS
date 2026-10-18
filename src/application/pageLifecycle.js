import { collectPageSubtreeIds } from "../domain/pageLifecycle.js";

// Page is a workspace/view, not the owner of operational records. Detach
// associations from every known owner-scoped record family before deleting
// Page documents. Tasks currently use the generic activity model; "tasks" is
// included defensively for any migrated/forward-compatible specialist records.
// Unknown future collections must be added with their schema.
export const PAGE_REFERENCE_COLLECTIONS = Object.freeze([
  "nodes",
  "activity",
  "tasks",
  "reminders",
  "timetables",
  "timetableCompletions",
  "deadlines",
  "habits",
  "habitLogs",
  "pomodoroSessions",
  "exerciseLogs",
]);

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
  for (const collectionName of PAGE_REFERENCE_COLLECTIONS) {
    await detachPageReferences(uid, collectionName, pageIds);
  }
  await deletePageDocuments(uid, pageIds);
  return pageIds;
}
