import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

export interface LineNavItem {
  id: string;       // DOM id of the message anchor to scroll to
  label: string;    // short title (kept for a11y / tooltip title)
  userText?: string; // full user prompt for this turn (shown in the hover popover)
  aiText?: string;   // the AI reply for this turn (clamped to two lines in the popover)
}

interface LineNavProps {
  items: LineNavItem[];
  // The scrollable chat container used to compute which item is currently in view.
  containerRef: React.RefObject<HTMLDivElement>;
}

/**
 * Vertical "line marker" navigation (à la chanhdai.com/components/line-nav).
 * At rest it is JUST a stack of tight line markers — no text. Hovering a line
 * widens it and pops a compact preview to the left: the user prompt on one
 * line, and the AI reply clamped to two lines. Click to jump to that turn.
 */
const LineNav: React.FC<LineNavProps> = ({ items, containerRef }) => {
  const [activeId, setActiveId] = useState<string | null>(items[0]?.id ?? null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || items.length === 0) return;

    // Active = the last turn whose anchor has scrolled past ~30% from the top.
    const computeActive = () => {
      const cRect = container.getBoundingClientRect();
      const threshold = cRect.top + container.clientHeight * 0.3;
      let current = items[0]?.id ?? null;
      for (const it of items) {
        const el = document.getElementById(it.id);
        if (!el) continue;
        if (el.getBoundingClientRect().top <= threshold) current = it.id;
      }
      setActiveId(current);
    };

    computeActive();
    container.addEventListener('scroll', computeActive, { passive: true });
    window.addEventListener('resize', computeActive);
    return () => {
      container.removeEventListener('scroll', computeActive);
      window.removeEventListener('resize', computeActive);
    };
  }, [items, containerRef]);

  const handleClick = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setActiveId(id);
  };

  if (items.length === 0) return null;

  return (
    <nav
      aria-label="Conversation navigation"
      className="absolute right-[10px] top-1/2 z-20 flex -translate-y-1/2 flex-col items-end gap-[2px]"
      style={{ fontFamily: 'Manrope, sans-serif' }}
    >
      {items.map((it) => {
        const active = it.id === activeId;
        return (
          <button
            key={it.id}
            type="button"
            onClick={() => handleClick(it.id)}
            aria-current={active ? 'true' : undefined}
            title={it.label}
            // group/navitem scopes hover to THIS row only — never the whole rail.
            className="group/navitem relative flex items-center justify-end py-[3px]"
          >
            {/* Line marker — the only thing visible at rest. */}
            <span
              className={cn(
                'h-[2px] shrink-0 rounded-full transition-all duration-150',
                active
                  ? 'w-[28px] bg-[var(--color-ink)]'
                  : 'w-[16px] bg-[var(--color-line-strong)] group-hover/navitem:w-[30px] group-hover/navitem:bg-[var(--color-ink)]',
              )}
            />

            {/* Hover preview — user prompt (1 line) + AI reply (clamped to 2). */}
            <span
              role="tooltip"
              className={cn(
                'pointer-events-none absolute right-[calc(100%+12px)] top-1/2 w-[240px] -translate-y-1/2 rounded-[10px] border border-[var(--color-line)] bg-white px-[12px] py-[10px] text-left opacity-0 shadow-lg transition-opacity duration-150',
                'group-hover/navitem:opacity-100',
              )}
            >
              {it.userText && (
                <span className="block truncate text-[12px] font-medium leading-[16px] text-[var(--color-ink)]">
                  {it.userText}
                </span>
              )}
              {it.aiText && (
                <span
                  className="mt-[4px] block text-left text-[12px] leading-[16px] text-[var(--color-grey-soft)]"
                  style={{
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {it.aiText} …
                </span>
              )}
            </span>
          </button>
        );
      })}
    </nav>
  );
};

export default LineNav;
