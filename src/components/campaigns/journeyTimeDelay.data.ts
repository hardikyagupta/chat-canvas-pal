/**
 * "Time Delay" flow-control node — five separate, mutually exclusive ways
 * to decide when the next step happens. Capabilities per the reference
 * screenshots' "Wait for" dropdown; each mode shows only its own field(s).
 */

export type TimeDelayMode =
  | "immediately"
  | "fixed_period"
  | "specific_datetime"
  | "specific_day_of_week"
  | "specific_time_of_day";

export type FixedPeriodUnit = "minutes" | "hours" | "days" | "weeks" | "months";

export const FIXED_PERIOD_UNIT_LABELS: Record<FixedPeriodUnit, string> = {
  minutes: "minutes",
  hours: "hours",
  days: "days",
  weeks: "weeks",
  months: "months",
};

export type Timezone = "recipient" | "account";

export const TIMEZONE_LABELS: Record<Timezone, string> = {
  recipient: "Recipient's Local Timezone",
  account: "Account Timezone",
};

export const WEEKDAYS = [
  { id: "mon", label: "Mon" },
  { id: "tue", label: "Tue" },
  { id: "wed", label: "Wed" },
  { id: "thu", label: "Thu" },
  { id: "fri", label: "Fri" },
  { id: "sat", label: "Sat" },
  { id: "sun", label: "Sun" },
] as const;

export type Weekday = (typeof WEEKDAYS)[number]["id"];

export interface TimeDelaySetting {
  mode: TimeDelayMode;
  fixedAmount: number;
  fixedUnit: FixedPeriodUnit;
  date: string; // yyyy-mm-dd, for specific_datetime
  time: string; // HH:MM, for specific_datetime and specific_time_of_day
  timezone: Timezone;
  weekdays: Weekday[];
}

export const DEFAULT_TIME_DELAY: TimeDelaySetting = {
  mode: "immediately",
  fixedAmount: 1,
  fixedUnit: "days",
  date: "",
  time: "",
  timezone: "recipient",
  weekdays: [],
};

/** Best-effort reverse of describeTimeDelay's "Wait N unit" phrasing — turns
 *  a canvas-displayed wait label (e.g. "Wait 1 hour", "Wait 3 days") back
 *  into a real, editable TimeDelaySetting. Used to give a Wait step created
 *  by the AI journey flow or "Use template" (which only ever produce a
 *  display string, not a structured setting) something genuine to reopen to
 *  — otherwise clicking one back open would show "Immediately" instead of
 *  the duration the canvas already displays. Falls back to the default
 *  ("Immediately") for any label that doesn't match this shape. */
export function timeDelaySettingFromLabel(label: string): TimeDelaySetting {
  const match = /(\d+)\s*(minute|hour|day|week|month)/i.exec(label);
  if (!match) return DEFAULT_TIME_DELAY;
  const amount = Number(match[1]);
  const unit = `${match[2].toLowerCase()}s` as FixedPeriodUnit;
  return { ...DEFAULT_TIME_DELAY, mode: "fixed_period", fixedAmount: amount, fixedUnit: unit };
}

/** Whether the setting has everything it needs to be saved. */
export function isTimeDelayValid(s: TimeDelaySetting): boolean {
  switch (s.mode) {
    case "immediately":
      return true;
    case "fixed_period":
      return s.fixedAmount > 0;
    case "specific_datetime":
      return s.date !== "" && s.time !== "";
    case "specific_day_of_week":
      return s.weekdays.length > 0;
    case "specific_time_of_day":
      return s.time !== "";
  }
}

function formatTime(time: string): string {
  const [hStr, mStr] = time.split(":");
  const h = Number(hStr);
  const m = Number(mStr);
  if (Number.isNaN(h) || Number.isNaN(m)) return time;
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${period}`;
}

function formatDate(date: string): string {
  const parsed = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return date;
  return parsed.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

/** The sentence shown on the canvas node once saved, e.g. "Wait 2 days". */
export function describeTimeDelay(s: TimeDelaySetting): string {
  switch (s.mode) {
    case "immediately":
      return "Continue immediately";
    case "fixed_period":
      return `Wait ${s.fixedAmount} ${FIXED_PERIOD_UNIT_LABELS[s.fixedUnit]}`;
    case "specific_datetime":
      return `Wait until ${formatDate(s.date)} at ${formatTime(s.time)}`;
    case "specific_day_of_week": {
      const labels = WEEKDAYS.filter((w) => s.weekdays.includes(w.id)).map((w) => w.label);
      return `Wait until ${labels.join(", ")}`;
    }
    case "specific_time_of_day":
      return `Wait until ${formatTime(s.time)}`;
  }
}
