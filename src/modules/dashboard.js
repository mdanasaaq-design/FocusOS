// FocusOS — Dashboard Widget Contract
// =====================================================================
// Dashboard widgets are presentation instances. They may represent a
// built-in system widget, a node capability, or a future user-created
// capability. Dashboard layout/configuration stays separate from the
// capability itself.

export const DASHBOARD_WIDGETS = [
  { key: "greeting", label: "Greeting", description: "Show a customizable greeting on the dashboard.", type: "system" },
  { key: "clock", label: "Clock", description: "Show the current time.", type: "system" },
  { key: "date", label: "Date", description: "Show the current date and calendar information.", type: "system" },
  { key: "deadlines", label: "Deadlines", description: "Show upcoming deadlines.", type: "capability", capabilityKey: "deadlines" },
  { key: "reminders", label: "Reminders", description: "Show upcoming reminders.", type: "capability", capabilityKey: "reminders" },
  { key: "tasks", label: "Tasks", description: "Show important and current tasks.", type: "capability", capabilityKey: "tasks" },
  { key: "habits", label: "Habits", description: "Show habit progress and streaks.", type: "capability", capabilityKey: "habits" },
  { key: "calendar", label: "Calendar", description: "Show calendar information and events.", type: "capability", capabilityKey: "calendar" },
  { key: "timetable", label: "Timetable", description: "Show timetable progress or upcoming schedule.", type: "capability", capabilityKey: "timetables" },
  { key: "pomodoro", label: "Pomodoro", description: "Show focus-session information.", type: "capability", capabilityKey: "pomodoro" },
  { key: "exercise", label: "Exercise", description: "Show exercise progress.", type: "capability", capabilityKey: "exercise" },
  { key: "statistics", label: "Statistics", description: "Show user-selected statistics.", type: "presentation" },
  { key: "notes", label: "Notes", description: "Show selected notes.", type: "capability", capabilityKey: "notes" },
  { key: "counter", label: "Counter", description: "Show a configurable counter.", type: "presentation" },
  { key: "progress", label: "Progress", description: "Show configurable progress indicators.", type: "presentation" },
  { key: "pieChart", label: "Pie Chart", description: "Visualize proportions.", type: "analysis" },
  { key: "donutChart", label: "Donut Chart", description: "Visualize proportions with a center total.", type: "analysis" },
  { key: "barChart", label: "Bar Chart", description: "Compare metrics.", type: "analysis" },
  { key: "lineChart", label: "Line Chart", description: "Show trends over time.", type: "analysis" },
  { key: "areaChart", label: "Area Chart", description: "Show trend volume over time.", type: "analysis" },
  { key: "kpi", label: "KPI", description: "Show a single important value.", type: "analysis" },
  { key: "progressChart", label: "Progress Chart", description: "Show target completion.", type: "analysis" },
  { key: "table", label: "Analysis Table", description: "Show values in a compact table.", type: "analysis" },
  { key: "heatmap", label: "Heatmap", description: "Show activity density over days.", type: "analysis" },
  { key: "capabilities", label: "Node Capabilities", description: "Show capabilities currently attached to your nodes.", type: "presentation" },
  { key: "pages", label: "Pages", description: "Show Pages configured for Dashboard visibility.", type: "presentation" },
  { key: "page-capability", label: "Page Capability", description: "Show a live capability from a specific Page.", type: "page-capability" },
];

export const DASHBOARD_WIDGET_KEYS = DASHBOARD_WIDGETS.map((widget) => widget.key);

export const DASHBOARD_ANALYSIS_TYPES = [
  { key: "pieChart", label: "Pie chart", description: "Compare parts of a whole." },
  { key: "donutChart", label: "Donut chart", description: "Compare parts with a central total." },
  { key: "barChart", label: "Bar chart", description: "Compare values across categories." },
  { key: "lineChart", label: "Line chart", description: "Show change over time." },
  { key: "areaChart", label: "Area chart", description: "Show trend volume over time." },
  { key: "kpi", label: "KPI", description: "Show a single important value." },
  { key: "progressChart", label: "Progress", description: "Show target completion." },
  { key: "table", label: "Analysis table", description: "Show values in a compact table." },
  { key: "heatmap", label: "Heatmap", description: "Show activity density over days." },
];

export const DASHBOARD_ANALYSIS_SOURCES = [
  { key: "habitCompletion", label: "Habit completion" },
  { key: "exerciseCompletion", label: "Exercise completion" },
  { key: "scheduleCompletion", label: "Schedule completion" },
  { key: "focusMinutes", label: "Focus minutes" },
  { key: "trackedMinutes", label: "Tracked minutes" },
  { key: "deadlines", label: "Upcoming deadlines" },
  { key: "tracker", label: "Page tracker" },
];
export const DASHBOARD_WIDGET_REGISTRY = Object.fromEntries(DASHBOARD_WIDGETS.map((widget) => [widget.key, widget]));

