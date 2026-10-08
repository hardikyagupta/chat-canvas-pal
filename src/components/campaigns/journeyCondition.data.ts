import type { ActivityAttribute } from "./journeyActivities.data";

/**
 * Attributes the "Check Attribute" condition node can branch on — profile
 * and cart-level fields relevant once someone is already inside a
 * cart-abandonment journey (as opposed to the Activity trigger's own
 * per-event payload fields). Same shape as `ActivityAttribute` so this
 * reuses the exact attribute/operator/value row UI already built for the
 * Activity trigger's "Only when…" conditions, instead of a parallel one.
 */
export const CONDITION_ATTRIBUTES: ActivityAttribute[] = [
  { id: "cart_value", label: "Cart Value", type: "number" },
  { id: "cart_items", label: "Items in Cart", type: "number" },
  { id: "coupon_applied", label: "Coupon Applied", type: "select", options: ["Yes", "No"] },
  { id: "has_purchased_before", label: "Has Purchased Before", type: "select", options: ["Yes", "No"] },
  { id: "email_reachable", label: "Email Reachable", type: "select", options: ["Yes", "No"] },
  { id: "sms_reachable", label: "SMS Reachable", type: "select", options: ["Yes", "No"] },
];

export interface ConditionRule {
  key: string;
  attributeId: string;
  operator: string;
  value: string;
}

export interface ConditionSetting {
  matchAll: boolean;
  rules: ConditionRule[];
}

let ruleSeq = 0;
export const newConditionRule = (attribute: ActivityAttribute, operator: string): ConditionRule => ({
  key: `r${++ruleSeq}`,
  attributeId: attribute.id,
  operator,
  value: "",
});

export const DEFAULT_CONDITION_SETTING: ConditionSetting = { matchAll: true, rules: [] };

export function isConditionValid(s: ConditionSetting): boolean {
  return s.rules.length > 0 && s.rules.every((r) => r.value.trim() !== "");
}

const OPERATOR_LABELS: Record<string, string> = {
  is: "is",
  is_not: "is not",
  contains: "contains",
  greater_than: "is greater than",
  less_than: "is less than",
};

/** The sentence shown on the canvas node once saved, e.g.
 *  "Cart Value is greater than 1000". */
export function describeCondition(s: ConditionSetting): string {
  if (s.rules.length === 0) return "Check an attribute";
  const parts = s.rules.map((r) => {
    const attr = CONDITION_ATTRIBUTES.find((a) => a.id === r.attributeId);
    const op = OPERATOR_LABELS[r.operator] ?? r.operator;
    return `${attr?.label ?? r.attributeId} ${op} ${r.value}`;
  });
  if (parts.length === 1) return parts[0];
  return parts.join(s.matchAll ? " and " : " or ");
}
