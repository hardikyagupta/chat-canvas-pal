import React, { useEffect, useState } from 'react';
import AgentAvatar from './AgentAvatar';

/**
 * AgentThreadHeader — introduces an agent's turn, per the Figma design.
 *
 * Layout (node 16530:16040): the gradient orb sits on the LEFT; beside it a
 * column holds the agent's name and, below it, a speech-bubble chip showing a
 * one-line saying. The wavy "Switched to <agent>" divider (AgentSwitchDivider)
 * sits above this. The bubble is static (no shimmer, no expand) — the animated
 * "Thinking…" dots (ThinkingState) that follow are the sole thinking beat.
 *
 * Motion: only the orb moves — it eases in (scale + rotate + fade), then
 * continuously spins, breathes, and pulses a soft glow halo. The name slides in
 * on a short stagger after the orb; the bubble simply appears with it.
 *
 * One component, edited in one place — change it here and every agent header
 * across the app updates.
 */

// One-line "saying" shown in the bubble under the name. Edit centrally.
const AGENT_SAYINGS: Record<string, string> = {
  'insights agent': 'Let me deep dive into this query',
  'insight agent': 'Let me deep dive into this query',
  'segment agent': 'Let me build the right audience for this',
  'journey agent': 'Let me map out the journey',
  'co-marketer': 'Let me pull the team together on this',
  'content agent': 'Let me draft the content for this',
  'scheduler agent': 'Let me find the best time to send',
};

interface AgentThreadHeaderProps {
  /** Display name, e.g. "Insight agent". */
  name: string;
  /** The agent's own SVG avatar (its avatarSrc, from /AgentIcons). */
  avatarSrc?: string;
  /** Optional explicit saying; falls back to the map above. */
  saying?: string;
  /** Avatar diameter in px (default 40, per Figma). */
  size?: number;
  className?: string;
  /**
   * Hold the header hidden for this many ms before it eases in — lets the
   * "Switched to <agent>" divider above it settle first so the hand-off reads
   * as a sequence rather than everything landing at once.
   */
  revealDelay?: number;
}

const AgentThreadHeader: React.FC<AgentThreadHeaderProps> = ({
  name,
  avatarSrc,
  saying,
  size = 40,
  className,
  revealDelay = 0,
}) => {
  const resolvedSaying = saying ?? AGENT_SAYINGS[name.trim().toLowerCase()];
  const [revealed, setRevealed] = useState(revealDelay <= 0);

  useEffect(() => {
    if (revealDelay <= 0) return;
    const t = setTimeout(() => setRevealed(true), revealDelay);
    return () => clearTimeout(t);
  }, [revealDelay]);

  // Reserve the header's vertical space while it's held back so the thread
  // below doesn't jump when it appears.
  if (!revealed) {
    return <div aria-hidden="true" style={{ height: size }} />;
  }

  return (
    <div className={`flex items-start gap-[10px] animate-in fade-in slide-in-from-bottom-1 duration-500 ${className ?? ''}`}>
      {/* Animation keyframes for this header */}
      <style dangerouslySetInnerHTML={{ __html: AGENT_HEADER_KEYFRAMES }} />

      {/* Orb motion is split across nested elements so transforms/filters don't
          collide: outer = entrance (scale+rotate+fade), glow = pulsing halo,
          middle = breathe (scale), img = spin (rotate). The per-agent
          hue-rotate stays on the img (inside AgentAvatar). */}
      <span
        className="relative inline-flex shrink-0 items-center justify-center"
        style={{ animation: 'agentOrbEnter 560ms cubic-bezier(0.22, 1, 0.36, 1) both' }}
      >
        {/* Soft glow halo behind the orb */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-full"
          style={{
            background:
              'radial-gradient(circle, color-mix(in srgb, var(--color-primary, #6366f1) 55%, transparent) 0%, transparent 70%)',
            filter: 'blur(6px)',
            animation: 'agentOrbGlow 3.6s ease-in-out infinite',
          }}
        />
        <span className="relative block" style={{ animation: 'agentOrbBreathe 5s ease-in-out infinite' }}>
          <AgentAvatar
            src={avatarSrc}
            seed={name}
            size={size}
            style={{ animation: 'agentOrbSpin 14s linear infinite' }}
          />
        </span>
      </span>

      <div className="flex flex-1 min-w-px flex-col justify-center gap-[4px]">
        {/* Name slides in just after the orb */}
        <p
          className="text-[14px] leading-[20px] font-semibold text-[var(--color-ink)]"
          style={{
            fontFamily: 'Manrope, sans-serif',
            animation: 'agentLabelEnter 460ms cubic-bezier(0.22, 1, 0.36, 1) both',
            animationDelay: '200ms',
          }}
        >
          {name}
        </p>

        {resolvedSaying && (
          // Static bubble — the thinking chevron lives on the ThinkingState
          // ("Thought for Xs") component that follows, not here.
          <div className="flex w-fit max-w-full items-center rounded-tl-[2px] rounded-tr-[8px] rounded-br-[8px] rounded-bl-[8px] border border-[var(--color-line)] bg-card px-[8px] py-[6px]">
            <span
              className="text-[12px] leading-[18px] font-normal text-[var(--color-grey)]"
              style={{ fontFamily: 'Manrope, sans-serif' }}
            >
              {resolvedSaying}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

// Kept as a module constant so the string isn't rebuilt every render.
const AGENT_HEADER_KEYFRAMES = `
  @keyframes agentOrbEnter {
    0%   { opacity: 0; transform: scale(0.5) rotate(-30deg); }
    60%  { opacity: 1; transform: scale(1.08) rotate(4deg); }
    100% { opacity: 1; transform: scale(1) rotate(0deg); }
  }
  @keyframes agentOrbSpin {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
  }
  @keyframes agentOrbBreathe {
    0%, 100% { transform: scale(1); }
    50%      { transform: scale(1.06); }
  }
  @keyframes agentOrbGlow {
    0%, 100% { opacity: 0.35; transform: scale(0.92); }
    50%      { opacity: 0.7;  transform: scale(1.12); }
  }
  @keyframes agentLabelEnter {
    from { opacity: 0; transform: translateX(-8px); }
    to   { opacity: 1; transform: translateX(0); }
  }
  @media (prefers-reduced-motion: reduce) {
    [style*="agentOrb"] { animation: none !important; }
  }
`;

export default AgentThreadHeader;
