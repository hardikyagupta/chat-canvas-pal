import type { FlowStep } from "./journeyFlowTree";
import { toHours, type ExperimentProposal } from "./journeyExperiment.data";
import type { TimeDelaySetting } from "./journeyTimeDelay.data";

/**
 * Journey Optimization Agent — node-level insight. Reaching a step's own
 * insight (JourneyBuilder's handleOptimizeNode) opens the co-marketer panel
 * on THIS insight first — Problem / What may be causing it / Recommended
 * change / Why test this — with the "would you like to test this?"
 * question presented inline (NodeOptimizationInsightCard.tsx), before any
 * configuration or test-creation UI shows up.
 *
 * Same honesty rule as every other "AI" surface here (ChatInterface.tsx):
 * numbers are illustrative, not from a real data source, but computed
 * consistently (seeded off the step's own id, not re-rolled every render)
 * rather than invented fresh each time — and node types this agent has no
 * real signal for say so plainly instead of manufacturing a finding.
 */

export type OptimizationChangeKind = "add-whatsapp" | "reduce-wait" | "other";

export interface NodeOptimizationInsight {
  hasInsight: boolean;
  /** What the data shows. */
  problem: string;
  /** The likely cause — a hypothesis, not a certainty. */
  cause: string;
  /** One concise recommended change. */
  recommendedChange: string;
  /** Why this specific change is worth testing. */
  whyTest: string;
  /** Shown when hasInsight is false — why there's nothing to report yet. */
  noDataReason: string;
  changeKind: OptimizationChangeKind;
  /** Only set for changeKind "reduce-wait". */
  suggestedNewHours?: number;
  /** The same seeded percentages already baked into `problem`/`cause`'s
   *  text, exposed as raw numbers too — only set for changeKind
   *  "add-whatsapp". Lets a caller build its own sentence around these
   *  numbers (see JourneyBuilder's goal-first conversation) without
   *  re-deriving or duplicating the seed, and without drifting from what
   *  `problem`/`cause` already say. */
  emailEngagementPct?: number;
  whatsappEngagementPct?: number;
  purchaseConversionPct?: number;
}

/** Small deterministic hash so the same node always shows the same
 *  illustrative numbers instead of re-rolling on every render. */
function seedFromId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return h;
}
/** A stable pseudo-value in [min, max] for this node, offset by `salt` so
 *  two different readings on the same node don't move in lockstep. */
function stableRange(id: string, salt: number, min: number, max: number): number {
  const h = seedFromId(id + ":" + salt);
  return min + ((h % 1000) / 1000) * (max - min);
}

const NO_INSIGHT = (noDataReason: string): NodeOptimizationInsight => ({
  hasInsight: false,
  problem: "",
  cause: "",
  recommendedChange: "",
  whyTest: "",
  noDataReason,
  changeKind: "other",
});

function suggestReducedHours(oldHours: number): number {
  if (oldHours >= 24) return 2;
  if (oldHours >= 8) return 2;
  return Math.max(1, Math.round(oldHours / 4));
}

export function formatHoursShort(hours: number): string {
  if (hours >= 24 && hours % 24 === 0) {
    const days = hours / 24;
    return `${days} day${days === 1 ? "" : "s"}`;
  }
  if (hours < 1) return `${Math.round(hours * 60)} minutes`;
  const rounded = Math.round(hours * 10) / 10;
  return `${rounded} hour${rounded === 1 ? "" : "s"}`;
}

/** Builds this one step's insight — the only place that decides whether
 *  there's actually something worth surfacing for a given node type. */
