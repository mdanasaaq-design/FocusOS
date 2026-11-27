// F-04 data-layer lifecycle tests.
//
// Runs the REAL src/data/pages.js and src/data/nodes.js functions against the
// in-memory Firestore fixture in scripts/support/fakeFirestore.mjs. No network,
// no emulator, no Firebase project. Firestore security rules and real emulator
// semantics are covered separately by scripts/test-firestore-rules.mjs and
// scripts/test-nodePathRepair-emulator.mjs, which are NOT replaced by this file.
//
// Every check label starts with a tag:
//   [REQ]  a documented requirement: docs/DECISIONS.md D-002 / D-003 / D-004
//          (Page operations must not rewrite Node relationships or destroy
//          records; preserve associations and history; additive and reversible),
//          docs/PROJECT_AUDIT_AND_PHASE_PLAN.md Phase 2 exit criteria
//          ("destructive paths fail safely"), and the documented 30-day Trash
//          purge window (PROJECT_STATUS.md; getExpiredTrashPlan default).
//   [IMPL] behavior of the current implementation that is not a documented
//          requirement (chunk sizes, commit ordering, history entries). These may
//          legitimately change; update the check when they do.
//
// Association shapes: records keep whatever physical shape they already have.
// Checks read a record's references through refsOf(), which accepts a missing,
// null, empty or populated pageId and a missing, empty, duplicated or populated
// pageIds. No check requires a field to be added, normalized or removed.
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const vite = await createServer({
  configFile: "vite.config.js",
  root,
  resolve: {
    alias: [
      { find: "firebase/firestore", replacement: path.join(root, "scripts/support/fakeFirestore.mjs") },
      { find: /^(\.\.\/)+lib\/firebase(\.js)?$/, replacement: path.join(root, "scripts/support/firebaseAppStub.mjs") },
    ],
  },
  server: { middlewareMode: true },
  appType: "custom",
  logLevel: "error",
});

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
async function rejects(action) {
  try { await action(); } catch (error) { return error.message; }
  return null;
}

