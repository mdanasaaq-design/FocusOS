import assert from "node:assert/strict";
import { planLegacyTaskMigration } from "../src/domain/taskMigration.js";

const legacyTasks = [
  { id: "old-1", capability: "tasks", type: "task", title: "Legacy one", pageId: "page-a", status: "open", metadata: { preserved: true } },
  { id: "old-2", capability: "tasks", type: "task", title: "Legacy two", pageId: null, status: "completed" },
  { id: "not-task", capability: "focus", type: "focus_completed", title: "Ignore" },
];
const specializedTasks = [
  { id: "legacy_old-1", legacyActivityId: "old-1", migrationVersion: 1 },
  { id: "task_new", capability: "tasks", type: "task", title: "New task" },
];
const original = structuredClone(legacyTasks);
const plan = planLegacyTaskMigration(legacyTasks, specializedTasks);
assert.equal(plan.legacyTotal, 2);
assert.equal(plan.migratedTotal, 1);
assert.equal(plan.specializedTotal, 2);
assert.equal(plan.pending.length, 1);
assert.equal(plan.pending[0].sourceId, "old-2");
assert.equal(plan.pending[0].targetId, "legacy_old-2");
assert.equal(plan.pending[0].data.title, "Legacy two");
assert.equal(plan.pending[0].data.pageId, null);
assert.deepEqual(plan.pending[0].data.pageIds, []);
assert.equal("id" in plan.pending[0].data, false);
assert.deepEqual(legacyTasks, original, "planning must not mutate legacy source records");

assert.throws(() => planLegacyTaskMigration(
  [{ id: "collision", capability: "tasks", type: "task", title: "Source" }],
  [{ id: "legacy_collision", title: "Unrelated target" }]
), /migration conflict/);

const afterMigration = [
  ...specializedTasks,
  { id: "legacy_old-2", legacyActivityId: "old-2", migrationVersion: 1 },
];
assert.equal(planLegacyTaskMigration(legacyTasks, afterMigration).pending.length, 0, "migration planning is idempotent");
console.log("Task migration planning tests passed.");
