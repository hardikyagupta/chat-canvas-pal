// Rule definitions for the segment creation canvas — the machine-readable form
// of the segments the Segment agent hands back as an artifact card.
//
// Layout mirrors the Figma segment builder (node 5649:44769): a contact-type
// selector, then one or more condition blocks under "Include users", each block
// a list of rows built from chips (selects, value inputs, plain-text joiners).
// Blocks after the first are joined by the block-level operator.

/** One chip inside a condition row. */
export type RuleField =
  /** Dropdown chip — the common case (attribute, operator, window). */
  | { kind: "select"; value: string }
  /** Free-text value chip, e.g. `gmail.com` or a threshold. */
  | { kind: "input"; value: string; width?: number }
  /** Bare connector text between chips, e.g. "in the last". */
  | { kind: "text"; value: string };

export interface RuleRow {
  /** Joiner chip on rows after the first in a block. */
  join?: "And" | "Or";
  fields: RuleField[];
}

export interface RuleBlock {
  rows: RuleRow[];
}

export interface SegmentDefinition {
  /** Segment name shown in the creation navbar. */
  name: string;
  contactType: string;
  /** Conditions a contact must match. */
  include: RuleBlock[];
  /** Optional suppressions — rendered under their own "Exclude users" heading. */
  exclude?: RuleBlock[];
  /** Reachable count, revealed by GET COUNT. */
  count: string;
  /** What the agent walks through while the rules are being plotted. */
  buildSteps: string[];
  /** One line under the canvas header framing what was built. */
  summary: string;
}

/** Shorthand builders — these files are mostly data, so keep the noise down. */
const sel = (value: string): RuleField => ({ kind: "select", value });
const val = (value: string, width?: number): RuleField => ({ kind: "input", value, width });
const txt = (value: string): RuleField => ({ kind: "text", value });

const SUPPRESSIONS: RuleBlock = {
  rows: [
    { fields: [sel("User property"), sel("Unsubscribed"), sel("Is"), sel("True")] },
    { join: "Or", fields: [sel("User property"), sel("Email status"), sel("Is"), sel("Hard bounced")] },
  ],
};

/**
 * Every scripted segment, keyed by the artifact card it came from. Order
 * matters only for `resolveSegmentDefinition`'s keyword matching below.
 */
