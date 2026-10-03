import assert from "node:assert/strict";
import { createTarget, createSchedule, nextScheduledDate, summarizeInsights } from "../src/data/planning.js";

assert.equal(createTarget({ title: "Study", target: 10, unit: "hours", period: "weekly" }).target, 10);
assert.equal(createSchedule({ recurrence: "daily", startDate: "2026-10-03" }).recurrence, "daily");
assert.equal(nextScheduledDate("2026-10-03", "daily"), "2026-10-04");
assert.equal(nextScheduledDate("2026-10-03", "weekly"), "2026-10-10");

const insights = summarizeInsights([
  { date: "2026-10-02", value: 3, durationMinutes: 20 },
  { date: "2026-10-03", value: 2, durationMinutes: 10 },
], { range: 2, target: 10, reference: new Date("2026-10-03T12:00:00Z") });
assert.equal(insights.total, 2);
assert.equal(insights.value, 5);
assert.equal(insights.minutes, 30);
assert.equal(insights.percent, 50);

console.log("Planning contract tests passed.");
