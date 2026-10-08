import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface DropdownOption {
  value: string;
  label: string;
}

/**
 * The one text-field dropdown control for every campaign/journey surface —
 * originally built for the campaign audience step's operator/value pickers
 * (e.g. "in the last" / "not in the last" / "before"), now shared wherever
 * a dropdown appears in that flow or the journey builder, instead of each
 * screen rolling its own `<select>` with its own chevron alignment and
 * open-state styling.
 *
 * A trigger button (blue border + rotated chevron while open) plus an
 * options panel portaled to `document.body` and positioned by the
 * trigger's own bounding rect — not plain `position: absolute` — so it
 * isn't clipped by an ancestor's `overflow-hidden` (an accordion's
 * height-animation wrapper, a drawer's scroll body, …) the way a native
 * `<select>`'s browser-rendered popup never is either.
 */
export default function Dropdown({
  value,
  options,
  onChange,
  placeholder,
  widthClass = "w-[180px]",
  heightClass = "h-10",
  className,
  disabled,
  "aria-label": ariaLabel,
}: {
  value: string;
  /** Plain strings when a label doubles as its own value; `{value,label}`
   *  when they diverge (e.g. an id paired with display text). */
  options: (string | DropdownOption)[];
  onChange: (value: string) => void;
  /** Shown when `value` matches nothing in `options` (e.g. still unset). */
  placeholder?: string;
  widthClass?: string;
  /** Trigger button height — compact rows (e.g. an inline condition chip)
   *  pass "h-8" to match the text inputs sitting next to them. */
  heightClass?: string;
  className?: string;
  disabled?: boolean;
  "aria-label"?: string;
}) {
  const normalized: DropdownOption[] = options.map((o) => (typeof o === "string" ? { value: o, label: o } : o));
  const selected = normalized.find((o) => o.value === value);

  const [open, setOpen] = useState(false);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (!wrapRef.current?.contains(target) && !panelRef.current?.contains(target)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // Portaled to <body> and positioned by rect rather than plain absolute —
  // an accordion or drawer's own overflow-hidden/scroll body would
  // otherwise clip a long option list instead of letting it float free.
  useLayoutEffect(() => {
    if (!open) return;
    const update = () => wrapRef.current && setRect(wrapRef.current.getBoundingClientRect());
    update();
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [open]);

  return (
    <div ref={wrapRef} className={cn("relative shrink-0", widthClass, className)}>
      <button
        type="button"
        disabled={disabled}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex w-full items-center justify-between gap-2 rounded-md border bg-white px-3 font-manrope text-[13.5px] text-[#17173A] outline-none transition-colors disabled:cursor-not-allowed disabled:bg-[#F7F9FC] disabled:text-[#9494AE]",
          heightClass,
          open ? "border-[#2F68E5]" : "border-[#DDE2EE]",
          // `className` styles this trigger button (the visible bordered
          // box), not just the outer wrapper below — an error-state border
          // passed in here would otherwise silently do nothing, since the
          // wrapper has no border of its own to override.
          className,
        )}
      >
        <span className={cn("truncate text-left", !selected && "text-[#9494AE]")}>
          {selected?.label ?? placeholder ?? value}
        </span>
        <ChevronDown
          className={cn("size-3.5 shrink-0 text-[#8A8AA3] transition-transform", open && "rotate-180")}
          strokeWidth={2}
        />
      </button>
      {open &&
        rect &&
        createPortal(
          (() => {
            // Flip above the trigger when there isn't enough room below
            // (e.g. this dropdown sits near the bottom of a scrollable
            // drawer) — otherwise the option list runs off the bottom of
            // the viewport with everything past the fold unreachable,
            // rather than actually scrolling within its own max-height.
            const margin = 8;
            const preferredHeight = 280;
            const spaceBelow = window.innerHeight - rect.bottom - margin;
            const spaceAbove = rect.top - margin;
            const openUp = spaceBelow < 160 && spaceAbove > spaceBelow;
            const maxHeight = Math.max(120, Math.min(preferredHeight, openUp ? spaceAbove : spaceBelow));
            const positionStyle = openUp
              ? { bottom: window.innerHeight - rect.top + 4 }
              : { top: rect.bottom + 4 };
            return (
              <div
                ref={panelRef}
                role="listbox"
                style={{ position: "fixed", left: rect.left, minWidth: rect.width, maxHeight, ...positionStyle }}
                className="scroll-slim z-[200] w-max overflow-y-auto rounded-md border border-[#DDE2EE] bg-white py-1 shadow-[0_8px_24px_rgba(23,23,58,0.12)]"
              >
                {normalized.map((o) => (
                  <button
                    key={o.value}
                    type="button"
                    role="option"
                    aria-selected={o.value === value}
                    onClick={() => {
                      onChange(o.value);
                      setOpen(false);
                    }}
                    className={cn(
                      "block w-full whitespace-nowrap px-3 py-2 text-left font-manrope text-[13px] transition-colors",
                      o.value === value
                        ? "bg-[#F4F8FF] font-semibold text-[#2F68E5]"
                        : "text-[#17173A] hover:bg-[#F7F9FC]",
                    )}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            );
          })(),
          document.body,
        )}
    </div>
  );
}
