/**
 * Activities the "Activity" trigger can start a journey from, grouped into
 * categories. Picking a category (Behaviour/Engagement/Contact) scopes
 * which activities show up in the activity dropdown right next to it;
 * "Only when…" conditions then filter on the chosen activity's own payload
 * fields. Behaviour's two example activities (Product Viewed/Purchased)
 * are the original prototype pair; Engagement and Contact are small,
 * illustrative additions in the same spirit — not derived from any real
 * data model.
 */

export type ActivityAttributeType = "text" | "number" | "select";

export interface ActivityAttribute {
  id: string;
  label: string;
  type: ActivityAttributeType;
  /** Only present for `type: "select"`. */
  options?: string[];
}

export type ConditionCategory = "behaviour" | "engagement" | "contact";

export const CONDITION_CATEGORIES: { id: ConditionCategory; label: string }[] = [
  { id: "behaviour", label: "Behaviour" },
  { id: "engagement", label: "Engagement" },
  { id: "contact", label: "Contact" },
];

export interface ActivityDefinition {
  id: string;
  category: ConditionCategory;
  label: string;
  description: string;
  /** Verb phrase used to build the canvas sentence, e.g. "views a product"
   *  → "When someone views a product" (or, with more than one activity
   *  picked, "views a product or opens an email"). */
  nodeLabel: string;
  attributes: ActivityAttribute[];
}

export const ACTIVITY_DEFINITIONS: ActivityDefinition[] = [
  {
    id: "add-to-cart",
    category: "behaviour",
    label: "Add to Cart",
    description: "A customer adds a product to their shopping cart.",
    nodeLabel: "adds a product to cart",
    attributes: [
      { id: "product_name", label: "Product Name", type: "text" },
      { id: "cart_value", label: "Cart Value", type: "number" },
      { id: "product_category", label: "Product Category", type: "text" },
    ],
  },
  {
    id: "cart-abandoned",
    category: "behaviour",
    label: "Cart Abandoned",
    description: "A customer adds items to their cart but leaves without completing checkout.",
    nodeLabel: "abandons their cart",
    attributes: [
      { id: "cart_value", label: "Cart Value", type: "number" },
      { id: "cart_items", label: "Items in Cart", type: "number" },
      { id: "product_category", label: "Product Category", type: "text" },
      { id: "coupon_applied", label: "Coupon Applied", type: "select", options: ["Yes", "No"] },
    ],
  },
  {
    id: "product-viewed",
    category: "behaviour",
    label: "Product Viewed",
    description: "A customer opens a product's page.",
    nodeLabel: "views a product",
    attributes: [
      { id: "product_name", label: "Product Name", type: "text" },
      { id: "category", label: "Product Category", type: "text" },
      { id: "price", label: "Price", type: "number" },
    ],
  },
  {
    id: "product-purchased",
    category: "behaviour",
    label: "Product Purchased",
    description: "A customer completes an order.",
    nodeLabel: "purchases a product",
    attributes: [
      { id: "product_name", label: "Product Name", type: "text" },
      { id: "order_amount", label: "Order Amount", type: "number" },
      {
        id: "payment_method",
        label: "Payment Method",
        type: "select",
        options: ["Credit Card", "UPI", "Net Banking", "Wallet", "Cash on Delivery"],
      },
    ],
  },
  {
    id: "email-opened",
    category: "engagement",
    label: "Email Opened",
    description: "A customer opens an email you sent.",
    nodeLabel: "opens an email",
    attributes: [{ id: "campaign_name", label: "Campaign Name", type: "text" }],
  },
  {
    id: "email-clicked",
    category: "engagement",
    label: "Email Clicked",
    description: "A customer clicks a link in an email you sent.",
    nodeLabel: "clicks an email link",
    attributes: [{ id: "campaign_name", label: "Campaign Name", type: "text" }],
  },
  {
    id: "contact-created",
    category: "contact",
    label: "Contact Created",
    description: "A new contact is added.",
    nodeLabel: "becomes a new contact",
    attributes: [
      { id: "city", label: "City", type: "text" },
      { id: "country", label: "Country", type: "text" },
    ],
  },
  {
    id: "contact-updated",
    category: "contact",
    label: "Contact Updated",
    description: "An existing contact's details change.",
    nodeLabel: "updates their details",
    attributes: [
      { id: "city", label: "City", type: "text" },
      { id: "country", label: "Country", type: "text" },
    ],
  },
];

export function activitiesForCategory(category: ConditionCategory): ActivityDefinition[] {
  return ACTIVITY_DEFINITIONS.filter((a) => a.category === category);
}

export const OPERATORS_BY_TYPE: Record<ActivityAttributeType, { value: string; label: string }[]> = {
  text: [
    { value: "is", label: "is" },
    { value: "is_not", label: "is not" },
    { value: "contains", label: "contains" },
  ],
  number: [
    { value: "is", label: "is" },
    { value: "is_not", label: "is not" },
    { value: "greater_than", label: "is greater than" },
    { value: "less_than", label: "is less than" },
  ],
  select: [
    { value: "is", label: "is" },
    { value: "is_not", label: "is not" },
  ],
};

/** How often the same person can re-enter the journey through this trigger. */
export type FrequencyMode =
  | "every_time"
  | "first_time"
  | "once_per_day"
  | "once_per_week"
  | "once_per_month"
  | "custom";

export type CustomDurationUnit = "minutes" | "hours" | "days" | "weeks" | "months";

export interface FrequencySetting {
  mode: FrequencyMode;
  customAmount: number;
  customUnit: CustomDurationUnit;
}

export const DEFAULT_FREQUENCY: FrequencySetting = {
  mode: "every_time",
  customAmount: 1,
  customUnit: "days",
};
