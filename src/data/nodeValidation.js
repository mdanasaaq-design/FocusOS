// FocusOS — Node validation rules
// =====================================================================
// Pure validation/normalization logic used by data/nodes.js.

import { TRACKING_TYPES } from "../domain/progress.js";
import { isValidNodeModuleKey, NODE_MODULE_KEYS } from "../modules/registry.js";

/**
 * Throws if moduleKey is not a valid FocusOS node namespace.
 * "core" is the universal namespace for user-defined nodes.
 * "study" is retained temporarily for backward compatibility.
 * @param {string} moduleKey
 */
export function assertValidModuleKey(moduleKey) {
  if (!isValidNodeModuleKey(moduleKey)) {
    throw new Error(
      `Invalid moduleKey "${moduleKey}". Must be one of: ${NODE_MODULE_KEYS.join(", ")}.`
    );
  }
}

/** Throws if tracking.type is not one of the approved tracking types. */
export function assertValidTracking(tracking) {
  const type = tracking?.type;
  if (!TRACKING_TYPES.includes(type)) {
    throw new Error(
      `Invalid tracking.type "${type}". Must be one of: ${TRACKING_TYPES.join(", ")}.`
    );
  }
}

/**
 * Fill in defaults for a tracking configuration before writing to Firestore.
 * Nodes without an explicit tracking configuration default to a checkbox.
 */
export function normalizeTracking(tracking = { type: "checkbox" }) {
  assertValidTracking(tracking);
  return {
    type: tracking.type,
    target: tracking.target ?? null,
    unit: tracking.unit ?? null,
    period: tracking.period ?? "daily",
  };
}

/** True if a node name is a non-empty string. */
export function isValidNodeName(name) {
  return typeof name === "string" && name.trim().length > 0;
}
