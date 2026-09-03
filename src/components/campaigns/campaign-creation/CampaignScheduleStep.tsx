import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, Calendar, Check, ChevronDown, Clock, Info, Lightbulb, X } from "lucide-react";
import * as SwitchPrimitives from "@radix-ui/react-switch";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import sparkle from "/campaign-assets/ic-sparkle.gif";
import StepCard from "./StepCard";

/** A smaller toggle than the shared Switch — matches the compact toggle+text
 *  rows used elsewhere in the wizard (e.g. Audience's "Don't include"). */
function MiniSwitch({
  checked,
  onCheckedChange,
}: {
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
}) {
  return (
    <SwitchPrimitives.Root
      checked={checked}
      onCheckedChange={onCheckedChange}
      className="peer inline-flex h-4 w-7 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background data-[state=checked]:bg-[#00C48C] data-[state=unchecked]:bg-input"
    >
      <SwitchPrimitives.Thumb className="pointer-events-none block h-3 w-3 rounded-full bg-background shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-3 data-[state=unchecked]:translate-x-0" />
    </SwitchPrimitives.Root>
  );
}

/** Our own styled dropdown — a trigger button plus a floating option list —
 *  in place of a native <select>. Info icons sit on the list only, never on
 *  the selected trigger. */
function Dropdown({
  value,
  options,
  onChange,
  className,
}: {
  value: string;
  options: { label: string; info?: string }[];
  onChange: (v: string) => void;
  /** Width of the field — defaults to the step's standard column. */
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (
        !wrapRef.current?.contains(e.target as Node) &&
        !panelRef.current?.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  // Portalled to <body> and positioned by rect rather than plain absolute —
  // the accordion's height-animation wrapper clips overflow, which would
  // otherwise crop this list instead of letting it scroll.
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
    <div ref={wrapRef} className={cn("relative w-full max-w-[320px]", className)}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex h-10 w-full items-center justify-between gap-2 rounded-md border bg-white px-3 font-manrope text-sm text-[#17173A] outline-none transition-colors",
          open ? "border-[#2F68E5]" : "border-[#DDE2EE]"
        )}
      >
        <span className="truncate">{value}</span>
        <ChevronDown
          className={cn("size-4 shrink-0 text-[#8A8AA3] transition-transform", open && "rotate-180")}
          strokeWidth={2}
        />
      </button>
      {open &&
        rect &&
        createPortal(
          <div
            ref={panelRef}
            style={{ position: "fixed", top: rect.bottom + 4, left: rect.left, width: rect.width }}
            className="scroll-slim z-[80] max-h-[240px] overflow-y-auto rounded-md border border-[#DDE2EE] bg-white py-1 shadow-[0_8px_24px_rgba(23,23,58,0.12)]"
          >
            {options.map((o) => (
              <div
                key={o.label}
                className={cn(
                  "flex w-full cursor-pointer items-center gap-1.5 px-3 py-2",
                  o.label === value ? "bg-[#F4F8FF]" : "hover:bg-[#F7F9FC]"
                )}
                onClick={() => {
                  onChange(o.label);
                  setOpen(false);
                }}
              >
                <span
                  className={cn(
                    "whitespace-nowrap font-manrope text-sm",
                    o.label === value ? "font-semibold text-[#2F68E5]" : "text-[#17173A]"
                  )}
                >
                  {o.label}
                </span>
                {o.info && (
                  <TooltipProvider delayDuration={150}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          aria-label={`About ${o.label}`}
                          onClick={(e) => e.stopPropagation()}
                          className="grid size-5 shrink-0 place-items-center text-[#8A8AA3] transition-colors hover:text-[#6F6F8D]"
                        >
                          <Info className="size-3.5" strokeWidth={2} />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent
                        side="right"
                        align="center"
                        className="max-w-[260px] border border-[#DDE2EE] bg-white px-3 py-2 text-[#17173A] shadow-[0_8px_24px_rgba(23,23,58,0.12)]"
                      >
                        <p className="font-manrope text-xs leading-[18px] text-[#6F6F8D]">{o.info}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
            ))}
          </div>,
          document.body
        )}
    </div>
  );
}

/** One card in the "When to send" choice — a radio button styled as a full
 *  row rather than a bare dot, so the info tooltip has somewhere to sit. */
function ModeCard({
  label,
  info,
  checked,
  onSelect,
  coMarketerBadge,
}: {
  label: string;
  info?: string;
  checked: boolean;
  onSelect: () => void;
  /** Flags this option as the co-marketer's own pick — sparkle sits inline
   *  before the label, same asset as the "Ask co-marketer" CTA. */
  coMarketerBadge?: boolean;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={checked}
      title={label}
      onClick={onSelect}
      className={cn(
        "relative flex min-w-0 flex-1 basis-0 items-center gap-2.5 rounded-lg border py-3 pl-2.5 pr-3 text-left transition-colors",
        checked ? "border-[#2F68E5] bg-[#F4F8FF]" : "border-[#DDE2EE] bg-white hover:border-[#C3CAD9]"
      )}
    >
      <span
        className={cn(
          "grid size-5 shrink-0 place-items-center rounded-full border-2 transition-colors",
          checked ? "border-[#2F68E5] bg-[#2F68E5]" : "border-[#C3CAD9] bg-white"
        )}
      >
        {checked && <Check className="size-3 text-white" strokeWidth={3} />}
      </span>
      {coMarketerBadge && <img src={sparkle} alt="" className="size-4 shrink-0" />}
      <span className="min-w-0 truncate font-manrope text-sm font-semibold text-[#17173A]">
        {label}
      </span>
      {info && (
        <TooltipProvider delayDuration={150}>
          <Tooltip>
            <TooltipTrigger asChild>
              <span
                tabIndex={0}
                onClick={(e) => e.stopPropagation()}
                aria-label={`About ${label}`}
                className="ml-auto inline-grid shrink-0 place-items-center text-[#8A8AA3] transition-colors hover:text-[#6F6F8D]"
              >
                <Info className="size-3.5" strokeWidth={2} />
              </span>
            </TooltipTrigger>
            <TooltipContent
              side="top"
              align="center"
              className="max-w-[260px] border border-[#DDE2EE] bg-white px-3 py-2 text-[#17173A] shadow-[0_8px_24px_rgba(23,23,58,0.12)]"
            >
              <p className="font-manrope text-xs leading-[18px] text-[#6F6F8D]">{info}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </button>
  );
}

export type SendMode = "now" | "later" | "slice" | "optimize";

/** Mon-first, matching how the days chip and editor both read. */
export type Weekday = "MON" | "TUE" | "WED" | "THU" | "FRI" | "SAT" | "SUN";
export const WEEKDAYS: Weekday[] = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
const DAY_LABEL: Record<Weekday, string> = {
  MON: "Mon",
  TUE: "Tue",
  WED: "Wed",
  THU: "Thu",
  FRI: "Fri",
  SAT: "Sat",
  SUN: "Sun",
};

export interface ScheduleValues {
  /** On = this campaign ignores the account's frequency cap. */
  skipFrequencyCap: boolean;
  mode: SendMode;
  /** `datetime-local` value for "Send later". */
  sendAt: string;
  /** "Send in batches" — a sentence-built schedule rather than a fixed count. */
  sliceSize: number;
  sliceDays: Weekday[];
  /** "HH:MM", 24h. */
  sliceTimes: string[];
  /** "YYYY-MM-DD". */
  sliceStartDate: string;
  sliceEndDate: string;
  optimizeWindow: string;
}

/** Everything the account sends against is stamped in this timezone. */
const TIMEZONE = "Asia/Calcutta";

/** The top-level "When to send" choice. "Send now" and "Send later" share a
 *  single card — which of the two it means is a follow-up dropdown, not a
 *  separate top-level option. */
type TopMode = "optimize" | "nowOrLater" | "slice";

const TOP_MODES: { id: TopMode; label: string; info?: string }[] = [
  { id: "optimize", label: "Optimize with Co-marketer" },
  { id: "nowOrLater", label: "Send now or later" },
  {
    id: "slice",
    label: "Send in batches",
    info: "Splits the audience into batches spaced across the days and times you pick, so a bad subject line doesn't reach the whole list before you can stop it.",
  },
];

const NOW_OR_LATER_OPTIONS = ["Send now", "Send later"];
const OPTIMIZE_WINDOWS = ["Next 24 hours", "Next 3 days", "Next 7 days"];

const fieldClass =
  "h-10 w-full rounded-md border border-[#DDE2EE] bg-[#F7F9FC] px-3 font-manrope text-sm text-[#17173A] outline-none transition-colors focus:border-[#2F68E5] focus:bg-white";

const stampFmt = new Intl.DateTimeFormat("en-US", {
  timeZone: TIMEZONE,
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
});

/** "May 19, 2026 11:53 am" — lowercase meridiem, as the reference shows it. */
function stamp(d: Date): string {
  return stampFmt.format(d).replace(" AM", " am").replace(" PM", " pm");
}

/** `datetime-local` needs a local-clock string, not an ISO instant. */
function toLocalInput(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
    `T${pad(d.getHours())}:${pad(d.getMinutes())}`
  );
}

/** `date` input needs a local calendar-day string, not an ISO instant. */
function toDateInput(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Parsed as local midnight — never through `new Date(string)`, which reads
 *  a bare "YYYY-MM-DD" as UTC and can land on the wrong day locally. */
function fromDateInput(value: string): Date {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

function todayDateStr(): string {
  return toDateInput(new Date());
}

function addDays(dateStr: string, days: number): string {
  const d = fromDateInput(dateStr);
  d.setDate(d.getDate() + days);
  return toDateInput(d);
}

function daysBetween(a: string, b: string): number {
  return Math.round((fromDateInput(b).getTime() - fromDateInput(a).getTime()) / 86_400_000);
}

function sameCalendarDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
  );
}

/** Next date landing on `jsWeekday` (0=Sun..6=Sat) — always in the future,
 *  even if today already is that weekday ("next Monday" on a Monday means
 *  the one after this one, not today). */
function nextWeekdayDate(jsWeekday: number): Date {
  const d = new Date();
  let delta = (jsWeekday - d.getDay() + 7) % 7;
  if (delta === 0) delta = 7;
  d.setDate(d.getDate() + delta);
  return d;
}

/** Default send time — far enough out that the schedule is a real choice. */
export function defaultSendAt(): string {
  const d = new Date(Date.now() + 17 * 60 * 1000);
  d.setSeconds(0, 0);
  return toLocalInput(d);
}

/**
 * Next time the clock hits `hour` — on `weekday` if one is given, otherwise
 * tomorrow. Used by the co-marketer's send-window suggestion so the card
 * proposes a real slot rather than a rule the user has to translate.
 */
export function nextSlot(hour: number, weekday?: number): string {
  const d = new Date();
  d.setHours(hour, 0, 0, 0);
  if (weekday === undefined) {
    d.setDate(d.getDate() + 1);
  } else {
    let delta = (weekday - d.getDay() + 7) % 7;
    if (delta === 0 && d.getTime() <= Date.now()) delta = 7;
    d.setDate(d.getDate() + delta);
  }
  return toLocalInput(d);
}

/** "Tue, 19 May at 10:00 am" — how a proposed slot reads on an apply card. */
export function describeSlot(value: string): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })
    .format(d)
    .replace(" AM", " am")
    .replace(" PM", " pm");
}

