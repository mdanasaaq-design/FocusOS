export default function Logo({ size = 32, className = "" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      className={className}
      role="img"
      aria-label="FocusOS"
    >
      <circle
        cx="16"
        cy="16"
        r="13"
        fill="none"
        stroke="#D9B968"
        strokeWidth="1.4"
        opacity="0.35"
      />
      <circle
        cx="16"
        cy="16"
        r="9"
        fill="none"
        stroke="#D9B968"
        strokeWidth="1.8"
        opacity="0.7"
      />
      <circle cx="16" cy="16" r="3.2" fill="#D9B968" />
      <circle cx="16" cy="3.4" r="1.4" fill="#4F9A86" />
    </svg>
  );
}