export const DEFAULT_DASHBOARD = {
  id: "dashboard",
  name: "Dashboard",
  columns: 12,
  widgets: [
    { key: "greeting", enabled: true, order: 0, x: 0, y: 0, w: 8, h: 2 },
    { key: "clock", enabled: true, order: 1, x: 8, y: 0, w: 4, h: 2 },
    { key: "date", enabled: true, order: 2, x: 0, y: 2, w: 4, h: 2 },
    { key: "deadlines", enabled: true, order: 3, x: 0, y: 4, w: 6, h: 4 },
    { key: "reminders", enabled: true, order: 4, x: 6, y: 4, w: 6, h: 4 },
    { key: "pages", enabled: true, order: 5, x: 0, y: 8, w: 6, h: 3 },
  ],
};

function normalizeWidget(widget, index) {
  const definition = DASHBOARD_WIDGET_REGISTRY[widget?.key];
  return {
    key: widget.key,
    id: widget.id || widget.key,
    type: widget.type || definition?.type || "custom",
    capabilityKey: widget.capabilityKey || definition?.capabilityKey || null,
    nodeId: widget.nodeId || null,
    pageId: widget.pageId || null,
    view: widget.view || "default",
    enabled: widget.enabled !== false,
    order: Number.isFinite(widget.order) ? widget.order : index,
    x: Number.isFinite(widget.x) ? Math.max(0, widget.x) : 0,
    y: Number.isFinite(widget.y) ? Math.max(0, widget.y) : index * 2,
    w: Number.isFinite(widget.w) ? Math.max(1, Math.min(12, widget.w)) : 6,
    h: Number.isFinite(widget.h) ? Math.max(1, widget.h) : 3,
    config: widget.config && typeof widget.config === "object" ? widget.config : {},
  };
}

export function normalizeDashboard(dashboard = DEFAULT_DASHBOARD) {
  const widgets = Array.isArray(dashboard?.widgets) ? dashboard.widgets : DEFAULT_DASHBOARD.widgets;
  return {
    id: dashboard?.id || DEFAULT_DASHBOARD.id,
    name: (() => {
      const rawName = typeof dashboard?.name === "string" ? dashboard.name.trim() : "";
      return !rawName || rawName === "Main" ? DEFAULT_DASHBOARD.name : rawName;
    })(),
    columns: Number.isFinite(dashboard?.columns) ? Math.max(1, Math.min(12, dashboard.columns)) : 12,
    widgets: widgets
      .filter((widget) => widget && typeof widget.key === "string" && widget.key.trim())
      .map(normalizeWidget)
      .sort((a, b) => a.order - b.order),
  };
}

export function getDefaultDashboard() {
  return normalizeDashboard(DEFAULT_DASHBOARD);
}

/**
 * Create a dashboard widget instance for a built-in or future capability.
 * User-created capabilities can use this same shape without changing the
 * dashboard storage model.
 */
export function createDashboardWidget({ id = null, key, capabilityKey = null, nodeId = null, type = "custom", view = "default", config = {}, ...layout }) {
  return normalizeWidget({ id, key, capabilityKey, nodeId, type, view, config, ...layout }, 0);
}

export function createPageDashboardWidget({ pageId, pageName, capabilityKey, view = "summary", config = {}, ...layout }) {
  const safePage = String(pageId || "").trim();
  const safeCapability = String(capabilityKey || "").trim();
  return createDashboardWidget({ id: `page:${safePage}:${safeCapability}:${Date.now()}`, key: "page-capability", type: "page-capability", pageId: safePage, capabilityKey: safeCapability, view, config: { ...config, pageName: pageName || "" }, ...layout });
}

export function createNodeDashboardWidget({ nodeId, nodeName, capabilityKey, view = "summary", config = {}, ...layout }) {
  const safeNode = String(nodeId || "").trim();
  const safeCapability = String(capabilityKey || "").trim();
  return createDashboardWidget({
    id: `node:${safeNode}:${safeCapability}:${Date.now()}`,
    key: `node-capability:${safeNode}:${safeCapability}`,
    type: "node-capability",
    nodeId: safeNode,
    capabilityKey: safeCapability,
    view,
    config: { ...config, nodeName: nodeName || "" },
    ...layout,
  });
}


export function normalizeDashboardLayouts(config = {}) {
  const raw = Array.isArray(config.dashboardLayouts) ? config.dashboardLayouts : [];
  const layouts = raw.length ? raw.map((layout) => normalizeDashboard(layout)) : [normalizeDashboard(config.dashboard || DEFAULT_DASHBOARD)];
  const activeDashboardId = layouts.some((layout) => layout.id === config.activeDashboardId)
    ? config.activeDashboardId
    : layouts[0].id;
  return { layouts, activeDashboardId };
}