/** "Thu, Sep 03" — the outcome panel's day-level date. */
function formatWeekdayDate(d: Date): string {
  return new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "2-digit" }).format(
    d
  );
}

/** "Sep 10" — the End chip's short date. */
function formatChipDate(d: Date): string {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "2-digit" }).format(d);
}

function formatStartChip(dateStr: string): string {
  const d = fromDateInput(dateStr);
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);
  if (sameCalendarDay(d, today)) return "today";
  if (sameCalendarDay(d, tomorrow)) return "tomorrow";
  return formatWeekdayDate(d);
}

function formatDaysChip(days: Weekday[]): string {
  if (days.length === 0) return "no days yet";
  if (days.length === 7) return "every day";
  return WEEKDAYS.filter((d) => days.includes(d))
    .map((d) => DAY_LABEL[d])
    .join(", ");
}

function formatTimesChip(times: string[]): string {
  if (times.length === 0) return "no times yet";
  return [...times].sort().join(" and ");
}

/**
 * Every send window a "Send in batches" schedule produces — one per
 * (day-in-range ∩ chosen weekday) × chosen time, sorted ascending. This list
 * is the schedule's whole capacity: how many batches it can actually carry.
 */
export function sliceWindows(values: ScheduleValues): Date[] {
  const start = fromDateInput(values.sliceStartDate);
  const end = fromDateInput(values.sliceEndDate);
  if (end < start || values.sliceDays.length === 0 || values.sliceTimes.length === 0) return [];

  const daySet = new Set(values.sliceDays);
  const windows: Date[] = [];
  const cursor = new Date(start);
  // 400-day hard stop — a user-editable date pair could otherwise loop
  // indefinitely if left in a bad state (e.g. end far past start).
  for (let guard = 0; guard < 400 && cursor <= end; guard++) {
    const weekday = WEEKDAYS[(cursor.getDay() + 6) % 7];
    if (daySet.has(weekday)) {
      for (const t of values.sliceTimes) {
        const [hh, mm] = t.split(":").map(Number);
        const dt = new Date(cursor);
        dt.setHours(hh || 0, mm || 0, 0, 0);
        windows.push(dt);
      }
    }
    cursor.setDate(cursor.getDate() + 1);
  }
  windows.sort((a, b) => a.getTime() - b.getTime());
  return windows;
}

