import { collection, getDocs, query, serverTimestamp, where, writeBatch, doc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { planLegacyTaskMigration } from "../domain/taskMigration.js";

const activityPath = (uid) => ["users", uid, "activity"];
const tasksPath = (uid, ...segments) => ["users", uid, "tasks", ...segments];
const MIGRATION_VERSION = 1;

async function getLegacyTasks(uid) {
  const snapshot = await getDocs(query(
    collection(db, ...activityPath(uid)),
    where("capability", "==", "tasks")
  ));
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() })).filter((item) => item.type === "task");
}

async function getTaskDocuments(uid) {
  const snapshot = await getDocs(collection(db, ...tasksPath(uid)));
  return snapshot.docs.map((item) => ({ id: item.id, ref: item.ref, ...item.data() }));
}

/** Preview is read-only and safe to run repeatedly. */
export async function previewLegacyTaskMigration(uid) {
  if (!uid) throw new Error("previewLegacyTaskMigration: uid is required.");
  const [legacyTasks, taskDocuments] = await Promise.all([getLegacyTasks(uid), getTaskDocuments(uid)]);
  const plan = planLegacyTaskMigration(legacyTasks, taskDocuments);
  return {
    legacyTotal: plan.legacyTotal,
    migratedTotal: plan.migratedTotal,
    pending: plan.pending.length,
    specializedTotal: plan.specializedTotal,
  };
}

/**
 * Copy legacy Task records into the specialist collection with deterministic IDs.
 * Source documents are never changed or deleted. Safe to resume after interruption.
 */
export async function migrateLegacyTasks(uid) {
  if (!uid) throw new Error("migrateLegacyTasks: uid is required.");
  const [legacyTasks, taskDocuments] = await Promise.all([getLegacyTasks(uid), getTaskDocuments(uid)]);
  const plan = planLegacyTaskMigration(legacyTasks, taskDocuments);
  for (let index = 0; index < plan.pending.length; index += 400) {
    const batch = writeBatch(db);
    for (const item of plan.pending.slice(index, index + 400)) {
      batch.set(doc(db, ...tasksPath(uid, item.targetId)), {
        ...item.data,
        migratedAt: serverTimestamp(),
      });
    }
    await batch.commit();
  }

  return {
    legacyTotal: plan.legacyTotal,
    migratedNow: plan.pending.length,
    alreadyMigrated: plan.migratedTotal,
    pending: 0,
  };
}

/** Roll back only migration-created copies. Legacy source records remain untouched. */
export async function rollbackLegacyTaskMigration(uid) {
  if (!uid) throw new Error("rollbackLegacyTaskMigration: uid is required.");
  const taskDocuments = await getTaskDocuments(uid);
  const migrated = taskDocuments.filter((item) =>
    item.migrationVersion === MIGRATION_VERSION && typeof item.legacyActivityId === "string"
  );
  for (let index = 0; index < migrated.length; index += 400) {
    const batch = writeBatch(db);
    migrated.slice(index, index + 400).forEach((item) => batch.delete(item.ref));
    await batch.commit();
  }
  return { deletedCopies: migrated.length, sourceRecordsPreserved: true };
}
