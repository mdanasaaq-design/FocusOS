import assert from "node:assert/strict";
import { normalizePreferences } from "../src/lib/preferences.js";
import { todayKey } from "../src/lib/dates.js";
import { collectPageSubtreeIds } from "../src/domain/pageLifecycle.js";
import { deletePageWorkspace } from "../src/application/pageLifecycle.js";
import { reparentPageInTree, validatePageReparent } from "../src/domain/pageTree.js";

const prefs = normalizePreferences({ timeZone: "India", locale: "en_US" });
assert.equal(prefs.timeZone, "Asia/Kolkata");
assert.equal(prefs.locale, "en-IN");

const instant = new Date("2026-01-01T23:30:00.000Z");
assert.equal(todayKey(instant, "Asia/Kolkata"), "2026-01-02");
assert.equal(todayKey(instant, "UTC"), "2026-01-01");

console.log("Core date/preference tests passed.");

import { MODULES, isModuleEnabled, isValidNodeModuleKey } from "../src/modules/registry.js";
assert.equal(isValidNodeModuleKey("study"), true);
assert.equal(isValidNodeModuleKey("workspace"), false);
assert.equal(MODULES.some((m) => m.key === "workspace"), false);
assert.equal(isModuleEnabled("calendar", { enabledModules: [] }), true);
assert.equal(isModuleEnabled("tasks", { enabledModules: ["tasks"] }), true);
assert.equal(isModuleEnabled("tasks", { enabledModules: [] }), false);

const pageTree = [
  { id: "root", parentId: null },
  { id: "child", parentId: "root" },
  { id: "grandchild", parentId: "child" },
  { id: "sibling", parentId: "root" },
  { id: "unrelated", parentId: null },
];
assert.deepEqual(
  new Set(collectPageSubtreeIds(pageTree, "root")),
  new Set(["root", "child", "grandchild", "sibling"])
);
assert.deepEqual(
  new Set(collectPageSubtreeIds([
    { id: "a", parentId: "b" },
    { id: "b", parentId: "a" },
  ], "a")),
  new Set(["a", "b"])
);
assert.throws(() => collectPageSubtreeIds(pageTree, "missing"), /does not exist/);

console.log("Page lifecycle hierarchy tests passed.");

const hierarchyPages = [
  { id: "master", parentId: null, name: "Master" },
  { id: "child", parentId: "master", name: "Child", config: { keep: true } },
  { id: "grandchild", parentId: "child", name: "Grandchild" },
  { id: "sibling", parentId: "master", name: "Sibling" },
  { id: "other", parentId: null, name: "Other" },
  { id: "archived", parentId: null, name: "Archived", archived: true },
];
assert.deepEqual(validatePageReparent(hierarchyPages, "child", "other"), { pageId: "child", parentId: "other" });
const movedHierarchy = reparentPageInTree(hierarchyPages, "child", "other");
assert.equal(movedHierarchy.find((page) => page.id === "child").parentId, "other");
assert.equal(movedHierarchy.find((page) => page.id === "child").config.keep, true);
assert.equal(movedHierarchy.find((page) => page.id === "grandchild").parentId, "child");
assert.equal(movedHierarchy.find((page) => page.id === "sibling").parentId, "master");
assert.equal(hierarchyPages.find((page) => page.id === "child").parentId, "master");
assert.deepEqual(reparentPageInTree(hierarchyPages, "child", "master"), hierarchyPages);
assert.throws(() => validatePageReparent(hierarchyPages, "child", "grandchild"), /itself or one of its descendants/);
assert.throws(() => validatePageReparent(hierarchyPages, "child", "missing"), /does not exist/);
assert.throws(() => validatePageReparent(hierarchyPages, "child", "archived"), /archived or trashed Page/);
assert.throws(() => validatePageReparent(hierarchyPages, "missing", null), /does not exist/);

console.log("Page hierarchy move validation tests passed.");



const deletionOperations = [];
const trashedPageTree = pageTree.map((page) => ({ ...page, trashedAt: "2026-01-01T00:00:00.000Z" }));
const deletedPageIds = await deletePageWorkspace({
  uid: "test-user",
  pageId: "root",
  pages: trashedPageTree,
  detachPageReferences: async (uid, collectionName, ids) => {
    deletionOperations.push({ type: "detach", uid, collectionName, ids: [...ids] });
  },
  deletePageDocuments: async (uid, ids) => {
    deletionOperations.push({ type: "delete-pages", uid, ids: [...ids] });
  },
});
assert.deepEqual(new Set(deletedPageIds), new Set(["root", "child", "grandchild", "sibling"]));
assert.deepEqual(deletionOperations.map((operation) => operation.type), ["detach", "detach", "detach", "delete-pages"]);
assert.deepEqual(deletionOperations.map((operation) => operation.collectionName).filter(Boolean), ["nodes", "activity", "tasks"]);
assert.ok(deletionOperations.slice(0, 3).every((operation) => operation.uid === "test-user"));
assert.ok(deletionOperations.slice(0, 3).every((operation) => JSON.stringify(operation.ids) === JSON.stringify(deletedPageIds)));
assert.deepEqual(deletionOperations.at(-1).ids, deletedPageIds);
assert.ok(deletionOperations.every((operation) => operation.type !== "delete-records"));

await assert.rejects(
  () => deletePageWorkspace({ uid: "", pageId: "root", pages: trashedPageTree, detachPageReferences: async () => {}, deletePageDocuments: async () => {} }),
  /uid and pageId are required/
);

console.log("Page deletion data-preservation contract tests passed.");
