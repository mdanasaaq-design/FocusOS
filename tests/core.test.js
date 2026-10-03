import assert from "node:assert/strict";
import { normalizePreferences } from "../src/lib/preferences.js";
import { todayKey } from "../src/lib/dates.js";

const prefs = normalizePreferences({ timeZone: "India", locale: "en_US" });
assert.equal(prefs.timeZone, "Asia/Kolkata");
assert.equal(prefs.locale, "en-IN");

const instant = new Date("2026-01-01T23:30:00.000Z");
assert.equal(todayKey(instant, "Asia/Kolkata"), "2026-01-02");
assert.equal(todayKey(instant, "UTC"), "2026-01-01");

console.log("Core date/preference tests passed.");

import { MODULES, isModuleEnabled, isValidNodeModuleKey } from "../src/modules/registry.js";
assert.equal(isValidNodeModuleKey("study"), true);
assert.equal(isValidNodeModuleKey("workspace"), false);
assert.equal(MODULES.some((m) => m.key === "workspace"), false);
assert.equal(isModuleEnabled("calendar", { enabledModules: [] }), true);
assert.equal(isModuleEnabled("tasks", { enabledModules: ["tasks"] }), true);
assert.equal(isModuleEnabled("tasks", { enabledModules: [] }), false);
