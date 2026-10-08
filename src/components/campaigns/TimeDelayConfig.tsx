import { useState } from "react";
import { Clock, X } from "lucide-react";
import DateTimePicker from "./DateTimePicker";
import Dropdown from "./Dropdown";
import {
  DEFAULT_TIME_DELAY,
  describeTimeDelay,
  FIXED_PERIOD_UNIT_LABELS,
  isTimeDelayValid,
  TIMEZONE_LABELS,
  WEEKDAYS,
  type FixedPeriodUnit,
  type TimeDelayMode,
  type TimeDelaySetting,
  type Timezone,
  type Weekday,
} from "./journeyTimeDelay.data";

const MODE_LABELS: Record<TimeDelayMode, string> = {
  immediately: "Immediately",
  fixed_period: "A fixed period",
  specific_datetime: "A specific date and time",
  specific_day_of_week: "A specific day of the week",
  specific_time_of_day: "A specific time of the day",
};

const MODE_ORDER: TimeDelayMode[] = [
  "immediately",
  "fixed_period",
  "specific_datetime",
  "specific_day_of_week",
  "specific_time_of_day",
];

/**
 * "Time Delay" settings — opens in place of the node catalog the moment
 * Time Delay is dragged or clicked (see JourneyNodeDrawer), since it's the
 * first flow-control node that needs real configuration before it can land
 * on the canvas. Five mutually exclusive "wait for" modes (Screenshot 1);
 * only the selected mode's own field(s) show (Screenshot 2's progressive-
 * disclosure spirit, not its literal combined layout — see chat for why).
 */
