import { USER_ATTRIBUTES } from "@/components/campaigns/campaign-creation/ConditionAttributePicker";

/** Most variables one SMS template can carry. */
export const MAX_SMS_VARIABLES = 10;

export type VariableSource = "attribute" | "payload" | "fetch";

export interface VariableField {
  /** Machine name, as it appears in the liquid path. */
  key: string;
  label: string;
}

export interface VariableGroup {
  /** Event / content-fetch name; the row that drills into `fields`. */
  key: string;
  label: string;
  fields: VariableField[];
}

export const VARIABLE_SOURCES: { id: VariableSource; label: string }[] = [
  { id: "attribute", label: "User attribute" },
  { id: "payload", label: "User activity payload" },
  { id: "fetch", label: "Content fetch" },
];

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");

/** Same profile fields the journey Email node's personalize menu offers. */
export const USER_ATTRIBUTE_FIELDS: VariableField[] = USER_ATTRIBUTES.map((a) => ({
  key: slug(a.label),
  label: a.label,
}));

const field = (key: string): VariableField => ({
  key,
  label: key,
});

export const PAYLOAD_EVENTS: VariableGroup[] = [
  {
    key: "cart_abandoned",
    label: "Cart Abandoned",
    fields: ["cart_value", "item_count", "product_name", "cart_url"].map(field),
  },
  {
    key: "order_placed",
    label: "Order Placed",
    fields: ["order_id", "order_value", "delivery_date", "tracking_url"].map(field),
  },
  {
    key: "payment_processed",
    label: "Payment Processed",
    fields: ["amount", "payment_mode", "transaction_id"].map(field),
  },
  {
    key: "product_viewed",
    label: "Product Viewed",
    fields: ["product_name", "product_price", "product_category"].map(field),
  },
  {
    key: "accept_offer",
    label: "Accept Offer",
    fields: ["offer_code", "discount_value", "expiry_date"].map(field),
  },
  {
    key: "add_watchlist",
    label: "Add Watchlist",
    fields: ["add_watchlist_broking"].map(field),
  },
];

export const CONTENT_FETCHES: VariableGroup[] = [
  {
    key: "latest_order",
    label: "Latest order",
    fields: ["order_id", "status", "eta"].map(field),
  },
  {
    key: "loyalty_points",
    label: "Loyalty points",
    fields: ["balance", "tier", "expiring_points"].map(field),
  },
  {
    key: "recommended_product",
    label: "Recommended product",
    fields: ["name", "price", "url"].map(field),
  },
];

export const CASE_OPTIONS = [
  { id: "default", label: "Default", filter: "" },
  { id: "upper", label: "AG", filter: "upcase" },
  { id: "title", label: "Ag", filter: "capitalize" },
  { id: "lower", label: "ag", filter: "downcase" },
] as const;

export type CaseId = (typeof CASE_OPTIONS)[number]["id"];

export const LIQUID_FILTERS = [
  { id: "none", label: "None", filter: "" },
  { id: "truncate", label: "Truncate (20 characters)", filter: "truncate: 20" },
  { id: "strip", label: "Strip whitespace", filter: "strip" },
  { id: "url_encode", label: "URL encode", filter: "url_encode" },
] as const;

export type LiquidFilterId = (typeof LIQUID_FILTERS)[number]["id"];

/** `{{ payload.cart_value | default: "0" | upcase }}` — the merge tag a configured field becomes. */
export function buildLiquid(
  source: VariableSource,
  group: VariableGroup | null,
  fieldKey: string,
  opts: { defaultValue: string; caseId: CaseId; filterId: LiquidFilterId }
): string {
  const path =
    source === "attribute"
      ? `user.${fieldKey}`
      : source === "payload"
        ? `payload.${fieldKey}`
        : `content_fetch.${group?.key}.${fieldKey}`;
  const parts = [path];
  if (opts.defaultValue.trim()) parts.push(`default: "${opts.defaultValue.trim().replace(/"/g, '\\"')}"`);
  const caseFilter = CASE_OPTIONS.find((c) => c.id === opts.caseId)?.filter;
  if (caseFilter) parts.push(caseFilter);
  const extra = LIQUID_FILTERS.find((f) => f.id === opts.filterId)?.filter;
  if (extra) parts.push(extra);
  return `{{ ${parts.join(" | ")} }}`;
}
