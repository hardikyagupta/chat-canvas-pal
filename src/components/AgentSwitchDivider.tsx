import React, { useEffect, useState } from 'react';

interface AgentSwitchDividerProps {
  /** Display name of the agent taking over, e.g. "Segment agent". */
  agentLabel: string;
  /** Unused now (kept for call-site compatibility). */
  avatarSrc?: string;
  icon?: React.ElementType;
  colorClass?: string;
  /**
   * How long (ms) to dwell on the shimmering "Calling in agents…" beat before
   * settling into "Switched to <agent>". Set 0 to skip the beat entirely.
   */
  callingDuration?: number;
}

// One period of a smooth sine wave, used as a repeating CSS mask so the line
// tiles crisply at any width (stretching an SVG path would distort the wave).
const WAVE =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='8' viewBox='0 0 24 8'%3E%3Cpath d='M0 4 Q6 0 12 4 T24 4' fill='none' stroke='black' stroke-width='1.25'/%3E%3C/svg%3E";

// The wave shape masks a solid strip whose colour is a theme token, so it reads
// correctly in light and dark. Fades out toward the far edge via a gradient
// alpha mask composited with the wave.
const waveStyle = (dir: 'left' | 'right'): React.CSSProperties => {
  const fade =
    dir === 'left'
      ? 'linear-gradient(to right, transparent, #000 55%)'
      : 'linear-gradient(to left, transparent, #000 55%)';
  return {
    backgroundColor: 'var(--color-grey)',
    WebkitMaskImage: `url("${WAVE}"), ${fade}`,
    maskImage: `url("${WAVE}"), ${fade}`,
    WebkitMaskRepeat: 'repeat-x, no-repeat',
    maskRepeat: 'repeat-x, no-repeat',
    WebkitMaskSize: '24px 8px, 100% 100%',
    maskSize: '24px 8px, 100% 100%',
    WebkitMaskPosition: 'center, center',
    maskPosition: 'center, center',
    // Show only where BOTH the wave and the fade are opaque.
    WebkitMaskComposite: 'source-in',
    maskComposite: 'intersect',
  };
};

/**
 * Centered "Switched to <agent>" divider shown between conversation turns when
 * the co-marketer hands off to a specialist agent. Wavy hairlines run out to the
 * edges on either side of the label (no background, just the stroke) — echoing
 * the way Claude marks a hand-off — so the reader understands the next reply
 * comes from that agent.
 */
const AgentSwitchDivider: React.FC<AgentSwitchDividerProps> = ({
  agentLabel,
  callingDuration = 1500,
}) => {
  // Two beats: first a shimmering "Calling in agents…" (echoing the Thinking…
  // shimmer), then a soft cross-fade into the settled "Switched to <agent>".
  const [phase, setPhase] = useState<'calling' | 'switched'>(
    callingDuration > 0 ? 'calling' : 'switched'
  );

  useEffect(() => {
    if (callingDuration <= 0) return;
    const t = setTimeout(() => setPhase('switched'), callingDuration);
    return () => clearTimeout(t);
  }, [callingDuration]);

  return (
    <div className="flex w-full items-center gap-[16px] py-[16px] animate-in fade-in duration-500">
      {/* Left wavy hairline */}
      <div className="h-[8px] min-w-0 flex-1" style={waveStyle('left')} aria-hidden="true" />

      {/* Label — cross-fades from the shimmering "calling" beat to the settled
          "switched" line. Sized to the wider of the two so the hairlines don't jump. */}
      <span
        className="relative inline-grid shrink-0 place-items-center"
        style={{ fontFamily: 'Manrope, sans-serif' }}
      >
        <span
          key={phase}
          className={
            phase === 'calling'
              ? 'col-start-1 row-start-1 whitespace-nowrap text-[13px] leading-[16px] font-medium thinking-shimmer-gradient animate-in fade-in duration-300'
              : 'col-start-1 row-start-1 whitespace-nowrap text-[13px] leading-[16px] font-medium text-[var(--color-grey)] animate-in fade-in duration-300'
          }
        >
          {phase === 'calling' ? (
            'Calling in agents…'
          ) : (
            <>
              Switched to <span className="text-[var(--color-slate)]">{agentLabel}</span>
            </>
          )}
        </span>
      </span>

      {/* Right wavy hairline */}
      <div className="h-[8px] min-w-0 flex-1" style={waveStyle('right')} aria-hidden="true" />
    </div>
  );
};

export default AgentSwitchDivider;
