import React, { useId } from 'react';
import { cn } from '@/lib/utils';

interface AgentSwitchDividerProps {
  /** Display name of the agent taking over, e.g. "Segment agent". */
  agentLabel: string;
  /** SVG avatar for the agent (preferred). */
  avatarSrc?: string;
  /** Lucide icon fallback when there's no SVG avatar. */
  icon?: React.ElementType;
  /** Agent colour class, e.g. "bg-green-100 text-green-800" — tints the avatar chip. */
  colorClass?: string;
}

/**
 * Centered "Switched to <agent>" divider shown between conversation turns when
 * the co-marketer hands off to a specialist agent. Two mirrored curved hairlines
 * sweep in from the edges toward a centered agent chip — echoing the way Claude
 * marks a hand-off — so the reader understands the next reply comes from that
 * agent. The curves stretch to fill the row and fade out at the far edges.
 */
const AgentSwitchDivider: React.FC<AgentSwitchDividerProps> = ({
  agentLabel,
  avatarSrc,
  icon: Icon,
  colorClass,
}) => {
  const bgClass = colorClass?.split(' ').find((c) => c.startsWith('bg-')) ?? 'bg-surface-2';
  const fgClass = colorClass?.split(' ').find((c) => c.startsWith('text-')) ?? 'text-slate';

  // Unique gradient ids so multiple dividers on the page don't collide.
  const uid = useId().replace(/:/g, '');
  const leftGrad = `agent-switch-left-${uid}`;
  const rightGrad = `agent-switch-right-${uid}`;

  return (
    <div className="flex w-full items-center py-[16px] animate-in fade-in slide-in-from-bottom-1 duration-500">
      {/* Left curved connector — sweeps down from the edge into the chip. */}
      <svg
        className="h-[24px] min-w-0 flex-1 text-[var(--color-line-strong)]"
        viewBox="0 0 120 24"
        fill="none"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={leftGrad} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="currentColor" stopOpacity="0" />
            <stop offset="0.55" stopColor="currentColor" stopOpacity="0.7" />
            <stop offset="1" stopColor="currentColor" stopOpacity="1" />
          </linearGradient>
        </defs>
        <path
          d="M0 6 C 78 6, 44 12, 120 12"
          stroke={`url(#${leftGrad})`}
          strokeWidth="1"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>

      {/* Agent chip */}
      <div className="mx-[10px] flex shrink-0 items-center gap-[8px] rounded-full border border-[var(--color-line)] bg-card px-[10px] py-[5px] shadow-[0px_1px_2px_0px_oklch(0.21_0.034_263.436_/_0.06)]">
        <span
          className={cn(
            'flex size-[20px] shrink-0 items-center justify-center overflow-hidden rounded-full',
            avatarSrc ? 'bg-card' : bgClass
          )}
        >
          {avatarSrc ? (
            <img src={avatarSrc} alt="" className="size-full object-cover" />
          ) : Icon ? (
            <Icon className={cn('size-[12px]', fgClass)} />
          ) : null}
        </span>
        <span
          className="whitespace-nowrap text-[12px] leading-[16px] text-[var(--color-grey)]"
          style={{ fontFamily: 'Manrope, sans-serif' }}
        >
          Switched to{' '}
          <span className="font-semibold text-[var(--color-ink)]">{agentLabel}</span>
        </span>
      </div>

      {/* Right curved connector — mirrors the left. */}
      <svg
        className="h-[24px] min-w-0 flex-1 text-[var(--color-line-strong)]"
        viewBox="0 0 120 24"
        fill="none"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={rightGrad} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="currentColor" stopOpacity="1" />
            <stop offset="0.45" stopColor="currentColor" stopOpacity="0.7" />
            <stop offset="1" stopColor="currentColor" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path
          d="M0 12 C 76 12, 42 6, 120 6"
          stroke={`url(#${rightGrad})`}
          strokeWidth="1"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    </div>
  );
};

export default AgentSwitchDivider;
