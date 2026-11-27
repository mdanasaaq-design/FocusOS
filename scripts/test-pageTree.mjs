import { collectPageSubtreeIds, getExpiredTrashPlan } from "../src/domain/pageLifecycle.js";
import { reparentPageInTree, validatePageReparent } from "../src/domain/pageTree.js";

let failures = 0;
function check(label, actual, expected) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (!ok) {
    failures++;
    console.error(`FAIL  ${label}\n      expected: ${JSON.stringify(expected)}\n      actual:   ${JSON.stringify(actual)}`);
  } else {
    console.log(`ok    ${label}`);
  }
}
function checkThrows(label, action) {
  let threw = false;
  try { action(); } catch { threw = true; }
  check(label, threw, true);
}

const pages = [
  { id: "grandchild", parentId: "child", order: 0 },
  { id: "root", parentId: null, order: 0, config: { color: "brass" } },
  { id: "sibling", parentId: null, order: 1 },
  { id: "child", parentId: "root", order: 1 },
  { id: "other-child", parentId: "root", order: 2 },
];

check(
  "collectPageSubtreeIds recursively includes only the selected Page subtree",
  collectPageSubtreeIds(pages, "root").sort(),
  ["child", "grandchild", "other-child", "root"]
);
check(
  "collectPageSubtreeIds safely terminates on persisted cycles",
  collectPageSubtreeIds([
    { id: "a", parentId: "b" },
    { id: "b", parentId: "a" },
    { id: "c", parentId: "b" },
  ], "a").sort(),
  ["a", "b", "c"]
);
check(
  "validatePageReparent accepts a valid new parent",
  validatePageReparent(pages, "child", "sibling"),
  { pageId: "child", parentId: "sibling" }
);
check(
  "validatePageReparent accepts moving a Page to the root",
  validatePageReparent(pages, "child", null),
  { pageId: "child", parentId: null }
);
checkThrows("validatePageReparent rejects a missing Page", () => validatePageReparent(pages, "missing", null));
checkThrows("validatePageReparent rejects a missing parent", () => validatePageReparent(pages, "child", "missing"));
checkThrows("validatePageReparent rejects self-parenting", () => validatePageReparent(pages, "child", "child"));
checkThrows("validatePageReparent rejects moving a parent under its descendant", () => validatePageReparent(pages, "root", "grandchild"));
checkThrows(
  "validatePageReparent rejects moving an archived Page",
  () => validatePageReparent(pages.map((page) => page.id === "child" ? { ...page, archived: true } : page), "child", "sibling")
);
checkThrows(
  "validatePageReparent rejects an archived destination",
  () => validatePageReparent(pages.map((page) => page.id === "sibling" ? { ...page, archived: true } : page), "child", "sibling")
);
checkThrows(
  "validatePageReparent rejects a trashed destination",
  () => validatePageReparent(pages.map((page) => page.id === "sibling" ? { ...page, trashedAt: "2026-01-01" } : page), "child", "sibling")
);

const moved = reparentPageInTree(pages, "child", "sibling");
check("reparentPageInTree changes only the selected Page parentId", moved.find((page) => page.id === "child").parentId, "sibling");
check("reparentPageInTree preserves descendants' parent links", moved.find((page) => page.id === "grandchild").parentId, "child");
check("reparentPageInTree preserves other Page data", moved.find((page) => page.id === "root").config, { color: "brass" });
check("reparentPageInTree does not mutate the source hierarchy", pages.find((page) => page.id === "child").parentId, "root");

