const HOURS_12 = Array.from({ length: 12 }, (_, i) => i + 1); // 1-12
const MINUTES = Array.from({ length: 12 }, (_, i) => i * 5); // 0,5,...,55

function to24h(hour12, minute, period) {
  let h = hour12 % 12;
  if (period === "PM") h += 12;
  return `${String(h).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function from24h(hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return { hour12, minute: m, period };
}

const selectClass =
  "bg-ink-700 border border-ink-600 rounded-md px-1.5 py-1.5 text-xs outline-none focus:border-brass-500 appearance-none text-center";

export default function TimePicker({ value, onChange }) {
  const { hour12, minute, period } = from24h(value);
  const snappedMinute = MINUTES.includes(minute) ? minute : Math.round(minute / 5) * 5 % 60;

  return (
    <div className="flex items-center gap-1">
      <select
        value={hour12}
        onChange={(e) => onChange(to24h(Number(e.target.value), snappedMinute, period))}
        className={`${selectClass} w-11`}
        aria-label="Hour"
      >
        {HOURS_12.map((h) => (
          <option key={h} value={h}>{h}</option>
        ))}
      </select>
      <span className="text-parchment-300 text-xs">:</span>
      <select
        value={snappedMinute}
        onChange={(e) => onChange(to24h(hour12, Number(e.target.value), period))}
        className={`${selectClass} w-12`}
        aria-label="Minute"
      >
        {MINUTES.map((m) => (
          <option key={m} value={m}>{String(m).padStart(2, "0")}</option>
        ))}
      </select>
      <div className="flex rounded-md overflow-hidden border border-ink-600 ml-0.5">
        {["AM", "PM"].map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => onChange(to24h(hour12, snappedMinute, p))}
            className={`px-1.5 py-1.5 text-[10px] font-medium transition-colors ${
              period === p ? "bg-brass-500 text-ink-950" : "bg-ink-700 text-parchment-300 hover:bg-ink-600"
            }`}
          >
            {p}
          </button>
        ))}
      </div>
    </div>
  );
}