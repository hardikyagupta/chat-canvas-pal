/**
 * Animated "create an objective" illustration for the ready state — a browser
 * window with copy on the left and a blue target tile on the right, with a
 * cursor tapping it. The window floats, the target pulses, the cursor taps.
 */
export default function ReadyObjectiveIllustration() {
  return (
    <svg viewBox="0 0 320 210" className="h-[240px] w-[320px] shrink-0" fill="none">
      <defs>
        <filter id="winShadow" x="-20%" y="-20%" width="140%" height="150%">
          <feDropShadow dx="0" dy="10" stdDeviation="12" floodColor="#2F68E5" floodOpacity="0.08" />
        </filter>
      </defs>

      {/* Floating window */}
      <g style={{ animation: "isoFloat 5s ease-in-out infinite" }}>
        {/* Window frame */}
        <rect x="34" y="24" width="252" height="150" rx="14" fill="#fff" stroke="#E6EAF4" strokeWidth="1.5" filter="url(#winShadow)" />

        {/* Top bar dots */}
        <circle cx="52" cy="44" r="3.2" fill="#C9D0E0" />
        <circle cx="64" cy="44" r="3.2" fill="#C9D0E0" />
        <circle cx="76" cy="44" r="3.2" fill="#C9D0E0" />
        <line x1="34" y1="60" x2="286" y2="60" stroke="#EEF1F7" strokeWidth="1.5" />

        {/* Left copy lines */}
        <rect x="58" y="86" width="132" height="7" rx="3.5" fill="#E1E6F0" />
        <rect x="58" y="104" width="158" height="7" rx="3.5" fill="#E7EBF3" />
        <rect x="58" y="122" width="96" height="7" rx="3.5" fill="#EAEEF5" />

        {/* Target tile */}
        <rect x="206" y="84" width="58" height="58" rx="14" fill="#EAF0FF" />
        {/* Pulse ring */}
        <circle cx="235" cy="113" r="8" fill="none" stroke="#2F5BF5" strokeWidth="2">
          <animate attributeName="r" values="8;22" dur="2.2s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.5;0" dur="2.2s" repeatCount="indefinite" />
        </circle>
        {/* Bullseye */}
        <circle cx="235" cy="113" r="17" fill="none" stroke="#2F5BF5" strokeWidth="3" />
        <circle cx="235" cy="113" r="10" fill="none" stroke="#2F5BF5" strokeWidth="3" />
        <circle cx="235" cy="113" r="3.6" fill="#2F5BF5" />

        {/* Cursor */}
        <g transform="translate(246 116)">
          <g style={{ animation: "objTap 2.2s ease-in-out infinite" }}>
            <path
              d="M0 0 L0 17 L4.6 12.8 L7.8 19.6 L10.4 18.4 L7.2 11.8 L13 11.4 Z"
              fill="#17173A"
              stroke="#fff"
              strokeWidth="1.4"
              strokeLinejoin="round"
            />
          </g>
        </g>
      </g>
    </svg>
  );
}
