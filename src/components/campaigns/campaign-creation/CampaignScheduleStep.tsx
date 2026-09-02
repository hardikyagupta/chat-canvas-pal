import { useEffect, useRef, useState } from "react";
import { AlertTriangle, Calendar, ChevronDown, Clock, Info } from "lucide-react";
import * as SwitchPrimitives from "@radix-ui/react-switch";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
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
      {open && (
        <div className="absolute left-0 top-full z-20 mt-1 w-full rounded-md border border-[#DDE2EE] bg-white py-1 shadow-[0_8px_24px_rgba(23,23,58,0.12)]">
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
        </div>
      )}
    </div>
  );
}

export type SendMode = "now" | "later" | "slice" | "optimize";

export interface ScheduleValues {
  /** On = this campaign ignores the account's frequency cap. */
  skipFrequencyCap: boolean;
  mode: SendMode;
  /** `datetime-local` value for "Send later". */
  sendAt: string;
  sliceBatches: number;
  sliceGapMins: number;
  optimizeWindow: string;
}

/** Everything the account sends against is stamped in this timezone. */
const TIMEZONE = "Asia/Calcutta";

const MODES: { id: SendMode; label: string; info?: string }[] = [
  { id: "now", label: "Send now" },
  { id: "later", label: "Send later" },
  {
    id: "slice",
    label: "Send in batches",
    info: "Splits the audience into equal batches and spaces them out, so a bad subject line doesn't reach the whole list before you can stop it.",
  },
  {
    id: "optimize",
    label: "Optimize with Co-marketer",
    info: "Each contact is sent at the hour they've historically opened, inside the window you pick. Contacts without enough history fall back to your account's best-performing hour.",
  },
];

const SLICE_BATCHES = [2, 3, 4, 5, 6, 8, 10];
const SLICE_GAPS = [15, 30, 60, 120];
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

export const EMPTY_SCHEDULE: ScheduleValues = {
  skipFrequencyCap: false,
  mode: "later",
  sendAt: defaultSendAt(),
  sliceBatches: 4,
  sliceGapMins: 30,
  optimizeWindow: "Next 24 hours",
};

/**
 * Schedule step — the frequency-cap override and when this campaign goes out.
 * The cap warning is deliberately loud: skipping it is the one setting here
 * that can double-message a contact, and it can't be undone after a send.
 */
export default function CampaignScheduleStep({
  values,
  onChange,
}: {
  values: ScheduleValues;
  onChange: (patch: Partial<ScheduleValues>) => void;
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
        <Dropdown
          value={MODES.find((m) => m.id === values.mode)?.label ?? MODES[0].label}
          options={MODES.map((m) => ({ label: m.label, info: m.info }))}
          onChange={(label) => {
            const mode = MODES.find((m) => m.label === label)?.id;
            if (mode) onChange({ mode });
          }}
        />

        {values.mode === "later" && (
          <div className="mt-5 w-full max-w-[320px]">
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

        {values.mode === "slice" && (
          <div className="mt-5">
            <div className="flex w-full max-w-[320px] items-end gap-3">
              <div className="min-w-0 flex-1">
                <label className="mb-1.5 block font-manrope text-sm font-semibold text-[#17173A]">
                  Number of batches
                </label>
                <Dropdown
                  className="max-w-none"
                  value={`${values.sliceBatches} batches`}
                  options={SLICE_BATCHES.map((n) => ({ label: `${n} batches` }))}
                  onChange={(label) => onChange({ sliceBatches: parseInt(label, 10) })}
                />
              </div>
              <div className="min-w-0 flex-1">
                <label className="mb-1.5 block font-manrope text-sm font-semibold text-[#17173A]">
                  Gap between batches
                </label>
                <Dropdown
                  className="max-w-none"
                  value={`${values.sliceGapMins} minutes`}
                  options={SLICE_GAPS.map((n) => ({ label: `${n} minutes` }))}
                  onChange={(label) => onChange({ sliceGapMins: parseInt(label, 10) })}
                />
              </div>
            </div>
            <p className="mt-3 font-manrope text-xs text-[#6F6F8D]">
              Full send completes about{" "}
              <span className="font-bold text-[#17173A]">
                {((values.sliceBatches - 1) * values.sliceGapMins) / 60 >= 1
                  ? `${(((values.sliceBatches - 1) * values.sliceGapMins) / 60).toFixed(1)} hours`
                  : `${(values.sliceBatches - 1) * values.sliceGapMins} minutes`}
              </span>{" "}
              after the first batch leaves.
            </p>
          </div>
        )}

        {values.mode === "optimize" && (
          <div className="mt-5 w-full max-w-[320px]">
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
        )}
      </div>
    </StepCard>
  );
}