export function batchesNeeded(audience: number, size: number): number {
  if (size <= 0) return 0;
  return Math.ceil(audience / size);
}

/** Smallest gap between consecutive windows, in minutes — null when there
 *  are fewer than two windows to compare. */
export function minGapMinutes(windows: Date[]): number | null {
  if (windows.length < 2) return null;
  let min = Infinity;
  for (let i = 1; i < windows.length; i++) {
    min = Math.min(min, (windows[i].getTime() - windows[i - 1].getTime()) / 60_000);
  }
  return min;
}

/** Short label for "Send in batches" as it reads elsewhere in the wizard
 *  (the accordion's collapsed summary, the Preview screen). */
export function sliceSummaryLabel(values: ScheduleValues, audienceCount: number): string {
  const windows = sliceWindows(values);
  if (windows.length === 0) return "No send windows set yet";
  const sent = Math.min(batchesNeeded(audienceCount, values.sliceSize), windows.length);
  return `${sent} batch${sent === 1 ? "" : "es"} of ${values.sliceSize.toLocaleString()}`;
}

export const EMPTY_SCHEDULE: ScheduleValues = {
  skipFrequencyCap: false,
  mode: "optimize",
  sendAt: defaultSendAt(),
  sliceSize: 12_000,
  sliceDays: ["MON", "WED", "FRI"],
  sliceTimes: ["10:00"],
  sliceStartDate: todayDateStr(),
  sliceEndDate: addDays(todayDateStr(), 7),
  optimizeWindow: "Next 24 hours",
};

