import { collectPageSubtreeIds } from "../src/domain/pageLifecycle.js";
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

console.log(`\n${failures === 0 ? "ALL PASS" : `${failures} FAILURE(S)`}`);
process.exit(failures === 0 ? 0 : 1);
