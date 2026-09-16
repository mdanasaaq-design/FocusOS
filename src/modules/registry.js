// FocusOS — Module Registry Contract
// =====================================================================
// `MODULES` is the closed set of toggleable APP CAPABILITIES shown in
// navigation. It is intentionally separate from the generic node tree.
//
// Generic nodes are not feature-specific modules. They form the user's
// own hierarchy, and future capabilities can attach to any node.
// `core` is the universal node namespace for that hierarchy. `study` is
// retained only as a legacy namespace while the old Study module is
// migrated into the universal node model.

/**
 * @typedef {Object} ModuleDefinition
 * @property {string} key - stable identifier used by enabledModules
 * @property {string} label - display name in navigation
 * @property {string} route - route path
 * @property {boolean} alwaysOn - true if this can never be disabled
 */

/** @type {ModuleDefinition[]} */
export const MODULES = [
  { key: "home", label: "Home", route: "/", alwaysOn: true },
  { key: "calendar", label: "Calendar", route: "/calendar", alwaysOn: true },
  { key: "timetables", label: "Timetables", route: "/timetables", alwaysOn: false },
  { key: "study", label: "Study / Work", route: "/study", alwaysOn: false },
  { key: "pomodoro", label: "Pomodoro", route: "/pomodoro", alwaysOn: false },
  { key: "exercise", label: "Exercise", route: "/exercise", alwaysOn: false },
  { key: "habits", label: "Habits", route: "/habits", alwaysOn: false },
  { key: "tasks", label: "Tasks", route: "/tasks", alwaysOn: false },
  { key: "settings", label: "Settings", route: "/settings", alwaysOn: true },
];

/**
 * Node namespaces are deliberately separate from APP CAPABILITIES.
 * `core` is the universal namespace for user-defined FocusOS nodes.
 * `study` remains valid only for backward compatibility with the
 * existing Study data until that module is migrated.
 *
 * @type {string[]}
 */
export const NODE_MODULE_KEYS = ["core", "study"];

/**
 * True if `key` is a valid node namespace.
 * @param {string} key
 */
export function isValidNodeModuleKey(key) {
  return NODE_MODULE_KEYS.includes(key);
}

/**
 * Determine whether an app capability should be visible.
 * Missing config or a missing key means enabled by default.
 *
 * @param {string} key
 * @param {{enabledModules?: Record<string, boolean>}|null|undefined} config
 * @returns {boolean}
 */
export function isModuleEnabled(key, config) {
  const mod = MODULES.find((m) => m.key === key);
  if (mod?.alwaysOn) return true;
  const flag = config?.enabledModules?.[key];
  return flag !== false;
}
