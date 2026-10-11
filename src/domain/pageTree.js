import { collectPageSubtreeIds } from "./pageLifecycle.js";

/** Validate a Page reparent without mutating Pages, Nodes, or record associations. */
export function validatePageReparent(pages, pageId, newParentId = null) {
  if (!Array.isArray(pages)) throw new Error("pages must be an array.");
  if (!pageId) throw new Error("pageId is required.");

  const page = pages.find((item) => item?.id === pageId);
  if (!page) throw new Error(`Page "${pageId}" does not exist.`);
  if (page.archived || page.trashedAt) throw new Error("Archived or trashed Pages cannot be moved.");

  const parentId = newParentId || null;
  if (!parentId) return { pageId, parentId: null };
  const parent = pages.find((item) => item?.id === parentId);
  if (!parent) throw new Error(`Parent Page "${parentId}" does not exist.`);
  if (parent.archived || parent.trashedAt) throw new Error("A Page cannot be moved under an archived or trashed Page.");

  const subtree = new Set(collectPageSubtreeIds(pages, pageId));
  if (subtree.has(parentId)) throw new Error("A Page cannot be moved under itself or one of its descendants.");
  return { pageId, parentId };
}

/** Return a new tree with only the selected Page's parent relation changed. */
export function reparentPageInTree(pages, pageId, newParentId = null) {
  const validated = validatePageReparent(pages, pageId, newParentId);
  const current = pages.find((item) => item.id === pageId);
  if ((current.parentId || null) === validated.parentId) return pages.map((item) => ({ ...item }));
  return pages.map((item) => item.id === pageId ? { ...item, parentId: validated.parentId } : { ...item });
}
