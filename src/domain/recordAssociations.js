/** Canonical Page associations with a legacy single-page compatibility field. */
export function normalizePageAssociations({ pageId = null, pageIds = [] } = {}) {
  const values = [];
  if (typeof pageId === "string" && pageId.trim()) values.push(pageId.trim());
  if (Array.isArray(pageIds)) {
    for (const value of pageIds) {
      if (typeof value === "string" && value.trim()) values.push(value.trim());
    }
  }
  const normalized = [...new Set(values)];
  return { pageId: normalized[0] || null, pageIds: normalized };
}

/** Remove associations to deleted Pages without deleting the underlying record. */
export function removePageAssociations(record = {}, removedPageIds = []) {
  const removed = new Set(removedPageIds);
  const normalized = normalizePageAssociations(record);
  const pageIds = normalized.pageIds.filter((id) => !removed.has(id));
  const pageId = pageIds.includes(record.pageId) ? record.pageId : (pageIds[0] || null);
  return { pageId, pageIds };
}

export function isRecordAssociatedWithPage(record, pageId) {
  if (!pageId) return false;
  return record?.pageId === pageId || (Array.isArray(record?.pageIds) && record.pageIds.includes(pageId));
}