checkThrows("collectPageSubtreeIds rejects a missing root rather than returning a phantom deletion target", () => collectPageSubtreeIds(pages, "missing"));
check(
  "getExpiredTrashPlan purges an expired subtree from its root only",
  getExpiredTrashPlan([
    { id: "root", parentId: null, trashedAt: "2026-01-01T00:00:00.000Z" },
    { id: "child", parentId: "root", trashedAt: "2026-01-01T00:00:00.000Z" },
    { id: "fresh", parentId: null, trashedAt: "2026-10-01T00:00:00.000Z" },
    { id: "live", parentId: null, trashedAt: null },
  ], new Date("2026-10-13T00:00:00.000Z").getTime(), 30),
  { expiredIds: ["root", "child"], rootIds: ["root"] }
);
check(
  "getExpiredTrashPlan does not schedule an expired parent while a descendant is still within retention",
  getExpiredTrashPlan([
    { id: "old-parent", parentId: null, trashedAt: "2026-01-01T00:00:00.000Z" },
    { id: "new-child", parentId: "old-parent", trashedAt: "2026-10-01T00:00:00.000Z" },
  ], new Date("2026-10-13T00:00:00.000Z").getTime(), 30),
  { expiredIds: [], rootIds: [] }
);
check(
  "getExpiredTrashPlan can purge an expired child subtree beneath a retained parent",
  getExpiredTrashPlan([
    { id: "retained-parent", parentId: null, trashedAt: "2026-10-01T00:00:00.000Z" },
    { id: "expired-child", parentId: "retained-parent", trashedAt: "2026-01-01T00:00:00.000Z" },
    { id: "expired-grandchild", parentId: "expired-child", trashedAt: "2026-01-01T00:00:00.000Z" },
  ], new Date("2026-10-13T00:00:00.000Z").getTime(), 30),
  { expiredIds: ["expired-child", "expired-grandchild"], rootIds: ["expired-child"] }
);
checkThrows("getExpiredTrashPlan rejects a negative retention window", () => getExpiredTrashPlan([], Date.now(), -1));


// ---- F-04: Trash retention timestamps ------------------------------------
// The documented purge window is 30 days (PROJECT_STATUS.md); these checks use the
// function's DEFAULT retention, so they fail if the default stops being 30 days.
const DAY = 24 * 60 * 60 * 1000;
const NOW = Date.parse("2026-10-13T00:00:00.000Z");
const purgeRootsFor = (trashedAt) => getExpiredTrashPlan([{ id: "p", parentId: null, trashedAt }], NOW).rootIds;
check("Trash: a Page is purged exactly at the 30-day boundary", purgeRootsFor(new Date(NOW - 30 * DAY).toISOString()), ["p"]);
check("Trash: a Page 1 ms inside the 30-day window is kept", purgeRootsFor(new Date(NOW - 30 * DAY + 1).toISOString()), []);
check("Trash: a Page 1 ms past the 30-day window is purged", purgeRootsFor(new Date(NOW - 30 * DAY - 1).toISOString()), ["p"]);
check("Trash: Firestore Timestamp-like values (toDate) are honored", purgeRootsFor({ toDate: () => new Date(NOW - 31 * DAY) }), ["p"]);
// Fail-safe requirement (destructive paths fail safely): an unreadable timestamp never schedules a purge.
for (const [label, trashedAt] of [["missing", undefined], ["null", null], ["empty string", ""], ["malformed string", "not-a-date"], ["invalid Date", new Date("x")]]) {
  check(`Trash: a ${label} trashedAt is never scheduled for permanent deletion`, purgeRootsFor(trashedAt), []);
}
check(
  "Trash: an expired ancestor is not purged while a descendant has a malformed or missing timestamp",
  getExpiredTrashPlan([
    { id: "old", parentId: null, trashedAt: "2026-01-01T00:00:00.000Z" },
    { id: "bad", parentId: "old", trashedAt: "not-a-date" },
    { id: "none", parentId: "old" },
  ], NOW),
  { expiredIds: [], rootIds: [] }
);
check("Trash: a Page that was never trashed is not part of any plan", getExpiredTrashPlan([{ id: "x", parentId: null, archived: true }], NOW), { expiredIds: [], rootIds: [] });

console.log(`\n${failures === 0 ? "ALL PASS" : `${failures} FAILURE(S)`}`);
process.exit(failures === 0 ? 0 : 1);
