import assert from "node:assert/strict";
import { createServer } from "vite";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { deleteApp } from "firebase/app";
import { collection, doc, getDoc, getDocs, writeBatch } from "firebase/firestore";

const projectId = "demo-focusos";
process.env.VITE_FIREBASE_API_KEY = "demo-api-key";
process.env.VITE_FIREBASE_AUTH_DOMAIN = `${projectId}.firebaseapp.com`;
process.env.VITE_FIREBASE_PROJECT_ID = projectId;
process.env.VITE_FIREBASE_STORAGE_BUCKET = `${projectId}.appspot.com`;
process.env.VITE_FIREBASE_MESSAGING_SENDER_ID = "demo-sender";
process.env.VITE_FIREBASE_APP_ID = "demo-app";
process.env.VITE_FIREBASE_EMULATORS = "true";

let firebaseAuth;
const vite = await createServer({
  configFile: "vite.config.js",
  server: { middlewareMode: true },
  appType: "custom",
  logLevel: "error",
});

const pageRef = (db, uid, id) => doc(db, "users", uid, "pages", id);
const recordRef = (db, uid, collectionName, id) => doc(db, "users", uid, collectionName, id);
const hasDeletedPageReference = (record, deletedIds) =>
  deletedIds.includes(record.pageId) ||
  (Array.isArray(record.pageIds) && record.pageIds.some((id) => deletedIds.includes(id)));

async function seedInBatches(db, collectionRef, records) {
  for (let start = 0; start < records.length; start += 450) {
    const batch = writeBatch(db);
    for (const record of records.slice(start, start + 450)) {
      batch.set(doc(collectionRef, record.id), record.data);
    }
    await batch.commit();
  }
}

