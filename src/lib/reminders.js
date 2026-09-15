// Reminder recurrence is stored as structured data on a single document
// (title, anchor date, repeat rule) — never expanded into duplicate
// per-occurrence documents. These helpers compute occurrences on the fly.

const REMINDER_TYPES = [
  { id: "birthday", label: "Birthday" },
  { id: "anniversary", label: "Anniversary" },
  { id: "exam", label: "Exam" },
  { id: "assignment", label: "Assignment" },
  { id: "payment", label: "Payment" },
  { id: "personal", label: "Personal" },
  { id: "custom", label: "Custom" },
];

const REPEAT_OPTIONS = [
  { id: "never", label: "Never" },
  { id: "daily", label: "Every day" },
  { id: "weekly", label: "Every week" },
  { id: "monthly", label: "Every month" },
  { id: "yearly", label: "Every year" },
];

function atMidnight(d) {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

export function occursOnDate(reminder, date) {
  const anchor = atMidnight(new Date(reminder.date + "T00:00:00"));
  const d = atMidnight(date);
  if (d < anchor) return false;

  switch (reminder.repeat) {
    case "daily":
      return true;
    case "weekly":
      return d.getDay() === anchor.getDay();
    case "monthly":
      return d.getDate() === anchor.getDate();
    case "yearly":
      return d.getDate() === anchor.getDate() && d.getMonth() === anchor.getMonth();
    case "never":
    default:
      return d.getTime() === anchor.getTime();
  }
}

export function nextOccurrence(reminder, from = new Date()) {
  const anchor = atMidnight(new Date(reminder.date + "T00:00:00"));
  const start = atMidnight(from);

  if (reminder.repeat === "never" || !reminder.repeat) {
    return anchor >= start ? anchor : null;
  }

  const cursor = new Date(Math.max(anchor.getTime(), start.getTime()));
  for (let i = 0; i < 366 * 2; i++) {
    if (occursOnDate(reminder, cursor)) return new Date(cursor);
    cursor.setDate(cursor.getDate() + 1);
  }
  return null;
}

export { REMINDER_TYPES, REPEAT_OPTIONS };