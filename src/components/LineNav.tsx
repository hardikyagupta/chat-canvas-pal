import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

export interface LineNavItem {
  id: string;     // DOM id of the message anchor to scroll to
  label: string;  // short title shown on hover / when active
}

interface LineNavProps {
  items: LineNavItem[];
  // The scrollable chat container used to compute which item is currently in view.
  containerRef: React.RefObject<HTMLDivElement>;
}

/**
 * Vertical "line marker" navigation (à la chanhdai.com/components/line-nav).
 * Labels sit on the LEFT, the line markers on the RIGHT. Markers expand on
 * hover and for the active item; hovering the rail reveals every label so the
 * user can jump up/down between conversation turns.
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
      className="absolute right-[10px] top-1/2 z-20 flex -translate-y-1/2 flex-col items-end gap-[3px]"
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
            // group/navitem scopes hover to THIS row only — never the whole rail.
            className="group/navitem flex items-center justify-end gap-[10px] py-[4px]"
          >
            <span
              className={cn(
                'max-w-[180px] truncate text-right text-[13px] leading-[18px] transition-colors duration-150',
                active
                  ? 'font-medium text-[var(--color-ink)]'
                  : 'text-[var(--color-grey-soft)] group-hover/navitem:text-[var(--color-ink)]',
              )}
            >
              {it.label}
            </span>
            <span
              className={cn(
                'h-[2px] shrink-0 rounded-full transition-all duration-150',
                active
                  ? 'w-[28px] bg-[var(--color-ink)]'
                  : 'w-[16px] bg-[var(--color-line-strong)] group-hover/navitem:w-[24px] group-hover/navitem:bg-[var(--color-ink)]',
              )}
            />
          </button>
        );
      })}
    </nav>
  );
};

export default LineNav;
