// FocusOS — built-in Page capabilities. Keep this list intentionally small and purposeful.
export const CAPABILITIES = [
  { key: "tasks", label: "Tasks", description: "Create tasks with a deadline, user-selected priority, and optional reminder and time estimate.", configFields: [{ id: "view", name: "Default view", type: "select", options: ["list", "board"] }] },
  { key: "focus", label: "Focus Sessions", description: "Run focused work sessions with configurable focus and break lengths, then review session history.", configFields: [{ id: "focusMinutes", name: "Focus minutes", type: "number" }, { id: "breakMinutes", name: "Break minutes", type: "number" }] },
  { key: "timeTracking", label: "Timer", description: "Measure how long an activity takes and keep a history of recorded time." },
  { key: "habits", label: "Habits", description: "Choose a repeat pattern and reminder time, check habits off, and build streak history." },
  { key: "goals", label: "Goals", description: "Set a measurable outcome, define its unit and target, and log progress toward completion." },
  { key: "workout", label: "Workouts", description: "Record training sessions with exercises, sets, reps, load and duration." },
  { key: "measurements", label: "Measurements", description: "Record named measurements with units and dates, then compare changes over time." },
  { key: "analytics", label: "Analytics", description: "Summarize this Page's activity into useful progress, completion, and trend insights." },
];
export const CAPABILITY_KEYS = CAPABILITIES.map((capability) => capability.key);
export const LEGACY_CAPABILITY_KEYS = ["routines","notes","calendar","reminders","tracking","timetables","pomodoro","exercise","study","files"];
export const USER_CAPABILITY_PREFIX = "custom:";
export function isUserCapabilityKey(key) { return typeof key === "string" && key.startsWith(USER_CAPABILITY_PREFIX) && key.length > USER_CAPABILITY_PREFIX.length; }
export function isValidCapabilityKey(key) { return CAPABILITY_KEYS.includes(key) || LEGACY_CAPABILITY_KEYS.includes(key); }
export function normalizeCapabilities(capabilities) { if (!Array.isArray(capabilities)) return []; return [...new Set(capabilities.filter((key) => isValidCapabilityKey(key) || isUserCapabilityKey(key)))]; }
export function normalizeCapabilityConfig(config) { if (!config || typeof config !== "object" || Array.isArray(config)) return {}; return Object.fromEntries(Object.entries(config).map(([k,v]) => [k, v && typeof v === "object" && !Array.isArray(v) ? { ...v } : v])); }