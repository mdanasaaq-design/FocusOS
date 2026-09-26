// FocusOS — Node validation rules
// =====================================================================
// Pure validation/normalization logic used by data/nodes.js.

import { TRACKING_TYPES } from "../domain/progress.js";
import { isValidNodeModuleKey, NODE_MODULE_KEYS } from "../modules/registry.js";

export const FIELD_TYPES = [
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

export const DEFAULT_NODE_COLOR = "#428475";
export const DEFAULT_NODE_ICON = "◆";

export function normalizeNodePresentation(data = {}) {
  const source = data.presentation && typeof data.presentation === "object" ? data.presentation : data;
  return {
    showInNavigation: source.showInNavigation !== false,
    showOnDashboard: source.showOnDashboard === true,
    navigationOrder: Number.isFinite(source.navigationOrder) ? Math.max(0, source.navigationOrder) : 0,
    dashboardOrder: Number.isFinite(source.dashboardOrder) ? Math.max(0, source.dashboardOrder) : 0,
    collapsedByDefault: source.collapsedByDefault === true,
  };
}

export function normalizeNodeIdentity(data = {}) {
  return {
    description: typeof data.description === "string" ? data.description.trim() : "",
    icon: typeof data.icon === "string" && data.icon.trim() ? data.icon.trim() : DEFAULT_NODE_ICON,
    color: typeof data.color === "string" && /^#[0-9A-Fa-f]{6}$/.test(data.color) ? data.color : DEFAULT_NODE_COLOR,
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