/** Small pill button shared by every editor's quick picks. */
function QuickPick({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "min-h-[44px] rounded-md border px-3 py-1.5 font-manrope text-sm font-semibold transition-colors",
        active
          ? "border-[#2F68E5] bg-[#F4F8FF] text-[#2F68E5]"
          : "border-[#DDE2EE] bg-white text-[#17173A] hover:border-[#C3CAD9]"
      )}
    >
      {label}
    </button>
  );
}

/** One bracketed value in the sentence — a dashed-underline inline button
 *  that opens its own editor below. Font size is inherited from the
 *  sentence, not set here, so it always matches the surrounding text. */
function SentenceChip({
  label,
  active,
  onClick,
  chipRef,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  chipRef?: (el: HTMLButtonElement | null) => void;
}) {
  return (
    <button
      ref={chipRef}
      type="button"
      onClick={onClick}
      aria-expanded={active}
      className={cn(
        "-my-[13px] inline rounded px-0.5 py-[13px] align-baseline font-bold text-[#2F68E5] underline decoration-2 decoration-dashed underline-offset-4 outline-none transition-colors hover:text-[#255ad2] focus-visible:ring-2 focus-visible:ring-[#2F68E5] focus-visible:ring-offset-2",
        active && "text-[#255ad2]"
      )}
    >
      {label}
    </button>
  );
}

/** Shared shell for the five "Send in batches" editors — a bordered panel
 *  under the sentence, never a modal. */
