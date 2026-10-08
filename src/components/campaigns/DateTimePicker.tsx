import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Calendar as CalendarIcon, Check, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import Dropdown from "./Dropdown";

const WEEKDAY_LABELS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
const MONTH_LABELS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];
const YEAR_RANGE = Array.from({ length: 12 }, (_, i) => new Date().getFullYear() - 2 + i);
const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0"));

function pad(n: number) {
  return String(n).padStart(2, "0");
}
function toDateStr(y: number, m: number, d: number) {
  return `${y}-${pad(m + 1)}-${pad(d)}`;
}
function parseDate(s: string): { y: number; m: number; d: number } | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!match) return null;
  return { y: Number(match[1]), m: Number(match[2]) - 1, d: Number(match[3]) };
}
function daysInMonth(y: number, m: number) {
  return new Date(y, m + 1, 0).getDate();
}
/** Monday-first weekday index (0 = Monday … 6 = Sunday) for the 1st of the month. */
function firstWeekdayIndex(y: number, m: number) {
  return (new Date(y, m, 1).getDay() + 6) % 7;
}
function formatDisplay(date: string, time: string, showTime: boolean): string {
  const parsed = parseDate(date);
  if (!parsed) return "";
  const label = new Date(parsed.y, parsed.m, parsed.d).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  return showTime && time ? `${label} · ${time}` : label;
}

/**
 * The one calendar/date-picking control for the whole journey builder —
 * a month grid (Monday-first, matching this app's other week-day rows) with
 * dropdown month/year navigation, an optional hour/minute time row, and an
 * explicit "Apply" to commit — nothing changes until Apply is pressed, so
 * browsing to a different month to check something never silently discards
 * what was already picked. Built on the shared Dropdown for the month/year/
 * hour/minute pickers, and on the same portal-positioned-by-rect pattern
 * Dropdown uses, so it never gets clipped by a drawer's scroll body and
 * flips above its trigger when there isn't room below.
 */
