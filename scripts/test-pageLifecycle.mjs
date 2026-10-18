import { deletePageWorkspace, PAGE_REFERENCE_COLLECTIONS } from "../src/application/pageLifecycle.js";

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
async function checkRejects(label, action) {
  let threw = false;
  try { await action(); } catch { threw = true; }
  check(label, threw, true);
}
const trashedPages = [
  { id: "root", parentId: null, trashedAt: "2026-01-01T00:00:00.000Z" },
  { id: "child", parentId: "root", trashedAt: "2026-01-01T00:00:00.000Z" },
  { id: "grandchild", parentId: "child", trashedAt: "2026-01-01T00:00:00.000Z" },
];
let calls = [];
const adapters = {
  detachPageReferences: async (...args) => calls.push(["detach", ...args]),
  deletePageDocuments: async (...args) => calls.push(["delete", ...args]),
};
const ids = await deletePageWorkspace({ uid: "owner", pageId: "root", pages: trashedPages, ...adapters });
check("permanent deletion targets the entire trashed subtree", ids, ["root", "child", "grandchild"]);
check("permanent deletion detaches every known record family before deleting Page documents", calls.map((call) => call[0]), [...PAGE_REFERENCE_COLLECTIONS.map(() => "detach"), "delete"]);
check("every record family is detached from the entire Page subtree", calls.slice(0, PAGE_REFERENCE_COLLECTIONS.length).map((call) => call.slice(1, 3)), PAGE_REFERENCE_COLLECTIONS.map((name) => ["owner", name]));
check("permanent deletion preserves stable subtree identity order", calls.at(-1)[2], ids);
calls = [];
await checkRejects("permanent deletion rejects a missing root before persistence", () => deletePageWorkspace({ uid: "owner", pageId: "missing", pages: trashedPages, ...adapters }));
check("missing-root rejection makes no persistence calls", calls, []);
await checkRejects("permanent deletion rejects a subtree containing an active descendant", () => deletePageWorkspace({
  uid: "owner", pageId: "root",
  pages: [trashedPages[0], { ...trashedPages[1], trashedAt: null }, trashedPages[2]],
  ...adapters,
}));
check("active-descendant rejection makes no persistence calls", calls, []);
await checkRejects("permanent deletion requires uid and Page ID", () => deletePageWorkspace({ uid: "", pageId: "root", pages: trashedPages, ...adapters }));
console.log(`\n${failures === 0 ? "ALL PASS" : `${failures} FAILURE(S)`}`);
process.exit(failures === 0 ? 0 : 1);
