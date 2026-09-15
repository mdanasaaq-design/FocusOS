export const CONTENT_TYPES = [
  { id: "lecture", label: "Lecture" },
  { id: "video", label: "Video" },
  { id: "book", label: "Book" },
  { id: "chapter", label: "Chapter" },
  { id: "notes", label: "Notes" },
  { id: "pyq", label: "PYQ" },
  { id: "assignment", label: "Assignment" },
  { id: "custom", label: "Custom" },
];

// These types default to duration-tracked progress; others default to a
// simple done/not-done toggle. The user can still flip either way per item.
export const DEFAULT_DURATION_TYPES = ["lecture", "video"];

/**
 * Status is always derived from actual progress, never a separate
 * manually-set field — prevents it from drifting out of sync.
 */
export function contentStatus(content) {
  if (!content.hasDuration) {
    return content.done ? "completed" : "not_started";
  }
  const total = content.totalSeconds || 0;
  const done = content.completedSeconds || 0;
  if (done <= 0) return "not_started";
  if (total > 0 && done >= total) return "completed";
  return "in_progress";
}

export function contentPercent(content) {
  if (!content.hasDuration) return content.done ? 100 : 0;
  const total = content.totalSeconds || 0;
  if (total <= 0) return 0;
  const done = content.completedSeconds || 0;
  return Math.min(100, Math.round((done / total) * 100));
}

export function formatHMS(totalSeconds) {
  const s = Math.max(0, Math.round(totalSeconds || 0));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const parts = [];
  if (h) parts.push(`${h}h`);
  if (h || m) parts.push(`${m}m`);
  parts.push(`${sec}s`);
  return parts.join(" ");
}

export function hmsToSeconds(h, m, s) {
  return (Number(h) || 0) * 3600 + (Number(m) || 0) * 60 + (Number(s) || 0);
}

export function secondsToHms(totalSeconds) {
  const s = Math.max(0, Math.round(totalSeconds || 0));
  return {
    h: Math.floor(s / 3600),
    m: Math.floor((s % 3600) / 60),
    s: s % 60,
  };
}
