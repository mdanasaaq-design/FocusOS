// FocusOS — reusable built-in capability definitions
export const CAPABILITIES = [
{ key: "tasks", label: "Tasks", description: "Create and track tasks for this Page.", configFields: [{ id: "view", name: "Default view", type: "select", options: ["list", "board", "calendar"] }, { id: "defaultPriority", name: "Default priority", type: "select", options: ["low", "normal", "high"] }] },
{ key: "focus", label: "Focus Sessions", description: "Run configurable focus/break sessions and keep durable focus history.", configFields: [{ id: "focusMinutes", name: "Focus minutes", type: "number" }, { id: "breakMinutes", name: "Break minutes", type: "number" }] },
{ key: "timeTracking", label: "Time Tracking", description: "Track planned and actual time with timers or manual entries." },
{ key: "habits", label: "Habits", description: "Track recurring behavior with cadence, adherence, streaks, and history.", configFields: [{ id: "period", name: "Tracking period", type: "select", options: ["daily", "weekly", "monthly"] }] },
{ key: "routines", label: "Routines", description: "Run repeatable ordered routines and preserve completion history." },
{ key: "goals", label: "Goals & Metrics", description: "Set measurable targets and compare progress over time." },
{ key: "workout", label: "Workouts", description: "Log workouts, exercises, sets, reps, load, and duration." },
{ key: "measurements", label: "Measurements", description: "Record dated measurements and inspect trends." },
{ key: "analytics", label: "Analytics", description: "Summarize Page activity, targets, trends, and history." },
{ key: "notes", label: "Notes", description: "Keep notes associated with this Page." },
{ key: "calendar", label: "Calendar", description: "Associate dates and events with this Page." },
{ key: "reminders", label: "Reminders", description: "Schedule reminders for this Page." },
{ key: "tracking", label: "Tracking", description: "Track progress or measurements for this Page." },
{ key: "timetables", label: "Timetables", description: "Use timetable planning for this Page." },
{ key: "pomodoro", label: "Pomodoro (legacy)", description: "Legacy alias for Focus Sessions." },
{ key: "exercise", label: "Exercise (legacy)", description: "Legacy alias for Workouts." },
{ key: "study", label: "Study / Work (legacy)", description: "Legacy surface retained while existing data is migrated." },
{ key: "files", label: "Files", description: "Associate files and resources with this Page." },
];
export const CAPABILITY_KEYS = CAPABILITIES.map((capability) => capability.key);
export const USER_CAPABILITY_PREFIX = "custom:";
export function isUserCapabilityKey(key) { return typeof key === "string" && key.startsWith(USER_CAPABILITY_PREFIX) && key.length > USER_CAPABILITY_PREFIX.length; }
export function isValidCapabilityKey(key) { return CAPABILITY_KEYS.includes(key); }
export function normalizeCapabilities(capabilities) { if (!Array.isArray(capabilities)) return []; return [...new Set(capabilities.filter((key) => isValidCapabilityKey(key) || isUserCapabilityKey(key)))]; }
export function normalizeCapabilityConfig(config) { if (!config || typeof config !== "object" || Array.isArray(config)) return {}; return Object.fromEntries(Object.entries(config).map(([k,v]) => [k, v && typeof v === "object" && !Array.isArray(v) ? { ...v } : v])); }