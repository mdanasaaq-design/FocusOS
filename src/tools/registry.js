// FocusOS Tool Registry — first runtime contract
// =====================================================================
// This registry describes the currently implemented Page capability tools.
// It is deliberately explicit about legacy storage and unsupported surfaces:
// a registry entry is not proof that standalone launching or specialized
// record migration has been completed.

const activityTool = (key, label, description, recordTypes, actions, viewConfigSchema = {}) => ({
  key,
  label,
  description,
  version: 1,
  status: "implemented",
  surfaces: {
    page: "implemented",
    standalone: "implemented",
  },
  actions,
  recordModel: {
    status: "legacy-generic-activity",
    collection: "activity",
    discriminator: { field: "capability", value: key },
    recordTypes,
  },
  globalConfig: {
    status: "not-persisted",
    defaults: {},
    schema: {},
  },
  views: ["default", "standalone"].map((viewKey) => ({
    key: viewKey,
    label,
    surface: viewKey === "default" ? "page" : "standalone",
    status: "implemented",
    configDefaults: Object.fromEntries(
      Object.entries(viewConfigSchema).map(([field, definition]) => [field, definition.default])
    ),
    configSchema: viewConfigSchema,
  })),
});

export const TOOL_REGISTRY_VERSION = 1;

export const TOOL_DEFINITIONS = [
  activityTool("tasks", "Tasks", "Create, prioritize, schedule and complete tasks.", ["task"], ["create", "complete"]),
  activityTool("focus", "Focus Sessions", "Run focus and break sessions; preserve completed-session history.", ["focus_completed"], ["start", "pause", "reset", "complete"], {
    focusMinutes: { type: "integer", default: 25, min: 1, max: 240 },
    breakMinutes: { type: "integer", default: 5, min: 1, max: 120 },
  }),
  activityTool("timeTracking", "Timer", "Record elapsed time with a timer or manual entry.", ["time_entry"], ["start", "stop", "create"]),
  activityTool("habits", "Habits", "Create recurring habits, check them off and track streaks.", ["habit", "habit_checkin"], ["create", "checkIn"], {
    period: { type: "enum", default: "daily", values: ["daily", "weekly", "monthly"] },
    reminderTime: { type: "time", default: "" },
  }),
  activityTool("goals", "Goals", "Define measurable targets and log progress.", ["goal", "goal_progress"], ["create", "logProgress"]),
  activityTool("workout", "Workouts", "Log exercises, sets, reps, load and duration.", ["workout"], ["logWorkout"]),
  activityTool("measurements", "Measurements", "Record dated measurements and inspect their history.", ["measurement"], ["logMeasurement"]),
  activityTool("analytics", "Analytics", "Summarize activity across Page capabilities.", [], ["read"], {}),
].map((definition) => ({
  ...definition,
  views: definition.views.map((view) => ({ ...view, configSchema: { ...view.configSchema } })),
}));

const definitionsByKey = new Map(TOOL_DEFINITIONS.map((definition) => [definition.key, definition]));

export function getToolDefinition(toolKey) {
  return definitionsByKey.get(toolKey) || null;
}

export function getToolViewDefinition(toolKey, viewKey = "default") {
  const tool = getToolDefinition(toolKey);
  if (!tool) return null;
  return tool.views.find((view) => view.key === viewKey) || null;
}

export function getPageRuntimeToolKeys() {
  return TOOL_DEFINITIONS
    .filter((definition) => definition.surfaces.page === "implemented")
    .map((definition) => definition.key);
}

export function getStandaloneToolKeys() {
  return TOOL_DEFINITIONS
    .filter((definition) => definition.surfaces.standalone === "implemented")
    .map((definition) => definition.key);
}

function normalizeField(value, definition) {
  if (definition.type === "integer") {
    const number = Number(value);
    return Number.isInteger(number) && number >= definition.min && number <= definition.max
      ? number
      : definition.default;
  }
  if (definition.type === "enum") {
    return definition.values.includes(value) ? value : definition.default;
  }
  if (definition.type === "time") {
    if (value === "") return "";
    if (typeof value !== "string" || !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value)) return definition.default;
    return value;
  }
  return definition.default;
}

/** Normalize a view's local configuration without changing underlying records. */
export function normalizeToolViewConfig(toolKey, viewKey = "default", config = {}) {
  const view = getToolViewDefinition(toolKey, viewKey);
  if (!view) throw new Error(`Unsupported tool view: ${toolKey}/${viewKey}`);
  const source = config && typeof config === "object" && !Array.isArray(config) ? config : {};
  return Object.fromEntries(
    Object.entries(view.configSchema).map(([key, definition]) => [
      key,
      normalizeField(source[key] ?? definition.default, definition),
    ])
  );
}

/**
 * Build the Page placement reference contract. It stores a tool/view key and
 * view-local configuration only; records are always stored separately.
 */
export function createToolViewPlacement({ id, toolKey, viewKey = "default", config = {} } = {}) {
  const tool = getToolDefinition(toolKey);
  const view = getToolViewDefinition(toolKey, viewKey);
  if (!tool || tool.surfaces.page !== "implemented" || !view || view.surface !== "page") {
    throw new Error(`Tool cannot be placed on a Page: ${toolKey || "unknown"}`);
  }
  const placementId = typeof id === "string" ? id.trim() : "";
  if (!placementId || placementId.length > 128) {
    throw new Error("A stable placement id is required.");
  }
  return {
    id: placementId,
    toolKey,
    viewKey,
    config: normalizeToolViewConfig(toolKey, viewKey, config),
  };
}

/** Normalize persisted Page placements while dropping malformed/unsupported entries. */
export function normalizeToolViewPlacements(placements = []) {
  if (!Array.isArray(placements)) return [];
  const ids = new Set();
  const normalized = [];
  for (const placement of placements) {
    if (!placement || typeof placement !== "object" || typeof placement.id !== "string") continue;
    if (ids.has(placement.id)) continue;
    try {
      const value = createToolViewPlacement(placement);
      ids.add(value.id);
      normalized.push(value);
    } catch {
      // Legacy or partially written placement data must not break Page loading.
    }
  }
  return normalized;
}
