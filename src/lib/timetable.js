// Timetable entries store "from"/"to" as 24-hour "HH:MM" strings.
// Duration is always derived, never stored or manually entered.

export function timeToMinutes(hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

export function formatTime12(hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${String(h12).padStart(2, "0")}:${String(m).padStart(2, "0")} ${period}`;
}

export function formatDuration(minutes) {
  if (minutes <= 0) return "0m";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export function entryDuration(entry) {
  const start = timeToMinutes(entry.from);
  const end = timeToMinutes(entry.to);
  const d = end - start;
  return d > 0 ? d : null;
}

export function validateEntries(entries) {
  const TOTAL = 24 * 60;
  const invalidIds = new Set();
  const conflictIds = new Set();
  const conflicts = [];

  const valid = entries.filter((e) => {
    const d = entryDuration(e);
    if (d === null) {
      invalidIds.add(e.id);
      return false;
    }
    return true;
  });

  for (let i = 0; i < valid.length; i++) {
    for (let j = i + 1; j < valid.length; j++) {
      const a = valid[i];
      const b = valid[j];
      const aStart = timeToMinutes(a.from);
      const aEnd = timeToMinutes(a.to);
      const bStart = timeToMinutes(b.from);
      const bEnd = timeToMinutes(b.to);
      if (aStart < bEnd && bStart < aEnd) {
        conflictIds.add(a.id);
        conflictIds.add(b.id);
        conflicts.push([a, b]);
      }
    }
  }

  const scheduledMinutes = valid
    .filter((e) => !conflictIds.has(e.id))
    .reduce((sum, e) => sum + entryDuration(e), 0);

  const conflictMinutes = valid
    .filter((e) => conflictIds.has(e.id))
    .reduce((sum, e) => sum + entryDuration(e), 0);

  const unscheduledMinutes = Math.max(
    0,
    TOTAL - scheduledMinutes - conflictMinutes
  );

  return {
    totalMinutes: TOTAL,
    scheduledMinutes,
    conflictMinutes,
    unscheduledMinutes,
    invalidIds,
    conflictIds,
    conflicts,
    isValid: invalidIds.size === 0 && conflictIds.size === 0,
  };
}