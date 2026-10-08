import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Maximize2, Workflow, X } from "lucide-react";
import JourneyCanvas from "@/components/campaigns/JourneyCanvas";
import type { FlowStep } from "@/components/campaigns/journeyFlowTree";
import type { NodeOptimizationInsight } from "@/components/campaigns/journeyOptimizationInsight.data";

export interface JourneyProposalCardData {
  /** The current journey with the recommended change already applied —
   *  what the canvas would look like if this became the active flow. */
  proposedFlow: FlowStep[];
  /** The same change, but as an illustrative Main/Test split (Split Action
   *  node, 95%/5%) — what the canvas would look like if this were tested
   *  rather than applied outright. Only ever shown in the expanded preview
   *  below; the small inline preview stays the plain proposedFlow so it
   *  keeps reading as "your journey with this one change" at a glance. */
  splitPreviewFlow: FlowStep[];
  triggerLabel: string | null;
  /** The step this proposal is anchored to, and the same insight it was
   *  built from — carried through so the host can act on the marketer's
   *  typed answer (create a test, apply directly, or look elsewhere)
   *  without re-deriving either. */
  anchorStepId: string;
  insight: NodeOptimizationInsight;
}

/** The three things a typed reply to this card's question can mean — see
 *  JourneyBuilder's handleCoMarketerBeforeSend, which is what actually
 *  interprets the marketer's own words (this card has no buttons of its
 *  own; the question is answered by typing, like the rest of this
 *  conversation). */
export type JourneyProposalResponse = "test" | "make-primary" | "explore-another";

/**
 * Shown right below the Journey Optimization Agent's goal-first insight
 * (JourneyBuilder's proceedToJourneyAnalysis) — a read-only preview of what
 * the journey would look like with the recommended change applied (the same
 * JourneyCanvas the real builder uses, just shrunk and non-interactive),
 * then the question that decides what happens next — asked as plain text,
 * answered by typing, not a button form.
 */
export default function JourneyOptimizationProposalCard({ data }: { data: JourneyProposalCardData }) {
  const [isExpanded, setIsExpanded] = useState(false);
  return (
    <div className="w-full space-y-3">
      <div className="overflow-hidden rounded-xl border border-[#DDE2EE] bg-white shadow-[0_1px_4px_rgba(23,23,58,0.06)]">
        <div className="flex items-center gap-2 border-b border-[#EBEBF5] bg-gradient-to-b from-[#F7F9FC] to-white px-3.5 py-2.5">
          <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-[#E7EDFF] text-[#2F68E5]">
            <Workflow className="h-3.5 w-3.5" strokeWidth={2.2} />
          </span>
          <p className="flex-1 font-manrope text-[11.5px] font-bold text-[#17173A]">Proposed journey preview</p>
          <button
            type="button"
            aria-label="Expand preview"
            onClick={() => setIsExpanded(true)}
            className="grid h-6 w-6 shrink-0 place-items-center rounded-md text-[#6F6F8D] transition-colors hover:bg-[#EAF1FF] hover:text-[#2F68E5]"
          >
            <Maximize2 className="h-3.5 w-3.5" strokeWidth={2.2} />
          </button>
        </div>
        <div className="h-[240px] bg-[#FBFCFE]">
          <JourneyCanvas
            triggerOnly
            hasJourney
            triggerLabel={data.triggerLabel}
            flow={data.proposedFlow}
            showActions={false}
          />
        </div>
      </div>
      <p className="font-manrope text-[13px] leading-[19px] text-[#17173A]">
        Would you like to test this optimization against your current journey, or make it your primary journey?
      </p>
      {isExpanded && (
        <ExpandedSplitPreview
          triggerLabel={data.triggerLabel}
          flow={data.splitPreviewFlow}
          onClose={() => setIsExpanded(false)}
        />
      )}
    </div>
  );
}

/** The "expand" popup — the same proposal, but as the illustrative Main
 *  Journey (95%) / Test Journey (5%) split so the marketer can see the
 *  actual branch structure a real test would create before ever asking for
 *  one. A plain overlay (same shape as TemplatePreviewModal's), not a
 *  navigation — closing it just unmounts this portal, so the chat behind it
 *  is exactly where it was, scroll position and all. */
function ExpandedSplitPreview({
  triggerLabel,
  flow,
  onClose,
}: {
  triggerLabel: string | null;
  flow: FlowStep[];
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#17173A]/20 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Proposed journey preview"
        className="relative flex h-[720px] max-h-[90vh] w-full max-w-[1080px] flex-col overflow-hidden rounded-2xl bg-white shadow-[0_24px_60px_rgba(23,23,58,0.22)]"
      >
        <div className="flex shrink-0 items-center gap-2 border-b border-[#EBEBF5] px-6 py-4">
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-[#E7EDFF] text-[#2F68E5]">
            <Workflow className="h-4 w-4" strokeWidth={2.2} />
          </span>
          <h2 className="flex-1 font-manrope text-[15px] font-bold text-[#17173A]">Proposed journey preview</h2>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="grid h-7 w-7 shrink-0 place-items-center rounded-md text-[#6F6F8D] transition-colors hover:bg-[#F3F6FF] hover:text-[#17173A]"
          >
            <X className="h-4.5 w-4.5" strokeWidth={2} />
          </button>
        </div>
        <div className="min-h-0 flex-1 bg-[#FBFCFE]">
          <JourneyCanvas triggerOnly hasJourney triggerLabel={triggerLabel} flow={flow} showActions={false} />
        </div>
      </div>
    </div>,
    document.body,
  );
}
