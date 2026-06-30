/** Figma palette on border-beam `md` blob layout (C.colorful.border scale). */
const WELCOME_BEAM_FIGMA_BORDER = [
  { color: 'oklch(0.832 0.12 343.407 / 0.55)', pos: '33% -7.4%', size: '70px 40px' },
  { color: 'oklch(0.554 0.199 263.043 / 0.52)', pos: '12% -5%', size: '60px 35px' },
  { color: 'oklch(0.426 0.108 247.015 / 0.5)', pos: '2.1% 68.3%', size: '40px 70px' },
  { color: 'oklch(0.426 0.108 247.015 / 0.45)', pos: '2.1% 68.3%', size: '20px 35px' },
  { color: 'oklch(0.681 0.208 41.372 / 0.48)', pos: '74.4% 100%', size: '180px 32px' },
  { color: 'oklch(0.832 0.12 343.407 / 0.45)', pos: '55% 100%', size: '85px 26px' },
  { color: 'oklch(0.681 0.208 41.372 / 0.5)', pos: '93.9% 0%', size: '74px 32px' },
  { color: 'oklch(0.832 0.12 343.407 / 0.48)', pos: '100% 27.1%', size: '26px 42px' },
  { color: 'oklch(0.554 0.199 263.043 / 0.45)', pos: '100% 27.1%', size: '52px 48px' },
] as const;

function figmaBorderBackground(): string {
  return WELCOME_BEAM_FIGMA_BORDER.map(
    ({ color, pos, size }) => `radial-gradient(ellipse ${size} at ${pos}, ${color}, transparent)`,
  ).join(',\n    ');
}

/** Light-theme conic wedge — keeps library spin, Figma replaces color blobs. */
function rotatingWedge(beamId: string): string {
  return `conic-gradient(
      from var(--beam-angle-${beamId}),
      transparent 0%, transparent 54%,
      oklch(0 0 0 / 0.08) 57%,
      oklch(0 0 0 / 0.2) 60%,
      oklch(0 0 0 / 0.4) 63%,
      oklch(0 0 0 / 0.55) 66%,
      oklch(0 0 0 / 0.4) 69%,
      oklch(0 0 0 / 0.2) 72%,
      oklch(0 0 0 / 0.08) 75%,
      transparent 78%, transparent 100%
    )`;
}

export function welcomeCardBeamStyleBlock(beamId: string): string {
  const blobs = figmaBorderBackground();
  const wedge = rotatingWedge(beamId);
  return `
.welcome-card-beam[data-beam="${beamId}"][data-active]::before,
.welcome-card-beam[data-beam="${beamId}"][data-fading]::before {
  background: ${blobs} !important;
  z-index: 2 !important;
  filter: brightness(1.55) saturate(1.85) !important;
}

.welcome-card-beam[data-beam="${beamId}"][data-active]::after,
.welcome-card-beam[data-beam="${beamId}"][data-fading]::after {
  background: ${wedge},
    ${blobs} !important;
  filter: brightness(1.55) saturate(1.85) !important;
}`;
}
