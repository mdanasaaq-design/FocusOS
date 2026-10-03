import { todayKey } from "../lib/dates.js";

export const TARGET_TYPES = ["count", "duration", "value", "percentage"];
export const SCHEDULE_TYPES = ["none", "daily", "weekly", "monthly"];

export function createTarget({ title, target, unit = "", period = "open", type = "value" } = {}) {
  return { title: String(title || "").trim(), target: Number(target) || 0, unit: String(unit || ""), period: period || "open", type: TARGET_TYPES.includes(type) ? type : "value" };
}

export function createSchedule({ recurrence = "none", startDate = todayKey(), timezone = null } = {}) {
  return { recurrence: SCHEDULE_TYPES.includes(recurrence) ? recurrence : "none", startDate, timezone };
}

export function periodStart(period, reference = new Date()) {
  const date = new Date(reference);
  if (period === "daily") return todayKey(date);
  if (period === "weekly") { const day = date.getDay(); date.setDate(date.getDate() - day); return todayKey(date); }
  if (period === "monthly") return todayKey(new Date(date.getFullYear(), date.getMonth(), 1));
  return null;
}

export function isInTargetPeriod(date, period, reference = new Date()) {
  if (!period || period === "open") return true;
  return todayKey(new Date(date)) >= periodStart(period, reference);
}

export function nextScheduledDate(currentDate, recurrence) {
  const next = new Date(currentDate || new Date());
  if (recurrence === "daily") next.setDate(next.getDate() + 1);
  else if (recurrence === "weekly") next.setDate(next.getDate() + 7);
  else if (recurrence === "monthly") next.setMonth(next.getMonth() + 1);
  else return null;
  return todayKey(next);
}

export function summarizeInsights(items = [], { range = 7, targetId = null, target = null } = {}) {
  const days = Array.from({ length: range }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (range - 1 - index));
    const key = todayKey(date);
    const dayItems = items.filter((item) => item.date === key && !item.deletedAt && (!targetId || item.targetId === targetId));
    return { date: key, count: dayItems.length, minutes: dayItems.reduce((sum, item) => sum + Number(item.durationMinutes || 0), 0), value: dayItems.reduce((sum, item) => sum + Number(item.value || 0), 0) };
  });
  const total = days.reduce((sum, day) => sum + day.count, 0);
  const value = days.reduce((sum, day) => sum + day.value, 0);
  const minutes = days.reduce((sum, day) => sum + day.minutes, 0);
  return { days, total, value, minutes, target, percent: target ? Math.min(100, Math.round((value / Math.max(1, Number(target))) * 100)) : null };
}
