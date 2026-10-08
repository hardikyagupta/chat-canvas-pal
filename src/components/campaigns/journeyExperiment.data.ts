import { updateStepById, type FlowStep } from "./journeyFlowTree";
import { timeDelaySettingFromLabel, type TimeDelaySetting, type FixedPeriodUnit } from "./journeyTimeDelay.data";

/**
 * Journey Experiment Agent — proposes testing a change to an existing
 * journey's Wait step on a small slice of the audience, rather than
 * changing the live journey outright (see ExperimentCard.tsx for the UI,
 * JourneyBuilder's handleExperimentJourney/handleCoMarketerBeforeSend for
 * how this gets triggered). Scoped to the one concrete case the agent's
 * own spec walks through end-to-end — reducing a fixed-period Wait step's
 * duration — rather than a generic "change any node" engine; there's no
 * real reasoning behind this, same as every other "AI" surface here.
 */

export interface ExperimentProposal {
  changeSummary: string;
  controlLabel: string;
  variantLabel: string;
  oldHours: number;
  newHours: number;
  metricOptions: string[];
  /** A fixed, illustrative total — this app has no real per-journey traffic
   *  model to draw from. */
  totalAudience: number;
  /** The control's baseline rate for the primary metric, 0-1. */
  baseConversionRate: number;
}

const HOURS_PER_UNIT: Record<FixedPeriodUnit, number> = {
  minutes: 1 / 60,
  hours: 1,
  days: 24,
  weeks: 24 * 7,
  months: 24 * 30,
};

export const toHours = (amount: number, unit: FixedPeriodUnit) => amount * HOURS_PER_UNIT[unit];

/** The inverse of toHours — picks whatever unit reads most naturally for a
 *  round number of hours, e.g. 48 → "2 days", 2 → "2 hours". */
export function formatHours(hours: number): string {
  if (hours >= 24 && hours % 24 === 0) {
    const days = hours / 24;
    return `${days} day${days === 1 ? "" : "s"}`;
  }
  if (hours < 1) {
    const minutes = Math.round(hours * 60);
    return `${minutes} minute${minutes === 1 ? "" : "s"}`;
  }
  const rounded = Math.round(hours * 10) / 10;
  return `${rounded} hour${rounded === 1 ? "" : "s"}`;
}

/** A sensible default reduction when the user didn't name a specific new
 *  duration — most of the improvement in a wait-time experiment comes from
 *  the first big cut, so this proposes a steep one rather than a token
 *  tweak. */
export function suggestReducedHours(oldHours: number): number {
  if (oldHours >= 24) return 2;
  if (oldHours >= 8) return 2;
  return Math.max(1, Math.round(oldHours / 4));
}

/** Pulls "2 hours"/"6 hrs"/"1 day" out of a typed request, in hours — used
 *  when the user names a specific new duration (e.g. "try 6 hours
 *  instead") rather than leaving it to suggestReducedHours. */
export function parseRequestedHours(text: string): number | null {
  const match = /(\d+(?:\.\d+)?)\s*(hour|hr|day|minute|min)s?\b/i.exec(text);
  if (!match) return null;
  const amount = Number(match[1]);
  const unit = match[2].toLowerCase();
  if (unit.startsWith("day")) return amount * 24;
  if (unit.startsWith("min")) return amount / 60;
  return amount;
}

/** True when the journey has a change this agent knows how to propose an
 *  experiment for — a Wait step with a real fixed duration on it. Root
 *  chain only, matching the one scenario this agent actually handles. */
export function hasExperimentableWait(flow: FlowStep[]): boolean {
  return flow.some(
    (s) => s.paletteNodeId === "time-delay" && (s.settings as TimeDelaySetting | undefined)?.mode === "fixed_period",
  );
}

/** Builds the initial experiment proposal from the journey's own Wait step
 *  — null when there's nothing on the root chain this agent can propose a
 *  variation for. `requestedNewHours` overrides the default suggestion
 *  when the user named a specific duration. */
