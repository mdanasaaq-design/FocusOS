export default function StatCard({ title, value, percent, color = "#D9B968", sublabel, children }) {
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-2.5">
        <p className="text-[11px] font-semibold text-parchment-300 uppercase tracking-wide">
          {title}
        </p>
        {value && (
          <p className="text-sm font-display font-semibold" style={{ color }}>
            {value}
          </p>
        )}
      </div>
      {typeof percent === "number" && (
        <div className="h-1.5 rounded-full bg-ink-700 overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${Math.min(percent, 100)}%`, backgroundColor: color }}
          />
        </div>
      )}
      {sublabel && <p className="text-[11px] text-parchment-300 mt-2">{sublabel}</p>}
      {children}
    </div>
  );
}