export default function TimeDelayConfig({
  initial,
  onCancel,
  onSave,
}: {
  /** Pass the node's previously-saved setting to reopen it for editing. */
  initial?: TimeDelaySetting;
  onCancel: () => void;
  /** Called with the sentence to show on the canvas node (e.g. "Wait 2
   *  days") and the raw setting, so it can be persisted for re-editing. */
  onSave: (nodeLabel: string, setting: TimeDelaySetting) => void;
}) {
  const [setting, setSetting] = useState<TimeDelaySetting>(initial ?? DEFAULT_TIME_DELAY);

  const toggleWeekday = (day: Weekday) => {
    setSetting((s) => ({
      ...s,
      weekdays: s.weekdays.includes(day) ? s.weekdays.filter((d) => d !== day) : [...s.weekdays, day],
    }));
  };

  const valid = isTimeDelayValid(setting);

  return (
    <>
      {/* Header */}
      <div className="flex items-start gap-3 px-5 pt-5">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[#FCEBD2]">
          <Clock className="h-[18px] w-[18px] text-[#B8791F]" strokeWidth={2} />
        </span>
        <div className="flex-1">
          <h2 className="font-manrope text-[16px] font-bold leading-tight text-[#17173A]">
            Time Delay
          </h2>
          <p className="mt-1 font-manrope text-[12.5px] text-[#6F6F8D]">
            When should the next step happen?
          </p>
        </div>
        <button
          type="button"
          aria-label="Cancel"
          onClick={onCancel}
          className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center text-[#6F6F8D] transition-colors hover:text-[#17173A]"
        >
          <X className="h-5 w-5" strokeWidth={2} />
        </button>
      </div>

      <div className="mt-3 border-t border-[#EBEBF5]" />

      {/* Body */}
      <div className="scroll-slim min-h-0 flex-1 overflow-y-auto px-5 py-4">
        <label className="block font-manrope text-[13.5px] font-bold text-[#17173A]">
          Wait for
        </label>
        <Dropdown
          value={setting.mode}
          options={MODE_ORDER.map((mode) => ({ value: mode, label: MODE_LABELS[mode] }))}
          onChange={(v) => setSetting((s) => ({ ...s, mode: v as TimeDelayMode }))}
          widthClass="mt-2 w-full"
          heightClass="h-11"
        />

        {setting.mode === "immediately" && (
          <p className="mt-3 font-manrope text-[13px] text-[#6F6F8D]">
            The next step happens right away, with no wait.
          </p>
        )}

        {setting.mode === "fixed_period" && (
          <div className="mt-4">
            <label className="block font-manrope text-[13.5px] font-bold text-[#17173A]">
              How long should we wait?
            </label>
            <div className="mt-2 flex items-center gap-2">
              <input
                type="number"
                min={1}
                value={setting.fixedAmount}
                onChange={(e) =>
                  setSetting((s) => ({ ...s, fixedAmount: Math.max(1, Number(e.target.value) || 1) }))
                }
                className="h-10 w-20 rounded-md border border-[#DDE2EE] bg-white px-3 text-center font-manrope text-[14px] text-[#17173A] outline-none focus:border-[#B9C4DD]"
              />
              <Dropdown
                value={setting.fixedUnit}
                options={Object.entries(FIXED_PERIOD_UNIT_LABELS).map(([value, label]) => ({ value, label }))}
                onChange={(v) => setSetting((s) => ({ ...s, fixedUnit: v as FixedPeriodUnit }))}
                widthClass="flex-1"
              />
            </div>
          </div>
        )}

        {setting.mode === "specific_datetime" && (
          <div className="mt-4">
            <label className="block font-manrope text-[13.5px] font-bold text-[#17173A]">
              On this date and time
            </label>
            <div className="mt-2">
              <DateTimePicker
                date={setting.date}
                time={setting.time}
                onChange={(d, t) => setSetting((s) => ({ ...s, date: d, time: t }))}
              />
            </div>
            <TimezoneSelect value={setting.timezone} onChange={(tz) => setSetting((s) => ({ ...s, timezone: tz }))} />
          </div>
        )}

        {setting.mode === "specific_day_of_week" && (
          <div className="mt-4">
            <label className="block font-manrope text-[13.5px] font-bold text-[#17173A]">
              On these days
            </label>
            <div className="mt-2 flex flex-wrap gap-2">
              {WEEKDAYS.map((day) => {
                const selected = setting.weekdays.includes(day.id);
                return (
                  <button
                    key={day.id}
                    type="button"
                    onClick={() => toggleWeekday(day.id)}
                    className={`h-9 w-12 rounded-md border font-manrope text-[13px] font-semibold transition-colors ${
                      selected
                        ? "border-[#2F68E5] bg-[#EAF1FF] text-[#143F93]"
                        : "border-[#DDE2EE] bg-white text-[#17173A] hover:border-[#B9C4DD]"
                    }`}
                  >
                    {day.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {setting.mode === "specific_time_of_day" && (
          <div className="mt-4">
            <label className="block font-manrope text-[13.5px] font-bold text-[#17173A]">
              At this time
            </label>
            <input
              type="time"
              value={setting.time}
              onChange={(e) => setSetting((s) => ({ ...s, time: e.target.value }))}
              className="mt-2 h-10 w-[160px] rounded-md border border-[#DDE2EE] bg-white px-3 font-manrope text-[14px] text-[#17173A] outline-none focus:border-[#B9C4DD]"
            />
            <TimezoneSelect value={setting.timezone} onChange={(tz) => setSetting((s) => ({ ...s, timezone: tz }))} />
          </div>
        )}
      </div>

      <div className="border-t border-[#EBEBF5]" />

      {/* Footer */}
      <div className="flex items-center justify-end px-5 py-4">
        <button
          type="button"
          disabled={!valid}
          onClick={() => valid && onSave(describeTimeDelay(setting), setting)}
          className="dc-btn dc-btn-primary"
        >
          Save
        </button>
      </div>
    </>
  );
}

function TimezoneSelect({ value, onChange }: { value: Timezone; onChange: (v: Timezone) => void }) {
  return (
    <div className="mt-3">
      <label className="block font-manrope text-[12.5px] font-medium text-[#6F6F8D]">Timezone</label>
      <Dropdown
        value={value}
        options={Object.entries(TIMEZONE_LABELS).map(([value, label]) => ({ value, label }))}
        onChange={(v) => onChange(v as Timezone)}
        widthClass="mt-1.5 w-full"
      />
    </div>
  );
}
