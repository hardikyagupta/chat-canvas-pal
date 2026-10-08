import { useState } from "react";
import { ChevronDown, Info } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export interface FeedSelectOption {
  value: string;
  label: string;
  /** Greyed out and not selectable. */
  disabled?: boolean;
  /** Shows an info glyph after the label, with this text on hover. */
  hint?: string;
}

/**
 * Single-select dropdown used by the product-feed drawer. Same field skin as
 * the other form controls (bordered, 40px) with a list whose selected row
 * carries the blue accent bar; options can be disabled or carry a hint.
 */
export default function FeedSelect({
  value,
  onChange,
  options,
  placeholder = "Select",
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  options: FeedSelectOption[];
  placeholder?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex h-10 w-full items-center justify-between gap-2 rounded-[5px] border bg-white px-3 text-left font-manrope text-sm transition-colors",
            open ? "border-[#2F68E5] shadow-[0_0_0_3px_rgba(47,104,229,0.12)]" : "border-[#DDE2EE] hover:border-[#9898B0]",
            selected ? "text-[#17173A]" : "text-[#9494AE]",
            className
          )}
        >
          <span className="truncate">{selected?.label ?? placeholder}</span>
          <ChevronDown
            className={cn("h-4 w-4 shrink-0 text-[#6F6F8D] transition-transform", open && "rotate-180")}
            strokeWidth={2}
          />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={4}
        // The drawer is a modal dialog, which blocks wheel/touch scrolling on
        // anything portalled outside it — including this list. Stopping the
        // events here lets the list scroll on its own.
        onWheel={(e) => e.stopPropagation()}
        onTouchMove={(e) => e.stopPropagation()}
        className="max-h-[300px] w-[var(--radix-popover-trigger-width)] overflow-y-auto rounded-[5px] border-[#DDE2EE] p-1"
      >
        {options.map((o) => {
          const isSelected = o.value === value;
          return (
            <button
              key={o.value}
              type="button"
              disabled={o.disabled}
              onClick={() => {
                onChange(o.value);
                setOpen(false);
              }}
              className={cn(
                "relative flex h-10 w-full items-center gap-2 rounded-[3px] px-3 text-left font-manrope text-sm transition-colors",
                o.disabled
                  ? "cursor-not-allowed text-[#B7BBCB]"
                  : isSelected
                    ? "bg-[#F4F8FF] font-semibold text-[#17173A]"
                    : "text-[#17173A] hover:bg-[#F6F8FF]"
              )}
            >
              {isSelected && <span aria-hidden className="absolute left-0 top-0 h-full w-[3px] rounded-full bg-[#2F68E5]" />}
              <span className="truncate">{o.label}</span>
              {o.hint && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="grid shrink-0 place-items-center text-[#6F6F8D]">
                      <Info className="h-3.5 w-3.5" strokeWidth={1.8} />
                    </span>
                  </TooltipTrigger>
                  <TooltipContent
                    side="right"
                    className="z-[200] max-w-[220px] rounded-md border-0 bg-black px-3 py-2 font-manrope text-xs text-white"
                  >
                    {o.hint}
                  </TooltipContent>
                </Tooltip>
              )}
            </button>
          );
        })}
      </PopoverContent>
    </Popover>
  );
}
