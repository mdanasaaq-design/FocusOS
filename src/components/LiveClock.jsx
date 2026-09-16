import { useEffect, useState } from "react";
import { formatConfiguredTime, normalizePreferences } from "../lib/preferences";

export default function LiveClock({ className = "", preferences }) {
  const [now, setNow] = useState(new Date());
  const normalized = normalizePreferences(preferences);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  if (!normalized.clock.enabled) return null;

  const time = formatConfiguredTime(now, normalized, {
    second: normalized.clock.showSeconds ? "2-digit" : undefined,
  });

  return <span className={className}>{time}</span>;
}
