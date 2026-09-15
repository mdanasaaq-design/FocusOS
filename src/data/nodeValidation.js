// FocusOS — Node validation rules (Phase 1)
// =====================================================================
// Pure validation/normalization logic used by data/nodes.js, split into
// its own file so it can be unit-tested directly with plain `node`.
// data/nodes.js itself cannot be — it transitively imports
// lib/firebase.js, which reads Vite's `import.meta.env` and throws
// immediately outside a Vite build. This file has no such dependency:
// it imports only ../domain/progress.js (pure) and
// ../modules/registry.js (pure metadata, no Firebase/React) — both safe
// to run standalone. See scripts/test-nodeValidation.mjs.

import { TRACKING_TYPES } from "../domain/progress.js";
import { isValidNodeModuleKey, NODE_MODULE_KEYS } from "../modules/registry.js";

/**
 * Throws if moduleKey is not one of the FocusOS-controlled valid values
 * (see modules/registry.js's NODE_MODULE_KEYS — currently just "study").
 * @param {string} moduleKey
 */
export function assertValidModuleKey(moduleKey) {
  if (!isValidNodeModuleKey(moduleKey)) {
    throw new Error(
      `Invalid moduleKey "${moduleKey}". Must be one of: ${NODE_MODULE_KEYS.join(", ")}. ` +
        `moduleKey is FocusOS-controlled, not user-defined — see src/modules/registry.js.`
    );
  }
}

/**
 * Throws if tracking.type is not one of the 7 approved tracking types.
 * @param {{type?: string}} tracking
 */
export function assertValidTracking(tracking) {
  const type = tracking?.type;
  if (!TRACKING_TYPES.includes(type)) {
    throw new Error(
      `Invalid tracking.type "${type}". Must be one of: ${TRACKING_TYPES.join(", ")}.`
    );
  }
}

/**
 * Validates and fills in defaults for a tracking config before it's
 * written to Firestore. target/unit default to null, period defaults to
 * "daily" (the only period currently implemented — see progress.js).
 *
 * @param {{type: string, target?: number|null, unit?: string|null, period?: string}} tracking
 * @returns {{type: string, target: number|null, unit: string|null, period: string}}
 */
export function normalizeTracking(tracking) {
  assertValidTracking(tracking);
  return {
    type: tracking.type,
    target: tracking.target ?? null,
    unit: tracking.unit ?? null,
    period: tracking.period ?? "daily",
  };
}

/**
 * True if `name` is a valid node name (non-empty string). Node names are
 * fully user-defined — this only checks the type/shape, not content.
 * @param {unknown} name
 */
export function isValidNodeName(name) {
  return typeof name === "string" && name.trim().length > 0;
}