export default function DateTimePicker({
  date,
  time,
  onChange,
  showTime = true,
  placeholder = "dd/mm/yyyy",
  widthClass = "w-full",
  disabled,
  "aria-label": ariaLabel,
}: {
  /** ISO date, e.g. "2026-10-08". Empty string means unset. */
  date: string;
  /** "HH:MM", ignored (and hidden) when `showTime` is false. */
  time: string;
  onChange: (date: string, time: string) => void;
  /** Hide the hour/minute row entirely for a date-only field. */
  showTime?: boolean;
  placeholder?: string;
  widthClass?: string;
  disabled?: boolean;
  "aria-label"?: string;
}) {
  const [open, setOpen] = useState(false);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const today = new Date();
  const parsedInitial = parseDate(date) ?? { y: today.getFullYear(), m: today.getMonth(), d: today.getDate() };

  // Nothing commits until "Apply" — these are the in-progress picks, reset
  // from the real value every time the panel opens.
  const [viewYear, setViewYear] = useState(parsedInitial.y);
  const [viewMonth, setViewMonth] = useState(parsedInitial.m);
  const [pendingDay, setPendingDay] = useState<number | null>(parseDate(date) ? parsedInitial.d : null);
  const [pendingHour, setPendingHour] = useState(time.split(":")[0] || "09");
  const [pendingMinute, setPendingMinute] = useState(time.split(":")[1] || "00");

  const openPicker = () => {
    const p = parseDate(date);
    const base = p ?? { y: today.getFullYear(), m: today.getMonth(), d: today.getDate() };
    setViewYear(base.y);
    setViewMonth(base.m);
    setPendingDay(p ? base.d : null);
    setPendingHour(time.split(":")[0] || "09");
    setPendingMinute(time.split(":")[1] || "00");
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (!wrapRef.current?.contains(target) && !panelRef.current?.contains(target)) setOpen(false);
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

  const goMonth = (delta: number) => {
    let m = viewMonth + delta;
    let y = viewYear;
    if (m < 0) {
      m = 11;
      y -= 1;
    } else if (m > 11) {
      m = 0;
      y += 1;
    }
    setViewMonth(m);
    setViewYear(y);
  };

  const handleApply = () => {
    if (pendingDay === null) return;
    onChange(toDateStr(viewYear, viewMonth, pendingDay), showTime ? `${pendingHour}:${pendingMinute}` : time);
    setOpen(false);
  };

  const leading = firstWeekdayIndex(viewYear, viewMonth);
  const total = daysInMonth(viewYear, viewMonth);
  const cells: (number | null)[] = [...Array(leading).fill(null), ...Array.from({ length: total }, (_, i) => i + 1)];

  const isToday = (d: number) => viewYear === today.getFullYear() && viewMonth === today.getMonth() && d === today.getDate();
  const isSelected = (d: number) => pendingDay === d;

  return (
    <div ref={wrapRef} className={cn("relative shrink-0", widthClass)}>
      <button
        type="button"
        disabled={disabled}
        aria-label={ariaLabel}
        onClick={openPicker}
        className={cn(
          "flex h-10 w-full items-center gap-2 rounded-md border bg-white px-3 font-manrope text-[13.5px] text-[#17173A] outline-none transition-colors disabled:cursor-not-allowed disabled:bg-[#F7F9FC] disabled:text-[#9494AE]",
          open ? "border-[#2F68E5]" : "border-[#DDE2EE]",
        )}
      >
        <CalendarIcon className="h-3.5 w-3.5 shrink-0 text-[#8A8AA3]" strokeWidth={2} />
        <span className={cn("truncate text-left", !date && "text-[#9494AE]")}>
          {date ? formatDisplay(date, time, showTime) : placeholder}
        </span>
      </button>

      {open &&
        rect &&
        createPortal(
          (() => {
            const margin = 8;
            const preferredHeight = 460;
            const spaceBelow = window.innerHeight - rect.bottom - margin;
            const spaceAbove = rect.top - margin;
            const openUp = spaceBelow < 420 && spaceAbove > spaceBelow;
            const positionStyle = openUp ? { bottom: window.innerHeight - rect.top + 4 } : { top: rect.bottom + 4 };
            const maxHeight = Math.min(preferredHeight, openUp ? spaceAbove : spaceBelow);

            return (
              <div
                ref={panelRef}
                style={{ position: "fixed", left: rect.left, maxHeight, ...positionStyle }}
                className="z-[200] flex w-[300px] flex-col overflow-hidden rounded-xl border border-[#DDE2EE] bg-white shadow-[0_16px_40px_rgba(23,23,58,0.18)]"
              >
                <div className="scroll-slim min-h-0 overflow-y-auto p-4">
                  {/* Month navigation */}
                  <div className="flex items-center justify-between gap-2">
                    <button
                      type="button"
                      aria-label="Previous month"
                      onClick={() => goMonth(-1)}
                      className="grid h-7 w-7 place-items-center rounded-md text-[#6F6F8D] transition-colors hover:bg-[#F3F6FF] hover:text-[#17173A]"
                    >
                      <ChevronLeft className="h-4 w-4" strokeWidth={2.2} />
                    </button>
                    <div className="flex items-center gap-1.5">
                      <Dropdown
                        value={String(viewMonth)}
                        options={MONTH_LABELS.map((label, i) => ({ value: String(i), label }))}
                        onChange={(v) => setViewMonth(Number(v))}
                        widthClass="w-[84px]"
                        heightClass="h-8"
                      />
                      <Dropdown
                        value={String(viewYear)}
                        options={YEAR_RANGE.map((y) => String(y))}
                        onChange={(v) => setViewYear(Number(v))}
                        widthClass="w-[84px]"
                        heightClass="h-8"
                      />
                    </div>
                    <button
                      type="button"
                      aria-label="Next month"
                      onClick={() => goMonth(1)}
                      className="grid h-7 w-7 place-items-center rounded-md text-[#6F6F8D] transition-colors hover:bg-[#F3F6FF] hover:text-[#17173A]"
                    >
                      <ChevronRight className="h-4 w-4" strokeWidth={2.2} />
                    </button>
                  </div>

                  {/* Weekday header */}
                  <div className="mt-3 grid grid-cols-7 gap-1">
                    {WEEKDAY_LABELS.map((w) => (
                      <span
                        key={w}
                        className="grid h-8 place-items-center font-manrope text-[12px] font-semibold text-[#9494AE]"
                      >
                        {w}
                      </span>
                    ))}
                  </div>

                  {/* Day grid */}
                  <div className="grid grid-cols-7 gap-1">
                    {cells.map((d, i) =>
                      d === null ? (
                        <span key={i} />
                      ) : (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setPendingDay(d)}
                          className={cn(
                            "grid h-8 w-8 place-items-center rounded-md font-manrope text-[13px] transition-colors",
                            isSelected(d)
                              ? "bg-[#2F68E5] font-bold text-white"
                              : isToday(d)
                                ? "bg-[#EAF1FF] font-semibold text-[#2F68E5]"
                                : "text-[#17173A] hover:bg-[#F3F6FF]",
                          )}
                        >
                          {d}
                        </button>
                      ),
                    )}
                  </div>

                  {showTime && (
                    <div className="mt-3 flex items-center justify-center gap-2 border-t border-[#EBEBF5] pt-3">
                      <Dropdown value={pendingHour} options={HOURS} onChange={setPendingHour} widthClass="w-[76px]" heightClass="h-9" />
                      <span className="font-manrope text-[13px] font-bold text-[#6F6F8D]">:</span>
                      <Dropdown value={pendingMinute} options={MINUTES} onChange={setPendingMinute} widthClass="w-[76px]" heightClass="h-9" />
                    </div>
                  )}
                </div>

                <div className="flex shrink-0 items-center justify-end border-t border-[#EBEBF5] px-4 py-3">
                  <button
                    type="button"
                    disabled={pendingDay === null}
                    onClick={handleApply}
                    className="dc-btn dc-btn-primary"
                  >
                    <Check className="h-4 w-4" strokeWidth={2.5} />
                    Apply
                  </button>
                </div>
              </div>
            );
          })(),
          document.body,
        )}
    </div>
  );
}
