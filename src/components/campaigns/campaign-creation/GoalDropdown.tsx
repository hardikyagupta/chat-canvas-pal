import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * The campaign-goal picker.
 *
 * Deliberately NOT the shadcn <Select/>: that portals its panel to
 * document.body at z-50, and the campaign creation overlay it lives inside sits
 * at z-[60] — so the list rendered behind the overlay and never appeared. This
 * one is an absolutely-positioned popover inside the field's own stacking
 * context, which can't lose that fight.
 *
 * Options are two lines (label + hint), so the trigger renders the label on its
 * own rather than echoing the whole option.
 */

export interface GoalOption {
  value: string;
  label: string;
  hint: string;
}

export default function GoalDropdown({
  options,
  value,
  placeholder,
  onChange,
}: {
  options: readonly GoalOption[];
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  // Keyboard cursor — starts on the current selection so ↑/↓ picks up where the
  // user left off rather than at the top of the list.
  const [cursor, setCursor] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);

  const selected = options.find((o) => o.value === value);

  // Click-outside and Esc close it. Bound on the document because the trigger
  // itself is inside a scrolling column.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      // Don't let Esc bubble to the overlay and close the whole wizard — the
      // user is dismissing the list, not the campaign.
      e.stopPropagation();
      setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey, true);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey, true);
    };
  }, [open]);

  const openList = () => {
    setCursor(Math.max(0, options.findIndex((o) => o.value === value)));
    setOpen(true);
  };

  const pick = (goal: string) => {
    onChange(goal);
    setOpen(false);
  };

  const onTriggerKeyDown = (e: React.KeyboardEvent) => {
    if (!open) {
      if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openList();
      }
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setCursor((i) => Math.min(i + 1, options.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setCursor((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      pick(options[cursor].value);
    }
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => (open ? setOpen(false) : openList())}
        onKeyDown={onTriggerKeyDown}
        className={cn(
          "flex h-10 w-full items-center justify-between gap-2 rounded-md border px-3 text-left font-manrope text-sm transition-colors",
          open ? "border-[#2F68E5] bg-white" : "border-[#DDE2EE] bg-[#F7F9FC] hover:border-[#B9C9F5]"
        )}
      >
        <span className={cn("truncate", selected ? "text-[#17173A]" : "text-[#A0A0A0]")}>
          {selected?.label ?? placeholder}
        </span>
        <ChevronDown
          className={cn(
            "size-4 shrink-0 text-[#6F6F8D] transition-transform duration-200",
            open && "rotate-180"
          )}
          strokeWidth={2}
        />
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute left-0 right-0 top-[calc(100%+4px)] z-[70] max-h-[300px] overflow-y-auto rounded-md border border-[#DDE2EE] bg-white p-1 shadow-[0px_8px_24px_0px_rgba(23,23,58,0.14)] animate-in fade-in slide-in-from-top-1 duration-150 motion-reduce:animate-none scroll-slim"
        >
          {options.map((option, i) => {
            const isSelected = option.value === value;
            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={isSelected}
                onMouseEnter={() => setCursor(i)}
                onClick={() => pick(option.value)}
                className={cn(
                  "flex w-full items-start gap-2 rounded px-2.5 py-2 text-left transition-colors",
                  i === cursor ? "bg-[#F0F5FF]" : "bg-transparent"
                )}
              >
                <span className="min-w-0 flex-1">
                  <span className="block font-manrope text-sm font-semibold leading-5 text-[#17173A]">
                    {option.label}
                  </span>
                  <span className="mt-0.5 block font-manrope text-xs leading-4 text-[#6F6F8D]">
                    {option.hint}
                  </span>
                </span>
                {isSelected && (
                  <Check className="mt-1 size-4 shrink-0 text-[#2F68E5]" strokeWidth={2.5} />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
