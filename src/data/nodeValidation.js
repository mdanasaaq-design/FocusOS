// FocusOS — Node validation rules
// =====================================================================
// Pure validation/normalization logic used by data/nodes.js.

import { TRACKING_TYPES } from "../domain/progress.js";
import { isValidNodeModuleKey, NODE_MODULE_KEYS } from "../modules/registry.js";

const FIELD_TYPES = [
  "text",
  "number",
  "checkbox",
  "date",
  "time",
  "duration",
  "percentage",
  "select",
  "tags",
  "url",
  "file",
];

export function assertValidModuleKey(moduleKey) {
  if (!isValidNodeModuleKey(moduleKey)) {
    throw new Error(
      `Invalid moduleKey "${moduleKey}". Must be one of: ${NODE_MODULE_KEYS.join(", ")}.`
    );
  }
}

export function assertValidTracking(tracking) {
  const type = tracking?.type;
  if (!TRACKING_TYPES.includes(type)) {
    throw new Error(
      `Invalid tracking.type "${type}". Must be one of: ${TRACKING_TYPES.join(", ")}.`
    );
  }
}

export function normalizeTracking(tracking = { type: "checkbox" }) {
  assertValidTracking(tracking);
  return {
    type: tracking.type,
    target: tracking.target ?? null,
    unit: tracking.unit ?? null,
    period: tracking.period ?? "daily",
  };
}

export function isValidNodeName(name) {
  return typeof name === "string" && name.trim().length > 0;
}

export function isValidFieldType(type) {
  return FIELD_TYPES.includes(type);
}

export function normalizeField(field, index = 0) {
  const type = isValidFieldType(field?.type) ? field.type : "text";
  return {
    id: typeof field?.id === "string" && field.id.trim() ? field.id : `field_${index + 1}`,
    name: typeof field?.name === "string" && field.name.trim() ? field.name.trim() : `Field ${index + 1}`,
    type,
    required: field?.required === true,
    options: type === "select" && Array.isArray(field?.options) ? field.options.filter((option) => typeof option === "string") : [],
    unit: typeof field?.unit === "string" ? field.unit : "",
  };
}

export function normalizeFields(fields) {
  if (!Array.isArray(fields)) return [];
  return fields.map(normalizeField);
}