try {
  const [{ auth, db }, pagesApi, lifecycleApi] = await Promise.all([
    vite.ssrLoadModule("/src/lib/firebase.js"),
    vite.ssrLoadModule("/src/data/pages.js"),
    vite.ssrLoadModule("/src/application/pageLifecycle.js"),
  ]);
  firebaseAuth = auth;
  const credential = await createUserWithEmailAndPassword(
    auth,
    `page-lifecycle-${Date.now()}@focusos.test`,
    "FocusOS-page-lifecycle-2026!"
  );
  const uid = credential.user.uid;
  const { permanentlyDeletePage, reparentPage, updatePage } = pagesApi;
  const { PAGE_REFERENCE_COLLECTIONS } = lifecycleApi;

  // All test data belongs to this disposable Firebase Auth emulator account.
  const pages = [
    ["delete-root", { name: "Delete root", parentId: null, archived: true, trashedAt: "2026-01-01T00:00:00.000Z" }],
    ["delete-child", { name: "Delete child", parentId: "delete-root", archived: true, trashedAt: "2026-01-01T00:00:00.000Z" }],
    ["survivor", { name: "Survivor", parentId: null, archived: false, trashedAt: null }],
    ["source-parent", { name: "Source", parentId: null, archived: false, trashedAt: null }],
    ["target-parent", { name: "Target", parentId: null, archived: false, trashedAt: null }],
    ["moving-page", { name: "Moving", parentId: "source-parent", archived: false, trashedAt: null }],
    ["moving-child", { name: "Moving child", parentId: "moving-page", archived: false, trashedAt: null }],
    ["reorder-page", {
      name: "Reorder",
      parentId: null,
      archived: false,
      trashedAt: null,
      config: {
        fields: [],
        capabilities: [],
        showChildren: true,
        showInNavigation: true,
        navigationOrder: 1,
        showOnDashboard: false,
        dashboardWidgets: [],
        trackers: [],
        capabilityConfig: { retained: true },
        toolViews: [],
      },
    }],
  ];
  const pageSeed = writeBatch(db);
  for (const [id, data] of pages) pageSeed.set(pageRef(db, uid, id), data);
  await pageSeed.commit();

  const nodeData = {
    moduleKey: "core",
    name: "Node must survive Page operations",
    parentId: null,
    path: [],
    pageId: "delete-root",
    pageIds: ["delete-root", "survivor"],
    fields: [{ id: "field-1", name: "Stable field", type: "text" }],
    customData: { preserve: true },
    archived: false,
    order: 4,
  };
  await seedInBatches(db, collection(db, "users", uid, "nodes"), [
    { id: "shared-node", data: nodeData },
    { id: "hierarchy-node", data: { moduleKey: "core", name: "Hierarchy", parentId: "shared-node", path: ["shared-node"], pageId: "survivor", customData: { untouched: true } } },
  ]);

  // Page reparenting and navigation reorder must not rewrite Node hierarchy,
  // Node fields, or the records displayed by those Pages.
  const nodeBeforePageMove = (await getDoc(recordRef(db, uid, "nodes", "hierarchy-node"))).data();
  const sharedNodeBeforePageMove = (await getDoc(recordRef(db, uid, "nodes", "shared-node"))).data();
  await reparentPage(uid, "moving-page", "target-parent");
  const movedPage = (await getDoc(pageRef(db, uid, "moving-page"))).data();
  assert.equal(movedPage.parentId, "target-parent", "reparentPage must update the Page parent");
  assert.equal((await getDoc(pageRef(db, uid, "moving-child"))).data().parentId, "moving-page", "moving a Page must retain its child relationship");

  await updatePage(uid, "reorder-page", {
    config: {
      fields: [],
      capabilities: [],
      showChildren: true,
      showInNavigation: true,
      navigationOrder: 7,
      showOnDashboard: false,
      dashboardWidgets: [],
      trackers: [],
      capabilityConfig: { retained: true },
      toolViews: [],
    },
  });
  const reorderedPage = (await getDoc(pageRef(db, uid, "reorder-page"))).data();
  assert.equal(reorderedPage.config.navigationOrder, 7, "Page reorder must persist navigationOrder");
  assert.deepEqual(reorderedPage.config.capabilityConfig, { retained: true }, "Page reorder must preserve the supplied configuration");
  assert.deepEqual((await getDoc(recordRef(db, uid, "nodes", "hierarchy-node"))).data(), nodeBeforePageMove, "Page move/reorder must not rewrite Node hierarchy or values");
  assert.deepEqual((await getDoc(recordRef(db, uid, "nodes", "shared-node"))).data(), sharedNodeBeforePageMove, "Page move/reorder must not rewrite Node associations or fields");

  const activityCollection = collection(db, "users", uid, "activity");
  const activityRecords = [
    { id: "legacy-primary", data: { pageId: "delete-root", marker: "legacy-primary", stableValue: 1 } },
    { id: "array-only", data: { pageIds: ["delete-root", "survivor"], marker: "array-only", stableValue: 2 } },
    { id: "mixed-primary", data: { pageId: "survivor", pageIds: ["delete-root", "survivor"], marker: "mixed-primary", stableValue: 3 } },
    { id: "duplicate-array", data: { pageIds: ["delete-root", "delete-root", "survivor", "survivor"], marker: "duplicate-array", stableValue: 4 } },
    { id: "child-reference", data: { pageId: "delete-child", pageIds: ["delete-child", "survivor"], marker: "child-reference", stableValue: 5 } },
    ...Array.from({ length: 396 }, (_, index) => ({
      id: `bulk-${String(index).padStart(3, "0")}`,
      data: {
        pageId: "delete-root",
        pageIds: ["delete-root", "survivor"],
        marker: `bulk-${index}`,
        stableValue: index,
      },
    })),
    { id: "unrelated", data: { pageId: "other-page", pageIds: ["other-page"], marker: "unrelated", stableValue: 999 } },
  ];
  await seedInBatches(db, activityCollection, activityRecords);
  await seedInBatches(db, collection(db, "users", uid, "habits"), [
    { id: "legacy-habit", data: { pageId: "delete-child", name: "Preserve habit", stableValue: true } },
  ]);

  // Inject failure at the third real batch commit: one Node detach commits,
  // the first 400 activity updates commit, and the final activity update fails.
  // Every successful commit still goes to the Firestore emulator.
  let commitCount = 0;
  const batchFactory = () => {
    const batch = writeBatch(db);
    return {
      update(...args) {
        batch.update(...args);
        return this;
      },
      delete(...args) {
        batch.delete(...args);
        return this;
      },
      async commit() {
        commitCount += 1;
        if (commitCount === 3) throw new Error("Injected emulator test failure on Page detach batch 3");
        return batch.commit();
      },
    };
  };

  let failureMessage = null;
  try {
    await permanentlyDeletePage(uid, "delete-root", { batchFactory });
  } catch (error) {
    failureMessage = error.message;
  }
  assert.equal(failureMessage, "Injected emulator test failure on Page detach batch 3", "the injected second activity chunk failure must propagate");
  assert.ok((await getDoc(pageRef(db, uid, "delete-root"))).exists(), "the Page root must remain when a detach batch fails");
  assert.ok((await getDoc(pageRef(db, uid, "delete-child"))).exists(), "the Page child must remain when a detach batch fails");

  const partialActivity = (await getDocs(activityCollection)).docs.map((snapshot) => ({ id: snapshot.id, ...snapshot.data() }));
  const partialStale = partialActivity.filter((record) => hasDeletedPageReference(record, ["delete-root", "delete-child"]));
  assert.equal(partialActivity.length, 402, "all activity records must still exist after the failed deletion");
  assert.equal(partialStale.length, 1, "only the failed final activity batch should retain a deleted-Page reference");
  assert.ok(partialActivity.every((record) => record.marker === "unrelated" || typeof record.marker === "string"), "activity marker fields must remain readable");
  const partiallyDetachedNode = (await getDoc(recordRef(db, uid, "nodes", "shared-node"))).data();
  assert.deepEqual(partiallyDetachedNode.pageIds, ["survivor"], "the Node detach batch must persist before the injected later failure");
  assert.equal(partiallyDetachedNode.pageId, "survivor", "the Node primary association must move to its surviving Page");
  assert.deepEqual(partiallyDetachedNode.fields, nodeData.fields, "Node fields must survive reference detachment");
  assert.deepEqual(partiallyDetachedNode.customData, nodeData.customData, "unrelated Node data must survive reference detachment");

  // Retry with the default real Firestore batch factory. It must finish the
  // outstanding detach, preserve every record, then remove only Page documents.
  await permanentlyDeletePage(uid, "delete-root");
  assert.equal((await getDoc(pageRef(db, uid, "delete-root"))).exists(), false, "successful retry must delete the Page root");
  assert.equal((await getDoc(pageRef(db, uid, "delete-child"))).exists(), false, "successful retry must delete the Page child");
  assert.equal((await getDoc(pageRef(db, uid, "survivor"))).exists(), true, "successful retry must preserve the unrelated Page");

  const finalActivity = (await getDocs(activityCollection)).docs.map((snapshot) => ({ id: snapshot.id, ...snapshot.data() }));
  assert.equal(finalActivity.length, 402, "Page deletion must preserve every activity record");
  assert.equal(finalActivity.filter((record) => hasDeletedPageReference(record, ["delete-root", "delete-child"])).length, 0, "no activity record may retain a deleted-Page reference");
  const byId = new Map(finalActivity.map((record) => [record.id, record]));
  assert.equal(byId.get("legacy-primary").pageId, null, "legacy pageId-only activity must be detached");
  assert.deepEqual(byId.get("legacy-primary").pageIds, [], "legacy activity receives an empty pageIds array under current implementation");
  assert.deepEqual(byId.get("array-only").pageIds, ["survivor"], "array-only association must preserve the surviving Page");
  assert.equal(byId.get("array-only").pageId, "survivor", "array-only association must retain the surviving Page as primary");
  assert.equal(byId.get("mixed-primary").pageId, "survivor", "mixed association must retain its surviving primary Page");
  assert.deepEqual(byId.get("duplicate-array").pageIds, ["survivor", "survivor"], "detachment must preserve the original duplicate survivor entries");
  assert.equal(byId.get("child-reference").pageId, "survivor", "subtree child references must be detached");
  assert.equal(byId.get("unrelated").pageId, "other-page", "unrelated Page associations must remain untouched");
  assert.equal(byId.get("bulk-000").stableValue, 0, "unrelated activity fields must survive detachment");

  const finalHabit = (await getDoc(recordRef(db, uid, "habits", "legacy-habit"))).data();
  assert.equal(finalHabit.pageId, null, "legacy specialist-record pageId must be detached");
  assert.equal(finalHabit.name, "Preserve habit", "specialist record content must survive detachment");
  assert.equal(finalHabit.stableValue, true, "specialist record custom fields must survive detachment");

  const finalNode = (await getDoc(recordRef(db, uid, "nodes", "shared-node"))).data();
  assert.deepEqual(finalNode.pageIds, ["survivor"], "Node must retain its surviving Page association");
  assert.equal(finalNode.pageId, "survivor", "Node primary Page association must retain the survivor");
  assert.deepEqual(finalNode.fields, nodeData.fields, "Node fields must remain intact");
  assert.deepEqual(finalNode.customData, nodeData.customData, "Node custom data must remain intact");
  assert.deepEqual((await getDoc(recordRef(db, uid, "nodes", "hierarchy-node"))).data(), nodeBeforePageMove, "Page lifecycle must not alter Node parent/path hierarchy");

  for (const collectionName of PAGE_REFERENCE_COLLECTIONS) {
    const snapshots = await getDocs(collection(db, "users", uid, collectionName));
    for (const snapshot of snapshots.docs) {
      assert.equal(
        hasDeletedPageReference(snapshot.data(), ["delete-root", "delete-child"]),
        false,
        `${collectionName}/${snapshot.id} must not reference a deleted Page`
      );
    }
  }

  console.log("Firestore Page lifecycle emulator tests passed: Page reparent/reorder preservation, legacy association queries, partial detach failure, persisted partial state, retry, and record preservation.");
} finally {
  if (firebaseAuth) await deleteApp(firebaseAuth.app);
  await vite.close();
}

process.exit(0);
