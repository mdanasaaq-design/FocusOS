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


/** Return a new Page list with one sibling moved up/down in display order. */
export function reorderPageSiblings(pages, pageId, direction) {
  if (!Array.isArray(pages)) throw new Error("pages must be an array.");
  if (!["up", "down"].includes(direction)) throw new Error("direction must be up or down.");
  const target = pages.find((page) => page?.id === pageId);
  if (!target) throw new Error(`Page "${pageId}" does not exist.`);
  if (target.archived || target.trashedAt) throw new Error("Archived or trashed Pages cannot be reordered.");
  const parentId = target.parentId || null;
  const siblings = pages
    .filter((page) => (page.parentId || null) === parentId && !page.archived && !page.trashedAt)
    .sort((a, b) => (Number(a.config?.navigationOrder) || 0) - (Number(b.config?.navigationOrder) || 0) || String(a.name || "").localeCompare(String(b.name || "")));
  const index = siblings.findIndex((page) => page.id === pageId);
  const nextIndex = index + (direction === "up" ? -1 : 1);
  if (nextIndex < 0 || nextIndex >= siblings.length) return pages.map((page) => ({ ...page }));
  const reordered = [...siblings];
  [reordered[index], reordered[nextIndex]] = [reordered[nextIndex], reordered[index]];
  const orders = new Map(reordered.map((page, order) => [page.id, order]));
  return pages.map((page) => {
    if (!orders.has(page.id)) return { ...page };
    return {
      ...page,
      config: { ...(page.config || {}), navigationOrder: orders.get(page.id) },
    };
  });
}
