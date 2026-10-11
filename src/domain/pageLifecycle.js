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
