import { resolveSegmentDefinition, type RuleRow } from "../segment-creation/segmentRules.data";
import type { AdhocCondition } from "./CampaignAudienceStep";
import {
  DEFAULT_VALUE_BY_TYPE,
  OPERATORS_BY_TYPE,
  type AttributeType,
} from "./ConditionAttributePicker";

/**
 * Turns the rules behind an agent-built segment into rows for the campaign
 * wizard's own Conditions tab — used by "Use segment conditions" on the
 * artifact card, so the cut lands as editable conditions on the form instead
 * of as a read-only segment the user can't adjust here.
 *
 * The builder's rows carry more structure than one condition row can hold
 * (a threshold *and* a window, block-level Or joins), so the mapping keeps
 * whichever half a marketer would actually read off the row.
 */

/** Builder operator wording → the operators the Conditions tab offers. */
const OPERATOR_ALIASES: Record<string, string> = {
  contains: "contains",
  is: "is",
  "is not": "is not",
  "is one of": "is",
  "more than": "is greater than",
  "less than": "is less than",
  equals: "equals",
  "in the last": "in the last",
  "not in the last": "not in the last",
  before: "before",
};

function typeFor(operator: string, value: string): AttributeType {
  if (/^(true|false)$/i.test(value)) return "boolean";
  if (OPERATORS_BY_TYPE.recency.includes(operator)) return "recency";
  if (OPERATORS_BY_TYPE.number.includes(operator)) return "number";
  return "text";
}

function condition(attribute: string, operator: string, value: string): AdhocCondition {
  const type = typeFor(operator, value);
  return {
    attribute,
    type,
    // A mapped operator that isn't offered for this type would leave the row's
    // dropdown showing something it can't select back.
    operator: OPERATORS_BY_TYPE[type].includes(operator) ? operator : OPERATORS_BY_TYPE[type][0],
    value: value || DEFAULT_VALUE_BY_TYPE[type],
  };
}

function rowToCondition(row: RuleRow): AdhocCondition | null {
  const fields = row.fields;
  // Rows read [attribute group, attribute, operator, value, …].
  if (fields.length < 3) return null;
  const attribute = fields[1].value;
  const rawOperator = fields[2].value.toLowerCase();
  const threshold = fields.find((f) => f.kind === "input");
  const connectorIndex = fields.findIndex((f) => f.kind === "text");

  if (connectorIndex > -1) {
    const connector = fields[connectorIndex].value.toLowerCase();
    const window = fields[connectorIndex + 1]?.value ?? DEFAULT_VALUE_BY_TYPE.recency;
    // "More than 0 in the last 30 days" is really a recency rule — the
    // threshold only matters when it's an actual number, as with a rate.
    if (threshold && threshold.value !== "0") {
      return condition(attribute, OPERATOR_ALIASES[rawOperator] ?? "is greater than", threshold.value);
    }
    if (connector.includes("before")) return condition(attribute, "before", window);
    // "Equals 0 in the last 6 months" means they didn't do it in that window.
    const none = rawOperator === "equals" || rawOperator === "is";
    return condition(attribute, none ? "not in the last" : "in the last", window);
  }

  return condition(attribute, OPERATOR_ALIASES[rawOperator] ?? "is", fields[3]?.value ?? "");
}

/**
 * The include rules of the segment behind an artifact card, as condition rows.
 * Suppressions are left out — they belong to "Don't include", which takes
 * segments rather than conditions.
 */
export function segmentConditionsFor(title: string, description = ""): AdhocCondition[] {
  const definition = resolveSegmentDefinition(title, description);
  return definition.include
    .flatMap((block) => block.rows)
    .map(rowToCondition)
    .filter((c): c is AdhocCondition => c !== null);
}
