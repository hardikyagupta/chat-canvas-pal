import { useState } from "react";
import { Activity as ActivityIcon, ArrowLeft, Plus, X } from "lucide-react";
import Dropdown from "./Dropdown";
import {
  ACTIVITY_DEFINITIONS,
  activitiesForCategory,
  CONDITION_CATEGORIES,
  DEFAULT_FREQUENCY,
  OPERATORS_BY_TYPE,
  type ActivityAttribute,
  type ActivityDefinition,
  type ConditionCategory,
  type CustomDurationUnit,
  type FrequencyMode,
  type FrequencySetting,
} from "./journeyActivities.data";

/**
 * "Activity" trigger configuration — the second step inside the trigger
 * drawer once "Activity" is picked from the grid. Three parts, revealed
 * progressively so the form doesn't open fully expanded:
 *  1. which activity/activities (required) — a category + activity pick per
 *     row; add more rows to start the journey from any of several events
 *     ("OR" only — two distinct events can't literally happen at once, so
 *     there's no "AND" here, unlike the conditions below)
 *  2. optional conditions on the selected activities' shared payload fields
 *     (attribute/operator/value), combinable with AND/OR once there's more
 *     than one
 *  3. optional frequency (how often it can re-fire per profile)
 *
 * Interaction/config shape is modeled on references the user shared of
 * another product's automation trigger drawer — restyled entirely in this
 * app's own components/spacing/colors, not a visual copy. Two things from
 * that reference are deliberately left out: the separate "Cancel" button
 * (redundant with this drawer's own close) and the "we couldn't find
 * recent instances — send one?" banner (needs live event data this
 * prototype doesn't have).
 */

interface ActivityRow {
  key: string;
  category: ConditionCategory;
  activityId: string | null;
}

export interface Condition {
  key: string;
  attributeId: string;
  operator: string;
  value: string;
}

let rowSeq = 0;
const newActivityRow = (): ActivityRow => ({ key: `a${++rowSeq}`, category: "behaviour", activityId: null });
const newCondition = (attribute: ActivityAttribute): Condition => ({
  key: `c${++rowSeq}`,
  attributeId: attribute.id,
  operator: OPERATORS_BY_TYPE[attribute.type][0].value,
  value: "",
});

const FREQUENCY_LABELS: Record<FrequencyMode, string> = {
  every_time: "Every time",
  first_time: "First time only",
  once_per_day: "Once per day",
  once_per_week: "Once per week",
  once_per_month: "Once per month",
  custom: "Custom duration",
};

const FREQUENCY_ORDER: FrequencyMode[] = [
  "every_time",
  "first_time",
  "once_per_day",
  "once_per_week",
  "once_per_month",
  "custom",
];

const DURATION_UNIT_LABELS: Record<CustomDurationUnit, string> = {
  minutes: "minutes",
  hours: "hours",
  days: "days",
  weeks: "weeks",
  months: "months",
};

/** Attributes available for conditions: the union across every selected
 *  activity's own payload fields, deduped by id (first occurrence wins).
 *  Exported for JourneyBuilder to compute the same union once a trigger's
 *  saved, for the Email node's "User activity payload" personalize menu. */
export function unionAttributes(activities: ActivityDefinition[]): ActivityAttribute[] {
  const seen = new Map<string, ActivityAttribute>();
  for (const activity of activities) {
    for (const attr of activity.attributes) {
      if (!seen.has(attr.id)) seen.set(attr.id, attr);
    }
  }
  return Array.from(seen.values());
}

