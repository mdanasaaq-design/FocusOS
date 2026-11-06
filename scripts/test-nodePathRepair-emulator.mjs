import { createServer } from "vite";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { deleteApp } from "firebase/app";
import { collection, doc, getDocs, writeBatch } from "firebase/firestore";

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

try {
  const [{ auth, db }, { repairNodePaths, getNodes }] = await Promise.all([
    vite.ssrLoadModule("/src/lib/firebase.js"),
    vite.ssrLoadModule("/src/data/nodes.js"),
  ]);
  const suffix = Date.now();
  const credential = await createUserWithEmailAndPassword(
    auth,
    `node-repair-${suffix}@focusos.test`,
    "FocusOS-node-repair-2026!"
  );
  firebaseAuth = auth;
  const uid = credential.user.uid;
  const nodeCollection = collection(db, "users", uid, "nodes");

  // Seed more than one Firestore-safe chunk with deliberately stale caches.
  for (let start = 0; start < 451; start += 450) {
    const batch = writeBatch(db);
    const end = Math.min(start + 450, 451);
    for (let index = start; index < end; index++) {
      batch.set(doc(nodeCollection, `repair-${index}`), {
        moduleKey: "core",
        parentId: null,
        path: ["stale-cache"],
        name: `Preserved node ${index}`,
        customData: { stable: true, index },
        archived: false,
        order: index,
      });
    }
    await batch.commit();
  }

  let commits = 0;
  let injectedFailureObserved = false;
  try {
    await repairNodePaths(uid, "core", {
      commitChunk: async (updates) => {
        commits++;
        if (commits === 2) throw new Error("Injected Firestore adapter failure on chunk 2");
        const batch = writeBatch(db);
        for (const update of updates) {
          batch.update(doc(nodeCollection, update.id), { path: update.path });
        }
        await batch.commit();
      },
    });
  } catch (error) {
    injectedFailureObserved = error.message === "Injected Firestore adapter failure on chunk 2";
  }

  if (!injectedFailureObserved) throw new Error("Expected injected second-chunk failure was not observed.");
  const partial = await getNodes(uid, "core", { includeArchived: true });
  const repairedCount = partial.filter((node) => node.path.length === 0).length;
  const staleCount = partial.filter((node) => node.path[0] === "stale-cache").length;
  if (partial.length !== 451 || repairedCount !== 450 || staleCount !== 1) {
    throw new Error(`Unexpected persisted partial state: total=${partial.length}, repaired=${repairedCount}, stale=${staleCount}`);
  }
  if (!partial.every((node) => node.customData?.stable === true && node.customData.index === node.order)) {
    throw new Error("Unrelated Node fields changed during the failed repair.");
  }

  const retryResult = await repairNodePaths(uid, "core");
  const afterRetry = await getNodes(uid, "core", { includeArchived: true });
  if (retryResult.repaired !== 1) throw new Error(`Retry should repair exactly one stale path; repaired ${retryResult.repaired}.`);
  if (afterRetry.some((node) => !Array.isArray(node.path) || node.path.length !== 0)) {
    throw new Error("Retry did not reconcile every persisted Node path.");
  }
  if (!afterRetry.every((node) => node.customData?.stable === true && node.customData.index === node.order)) {
    throw new Error("Unrelated Node fields changed during retry.");
  }

  console.log("Firestore Node path repair failure/retry passed: 450 persisted, second chunk failed, retry repaired the remaining Node, and unrelated fields were preserved.");
} finally {
  if (firebaseAuth) await deleteApp(firebaseAuth.app);
  await vite.close();
}

// Firebase SDKs may leave Node timers alive after an emulator-backed test.
process.exit(0);