export function buildNodeOptimizationInsight(step: FlowStep): NodeOptimizationInsight {
  if (step.paletteNodeId === "email") {
    // Illustrative engagement split: how this audience responds to email vs
    // WhatsApp, and how far conversion trails behind either.
    const emailEngagement = stableRange(step.id, 1, 0.22, 0.4);
    const whatsappEngagement = stableRange(step.id, 2, 0.42, 0.64);
    const purchaseConversion = stableRange(step.id, 3, 0.03, 0.07);

    if (whatsappEngagement > emailEngagement * 1.3) {
      return {
        hasInsight: true,
        problem: `Purchase conversion from this journey remains low (${Math.round(purchaseConversion * 100)}%), even though customers are entering and engaging with this email (${Math.round(emailEngagement * 100)}% engagement).`,
        cause: `The journey currently relies mainly on email. This audience shows meaningfully stronger engagement on WhatsApp (${Math.round(whatsappEngagement * 100)}%) than on email (${Math.round(emailEngagement * 100)}%).`,
        recommendedChange: "Add a WhatsApp message containing the abandoned product's rating/review.",
        whyTest:
          "It introduces an additional high-engagement channel and provides social proof at the point where customers are deciding whether to purchase.",
        noDataReason: "",
        changeKind: "add-whatsapp",
        emailEngagementPct: Math.round(emailEngagement * 100),
        whatsappEngagementPct: Math.round(whatsappEngagement * 100),
        purchaseConversionPct: Math.round(purchaseConversion * 100),
      };
    }
    return NO_INSIGHT(
      "Engagement on this email looks consistent with other channels for this audience — nothing points to a specific channel mismatch worth flagging yet.",
    );
  }

  if (step.paletteNodeId === "time-delay") {
    const s = step.settings as TimeDelaySetting | undefined;
    if (s?.mode === "fixed_period") {
      const oldHours = toHours(s.fixedAmount, s.fixedUnit);
      if (oldHours >= 6) {
        const newHours = suggestReducedHours(oldHours);
        return {
          hasInsight: true,
          problem: `Contacts wait ${formatHoursShort(oldHours)} at this step before the journey continues.`,
          cause: "A long wait gives the moment that triggered this journey more time to go cold before the next touch reaches them.",
          recommendedChange: `Reduce the wait to ${formatHoursShort(newHours)} instead of ${formatHoursShort(oldHours)}.`,
          whyTest: "A shorter gap keeps the next message closer to the moment of intent, when it's more likely to land.",
          noDataReason: "",
          changeKind: "reduce-wait",
          suggestedNewHours: newHours,
        };
      }
      return NO_INSIGHT(`This wait is already short (${formatHoursShort(oldHours)}) — there isn't a clear timing issue to flag here.`);
    }
    return NO_INSIGHT("This wait isn't set to a fixed period, so there's no duration to weigh a change against yet.");
  }

  if (step.paletteNodeId === "wait-for-event") {
    return NO_INSIGHT(
      "There isn't enough performance data on event-based waits yet to say whether the timeout window is helping or hurting.",
    );
  }

  return NO_INSIGHT(
    `There isn't enough performance data on this step yet ("${step.label}") to generate a reliable optimization insight.`,
  );
}

/** Turns a node's insight into the same ExperimentProposal shape used to
 *  compute results (journeyExperiment.data.ts's computeExperimentResults) —
 *  one math path for every entry point, whether it started from a specific
 *  node or a whole-journey scan. For anything other than a real Wait-step
 *  reduction, oldHours/newHours become an abstract 0–100 "how big a change
 *  is this" scale rather than a real duration — never shown to the user as
 *  hours, only as the plain-language recommendedChange already on the
 *  insight. */
export function buildProposalFromInsight(insight: NodeOptimizationInsight, step?: FlowStep): ExperimentProposal {
  const metricOptions = ["Conversion rate", "Revenue", "Click-through rate"];
  const totalAudience = 300000;
  const baseConversionRate = 0.057;

  if (insight.changeKind === "reduce-wait" && insight.suggestedNewHours !== undefined && step) {
    const settings = step.settings as TimeDelaySetting;
    const oldHours = toHours(settings.fixedAmount, settings.fixedUnit);
    return {
      changeSummary: insight.recommendedChange,
      controlLabel: `Wait ${formatHoursShort(oldHours)}`,
      variantLabel: `Wait ${formatHoursShort(insight.suggestedNewHours)}`,
      oldHours,
      newHours: insight.suggestedNewHours,
      metricOptions,
      totalAudience,
      baseConversionRate,
    };
  }

  // A modest, illustrative magnitude — not a specific claim, just enough to
  // produce a real (if small) computed lift for the mocked results stage.
  const magnitude = insight.changeKind === "add-whatsapp" ? 0.35 : 0.25;
  return {
    changeSummary: insight.recommendedChange,
    controlLabel: "Existing journey",
    variantLabel: insight.recommendedChange,
    oldHours: 100,
    newHours: 100 * (1 - magnitude),
    metricOptions,
    totalAudience,
    baseConversionRate,
  };
}

function flattenSteps(steps: FlowStep[]): FlowStep[] {
  const out: FlowStep[] = [];
  for (const step of steps) {
    out.push(step);
    if (step.branches) {
      if ("paths" in step.branches) {
        for (const path of step.branches.paths) out.push(...flattenSteps(path.steps));
      } else {
        out.push(...flattenSteps(step.branches.yes));
        out.push(...flattenSteps(step.branches.no));
      }
    }
  }
  return out;
}

/** Scans the whole journey (every branch, not just the root chain) for the
 *  first step with a real insight — what the "Optimize journey" entry point
 *  (the bottom-bar pill, or a report page's Co-marketer button) shows when
 *  it isn't anchored to one specific node the marketer already clicked.
 *  Excludes `excludeStepId` so "explore another opportunity" can look past
 *  the one just shown. */
export function findFirstNodeWithInsight(flow: FlowStep[], excludeStepId?: string): FlowStep | null {
  return (
    flattenSteps(flow).find((s) => s.id !== excludeStepId && buildNodeOptimizationInsight(s).hasInsight) ?? null
  );
}
