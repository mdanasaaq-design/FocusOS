import assert from "node:assert/strict";
import { buildTaskView } from "../src/domain/taskView.js";
import {
  TOOL_REGISTRY_VERSION,
  TOOL_DEFINITIONS,
  getToolDefinition,
  getToolViewDefinition,
  getPageRuntimeToolKeys,
  getStandaloneToolKeys,
  normalizeToolViewConfig,
  normalizeToolGlobalConfig,
  normalizeToolViewOverrides,
  resolveToolViewConfig,
  createToolViewPlacement,
  normalizeToolViewPlacements,
} from "../src/tools/registry.js";

assert.equal(TOOL_REGISTRY_VERSION, 1);
assert.equal(getToolDefinition("tasks").key, "tasks");
assert.equal(getToolDefinition("tasks").recordModel.collection, "tasks");
assert.equal(getToolDefinition("tasks").recordModel.legacyCollection, "activity");
assert.equal(getToolDefinition("tasks").recordModel.status, "specialized-with-legacy-read");
assert.equal(getToolDefinition("tasks").surfaces.standalone, "implemented");
assert.equal(getToolDefinition("focus").globalConfig.status, "persisted");
assert.deepEqual(normalizeToolGlobalConfig("focus", { focusMinutes: "50", breakMinutes: 999 }), { focusMinutes: 50, breakMinutes: 5 });
assert.deepEqual(normalizeToolViewOverrides("focus", "default", { breakMinutes: 15, unknown: true }), { breakMinutes: 15 });
assert.deepEqual(resolveToolViewConfig("focus", "default", { focusMinutes: 50, breakMinutes: 10 }, { breakMinutes: 15 }), { recordScope: "associated", focusMinutes: 50, breakMinutes: 15 });
assert.deepEqual(new Set(getStandaloneToolKeys()), new Set(getPageRuntimeToolKeys()));
assert.equal(getToolViewDefinition("tasks", "standalone").surface, "standalone");
assert.equal(getToolViewDefinition("tasks", "default").configSchema.recordScope.default, "associated");
assert.equal(getToolViewDefinition("tasks", "standalone").configSchema.recordScope.default, "all");
assert.equal(getToolDefinition("missing"), null);
assert.equal(getToolViewDefinition("tasks", "unknown"), null);

assert.deepEqual(
  new Set(getPageRuntimeToolKeys()),
  new Set(["tasks", "focus", "timeTracking", "habits", "goals", "workout", "measurements", "analytics"])
);
assert.equal(TOOL_DEFINITIONS.length, 8);

assert.deepEqual(
  normalizeToolViewConfig("focus", "default", {
    focusMinutes: "50",
    breakMinutes: 121,
    unrecognized: true,
  }),
  { recordScope: "associated", focusMinutes: 50, breakMinutes: 5 }
);
assert.deepEqual(
  normalizeToolViewConfig("focus", "standalone", { focusMinutes: -2, breakMinutes: "abc" }),
  { recordScope: "all", focusMinutes: 25, breakMinutes: 5 }
);
assert.deepEqual(
  normalizeToolViewConfig("habits", "default", {
    period: "weekly",
    reminderTime: "09:30",
    unrecognized: "discard",
  }),
  { recordScope: "associated", period: "weekly", reminderTime: "09:30" }
);
assert.deepEqual(
  normalizeToolViewConfig("habits", "default", { period: "quarterly", reminderTime: "25:99" }),
  { recordScope: "associated", period: "daily", reminderTime: "" }
);

const placement = createToolViewPlacement({
  id: "focus-primary",
  toolKey: "focus",
  viewKey: "default",
  config: { focusMinutes: 45, breakMinutes: 10 },
});
assert.deepEqual(placement, {
  id: "focus-primary",
  toolKey: "focus",
  viewKey: "default",
  config: { focusMinutes: 45, breakMinutes: 10 },
});
assert.equal("records" in placement, false);
assert.deepEqual(createToolViewPlacement({ id: "tasks-one", toolKey: "tasks" }), {
  id: "tasks-one",
  toolKey: "tasks",
  viewKey: "default",
  config: {},
});
assert.throws(() => createToolViewPlacement({ toolKey: "tasks" }), /stable placement id is required/);
assert.deepEqual(normalizeToolViewPlacements([
  { id: "tasks-one", toolKey: "tasks" },
  { id: "tasks-two", toolKey: "tasks" },
  { id: "tasks-one", toolKey: "focus" },
  { id: "broken", toolKey: "unknown" },
  null,
]), [
  { id: "tasks-one", toolKey: "tasks", viewKey: "default", config: {} },
  { id: "tasks-two", toolKey: "tasks", viewKey: "default", config: {} },
]);
assert.throws(
  () => createToolViewPlacement({ toolKey: "not-a-tool" }),
  /Tool cannot be placed on a Page/
);
assert.throws(
  () => normalizeToolViewConfig("tasks", "kanban", {}),
  /Unsupported tool view/
);


const taskRecords = [
  { id: "t1", capability: "tasks", type: "task", title: "Zebra", status: "open", priority: "high", dueDate: "2026-10-15", pageId: "p1" },
  { id: "t2", capability: "tasks", type: "task", title: "Alpha", status: "completed", priority: "low", dueDate: "2026-10-12", pageId: "p2" },
  { id: "t3", capability: "tasks", type: "task", title: "Bravo", status: "open", priority: "normal", dueDate: "2026-10-13", pageId: null },
  { id: "other", capability: "focus", type: "focus_completed", title: "Session", status: "completed" },
];
const sourceBefore = structuredClone(taskRecords);
const openByDueDate = buildTaskView(taskRecords, { statusFilter: "open", sortBy: "dueDate", sortDirection: "asc", groupBy: "none" });
assert.deepEqual(openByDueDate.tasks.map((task) => task.id), ["t3", "t1"]);
assert.equal(openByDueDate.openCount, 2);
const completedByTitle = buildTaskView(taskRecords, { statusFilter: "completed", sortBy: "title", sortDirection: "asc" });
assert.deepEqual(completedByTitle.tasks.map((task) => task.id), ["t2"]);
const highPriority = buildTaskView(taskRecords, { statusFilter: "all", priorityFilter: "high", sortBy: "priority" });
assert.deepEqual(highPriority.tasks.map((task) => task.id), ["t1"]);
const grouped = buildTaskView(taskRecords, { statusFilter: "all", groupBy: "status" });
assert.deepEqual(grouped.groups.map((group) => group.label), ["Completed", "Open"]);
assert.deepEqual(grouped.groups.find((group) => group.label === "Open").tasks.map((task) => task.id), ["t1", "t3"]);
const compactView = buildTaskView(taskRecords, { statusFilter: "all", sortBy: "title", sortDirection: "asc", layout: "compact" });
assert.deepEqual(compactView.tasks.map((task) => task.title), ["Alpha", "Bravo", "Zebra"]);
assert.deepEqual(taskRecords, sourceBefore, "building a view must not mutate underlying records");
assert.equal(getToolDefinition("tasks").views[0].configSchema.groupBy.default, "none");
assert.deepEqual(normalizeToolGlobalConfig("tasks", { sortBy: "title", groupBy: "status", layout: "compact", unknown: true }), {
  statusFilter: "open",
  priorityFilter: "all",
  sortBy: "title",
  sortDirection: "asc",
  groupBy: "status",
  layout: "compact",
});

console.log("Tool Registry contract tests passed.");
