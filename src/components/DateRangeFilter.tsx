import { useState } from "react";
import {
  format,
  isSameDay,
  startOfDay,
  endOfDay,
  subDays,
  startOfMonth,
  endOfMonth,
  subMonths,
} from "date-fns";
import { CalendarDays, ChevronDown } from "lucide-react";
import type { DateRange } from "react-day-picker";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

const FONT = { fontFamily: "Manrope, sans-serif" } as const;

export interface AppliedDateRange {
  from: Date;
  to: Date;
}

interface QuickAction {
  key: string;
  label: string;
  getRange: () => AppliedDateRange;
}

/** Built fresh each render so "Today" always reflects the current date. */
function buildQuickActions(): QuickAction[] {
  const today = new Date();
  return [
    { key: "today", label: "Today", getRange: () => ({ from: startOfDay(today), to: endOfDay(today) }) },
    {
      key: "yesterday",
      label: "Yesterday",
      getRange: () => {
        const y = subDays(today, 1);
        return { from: startOfDay(y), to: endOfDay(y) };
      },
    },
    {
      key: "7d",
      label: "Last 7 days",
      getRange: () => ({ from: startOfDay(subDays(today, 6)), to: endOfDay(today) }),
    },
    {
      key: "30d",
      label: "Last 30 days",
      getRange: () => ({ from: startOfDay(subDays(today, 29)), to: endOfDay(today) }),
    },
    {
      key: "thisMonth",
      label: "This month",
      getRange: () => ({ from: startOfDay(startOfMonth(today)), to: endOfDay(today) }),
    },
    {
      key: "lastMonth",
      label: "Last month",
      getRange: () => {
        const lm = subMonths(today, 1);
        return { from: startOfDay(startOfMonth(lm)), to: endOfDay(endOfMonth(lm)) };
      },
    },
  ];
}

function formatRangeLabel(range: AppliedDateRange) {
  if (isSameDay(range.from, range.to)) return format(range.from, "MMM d, yyyy");
  return `${format(range.from, "MMM d")} – ${format(range.to, "MMM d, yyyy")}`;
}

interface DateRangeFilterProps {
  /** Currently applied range (reflected on the calendar when reopened). */
  value: AppliedDateRange;
  /** Currently applied label, shown on the trigger button. */
  label: string;
  /** Fired only when the user clicks Apply — not on every pick. */
  onApply: (range: AppliedDateRange, label: string) => void;
}

/**
 * Top-right date filter: a trigger button that opens a popover with quick-pick
 * actions on the left and a two-month range calendar on the right. Picks are
 * staged locally until "Apply" — Cancel (or dismiss) discards them.
 */
export default function DateRangeFilter({ value, label, onApply }: DateRangeFilterProps) {
  const [open, setOpen] = useState(false);
  const [pendingRange, setPendingRange] = useState<AppliedDateRange>(value);
  const [pendingPresetKey, setPendingPresetKey] = useState<string | null>(null);
  const quickActions = buildQuickActions();

  const handleOpenChange = (next: boolean) => {
    if (next) {
      setPendingRange(value);
      setPendingPresetKey(null);
    }
    setOpen(next);
  };

  const handleQuickAction = (action: QuickAction) => {
    setPendingRange(action.getRange());
    setPendingPresetKey(action.key);
  };

  const handleCalendarSelect = (range: DateRange | undefined) => {
    if (!range?.from) return;
    setPendingPresetKey(null);
    setPendingRange({ from: range.from, to: range.to ?? range.from });
  };

  const handleApply = () => {
    const presetLabel = quickActions.find((a) => a.key === pendingPresetKey)?.label;
    onApply(pendingRange, presetLabel ?? formatRangeLabel(pendingRange));
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-2 rounded-[8px] border border-[#DDE2EE] bg-white px-3 py-1.5 text-[12px] font-semibold text-[#17173A] shadow-[0px_2px_6px_rgba(23,23,58,0.04)] transition-colors hover:bg-[#F7F9FC]"
          style={FONT}
        >
          <CalendarDays className="size-[14px] text-[#6F6F8D]" />
          {label}
          <ChevronDown className="size-[13px] text-[#9097AD]" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" sideOffset={8} className="w-auto rounded-[12px] p-0" style={FONT}>
        <div className="flex">
          {/* LHS — quick actions */}
          <div className="flex w-[168px] shrink-0 flex-col gap-[2px] border-r border-[#EDEFF4] p-[8px]">
            {quickActions.map((action) => (
              <button
                key={action.key}
                type="button"
                onClick={() => handleQuickAction(action)}
                className={cn(
                  "rounded-[6px] px-[12px] py-[8px] text-left text-[13px] transition-colors",
                  pendingPresetKey === action.key
                    ? "bg-[#EAF0FF] font-semibold text-[#2F68E5]"
                    : "font-medium text-[#17173A] hover:bg-[#F7F9FC]"
                )}
              >
                {action.label}
              </button>
            ))}
          </div>

          {/* RHS — two-month calendar + footer */}
          <div className="flex flex-col">
            <Calendar
              mode="range"
              numberOfMonths={2}
              defaultMonth={pendingRange.from}
              selected={{ from: pendingRange.from, to: pendingRange.to }}
              onSelect={handleCalendarSelect}
            />
            <div className="flex items-center justify-between gap-[12px] border-t border-[#EDEFF4] px-[16px] py-[12px]">
              <span className="text-[12px] text-[#6F6F8D]">{formatRangeLabel(pendingRange)}</span>
              <div className="flex items-center gap-[8px]">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-[6px] border border-[#DDE2EE] bg-white px-[14px] py-[7px] text-[12px] font-semibold text-[#17173A] transition-colors hover:bg-[#F7F9FC]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleApply}
                  className="rounded-[6px] bg-[#2F68E5] px-[14px] py-[7px] text-[12px] font-semibold text-white transition-colors hover:bg-[#255ad2]"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