try {
  const { fake } = await vite.ssrLoadModule("/scripts/support/fakeFirestore.mjs");
  const pagesApi = await vite.ssrLoadModule("/src/data/pages.js");
  const nodesApi = await vite.ssrLoadModule("/src/data/nodes.js");
  const { PAGE_REFERENCE_COLLECTIONS } = await vite.ssrLoadModule("/src/application/pageLifecycle.js");
  const { permanentlyDeletePage, reparentPage, updatePage, normalizePageConfig, trashPage, restorePage, trashExpiresAt, purgeExpiredTrash } = pagesApi;
  const { reparentNode, repairNodePaths } = nodesApi;

  const uid = "owner";
  const P = (id) => `users/${uid}/pages/${id}`;
  const R = (collection, id) => `users/${uid}/${collection}/${id}`;
  const day = 24 * 60 * 60 * 1000;
  const trashedPage = (id, parentId = null, trashedAt = "2026-01-01T00:00:00.000Z") =>
    ({ name: id, parentId, archived: true, trashedAt });
  const livePage = (id, parentId = null, extra = {}) => ({ name: id, parentId, archived: false, trashedAt: null, ...extra });

  // Shape-tolerant view of a record's Page references.
  const refsOf = (record) => new Set([record.pageId, ...(Array.isArray(record.pageIds) ? record.pageIds : [])].filter((id) => typeof id === "string" && id !== ""));
  const nonAssociationFields = ({ pageId, pageIds, updatedAt, ...rest }) => rest; // eslint-disable-line no-unused-vars
  const referencing = (collection, pageId) => fake.list(`users/${uid}/${collection}`).filter((p) => refsOf(fake.read(p)).has(pageId));

  // ---- Association shapes: missing, empty, duplicate, surviving ----------
  fake.reset();
  fake.seed(P("D"), trashedPage("D"));
  fake.seed(P("S"), livePage("S"));
  const shapes = {
    "activity/legacy-only": { pageId: "D", marker: "legacy" },
    "activity/array-only": { pageIds: ["D", "S"], marker: "array" },
    "activity/surviving-primary": { pageId: "S", pageIds: ["D", "S"], marker: "primary" },
    "activity/duplicates-with-survivor": { pageIds: ["D", "D", "S", "S"], marker: "dup" },
    "activity/duplicates-only-deleted": { pageIds: ["D", "D"], marker: "dup-only" },
    "habits/legacy-only": { pageId: "D", marker: "habit" },
    "nodes/both": { pageId: "D", pageIds: ["D", "S"], marker: "node", moduleKey: "core", parentId: null, path: [] },
  };
  const untouched = {
    "activity/surviving-array-only": { pageIds: ["S"], marker: "s1" },
    "activity/surviving-legacy-only": { pageId: "S", marker: "s2" },
    "activity/surviving-both": { pageId: "S", pageIds: ["S"], marker: "s3" },
    "activity/other-page": { pageId: "X", pageIds: ["X"], marker: "x" },
    "activity/missing-fields": { marker: "missing" },
    "activity/empty-array": { pageIds: [], marker: "empty-array" },
    "activity/null-and-empty": { pageId: null, pageIds: [], marker: "null-empty" },
    "activity/empty-string": { pageId: "", marker: "empty-string" },
  };
  for (const [key, data] of Object.entries({ ...shapes, ...untouched })) { const [c, id] = key.split("/"); fake.seed(R(c, id), data); }
  const everyRecord = Object.keys({ ...shapes, ...untouched }).map((key) => key.split("/"));
  const before = Object.fromEntries(everyRecord.map(([c, id]) => [`${c}/${id}`, fake.read(R(c, id))]));
  fake.clearWriteLog();
  await permanentlyDeletePage(uid, "D");
  const after = Object.fromEntries(everyRecord.map(([c, id]) => [`${c}/${id}`, fake.read(R(c, id))]));

  check("[REQ] no record keeps a reference to the deleted Page, whatever its association shape", Object.entries(after).filter(([, r]) => refsOf(r).has("D")).map(([k]) => k), []);
  check("[REQ] records that also referenced a surviving Page keep that association (array-only, mixed, duplicated)", ["activity/array-only", "activity/surviving-primary", "activity/duplicates-with-survivor", "nodes/both"].map((k) => refsOf(after[k]).has("S")), [true, true, true, true]);
  check("[REQ] records already pointing only at a surviving Page are unchanged", ["activity/surviving-array-only", "activity/surviving-legacy-only", "activity/surviving-both"].map((k) => after[k]), ["activity/surviving-array-only", "activity/surviving-legacy-only", "activity/surviving-both"].map((k) => before[k]));
  check("[REQ] records with missing, empty or other-Page associations are not rewritten or normalized", ["activity/other-page", "activity/missing-fields", "activity/empty-array", "activity/null-and-empty", "activity/empty-string"].map((k) => after[k]), ["activity/other-page", "activity/missing-fields", "activity/empty-array", "activity/null-and-empty", "activity/empty-string"].map((k) => before[k]));
  check("[REQ] only records that referenced the deleted Page are written", [...new Set(fake.writeLog.filter((w) => !w.path.includes("/pages/")).map((w) => w.path.replace(`users/${uid}/`, "")))].sort(), Object.keys(shapes).sort());
  check("[REQ] fields other than the Page references are preserved on every record", Object.keys(before).map((k) => nonAssociationFields(after[k])), Object.keys(before).map((k) => nonAssociationFields(before[k])));
  check("[REQ] Node hierarchy fields are untouched by Page deletion", [after["nodes/both"].parentId, after["nodes/both"].path, after["nodes/both"].moduleKey], [null, [], "core"]);
  check("[REQ] no record document is deleted; the Page is removed and the surviving Page remains", [Object.keys(before).every((k) => fake.has(R(...k.split("/")))), fake.has(P("D")), fake.has(P("S"))], [true, false, true]);
  check("[REQ] no reference to the deleted Page remains in any reference collection", PAGE_REFERENCE_COLLECTIONS.flatMap((name) => referencing(name, "D")), []);

  // ---- Subtree larger than one query chunk -------------------------------
  fake.reset();
  const manyIds = Array.from({ length: 12 }, (_, i) => `p${i}`);
  manyIds.forEach((id, i) => fake.seed(P(id), trashedPage(id, i === 0 ? null : "p0")));
  fake.seed(P("S"), livePage("S"));
  manyIds.forEach((id) => fake.seed(R("activity", `rec-${id}`), { pageId: id, pageIds: [id, "S"], marker: id }));
  await permanentlyDeletePage(uid, "p0");
  const afterMany = fake.list(`users/${uid}/activity`).map((p) => fake.read(p));
  check("[REQ] a 12-Page subtree leaves no reference to any deleted Page", afterMany.filter((r) => manyIds.some((id) => refsOf(r).has(id))).length, 0);
  check("[REQ] every record of a deleted subtree keeps its surviving association", afterMany.every((r) => refsOf(r).has("S")), true);
  check("[REQ] all records survive the deletion", afterMany.length, 12);

  // ---- Failure injection and retry ----------------------------------------
  const seedBulk = (count) => {
    fake.reset();
    fake.seed(P("D"), trashedPage("D"));
    fake.seed(P("S"), livePage("S"));
    for (let i = 0; i < count; i++) fake.seed(R("activity", `r${String(i).padStart(3, "0")}`), { pageId: "D", pageIds: ["D", "S"], marker: `m${i}` });
  };
  seedBulk(401);
  await permanentlyDeletePage(uid, "D");
  const totalCommits = fake.commitCount;
  check("[IMPL] 401 associated records need more than one detach batch (fault point exists)", totalCommits >= 3, true);

  seedBulk(401);
  fake.failCommit(2);
  const midError = await rejects(() => permanentlyDeletePage(uid, "D"));
  const remaining = referencing("activity", "D").length;
  check("[REQ] a failing detach batch rejects the deletion with the original error", midError, "Injected batch commit failure");
  check("[REQ] after the failure the Page document still exists, so the cleanup can be retried", fake.has(P("D")), true);
  check("[IMPL] the failure leaves the detachment partially done (some, but not all, records still reference the Page)", remaining > 0 && remaining < 401, true);
  fake.clearFailure();
  await permanentlyDeletePage(uid, "D");
  check("[REQ] retry completes the detachment and deletes the Page", [referencing("activity", "D").length, fake.has(P("D"))], [0, false]);
  check("[REQ] retry keeps all 401 records, their data and the surviving association", [fake.list(`users/${uid}/activity`).length, fake.list(`users/${uid}/activity`).every((p) => /^m\d+$/.test(fake.read(p).marker) && refsOf(fake.read(p)).has("S"))], [401, true]);

  const [firstCollection, secondCollection] = PAGE_REFERENCE_COLLECTIONS;
  const seedTwoCollections = () => {
    fake.reset();
    fake.seed(P("D"), trashedPage("D"));
    fake.seed(R(firstCollection, "r1"), { pageId: "D", marker: "first" });
    fake.seed(R(secondCollection, "r2"), { pageId: "D", marker: "second" });
  };
  seedTwoCollections();
  fake.failCommit(2); // commit 1 detaches the first collection; commit 2 (second collection) fails
  const crossError = await rejects(() => permanentlyDeletePage(uid, "D"));
  check("[REQ] a failure in a later collection rejects and keeps the Page document", [crossError, fake.has(P("D"))], ["Injected batch commit failure", true]);
  check("[IMPL] collections are cleaned in PAGE_REFERENCE_COLLECTIONS order, so only the earlier one is already detached", [referencing(firstCollection, "D").length, referencing(secondCollection, "D").length], [0, 1]);
  fake.clearFailure();
  await permanentlyDeletePage(uid, "D");
  check("[REQ] retry cleans the remaining collection, keeps the records and deletes the Page", [referencing(secondCollection, "D").length, fake.has(P("D")), fake.has(R(secondCollection, "r2")), fake.has(R(firstCollection, "r1"))], [0, false, true, true]);

  const seedOne = () => { fake.reset(); fake.seed(P("D"), trashedPage("D")); fake.seed(R("activity", "a1"), { pageId: "D", pageIds: ["D"], marker: "keep" }); };
  seedOne();
  await permanentlyDeletePage(uid, "D");
  const oneRunCommits = fake.commitCount;
  seedOne();
  fake.failCommit(oneRunCommits); // the last commit removes the Page documents
  const deleteError = await rejects(() => permanentlyDeletePage(uid, "D"));
  check("[REQ] a failure while deleting Page documents rejects; references were already detached and the Page remains", [deleteError, referencing("activity", "D").length, fake.has(P("D"))], ["Injected batch commit failure", 0, true]);
  fake.clearFailure();
  await permanentlyDeletePage(uid, "D");
  check("[REQ] retry after a Page-document deletion failure completes and keeps the record", [fake.has(P("D")), fake.read(R("activity", "a1")).marker], [false, "keep"]);

  fake.reset();
  fake.seed(P("root"), trashedPage("root"));
  fake.seed(P("child"), livePage("child", "root"));
  fake.seed(R("activity", "a"), { pageId: "child", pageIds: ["child"] });
  const activeDescendantError = await rejects(() => permanentlyDeletePage(uid, "root"));
  check("[REQ] deleting a trashed Page that has an active descendant is refused before any write", [activeDescendantError !== null, fake.writeLog, fake.commitCount], [true, [], 0]);

  // ---- Page reparent and reorder must not touch Nodes, records or history ----
  const seedWorkspace = () => {
    fake.reset();
    const cfg = (order) => normalizePageConfig({ fields: [{ id: "f1", label: "Field" }], capabilities: ["tasks"], showChildren: true, showInNavigation: true, navigationOrder: order });
    fake.seed(P("a"), livePage("a", null, { config: cfg(1) }));
    fake.seed(P("b"), livePage("b", null, { config: cfg(2) }));
    fake.seed(P("a-child"), livePage("a-child", "a", { config: cfg(0) }));
    fake.seed(R("nodes", "n1"), { name: "n1", pageId: "a", pageIds: ["a"], moduleKey: "core", parentId: null, path: [], customData: { keep: true } });
    fake.seed(R("nodes", "n2"), { name: "n2", moduleKey: "core", parentId: "n1", path: ["n1"] });
    fake.seed(`users/${uid}/nodes/n1/values/2026-10-18`, { values: { score: 7 } });
    fake.seed(`users/${uid}/nodes/n1/activity/history-1`, { type: "created", message: "history" });
    fake.seed(R("activity", "t1"), { pageId: "a-child", pageIds: ["a-child"], marker: "task" });
    fake.seed(R("habits", "h-legacy"), { pageId: "a", marker: "habit" });
  };
  const nonPageDocs = () => Object.fromEntries(fake.paths().filter((p) => !p.includes("/pages/")).map((p) => [p, fake.read(p)]));
  const withoutNavigationOrder = ({ navigationOrder, ...rest }) => rest; // eslint-disable-line no-unused-vars
  const configsOfPages = () => Object.fromEntries(fake.list(`users/${uid}/pages`).map((p) => [p, fake.read(p).config]));
  const parentsOfPages = () => Object.fromEntries(fake.list(`users/${uid}/pages`).map((p) => [p, fake.read(p).parentId]));

  seedWorkspace();
  const docsBeforeReorder = nonPageDocs();
  const parentsBeforeReorder = parentsOfPages();
  const configsBeforeReorder = configsOfPages();
  fake.clearWriteLog();
  await updatePage(uid, "a", { config: normalizePageConfig({ ...fake.read(P("a")).config, navigationOrder: 5 }) });
  await updatePage(uid, "b", { config: normalizePageConfig({ ...fake.read(P("b")).config, navigationOrder: 0 }) });
  await updatePage(uid, "a-child", { config: normalizePageConfig({ ...fake.read(P("a-child")).config, navigationOrder: 3 }) });
  check("[REQ] reordering writes only the reordered Page documents", fake.writeLog, [{ op: "update", path: P("a") }, { op: "update", path: P("b") }, { op: "update", path: P("a-child") }]);
  check("[REQ] reordering does not change any Page parent", parentsOfPages(), parentsBeforeReorder);
  check("[REQ] reordering leaves every Node (parentId, path, fields), Node values and history, and every record association untouched", nonPageDocs(), docsBeforeReorder);
  const configsAfterReorder = configsOfPages();
  check("[REQ] reordering changes only navigationOrder: the complete configuration of every Page is otherwise identical", Object.fromEntries(Object.entries(configsAfterReorder).map(([k, c]) => [k, withoutNavigationOrder(c)])), Object.fromEntries(Object.entries(configsBeforeReorder).map(([k, c]) => [k, withoutNavigationOrder(c)])));
  check("[IMPL] navigationOrder is the only configuration key whose value differs", Object.keys(configsAfterReorder).map((k) => Object.keys(configsAfterReorder[k]).filter((key) => JSON.stringify(configsAfterReorder[k][key]) !== JSON.stringify(configsBeforeReorder[k][key]))), [["navigationOrder"], ["navigationOrder"], ["navigationOrder"]]);
  check("[IMPL] the requested navigationOrder values are stored", [fake.read(P("a")).config.navigationOrder, fake.read(P("b")).config.navigationOrder, fake.read(P("a-child")).config.navigationOrder], [5, 0, 3]);
  fake.clearWriteLog();
  const parentViaUpdate = await rejects(() => updatePage(uid, "a", { parentId: "b" }));
  check("[IMPL] updatePage refuses parentId changes (they must use reparentPage) and writes nothing", [parentViaUpdate !== null, fake.writeLog], [true, []]);

  seedWorkspace();
  const docsBeforeMove = nonPageDocs();
  fake.clearWriteLog();
  await reparentPage(uid, "a", "b");
  check("[REQ] reparentPage writes only the moved Page document", fake.writeLog, [{ op: "update", path: P("a") }]);
  check("[REQ] reparentPage changes only the moved Page's parent", [fake.read(P("a")).parentId, fake.read(P("a-child")).parentId, fake.read(P("b")).parentId], ["b", "a", null]);
  check("[REQ] reparentPage leaves every Node, Node value and history entry, and every record association untouched", nonPageDocs(), docsBeforeMove);
  fake.clearWriteLog();
  const cycleError = await rejects(() => reparentPage(uid, "b", "a-child"));
  check("[REQ] an invalid Page move (cycle) is rejected without writes", [cycleError !== null, fake.writeLog], [true, []]);

  // ---- Trash timestamps and the documented 30-day window ------------------
  fake.reset();
  fake.seed(P("root"), livePage("root"));
  fake.seed(P("kid"), livePage("kid", "root"));
  fake.seed(R("activity", "a"), { pageId: "kid", pageIds: ["kid"], marker: "keep" });
  const recordBeforeTrash = fake.read(R("activity", "a"));
  fake.clearWriteLog();
  await trashPage(uid, "root");
  check("[REQ] trashPage marks every Page of the subtree archived with a trash timestamp", ["root", "kid"].map((id) => [fake.read(P(id)).archived, Boolean(trashExpiresAt(fake.read(P(id))))]), [[true, true], [true, true]]);
  check("[REQ] the purge date is exactly 30 days after the stored trash timestamp", ["root", "kid"].map((id) => trashExpiresAt(fake.read(P(id))).getTime() - fake.read(P(id)).trashedAt.toDate().getTime()), [30 * day, 30 * day]);
  check("[REQ] trashing writes only Page documents", fake.writeLog.every((w) => w.path.includes("/pages/")), true);
  check("[REQ] trashExpiresAt gives no date for a missing, empty or malformed timestamp", [undefined, null, "", "not-a-date", {}].map((trashedAt) => trashExpiresAt({ trashedAt })), [null, null, null, null, null]);
  fake.clearWriteLog();
  await restorePage(uid, "root");
  check("[REQ] restorePage clears the trash state of the subtree and writes only Page documents", [fake.read(P("root")).trashedAt, fake.read(P("kid")).trashedAt, fake.read(P("root")).archived, fake.writeLog.every((w) => w.path.includes("/pages/"))], [null, null, false, true]);
  check("[REQ] trash and restore leave the record and its association untouched", fake.read(R("activity", "a")), recordBeforeTrash);

  fake.reset();
  const nowMs = Date.now();
  fake.seed(P("past-window"), trashedPage("past-window", null, new Date(nowMs - 30 * day - 60_000).toISOString()));
  fake.seed(P("inside-window"), trashedPage("inside-window", null, new Date(nowMs - 30 * day + 60_000).toISOString()));
  fake.seed(P("live"), livePage("live"));
  fake.seed(P("malformed"), trashedPage("malformed", null, "not-a-date"));
  fake.seed(R("activity", "a"), { pageId: "past-window", pageIds: ["past-window", "live"], marker: "keep" });
  await purgeExpiredTrash(uid);
  check("[REQ] the purge removes only Pages trashed more than 30 days ago", [fake.has(P("past-window")), fake.has(P("inside-window")), fake.has(P("live"))], [false, true, true]);
  check("[REQ] a Page with a malformed trash timestamp is not purged (destructive paths fail safely)", fake.has(P("malformed")), true);
  check("[REQ] purging keeps the record and its surviving association", [fake.has(R("activity", "a")), refsOf(fake.read(R("activity", "a"))).has("live"), refsOf(fake.read(R("activity", "a"))).has("past-window")], [true, true, false]);

  // ---- Node reparenting integrity ------------------------------------------
  const node = (id, parentId, nodePath, extra = {}) => ({ name: id, moduleKey: "core", parentId, path: nodePath, archived: false, customData: { keep: id }, ...extra });
  fake.reset();
  fake.seed(R("nodes", "root-a"), node("root-a", null, []));
  fake.seed(R("nodes", "root-b"), node("root-b", null, []));
  fake.seed(R("nodes", "mid"), node("mid", "root-a", ["root-a"]));
  fake.seed(R("nodes", "leaf1"), node("leaf1", "mid", ["root-a", "mid"]));
  fake.seed(R("nodes", "leaf2"), node("leaf2", "mid", ["root-a", "mid"], { archived: true }));
  fake.seed(R("nodes", "study-node"), node("study-node", null, [], { moduleKey: "study" }));
  fake.seed(`users/${uid}/nodes/mid/values/2026-10-18`, { values: { score: 42 } });
  fake.seed(`users/${uid}/nodes/mid/activity/history-1`, { type: "created" });
  const subBefore = [`users/${uid}/nodes/mid/values/2026-10-18`, `users/${uid}/nodes/mid/activity/history-1`].map((p) => fake.read(p));
  fake.clearWriteLog();
  await reparentNode(uid, "mid", "root-b");
  const movedMid = fake.read(R("nodes", "mid"));
  check("[REQ] reparentNode moves the Node and rebuilds its path", [movedMid.parentId, movedMid.path], ["root-b", ["root-b"]]);
  check("[REQ] descendants stay attached to their parent and get rebuilt paths, archived ones included", ["leaf1", "leaf2"].map((id) => [fake.read(R("nodes", id)).parentId, fake.read(R("nodes", id)).path]), [["mid", ["root-b", "mid"]], ["mid", ["root-b", "mid"]]]);
  check("[REQ] Node fields, values and existing history are preserved", [["mid", "leaf1", "leaf2"].map((id) => fake.read(R("nodes", id)).customData.keep), [`users/${uid}/nodes/mid/values/2026-10-18`, `users/${uid}/nodes/mid/activity/history-1`].map((p) => fake.read(p))], [["mid", "leaf1", "leaf2"], subBefore]);
  check("[REQ] no write deletes anything, and every write stays inside the moved subtree or the moved Node's own history", [fake.writeLog.some((w) => w.op === "delete"), fake.writeLog.every((w) => /\/nodes\/(mid|leaf1|leaf2)(\/activity\/[^/]+)?$/.test(w.path))], [false, true]);
  check("[REQ] unrelated Nodes and other namespaces are untouched", [fake.read(R("nodes", "root-a")).path, fake.read(R("nodes", "study-node")).path], [[], []]);
  fake.clearWriteLog();
  const nodeCycle = await rejects(() => reparentNode(uid, "root-b", "leaf1"));
  const nodeSelf = await rejects(() => reparentNode(uid, "mid", "mid"));
  const nodeNamespace = await rejects(() => reparentNode(uid, "mid", "study-node"));
  const nodeMissing = await rejects(() => reparentNode(uid, "mid", "does-not-exist"));
  check("[REQ] invalid Node moves (cycle, self, other namespace, missing parent) are rejected without writes", [nodeCycle !== null, nodeSelf !== null, nodeNamespace !== null, nodeMissing !== null, fake.writeLog], [true, true, true, true, []]);

  // A subtree larger than one write chunk: a failed later chunk keeps parentId authoritative and is repairable.
  fake.reset();
  fake.seed(R("nodes", "root-a"), node("root-a", null, []));
  fake.seed(R("nodes", "root-b"), node("root-b", null, []));
  fake.seed(R("nodes", "big"), node("big", "root-a", ["root-a"]));
  for (let i = 0; i < 451; i++) fake.seed(R("nodes", `kid-${String(i).padStart(3, "0")}`), node(`kid-${i}`, "big", ["root-a", "big"]));
  fake.failCommit(2);
  const chunkError = await rejects(() => reparentNode(uid, "big", "root-b"));
  const kids = () => fake.list(`users/${uid}/nodes`).filter((p) => p.includes("/kid-")).map((p) => fake.read(p));
  const stale = kids().filter((k) => k.path.join("/") !== "root-b/big").length;
  check("[REQ] a failed later chunk rejects, and the moved Node's parentId is already authoritative", [chunkError, fake.read(R("nodes", "big")).parentId], ["Injected batch commit failure", "root-b"]);
  check("[IMPL] the failed chunk leaves some, but not all, descendants with stale cached paths", stale > 0 && stale < 451, true);
  check("[REQ] descendants keep their parent and data even while their cached paths are stale", kids().every((k, i) => k.parentId === "big" && k.customData.keep === `kid-${i}`), true);
  fake.clearFailure();
  const repair = await repairNodePaths(uid, "core");
  check("[REQ] repairNodePaths repairs exactly the stale descendants after the partial move", repair.repaired, stale);
  check("[REQ] after repair every descendant path is consistent and parent and data are unchanged", kids().every((k, i) => k.path.join("/") === "root-b/big" && k.parentId === "big" && k.customData.keep === `kid-${i}`), true);
  check("[REQ] a second repair changes nothing", (await repairNodePaths(uid, "core")).repaired, 0);
} finally {
  await vite.close();
}

console.log(`\n${failures === 0 ? "ALL PASS" : `${failures} FAILURE(S)`}`);
process.exit(failures === 0 ? 0 : 1);
