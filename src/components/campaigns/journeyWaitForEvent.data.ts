import { ACTIVITY_DEFINITIONS, type ConditionCategory } from "./journeyActivities.data";

/**
 * "Wait for event" flow-control node — pauses the journey until one of the
 * picked events happens, branching Yes (it did) or Timeout (it didn't).
 * Event rows follow the exact same category → activity picking shape as
 * the Activity trigger (journeyActivities.data's CONDITION_CATEGORIES/
 * ACTIVITY_DEFINITIONS, rendered with the same two Dropdowns as
 * ActivityTriggerConfig's own activity rows), each with its own nested
 * "at least N times in the last…" recency filter — the same filter shape
 * as the campaign audience builder's countable-attribute condition row.
 */

export const WINDOW_OPERATORS = ["in the last", "not in the last", "before"];

export interface WaitForEventRow {
  key: string;
  category: ConditionCategory;
  activityId: string | null;
  /** "At least N times" — only meaningful when windowOperator is "in the
   *  last"; undefined means no threshold, i.e. any number of times. */
  atLeast?: number;
  windowOperator: string;
  windowValue: string;
}

export interface WaitForEventSetting {
  rows: WaitForEventRow[];
}

let rowSeq = 0;
export const newWaitForEventRow = (): WaitForEventRow => ({
  key: `w${++rowSeq}`,
  category: "behaviour",
  activityId: null,
  atLeast: undefined,
  windowOperator: "in the last",
  windowValue: "30 days",
});

export const DEFAULT_WAIT_FOR_EVENT_SETTING: WaitForEventSetting = { rows: [] };

export function isWaitForEventValid(s: WaitForEventSetting): boolean {
  return s.rows.some((r) => r.activityId !== null);
}

/** The sentence shown on the canvas node once saved, e.g. "Wait for
 *  Product Purchased" or "Wait for Product Purchased or 2 more events". */
export function describeWaitForEvent(s: WaitForEventSetting): string {
  const labels = s.rows
    .map((r) => ACTIVITY_DEFINITIONS.find((a) => a.id === r.activityId)?.label)
    .filter((label): label is string => !!label);
  if (labels.length === 0) return "Wait for an event";
  if (labels.length === 1) return `Wait for ${labels[0]}`;
  return `Wait for ${labels[0]} or ${labels.length - 1} more event${labels.length > 2 ? "s" : ""}`;
}