export function buildExperimentProposal(flow: FlowStep[], requestedNewHours?: number): ExperimentProposal | null {
  const idx = flow.findIndex(
    (s) => s.paletteNodeId === "time-delay" && (s.settings as TimeDelaySetting | undefined)?.mode === "fixed_period",
  );
  if (idx === -1) return null;

  const waitStep = flow[idx];
  const settings = waitStep.settings as TimeDelaySetting;
  const oldHours = toHours(settings.fixedAmount, settings.fixedUnit);
  const newHours = requestedNewHours ?? suggestReducedHours(oldHours);
  // A Wait step is a flow-control node — it always has Yes/No branches (see
  // journeyFlowTree.ts), so "what happens after the wait" never sits at
  // flow[idx + 1] on the root chain; it's the first step inside whichever
  // branch actually has one (Wait's own Yes/No carries no real meaning the
  // way a condition's does, so either side is "what continues" here).
  const nextStep =
    waitStep.branches && !("paths" in waitStep.branches)
      ? (waitStep.branches.yes[0] ?? waitStep.branches.no[0])
      : undefined;
  const actionLabel = nextStep ? nextStep.nodeLabel : "Continue";

  return {
    changeSummary: `Reduce the wait time from ${formatHours(oldHours)} to ${formatHours(newHours)}.`,
    controlLabel: `Wait ${formatHours(oldHours)} → ${actionLabel}`,
    variantLabel: `Wait ${formatHours(newHours)} → ${actionLabel}`,
    oldHours,
    newHours,
    metricOptions: ["Conversion rate", "Click rate", "Delivery rate"],
    totalAudience: 100000,
    baseConversionRate: 0.057,
  };
}

/** Applies "Create version and apply" from the experiment card's decision
 *  step — writes the run's new wait time onto the same root-level Wait step
 *  buildExperimentProposal read it from, producing a real, editable flow
 *  rather than just a proposal string. Falls back to the unchanged flow if
 *  that step somehow isn't there anymore (e.g. it was deleted after the
 *  proposal was built). */
export function applyExperimentChangeToFlow(flow: FlowStep[], newHours: number): FlowStep[] {
  const waitStep = flow.find(
    (s) => s.paletteNodeId === "time-delay" && (s.settings as TimeDelaySetting | undefined)?.mode === "fixed_period",
  );
  if (!waitStep) return flow;
  const newSetting = timeDelaySettingFromLabel(formatHours(newHours));
  return updateStepById(flow, waitStep.id, (step) => ({
    ...step,
    settings: newSetting,
    nodeLabel: `Wait ${formatHours(newHours)}`,
  }));
}

/** Variant vs control performance for one run, computed (not invented) from
 *  the proposal's baseline and how large a cut this particular run's
 *  duration is — a bigger cut reads as a bigger, diminishing-returns lift,
 *  and the 24h→2h default case lands almost exactly on this agent's own
 *  spec example (8.2% vs 5.7%) by construction. */
export function computeExperimentResults(
  proposal: ExperimentProposal,
  newHours: number,
  variantPercent: number,
) {
  const variantUsers = Math.round((proposal.totalAudience * variantPercent) / 100);
  const controlUsers = proposal.totalAudience - variantUsers;

  const reductionRatio = Math.max(0, (proposal.oldHours - newHours) / proposal.oldHours);
  const lift = Math.min(0.6, reductionRatio * 0.48);

  const controlRate = proposal.baseConversionRate;
  const variantRate = proposal.baseConversionRate * (1 + lift);

  const absoluteDiffPts = (variantRate - controlRate) * 100;
  const relativeDiffPct = controlRate === 0 ? 0 : ((variantRate - controlRate) / controlRate) * 100;

  // A plain two-proportion z-test on the (mocked) numbers above — a real
  // computation given the data on hand, not a fabricated confidence claim.
  const x1 = variantRate * variantUsers;
  const x2 = controlRate * controlUsers;
  const pooled = (x1 + x2) / (variantUsers + controlUsers);
  const se = Math.sqrt(pooled * (1 - pooled) * (1 / variantUsers + 1 / controlUsers));
  const z = se === 0 ? 0 : Math.abs(variantRate - controlRate) / se;

  // Short, badge-friendly phrasing — ExperimentCard shows this as a small
  // pill, not a sentence.
  let confidence: string;
  if (z >= 2.58) confidence = "High confidence (>99%)";
  else if (z >= 1.96) confidence = "95% confidence";
  else if (z >= 1.65) confidence = "90% confidence — more data helps";
  else confidence = "Not enough data yet";

  return {
    variantUsers,
    controlUsers,
    variantRate,
    controlRate,
    absoluteDiffPts,
    relativeDiffPct,
    confidence,
  };
}
