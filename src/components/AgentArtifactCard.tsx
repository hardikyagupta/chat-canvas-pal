import React from 'react';
import { cn } from '@/lib/utils';
import type { AgentArtifactCardData } from '@/data/conversations';

interface AgentArtifactCardProps {
  card: AgentArtifactCardData;
  onAction?: () => void;
}

const MANROPE = { fontFamily: 'Manrope, sans-serif' } as const;

/**
 * Compact doc-style card a specialist agent hands back at the end of a turn.
 * Matches the Figma "Segment agent card" (title header · stat rows · description
 * · review action); the Journey variant reuses the same shape with journey-level
 * stats. Kept intentionally small — it never fills the column.
 */
const AgentArtifactCard: React.FC<AgentArtifactCardProps> = ({ card, onAction }) => {
  return (
    <div className="w-full max-w-[380px] overflow-hidden rounded-[8px] border border-[var(--color-line-input)] bg-card">
      {/* Header — artifact title */}
      <div className="flex items-center border-b-[0.5px] border-[var(--color-line-input)] px-[12px] py-[12px]">
        <p
          className="min-w-0 flex-1 text-[14px] font-medium leading-[16px] tracking-[0.42px] text-[var(--color-ink)]"
          style={MANROPE}
        >
          {card.title}
        </p>
      </div>

      {/* Body — stat rows + description */}
      <div className="flex flex-col gap-[12px] px-[12px] py-[16px]">
        {card.stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="flex items-center gap-[6px]">
              <Icon className="size-[16px] shrink-0 text-[var(--color-ink)]" strokeWidth={1.75} />
              <span
                className="text-[12px] font-medium leading-[16px] tracking-[0.42px] text-[var(--color-ink)]"
                style={MANROPE}
              >
                {stat.label}
              </span>
            </div>
          );
        })}
        <p
          className="text-[12px] font-medium leading-[16px] tracking-[0.42px] text-[var(--color-grey)]"
          style={MANROPE}
        >
          {card.description}
        </p>
      </div>

      {/* Footer — review action */}
      <div className="flex items-center border-t-[0.5px] border-[var(--color-line-input)] p-[16px]">
        <button
          type="button"
          onClick={onAction}
          className={cn(
            'flex flex-1 items-center justify-center rounded-[4px] border-[1.2px] border-[var(--color-line-input)] bg-card px-[12px] py-[8px] transition-colors hover:bg-[var(--color-surface-0)]'
          )}
        >
          <span
            className="text-[14px] font-medium uppercase leading-[20px] tracking-[0.42px] text-[var(--color-ink)]"
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
