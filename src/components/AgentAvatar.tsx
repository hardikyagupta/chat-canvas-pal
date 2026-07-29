import React from 'react';

/**
 * AgentAvatar — renders each agent's own soft-gradient orb, exported from Figma
 * (public/AgentAvatars/*.svg). Every agent has a distinct SVG: Insights = amber,
 * Segment = blue, Journey = pink. Resolved by agent name; edit the map here and
 * the avatars change everywhere.
 */

// Agent name → its own SVG. This is the source of truth for the three orbs.
const AGENT_AVATARS: Record<string, string> = {
  'insights agent': '/AgentAvatars/insights-agent.svg',
  'insight agent': '/AgentAvatars/insights-agent.svg',
  'segment agent': '/AgentAvatars/segment-agent.svg',
  'journey agent': '/AgentAvatars/journey-agent.svg',
};

const FALLBACK = '/AgentAvatars/insights-agent.svg';

interface AgentAvatarProps {
  /** Agent name — selects the per-agent SVG from the map above. */
  seed: string;
  /** Explicit avatar src override (e.g. a /AgentIcons file). Optional. */
  src?: string;
  /** Diameter in px. Defaults to 40 (the Figma spec size). */
  size?: number;
  className?: string;
  /** Extra styles merged onto the img (e.g. an animation). */
  style?: React.CSSProperties;
}

const AgentAvatar: React.FC<AgentAvatarProps> = ({ seed, src, size = 40, className, style }) => {
  const resolved = AGENT_AVATARS[seed.trim().toLowerCase()] ?? src ?? FALLBACK;

  return (
    <img
      src={resolved}
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
};

export default AgentAvatar;
