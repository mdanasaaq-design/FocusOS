// Central date helpers so every page agrees on "today" and day-math.

export function todayKey(d = new Date()) {
  return d.toISOString().slice(0, 10); // YYYY-MM-DD
}

export function daysUntil(dateStr) {
  const target = new Date(dateStr + "T00:00:00");
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const diffMs = target - now;
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

export function formatDate(dateStr) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function last30Days() {
  const days = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(todayKey(d));
  }
  return days;
}

// Builds a 6x7 grid of Date objects for a calendar month view,
// padded with the trailing days of the previous month and leading
// days of the next month so every week row is complete.
export function getMonthGrid(year, month) {
  const firstOfMonth = new Date(year, month, 1);
  const startOffset = firstOfMonth.getDay(); // 0 = Sunday
  const gridStart = new Date(year, month, 1 - startOffset);

  const cells = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    cells.push({
      date: d,
      key: todayKey(d),
      inMonth: d.getMonth() === month,
    });
  }
  return cells;
}

export function isSameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function timeOfDayGreeting(date = new Date()) {
  const h = date.getHours();
  if (h < 5) return "Good night";
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  if (h < 21) return "Good evening";
  return "Good night";
}

// Longest current streak counting backwards from today across the given
// habit's daily log entries. Stops at the first gap.
export function currentStreak(logs, habitId) {
  let streak = 0;
  let cursor = new Date();
  while (true) {
    const key = todayKey(cursor);
    if (logs[key]?.[habitId]) {
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}
