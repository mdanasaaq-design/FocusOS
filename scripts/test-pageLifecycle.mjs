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

// ---- F-04: reference-detachment failure injection (contract level) ----------
// Requirement (Phase 2 exit criteria: destructive paths fail safely): a failure in
// ANY collection's cleanup must abort before Page documents are deleted, surface
// the original error, and leave the operation retryable.
for (const [failIndex, failingCollection] of PAGE_REFERENCE_COLLECTIONS.entries()) {
  calls = [];
  let detachAttempt = 0;
  const failingAdapters = {
    detachPageReferences: async (...args) => {
      calls.push(["detach", ...args]);
      if (detachAttempt++ === failIndex) throw new Error(`injected detach failure: ${failingCollection}`);
    },
    deletePageDocuments: async (...args) => calls.push(["delete", ...args]),
  };
  let message = null;
  try { await deletePageWorkspace({ uid: "owner", pageId: "root", pages: trashedPages, ...failingAdapters }); } catch (error) { message = error.message; }
  check(`detach failure in "${failingCollection}" rejects with the original error`, message, `injected detach failure: ${failingCollection}`);
  check(`detach failure in "${failingCollection}" never deletes Page documents`, calls.some((call) => call[0] === "delete"), false);
  // Retry at the same failure point: with healthy adapters the whole workflow runs again from the start.
  // Contract level only: this proves the orchestration can be re-run and re-cleans every collection; whether
  // already-detached records stay consistent is shown at the data layer (scripts/test-pageLifecycle-data.mjs).
  calls = [];
  const retriedAfterFailure = await deletePageWorkspace({ uid: "owner", pageId: "root", pages: trashedPages, ...adapters });
  check(`retry after the "${failingCollection}" failure re-runs every cleanup in order and then deletes the subtree`, [calls.filter((call) => call[0] === "detach").map((call) => call[2]), calls.at(-1)[0], retriedAfterFailure], [[...PAGE_REFERENCE_COLLECTIONS], "delete", ["root", "child", "grandchild"]]);
}
calls = [];
await checkRejects("a Page-document deletion failure propagates", () => deletePageWorkspace({
  uid: "owner", pageId: "root", pages: trashedPages,
  detachPageReferences: async (...args) => calls.push(["detach", ...args]),
  deletePageDocuments: async () => { throw new Error("injected delete failure"); },
}));
calls = [];
const retried = await deletePageWorkspace({ uid: "owner", pageId: "root", pages: trashedPages, ...adapters });
check("retrying with healthy adapters re-runs every cleanup and then deletes the same subtree", [calls.length, calls.at(-1)[0], retried], [PAGE_REFERENCE_COLLECTIONS.length + 1, "delete", ["root", "child", "grandchild"]]);
calls = [];
const missingStamp = [trashedPages[0], { ...trashedPages[1], trashedAt: undefined }, trashedPages[2]];
await checkRejects("a descendant with no trashedAt blocks permanent deletion", () => deletePageWorkspace({ uid: "owner", pageId: "root", pages: missingStamp, ...adapters }));
check("the missing-trashedAt rejection makes no persistence calls", calls, []);

console.log(`\n${failures === 0 ? "ALL PASS" : `${failures} FAILURE(S)`}`);
process.exit(failures === 0 ? 0 : 1);
