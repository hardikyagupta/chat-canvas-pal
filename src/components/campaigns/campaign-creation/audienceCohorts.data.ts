// The cohorts the co-marketer proposes on the Audience step. Each one is a
// ready-to-plot audience: the include cut, the suppression it always pairs
// with, and the numbers behind the recommendation.

export interface AudienceCohort {
  id: string;
  /** Short name — becomes the chip on the audience form. */
  name: string;
  /** One line on what the cut is. */
  rule: string;
  /** 0–100 — how well this cohort matches the campaign goal. */
  fit: number;
  reachable: number;
  matched: number;
  /** Historical conversion rate for this cut, e.g. "5.4%". */
  cvr: string;
  optOut: string;
  /** Why it suits the goal — one sentence, shown against the goal's name. */
  why: string;
  /** The rules behind the cut, revealed under "Rules & signals". */
  signals: string[];
  /** Suppression plotted alongside the include cut. */
  exclude: { name: string; reach: number };
}

const SUPPRESS_JOURNEY = { name: "Already in an active journey", reach: 12_480 };
const SUPPRESS_RECENT = { name: "Messaged in the last 7 days", reach: 31_260 };

const DORMANT: AudienceCohort[] = [
  {
    id: "dormant-installed",
    name: "Dormant, still reachable",
    rule: "No open in 90 days, email still valid",
    fit: 86,
    reachable: 44_980,
    matched: 87_310,
    cvr: "0.7%",
    optOut: "0.58%",
    why: "This is the only cut that matches how cold they are.",
    signals: [
      "Last email open older than 90 days",
      "Address verified in the last 12 months",
      "No hard bounce or spam complaint on record",
    ],
    exclude: SUPPRESS_JOURNEY,
  },
  {
    id: "loyal-lapsers",
    name: "Loyal lapsers",
    rule: "3+ lifetime orders, nothing in 60 days",
    fit: 77,
    reachable: 18_990,
    matched: 21_740,
    cvr: "5.4%",
    optOut: "0.12%",
    why: "Strong — habit restart is the actual job here.",
    signals: [
      "3 or more completed orders lifetime",
      "No order in the last 60 days",
      "Opened at least one email in the last 6 months",
    ],
    exclude: SUPPRESS_RECENT,
  },
  {
    id: "new-no-order",
    name: "Signed up, never bought",
    rule: "Joined in 14d, finished onboarding, zero orders",
    fit: 71,
    reachable: 26_100,
    matched: 29_650,
    cvr: "3.2%",
    optOut: "0.41%",
    why: "Warm, but they've never converted — expect a slower lift.",
    signals: [
      "Created in the last 14 days",
      "Completed onboarding",
      "Zero completed orders",
    ],
    exclude: SUPPRESS_JOURNEY,
  },
];

const BUYERS: AudienceCohort[] = [
  {
    id: "cart-abandoners",
    name: "Cart abandoners, 48h",
    rule: "Added to cart, no checkout in 48 hours",
    fit: 91,
    reachable: 12_420,
    matched: 13_980,
    cvr: "8.9%",
    optOut: "0.09%",
    why: "Closest to the money — intent is still fresh.",
    signals: [
      "Add-to-cart event in the last 48 hours",
      "No checkout completed since",
      "Cart value above ₹500",
    ],
    exclude: SUPPRESS_RECENT,
  },
  {
    id: "repeat-buyers",
    name: "Repeat buyers",
    rule: "2+ orders, last one within 90 days",
    fit: 82,
    reachable: 34_760,
    matched: 38_100,
    cvr: "6.1%",
    optOut: "0.11%",
    why: "They already buy on offers like this one.",
    signals: [
      "2 or more completed orders",
      "Last order within 90 days",
      "Opted in to promotional email",
    ],
    exclude: SUPPRESS_JOURNEY,
  },
  {
    id: "browsers-no-buy",
    name: "Browsers, no purchase",
    rule: "3+ product views in 30 days, zero orders",
    fit: 68,
    reachable: 51_300,
    matched: 58_420,
    cvr: "1.4%",
    optOut: "0.36%",
    why: "Widest reach, weakest signal — use it to top up volume.",
    signals: [
      "3 or more product views in the last 30 days",
      "Zero completed orders",
      "No unsubscribe on record",
    ],
    exclude: SUPPRESS_RECENT,
  },
];

/** The three cuts offered for a goal, best fit first. */
export function cohortsForGoal(goal: string): AudienceCohort[] {
  switch (goal) {
    case "abandoned-cart":
    case "first-purchase":
    case "repeat-purchase":
    case "promo-offer":
      return BUYERS;
    default:
      return DORMANT;
  }
}
