// FocusOS — built-in Page capabilities. Keep this list intentionally small and purposeful.
export const CAPABILITIES = [
  { key: "tasks", label: "Tasks", description: "Create, prioritize, schedule and complete tasks.", configFields: [{ id: "view", name: "Default view", type: "select", options: ["list", "board"] }] },
  { key: "focus", label: "Focus Sessions", description: "Run focus/break sessions and preserve completed-session history.", configFields: [{ id: "focusMinutes", name: "Focus minutes", type: "number" }, { id: "breakMinutes", name: "Break minutes", type: "number" }] },
  { key: "timeTracking", label: "Timer", description: "Run a simple timer for an activity or record elapsed minutes manually." },
  { key: "habits", label: "Habits", description: "Create recurring habits, set reminder times, check them off and build streaks." },
  { key: "goals", label: "Goals", description: "Define a measurable target and log progress toward it." },
  { key: "workout", label: "Workouts", description: "Log exercises, sets, reps, load and duration." },
  { key: "measurements", label: "Measurements", description: "Record dated measurements with units and inspect their history." },
  { key: "analytics", label: "Analytics", description: "Turn this Page's activity into useful progress and trend summaries." },
];
export const CAPABILITY_KEYS = CAPABILITIES.map((capability) => capability.key);
export const LEGACY_CAPABILITY_KEYS = ["routines","notes","calendar","reminders","tracking","timetables","pomodoro","exercise","study","files"];
export const USER_CAPABILITY_PREFIX = "custom:";
export function isUserCapabilityKey(key) { return typeof key === "string" && key.startsWith(USER_CAPABILITY_PREFIX) && key.length > USER_CAPABILITY_PREFIX.length; }
export function isValidCapabilityKey(key) { return CAPABILITY_KEYS.includes(key) || LEGACY_CAPABILITY_KEYS.includes(key); }
export function normalizeCapabilities(capabilities) { if (!Array.isArray(capabilities)) return []; return [...new Set(capabilities.filter((key) => isValidCapabilityKey(key) || isUserCapabilityKey(key)))]; }
export function normalizeCapabilityConfig(config) { if (!config || typeof config !== "object" || Array.isArray(config)) return {}; return Object.fromEntries(Object.entries(config).map(([k,v]) => [k, v && typeof v === "object" && !Array.isArray(v) ? { ...v } : v])); }