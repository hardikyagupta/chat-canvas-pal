import { createAvatar, palettes, shapes } from '@oreo-design/avatar';
import type { OrbTheme } from '@/components/orb/agentOrbTheme';

/**
 * Deterministic soft-gradient avatars for custom agents, generated with
 * @oreo-design/avatar (https://oreo-design-avatar.vercel.app). The agent's name
 * is hashed to pick a shape + palette, so the same name always yields the same
 * avatar — and two different agents look distinct. Returns an SVG data URI ready
 * to drop into an <img src>. A matching WebGL-orb theme (derived from the same
 * palette) is exposed so the live hand-off orb animates in the avatar's colors.
 */

// Simple stable string hash (djb2-ish). Kept inline so avatars are reproducible
// across sessions without any runtime randomness.
const hashName = (name: string): number => {
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return h;
};

// The shape + palette an agent's name maps to — shared by the avatar and its orb
// theme so the two always come from the same gradient.
const pickConfig = (name: string) => {
  const h = hashName(name || 'agent');
  return {
    shape: shapes[h % shapes.length].id,
    palette: palettes[(h >>> 3) % palettes.length].id,
    variantId: name,
    drift: 8,
  } as const;
};

const uriCache = new Map<string, string>();

export const generateAgentAvatar = (name: string, size = 96): string => {
  const key = `${name}@${size}`;
  const cached = uriCache.get(key);
  if (cached) return cached;

  // background: null drops the opaque square canvas fill, leaving a soft circular
  // avatar with transparent corners (no white box behind it).
  const uri = createAvatar({ ...pickConfig(name), size, background: null }).toDataUri();
  uriCache.set(key, uri);
  return uri;
};

const themeCache = new Map<string, OrbTheme>();

// The WebGL fluid orb theme for a custom agent, pulled from its avatar palette so
// the animated hand-off orb reads as the same identity as the settled SVG avatar.
export const generateAgentOrbTheme = (name: string): OrbTheme => {
  const cached = themeCache.get(name);
  if (cached) return cached;

  const { colors } = createAvatar({ ...pickConfig(name), size: 64 });
  const theme: OrbTheme = {
    core: colors.accent, // hot center
    glow: colors.lobe,   // surrounding mass / halo
    accent: colors.dark, // darker shade for divider + thinking text contrast
  };
  themeCache.set(name, theme);
  return theme;
};
