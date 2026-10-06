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

  if (normalized.clock.style === "analog") {
    const parts = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "numeric", second: "numeric", hour12: false, timeZone: normalized.timeZone }).formatToParts(now);
    const values = Object.fromEntries(parts.filter((part) => part.type !== "literal").map((part) => [part.type, Number(part.value)]));
    const seconds = (values.second || 0) / 60;
    const minutes = ((values.minute || 0) + seconds) / 60;
    const hours = ((values.hour || 0) % 12 + minutes / 12) / 12;
    return <span className={`inline-flex items-center justify-center ${className}`} aria-label={time}>
      <span className="relative block w-28 h-28 rounded-full border-4 border-current">
        <span className="absolute inset-1 rounded-full border border-current/30" />
        <span className="absolute left-1/2 top-1/2 w-[2px] h-9 bg-current origin-bottom -translate-x-1/2 -translate-y-full rounded-full" style={{ transform: `translate(-50%, -100%) rotate(${hours * 360}deg)` }} />
        <span className="absolute left-1/2 top-1/2 w-[2px] h-11 bg-current origin-bottom -translate-x-1/2 -translate-y-full rounded-full" style={{ transform: `translate(-50%, -100%) rotate(${minutes * 360}deg)` }} />
        {normalized.clock.showSeconds && <span className="absolute left-1/2 top-1/2 w-px h-12 bg-brass-400 origin-bottom -translate-x-1/2 -translate-y-full" style={{ transform: `translate(-50%, -100%) rotate(${seconds * 360}deg)` }} />}
        <span className="absolute left-1/2 top-1/2 w-2 h-2 rounded-full bg-current -translate-x-1/2 -translate-y-1/2" />
      </span>
    </span>;
  }

  const styleClass = normalized.clock.style === "minimal" ? "tracking-[0.18em] font-light" : normalized.clock.style === "flip" ? "font-mono tabular-nums tracking-tight" : normalized.clock.style === "binary" ? "font-mono tracking-[0.35em]" : "";
  return <span className={`${className} ${styleClass}`}>{time}</span>;}