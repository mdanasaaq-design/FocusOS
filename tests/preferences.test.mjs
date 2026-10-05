import assert from "node:assert/strict";
import { DEFAULT_PREFERENCES, normalizePreferences, formatConfiguredTime, getConfiguredTimeGreeting } from "../src/lib/preferences.js";

const defaults = normalizePreferences();
assert.equal(defaults.timeFormat, "24h");
assert.equal(defaults.greeting.prefixText, "Assalamualaikum warahmatullahi wabarakatuhu");
assert.equal(defaults.clock.showSeconds, true);

const noPrefix = normalizePreferences({ greeting: { prefixText: "", prefixEnabled: true } });
assert.equal(noPrefix.greeting.prefixText, "");
assert.equal(noPrefix.greeting.prefixEnabled, false);

const time = formatConfiguredTime(new Date("2026-10-04T01:24:45+05:30"), defaults, { timeZone: "Asia/Kolkata", second: "2-digit" });
assert.match(time, /^01:24:45$/);

const custom = normalizePreferences({
  timeFormat: "12h",
  language: "ur",
  greeting: { mode: "custom", text: "Khush aamdeed" },
});
assert.equal(custom.direction, "rtl");
assert.equal(getConfiguredTimeGreeting(new Date(), custom), "Khush aamdeed");

const invalid = normalizePreferences({ locale: "%%", timeZone: "Not/AZone", language: "xx", direction: "rtl" });
assert.equal(invalid.locale, DEFAULT_PREFERENCES.locale);
assert.equal(invalid.timeZone, DEFAULT_PREFERENCES.timeZone);
assert.equal(invalid.language, "en");
assert.equal(invalid.direction, "ltr");

console.log("preferences tests passed");
