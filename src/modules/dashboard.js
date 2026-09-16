export const DASHBOARD_WIDGETS = [
  { key: "greeting", label: "Greeting", description: "Show a customizable greeting on the dashboard." },
  { key: "clock", label: "Clock", description: "Show the current time." },
  { key: "date", label: "Date", description: "Show the current date and calendar information." },
  { key: "deadlines", label: "Deadlines", description: "Show upcoming deadlines." },
  { key: "reminders", label: "Reminders", description: "Show upcoming reminders." },
  { key: "tasks", label: "Tasks", description: "Show important and current tasks." },
  { key: "habits", label: "Habits", description: "Show habit progress and streaks." },
  { key: "calendar", label: "Calendar", description: "Show calendar information and events." },
  { key: "timetable", label: "Timetable", description: "Show timetable progress or upcoming schedule." },
  { key: "pomodoro", label: "Pomodoro", description: "Show focus-session information." },
  { key: "exercise", label: "Exercise", description: "Show exercise progress." },
  { key: "statistics", label: "Statistics", description: "Show user-selected statistics." },
  { key: "notes", label: "Notes", description: "Show selected notes." },
  { key: "counter", label: "Counter", description: "Show a configurable counter." },
  { key: "progress", label: "Progress", description: "Show configurable progress indicators." },
];

export const DASHBOARD_WIDGET_KEYS = DASHBOARD_WIDGETS.map((widget) => widget.key);

export const DEFAULT_DASHBOARD = {
  id: "main",
  name: "Main",
  columns: 12,
  widgets: [
    { key: "greeting", enabled: true, order: 0, x: 0, y: 0, w: 8, h: 2 },
    { key: "clock", enabled: true, order: 1, x: 8, y: 0, w: 4, h: 2 },
    { key: "date", enabled: true, order: 2, x: 0, y: 2, w: 4, h: 1 },
    { key: "deadlines", enabled: true, order: 3, x: 0, y: 3, w: 6, h: 4 },
    { key: "reminders", enabled: true, order: 4, x: 6, y: 3, w: 6, h: 4 },
  ],
};

function normalizeWidget(widget, index) {
  return {
    key: widget.key,
    enabled: widget.enabled !== false,
    order: Number.isFinite(widget.order) ? widget.order : index,
    x: Number.isFinite(widget.x) ? Math.max(0, widget.x) : 0,
    y: Number.isFinite(widget.y) ? Math.max(0, widget.y) : index * 2,
    w: Number.isFinite(widget.w) ? Math.max(1, Math.min(12, widget.w)) : 6,
    h: Number.isFinite(widget.h) ? Math.max(1, widget.h) : 3,
  };
}

export function normalizeDashboard(dashboard = DEFAULT_DASHBOARD) {
  const widgets = Array.isArray(dashboard?.widgets) ? dashboard.widgets : DEFAULT_DASHBOARD.widgets;
  const known = new Set(DASHBOARD_WIDGET_KEYS);

  return {
    id: dashboard?.id || DEFAULT_DASHBOARD.id,
    name: dashboard?.name || DEFAULT_DASHBOARD.name,
    columns: Number.isFinite(dashboard?.columns) ? Math.max(1, Math.min(12, dashboard.columns)) : 12,
    widgets: widgets
      .filter((widget) => widget && known.has(widget.key))
      .map(normalizeWidget)
      .sort((a, b) => a.order - b.order),
  };
}

export function getDefaultDashboard() {
  return normalizeDashboard(DEFAULT_DASHBOARD);
}