function EditorPanel({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-4 rounded-lg border border-[#DDE2EE] p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="font-manrope text-sm font-bold text-[#17173A]">{title}</p>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="grid size-7 shrink-0 place-items-center rounded text-[#8A8AA3] transition-colors hover:bg-[#E8ECF4] hover:text-[#17173A]"
        >
          <X className="size-4" strokeWidth={2} />
        </button>
      </div>
      {children}
    </div>
  );
}

const SIZE_PRESETS = [5_000, 10_000, 12_000, 25_000];

function SizeEditor({
  values,
  onChange,
  audienceCount,
  onClose,
}: {
  values: ScheduleValues;
  onChange: (patch: Partial<ScheduleValues>) => void;
  audienceCount: number;
  onClose: () => void;
}) {
  const windows = sliceWindows(values);
  const needed = batchesNeeded(audienceCount, values.sliceSize);
  const room = Math.max(0, windows.length - needed);

  return (
    <EditorPanel title="How many contacts per batch?" onClose={onClose}>
      <input
        type="number"
        min={1}
        value={values.sliceSize}
        onChange={(e) => onChange({ sliceSize: Math.max(1, parseInt(e.target.value, 10) || 0) })}
        className={cn(fieldClass, "max-w-[200px]")}
      />
      <div className="mt-3 flex flex-wrap gap-2">
        {SIZE_PRESETS.map((n) => (
          <QuickPick
            key={n}
            label={n.toLocaleString()}
            active={values.sliceSize === n}
            onClick={() => onChange({ sliceSize: n })}
          />
        ))}
      </div>
      <p className="mt-3 font-manrope text-xs text-[#6F6F8D]">
        {needed} batch{needed === 1 ? "" : "es"} at this size, and you have room for {room}.
      </p>
    </EditorPanel>
  );
}

function StartEditor({
  values,
  onChange,
  onClose,
}: {
  values: ScheduleValues;
  onChange: (patch: Partial<ScheduleValues>) => void;
  onClose: () => void;
}) {
  const lengthDays = daysBetween(values.sliceStartDate, values.sliceEndDate);
  const today = todayDateStr();
  const tomorrow = addDays(today, 1);
  const nextMonday = toDateInput(nextWeekdayDate(1));

  const setStart = (dateStr: string) => {
    onChange({ sliceStartDate: dateStr, sliceEndDate: addDays(dateStr, lengthDays) });
  };

  return (
    <EditorPanel title="When should the first batch go out?" onClose={onClose}>
      <input
        type="date"
        min={today}
        value={values.sliceStartDate}
        onChange={(e) => e.target.value && setStart(e.target.value)}
        className={cn(fieldClass, "max-w-[200px]")}
      />
      <div className="mt-3 flex flex-wrap gap-2">
        <QuickPick label="Today" active={values.sliceStartDate === today} onClick={() => setStart(today)} />
        <QuickPick
          label="Tomorrow"
          active={values.sliceStartDate === tomorrow}
          onClick={() => setStart(tomorrow)}
        />
        <QuickPick
          label="Next Monday"
          active={values.sliceStartDate === nextMonday}
          onClick={() => setStart(nextMonday)}
        />
      </div>
      <p className="mt-3 font-manrope text-xs text-[#6F6F8D]">
        Moving the start keeps the campaign {lengthDays} day{lengthDays === 1 ? "" : "s"} long — the
        finish date moves with it.
      </p>
    </EditorPanel>
  );
}

function DaysEditor({
  values,
  onChange,
  onClose,
}: {
  values: ScheduleValues;
  onChange: (patch: Partial<ScheduleValues>) => void;
  onClose: () => void;
}) {
  const toggleDay = (d: Weekday) => {
    const on = values.sliceDays.includes(d);
    onChange({
      sliceDays: on ? values.sliceDays.filter((x) => x !== d) : [...values.sliceDays, d],
    });
  };

  return (
    <EditorPanel title="Which days?" onClose={onClose}>
      <div className="flex flex-wrap gap-2">
        {WEEKDAYS.map((d) => {
          const on = values.sliceDays.includes(d);
          return (
            <button
              key={d}
              type="button"
              onClick={() => toggleDay(d)}
              aria-pressed={on}
              className={cn(
                "min-h-[44px] min-w-[44px] rounded-md border px-3 py-1.5 font-manrope text-sm font-semibold transition-colors",
                on
                  ? "border-[#2F68E5] bg-[#2F68E5] text-white"
                  : "border-[#DDE2EE] bg-white text-[#17173A] hover:border-[#C3CAD9]"
              )}
            >
              {DAY_LABEL[d]}
            </button>
          );
        })}
      </div>
      {values.sliceDays.length === 0 && (
        <p className="mt-3 font-manrope text-xs font-semibold text-destructive">
          Pick at least one day — nothing sends until you do.
        </p>
      )}
    </EditorPanel>
  );
}

function TimesEditor({
  values,
  onChange,
  onClose,
}: {
  values: ScheduleValues;
  onChange: (patch: Partial<ScheduleValues>) => void;
  onClose: () => void;
}) {
  const setTime = (i: number, v: string) => {
    const next = [...values.sliceTimes];
    next[i] = v;
    onChange({ sliceTimes: next });
  };
  const removeTime = (i: number) => {
    onChange({ sliceTimes: values.sliceTimes.filter((_, idx) => idx !== i) });
  };
  const addTime = () => {
    const last = values.sliceTimes[values.sliceTimes.length - 1] ?? "10:00";
    const [h, m] = last.split(":").map(Number);
    const suggested = `${String((h + 4) % 24).padStart(2, "0")}:${String(m || 0).padStart(2, "0")}`;
    onChange({ sliceTimes: [...values.sliceTimes, suggested] });
  };

  return (
    <EditorPanel title="What time of day?" onClose={onClose}>
      <div className="flex flex-wrap items-center gap-2">
        {values.sliceTimes.map((t, i) => (
          <div key={i} className="flex items-center gap-1">
            <input
              type="time"
              value={t}
              onChange={(e) => e.target.value && setTime(i, e.target.value)}
              className={cn(fieldClass, "w-auto min-h-[44px] max-w-[140px]")}
            />
            {values.sliceTimes.length > 1 && (
              <button
                type="button"
                aria-label="Remove time"
                onClick={() => removeTime(i)}
                className="grid size-7 shrink-0 place-items-center rounded text-[#8A8AA3] transition-colors hover:bg-[#E8ECF4] hover:text-[#17173A]"
              >
                <X className="size-3.5" strokeWidth={2} />
              </button>
            )}
          </div>
        ))}
        <button
          type="button"
          onClick={addTime}
          className="min-h-[44px] rounded-md border border-dashed border-[#C3CAD9] px-3 font-manrope text-sm font-semibold text-[#2F68E5] transition-colors hover:border-[#2F68E5]"
        >
          Add a time
        </button>
      </div>
    </EditorPanel>
  );
}

function EndEditor({
  values,
  onChange,
  onClose,
}: {
  values: ScheduleValues;
  onChange: (patch: Partial<ScheduleValues>) => void;
  onClose: () => void;
}) {
  const setEnd = (dateStr: string) => onChange({ sliceEndDate: dateStr });
  const oneWeek = addDays(values.sliceStartDate, 7);
  const twoWeeks = addDays(values.sliceStartDate, 14);
  const thirtyDays = addDays(values.sliceStartDate, 30);

  return (
    <EditorPanel title="When should everyone have it by?" onClose={onClose}>
      <input
        type="date"
        min={values.sliceStartDate}
        value={values.sliceEndDate}
        onChange={(e) => e.target.value && setEnd(e.target.value)}
        className={cn(fieldClass, "max-w-[200px]")}
      />
      <div className="mt-3 flex flex-wrap gap-2">
        <QuickPick label="1 week" active={values.sliceEndDate === oneWeek} onClick={() => setEnd(oneWeek)} />
        <QuickPick
          label="2 weeks"
          active={values.sliceEndDate === twoWeeks}
          onClick={() => setEnd(twoWeeks)}
        />
        <QuickPick
          label="30 days"
          active={values.sliceEndDate === thirtyDays}
          onClick={() => setEnd(thirtyDays)}
        />
      </div>
    </EditorPanel>
  );
}

function OutcomeHeading() {
  return (
    <p className="flex items-center gap-1.5 font-manrope text-[11px] font-bold uppercase tracking-wide text-[#8A8AA3]">
      <Lightbulb className="size-3.5 shrink-0 text-[#E9A400]" strokeWidth={2} aria-hidden />
      Here's what will happen
    </p>
  );
}

/** Always-visible readout under the sentence — what this schedule actually
 *  does, recomputed on every keystroke. */
function OutcomePanel({
  values,
  onChange,
  audienceCount,
}: {
  values: ScheduleValues;
  onChange: (patch: Partial<ScheduleValues>) => void;
  audienceCount: number;
}) {
  const windows = sliceWindows(values);

  if (windows.length === 0) {
    return (
      <div className="mt-4 rounded-lg border border-[#DDE2EE] bg-white p-4" aria-live="polite">
        <OutcomeHeading />
        <p className="mt-2 font-manrope text-sm leading-6 text-[#17173A]">
          There are no send windows between those two dates. Add a day, add a time, or push the finish
          date out.
        </p>
      </div>
    );
  }

  const needed = batchesNeeded(audienceCount, values.sliceSize);
  const sent = Math.min(needed, windows.length);
  const covered = Math.min(values.sliceSize * sent, audienceCount);
  const pct = audienceCount > 0 ? Math.min(100, (covered / audienceCount) * 100) : 100;
  const complete = audienceCount === 0 || covered >= audienceCount;
  const gap = minGapMinutes(windows);
  const shortBy = Math.max(0, audienceCount - covered);
  const firstDate = windows[0];
  const lastUsed = windows[sent - 1];

  return (
    <div className="mt-4 rounded-lg border border-[#DDE2EE] bg-white p-4" aria-live="polite">
      <OutcomeHeading />
      <p className="mt-2 font-manrope text-sm leading-6 text-[#17173A]">
        First batch goes out <span className="font-bold">{formatWeekdayDate(firstDate)}</span>, the last
        one <span className="font-bold">{formatWeekdayDate(lastUsed)}</span> — {sent} batch
        {sent === 1 ? "" : "es"} of {values.sliceSize.toLocaleString()}.
      </p>

      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-[#E4E8F0]">
        <div
          className={cn("h-full rounded-full transition-all", complete ? "bg-[#00C48C]" : "bg-[#E9A400]")}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="mt-1.5 font-manrope text-xs text-[#6F6F8D]">
        {covered.toLocaleString()} of {audienceCount.toLocaleString()} contacts scheduled
        {!complete && (
          <span className="ml-1 font-semibold text-[#E9A400]">
            · {shortBy.toLocaleString()} left unscheduled
          </span>
        )}
      </p>

      {needed > windows.length && (
        <div className="mt-3 rounded-md bg-[#FFF8E5] p-3">
          <p className="font-manrope text-sm leading-6 text-[#17173A]">
            <span className="font-semibold">{shortBy.toLocaleString()} contacts</span> miss the deadline —
            you have {windows.length} send window{windows.length === 1 ? "" : "s"} but need {needed}.
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() =>
                onChange({ sliceSize: Math.max(1, Math.ceil(audienceCount / windows.length)) })
              }
              className="min-h-[44px] rounded-md border border-[#E9A400] bg-white px-3 font-manrope text-sm font-semibold text-[#8A5B00] transition-colors hover:bg-[#FFF3D6]"
            >
              Send {Math.ceil(audienceCount / windows.length).toLocaleString()} at a time instead
            </button>
            <button
              type="button"
              onClick={() => onChange({ sliceEndDate: addDays(values.sliceEndDate, 7) })}
              className="min-h-[44px] rounded-md border border-[#E9A400] bg-white px-3 font-manrope text-sm font-semibold text-[#8A5B00] transition-colors hover:bg-[#FFF3D6]"
            >
              Give it another week
            </button>
          </div>
        </div>
      )}

      {needed < windows.length && (
        <p className="mt-3 rounded-md bg-[#EDF1FF] p-3 font-manrope text-sm leading-6 text-[#17173A]">
          Everyone has it by <span className="font-semibold">{formatWeekdayDate(lastUsed)}</span>, which
          is ahead of your{" "}
          <span className="font-semibold">{formatChipDate(fromDateInput(values.sliceEndDate))}</span>{" "}
          finish date. {windows.length - sent} spare send window{windows.length - sent === 1 ? "" : "s"}{" "}
          go unused.
        </p>
      )}

      {gap !== null && gap < 30 && (
        <p className="mt-3 rounded-md bg-[#FFF8E5] p-3 font-manrope text-sm leading-6 text-[#17173A]">
          Two send windows land only {Math.round(gap)} minute{Math.round(gap) === 1 ? "" : "s"} apart —
          frequency cap data can lag that long, so a contact could get two batches.
        </p>
      )}
    </div>
  );
}

type SliceEditorId = "size" | "start" | "days" | "times" | "end";

/**
 * "Send in batches" as one readable sentence with five tappable chips,
 * rather than a form. Each chip opens the one field it controls; the
 * outcome panel underneath recomputes on every change, so there's nothing
 * to "apply" — the sentence and the panel are always the current schedule.
 */
function SliceAndSend({
  values,
  onChange,
  audienceCount,
}: {
  values: ScheduleValues;
  onChange: (patch: Partial<ScheduleValues>) => void;
  audienceCount: number;
}) {
  const [openEditor, setOpenEditor] = useState<SliceEditorId | null>(null);
  const chipRefs = useRef<Partial<Record<SliceEditorId, HTMLButtonElement | null>>>({});

  const toggle = (id: SliceEditorId) => setOpenEditor((cur) => (cur === id ? null : id));
  const closeAndReturnFocus = () => {
    const id = openEditor;
    setOpenEditor(null);
    if (id) requestAnimationFrame(() => chipRefs.current[id]?.focus());
  };

  return (
    <div className="mt-5">
      <p className="font-manrope text-base leading-[2] text-[#17173A]">
        Send this campaign to <span className="font-bold">{audienceCount.toLocaleString()} contacts</span>{" "}
        in batches of{" "}
        <SentenceChip
          chipRef={(el) => (chipRefs.current.size = el)}
          label={values.sliceSize.toLocaleString()}
          active={openEditor === "size"}
          onClick={() => toggle("size")}
        />
        , starting{" "}
        <SentenceChip
          chipRef={(el) => (chipRefs.current.start = el)}
          label={formatStartChip(values.sliceStartDate)}
          active={openEditor === "start"}
          onClick={() => toggle("start")}
        />{" "}
        on{" "}
        <SentenceChip
          chipRef={(el) => (chipRefs.current.days = el)}
          label={formatDaysChip(values.sliceDays)}
          active={openEditor === "days"}
          onClick={() => toggle("days")}
        />{" "}
        at{" "}
        <SentenceChip
          chipRef={(el) => (chipRefs.current.times = el)}
          label={formatTimesChip(values.sliceTimes)}
          active={openEditor === "times"}
          onClick={() => toggle("times")}
        />
        , finishing by{" "}
        <SentenceChip
          chipRef={(el) => (chipRefs.current.end = el)}
          label={formatChipDate(fromDateInput(values.sliceEndDate))}
          active={openEditor === "end"}
          onClick={() => toggle("end")}
        />
        .
      </p>

      {openEditor === "size" && (
        <SizeEditor
          values={values}
          onChange={onChange}
          audienceCount={audienceCount}
          onClose={closeAndReturnFocus}
        />
      )}
      {openEditor === "start" && (
        <StartEditor values={values} onChange={onChange} onClose={closeAndReturnFocus} />
      )}
      {openEditor === "days" && (
        <DaysEditor values={values} onChange={onChange} onClose={closeAndReturnFocus} />
      )}
      {openEditor === "times" && (
        <TimesEditor values={values} onChange={onChange} onClose={closeAndReturnFocus} />
      )}
      {openEditor === "end" && (
        <EndEditor values={values} onChange={onChange} onClose={closeAndReturnFocus} />
      )}

      <OutcomePanel values={values} onChange={onChange} audienceCount={audienceCount} />
    </div>
  );
}

/**
 * Schedule step — the frequency-cap override and when this campaign goes out.
 * The cap warning is deliberately loud: skipping it is the one setting here
 * that can double-message a contact, and it can't be undone after a send.
 */
export default function CampaignScheduleStep({
  values,
  onChange,
  audienceCount,
}: {
  values: ScheduleValues;
  onChange: (patch: Partial<ScheduleValues>) => void;
  /** Total reachable contacts from the Audience step — "Send in batches"
   *  sizes its sentence and coverage math off this, not a hardcoded count. */
  audienceCount: number;
}) {
  // The header clock is the timezone sends are stamped in, so it ticks rather
  // than freezing at whatever minute the step was opened on.
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <StepCard wide>
      <div className="mb-6 flex items-center gap-2">
        <Clock className="size-4 shrink-0 text-[#6F6F8D]" strokeWidth={2} />
        <p className="font-manrope text-sm text-[#6F6F8D]">
          Timezone: <span className="font-bold text-[#17173A]">{TIMEZONE}</span> | {stamp(now)}
        </p>
      </div>

      <div>
        <div className="flex items-center gap-2">
          <MiniSwitch
            checked={values.skipFrequencyCap}
            onCheckedChange={(v) => onChange({ skipFrequencyCap: v })}
          />
          <p className="font-manrope text-sm font-semibold text-[#17173A]">Frequency cap</p>
        </div>

        <div className="t-acc" data-open={values.skipFrequencyCap ? "true" : "false"}>
          <div className="t-acc-panel">
            <div className="t-acc-panel-inner">
              <div className="mt-4 flex gap-3 rounded-md bg-[#FFF8E5] p-4">
                <AlertTriangle
                  className="mt-0.5 size-[18px] shrink-0 text-[#E9A400]"
                  strokeWidth={2}
                />
                <p className="font-manrope text-sm leading-6 text-[#17173A]">
                  Running 2 consecutive campaigns within 30 minutes time-frame could potentially
                  bypass the frequency cap check due to data synchronisation delay.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <label className="mb-1.5 block font-manrope text-sm font-semibold text-[#17173A]">
          When to send
        </label>
        <div role="radiogroup" aria-label="When to send" className="grid grid-cols-3 gap-3">
          {TOP_MODES.map((m) => {
            const checked =
              m.id === "nowOrLater" ? values.mode === "now" || values.mode === "later" : values.mode === m.id;
            return (
              <ModeCard
                key={m.id}
                label={m.label}
                info={m.info}
                checked={checked}
                coMarketerBadge={m.id === "optimize"}
                onSelect={() =>
                  onChange({
                    mode:
                      m.id === "nowOrLater"
                        ? values.mode === "now" || values.mode === "later"
                          ? values.mode
                          : "now"
                        : m.id,
                  })
                }
              />
            );
          })}
        </div>

        {(values.mode === "now" || values.mode === "later") && (
          <div className="mt-5 grid grid-cols-3 gap-3">
            <div>
              <label className="mb-1.5 block font-manrope text-sm font-semibold text-[#17173A]">
                When should it go out?
              </label>
              <Dropdown
                className="max-w-none"
                value={values.mode === "later" ? "Send later" : "Send now"}
                options={NOW_OR_LATER_OPTIONS.map((label) => ({ label }))}
                onChange={(label) => onChange({ mode: label === "Send later" ? "later" : "now" })}
              />
            </div>

            {values.mode === "later" && (
              <div>
                <label className="mb-1.5 block font-manrope text-sm font-semibold text-[#17173A]">
                  Select date and time <span className="text-[#FC5E02]">*</span>
                </label>
                <div className="relative">
                  <Calendar
                    className="pointer-events-none absolute left-3 top-1/2 size-[18px] -translate-y-1/2 text-[#6F6F8D]"
                    strokeWidth={2}
                  />
                  <input
                    type="datetime-local"
                    value={values.sendAt}
                    min={toLocalInput(new Date())}
                    onChange={(e) => onChange({ sendAt: e.target.value })}
                    className={cn(fieldClass, "pl-10")}
                  />
                </div>
                <p className="mt-1.5 font-manrope text-xs text-[#6F6F8D]">
                  Scheduled in {TIMEZONE}, the timezone this account sends in.
                </p>
              </div>
            )}
          </div>
        )}

        {values.mode === "slice" && (
          <SliceAndSend values={values} onChange={onChange} audienceCount={audienceCount} />
        )}

        {values.mode === "optimize" && (
          <div className="mt-5 grid grid-cols-3 gap-3">
            <div>
              <label className="mb-1.5 block font-manrope text-sm font-semibold text-[#17173A]">
                Delivery window
              </label>
              <Dropdown
                className="max-w-none"
                value={values.optimizeWindow}
                options={OPTIMIZE_WINDOWS.map((w) => ({ label: w }))}
                onChange={(label) => onChange({ optimizeWindow: label })}
              />
            </div>
          </div>
        )}
      </div>
    </StepCard>
  );
}