const DEFINITIONS: { matches: (s: string) => boolean; definition: SegmentDefinition }[] = [
  // Card 1 — the segment drawn in the Figma reference, rule for rule.
  {
    matches: (s) => s.includes("gmail"),
    definition: {
      name: "Gmail Engaged — Last 30 Days",
      contactType: "All Contacts",
      include: [
        {
          rows: [
            { fields: [sel("User property"), sel("Email"), sel("Contains"), val("gmail.com", 112)] },
            {
              join: "And",
              fields: [
                sel("User engagement"),
                sel("Emails clicked"),
                sel("More than"),
                val("0", 56),
                txt("in the last"),
                sel("30 days"),
              ],
            },
          ],
        },
      ],
      exclude: [SUPPRESSIONS],
      count: "88,420",
      buildSteps: [
        "Parsing the email-domain condition",
        "Resolving the 30-day click window",
        "Joining contact attributes to email engagement",
        "Excluding unsubscribed and bounced contacts",
      ],
      summary:
        "Gmail contacts with at least one email click in the last 30 days, with unsubscribes and hard bounces suppressed.",
    },
  },
  // Card 2 — lapsed engagement (win-back).
  {
    matches: (s) => s.includes("dormant") || s.includes("6 month"),
    definition: {
      name: "Dormant Subscribers — 6 Months",
      contactType: "All Contacts",
      include: [
        {
          rows: [
            {
              fields: [
                sel("User engagement"),
                sel("Emails opened"),
                sel("Equals"),
                val("0", 56),
                txt("in the last"),
                sel("6 months"),
              ],
            },
            {
              join: "And",
              fields: [
                sel("User engagement"),
                sel("Emails clicked"),
                sel("Equals"),
                val("0", 56),
                txt("in the last"),
                sel("6 months"),
              ],
            },
            {
              join: "And",
              fields: [
                sel("User engagement"),
                sel("Emails opened"),
                sel("More than"),
                val("0", 56),
                txt("before"),
                sel("6 months ago"),
              ],
            },
          ],
        },
      ],
      exclude: [SUPPRESSIONS],
      count: "154,902",
      buildSteps: [
        "Resolving the 6-month inactivity window",
        "Checking opens and clicks across all campaigns",
        "Separating never-engaged from lapsed contacts",
        "Filtering out already-suppressed contacts",
      ],
      summary:
        "Previously-engaged subscribers with no opens or clicks in the last 6 months — a win-back audience, not a growth one.",
    },
  },
  // Card 3 — recency-based acquisition cohort.
  {
    matches: (s) => s.includes("new customer") || s.includes("60 day"),
    definition: {
      name: "New Customers — Last 60 Days",
      contactType: "All Contacts",
      include: [
        {
          rows: [
            {
              fields: [
                sel("User property"),
                sel("First purchase date"),
                sel("In the last"),
                sel("60 days"),
              ],
            },
            {
              join: "Or",
              fields: [sel("User property"), sel("Signup date"), sel("In the last"), sel("60 days")],
            },
          ],
        },
      ],
      exclude: [SUPPRESSIONS],
      count: "21,764",
      buildSteps: [
        "Resolving the 60-day join window",
        "Reading first-purchase and signup events",
        "De-duplicating repeat identities",
        "Checking channel reachability",
      ],
      summary:
        "A rolling 60-day window on first signup or first purchase — contacts age out on day 61 without you touching it.",
    },
  },
  // Card 4 — geography + engagement-rate threshold.
  {
    matches: (s) => s.includes("europe") || s.includes("engagement rate"),
    definition: {
      name: "Europe — High Email Engagement",
      contactType: "All Contacts",
      include: [
        {
          rows: [
            {
              fields: [sel("User property"), sel("Country"), sel("Is one of"), sel("Europe · 18 markets")],
            },
            {
              join: "And",
              fields: [
                sel("User engagement"),
                sel("Email engagement rate"),
                sel("More than"),
                val("30", 56),
                txt("% in the last"),
                sel("90 days"),
              ],
            },
            {
              join: "And",
              fields: [sel("User property"), sel("Marketing consent"), sel("Is"), sel("Granted")],
            },
          ],
        },
      ],
      exclude: [SUPPRESSIONS],
      count: "34,510",
      buildSteps: [
        "Resolving Europe from country and locale attributes",
        "Computing per-contact email engagement rate",
        "Applying the 30% threshold",
        "Checking consent and regional opt-in status",
      ],
      summary:
        "European contacts clicking above 30% over the last 90 days, restricted to those with marketing consent on record.",
    },
  },
  // Campaigns-page flow — the high-intent cluster Insights surfaced.
  {
    matches: (s) => s.includes("high-intent") || s.includes("re-engager"),
    definition: {
      name: "High-Intent Re-Engagers",
      contactType: "All Contacts",
      include: [
        {
          rows: [
            {
              fields: [
                sel("User engagement"),
                sel("Opened or clicked"),
                sel("More than"),
                val("0", 56),
                txt("in the last"),
                sel("30 days"),
              ],
            },
            {
              join: "And",
              fields: [sel("User engagement"), sel("Active channels"), sel("More than"), val("1", 56)],
            },
            {
              join: "And",
              fields: [
                sel("Event"),
                sel("Purchase"),
                sel("Equals"),
                val("0", 56),
                txt("in the last"),
                sel("30 days"),
              ],
            },
          ],
        },
      ],
      exclude: [
        {
          rows: [
            { fields: [sel("User property"), sel("Fatigued"), sel("Is"), sel("True")] },
            { join: "Or", fields: [sel("User property"), sel("In active journey"), sel("Is"), sel("True")] },
            { join: "Or", fields: [sel("User property"), sel("Unsubscribed"), sel("Is"), sel("True")] },
          ],
        },
      ],
      count: "12,133",
      buildSteps: [
        "Reading the high-intent cluster from Insights",
        "Applying recency + engagement rules",
        "De-duplicating across channels",
        "Estimating the reachable audience",
      ],
      summary:
        "Recently-engaged, multi-channel contacts with no purchase this cycle, with fatigued and unsubscribed contacts held back.",
    },
  },
];

/** Blank canvas — the top-bar "+ → Segment" entry point. */
export const EMPTY_SEGMENT: SegmentDefinition = {
  name: "Untitled segment",
  contactType: "All Contacts",
  include: [{ rows: [] }],
  count: "0",
  buildSteps: [],
  summary: "Add conditions to describe who belongs in this segment.",
};

/** Anything the co-marketer built that isn't one of the scripted cards. */
const FALLBACK: SegmentDefinition = {
  name: "New Segment — Draft",
  contactType: "All Contacts",
  include: [
    {
      rows: [
        {
          fields: [
            sel("User engagement"),
            sel("Opened or clicked"),
            sel("More than"),
            val("0", 56),
            txt("in the last"),
            sel("30 days"),
          ],
        },
        { join: "And", fields: [sel("User property"), sel("Subscription status"), sel("Is"), sel("Subscribed")] },
      ],
    },
  ],
  exclude: [SUPPRESSIONS],
  count: "18,240",
  buildSteps: [
    "Reading the conditions in your request",
    "Mapping them to contact attributes and events",
    "De-duplicating across channels",
    "Estimating the reachable audience",
  ],
  summary:
    "Each condition in your request mapped onto the matching contact attribute or event, with suppressed contacts excluded.",
};

/**
 * Picks the rule set behind an artifact card. Matched on the card's title (and
 * description as a fallback) so the same keywords that chose the chat thread in
 * `conversations.ts` choose the rules here.
 */
export function resolveSegmentDefinition(title: string, description = ""): SegmentDefinition {
  const s = `${title} ${description}`.toLowerCase();
  const hit = DEFINITIONS.find((d) => d.matches(s));
  // Keep the agent's own name for the segment even on the fallback rules, so the
  // navbar always reads back what the user was shown in chat.
  return hit ? hit.definition : { ...FALLBACK, name: title || FALLBACK.name };
}
