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
  /**
   * True once the agent's answer has fully streamed: the waves stop flowing
   * (the agent is no longer "working") and the divider rests as a static
   * marker in the thread history.
   */
  settled?: boolean;
}

// One period of a smooth sine wave, used as a repeating CSS mask so the line
// tiles crisply at any width (stretching an SVG path would distort the wave).
const WAVE =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='8' viewBox='0 0 24 8'%3E%3Cpath d='M0 4 Q6 0 12 4 T24 4' fill='none' stroke='black' stroke-width='1.25'/%3E%3C/svg%3E";

// Each hairline is two nested layers: the OUTER div clips and fades the line
// out toward the far edge; the INNER strip carries the repeating wave mask and
// the colour, and is one wave-period wider than its box so translating it by
// exactly 24px loops seamlessly — the waves flow toward the label.
const outerStyle = (dir: 'left' | 'right'): React.CSSProperties => {
  const fade =
    dir === 'left'
      ? 'linear-gradient(to right, transparent, #000 55%)'
      : 'linear-gradient(to left, transparent, #000 55%)';
  return {
    WebkitMaskImage: fade,
    maskImage: fade,
    WebkitMaskRepeat: 'no-repeat',
    maskRepeat: 'no-repeat',
    WebkitMaskSize: '100% 100%',
    maskSize: '100% 100%',
  };
};

const innerStyle = (dir: 'left' | 'right', color: string, flowing: boolean): React.CSSProperties => ({
  width: 'calc(100% + 24px)',
  height: '100%',
  backgroundColor: color,
  WebkitMaskImage: `url("${WAVE}")`,
  maskImage: `url("${WAVE}")`,
  WebkitMaskRepeat: 'repeat-x',
  maskRepeat: 'repeat-x',
  WebkitMaskSize: '24px 8px',
  maskSize: '24px 8px',
  WebkitMaskPosition: 'left center',
  maskPosition: 'left center',
  // While the agent works, the left line flows rightward (toward the label)
  // and the right line leftward; once settled the waves hold still.
  animation: flowing
    ? `${dir === 'left' ? 'agentWaveFlowRight' : 'agentWaveFlowLeft'} 2.2s linear infinite`
    : 'none',
});

const WAVE_KEYFRAMES = `
  @keyframes agentWaveFlowRight {
    from { transform: translateX(-24px); }
    to   { transform: translateX(0); }
  }
  @keyframes agentWaveFlowLeft {
    from { transform: translateX(0); }
    to   { transform: translateX(-24px); }
  }
  @media (prefers-reduced-motion: reduce) {
    [style*="agentWaveFlow"] { animation: none !important; }
  }
`;

/**
 * Centered "Switched to <agent>" divider shown between conversation turns when
 * the co-marketer hands off to a specialist agent. Wavy hairlines flow toward
 * the label on either side (no background, just the stroke) — echoing the way
 * Claude marks a hand-off — so the reader understands the next reply comes
 * from that agent. The lines flow toward the label while the agent works and
 * hold still once its answer has settled.
 */
const AgentSwitchDivider: React.FC<AgentSwitchDividerProps> = ({
  agentLabel,
  callingDuration = 1500,
  settled = false,
}) => {
  // Two beats: first a shimmering "Calling in agents…" (echoing the Thinking…
  // shimmer), then a soft cross-fade into the settled "Switched to <agent>".
  // A divider that mounts already settled skips the calling beat entirely.
  const [phase, setPhase] = useState<'calling' | 'switched'>(
    settled || callingDuration <= 0 ? 'switched' : 'calling'
  );

  useEffect(() => {
    if (settled || callingDuration <= 0) {
      setPhase('switched');
      return;
    }
    const t = setTimeout(() => setPhase('switched'), callingDuration);
    return () => clearTimeout(t);
  }, [callingDuration, settled]);

  // Hairlines and the agent name keep the original theme greys — the agent's
  // colour identity lives in the orb and thinking indicator, not the divider.
  const lineColor = 'var(--color-grey)';

  return (
    <div className="flex w-full items-center gap-[16px] py-[16px] animate-in fade-in duration-500">
      <style dangerouslySetInnerHTML={{ __html: WAVE_KEYFRAMES }} />

      {/* Left wavy hairline */}
      <div className="h-[8px] min-w-0 flex-1 overflow-hidden" style={outerStyle('left')} aria-hidden="true">
        <div style={innerStyle('left', lineColor, !settled)} />
      </div>

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
      <div className="h-[8px] min-w-0 flex-1 overflow-hidden" style={outerStyle('right')} aria-hidden="true">
        <div style={innerStyle('right', lineColor, !settled)} />
      </div>
    </div>
  );
};

export default AgentSwitchDivider;
