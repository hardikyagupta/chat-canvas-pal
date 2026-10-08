type IconProps = { className?: string };

export const SearchIcon = ({ className }: IconProps) => (
  <svg className={className} viewBox="0 0 20 20" fill="none" aria-hidden="true">
    <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.6" />
    <path d="m14 14 3.5 3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

// Infinity Design System 3.0 — atom/icon/search
// Source: Figma oDRsl3d51yyJW7u3rOPn2F, node 158:336 (canonical 16x16 icon grid)
// Geometry preserved verbatim; hardcoded Primary/Ash (#291E30) swapped for
// currentColor so the consuming surface controls the colour.
export const SearchIconDS = ({ className }: IconProps) => (
  <svg className={className} viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path
      d="M15.5 15.5L12.7897 12.7898"
      stroke="currentColor"
      strokeWidth="1"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M7.55019 14.5999C12.0621 14.5999 14.6001 12.0619 14.6001 7.54995C14.6001 3.03797 12.0621 0.499983 7.55019 0.499983C3.03821 0.499983 0.500223 3.03797 0.500223 7.54995C0.500223 12.0619 3.03821 14.5999 7.55019 14.5999Z"
      stroke="currentColor"
      strokeWidth="1"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/* ── Infinity Design System 3.0 icons ──────────────────────────────────────────
   Source: Figma oDRsl3d51yyJW7u3rOPn2F, canonical 16x16 "atom/icon/*" grid.
   Geometry copied verbatim from the exported assets; the authored fill/stroke
   (Primary/Ash #291E30, Secondary/Azure #0A8FFD) is replaced with currentColor
   so each consuming surface applies its own DS colour token.
   These are additive — the original ad-hoc icons above are left untouched so
   screens that have not been migrated keep their current appearance.
────────────────────────────────────────────────────────────────────────────── */

// atom/icon/close — node 158:312
export const CloseIconDS = ({ className }: IconProps) => (
  <svg className={className} viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path
      d="M3.50001 3.50001L8.00001 8.00001M12.5 12.5L8.00001 8.00001M8.00001 8.00001L12.5 3.50001M8.00001 8.00001L3.50001 12.5"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// atom/icon/caret-down — node 158:311
export const CaretDownDS = ({ className }: IconProps) => (
  <svg className={className} viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path
      d="M8.00001 10C6.00001 9 5.00001 8 4.00001 6L12 6C11 8.00001 10 9.00001 8.00001 10Z"
      fill="currentColor"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// atom/icon/tick — node 158:302
export const TickIconDS = ({ className }: IconProps) => (
  <svg className={className} viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="M3 8L6 11.5L13 4.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// atom/icon/dash — node 158:261
export const DashIconDS = ({ className }: IconProps) => (
  <svg className={className} viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="M1 8L15 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// atom/icon/filter — node 158:350
export const FilterIconDS = ({ className }: IconProps) => (
  <svg className={className} viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path
      d="M8.50002 12L7.50001 12M15.5 3.99999L0.500006 3.99999M12 7.99999L4.00001 7.99999"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// atom/icon/information — node 158:266
export const InfoIconDS = ({ className }: IconProps) => (
  <svg className={className} viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M16 8C16 10.492 15.2973 12.5093 13.9033 13.9033C12.5093 15.2973 10.492 16 8 16C5.50797 16 3.49069 15.2973 2.09668 13.9033C0.702665 12.5093 0 10.492 0 8C0 5.50797 0.702665 3.49069 2.09668 2.09668C3.49069 0.702665 5.50797 0 8 0C10.492 0 12.5093 0.702665 13.9033 2.09668C15.2973 3.49069 16 5.50797 16 8ZM7.25317 8.51489C7.25318 8.37682 7.14125 8.26489 7.00317 8.26489H6.50708C6.09287 8.26489 5.75708 7.9291 5.75708 7.51489C5.75708 7.10068 6.09287 6.7649 6.50708 6.76489H7.00317C7.96967 6.76489 8.75318 7.54839 8.75317 8.51489V10.5H9.50024C9.91435 10.5001 10.2502 10.8359 10.2502 11.25C10.2502 11.6641 9.91435 11.9999 9.50024 12H6.52173C6.10752 12 5.77173 11.6642 5.77173 11.25C5.77173 10.8358 6.10752 10.5 6.52173 10.5H7.25317V8.51489ZM7.25 4.75V5.07324C7.25025 5.48724 7.58594 5.82324 8 5.82324C8.41406 5.82324 8.74975 5.48724 8.75 5.07324V4.75C8.75 4.33579 8.41421 4 8 4C7.58579 4 7.25 4.33579 7.25 4.75Z"
      fill="currentColor"
    />
  </svg>
);

// atom/icon/delete — node 158:319
export const DeleteIconDS = ({ className }: IconProps) => (
  <svg className={className} viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M8 1.99999C9.02116 1.99999 9.90901 2.67609 10.2441 3.65331L10.5566 4.5664H13.5C13.7761 4.5664 13.9999 4.79037 14 5.0664C14 5.34254 13.7761 5.5664 13.5 5.5664H12.875L12.5547 12.8184V12.8291C12.4821 13.8287 11.7374 14.6861 10.7031 14.8223C8.89918 15.0595 7.10082 15.0595 5.29688 14.8223C4.26264 14.6861 3.51786 13.8287 3.44531 12.8291V12.8184L3.125 5.5664H2.5C2.22386 5.5664 2 5.34254 2 5.0664C2.00014 4.79037 2.22394 4.5664 2.5 4.5664H5.44336L5.75586 3.65331C6.09099 2.67609 6.97884 1.99999 8 1.99999ZM8 2.99999C7.43639 2.99999 6.9088 3.37529 6.70215 3.97753L6.5 4.5664H9.5L9.29785 3.97753C9.0912 3.37529 8.56361 2.99999 8 2.99999ZM6.2041 7.33886C6.47875 7.31152 6.72346 7.51148 6.75098 7.78613L7.11816 11.4531C7.14547 11.7278 6.9446 11.9725 6.66992 12C6.3953 12.0274 6.15071 11.8273 6.12305 11.5527L5.75586 7.88574C5.72838 7.61096 5.92933 7.36634 6.2041 7.33886ZM10.418 7.88574C10.4454 7.61096 10.2445 7.36634 9.96973 7.33886C9.69508 7.31152 9.45036 7.51147 9.42285 7.78613L9.05566 11.4531C9.02836 11.7278 9.22923 11.9725 9.50391 12C9.77852 12.0274 10.0231 11.8273 10.0508 11.5527L10.418 7.88574Z"
      fill="currentColor"
    />
  </svg>
);

// atom/icon/ai-star — node 157:1638 (three-star composite; offsets from the
// Figma insets, scale 1:1 so a plain translate reproduces them exactly)
export const AiStarIconDS = ({ className }: IconProps) => (
  <svg className={className} viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <g transform="translate(0, 2.1872)">
      <path
        d="M1.82854 0C2.04855 0 2.22106 0.922658 2.47916 1.18156C2.73727 1.44046 3.65709 1.6135 3.65709 1.83418C3.65709 2.05486 2.73727 2.22791 2.47916 2.48681C2.22106 2.74571 2.04855 3.66837 1.82854 3.66837C1.60854 3.66837 1.43603 2.74571 1.17793 2.48681C0.91982 2.22791 0 2.05486 0 1.83418C0 1.6135 0.91982 1.44046 1.17793 1.18156C1.43603 0.922658 1.60854 0 1.82854 0Z"
        fill="currentColor"
      />
    </g>
    <g transform="translate(9.9664, 0)">
      <path
        d="M3.01641 0C3.52539 0 3.65184 1.23876 4.22486 1.81355C4.79788 2.38833 6.03283 2.51518 6.03283 3.02572C6.03283 3.53626 4.79788 3.6631 4.22486 4.23789C3.65184 4.81268 3.52539 6.05144 3.01641 6.05144C2.50744 6.05144 2.38099 4.81268 1.80797 4.23789C1.23495 3.6631 0 3.53626 0 3.02572C0 2.51518 1.23495 2.38833 1.80797 1.81355C2.38099 1.23876 2.50744 0 3.01641 0Z"
        fill="currentColor"
      />
    </g>
    <g transform="translate(1.48, 3.5824)">
      <path
        d="M6.18982 0C6.91904 0 7.51885 3.15168 8.37825 4.01373C9.23764 4.87578 12.3796 5.47744 12.3796 6.20891C12.3796 6.94038 9.23764 7.54205 8.37825 8.4041C7.51885 9.26614 6.91904 12.4178 6.18982 12.4178C5.4606 12.4178 4.86078 9.26614 4.00139 8.4041C3.14199 7.54205 0 6.94038 0 6.20891C0 5.47744 3.14199 4.87578 4.00139 4.01373C4.86078 3.15168 5.4606 0 6.18982 0Z"
        fill="currentColor"
      />
    </g>
  </svg>
);

// Bespoke empty-state illustration (no DS equivalent) with its internal
// colours mapped onto DS tokens: bg/page, border/default, gray-100, gray-300,
// brand. Additive so the un-migrated screens keep the original.
export const EmptyIllustrationDS = ({ className }: IconProps) => (
  <svg className={className} viewBox="0 0 96 96" fill="none" aria-hidden="true">
    <rect x="18" y="20" width="60" height="56" rx="8" fill="#F4F8FF" stroke="#D9D9E8" strokeWidth="1.6" />
    <rect x="28" y="32" width="10" height="10" rx="2.5" fill="#fff" stroke="#BBBBC8" strokeWidth="1.4" />
    <rect x="44" y="34" width="26" height="3" rx="1.5" fill="#BBBBC8" />
    <rect x="44" y="40" width="18" height="3" rx="1.5" fill="#EBEBF5" />
    <rect x="28" y="50" width="10" height="10" rx="2.5" fill="#fff" stroke="#BBBBC8" strokeWidth="1.4" />
    <rect x="44" y="52" width="26" height="3" rx="1.5" fill="#BBBBC8" />
    <rect x="44" y="58" width="14" height="3" rx="1.5" fill="#EBEBF5" />
    <circle cx="70" cy="66" r="13" fill="#fff" stroke="#2F68E5" strokeWidth="1.8" />
    <path d="m66 66 3 3 5-6" stroke="#2F68E5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const ChevronDown = ({ className }: IconProps) => (
  <svg className={className} viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="m4 6 4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const FilterIcon = ({ className }: IconProps) => (
  <svg className={className} viewBox="0 0 20 20" fill="none" aria-hidden="true">
    <path d="M3 5h14M6 10h8M8.5 15h3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

export const InfoIcon = ({ className }: IconProps) => (
  <svg className={className} viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <circle cx="8" cy="8" r="6.25" stroke="currentColor" strokeWidth="1.3" />
    <path d="M8 7.2v3.4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    <circle cx="8" cy="5.2" r="0.9" fill="currentColor" />
  </svg>
);

export const CloseIcon = ({ className }: IconProps) => (
  <svg className={className} viewBox="0 0 20 20" fill="none" aria-hidden="true">
    <path d="m5 5 10 10M15 5 5 15" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
  </svg>
);

export const CheckIcon = ({ className }: IconProps) => (
  <svg className={className} viewBox="0 0 14 14" fill="none" aria-hidden="true">
    <path d="m2.5 7.5 3 3 6-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const DashIcon = ({ className }: IconProps) => (
  <svg className={className} viewBox="0 0 14 14" fill="none" aria-hidden="true">
    <path d="M3.5 7h7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export const SparkIcon = ({ className }: IconProps) => (
  <svg className={className} viewBox="0 0 20 20" fill="none" aria-hidden="true">
    <path d="M10 2.5 11.6 7 16 8.6 11.6 10.2 10 14.6 8.4 10.2 4 8.6 8.4 7 10 2.5Z" fill="currentColor" />
    <path d="M15.5 13.5 16.2 15.4 18 16 16.2 16.6 15.5 18.5 14.8 16.6 13 16 14.8 15.4 15.5 13.5Z" fill="currentColor" opacity="0.7" />
  </svg>
);

export const TrashIcon = ({ className }: IconProps) => (
  <svg className={className} viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="M3 4.5h10M6.5 4.5V3.2c0-.4.3-.7.7-.7h1.6c.4 0 .7.3.7.7v1.3M4.3 4.5l.5 8c0 .5.4.8.8.8h4.8c.4 0 .8-.3.8-.8l.5-8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const EmptyIllustration = ({ className }: IconProps) => (
  <svg className={className} viewBox="0 0 96 96" fill="none" aria-hidden="true">
    <rect x="18" y="20" width="60" height="56" rx="8" fill="#F4F8FF" stroke="#DDE2EE" strokeWidth="1.6" />
    <rect x="28" y="32" width="10" height="10" rx="2.5" fill="#fff" stroke="#C6D2EA" strokeWidth="1.4" />
    <rect x="44" y="34" width="26" height="3" rx="1.5" fill="#C6D2EA" />
    <rect x="44" y="40" width="18" height="3" rx="1.5" fill="#DDE2EE" />
    <rect x="28" y="50" width="10" height="10" rx="2.5" fill="#fff" stroke="#C6D2EA" strokeWidth="1.4" />
    <rect x="44" y="52" width="26" height="3" rx="1.5" fill="#C6D2EA" />
    <rect x="44" y="58" width="14" height="3" rx="1.5" fill="#DDE2EE" />
    <circle cx="70" cy="66" r="13" fill="#fff" stroke="#143F93" strokeWidth="1.8" />
    <path d="m66 66 3 3 5-6" stroke="#143F93" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/* ─── Stepper glyphs (Infinity DS 3.0) ─────────────────────────────────────
   Added additively for the Replenishment setup stepper only; the icons above
   keep their existing consumers untouched. Geometry copied verbatim from the
   Figma exports, authored strokes/fills swapped for currentColor. */

// Tick as it appears inside the DS Stepper "Done" indicator — the atom/icon/tick
// (node 158:302) filled variant baked into the 24x24 indicator (node 814:4348).
export const StepTickIconDS = ({ className }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M11.0995 15.3C10.8516 15.3 10.6126 15.1996 10.4356 15.0171L8.07219 12.5805C7.70927 12.2063 7.70927 11.5949 8.07219 11.2207C8.43511 10.8466 9.02818 10.8466 9.3911 11.2207L11.0729 12.9546L14.5782 9.01226C14.9234 8.61984 15.5165 8.59246 15.8971 8.9575C16.2778 9.31341 16.3043 9.92485 15.9502 10.3173L11.7899 14.9897C11.6217 15.1814 11.3739 15.3 11.1172 15.3C11.1172 15.3 11.1083 15.3 11.0995 15.3Z"
      fill="currentColor"
    />
  </svg>
);

// atom/icon/data mapping — node 157:1726
export const DataMappingIconDS = ({ className }: IconProps) => (
  <svg className={className} viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path
      d="M0.600575 2.71222C0.600575 2.71222 0.489086 4.42531 0.5 5.52398C0.513693 6.90259 0.629376 8.06792 0.737322 9.04677C0.820383 9.79983 1.23158 10.4765 1.90969 10.7861C2.74342 11.1668 4.01994 11.4999 5.49927 11.4999C6.18943 11.4999 6.83544 11.4274 7.41294 11.3114C7.61759 11.2703 7.81364 11.2237 8 11.173M0.600575 2.71222C0.600575 1.29636 2.36409 0.499943 5.49923 0.499943C8.63437 0.499943 10.3979 1.29636 10.3979 2.71222M0.600575 2.71222C0.600575 4.12809 2.36409 4.92451 5.49923 4.92451C8.63437 4.92451 10.3979 4.12809 10.3979 2.71222M10.3979 2.71222C10.3979 2.71222 10.5094 4.42531 10.4985 5.52398C10.4964 5.73346 10.492 5.938 10.4856 6.13772C10.473 6.53017 10.4528 6.90397 10.4279 7.25984M0.550618 6.95291C1.25058 7.31595 1.97959 7.59786 2.72452 7.79829M10.4476 6.95725C10.0938 7.14185 9.7324 7.30526 9.36525 7.44754"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M7.5 8.99994C7.5 9.95994 6.96 10.4999 6 10.4999C5.04 10.4999 4.5 9.95994 4.5 8.99994C4.5 8.03994 5.04 7.49994 6 7.49994C6.96 7.49994 7.5 8.03994 7.5 8.99994Z"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M15.5 14C15.5 14.96 14.96 15.5 14 15.5C13.04 15.5 12.5 14.96 12.5 14C12.5 13.04 13.04 12.5 14 12.5C14.96 12.5 15.5 13.04 15.5 14Z"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M15.5 9C15.5 9.96 14.96 10.5 14 10.5C13.04 10.5 12.5 9.96 12.5 9C12.5 8.04 13.04 7.5 14 7.5C14.96 7.5 15.5 8.04 15.5 9Z"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M12.5 13.9999C11.139 13.9999 10.6475 12.5605 10.2278 11.7272C9.80824 10.8939 9.24897 8.99994 8.40976 8.99994M8.40976 8.99994C7.91816 8.99994 7.49999 8.99994 7.49999 8.99994M8.40976 8.99994C10.8678 8.99994 12.5 8.99994 12.5 8.99994"
      stroke="currentColor"
      strokeLinecap="round"
    />
  </svg>
);

// atom/icon/ia-product-picker — node 157:1756 (authored on a 16.4 grid)
export const ProductPickerIconDS = ({ className }: IconProps) => (
  <svg className={className} viewBox="0 0 16.4 16.4" fill="none" aria-hidden="true">
    <path
      d="M11.6899 1.86945C10.6051 1.35466 9.48019 0.917489 8.19922 0.5125C5.55612 1.34814 3.5784 2.32062 1.24539 3.82944C0.930378 4.03318 0.72679 4.36841 0.691855 4.73907C0.575683 5.97123 0.514511 7.08631 0.512513 8.2C0.510508 9.31771 0.568104 10.434 0.689522 11.6659C0.725776 12.0336 0.928907 12.3656 1.24157 12.5677C3.57633 14.0781 5.55466 15.0515 8.19931 15.8875C10.844 15.0515 12.8237 14.0781 15.1587 12.5677C15.4714 12.3656 15.6746 12.0336 15.7107 11.6659C15.826 10.4962 15.8836 9.43078 15.8873 8.3694C15.8913 7.19915 15.8298 6.03385 15.7077 4.73927C15.6728 4.3686 15.4691 4.03337 15.1542 3.82964C13.9518 3.05205 12.8435 2.41686 11.6899 1.86945ZM8.19931 15.8875L8.19994 7.65105M15.4122 4.21443L8.19994 7.65105M8.19994 7.65105C8.19994 7.65105 5.64961 6.43479 4.24096 5.763M0.985798 4.21061C0.985798 4.21061 2.84637 5.09792 4.24096 5.763M4.24096 5.763C5.79811 4.44468 9.22501 3.075 11.6899 1.86945"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// atom/icon/ia-analyze — node 158:158
export const AnalyzeIconDS = ({ className }: IconProps) => (
  <svg className={className} viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path
      d="M15.5 15.5L12.7897 12.7898"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M7.55019 14.5999C12.0621 14.5999 14.6001 12.0619 14.6001 7.54995C14.6001 3.03797 12.0621 0.499983 7.55019 0.499983C3.03821 0.499983 0.500223 3.03797 0.500223 7.54995C0.500223 12.0619 3.03821 14.5999 7.55019 14.5999Z"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M3.5 11H11.5M4.23088 5.6134C4.16927 6.15554 4.13892 6.70098 4.14 7.24683C4.14 7.85341 4.17968 8.47454 4.23088 8.88157C4.24585 9.02073 4.30396 9.15117 4.39657 9.25346C4.48918 9.35574 4.61133 9.42439 4.7448 9.44917C4.96734 9.49296 5.19346 9.51442 5.42 9.51327C5.6888 9.51327 5.91408 9.48684 6.0952 9.44983C6.22877 9.42502 6.35098 9.35627 6.4436 9.25386C6.53622 9.15144 6.59428 9.02085 6.60912 8.88157C6.66032 8.4752 6.7 7.85408 6.7 7.24749C6.7 6.64156 6.66032 6.02044 6.60912 5.6134C6.59415 5.47424 6.53604 5.3438 6.44343 5.24152C6.35082 5.13924 6.22867 5.07059 6.0952 5.0458C5.87264 5.00224 5.64652 4.98099 5.42 4.98237C5.1512 4.98237 4.92592 5.0088 4.7448 5.0458C4.61133 5.07059 4.48918 5.13924 4.39657 5.24152C4.30396 5.3438 4.24585 5.47424 4.23088 5.6134ZM8.40368 3.63374C8.34608 4.17557 8.3 5.14558 8.3 6.25699C8.3 7.36775 8.34608 8.3371 8.40304 8.87959C8.41415 9.01843 8.46937 9.1496 8.5601 9.25271C8.65083 9.35583 8.772 9.42512 8.9048 9.44983C9.12736 9.4934 9.35348 9.51464 9.58 9.51327C9.8488 9.51327 10.0741 9.48684 10.2552 9.44983C10.5349 9.39301 10.7256 9.17231 10.757 8.87959C10.8139 8.33776 10.8594 7.36775 10.8594 6.25633C10.8594 5.14558 10.8139 4.17623 10.757 3.63308C10.7457 3.49436 10.6904 3.36334 10.5997 3.26036C10.509 3.15737 10.3879 3.08817 10.2552 3.0635C10.0326 3.01995 9.80652 2.99871 9.58 3.00006C9.3112 3.00006 9.08592 3.02649 8.9048 3.0635C8.772 3.08821 8.65083 3.1575 8.5601 3.26062C8.46937 3.36373 8.41479 3.4949 8.40368 3.63374Z"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// atom/icon/lock-outline — node 157:1720. The atom's glyph is a 12x15 leaf
// inset 12.5% horizontally and centred vertically inside the 16x16 grid; the
// export carries the 0.5px stroke bleed, hence the translate.
export const LockIconDS = ({ className }: IconProps) => (
  <svg className={className} viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <g transform="translate(1.5, 0)">
      <path
        d="M0.610511 12.3273C0.79786 14.049 2.19549 15.3913 3.85778 15.4527C4.701 15.4839 5.56681 15.5 6.49999 15.5C7.43315 15.5 8.29898 15.4839 9.1422 15.4527C10.8045 15.3913 12.2021 14.049 12.3894 12.3273C12.4547 11.7272 12.5 11.1176 12.5 10.5C12.5 9.88244 12.4547 9.27276 12.3894 8.67269C12.2021 6.95107 10.8045 5.60874 9.1422 5.5473C8.29898 5.51613 7.43315 5.50002 6.49999 5.50002C5.56681 5.50002 4.701 5.51613 3.85778 5.5473C2.19549 5.60874 0.79786 6.95107 0.610511 8.67269C0.545216 9.27276 0.5 9.88244 0.5 10.5C0.5 11.1176 0.545216 11.7272 0.610511 12.3273Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9.86036 5.49998V3.99999C9.86036 3.07173 9.50636 2.18149 8.87624 1.52512C8.24612 0.868746 7.39149 0.5 6.50036 0.5C5.60924 0.5 4.75462 0.868746 4.1245 1.52512C3.49438 2.18149 3.14038 3.07173 3.14038 3.99999V5.49998"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M7.99999 10.366C7.99999 11.326 7.45999 11.866 6.49999 11.866C5.53999 11.866 4.99999 11.326 4.99999 10.366C4.99999 9.40602 5.53999 8.86602 6.49999 8.86602C7.45999 8.86602 7.99999 9.40602 7.99999 10.366Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </g>
  </svg>
);

// atom/icon/notification-bell — node 158:314 (filled bell body, per the atom)
export const NotifyBellIconDS = ({ className }: IconProps) => (
  <svg className={className} viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path
      d="M7.99999 15.5C7.13454 15.5 6.38229 15.0951 6 14.5H10C9.61769 15.0951 8.86546 15.5 7.99999 15.5Z"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M4.62725 1.86075C5.52165 0.98948 6.73471 0.5 7.99959 0.5C9.26445 0.5 10.4775 0.98948 11.3719 1.86075C12.2663 2.73202 12.7688 3.91372 12.7688 5.1459C12.7688 5.87089 12.8916 6.55213 13.0764 7.24893C13.1281 7.40667 13.1852 7.55552 13.2465 7.69595C13.5323 8.35087 14.3192 8.57434 14.9064 8.99779C15.3302 9.30336 15.5094 9.7773 15.4992 10.2447C15.4882 10.7441 15.2609 11.2361 14.8844 11.5074C14.8844 11.5074 13.7073 12.5 7.99959 12.5C2.29176 12.5 1.11475 11.5074 1.11475 11.5074C0.738191 11.2361 0.510931 10.7441 0.5 10.2447C0.489769 9.7773 0.669034 9.30336 1.09275 8.99779C1.10005 8.99252 1.10738 8.98729 1.11475 8.98208C1.69941 8.56872 2.47037 8.34277 2.75269 7.696C3.03764 7.0432 3.23038 6.20812 3.23038 5.1459C3.23038 3.91372 3.73285 2.73202 4.62725 1.86075Z"
      fill="currentColor"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// atom/icon/setting-outline — node 157:1654
export const SettingsIconDS = ({ className }: IconProps) => (
  <svg className={className} viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path
      d="M13.9283 9.03827C13.8886 8.99008 13.8699 8.93271 13.8699 8.87076V7.12684C13.8701 7.06691 13.8906 7.00875 13.9283 6.96162L14.7473 5.95199C14.8944 5.77072 14.9825 5.54997 15 5.31865C15.0175 5.08732 14.9635 4.8562 14.8452 4.65552L14.3669 3.84322C14.2491 3.64252 14.0726 3.48135 13.8604 3.38067C13.6482 3.27999 13.41 3.24448 13.177 3.27874L11.882 3.47379C11.8207 3.48191 11.7583 3.4698 11.7047 3.43936L10.1671 2.5674C10.1133 2.53501 10.0721 2.48568 10.0504 2.42743L9.57209 1.23423C9.48666 1.01824 9.33696 0.83262 9.14257 0.701621C8.94817 0.570621 8.71812 0.500334 8.48246 0.499943H7.52583C7.29018 0.500334 7.06012 0.570621 6.86572 0.701621C6.67133 0.83262 6.52163 1.01824 6.4362 1.23423L5.95555 2.42743C5.93292 2.48398 5.8919 2.53159 5.83888 2.56282L4.29894 3.43936C4.24532 3.4698 4.18296 3.48191 4.12161 3.47379L2.82665 3.27874C2.59358 3.24416 2.35533 3.27953 2.14302 3.38024C1.93072 3.48095 1.75426 3.6423 1.63669 3.84322L1.16071 4.65552C1.04325 4.85617 0.98999 5.08697 1.00789 5.31783C1.02578 5.54868 1.114 5.76887 1.26104 5.94969L2.07768 6.95933C2.11582 7.00707 2.13639 7.06612 2.13601 7.12684V8.87076C2.13639 8.93147 2.11582 8.99052 2.07768 9.03827L1.25871 10.0456C1.11183 10.227 1.02393 10.4477 1.00645 10.679C0.988969 10.9102 1.04273 11.1413 1.16071 11.3421L1.63903 12.1544C1.75659 12.3553 1.93306 12.5166 2.14536 12.6174C2.35766 12.7181 2.59592 12.7534 2.82898 12.7188L4.12394 12.5261C4.18504 12.5173 4.24738 12.5286 4.30127 12.5582L5.83888 13.4302C5.8919 13.4614 5.93292 13.509 5.95555 13.5656L6.43386 14.7657C6.5193 14.9816 6.669 15.1673 6.86339 15.2983C7.05779 15.4293 7.28784 15.4996 7.52349 15.4999H8.4778C8.71352 15.4999 8.94372 15.4297 9.13818 15.2987C9.33263 15.1676 9.48226 14.9818 9.56742 14.7657L10.0457 13.5679C10.0678 13.5104 10.1089 13.4619 10.1624 13.4302L11.7 12.5582C11.7539 12.5286 11.8163 12.5173 11.8773 12.5261L13.1746 12.7188C13.4077 12.7531 13.6458 12.7176 13.8581 12.6169C14.0703 12.5162 14.2468 12.3551 14.3646 12.1544L14.8406 11.3421C14.9584 11.1417 15.012 10.911 14.9945 10.6801C14.9771 10.4493 14.8893 10.229 14.7426 10.0479L13.9283 9.03827Z"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M6.29766 6.05266C6.78465 5.68084 7.38421 5.48687 7.9967 5.50298C8.61302 5.48722 9.21897 5.68292 9.70856 6.05761C10.2375 6.50021 10.4998 7.25183 10.5 8.0015C10.5002 8.6399 10.3104 9.27688 9.93344 9.72044C9.68465 9.97988 9.3836 10.1835 9.05021 10.3179C8.71682 10.4523 8.35587 10.5144 7.9967 10.5C7.63836 10.5137 7.28119 10.4513 6.94872 10.3169C6.61624 10.1826 6.31601 9.97929 6.06779 9.72049C5.69096 9.27703 5.50007 8.64024 5.5 8.0015C5.49991 7.25111 5.76318 6.49805 6.29766 6.05266Z"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// atom/icon/action — node 158:321 (vertical three-dot row overflow)
export const ActionIconDS = ({ className }: IconProps) => (
  <svg className={className} viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path
      d="M8.78444 15.4483C9.13021 15.4104 9.4083 15.1252 9.44682 14.7707C9.47542 14.5075 9.5 14.2371 9.5 13.9615C9.5 13.6859 9.47542 13.4156 9.44682 13.1524C9.4083 12.7979 9.13021 12.5127 8.78444 12.4747C8.52921 12.4467 8.26716 12.4231 8 12.4231C7.73284 12.4231 7.4708 12.4467 7.21555 12.4747C6.8698 12.5127 6.59171 12.7979 6.55319 13.1524C6.52457 13.4156 6.5 13.6859 6.5 13.9615C6.5 14.2371 6.52457 14.5075 6.55319 14.7707C6.59171 15.1252 6.8698 15.4104 7.21555 15.4483C7.4708 15.4763 7.73284 15.5 8 15.5C8.26716 15.5 8.52921 15.4763 8.78444 15.4483Z"
      fill="currentColor"
    />
    <path
      d="M8.78444 9.4868C9.13021 9.44886 9.4083 9.16364 9.44682 8.80919C9.47542 8.54591 9.5 8.2756 9.5 8C9.5 7.72439 9.47542 7.45408 9.44682 7.19081C9.4083 6.83635 9.13021 6.55113 8.78444 6.5132C8.52921 6.48519 8.26716 6.46153 8 6.46153C7.73284 6.46153 7.47079 6.48519 7.21555 6.5132C6.8698 6.55113 6.59171 6.83635 6.55319 7.19081C6.52457 7.45408 6.5 7.7244 6.5 8C6.5 8.2756 6.52457 8.54591 6.55319 8.80919C6.59171 9.16364 6.8698 9.44886 7.21555 9.4868C7.4708 9.51481 7.73284 9.53846 8 9.53846C8.26716 9.53846 8.52921 9.51481 8.78444 9.4868Z"
      fill="currentColor"
    />
    <path
      d="M8.78444 3.52526C9.13021 3.48732 9.4083 3.2021 9.44682 2.84765C9.47542 2.58438 9.5 2.31406 9.5 2.03846C9.5 1.76286 9.47542 1.49254 9.44682 1.22928C9.4083 0.874817 9.13021 0.589598 8.78444 0.551666C8.52921 0.523654 8.26716 0.5 8 0.5C7.73284 0.5 7.4708 0.523654 7.21555 0.551666C6.8698 0.589599 6.59171 0.874817 6.55319 1.22928C6.52457 1.49254 6.5 1.76286 6.5 2.03846C6.5 2.31406 6.52457 2.58438 6.55319 2.84765C6.59171 3.2021 6.8698 3.48732 7.21555 3.52526C7.4708 3.55327 7.73284 3.57692 8 3.57692C8.26716 3.57692 8.52921 3.55327 8.78444 3.52526Z"
      fill="currentColor"
    />
  </svg>
);

// atom/icon/edit — node 158:341
export const EditIconDS = ({ className }: IconProps) => (
  <svg className={className} viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path
      d="M1.29326 15.1486C1.07066 14.9106 0.948525 14.5782 1.02082 14.2377L1.17564 13.5L1.99006 9.61959L7.76164 2.99999L9.07664 1.49178C9.65502 0.829072 10.4773 0.49797 11.3346 0.499993C12.1678 0.50196 13.0341 0.818478 13.7421 1.45094C14.5679 2.18994 14.9975 3.19611 15 4.16535C15.002 4.92265 14.7433 5.65741 14.2094 6.22458L12.6478 7.8861M7.76164 2.99999L12.6478 7.8861M12.6478 7.8861L6.89009 14.0121L2.94185 15.2662M3.5 10.5L5.5 12.5M1.17564 13.5L2.05874 14.3831M2.94185 15.2662L2.34775 15.4549C2.25261 15.4853 2.15659 15.4993 2.06197 15.499C1.77025 15.498 1.4918 15.3608 1.29326 15.1486M2.94185 15.2662L2.05874 14.3831M2.05874 14.3831L1.29326 15.1486"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// atom/icon/ia-journey — node 157:1648
export const JourneyIconDS = ({ className }: IconProps) => (
  <svg className={className} viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path
      d="M4.5 2.5C4.5 3.78 3.78 4.5 2.5 4.5C1.22 4.5 0.5 3.78 0.5 2.5C0.5 1.22 1.22 0.5 2.5 0.5C3.78 0.5 4.5 1.22 4.5 2.5ZM4.5 2.5L8.7422 2.49999C10.2653 2.49999 11.5 3.73471 11.5 5.2578C11.5 6.7809 10.2653 8.01562 8.7422 8.01562H4.50001C3.1193 8.01562 2.00001 9.1349 2.00001 10.5156C2.00001 11.8963 3.1193 13.0156 4.50001 13.0156H10.5M13 10.5C14.6 10.5 15.5 11.4 15.5 13C15.5 14.6 14.6 15.5 13 15.5C11.4 15.5 10.5 14.6 10.5 13C10.5 11.4 11.4 10.5 13 10.5Z"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// atom/icon/add — node 158:283
export const PlusIconDS = ({ className }: IconProps) => (
  <svg className={className} viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path
      d="M8 13V8M8 8V3M8 8L13 8M8 8L3 8"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// atom/icon/plus-circle — node 157:1624
export const PlusCircleIconDS = ({ className }: IconProps) => (
  <svg className={className} viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path
      d="M7.995 4.50512V8.00012M7.995 8.00012V11.5051M7.995 8.00012H11.5M7.995 8.00012H4.5M8 15.5C12.8 15.5 15.5 12.8 15.5 8C15.5 3.2 12.8 0.5 8 0.5C3.2 0.5 0.5 3.2 0.5 8C0.5 12.8 3.2 15.5 8 15.5Z"
      stroke="currentColor"
      strokeLinecap="round"
    />
  </svg>
);

// atom/icon/close-circle-line — node 157:1614
export const CloseCircleLineIconDS = ({ className }: IconProps) => (
  <svg className={className} viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path
      d="M2.19754 13.1524C3.53028 14.7175 5.76481 15.5 7.99935 15.5C10.2339 15.5 12.4684 14.7175 13.8012 13.1524C14.9307 11.8259 15.5012 9.91513 15.5 7.99813C15.4989 6.09873 14.9366 4.19321 13.8012 2.8439C13.5919 2.59525 13.3632 2.36548 13.115 2.15813C11.7916 1.05271 9.89547 0.500003 7.99936 0.5C6.10325 0.499996 4.20713 1.05271 2.88373 2.15813C2.63549 2.36549 2.40678 2.59525 2.19754 2.84391C1.06209 4.19323 0.499818 6.09874 0.498676 7.99814C0.497523 9.91513 1.06794 11.8259 2.19754 13.1524Z"
      stroke="currentColor"
      strokeLinecap="round"
    />
    <path d="M8 8L11 11M8 8L11 5M8 8L5 5M8 8L5 11" stroke="currentColor" strokeLinecap="round" />
  </svg>
);

// atom/icon/warning-circle — node 157:1698
export const WarningCircleIconDS = ({ className }: IconProps) => (
  <svg className={className} viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path
      d="M7.99996 4.26744V8.62862M7.99996 10.8557V11.6426M1.14433 6.23583C2.66058 4.35717 4.30073 2.7114 6.17221 1.19097C6.74346 0.726885 7.37175 0.4973 7.99996 0.499908C8.62317 0.502496 9.24629 0.733601 9.81352 1.19097C11.6945 2.70767 13.331 4.3488 14.8443 6.23583C15.2757 6.77366 15.4949 7.37886 15.4999 7.98461C15.505 8.60245 15.2872 9.22085 14.8443 9.76891C13.3122 11.6648 11.6535 13.3234 9.75725 14.8557C9.22085 15.2891 8.61025 15.5031 7.99996 15.4998C7.39677 15.4966 6.79389 15.2812 6.26325 14.8557C4.34524 13.3177 2.68138 11.6529 1.14433 9.73372C0.71628 9.19925 0.500776 8.59187 0.5 7.98461C0.499224 7.37721 0.713274 6.76992 1.14433 6.23583Z"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// atom/icon/view — node 158:65
export const ViewIconDS = ({ className }: IconProps) => (
  <svg className={className} viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M8 2C10.241 2.00002 12.2301 3.1545 13.6377 4.42285C14.3456 5.06078 14.923 5.7418 15.3271 6.35156C15.5291 6.65623 15.693 6.94993 15.8076 7.21777C15.9181 7.47598 16 7.74904 16 8V8.00879C15.9997 8.05035 15.9968 8.09269 15.9922 8.13574C15.9816 8.23429 15.9596 8.33623 15.9297 8.44043C15.9212 8.46993 15.9121 8.49954 15.9023 8.5293C15.8971 8.54537 15.8911 8.56128 15.8851 8.57728L15.875 8.60449C15.8505 8.67252 15.8239 8.74119 15.7939 8.80957C15.786 8.82781 15.7774 8.84587 15.7689 8.864L15.7568 8.88965L15.7441 8.91706C15.7215 8.96595 15.6987 9.01535 15.6738 9.06348C15.672 9.06706 15.6697 9.07043 15.6674 9.07381C15.6652 9.07713 15.663 9.08045 15.6611 9.08398L15.6593 9.08813L15.6577 9.09223L15.6564 9.09577L15.6543 9.10059C15.6487 9.11124 15.6426 9.1217 15.6365 9.13221C15.6313 9.14111 15.6261 9.15005 15.6211 9.15918C15.5837 9.22808 15.5446 9.29878 15.502 9.37012C15.4903 9.3896 15.4782 9.409 15.4661 9.42855L15.4502 9.4541C15.4047 9.5278 15.3573 9.60305 15.3066 9.67871C15.2943 9.69708 15.2816 9.71533 15.2689 9.73368L15.248 9.76367C15.1941 9.84209 15.1372 9.92112 15.0781 10.001C15.0495 10.0397 15.02 10.0782 14.9902 10.1172L14.9579 10.1597C14.9279 10.1991 14.8977 10.2389 14.8662 10.2783C14.861 10.2848 14.8556 10.2911 14.8501 10.2975C14.845 10.3034 14.8399 10.3093 14.835 10.3154C14.8289 10.3229 14.8231 10.3305 14.8173 10.3382C14.8109 10.3466 14.8046 10.3551 14.7979 10.3633C14.7956 10.366 14.7929 10.3683 14.7901 10.3706C14.7877 10.3726 14.7852 10.3746 14.7832 10.377C14.1084 11.1997 13.1747 12.0781 12.0596 12.7627L12.0537 12.7666L11.8398 12.8936L11.835 12.8965C11.1286 13.3047 10.3475 13.6356 9.51465 13.8252L9.51083 13.8266L9.50684 13.8281C9.50241 13.8291 9.49793 13.8299 9.49344 13.8306C9.4891 13.8313 9.48476 13.8321 9.48047 13.833C9.28971 13.8755 9.09636 13.9108 8.90039 13.9375C8.89812 13.9378 8.89582 13.9379 8.89352 13.938L8.89092 13.9381L8.88672 13.9385C8.79026 13.9514 8.69333 13.9628 8.5957 13.9717L8.5871 13.9726L8.57812 13.9736C8.47524 13.9827 8.37169 13.9899 8.26758 13.9941C8.17878 13.9978 8.08959 14 8 14C5.75899 14 3.76985 12.8455 2.3623 11.5771C1.65439 10.9392 1.07699 10.2582 0.672852 9.64844C0.470937 9.34378 0.306985 9.05006 0.192383 8.78223C0.0819182 8.52403 3.24706e-05 8.25095 0 8C0 7.99238 0.000291802 7.98472 0.000581936 7.97711L0.000976562 7.96582C0.00312895 7.89126 0.0133965 7.8145 0.0283203 7.73633C0.0402457 7.67393 0.0553224 7.61032 0.0742188 7.5459C0.0756996 7.54085 0.0773608 7.53586 0.0790247 7.53085L0.0830078 7.51855C0.0971955 7.47225 0.113614 7.42586 0.130859 7.37891C0.15158 7.32253 0.174026 7.26615 0.198242 7.20996L0.207736 7.18772C0.214821 7.17104 0.221929 7.15431 0.229492 7.1377C0.232594 7.13088 0.235393 7.12393 0.238194 7.11697C0.241334 7.10917 0.244476 7.10136 0.248047 7.09375C0.268234 7.05072 0.290724 7.00746 0.313645 6.96337L0.329102 6.93359C0.332919 6.92622 0.336473 6.9187 0.340029 6.91118C0.344067 6.90264 0.348108 6.89409 0.352539 6.88574C0.353696 6.88356 0.355079 6.88146 0.356464 6.87936C0.357831 6.87728 0.359199 6.8752 0.360352 6.87305C0.456571 6.69297 0.570162 6.50406 0.700195 6.31055C0.71986 6.28128 0.740382 6.25223 0.761084 6.22292L0.788086 6.18457C0.795527 6.17394 0.802863 6.16312 0.810224 6.15226C0.819956 6.13791 0.82973 6.1235 0.839844 6.10938C0.851506 6.09309 0.863629 6.07702 0.875812 6.06087C0.884676 6.04913 0.893572 6.03734 0.902344 6.02539C0.932328 5.98456 0.962847 5.94349 0.994141 5.90234C1.05277 5.82525 1.11337 5.74719 1.17676 5.66895L1.18886 5.65356C1.19324 5.64791 1.19762 5.64226 1.20215 5.63672L1.20605 5.63184C1.66011 5.0767 2.23071 4.49889 2.89258 3.97266C3.21933 3.71287 3.56999 3.46473 3.94043 3.2373C3.96382 3.22297 3.9881 3.21126 4.0127 3.20117C4.7692 2.74588 5.59457 2.38228 6.47363 2.17871C6.4766 2.17792 6.47945 2.17668 6.48232 2.17544C6.48554 2.17405 6.48878 2.17265 6.49219 2.17188C6.56635 2.15508 6.6415 2.14069 6.71656 2.12631L6.72852 2.12402L6.74806 2.12009L6.77246 2.11523C6.84471 2.10186 6.9175 2.09087 6.9905 2.07985L7.00195 2.07812C7.01766 2.07574 7.03334 2.07312 7.04902 2.0705C7.07234 2.06661 7.09568 2.06272 7.11914 2.05957C7.14898 2.05559 7.17898 2.05266 7.20901 2.04973C7.22787 2.04789 7.24676 2.04605 7.26562 2.04395L7.31273 2.03855C7.36069 2.033 7.40873 2.02745 7.45703 2.02344C7.56722 2.01431 7.67848 2.00653 7.79004 2.00293C7.85976 2.00068 7.9298 2 8 2ZM9.35156 10.5732C10.3815 10.1476 10.8994 9.20865 10.8994 8C10.8994 7.16204 10.6533 6.43849 10.123 5.92676C9.59539 5.4176 8.85517 5.18462 8 5.18457C7.57146 5.18457 7.17266 5.242 6.81445 5.36426L6.7998 5.37012L6.66309 5.42188L6.64844 5.42773C5.61854 5.85342 5.09962 6.79141 5.09961 8C5.09961 8.83803 5.34667 9.56148 5.87695 10.0732C6.40466 10.5824 7.14473 10.8154 8 10.8154C8.4532 10.8154 8.87302 10.7515 9.24707 10.6143L9.25586 10.6104L9.3418 10.5771L9.35156 10.5732Z"
      fill="currentColor"
    />
  </svg>
);

// atom/icon/sand — node 157:1635
export const SandIconDS = ({ className }: IconProps) => (
  <svg className={className} viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path
      d="M7.99985 8C9.3423 8 10.6298 8.42548 11.579 9.18284C13.9059 11.0394 12.664 13.307 11.9769 15.5H4.02283C3.33567 13.307 2.0938 11.0394 4.42071 9.18284C5.36995 8.42548 6.65741 8 7.99985 8ZM7.99985 8C9.3423 8 10.6298 7.57452 11.579 6.81716C13.9059 4.96063 12.664 2.69298 11.9769 0.5H4.02283C3.33567 2.69298 2.0938 4.96063 4.42071 6.81716C5.36995 7.57452 6.65741 8 7.99985 8ZM1.5 0.5H14.5M1.5 15.5H14.5M5 14C5 14 6.47495 12 8 12C9.52505 12 11 14 11 14M8 9.68284V10.5M11 4H5"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// Infinity Design System 3.0 — atom/icon/Engage (the DS megaphone; there is no
// icon named "announce" in the 3.0 file, this is the announce/reminder glyph).
// Source: Figma oDRsl3d51yyJW7u3rOPn2F, node 115:14 (16x16 icon grid).
// Geometry preserved verbatim; hardcoded Primary/Ash (#291E30) swapped for
// currentColor so the consuming surface controls the colour.
export const AnnounceIconDS = ({ className }: IconProps) => (
  <svg className={className} viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path
      d="M3.27437 8.68304C2.97723 9.14018 2.8058 9.68532 2.8058 10.2693C2.8058 11.8956 4.14409 13.2156 5.79666 13.2156C7.40809 13.2156 8.72237 11.9585 8.78523 10.3859M12.6075 11.5772L2.53434 8.45039C0.390338 7.78524 0.390338 4.74981 2.53434 4.08467L12.6075 0.957814C12.8269 0.889242 13.0612 0.837814 13.2795 0.909814C15.6715 1.70296 15.6715 10.8332 13.2795 11.6252C13.0623 11.6984 12.8269 11.6458 12.6075 11.5772Z"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// Infinity Design System 3.0 — atom/icon/arrow-right
// Source: Figma oDRsl3d51yyJW7u3rOPn2F (16x16 icon grid; the DS bounding
// rectangle is dropped). Geometry preserved verbatim; hardcoded Primary/Ash
// (#291E30) swapped for currentColor so the consuming surface controls the colour.
export const ArrowRightIconDS = ({ className }: IconProps) => (
  <svg className={className} viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="M15 8L1 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path
      d="M11 11.5C12.5 11.5 14.5 9.75 15 8C14.5 6.25 12.5 4.5 11 4.5"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// Infinity Design System 3.0 — atom/icon/warning-line
// Source: Figma oDRsl3d51yyJW7u3rOPn2F (16x16 icon grid; the DS bounding
// rectangle is dropped). Geometry preserved verbatim; hardcoded Primary/Ash
// (#291E30) swapped for currentColor so the consuming surface controls the colour.
export const WarningLineIconDS = ({ className }: IconProps) => (
  <svg className={className} viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="M8 6V8.55924" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M7.98906 10.5577V11.0001" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
    <path
      d="M8 15.0001C11.4145 15.0001 14.829 14.4617 15.3544 13.3846C15.4567 13.1748 15.5017 12.8883 15.4964 12.5422C15.4476 9.33457 11.0818 1.00006 7.99989 1.00006C4.68097 1.00006 0.50626 9.33465 0.496857 12.5422C0.495842 12.8883 0.543345 13.1748 0.645679 13.3846C1.17097 14.4616 4.58555 15 8 15.0001Z"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// External-link / redirect glyph — the same 16x16 geometry the Replenishment
// empty screen's "Connect purchase data" link uses, colour via currentColor.
export const ExternalLinkIcon = ({ className }: IconProps) => (
  <svg className={className} viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="M9.5 2.5H13.5V6.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M13.5 2.5L7.5 8.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M12.5 9.5V13H3V3.5H6.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// Infinity Design System 3.0 — atom/icon/notification-important
// Source: Figma oDRsl3d51yyJW7u3rOPn2F, node 158:168 (16x16 icon grid; the DS
// bounding rectangle is dropped). Geometry preserved verbatim; hardcoded
// Primary/Ash (#291E30) swapped for currentColor.
export const NotificationImportantIconDS = ({ className }: IconProps) => (
  <svg className={className} viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="M6 14.5C6.38229 15.0951 7.13454 15.5 7.99999 15.5C8.86546 15.5 9.61769 15.0951 10 14.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
    <path
      d="M4.62725 1.86075C5.52165 0.98948 6.73471 0.5 7.99959 0.5C9.26445 0.5 10.4775 0.98948 11.3719 1.86075C12.2663 2.73202 12.7688 3.91372 12.7688 5.1459C12.7688 5.87089 12.8916 6.55213 13.0764 7.24893C13.1281 7.40667 13.1852 7.55552 13.2465 7.69595C13.5323 8.35087 14.3192 8.57434 14.9064 8.99779C15.3302 9.30336 15.5094 9.7773 15.4992 10.2447C15.4882 10.7441 15.2609 11.2361 14.8844 11.5074C14.8844 11.5074 13.7073 12.5 7.99959 12.5C2.29176 12.5 1.11475 11.5074 1.11475 11.5074C0.738191 11.2361 0.510931 10.7441 0.5 10.2447C0.489769 9.7773 0.669034 9.30336 1.09275 8.99779C1.10005 8.99252 1.10738 8.98729 1.11475 8.98208C1.69941 8.56872 2.47037 8.34277 2.75269 7.696C3.03764 7.0432 3.23038 6.20812 3.23038 5.1459C3.23038 3.91372 3.73285 2.73202 4.62725 1.86075Z"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path d="M8 3.5V7M8 9.21372V9.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// "No reminder" — the DS 3.0 announce megaphone (atom/icon/Engage, node
// 115:14, the same geometry as AnnounceIconDS) with a diagonal slash. The 3.0
// file has no slashed megaphone of its own, so this is the standard "off"
// treatment on the DS glyph.
export const NoReminderIconDS = ({ className }: IconProps) => (
  <svg className={className} viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path
      d="M3.27437 8.68304C2.97723 9.14018 2.8058 9.68532 2.8058 10.2693C2.8058 11.8956 4.14409 13.2156 5.79666 13.2156C7.40809 13.2156 8.72237 11.9585 8.78523 10.3859M12.6075 11.5772L2.53434 8.45039C0.390338 7.78524 0.390338 4.74981 2.53434 4.08467L12.6075 0.957814C12.8269 0.889242 13.0612 0.837814 13.2795 0.909814C15.6715 1.70296 15.6715 10.8332 13.2795 11.6252C13.0623 11.6984 12.8269 11.6458 12.6075 11.5772Z"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path d="M14.5 1.5L1.5 14.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
