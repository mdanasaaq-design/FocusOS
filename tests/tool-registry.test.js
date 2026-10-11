import assert from "node:assert/strict";
import {
  TOOL_REGISTRY_VERSION,
  TOOL_DEFINITIONS,
  getToolDefinition,
  getToolViewDefinition,
  getPageRuntimeToolKeys,
  getStandaloneToolKeys,
  normalizeToolViewConfig,
  createToolViewPlacement,
} from "../src/tools/registry.js";

assert.equal(TOOL_REGISTRY_VERSION, 1);
assert.equal(getToolDefinition("tasks").key, "tasks");
assert.equal(getToolDefinition("tasks").recordModel.collection, "activity");
assert.equal(getToolDefinition("tasks").recordModel.discriminator.value, "tasks");
assert.equal(getToolDefinition("tasks").surfaces.standalone, "implemented");
assert.deepEqual(new Set(getStandaloneToolKeys()), new Set(getPageRuntimeToolKeys()));
assert.equal(getToolViewDefinition("tasks", "standalone").surface, "standalone");
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
  { focusMinutes: 50, breakMinutes: 5 }
);
assert.deepEqual(
  normalizeToolViewConfig("focus", "standalone", { focusMinutes: -2, breakMinutes: "abc" }),
  { focusMinutes: 25, breakMinutes: 5 }
);
assert.deepEqual(
  normalizeToolViewConfig("habits", "default", {
    period: "weekly",
    reminderTime: "09:30",
    unrecognized: "discard",
  }),
  { period: "weekly", reminderTime: "09:30" }
);
assert.deepEqual(
  normalizeToolViewConfig("habits", "default", { period: "quarterly", reminderTime: "25:99" }),
  { period: "daily", reminderTime: "" }
);

const placement = createToolViewPlacement({
  toolKey: "focus",
  viewKey: "default",
  config: { focusMinutes: 45, breakMinutes: 10 },
});
assert.deepEqual(placement, {
  toolKey: "focus",
  viewKey: "default",
  config: { focusMinutes: 45, breakMinutes: 10 },
});
assert.equal("records" in placement, false);
assert.deepEqual(createToolViewPlacement({ toolKey: "tasks" }), {
  toolKey: "tasks",
  viewKey: "default",
  config: {},
});
assert.throws(
  () => createToolViewPlacement({ toolKey: "not-a-tool" }),
  /Tool cannot be placed on a Page/
);
assert.throws(
  () => normalizeToolViewConfig("tasks", "kanban", {}),
  /Unsupported tool view/
);

console.log("Tool Registry contract tests passed.");
