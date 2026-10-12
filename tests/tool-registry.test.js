import assert from "node:assert/strict";
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
assert.equal(getToolDefinition("tasks").recordModel.collection, "activity");
assert.equal(getToolDefinition("tasks").recordModel.discriminator.value, "tasks");
assert.equal(getToolDefinition("tasks").surfaces.standalone, "implemented");
assert.equal(getToolDefinition("focus").globalConfig.status, "persisted");
assert.deepEqual(normalizeToolViewConfig("tasks", "default", {
  sortBy: "title",
  sortDirection: "desc",
  groupBy: "priority",
  layout: "compact",
  showDueDate: false,
  showPriority: true,
  unknown: "discard",
}), {
  recordScope: "associated",
  sortBy: "title",
  sortDirection: "desc",
  groupBy: "priority",
  layout: "compact",
  showDueDate: false,
  showPriority: true,
});
assert.deepEqual(normalizeToolViewConfig("tasks", "default", {
  showDueDate: "false",
  showPriority: 0,
}), {
  recordScope: "associated",
  sortBy: "dueDate",
  sortDirection: "asc",
  groupBy: "none",
  layout: "list",
  showDueDate: true,
  showPriority: true,
});
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

console.log("Tool Registry contract tests passed.");
