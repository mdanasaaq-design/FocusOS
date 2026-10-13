// Pure Page lifecycle rules. Keep this separate from Firestore so the
// hierarchy behavior can be tested without a Firebase runtime.

/**
 * Return a Page and every descendant Page in the supplied hierarchy.
 * The visited set makes this safe even if persisted data contains a cycle.
 *
 * @param {Array<{id: string, parentId?: string|null}>} pages
 * @param {string} rootPageId
 * @returns {string[]}
 */
export function collectPageSubtreeIds(pages, rootPageId) {
  if (!rootPageId) throw new Error("rootPageId is required.");
  if (!pages.some((page) => page?.id === rootPageId)) throw new Error(`Page "${rootPageId}" does not exist.`);
  const ids = new Set([rootPageId]);
  let changed = true;

  while (changed) {
    changed = false;
    for (const page of pages) {
      if (page?.id && page.parentId && ids.has(page.parentId) && !ids.has(page.id)) {
        ids.add(page.id);
        changed = true;
      }
    }
  }

  return [...ids];
}


/** Return trashed Pages whose retention window elapsed, and the roots safe to purge. */
export function getExpiredTrashPlan(pages, now = Date.now(), retentionDays = 30) {
  if (!Array.isArray(pages)) throw new Error("pages must be an array.");
  if (!Number.isFinite(now)) throw new Error("now must be a finite timestamp.");
  if (!Number.isFinite(retentionDays) || retentionDays < 0) throw new Error("retentionDays must be a non-negative number.");
  const retentionMs = retentionDays * 24 * 60 * 60 * 1000;
  const expired = pages.filter((page) => {
    const raw = page?.trashedAt;
    const trashedAt = raw?.toDate ? raw.toDate() : raw ? new Date(raw) : null;
    return Boolean(trashedAt && !Number.isNaN(trashedAt.getTime()) && trashedAt.getTime() + retentionMs <= now);
  });
  const expiredIds = new Set(expired.map((page) => page.id));
  const candidates = expired.filter((page) => !page.parentId || !expiredIds.has(page.parentId));
  // Permanent deletion is subtree-based. Do not schedule an expired ancestor
  // when even one descendant is newer than the retention window: the deletion
  // guard would correctly reject it, and deleting only part of that subtree
  // would silently change the hierarchy.
  const roots = candidates.filter((page) =>
    collectPageSubtreeIds(pages, page.id).every((id) => expiredIds.has(id))
  );
  const deletableIds = new Set(roots.flatMap((page) => collectPageSubtreeIds(pages, page.id)));
  return { expiredIds: [...deletableIds], rootIds: roots.map((page) => page.id) };
}
