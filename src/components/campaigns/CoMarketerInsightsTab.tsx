import { useState } from "react";
import { AlertTriangle, Rocket, TrendingUp, type LucideIcon } from "lucide-react";
import type { FlowStep } from "./journeyFlowTree";
import { buildNodeOptimizationInsight, buildProposalFromInsight, findFirstNodeWithInsight } from "./journeyOptimizationInsight.data";

interface JourneyMetrics {
  name: string;
  sent: string;
  delivered: string;
  openedRead: string;
  clicked?: string;
  submissions?: string;
}

const toNumber = (v?: string) => Number((v ?? "0").replace(/,/g, "")) || 0;
const pct = (part: number, whole: number) => (whole === 0 ? 0 : (part / whole) * 100);

/** Every step in the flow, branches included — used here just to count how
 *  many touchpoints of a given kind (e.g. "email") this journey actually
 *  has, rather than assuming a fixed number. */
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

/** One of the three summary cards — icon + label + headline stat, then
 *  detail rows underneath. Same bordered-card shape used everywhere else in
 *  this app (ExperimentCard's results, NodeOptimizationInsightCard), not
 *  the reference mockup's own dashboard styling. */
function InsightCard({
  icon: Icon,
  label,
  value,
  valueTone,
  badge,
  children,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  valueTone: "blue" | "red" | "green";
  /** A corner ribbon tag (e.g. "Suggested") — only the Suggested-next-step
   *  card uses this; every other InsightCard leaves it unset. */
  badge?: React.ReactNode;
  children: React.ReactNode;
}) {
  const toneClass =
    valueTone === "blue" ? "text-[#2F68E5]" : valueTone === "red" ? "text-[#D0483E]" : "text-[#1A8354]";
  return (
    <div className="relative flex flex-1 flex-col overflow-hidden rounded-lg border border-[#DDE2EE] bg-white p-4">
      {badge}
      <div className="flex items-center gap-2">
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-[#F4F8FF]">
          <Icon className={`h-4 w-4 ${toneClass}`} strokeWidth={2} />
        </span>
        <p className="font-manrope text-[11px] font-bold uppercase tracking-[0.04em] text-[#6F6F8D]">{label}</p>
      </div>
      <p className={`mt-2 font-manrope text-[22px] font-bold leading-none ${toneClass}`}>{value}</p>
      <div className="mt-3 space-y-2.5 border-t border-[#F0F1F5] pt-3">{children}</div>
    </div>
  );
}

/** A bookmark-style ribbon tag pinned to the card's top-right corner — a
 *  classic bookmark shape (flat docked edge, swallowtail V notched into the
 *  opposite edge), just laid on its side: docked flush against the card's
 *  own right edge, with the notch cut into its left (hanging) edge instead
 *  of a bottom edge. Same clip-path shape on the gradient fill and on the
 *  running-stroke ring beneath it, so the ring traces this outline instead
 *  of a plain rectangle. Its running stroke reuses the exact ring the
 *  journey canvas's Agent Node uses (.snake-border / --snake-angle, defined
 *  once in src/index.css) in that node's own violet-to-blue palette, so
 *  this reads as "an agent flagged this" using the same visual language as
 *  everywhere else that's true in this app — not a new animation. */
// Inline style rather than a Tailwind arbitrary class — a clip-path this
// shaped (multiple comma-separated points) doesn't reliably survive
// Tailwind's arbitrary-value parsing, silently dropping to "none".
const BOOKMARK_CLIP_PATH = "polygon(100% 0, 100% 100%, 0 100%, 8px 50%, 0 0)";
// The ring's own clip-path pulls its right edge in by the ring's stroke
// width (2px, plus a hair of margin) — the right edge is where this ribbon
// is docked flush against the card's own edge, not a real boundary of the
// ribbon, so that's the one edge the running stroke should never draw
// along; it wraps the other three (top, left notch, bottom) same as before.
const BOOKMARK_RING_CLIP_PATH = "polygon(calc(100% - 3px) 0, calc(100% - 3px) 100%, 0 100%, 8px 50%, 0 0)";
function SuggestedTag() {
  return (
    <span
      className="absolute right-0 top-3 flex h-6 items-center bg-gradient-to-r from-[#9449DF] to-[#2F68E5] py-1 pl-4 pr-3.5"
      style={{ clipPath: BOOKMARK_CLIP_PATH }}
    >
      <span
        aria-hidden="true"
        className="snake-border snake-border--purple"
        style={{ clipPath: BOOKMARK_RING_CLIP_PATH }}
      />
      <span className="relative z-[1] font-manrope text-[9px] font-bold uppercase tracking-[0.08em] text-white">
        AI Suggested
      </span>
    </span>
  );
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <p className="font-manrope text-[13px] text-[#6F6F8D]">{label}</p>
      <p className="font-manrope text-[13px] font-semibold text-[#17173A]">{value}</p>
    </div>
  );
}

