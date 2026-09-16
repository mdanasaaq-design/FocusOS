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
  widgets: [
    { key: "greeting", enabled: true, order: 0 },
    { key: "clock", enabled: true, order: 1 },
    { key: "date", enabled: true, order: 2 },
    { key: "deadlines", enabled: true, order: 3 },
    { key: "reminders", enabled: true, order: 4 },
  ],
};

export function normalizeDashboard(dashboard = DEFAULT_DASHBOARD) {
  const widgets = Array.isArray(dashboard?.widgets) ? dashboard.widgets : DEFAULT_DASHBOARD.widgets;
  const known = new Set(DASHBOARD_WIDGET_KEYS);

  return {
    id: dashboard?.id || DEFAULT_DASHBOARD.id,
    name: dashboard?.name || DEFAULT_DASHBOARD.name,
    widgets: widgets
      .filter((widget) => widget && known.has(widget.key))
      .map((widget, index) => ({
        key: widget.key,
        enabled: widget.enabled !== false,
        order: Number.isFinite(widget.order) ? widget.order : index,
      }))
      .sort((a, b) => a.order - b.order),
  };
}

export function getDefaultDashboard() {
  return normalizeDashboard(DEFAULT_DASHBOARD);
}
