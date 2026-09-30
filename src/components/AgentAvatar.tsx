import React from 'react';
import { getOrbTheme } from './orb/agentOrbTheme';

/**
 * AgentAvatar — renders each agent's own soft-gradient orb. This is the
 * settled/static half of the hand-off header (AgentThreadHeader) and the
 * live orb's own fallback (AgentOrb3D) when WebGL isn't available — so
 * whichever way an agent's turn ends up rendering, it should still read as
 * the same glossy orb, not switch to an unrelated flat icon.
 *
 * Insights/Segment/Journey have their own hand-exported SVGs (Figma,
 * public/AgentAvatars/*.svg). Any other agent — Content agent, Scheduler
 * agent, a custom agent, anything without a dedicated SVG yet — gets a CSS
 * radial-gradient sphere built from its own orb theme (agentOrbTheme.ts),
 * so it still looks like a settled version of the orb it just was, rather
 * than falling back to an arbitrary /AgentIcons icon.
 */

// Agent name → its own SVG. This is the source of truth for these three orbs.
const AGENT_AVATARS: Record<string, string> = {
  'insights agent': '/AgentAvatars/insights-agent.svg',
  'insight agent': '/AgentAvatars/insights-agent.svg',
  'segment agent': '/AgentAvatars/segment-agent.svg',
  'journey agent': '/AgentAvatars/journey-agent.svg',
};

interface AgentAvatarProps {
  /** Agent name — selects the per-agent SVG from the map above, or seeds the
   *  gradient-orb fallback's colors when there isn't one. */
  seed: string;
  /**
   * Unused now — every agent renders either its dedicated SVG or the
   * gradient-orb fallback, never an arbitrary icon, so the hand-off header
   * stays one visual language. Kept only so existing call sites (which pass
   * an /AgentIcons src for the message's own small avatar elsewhere) don't
   * need updating.
   */
  src?: string;
  /** Diameter in px. Defaults to 40 (the Figma spec size). */
  size?: number;
  className?: string;
  /** Extra styles merged onto the element (e.g. an animation). */
  style?: React.CSSProperties;
}

const AgentAvatar: React.FC<AgentAvatarProps> = ({ seed, size = 40, className, style }) => {
  const dedicated = AGENT_AVATARS[seed.trim().toLowerCase()];

  if (dedicated) {
    return (
      <img
        src={dedicated}
        alt=""
        aria-hidden="true"
        width={size}
        height={size}
        className={className}
        style={{
          display: 'block',
          width: size,
          height: size,
          flexShrink: 0,
          // Clip to a circle — the soft-gradient tiles carry a light square edge
          // that would otherwise read as a white box behind the orb.
          borderRadius: '50%',
          ...style,
        }}
      />
    );
  }

  // No dedicated art for this agent — a static sphere in its own orb colors
  // (same palette agentOrbTheme.ts already gives the live WebGL orb and the
  // header's glow halo), so it reads as "this orb, but settled" rather than
  // a different visual language entirely.
  const theme = getOrbTheme(seed);
  return (
    <span
      aria-hidden="true"
      className={className}
      style={{
        display: 'block',
        width: size,
        height: size,
        flexShrink: 0,
        borderRadius: '50%',
        background: `radial-gradient(circle at 35% 30%, ${theme.glow}, ${theme.core} 55%, ${theme.accent} 100%)`,
        ...style,
      }}
    />
  );
};

export default AgentAvatar;
