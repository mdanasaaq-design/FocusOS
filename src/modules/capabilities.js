// FocusOS — Node Capability Contract
// =====================================================================
// Capabilities are actions/tools that can be attached to user-defined
// nodes. They are separate from both the node hierarchy and navigation
// modules.
//
// Node hierarchy:     what the user organizes
// App modules:        what appears in FocusOS navigation
// Node capabilities:  what a particular node can do

/**
 * @typedef {Object} CapabilityDefinition
 * @property {string} key - stable identifier stored on a node
 * @property {string} label - user-facing name
 * @property {string} description - concise explanation of the capability
 */

/** @type {CapabilityDefinition[]} */
export const CAPABILITIES = [
  { key: "tasks", label: "Tasks", description: "Create and track tasks for this node." },
  { key: "habits", label: "Habits", description: "Track recurring habits for this node." },
  { key: "notes", label: "Notes", description: "Keep notes associated with this node." },
  { key: "calendar", label: "Calendar", description: "Associate dates and events with this node." },
  { key: "reminders", label: "Reminders", description: "Schedule reminders for this node." },
  { key: "tracking", label: "Tracking", description: "Track progress or measurements for this node." },
  { key: "timetables", label: "Timetables", description: "Use timetable planning for this node." },
  { key: "pomodoro", label: "Pomodoro", description: "Run focused work sessions for this node." },
  { key: "exercise", label: "Exercise", description: "Track exercise activity for this node." },
  { key: "study", label: "Study / Work", description: "Organize study or work activity for this node." },
  { key: "files", label: "Files", description: "Associate files and resources with this node." },
];

export const CAPABILITY_KEYS = CAPABILITIES.map((capability) => capability.key);

export const USER_CAPABILITY_PREFIX = "custom:";

export function isUserCapabilityKey(key) {
  return typeof key === "string" && key.startsWith(USER_CAPABILITY_PREFIX) && key.length > USER_CAPABILITY_PREFIX.length;
}

/**
 * True when a key is a valid built-in FocusOS node capability.
 * @param {string} key
 */
export function isValidCapabilityKey(key) {
  return CAPABILITY_KEYS.includes(key);
}

/**
 * Keep built-in capability keys and user-created capability references.
 * User-created references use the stable `custom:{capabilityId}` format.
 *
 * @param {unknown} capabilities
 * @returns {string[]}
 */
export function normalizeCapabilities(capabilities) {
  if (!Array.isArray(capabilities)) return [];
  return [...new Set(capabilities.filter((key) => isValidCapabilityKey(key) || isUserCapabilityKey(key)))];
}
