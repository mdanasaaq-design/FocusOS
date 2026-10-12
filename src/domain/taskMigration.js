import { normalizePageAssociations } from "./recordAssociations.js";

/** Pure, idempotent migration plan. No source records are mutated or deleted. */
export function planLegacyTaskMigration(legacyTasks = [], specializedTasks = []) {
  const migratedLegacyIds = new Set(specializedTasks.map((task) => task.legacyActivityId).filter(Boolean));
  const existingById = new Map(specializedTasks.map((task) => [task.id, task]));
  const pending = [];
  for (const source of legacyTasks.filter((item) => item.capability === "tasks" && item.type === "task")) {
    if (migratedLegacyIds.has(source.id)) continue;
    const targetId = `legacy_${source.id}`;
    if (existingById.has(targetId)) {
      throw new Error(`Task migration conflict at "${targetId}"; source records were not changed.`);
    }
    const { id: _sourceId, ...sourceData } = source;
    pending.push({
      sourceId: source.id,
      targetId,
      data: {
        ...sourceData,
        ...normalizePageAssociations(sourceData),
        legacyActivityId: source.id,
        migrationVersion: 1,
      },
    });
  }
  return {
    legacyTotal: legacyTasks.filter((item) => item.capability === "tasks" && item.type === "task").length,
    migratedTotal: migratedLegacyIds.size,
    specializedTotal: specializedTasks.length,
    pending,
  };
}
