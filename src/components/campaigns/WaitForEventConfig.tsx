import { useState } from "react";
import { Hourglass, Plus, X } from "lucide-react";
import Dropdown from "./Dropdown";
import { activitiesForCategory, CONDITION_CATEGORIES, type ConditionCategory } from "./journeyActivities.data";
import {
  DEFAULT_WAIT_FOR_EVENT_SETTING,
  describeWaitForEvent,
  isWaitForEventValid,
  newWaitForEventRow,
  WINDOW_OPERATORS,
  type WaitForEventRow,
  type WaitForEventSetting,
} from "./journeyWaitForEvent.data";

/**
 * "Wait for event" flow-control node — pause until any one of the picked
 * events happens. Follows the exact same shape as the Activity trigger
 * (ActivityTriggerConfig): a category dropdown scopes which activities show
 * up in the activity dropdown right next to it, "Add another event" adds an
 * "Or" row for a second event. Each picked event additionally gets its own
 * nested "at least N times in the last…" recency filter — the same filter
 * shape as the campaign audience builder's countable-attribute condition
 * row — so a specific historical pattern (not just "ever happened") can
 * gate the wait. The Yes/Timeout branches themselves are automatic — any
 * Wait for event step already splits into its own Yes/Timeout chains on
 * the canvas.
 */
export default function WaitForEventConfig({
  initial,
  onCancel,
  onSave,
}: {
  initial?: WaitForEventSetting;
  onCancel: () => void;
  /** Called with the sentence to show on the canvas node, and the raw
   *  setting (so it can be persisted for re-editing later). */
  onSave: (nodeLabel: string, setting: WaitForEventSetting) => void;
}) {
  const [setting, setSetting] = useState<WaitForEventSetting>(
    initial && initial.rows.length > 0 ? initial : { rows: [newWaitForEventRow()] },
  );
  const rows = setting.rows;

  const updateRow = (key: string, patch: Partial<WaitForEventRow>) =>
    setSetting((s) => ({ rows: s.rows.map((r) => (r.key === key ? { ...r, ...patch } : r)) }));
  const addRow = () => setSetting((s) => ({ rows: [...s.rows, newWaitForEventRow()] }));
  const removeRow = (key: string) => setSetting((s) => ({ rows: s.rows.filter((r) => r.key !== key) }));

  const valid = isWaitForEventValid(setting);

  return (
    <>
      {/* Header */}
      <div className="flex items-start gap-3 px-6 pt-6">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[#FCEFD1]">
          <Hourglass className="h-[18px] w-[18px] text-[#B8860B]" strokeWidth={2} />
        </span>
        <div className="flex-1">
          <h2 className="font-manrope text-[16px] font-bold leading-tight text-[#17173A]">Wait for Event</h2>
          <p className="mt-1 font-manrope text-[12.5px] text-[#6F6F8D]">
            Pause the journey until any of these events happen.
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
          Which event(s) should this wait for?
        </label>

        <div className="mt-2 flex flex-col gap-3">
          {rows.map((row, i) => {
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
                    onChange={(v) => updateRow(row.key, { category: v as ConditionCategory, activityId: null })}
                    widthClass="w-[140px] shrink-0"
                  />

                  <Dropdown
                    value={row.activityId ?? ""}
                    options={options.map((a) => ({ value: a.id, label: a.label }))}
                    onChange={(v) => updateRow(row.key, { activityId: v || null })}
                    placeholder="Choose an event…"
                    widthClass="min-w-0 flex-1"
                  />

                  {rows.length > 1 && (
                    <button
                      type="button"
                      aria-label="Remove event"
                      onClick={() => removeRow(row.key)}
                      className="grid h-9 w-9 shrink-0 place-items-center rounded-md text-[#6F6F8D] transition-colors hover:bg-[#F3F6FF] hover:text-[#17173A]"
                    >
                      <X className="h-4 w-4" strokeWidth={2} />
                    </button>
                  )}
                </div>
                {activity && <p className="mt-1.5 font-manrope text-[12.5px] text-[#6F6F8D]">{activity.description}</p>}

                {/* Nested recency filter for this specific event, mirroring
                    the campaign audience builder's "at least N times in the
                    last…" countable-attribute row. */}
                {activity && (
                  <div className="mt-2 flex flex-wrap items-center gap-1.5 rounded-md border border-[#DDE2EE] px-2.5 py-2">
                    <span className="shrink-0 font-manrope text-[12.5px] font-semibold text-[#6F6F8D]">
                      Contacts who
                    </span>
                    <span className="shrink-0 rounded-md border border-[#DDE2EE] bg-white px-2 py-1 font-manrope text-[12.5px] font-semibold text-[#17173A]">
                      {activity.label}
                    </span>
                    {row.windowOperator === "in the last" && (
                      <>
                        <span className="shrink-0 font-manrope text-[12.5px] font-semibold text-[#6F6F8D]">
                          at least
                        </span>
                        <input
                          type="number"
                          min={1}
                          value={row.atLeast ?? ""}
                          onChange={(e) =>
                            updateRow(row.key, {
                              atLeast: e.target.value ? Math.max(1, parseInt(e.target.value, 10)) : undefined,
                            })
                          }
                          placeholder="1"
                          className="h-8 w-[48px] rounded-md border border-[#DDE2EE] bg-white px-1 text-center font-manrope text-[12.5px] text-[#17173A] outline-none [-moz-appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                        />
                        <span className="shrink-0 font-manrope text-[12.5px] font-semibold text-[#6F6F8D]">
                          times
                        </span>
                      </>
                    )}
                    <Dropdown
                      value={row.windowOperator}
                      options={WINDOW_OPERATORS}
                      onChange={(v) =>
                        updateRow(row.key, { windowOperator: v, atLeast: v === "in the last" ? row.atLeast : undefined })
                      }
                      widthClass="w-[150px]"
                      heightClass="h-8"
                    />
                    <input
                      type="text"
                      value={row.windowValue}
                      onChange={(e) => updateRow(row.key, { windowValue: e.target.value })}
                      className="h-8 w-[100px] rounded-md border border-[#DDE2EE] bg-white px-2 font-manrope text-[12.5px] text-[#17173A] outline-none"
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <button
          type="button"
          onClick={addRow}
          className="mt-3 flex items-center gap-1.5 rounded-md border border-dashed border-[#DDE2EE] px-3 py-2 font-manrope text-[13px] font-semibold text-[#2F68E5] transition-colors hover:border-[#B9C4DD] hover:bg-[#F5F9FF]"
        >
          <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
          Add another event
        </button>

        {valid && (
          <p className="mt-4 rounded-md bg-[#F4F8FF] px-3 py-2 font-manrope text-[12.5px] text-[#6F6F8D]">
            <span className="font-semibold text-[#17173A]">Yes</span> if it happens —{" "}
            <span className="font-semibold text-[#17173A]">Timeout</span> otherwise.
          </p>
        )}
      </div>

      <div className="border-t border-[#EBEBF5]" />

      {/* Footer */}
      <div className="flex items-center justify-end px-6 py-4">
        <button
          type="button"
          disabled={!valid}
          onClick={() => valid && onSave(describeWaitForEvent(setting), setting)}
          className="dc-btn dc-btn-primary"
        >
          Save
        </button>
      </div>
    </>
  );
}
