// FocusOS — Module Registry Contract
// =====================================================================
// Part of the approved architecture foundation (see CLAUDE.md and
// PROJECT_STATUS.md for the full decision record).
//
// IMPORTANT — two different, easy-to-confuse concepts:
//
// 1. This file (`MODULES`) is the closed set of toggleable APP
//    CAPABILITIES — the things that show up in navigation and can be
//    turned on/off via `users/{uid}/config/main.enabledModules`. This
//    list is controlled entirely by FocusOS's own code; a user cannot
//    add to it.
//
// 2. A generic node's `moduleKey` field (see domain/nodeTree.js,
//    domain/progress.js, and the `nodes` collection) is a SEPARATE,
//    narrower closed set that tags what kind of hierarchy a node
//    belongs to — currently only "study" exists. It is also
//    FocusOS-controlled, but it is not the same list as this one and
//    must not be conflated with it. Do not assume every entry below
//    needs (or gets) a matching node moduleKey — most capabilities
//    below are feature-specific and never touch the generic `nodes`
//    hierarchy at all.
//
// This file is METADATA ONLY. It has no logic, no Firebase, no React.
// It is not yet wired into Sidebar.jsx or Dashboard.jsx — that wiring is
// explicitly deferred until `data/config.js` (config/main CRUD) exists,
// per the approved incremental rollout. See PROJECT_STATUS.md for what
// Account 1 should build next.

/**
 * @typedef {Object} ModuleDefinition
 * @property {string} key - stable identifier, used as the enabledModules key
 * @property {string} label - display name in nav
 * @property {string} route - route path
 * @property {boolean} alwaysOn - true if this can never be disabled (Home, Settings)
 * @property {boolean} [isNodeModule] - true if this capability is backed by
 *   the generic `nodes` hierarchy, i.e. its key is also a valid
 *   `nodes/{id}.moduleKey` value. Most capabilities are feature-specific
 *   and are NOT node-backed — leave this unset (falsy) for those. This is
 *   the single source of truth for valid node moduleKeys; see
 *   NODE_MODULE_KEYS below, which is derived from this list, not a
 *   separate one.
 */

/** @type {ModuleDefinition[]} */
export const MODULES = [
  { key: "home", label: "Home", route: "/", alwaysOn: true },
  { key: "calendar", label: "Calendar", route: "/calendar", alwaysOn: true },
  { key: "timetables", label: "Timetables", route: "/timetables", alwaysOn: false },
  { key: "study", label: "Study / Work", route: "/study", alwaysOn: false, isNodeModule: true },
  { key: "pomodoro", label: "Pomodoro", route: "/pomodoro", alwaysOn: false },
  { key: "exercise", label: "Exercise", route: "/exercise", alwaysOn: false },
  { key: "habits", label: "Habits", route: "/habits", alwaysOn: false },
  { key: "tasks", label: "Tasks", route: "/tasks", alwaysOn: false },
  { key: "settings", label: "Settings", route: "/settings", alwaysOn: true },
];

/**
 * The closed set of valid `nodes/{id}.moduleKey` values — derived from
 * MODULES above (entries with isNodeModule: true), not a separate list.
 * Currently just ["study"]. Add a future generic-hierarchy capability
 * (e.g. "goals") by setting isNodeModule: true on its MODULES entry, not
 * by editing this constant directly.
 *
 * @type {string[]}
 */
export const NODE_MODULE_KEYS = MODULES.filter((m) => m.isNodeModule).map((m) => m.key);

/**
 * True if `key` is a valid node moduleKey.
 * @param {string} key
 */
export function isValidNodeModuleKey(key) {
  return NODE_MODULE_KEYS.includes(key);
}

/**
 * Given a module key and the user's config (or undefined/null if no
 * config/main document exists yet), determine whether that module should
 * be visible. Missing config, or a missing key within enabledModules,
 * always means "visible" — this is the safe-default rule from the
 * approved configuration architecture: absence of config must never
 * hide something that used to be visible.
 *
 * @param {string} key
 * @param {{enabledModules?: Record<string, boolean>}|null|undefined} config
 * @returns {boolean}
 */
export function isModuleEnabled(key, config) {
  const mod = MODULES.find((m) => m.key === key);
  if (mod?.alwaysOn) return true;
  const flag = config?.enabledModules?.[key];
  return flag !== false; // undefined/missing => enabled by default
}
