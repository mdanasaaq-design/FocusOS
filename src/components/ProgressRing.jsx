export default function ProgressRing({
  percent = 0,
  size = 140,
  stroke = 12,
  label,
  sublabel,
  color = "#C9A24B",
}) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(percent, 100) / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#242932"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.6s ease" }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-2xl font-display font-semibold text-parchment-100">
          {label}
        </span>
        {sublabel && (
          <span className="text-[11px] text-parchment-300 mt-0.5">
            {sublabel}
          </span>
        )}
      </div>
    </div>
  );
}