export default function ActivityTriggerConfig({
  onBack,
  onSave,
  onClose,
}: {
  onBack: () => void;
  /** Called with the sentence to show on the canvas node, e.g. "When someone
   *  views a product", plus the picked ActivityDefinition ids (so the rest
   *  of the journey — the Email node's personalize menu — can look up this
   *  trigger's real payload fields later). */
  onSave: (nodeLabel: string, activityIds: string[]) => void;
  /** Closes the whole trigger drawer (not just this step). */
  onClose: () => void;
}) {
  const [activityRows, setActivityRows] = useState<ActivityRow[]>([newActivityRow()]);
  const [matchAll, setMatchAll] = useState(true);
  const [conditions, setConditions] = useState<Condition[]>([]);
  const [frequency, setFrequency] = useState<FrequencySetting>(DEFAULT_FREQUENCY);

  const selectedActivities = activityRows
    .map((r) => ACTIVITY_DEFINITIONS.find((a) => a.id === r.activityId))
    .filter((a): a is ActivityDefinition => !!a);

  const attrs = unionAttributes(selectedActivities);

  const addActivityRow = () => setActivityRows((prev) => [...prev, newActivityRow()]);
  const updateActivityRow = (key: string, patch: Partial<ActivityRow>) =>
    setActivityRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  const removeActivityRow = (key: string) => setActivityRows((prev) => prev.filter((r) => r.key !== key));

  const addCondition = () => {
    if (attrs.length === 0) return;
    setConditions((prev) => [...prev, newCondition(attrs[0])]);
  };
  const updateCondition = (key: string, patch: Partial<Condition>) =>
    setConditions((prev) => prev.map((c) => (c.key === key ? { ...c, ...patch } : c)));
  const removeCondition = (key: string) => setConditions((prev) => prev.filter((c) => c.key !== key));

  const canSave = selectedActivities.length > 0;

  const handleSave = () => {
    if (!canSave) return;
    const verbs = selectedActivities.map((a) => a.nodeLabel).join(" or ");
    onSave(`When someone ${verbs}`, selectedActivities.map((a) => a.id));
  };

  return (
    <>
      {/* Header */}
      <div className="flex items-start gap-3 px-6 pt-6">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[#EAF1FF]">
          <ActivityIcon className="h-[18px] w-[18px] text-[#2F68E5]" strokeWidth={2} />
        </span>
        <div className="flex-1">
          <h2 className="font-manrope text-[17px] font-bold leading-tight text-[#17173A]">
            Activity trigger
          </h2>
          <p className="mt-1 font-manrope text-[13px] text-[#6F6F8D]">
            Choose the activity and, if you like, narrow down when it counts.
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

      {/* Body */}
      <div className="scroll-slim min-h-0 flex-1 overflow-y-auto px-6 py-4">
        {/* 1. Which activity/activities */}
        <div>
          <label className="block font-manrope text-[14px] font-bold text-[#17173A]">
            Which activity should start this journey?
          </label>

          <div className="mt-2 flex flex-col gap-3">
            {activityRows.map((row, i) => {
              const options = activitiesForCategory(row.category);
              const activity = options.find((a) => a.id === row.activityId) ?? null;
              return (
                <div key={row.key}>
                  {i > 0 && (
                    <p className="mb-2 font-manrope text-[11px] font-bold uppercase tracking-[0.06em] text-[#6F6F8D]">
                      Or
                    </p>
                  )}
                  <div className="flex items-center gap-2">
                    <Dropdown
                      value={row.category}
                      options={CONDITION_CATEGORIES.map((c) => ({ value: c.id, label: c.label }))}
                      onChange={(v) =>
                        updateActivityRow(row.key, { category: v as ConditionCategory, activityId: null })
                      }
                      widthClass="w-[140px] shrink-0"
                    />

                    <Dropdown
                      value={row.activityId ?? ""}
                      options={options.map((a) => ({ value: a.id, label: a.label }))}
                      onChange={(v) => updateActivityRow(row.key, { activityId: v || null })}
                      placeholder="Choose an activity…"
                      widthClass="min-w-0 flex-1"
                    />

                    {activityRows.length > 1 && (
                      <button
                        type="button"
                        aria-label="Remove activity"
                        onClick={() => removeActivityRow(row.key)}
                        className="grid h-9 w-9 shrink-0 place-items-center rounded-md text-[#6F6F8D] transition-colors hover:bg-[#F3F6FF] hover:text-[#17173A]"
                      >
                        <X className="h-4 w-4" strokeWidth={2} />
                      </button>
                    )}
                  </div>
                  {activity && (
                    <p className="mt-1.5 font-manrope text-[12.5px] text-[#6F6F8D]">{activity.description}</p>
                  )}
                </div>
              );
            })}
          </div>

          <button
            type="button"
            onClick={addActivityRow}
            className="mt-3 flex items-center gap-1.5 rounded-md border border-dashed border-[#DDE2EE] px-3 py-2 font-manrope text-[13px] font-semibold text-[#2F68E5] transition-colors hover:border-[#B9C4DD] hover:bg-[#F5F9FF]"
          >
            <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
            Add another activity
          </button>
        </div>

        {/* 2. Conditions — only once at least one activity is picked */}
        {selectedActivities.length > 0 && (
          <div className="mt-5 border-t border-[#EBEBF5] pt-5">
            <label className="block font-manrope text-[14px] font-bold text-[#17173A]">
              Only when… <span className="font-normal text-[#6F6F8D]">(optional)</span>
            </label>
            <p className="mt-1 font-manrope text-[12.5px] text-[#6F6F8D]">
              Add conditions to only trigger on matching events.
            </p>

            {conditions.length > 0 && (
              <div className="mt-3 rounded-lg border border-[#DDE2EE] p-3">
                {conditions.length > 1 && (
                  <div className="mb-3 flex items-center gap-2 font-manrope text-[13.5px] text-[#17173A]">
                    Match
                    <Dropdown
                      value={matchAll ? "all" : "any"}
                      options={["all", "any"]}
                      onChange={(v) => setMatchAll(v === "all")}
                      widthClass="w-[84px]"
                      heightClass="h-8"
                    />
                    of these conditions
                  </div>
                )}

                <div className="flex flex-col gap-3">
                  {conditions.map((c, i) => (
                    <div key={c.key}>
                      {i > 0 && (
                        <p className="mb-2 font-manrope text-[11px] font-bold uppercase tracking-[0.06em] text-[#6F6F8D]">
                          {matchAll ? "And" : "Or"}
                        </p>
                      )}
                      <ConditionRow
                        condition={c}
                        attrs={attrs}
                        onChange={(patch) => updateCondition(c.key, patch)}
                        onRemove={() => removeCondition(c.key)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={addCondition}
              className="mt-3 flex items-center gap-1.5 rounded-md border border-dashed border-[#DDE2EE] px-3 py-2 font-manrope text-[13px] font-semibold text-[#143F93] transition-colors hover:border-[#B9C4DD] hover:bg-[#F5F9FF]"
            >
              <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
              {conditions.length === 0 ? "Add a condition" : "Add another condition"}
            </button>
          </div>
        )}

        {/* 3. Frequency */}
        {selectedActivities.length > 0 && (
          <div className="mt-5 border-t border-[#EBEBF5] pt-5">
            <label className="block font-manrope text-[14px] font-bold text-[#17173A]">
              How often should this trigger?
            </label>
            <Dropdown
              value={frequency.mode}
              options={FREQUENCY_ORDER.map((mode) => ({ value: mode, label: FREQUENCY_LABELS[mode] }))}
              onChange={(v) => setFrequency((f) => ({ ...f, mode: v as FrequencyMode }))}
              widthClass="mt-2 w-full"
            />

            {frequency.mode === "custom" && (
              <div className="mt-3 flex items-center gap-2 font-manrope text-[13.5px] text-[#17173A]">
                Once every
                <input
                  type="number"
                  min={1}
                  value={frequency.customAmount}
                  onChange={(e) =>
                    setFrequency((f) => ({ ...f, customAmount: Math.max(1, Number(e.target.value) || 1) }))
                  }
                  className="h-9 w-16 rounded-md border border-[#DDE2EE] bg-white px-2 text-center font-manrope text-[13.5px] outline-none"
                />
                <Dropdown
                  value={frequency.customUnit}
                  options={Object.entries(DURATION_UNIT_LABELS).map(([value, label]) => ({ value, label }))}
                  onChange={(v) => setFrequency((f) => ({ ...f, customUnit: v as CustomDurationUnit }))}
                  widthClass="w-[110px]"
                  heightClass="h-9"
                />
              </div>
            )}
          </div>
        )}
      </div>

      <div className="border-t border-[#EBEBF5]" />

      {/* Footer */}
      <div className="flex items-center justify-between px-6 py-4">
        <button type="button" onClick={onBack} className="dc-btn dc-btn-secondary">
          <ArrowLeft className="h-4 w-4" strokeWidth={2} />
          Back
        </button>
        <button type="button" disabled={!canSave} onClick={handleSave} className="dc-btn dc-btn-primary">
          Save trigger
        </button>
      </div>
    </>
  );
}

/** One attribute/operator/value row, shared by the Activity trigger's "Only
 *  when…" conditions and the Condition node's own rule list. */
export function ConditionRow({
  condition,
  attrs,
  onChange,
  onRemove,
}: {
  condition: Condition;
  attrs: ActivityAttribute[];
  onChange: (patch: Partial<Condition>) => void;
  onRemove: () => void;
}) {
  const attribute = attrs.find((a) => a.id === condition.attributeId) ?? attrs[0];
  const operators = OPERATORS_BY_TYPE[attribute.type];

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Dropdown
        value={attribute.id}
        options={attrs.map((a) => ({ value: a.id, label: a.label }))}
        onChange={(v) => {
          const nextAttr = attrs.find((a) => a.id === v)!;
          onChange({
            attributeId: nextAttr.id,
            operator: OPERATORS_BY_TYPE[nextAttr.type][0].value,
            value: "",
          });
        }}
        widthClass="min-w-[128px] flex-1"
        heightClass="h-9"
      />

      <Dropdown
        value={condition.operator}
        options={operators}
        onChange={(v) => onChange({ operator: v })}
        widthClass="w-[132px] shrink-0"
        heightClass="h-9"
      />

      <ValueInput attribute={attribute} value={condition.value} onChange={(v) => onChange({ value: v })} />

      <button
        type="button"
        aria-label="Remove condition"
        onClick={onRemove}
        className="grid h-9 w-9 shrink-0 place-items-center rounded-md text-[#6F6F8D] transition-colors hover:bg-[#F3F6FF] hover:text-[#17173A]"
      >
        <X className="h-4 w-4" strokeWidth={2} />
      </button>
    </div>
  );
}

export function ValueInput({
  attribute,
  value,
  onChange,
}: {
  attribute: ActivityAttribute;
  value: string;
  onChange: (v: string) => void;
}) {
  if (attribute.type === "select") {
    return (
      <Dropdown
        value={value}
        options={attribute.options ?? []}
        onChange={onChange}
        placeholder="Select value"
        widthClass="min-w-[110px] flex-1"
        heightClass="h-9"
      />
    );
  }
  return (
    <input
      type={attribute.type === "number" ? "number" : "text"}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Value"
      className="h-9 min-w-[110px] flex-1 rounded-md border border-[#DDE2EE] bg-white px-2 font-manrope text-[13.5px] text-[#17173A] outline-none placeholder:text-[#6F6F8D]"
    />
  );
}
