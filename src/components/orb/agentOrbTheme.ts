/**
 * Single source of truth for each agent's orb colors. Consumed by the 3D orb
 * shader (core/glow), the thread-header halo (glow), the switch divider and
 * thinking indicator (accent — a darker shade that keeps contrast on light
 * backgrounds).
 *
 * Keys are lowercased agent labels, same convention as AGENT_SAYINGS in
 * AgentThreadHeader.
 */

export interface OrbTheme {
  core: string;
  glow: string;
  accent: string;
}

export const AGENT_ORB_THEMES: Record<string, OrbTheme> = {
  'insights agent': { core: '#F59E0B', glow: '#FDE68A', accent: '#D97706' }, // amber
  'insight agent':  { core: '#F59E0B', glow: '#FDE68A', accent: '#D97706' },
  'segment agent':  { core: '#3B82F6', glow: '#93C5FD', accent: '#2563EB' }, // blue
  'journey agent':  { core: '#EC4899', glow: '#F9A8D4', accent: '#DB2777' }, // pink
};

// Neutral indigo — matches the --color-primary fallback used by the header
// halo. Reads as "handed off from the system" on the first relay turn.
export const DEFAULT_ORB_THEME: OrbTheme = {
  core: '#6366f1',
  glow: '#c7d2fe',
  accent: '#4f46e5',
};

export const getOrbTheme = (name?: string): OrbTheme =>
  AGENT_ORB_THEMES[(name ?? '').trim().toLowerCase()] ?? DEFAULT_ORB_THEME;