/** A bold lead-in followed by a plain sentence — same shape as
 *  NodeOptimizationInsightCard's own Problem/Cause/Recommended-change rows,
 *  reused here so a "signal" reads the same way everywhere in the app. */
function SignalRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <p className="font-manrope text-[13px] leading-[18px] text-[#17173A]">
      <span className="font-bold">{label}: </span>
      {children}
    </p>
  );
}

/**
 * "Co-marketer insights" — a standing summary of what the agent already
 * knows about this journey (funnel shape, where it leaks, what it would
 * suggest testing next), sitting beside the Overall/Channel wise/Node wise
 * tabs rather than requiring a chat turn to ask for it. All three cards are
 * computed from this journey's own real numbers (the same sent/delivered/
 * clicked/submissions the Overall tab shows) and, for the suggested next
 * step, the same node-level insight (and the same illustrative results
 * math) the Journey Optimization Agent itself uses via "Optimize journey"
 * — not a second, disconnected mock data source.
 */
export default function CoMarketerInsightsTab({ journey, flow }: { journey: JourneyMetrics; flow: FlowStep[] }) {
  const [confirmed, setConfirmed] = useState<"yes" | "no" | null>(null);

  const sent = toNumber(journey.sent);
  const delivered = toNumber(journey.delivered);
  const openedRead = toNumber(journey.openedRead);
  const clicked = toNumber(journey.clicked);
  const submissions = toNumber(journey.submissions);

  const deliveryRate = pct(delivered, sent);
  const readRate = pct(openedRead, delivered);
  const clickRate = pct(clicked, openedRead);
  const submitRate = pct(submissions, clicked);
  const overallConversion = pct(submissions, sent);

  // The single biggest percentage-point drop between two adjacent funnel
  // stages — read straight off this journey's own numbers, not invented.
  const stages = [
    { from: "Sent", to: "Delivered", fromN: sent, toN: delivered, dropPts: 100 - deliveryRate },
    { from: "Delivered", to: "Opened/Read", fromN: delivered, toN: openedRead, dropPts: 100 - readRate },
    { from: "Opened/Read", to: "Clicked", fromN: openedRead, toN: clicked, dropPts: 100 - clickRate },
    { from: "Clicked", to: "Submitted", fromN: clicked, toN: submissions, dropPts: 100 - submitRate },
  ];
  const biggestDrop = stages.reduce((a, b) => (b.dropPts > a.dropPts ? b : a));

  const allSteps = flattenSteps(flow);
  const emailTouchpoints = allSteps.filter((s) => s.paletteNodeId === "email").length;
  const waitSteps = allSteps.filter((s) => s.paletteNodeId === "time-delay" || s.paletteNodeId === "wait-for-event").length;

  const insightStep = findFirstNodeWithInsight(flow);
  const insight = insightStep ? buildNodeOptimizationInsight(insightStep) : null;
  const proposal = insight?.hasInsight ? buildProposalFromInsight(insight, insightStep ?? undefined) : null;
  // The test slice this journey actually ran (5% of its total audience —
  // the same default the Optimize flow's own audience question uses),
  // scaled up using this journey's own real, observed conversion rate
  // (submissions ÷ sent) rather than a separate invented "test" number —
  // so "1,215 purchases from 15,000 test users" and the 24,300 projection
  // both fall out of numbers already on screen elsewhere in this tab.
  const TEST_SLICE_PCT = 5;
  const testAudience = proposal ? Math.round((proposal.totalAudience * TEST_SLICE_PCT) / 100) : 0;
  const testPurchases = Math.round((testAudience * overallConversion) / 100);
  const projectedPurchases = proposal ? Math.round((proposal.totalAudience * overallConversion) / 100) : 0;

  return (
    <div className="w-full space-y-4">
      <div className="rounded-lg border border-[#DDE2EE] bg-white p-4">
        <div className="flex items-center justify-between gap-3">
          <p className="font-manrope text-[13px] font-bold text-[#17173A]">Journey description</p>
          <p className="font-manrope text-[10.5px] font-semibold uppercase tracking-[0.04em] text-[#6F6F8D]">
            Co-marketer
          </p>
        </div>
        <p className="mt-2 font-manrope text-[13px] leading-[20px] text-[#17173A]">
          <span className="font-semibold">{journey.name.replace(/_/g, " ")}</span> re-engages contacts after they
          add a product to their cart without checking out, following up by email at increasing intervals. Of{" "}
          {sent.toLocaleString()} contacts who entered, {submissions.toLocaleString()} completed checkout — a{" "}
          {overallConversion.toFixed(1)}% conversion rate for the selected period.
        </p>
        <div className="mt-3 flex items-center gap-2">
          <button type="button" onClick={() => setConfirmed("yes")} className="dc-btn dc-btn-primary">
            Yes, this is correct
          </button>
          <button type="button" onClick={() => setConfirmed("no")} className="dc-btn dc-btn-secondary">
            This is wrong
          </button>
        </div>
        {confirmed && (
          <p className="mt-2 font-manrope text-[13px] text-[#6F6F8D]">
            {confirmed === "yes"
              ? "Thanks — marked as confirmed."
              : "Thanks — flagged for review. This won't change the journey on its own."}
          </p>
        )}
      </div>

      <div className="flex items-start gap-2.5 rounded-lg border border-[#F5D98B] bg-[#FFFBEB] p-3">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[#B7791F]" strokeWidth={2} />
        <p className="font-manrope text-[13px] leading-[19px] text-[#5C4A1A]">
          The steepest drop in this journey is between <span className="font-semibold">{biggestDrop.from}</span> and{" "}
          <span className="font-semibold">{biggestDrop.to}</span> ({biggestDrop.dropPts.toFixed(1)} pts) — improving
          that one step would move overall conversion the most.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <InsightCard icon={TrendingUp} label="Performance funnel" value={`${overallConversion.toFixed(1)}%`} valueTone="blue">
          <StatRow label="Sent → Delivered" value={`${deliveryRate.toFixed(1)}%`} />
          <StatRow label="Delivered → Opened/Read" value={`${readRate.toFixed(1)}%`} />
          <StatRow label="Opened/Read → Clicked" value={`${clickRate.toFixed(1)}%`} />
          <StatRow label="Clicked → Submitted" value={`${submitRate.toFixed(1)}%`} />
          <StatRow label="Email touchpoints" value={String(emailTouchpoints)} />
          <StatRow label="Wait steps" value={String(waitSteps)} />
        </InsightCard>

        <InsightCard icon={AlertTriangle} label="Where contacts drop off" value={`-${biggestDrop.dropPts.toFixed(1)} pts`} valueTone="red">
          <SignalRow label="Biggest leak">
            {biggestDrop.from} → {biggestDrop.to} drops {biggestDrop.dropPts.toFixed(1)} points — the single largest
            gap in this funnel.
          </SignalRow>
          <SignalRow label="Channel dominance">
            This journey relies entirely on email across all {emailTouchpoints || "its"} touchpoint
            {emailTouchpoints === 1 ? "" : "s"} — no other channel shares the load.
          </SignalRow>
          <SignalRow label="Volume at risk">
            {(clicked - submissions).toLocaleString()} contacts click through but never complete checkout.
          </SignalRow>
        </InsightCard>

        <InsightCard
          icon={Rocket}
          label="Suggested next step"
          value={insight?.hasInsight ? "1 opportunity" : "None found"}
          valueTone="green"
          badge={insight?.hasInsight ? <SuggestedTag /> : undefined}
        >
          {insight?.hasInsight && proposal ? (
            <>
              <p className="font-manrope text-[13px] leading-[18px] text-[#17173A]">
                The test journey is showing <span className="font-bold text-[#1A8354]">{overallConversion.toFixed(1)}%</span> purchase
                conversion across <span className="font-bold">{testAudience.toLocaleString()}</span> cart abandoners, resulting in
                approximately <span className="font-bold">{testPurchases.toLocaleString()}</span> purchases.
              </p>
              <p className="font-manrope text-[13px] leading-[18px] text-[#17173A]">
                With {deliveryRate.toFixed(1)}% delivery, {readRate.toFixed(1)}% open/read, and {clickRate.toFixed(1)}% click rates,
                the journey is showing strong engagement throughout the recovery flow.
              </p>
              <p className="font-manrope text-[13px] leading-[18px] text-[#17173A]">
                Consider making this test journey the main cart recovery journey to extend the observed performance to the broader
                audience.
              </p>
              <div className="mt-2.5 rounded-md bg-[#EAFAF2] px-2.5 py-2">
                <p className="font-manrope text-[10.5px] font-bold uppercase tracking-[0.04em] text-[#1A8354]">
                  Est. impact (illustrative)
                </p>
                <p className="mt-1 font-manrope text-[13px] leading-[18px] text-[#17173A]">
                  If the {overallConversion.toFixed(1)}% purchase conversion holds when scaled from the 5% test audience to the full{" "}
                  {proposal.totalAudience.toLocaleString()}-user audience, it could translate to approximately{" "}
                  <span className="font-bold text-[#1A8354]">{projectedPurchases.toLocaleString()}</span> purchases.
                </p>
              </div>
              <p className="font-manrope text-[11px] italic leading-[15px] text-[#8A8AA3]">
                Based on observed test-journey performance; actual results may vary at scale.
              </p>
            </>
          ) : (
            <p className="font-manrope text-[13px] leading-[18px] text-[#6F6F8D]">
              Nothing worth testing found on this journey's nodes right now — check back once more performance data
              comes in, or open Co-marketer's "Optimize journey" to look again.
            </p>
          )}
        </InsightCard>
      </div>
    </div>
  );
}
