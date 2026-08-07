import React from 'react';
import type { AgentArtifactCardData } from '@/data/conversations';

interface AgentArtifactCardProps {
  card: AgentArtifactCardData;
  onAction?: () => void;
}

const MANROPE = { fontFamily: 'Manrope, sans-serif' } as const;

/**
 * Compact doc-style card a specialist agent hands back at the end of a turn.
 * Matches the Figma "Segment agent-Artifacts" node (title header · stat row ·
 * description · review action). The action sits directly under the description
 * with no divider, and the button hugs its label rather than filling the width.
 */
const AgentArtifactCard: React.FC<AgentArtifactCardProps> = ({ card, onAction }) => {
  return (
    <div className="w-full max-w-[392px] overflow-hidden rounded-[8px] border border-[var(--color-line-input)] bg-card">
      {/* Header — artifact title */}
      <div className="flex items-center border-b-[0.5px] border-[var(--color-line-input)] px-[16px] py-[12px]">
        <p
          className="min-w-0 flex-1 text-[16px] font-bold leading-[22px] tracking-[0.42px] text-[var(--color-ink)]"
          style={MANROPE}
        >
          {card.title}
        </p>
      </div>

      {/* Body — stat row(s) + description */}
      <div className="flex flex-col gap-[8px] px-[16px] py-[12px]">
        {card.stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="flex items-center gap-[6px]">
              <Icon className="size-[16px] shrink-0 text-[var(--color-ink)]" strokeWidth={1.75} />
              <span
                className="text-[12px] font-bold leading-[16px] tracking-[0.42px] text-[var(--color-ink)]"
                style={MANROPE}
              >
                {stat.label}
              </span>
            </div>
          );
        })}
        <p
          className="text-[14px] font-normal leading-[20px] tracking-[0.42px] text-[var(--color-grey)]"
          style={MANROPE}
        >
          {card.description}
        </p>
      </div>

      {/* Footer — review action. No divider; the button hugs its label. */}
      <div className="flex items-center px-[16px] py-[12px]">
        <button
          type="button"
          onClick={onAction}
          className="flex items-center justify-center gap-[6px] rounded-[4px] border border-[var(--color-line-input)] bg-card px-[24px] py-[8px] transition-colors hover:bg-[var(--color-surface-0)]"
        >
          <span
            className="text-[14px] font-semibold uppercase leading-[20px] tracking-[0.42px] text-[var(--color-ink)]"
            style={MANROPE}
          >
            {card.actionLabel}
          </span>
        </button>
      </div>
    </div>
  );
};

export default AgentArtifactCard;
