import { useMemo, useState } from "react";
import { Plus, UserCheck, X } from "lucide-react";
import { ConditionRow } from "./ActivityTriggerConfig";
import Dropdown from "./Dropdown";
import {
  CONDITION_ATTRIBUTES,
  DEFAULT_CONDITION_SETTING,
  isConditionValid,
  newConditionRule,
  type ConditionSetting,
} from "./journeyCondition.data";
import { OPERATORS_BY_TYPE, type ActivityAttribute } from "./journeyActivities.data";

/**
 * "Check Attribute" condition node — branches the journey on cart/profile
 * attributes (e.g. "Cart Value is greater than 1000"). Reuses the exact
 * attribute/operator/value row + AND/OR selector already built for the
 * Activity trigger's "Only when…" conditions (ConditionRow/ValueInput,
 * imported from ActivityTriggerConfig, both built on the shared Dropdown)
 * rather than a parallel implementation. The Yes/No branches themselves are
 * automatic — any
 * Condition step already splits into its own Yes/No chains on the canvas.
 */
export default function ConditionConfig({
  initial,
  onCancel,
  onSave,
  connectorFields,
}: {
  initial?: ConditionSetting;
  onCancel: () => void;
  /** Called with the sentence to show on the canvas node, and the raw
   *  setting (so it can be persisted for re-editing later). */
  onSave: (nodeLabel: string, setting: ConditionSetting) => void;
  /** Output field names selected on any Connector Agent step elsewhere in
   *  this journey (see JourneyBuilder's connectorOutputFields) — offered
   *  here as extra checkable attributes, e.g. "loyalty_points", so a
   *  Connector's retrieved value can drive a Yes/No branch. Treated as
   *  numeric (matches the ">/< " comparisons these values are for). */
  connectorFields?: string[];
}) {
  // Static attributes first, then whatever a Connector Agent step has made
  // available — never the other way around, so the fixed set always sorts
  // the same regardless of what's been connected.
  const attrs: ActivityAttribute[] = useMemo(
    () => [
      ...CONDITION_ATTRIBUTES,
      ...(connectorFields ?? []).map((field) => ({ id: `connector:${field}`, label: field, type: "number" as const })),
    ],
    [connectorFields],
  );

  const [setting, setSetting] = useState<ConditionSetting>(
    initial ?? {
      ...DEFAULT_CONDITION_SETTING,
      rules: [newConditionRule(attrs[0], OPERATORS_BY_TYPE[attrs[0].type][0].value)],
    },
  );

  const addRule = () => {
    const attr = attrs[0];
    setSetting((s) => ({ ...s, rules: [...s.rules, newConditionRule(attr, OPERATORS_BY_TYPE[attr.type][0].value)] }));
  };
  const updateRule = (key: string, patch: Partial<(typeof setting.rules)[number]>) =>
    setSetting((s) => ({ ...s, rules: s.rules.map((r) => (r.key === key ? { ...r, ...patch } : r)) }));
  const removeRule = (key: string) => setSetting((s) => ({ ...s, rules: s.rules.filter((r) => r.key !== key) }));

  const valid = isConditionValid(setting);

  const describe = (): string => {
    if (setting.rules.length === 0) return "Check an attribute";
    const parts = setting.rules.map((r) => {
      const attr = attrs.find((a) => a.id === r.attributeId) ?? attrs[0];
      const op = OPERATORS_BY_TYPE[attr.type].find((o) => o.value === r.operator)?.label ?? r.operator;
      return `${attr.label} ${op} ${r.value}`;
    });
    return parts.join(setting.matchAll ? " and " : " or ");
  };

  return (
    <>
      {/* Header */}
      <div className="flex items-start gap-3 px-6 pt-6">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[#D5F2D6]">
          <UserCheck className="h-[18px] w-[18px] text-[#00B27E]" strokeWidth={2} />
        </span>
        <div className="flex-1">
          <h2 className="font-manrope text-[16px] font-bold leading-tight text-[#17173A]">
            Check Attribute
          </h2>
          <p className="mt-1 font-manrope text-[12.5px] text-[#6F6F8D]">
            Branch the journey based on cart or profile attributes.
          </p>
        </div>
        <button
          type="button"
          aria-label="Close"
          onClick={onCancel}
          className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center text-[#6F6F8D] transition-colors hover:text-[#17173A]"
        >
          <X className="h-5 w-5" strokeWidth={2} />
        </button>
      </div>

      <div className="mt-3 border-t border-[#EBEBF5]" />

      {/* Body */}
      <div className="scroll-slim min-h-0 flex-1 overflow-y-auto px-5 py-4">
        <label className="block font-manrope text-[14px] font-bold text-[#17173A]">
          Which attribute(s) should this check?
        </label>

        <div className="mt-3 rounded-lg border border-[#DDE2EE] p-3">
          {setting.rules.length > 1 && (
            <div className="mb-3 flex items-center gap-2 font-manrope text-[13.5px] text-[#17173A]">
              Match
              <Dropdown
                value={setting.matchAll ? "all" : "any"}
                options={["all", "any"]}
                onChange={(v) => setSetting((s) => ({ ...s, matchAll: v === "all" }))}
                widthClass="w-[84px]"
                heightClass="h-8"
              />
              of these
            </div>
          )}

          <div className="flex flex-col gap-3">
            {setting.rules.map((rule, i) => (
              <div key={rule.key}>
                {i > 0 && (
                  <p className="mb-2 font-manrope text-[11px] font-bold uppercase tracking-[0.06em] text-[#6F6F8D]">
                    {setting.matchAll ? "And" : "Or"}
                  </p>
                )}
                <ConditionRow
                  condition={rule}
                  attrs={attrs}
                  onChange={(patch) => updateRule(rule.key, patch)}
                  onRemove={() => removeRule(rule.key)}
                />
              </div>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={addRule}
          className="mt-3 flex items-center gap-1.5 rounded-md border border-dashed border-[#DDE2EE] px-3 py-2 font-manrope text-[13px] font-semibold text-[#2F68E5] transition-colors hover:border-[#B9C4DD] hover:bg-[#F5F9FF]"
        >
          <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
          Add another condition
        </button>

        {valid && (
          <p className="mt-4 rounded-md bg-[#F4F8FF] px-3 py-2 font-manrope text-[12.5px] text-[#6F6F8D]">
            <span className="font-semibold text-[#17173A]">Yes</span> if {describe()} —{" "}
            <span className="font-semibold text-[#17173A]">No</span> otherwise.
          </p>
        )}
      </div>

      <div className="border-t border-[#EBEBF5]" />

      {/* Footer */}
      <div className="flex items-center justify-end px-6 py-4">
        <button
          type="button"
          disabled={!valid}
          onClick={() => valid && onSave(describe(), setting)}
          className="dc-btn dc-btn-primary"
        >
          Save
        </button>
      </div>
    </>
  );
}
