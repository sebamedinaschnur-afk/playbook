// Playbook wordmark + route-arrow logo, lifted from the signup-flow prototype.
export function Wordmark({ size = 30 }: { size?: number }) {
  return (
    <div className="flex flex-col items-center">
      <svg width="120" height="64" viewBox="0 0 120 64" aria-hidden="true">
        <path
          d="M10 52 C 40 52, 50 16, 88 18"
          fill="none"
          stroke="#3DBE8B"
          strokeWidth="3"
          strokeDasharray="7 6"
          strokeLinecap="round"
        />
        <polygon points="88,10 106,19 87,27" fill="#3DBE8B" />
      </svg>
      <p className="font-display font-semibold tracking-tight" style={{ fontSize: size }}>
        Playbook
      </p>
    </div>
  );
}
