/**
 * The "readiness pulse" — the platform's signature visual element.
 * A trend line that draws itself upward, representing scattered interview
 * attempts resolving into a visible, improving pattern over time.
 * Purely decorative (aria-hidden) and respects prefers-reduced-motion via CSS.
 */
export default function ReadinessPulse({ className = '' }) {
  return (
    <svg
      className={`readiness-pulse ${className}`}
      viewBox="0 0 520 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        className="readiness-pulse__grid"
        d="M0 140H520M0 100H520M0 60H520"
        stroke="rgba(244,244,251,0.08)"
        strokeWidth="1"
      />
      <path
        className="readiness-pulse__line"
        d="M0 128 L60 122 L95 132 L120 90 L150 108 L185 60 L215 78 L250 34 L285 52 L320 20 L360 30 L400 12 L440 18 L480 6 L520 10"
        stroke="url(#pulseGradient)"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle className="readiness-pulse__dot" cx="520" cy="10" r="6" fill="#8b7cff" />
      <defs>
        <linearGradient id="pulseGradient" x1="0" y1="0" x2="520" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#4b3fe0" />
          <stop offset="1" stopColor="#8b7cff" />
        </linearGradient>
      </defs>
    </svg>
  );
}
