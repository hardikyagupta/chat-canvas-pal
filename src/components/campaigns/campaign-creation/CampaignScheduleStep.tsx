import { useEffect, useState } from "react";
import { AlertTriangle, Calendar, Info } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import StepCard from "./StepCard";

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
  { id: "slice", label: "Slice & Send" },
  {
    id: "optimize",
    label: "Optimize with Co-marketer",
    info: "Each contact is sent at the hour they've historically opened, inside the window you pick.",
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

function Radio({ checked }: { checked: boolean }) {
  return (
    <span
      className={cn(
        "grid size-[18px] shrink-0 place-items-center rounded-full border-2 transition-colors",
        checked ? "border-[#2F68E5]" : "border-[#C3CAD9]"
      )}
    >
      {checked && <span className="size-2 rounded-full bg-[#2F68E5]" />}
    </span>
  );
}

/** The bordered sections this step is built from. */
function Panel({ children }: { children: React.ReactNode }) {
  return <div className="rounded-lg border border-[#DDE2EE] p-5">{children}</div>;
}

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
    <StepCard
      wide
      title="Schedule campaign"
      action={
        <p className="font-manrope text-sm text-[#6F6F8D]">
          Timezone: <span className="font-bold text-[#17173A]">{TIMEZONE}</span> | {stamp(now)}
        </p>
      }
    >
      <Panel>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="font-manrope text-base font-bold text-[#17173A]">Frequency cap</h3>
            <p className="mt-1 font-manrope text-sm text-[#6F6F8D]">
              Skip frequency capping for this campaign{" "}
              <a href="#" className="font-bold text-[#2F68E5] hover:underline">
                Learn more.
              </a>
            </p>
          </div>
          <Switch
            checked={values.skipFrequencyCap}
            onCheckedChange={(v) => onChange({ skipFrequencyCap: v })}
            className="mt-1 shrink-0 data-[state=checked]:bg-[#00C48C]"
          />
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
      </Panel>

      <div className="mt-5">
        <Panel>
          <h3 className="font-manrope text-base font-bold text-[#17173A]">When to send</h3>

          <div className="mt-4 flex flex-wrap items-center gap-x-10 gap-y-3">
            {MODES.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => onChange({ mode: m.id })}
                className="flex items-center gap-2.5 text-left"
              >
                <Radio checked={values.mode === m.id} />
                <span
                  className={cn(
                    "font-manrope text-sm",
                    values.mode === m.id
                      ? "font-semibold text-[#17173A]"
                      : "font-medium text-[#6F6F8D]"
                  )}
                >
                  {m.label}
                </span>
                {m.info && (
                  <span title={m.info} className="inline-grid place-items-center text-[#8A8AA3]">
                    <Info className="size-4" strokeWidth={2} />
                  </span>
                )}
              </button>
            ))}
          </div>

          {values.mode === "now" && (
            <p className="mt-5 font-manrope text-sm leading-5 text-[#6F6F8D]">
              This campaign goes out as soon as you hit Launch. Nothing is queued, so there's no
              window to pull it back in.
            </p>
          )}

          {values.mode === "later" && (
            <div className="mt-5 max-w-[360px]">
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
              <p className="font-manrope text-sm leading-5 text-[#6F6F8D]">
                Splits the audience into equal batches and spaces them out, so a bad subject line
                doesn't reach the whole list before you can stop it.
              </p>
              <div className="mt-4 flex flex-wrap items-end gap-4">
                <div className="w-[200px]">
                  <label className="mb-1.5 block font-manrope text-sm font-semibold text-[#17173A]">
                    Number of batches
                  </label>
                  <select
                    value={values.sliceBatches}
                    onChange={(e) => onChange({ sliceBatches: Number(e.target.value) })}
                    className={fieldClass}
                  >
                    {SLICE_BATCHES.map((n) => (
                      <option key={n} value={n}>
                        {n} batches
                      </option>
                    ))}
                  </select>
                </div>
                <div className="w-[200px]">
                  <label className="mb-1.5 block font-manrope text-sm font-semibold text-[#17173A]">
                    Gap between batches
                  </label>
                  <select
                    value={values.sliceGapMins}
                    onChange={(e) => onChange({ sliceGapMins: Number(e.target.value) })}
                    className={fieldClass}
                  >
                    {SLICE_GAPS.map((n) => (
                      <option key={n} value={n}>
                        {n} minutes
                      </option>
                    ))}
                  </select>
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
            <div className="mt-5 max-w-[360px]">
              <label className="mb-1.5 block font-manrope text-sm font-semibold text-[#17173A]">
                Delivery window
              </label>
              <select
                value={values.optimizeWindow}
                onChange={(e) => onChange({ optimizeWindow: e.target.value })}
                className={fieldClass}
              >
                {OPTIMIZE_WINDOWS.map((w) => (
                  <option key={w}>{w}</option>
                ))}
              </select>
              <p className="mt-1.5 font-manrope text-xs leading-[18px] text-[#6F6F8D]">
                Each contact is sent at the hour they've historically opened, inside this window.
                Contacts without enough history fall back to your account's best-performing hour.
              </p>
            </div>
          )}
        </Panel>
      </div>
    </StepCard>
  );
}
