import { useState } from "react";
import {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  subWeeks,
  startOfMonth,
  endOfMonth,
  subMonths,
} from "date-fns";
import { CalendarDays, ChevronDown, Check } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const FONT = { fontFamily: "Manrope, sans-serif" } as const;

export interface AppliedDateRange {
  from: Date;
  to: Date;
}

/** The only three ranges the dashboard offers. */
export type DateRangePresetKey = "today" | "prevWeek" | "prevMonth";

interface Preset {
  key: DateRangePresetKey;
  label: string;
  getRange: () => AppliedDateRange;
}

/** Built fresh each open so "Today" always reflects the current date.
 *  Deliberately just three presets — a single day, the previous full calendar
 *  week, and the previous full calendar month — rather than a ladder of
 *  overlapping "last N days" ranges. */
export function buildDateRangePresets(): Preset[] {
  const today = new Date();
  return [
    {
      key: "today",
      label: "Today",
      getRange: () => ({ from: startOfDay(today), to: endOfDay(today) }),
    },
    {
      key: "prevWeek",
      label: "Previous week",
      getRange: () => {
        const lw = subWeeks(today, 1);
        return { from: startOfDay(startOfWeek(lw)), to: endOfDay(endOfWeek(lw)) };
      },
    },
    {
      key: "prevMonth",
      label: "Previous month",
      getRange: () => {
        const lm = subMonths(today, 1);
        return { from: startOfDay(startOfMonth(lm)), to: endOfDay(endOfMonth(lm)) };
      },
    },
  ];
}

interface DateRangeFilterProps {
  /** Currently applied preset, ticked in the dropdown. */
  value: DateRangePresetKey;
  /** Fired as soon as a value is picked — the dropdown closes and the page
   *  re-derives its data against the new range. */
  onApply: (range: AppliedDateRange, label: string, presetKey: DateRangePresetKey) => void;
}

/**
 * Top-right date filter: a trigger button opening a plain three-value dropdown.
 * No calendar — picking a value applies it immediately.
 */
export default function DateRangeFilter({ value, onApply }: DateRangeFilterProps) {
  const [open, setOpen] = useState(false);
  const presets = buildDateRangePresets();
  const label = presets.find((p) => p.key === value)?.label ?? presets[0].label;

  const handlePick = (preset: Preset) => {
    onApply(preset.getRange(), preset.label, preset.key);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex h-[38px] items-center gap-2 whitespace-nowrap rounded-[6px] border border-[#DDE2EE] bg-white px-4 text-[13px] font-semibold text-[#17173A] shadow-[0px_2px_6px_rgba(23,23,58,0.04)] transition-colors hover:bg-[#F7F9FC]"
          style={FONT}
        >
          <CalendarDays className="size-[14px] text-[#6F6F8D]" />
          {label}
          <ChevronDown className="size-[13px] text-[#9097AD]" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" sideOffset={8} className="w-[196px] rounded-[12px] p-[8px]" style={FONT}>
        <div className="flex flex-col gap-[2px]">
          {presets.map((preset) => (
            <button
              key={preset.key}
              type="button"
              onClick={() => handlePick(preset)}
              className={cn(
                "flex items-center justify-between gap-2 rounded-[6px] px-[12px] py-[8px] text-left text-[13px] transition-colors",
                preset.key === value
                  ? "bg-[#EAF0FF] font-semibold text-[#2F68E5]"
                  : "font-medium text-[#17173A] hover:bg-[#F7F9FC]"
              )}
            >
              {preset.label}
              {preset.key === value && <Check className="size-[14px] shrink-0" />}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
