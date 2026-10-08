import { useState, type ReactNode } from "react";
import { ChevronDown, Info, Plus, Settings, Trash2, X } from "lucide-react";
import DateTimePicker from "./DateTimePicker";
import Dropdown from "./Dropdown";

export interface JourneyDates {
  /** Formatted for the header, e.g. "Oct 16, 2025 10:40 AM". */
  startLabel: string;
  /** Formatted for the header, e.g. "Nov 2, 2025 6:00 PM" or "Never ending". */
  endLabel: string;
}

function formatDateTime(date: string, time: string): string {
  if (!date) return "";
  const parsed = new Date(`${date}T${time || "00:00"}`);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

const inputCls =
  "h-10 w-full rounded-md border border-transparent bg-[#F7F7FB] px-3 font-manrope text-[13.5px] text-[#17173A] outline-none placeholder:text-[#9494AE] focus:border-[#B9C4DD] focus:bg-white";

/** A labeled field wrapper — consistent label/required-asterisk/helper
 *  treatment for every input in this drawer. */
function Field({
  label,
  required,
  children,
  className = "",
}: {
  label: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="mb-2 block font-manrope text-[13px] font-bold text-[#17173A]">
        {label}
        {required && <span className="ml-0.5 text-[#E4574C]">*</span>}
      </label>
      {children}
    </div>
  );
}

/**
 * One collapsible settings section — no card/box, just a header row (title,
 * one-line description) that's always visible; clicking it (or the
 * chevron) expands/collapses the body below. Sections are told apart by a
 * single divider line between them (see the parent's `divide-y`), not a
 * border around each one.
 */
function SettingsSection({
  title,
  description,
  open,
  onToggleOpen,
  children,
}: {
  title: string;
  description: string;
  open: boolean;
  onToggleOpen: () => void;
  children: ReactNode;
}) {
  return (
    <div>
      <button
        type="button"
        onClick={onToggleOpen}
        aria-expanded={open}
        className="flex w-full items-start gap-3 py-4 text-left"
      >
        <div className="flex-1">
          <h3 className="font-manrope text-[14.5px] font-bold text-[#17173A]">{title}</h3>
          <p className="mt-0.5 font-manrope text-[12.5px] leading-[17px] text-[#6F6F8D]">{description}</p>
        </div>
        <ChevronDown
          className={`mt-1 h-4 w-4 shrink-0 text-[#6F6F8D] transition-transform duration-150 ${open ? "rotate-180" : ""}`}
          strokeWidth={2}
        />
      </button>
      {open && <div className="pb-4">{children}</div>}
    </div>
  );
}

const CHANNEL_OPTIONS = ["Email", "SMS", "WhatsApp", "Push", "Voice", "Viber", "Zalo", "RCS"];
const GOAL_OPTIONS = ["Purchase", "Signup completed", "Demo Date", "Cart checkout", "Subscription started"];
const DND_DAYS = ["S", "M", "T", "W", "T", "F", "S"];

let rowSeq = 0;
interface FrequencyCapRow {
  id: string;
  channel: string;
  perDay: string;
  perWeek: string;
  perMonth: string;
}

/**
 * "Settings" — the journey-level configuration drawer, opened from the
 * builder header and sharing the same right-hand column every other panel
 * here does (trigger drawer, node settings, co-marketer, keyboard
 * shortcuts) — JourneyBuilder closes all of those before opening this one,
 * and vice versa, so only one is ever visible at a time.
 *
 * Six sections, each its own collapsible card: Journey details, Frequency
 * cap, Journey goal, Control group, Do not disturb, Product collection.
 * The Journey details date range and the Journey goal are the two pieces
 * wired back out to the header (via `onSave`) — together they gate
 * "Publish journey" (see JourneyBuilder's journeyDates/journeyGoal) — every
 * other section is mocked, kept-open config for this demo, the same way
 * the rest of this app's "AI" surfaces are scripted rather than backed by
 * a real service (see ChatInterface.tsx).
 */
export default function JourneySettingsDrawer({
  initial,
  initialGoal = null,
  onClose,
  onSave,
}: {
  initial: JourneyDates | null;
  /** The previously saved goal conversion, if any — unset shows the
   *  dropdown's placeholder rather than defaulting to the first option, so
   *  "not yet chosen" stays distinguishable from "chose the first one". */
  initialGoal?: string | null;
  onClose: () => void;
  /** Passing null for `dates` clears the header's date row entirely;
   *  `goal` is null the same way until a goal's actually been picked. */
  onSave: (dates: JourneyDates | null, goal: string | null) => void;
}) {
  const [openSection, setOpenSection] = useState<string | null>("details");
  const toggle = (key: string) => setOpenSection((cur) => (cur === key ? null : key));

  // Journey details
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [neverEnding, setNeverEnding] = useState(initial ? initial.endLabel === "Never ending" : true);
  const [endDate, setEndDate] = useState("");
  const [endTime, setEndTime] = useState("18:00");
  const [tags, setTags] = useState<string[]>([]);
  const [tagDraft, setTagDraft] = useState("");
  const addTag = () => {
    const t = tagDraft.trim();
    if (!t || tags.length >= 5 || tags.includes(t)) return;
    setTags((prev) => [...prev, t]);
    setTagDraft("");
  };

  // Frequency cap
  const [freqRows, setFreqRows] = useState<FrequencyCapRow[]>([
    { id: `fc${++rowSeq}`, channel: "SMS", perDay: "1", perWeek: "7", perMonth: "8" },
  ]);
  const addFreqRow = () =>
    setFreqRows((prev) => [...prev, { id: `fc${++rowSeq}`, channel: "Email", perDay: "", perWeek: "", perMonth: "" }]);
  const updateFreqRow = (id: string, patch: Partial<FrequencyCapRow>) =>
    setFreqRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  const removeFreqRow = (id: string) => setFreqRows((prev) => prev.filter((r) => r.id !== id));

  // Journey goal
  const [goalConversion, setGoalConversion] = useState(initialGoal ?? "");
  const [specifyParams, setSpecifyParams] = useState(false);
  const [paramName, setParamName] = useState("");
  const [windowValue, setWindowValue] = useState("1");
  const [windowUnit, setWindowUnit] = useState("Days");
  const [revenueParam, setRevenueParam] = useState("");

  // Control group
  const [controlMode, setControlMode] = useState<"percentage" | "list">("percentage");
  const [controlPct, setControlPct] = useState(10);
  const [controlListName, setControlListName] = useState("");

  // Do not disturb
  const [dndDays, setDndDays] = useState<boolean[]>(DND_DAYS.map(() => true));
  const [dndStart, setDndStart] = useState("13:00");
  const [dndEnd, setDndEnd] = useState("09:00");

  const canSave = startDate !== "" && (neverEnding || endDate !== "") && goalConversion !== "";

  const handleSave = () => {
    if (!canSave) return;
    const startLabel = formatDateTime(startDate, startTime);
    const endLabel = neverEnding ? "Never ending" : formatDateTime(endDate, endTime);
    onSave({ startLabel, endLabel }, goalConversion);
    onClose();
  };

  return (
    <div
      role="complementary"
      aria-label="Journey settings"
      className="jc-drawer-panel flex h-full w-[560px] max-w-[94vw] shrink-0 flex-col overflow-hidden rounded-lg bg-white shadow-[0px_1px_3px_rgba(23,23,58,0.06)] duration-200 animate-in fade-in slide-in-from-right-3"
    >
      {/* Header */}
      <div className="flex items-start gap-3 px-6 pt-6">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[#EAF1FF]">
          <Settings className="h-[18px] w-[18px] text-[#2F68E5]" strokeWidth={2} />
        </span>
        <div className="flex-1">
          <h2 className="font-manrope text-[16px] font-bold leading-tight text-[#17173A]">Journey settings</h2>
          <p className="mt-1 font-manrope text-[12.5px] text-[#6F6F8D]">
            Everything that governs how this journey runs, in one place.
          </p>
        </div>
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center text-[#6F6F8D] transition-colors hover:text-[#17173A]"
        >
          <X className="h-5 w-5" strokeWidth={2} />
        </button>
      </div>

      <div className="mt-4 border-t border-[#EBEBF5]" />

      {/* Body — one card per section, only one's body open at a time. */}
      <div className="scroll-slim flex min-h-0 flex-1 flex-col divide-y divide-[#EBEBF5] overflow-y-auto px-6">
        <SettingsSection
          title="Journey details"
          description="Basic details about this journey — when it runs and how it's labeled."
          open={openSection === "details"}
          onToggleOpen={() => toggle("details")}
        >
          <div className="grid grid-cols-2 gap-4">
            <Field label="Start date" required>
              <DateTimePicker
                date={startDate}
                time={startTime}
                onChange={(d, t) => {
                  setStartDate(d);
                  setStartTime(t);
                }}
              />
            </Field>
            <Field label="End date">
              <Dropdown
                value={neverEnding ? "never" : "specific"}
                options={[
                  { value: "never", label: "Never ending" },
                  { value: "specific", label: "Specific date" },
                ]}
                onChange={(v) => setNeverEnding(v === "never")}
                widthClass="w-full"
              />
            </Field>
          </div>

          {!neverEnding && (
            <div className="mt-3">
              <DateTimePicker
                date={endDate}
                time={endTime}
                onChange={(d, t) => {
                  setEndDate(d);
                  setEndTime(t);
                }}
              />
            </div>
          )}

          <Field label="Add tags" className="mt-4">
            <div className={`${inputCls} flex h-auto min-h-10 flex-wrap items-center gap-1.5 py-1.5`}>
              {tags.map((t) => (
                <span
                  key={t}
                  className="flex items-center gap-1 rounded-full bg-[#EAF1FF] px-2.5 py-1 font-manrope text-[12px] font-semibold text-[#2F68E5]"
                >
                  {t}
                  <button type="button" aria-label={`Remove ${t}`} onClick={() => setTags((p) => p.filter((x) => x !== t))}>
                    <X className="h-3 w-3" strokeWidth={2.5} />
                  </button>
                </span>
              ))}
              {tags.length < 5 && (
                <input
                  value={tagDraft}
                  onChange={(e) => setTagDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addTag();
                    }
                  }}
                  placeholder={tags.length === 0 ? "Select up to 5 tags" : ""}
                  className="min-w-[80px] flex-1 border-none bg-transparent text-[13.5px] outline-none placeholder:text-[#9494AE]"
                />
              )}
            </div>
          </Field>
          <p className="mt-1.5 flex items-center gap-1 font-manrope text-[11.5px] text-[#9494AE]">
            <Info className="h-3 w-3 shrink-0" strokeWidth={2} />
            Tags help you find and filter this journey later — they don't change how it runs.
          </p>
        </SettingsSection>

        <SettingsSection
          title="Frequency cap"
          description="Limit how many messages one person can get from this journey."
          open={openSection === "frequency"}
          onToggleOpen={() => toggle("frequency")}
        >
          <div className="grid grid-cols-[1.3fr_1fr_1fr_1fr_32px] items-end gap-2">
            <span className="font-manrope text-[11px] font-bold uppercase tracking-[0.04em] text-[#6F6F8D]">
              Channel
            </span>
            <span className="font-manrope text-[11px] font-bold uppercase tracking-[0.04em] text-[#6F6F8D]">
              Per day
            </span>
            <span className="font-manrope text-[11px] font-bold uppercase tracking-[0.04em] text-[#6F6F8D]">
              Per week
            </span>
            <span className="font-manrope text-[11px] font-bold uppercase tracking-[0.04em] text-[#6F6F8D]">
              Per month
            </span>
            <span />
          </div>
          {freqRows.map((row) => (
            <div key={row.id} className="mt-2 grid grid-cols-[1.3fr_1fr_1fr_1fr_32px] items-center gap-2">
              <Dropdown
                value={row.channel}
                options={CHANNEL_OPTIONS}
                onChange={(v) => updateFreqRow(row.id, { channel: v })}
                widthClass="w-full"
              />
              <input
                inputMode="numeric"
                value={row.perDay}
                onChange={(e) => updateFreqRow(row.id, { perDay: e.target.value })}
                className={inputCls}
              />
              <input
                inputMode="numeric"
                value={row.perWeek}
                onChange={(e) => updateFreqRow(row.id, { perWeek: e.target.value })}
                className={inputCls}
              />
              <input
                inputMode="numeric"
                value={row.perMonth}
                onChange={(e) => updateFreqRow(row.id, { perMonth: e.target.value })}
                className={inputCls}
              />
              <button
                type="button"
                aria-label="Remove channel"
                onClick={() => removeFreqRow(row.id)}
                className="grid h-9 w-9 place-items-center rounded-md text-[#6F6F8D] transition-colors hover:bg-[#FBEAEA] hover:text-[#C4453B]"
              >
                <Trash2 className="h-4 w-4" strokeWidth={1.9} />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addFreqRow}
            className="mt-3 flex items-center gap-1.5 rounded-md border border-dashed border-[#DDE2EE] px-3 py-2 font-manrope text-[12.5px] font-bold uppercase tracking-[0.03em] text-[#2F68E5] transition-colors hover:bg-[#F5F9FF]"
          >
            <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
            Add channel
          </button>
        </SettingsSection>

        <SettingsSection
          title="Journey goal"
          description="Track the event that counts as a conversion for this journey."
          open={openSection === "goal"}
          onToggleOpen={() => toggle("goal")}
        >
          <Field label="Goal conversion" required>
            <Dropdown
              value={goalConversion}
              options={GOAL_OPTIONS}
              onChange={setGoalConversion}
              placeholder="Select a goal"
              widthClass="w-full"
            />
          </Field>

          <label className="mt-3 flex items-center gap-2 font-manrope text-[13px] font-medium text-[#17173A]">
            <input
              type="checkbox"
              checked={specifyParams}
              onChange={(e) => setSpecifyParams(e.target.checked)}
              className="h-4 w-4 rounded border-[#DDE2EE] accent-[#2F68E5]"
            />
            Specify parameters (optional)
          </label>
          {specifyParams && (
            <input
              value={paramName}
              onChange={(e) => setParamName(e.target.value)}
              placeholder="e.g. product_id"
              className={`${inputCls} mt-2`}
            />
          )}

          <div className="mt-4 grid grid-cols-2 gap-4">
            <Field label="Conversion window" required>
              <div className="flex gap-1.5">
                <input
                  inputMode="numeric"
                  value={windowValue}
                  onChange={(e) => setWindowValue(e.target.value)}
                  className={`${inputCls} w-16 shrink-0`}
                />
                <Dropdown value={windowUnit} options={["Hours", "Days", "Weeks"]} onChange={setWindowUnit} widthClass="w-full" />
              </div>
            </Field>
            <Field label="Revenue parameter">
              <input
                value={revenueParam}
                onChange={(e) => setRevenueParam(e.target.value)}
                placeholder="Revenue param"
                className={inputCls}
              />
            </Field>
          </div>
        </SettingsSection>

        <SettingsSection
          title="Control group"
          description="Hold out a slice of the audience so you can measure this journey's lift."
          open={openSection === "control"}
          onToggleOpen={() => toggle("control")}
        >
          <div className="flex items-center gap-5">
            <label className="flex items-center gap-2 font-manrope text-[13.5px] font-semibold text-[#17173A]">
              <input
                type="radio"
                checked={controlMode === "percentage"}
                onChange={() => setControlMode("percentage")}
                className="h-4 w-4 accent-[#2F68E5]"
              />
              By percentage
            </label>
            <label className="flex items-center gap-2 font-manrope text-[13.5px] font-semibold text-[#17173A]">
              <input
                type="radio"
                checked={controlMode === "list"}
                onChange={() => setControlMode("list")}
                className="h-4 w-4 accent-[#2F68E5]"
              />
              By list
            </label>
          </div>

          {controlMode === "percentage" ? (
            <div className="mt-4">
              <p className="font-manrope text-[13px] font-medium text-[#17173A]">
                Set control group percentage from the journey
              </p>
              <input
                type="range"
                min={0}
                max={50}
                value={controlPct}
                onChange={(e) => setControlPct(Number(e.target.value))}
                className="mt-3 w-full accent-[#2F68E5]"
              />
              <div className="mt-2 flex items-center justify-between">
                <div className="rounded-md bg-[#FFF1E9] px-2.5 py-1 font-manrope text-[12.5px] font-bold text-[#B8571F]">
                  Control group {controlPct}%
                </div>
                <div className="rounded-md bg-[#EAF1FF] px-2.5 py-1 font-manrope text-[12.5px] font-bold text-[#2F68E5]">
                  Reachable contacts {100 - controlPct}%
                </div>
              </div>
            </div>
          ) : (
            <Field label="Control group list" className="mt-4">
              <input
                value={controlListName}
                onChange={(e) => setControlListName(e.target.value)}
                placeholder="Select a list"
                className={inputCls}
              />
            </Field>
          )}
        </SettingsSection>

        <SettingsSection
          title="Do not disturb (DND)"
          description="Pause sends from this journey during quiet hours."
          open={openSection === "dnd"}
          onToggleOpen={() => toggle("dnd")}
        >
          <p className="font-manrope text-[13px] font-bold text-[#17173A]">Select DND days</p>
          <div className="mt-2 flex gap-1.5">
            {DND_DAYS.map((d, i) => (
              <button
                key={i}
                type="button"
                aria-pressed={dndDays[i]}
                onClick={() => setDndDays((prev) => prev.map((v, vi) => (vi === i ? !v : v)))}
                className={`grid h-9 w-9 place-items-center rounded-md font-manrope text-[13px] font-bold transition-colors ${
                  dndDays[i] ? "bg-[#2F68E5] text-white" : "bg-[#F7F7FB] text-[#9494AE]"
                }`}
              >
                {d}
              </button>
            ))}
          </div>

          <Field label="Quiet hours" className="mt-4">
            <div className="flex items-center gap-2">
              <input type="time" value={dndStart} onChange={(e) => setDndStart(e.target.value)} className={inputCls} />
              <span className="font-manrope text-[13px] text-[#6F6F8D]">to</span>
              <input type="time" value={dndEnd} onChange={(e) => setDndEnd(e.target.value)} className={inputCls} />
            </div>
          </Field>
          <p className="mt-1.5 flex items-center gap-1 font-manrope text-[11.5px] text-[#9494AE]">
            <Info className="h-3 w-3 shrink-0" strokeWidth={2} />
            Applies to every selected day. If the end time is earlier than the start time, it continues into the next day.
          </p>
        </SettingsSection>

        <SettingsSection
          title="Product collection"
          description="How products get grouped into a single journey entry."
          open={openSection === "product"}
          onToggleOpen={() => toggle("product")}
        >
          <ol className="list-decimal space-y-2 pl-4 font-manrope text-[13px] leading-[19px] text-[#6F6F8D]">
            <li>Only activates once a profile does something — lists and segments can't trigger it.</li>
            <li>Multiple activities close together (e.g. several "Add to cart" events) are folded into one entry.</li>
          </ol>
        </SettingsSection>
      </div>

      <div className="border-t border-[#EBEBF5]" />

      {/* Footer */}
      <div className="flex items-center justify-end gap-3 px-6 py-4">
        <button type="button" onClick={onClose} className="dc-btn dc-btn-secondary">
          Cancel
        </button>
        <button type="button" disabled={!canSave} onClick={handleSave} className="dc-btn dc-btn-primary">
          Save
        </button>
      </div>
    </div>
  );
}
