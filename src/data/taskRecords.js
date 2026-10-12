import { collection, getDocs, query, serverTimestamp, where, writeBatch, doc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { normalizePageAssociations } from "../domain/recordAssociations.js";

const activityPath = (uid) => ["users", uid, "activity"];
const tasksPath = (uid, ...segments) => ["users", uid, "tasks", ...segments];
const MIGRATION_VERSION = 1;

async function getLegacyTasks(uid) {
  const snapshot = await getDocs(query(
    collection(db, ...activityPath(uid)),
    where("capability", "==", "tasks")
  ));
  return snapshot.docs.filter((item) => item.data().type === "task");
}

async function getTaskDocuments(uid) {
  const snapshot = await getDocs(collection(db, ...tasksPath(uid)));
  return snapshot.docs;
}

/** Preview is read-only and safe to run repeatedly. */
export async function previewLegacyTaskMigration(uid) {
  if (!uid) throw new Error("previewLegacyTaskMigration: uid is required.");
  const [legacyTasks, taskDocuments] = await Promise.all([getLegacyTasks(uid), getTaskDocuments(uid)]);
  const migratedIds = new Set(taskDocuments.map((item) => item.data().legacyActivityId).filter(Boolean));
  const migratedTotal = legacyTasks.filter((item) => migratedIds.has(item.id)).length;
  return {
    legacyTotal: legacyTasks.length,
    migratedTotal,
    pending: legacyTasks.length - migratedTotal,
    specializedTotal: taskDocuments.length,
  };
}

/**
 * Copy legacy Task records into the specialist collection with deterministic IDs.
 * Source documents are never changed or deleted. Safe to resume after interruption.
 */
export async function migrateLegacyTasks(uid) {
  if (!uid) throw new Error("migrateLegacyTasks: uid is required.");
  const [legacyTasks, taskDocuments] = await Promise.all([getLegacyTasks(uid), getTaskDocuments(uid)]);
  const migratedIds = new Set(taskDocuments.map((item) => item.data().legacyActivityId).filter(Boolean));
  const byTargetId = new Map(taskDocuments.map((item) => [item.id, item]));
  const pending = legacyTasks.filter((item) => !migratedIds.has(item.id));
  let migratedNow = 0;

  for (let index = 0; index < pending.length; index += 400) {
    const batch = writeBatch(db);
    for (const source of pending.slice(index, index + 400)) {
      const targetId = `legacy_${source.id}`;
      const collision = byTargetId.get(targetId);
      if (collision) {
        throw new Error(`Task migration conflict at "${targetId}"; no source records were deleted.`);
      }
      const sourceData = source.data();
      const associations = normalizePageAssociations(sourceData);
      batch.set(doc(db, ...tasksPath(uid, targetId)), {
        ...sourceData,
        ...associations,
        legacyActivityId: source.id,
        migrationVersion: MIGRATION_VERSION,
        migratedAt: serverTimestamp(),
      });
      migratedNow++;
    }
    await batch.commit();
  }

  return {
    legacyTotal: legacyTasks.length,
    migratedNow,
    alreadyMigrated: migratedIds.size,
    pending: Math.max(0, legacyTasks.length - migratedIds.size - migratedNow),
  };
}

/** Roll back only migration-created copies. Legacy source records remain untouched. */
export async function rollbackLegacyTaskMigration(uid) {
  if (!uid) throw new Error("rollbackLegacyTaskMigration: uid is required.");
  const taskDocuments = await getTaskDocuments(uid);
  const migrated = taskDocuments.filter((item) =>
    item.data().migrationVersion === MIGRATION_VERSION && typeof item.data().legacyActivityId === "string"
  );
  for (let index = 0; index < migrated.length; index += 400) {
    const batch = writeBatch(db);
    migrated.slice(index, index + 400).forEach((item) => batch.delete(item.ref));
    await batch.commit();
  }
  return { deletedCopies: migrated.length, sourceRecordsPreserved: true };
}
