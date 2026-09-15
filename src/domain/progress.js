// FocusOS — Generic Progress Contract
// =====================================================================
// Part of the approved architecture foundation (see CLAUDE.md and
// PROJECT_STATUS.md for the full decision record). This file is pure
// logic: no Firebase, no React, nothing that touches `users/{uid}/...`
// directly. It is safe to unit test with plain `node` and safe to import
// from anywhere without pulling in Firestore.
//
// This is the single source of truth for "how does a node's progress
// percentage get computed" across every module that uses the generic
// `nodes` hierarchy (Study/Work today; Goals/Health/Skills or others in
// the future, each added deliberately as its own moduleKey when built).
//
// Tracking types (must match `nodes/{id}.tracking.type`):
//   checkbox    — value: boolean
//   count       — value: number, measured against tracking.target
//   duration    — value: number (minutes), measured against tracking.target
//   target      — generic ratio tracking, value vs tracking.target
//   percentage  — value: number 0-100, used directly
//   manual      — value: number 0-100, set directly by the user
//   derived     — has no value of its own; progress is the average of
//                 its active (non-archived) children's progress values
//
// Deliberately NOT implemented here (per approved architecture — do not
// add these without a concrete, approved requirement):
//   - weighted aggregation
//   - sum / any / all aggregation modes
//   - cumulative / multi-period tracking semantics
// `tracking.period` exists on the node schema as the extensibility seam
// for that later work; this file only implements "daily" semantics today.

export const TRACKING_TYPES = [
  "checkbox",
  "count",
  "duration",
  "target",
  "percentage",
  "manual",
  "derived",
];

function clampPercent(n) {
  if (typeof n !== "number" || Number.isNaN(n) || !Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, n));
}

/**
 * Calculate a single leaf node's progress percentage (0-100) from its
 * tracking config and today's raw value.
 *
 * Does NOT handle "derived" nodes — derived nodes have no value of their
 * own; use aggregateChildrenProgress() for those.
 *
 * @param {{type: string, target?: number|null}} tracking
 * @param {boolean|number|null} value
 * @returns {number} 0-100
 */
export function calculateLeafProgress(tracking, value) {
  const type = tracking?.type;
  switch (type) {
    case "checkbox":
      return value ? 100 : 0;

    case "count":
    case "duration":
    case "target": {
      const target = tracking?.target;
      if (!target || target <= 0) return 0;
      const actual = Number(value) || 0;
      return clampPercent((actual / target) * 100);
    }

    case "percentage":
      return clampPercent(Number(value) || 0);

    case "manual":
      return clampPercent(Number(value) || 0);

    case "derived":
      throw new Error(
        'calculateLeafProgress: "derived" nodes have no leaf value — ' +
          "use aggregateChildrenProgress() instead."
      );

    default:
      throw new Error(
        `calculateLeafProgress: unsupported or missing tracking type "${type}". ` +
          `Expected one of: ${TRACKING_TYPES.join(", ")}.`
      );
  }
}

/**
 * Aggregate a derived node's progress from its children's ALREADY-COMPUTED
 * progress percentages. Only "average" is implemented — see file header.
 *
 * The caller must exclude archived children before calling this —
 * aggregation only ever sees active children. An empty list (no active
 * children yet) returns 0 rather than throwing, since a freshly created
 * derived node with no children is a normal, valid state.
 *
 * @param {number[]} childProgressPercents
 * @returns {number} 0-100
 */
export function aggregateChildrenProgress(childProgressPercents) {
  if (!Array.isArray(childProgressPercents) || childProgressPercents.length === 0) {
    return 0;
  }
  const sum = childProgressPercents.reduce(
    (acc, p) => acc + clampPercent(Number(p)),
    0
  );
  return clampPercent(sum / childProgressPercents.length);
}

/**
 * Compute progress for a node given its tracking config, today's raw value
 * (for leaf nodes), and its children's already-computed progress values
 * (for derived nodes). Dispatches to the two functions above based on
 * tracking.type. Intended to be called bottom-up across a tree (leaves
 * first, derived parents after).
 *
 * @param {{tracking: {type: string, target?: number|null}}} node
 * @param {boolean|number|null} value - ignored for derived nodes
 * @param {number[]} childrenProgress - ignored for non-derived nodes
 * @returns {number} 0-100
 */
export function computeNodeProgress(node, value, childrenProgress = []) {
  if (node?.tracking?.type === "derived") {
    return aggregateChildrenProgress(childrenProgress);
  }
  return calculateLeafProgress(node?.tracking, value);
}
