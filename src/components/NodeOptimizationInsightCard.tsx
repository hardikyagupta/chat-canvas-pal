import { Info } from "lucide-react";
import type { NodeOptimizationInsight } from "@/components/campaigns/journeyOptimizationInsight.data";
import CoMarketerQuestionCard, { type QuestionRecapEntry } from "@/components/campaigns/CoMarketerQuestionCard";

export interface NodeInsightCardData {
  stepId: string;
  /** The node's own catalog label ("Email", "Time Delay") — shown as
   *  context above the insight, so it reads as "here's what I found on
   *  THIS step" even once the thread scrolls past the node it came from. */
  stepLabel: string;
  insight: NodeOptimizationInsight;
}

export type NodeInsightResponse = "test" | "explore-another" | "another-idea";

const RESPONSE_OPTIONS = ["Test this recommendation", "Explore another opportunity", "I have another idea"];
const RESPONSE_BY_LABEL: Record<string, NodeInsightResponse> = {
  "Test this recommendation": "test",
  "Explore another opportunity": "explore-another",
  "I have another idea": "another-idea",
};

/** A single labeled row — "Problem:", "What may be causing it:", etc. */
function InsightRow({ label, children }: { label: string; children: string }) {
  return (
    <p className="mt-2 font-manrope text-[12.5px] leading-[18px] text-[#17173A]">
      <span className="font-bold">{label}</span> {children}
    </p>
  );
}

/**
 * The Journey Optimization Agent's first move on a node-level ask — a
 * finding, not a form. Problem / cause / recommended change / why test it,
 * then the "would you like to test this?" question using the same
 * CoMarketerQuestionCard the AI Journey Creation flow asks its own
 * questions with, rather than a bespoke button row. When there's nothing
 * reliable to report, says so plainly instead of inventing a finding (see
 * journeyOptimizationInsight.data.ts).
 */
export default function NodeOptimizationInsightCard({
  data,
  onRespond,
}: {
  data: NodeInsightCardData;
  onRespond?: (response: NodeInsightResponse, data: NodeInsightCardData, recap: QuestionRecapEntry[]) => void;
}) {
  const { insight } = data;

  if (!insight.hasInsight) {
    return (
      <div className="w-full rounded-lg border border-[#DDE2EE] bg-white p-4">
        <p className="font-manrope text-[10.5px] font-bold uppercase tracking-[0.05em] text-[#6F6F8D]">
          {data.stepLabel}
        </p>
        <div className="mt-1.5 flex items-start gap-2">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-[#6F6F8D]" strokeWidth={1.9} />
          <p className="font-manrope text-[12.5px] leading-[18px] text-[#17173A]">{insight.noDataReason}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full rounded-lg border border-[#DDE2EE] bg-white p-4">
      <p className="font-manrope text-[13.5px] font-bold text-[#17173A]">Optimization opportunity</p>

      <InsightRow label="Problem:">{insight.problem}</InsightRow>
      <InsightRow label="What may be causing it:">{insight.cause}</InsightRow>
      <InsightRow label="Recommended change:">{insight.recommendedChange}</InsightRow>
      <InsightRow label="Why test this:">{insight.whyTest}</InsightRow>

      <div className="mt-3.5">
        <CoMarketerQuestionCard
          questions={[{ title: "Would you like to test this recommendation?", options: RESPONSE_OPTIONS }]}
          onComplete={(answers) => {
            const picked = answers[0];
            if (!picked) return;
            onRespond?.(RESPONSE_BY_LABEL[picked] ?? "explore-another", data, [
              { title: "Would you like to test this recommendation?", answer: picked },
            ]);
          }}
          onClose={() => {}}
        />
      </div>
    </div>
  );
}
