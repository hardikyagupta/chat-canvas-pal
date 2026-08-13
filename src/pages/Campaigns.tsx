import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import L1Nav from "@/components/campaigns/L1Nav";
import TopNav from "@/components/campaigns/TopNav";
import PageHeader from "@/components/campaigns/PageHeader";
import TabBar from "@/components/campaigns/TabBar";
import TableToolbar from "@/components/campaigns/TableToolbar";
import CampaignTable from "@/components/campaigns/CampaignTable";
import CoMarketerReviewBanner from "@/components/campaigns/CoMarketerReviewBanner";
import Pagination from "@/components/campaigns/Pagination";
import ChatInterface, { type ReviewCampaignContext } from "@/components/ChatInterface";
import DecisioningNudge from "@/components/campaigns/DecisioningNudge";
import AiDashboardNudge from "@/components/campaigns/AiDashboardNudge";
import MarketingAgentsOverlay from "@/components/MarketingAgentsOverlay";
import SegmentCreationOverlay, {
  type ReviewSegmentContext,
} from "@/components/campaigns/segment-creation/SegmentCreationOverlay";
import { marketingAgents } from "@/data/agents";

/**
 * Campaigns (New Engage) listing page.
 * Tapping "Ask co-marketer" docks the existing floating co-marketer chat
 * (<ChatInterface/>) as a third column on the right; the table then scrolls
 * horizontally (Campaign Info stays pinned) and the tab strip goes compact.
 */
export default function Campaigns() {
  const [chatOpen, setChatOpen] = useState(false);
  // `chatMounted` keeps the docked column in the DOM while its exit animation
  // plays; `chatIn` drives the enter/leave transition (slide + fade + width).
  const [chatMounted, setChatMounted] = useState(false);
  const [chatIn, setChatIn] = useState(false);
  // Bumped on every open so <ChatInterface/> remounts fresh — this clears any
  // leftover attachments/typed input (and the input height they grew to) from a
  // previous session, even if the prior instance never fully unmounted.
  const [chatSession, setChatSession] = useState(0);
  const [isAgentsOverlayOpen, setIsAgentsOverlayOpen] = useState(false);
  // Nudge sequencing: AI Dashboard → Co-marketer → Decisioning. Each step
  // drives the pulsing dot on its own L1/TopNav entry; "done" ends the
  // sequence entirely (dismiss, or "Got it" on the last step).
  const [nudgeStep, setNudgeStep] = useState<
    "ai-dashboard" | "comarketer" | "decisioning" | "done"
  >("ai-dashboard");
  const [enabledAgents, setEnabledAgents] = useState<Set<string>>(new Set());
  // Co-marketer review banner above the table; the × in its header hides it.
  const [reviewBannerOpen, setReviewBannerOpen] = useState(true);
  // Set by the banner's "Review" button so the docked chat opens straight into
  // a thread about that campaign. Cleared when the chat closes.
  const [reviewCampaign, setReviewCampaign] = useState<ReviewCampaignContext | null>(null);
  // "Review segment" on the Segment agent's artifact card — opens the segment
  // creation canvas on that card's rules. Cleared when the canvas closes.
  const [reviewSegment, setReviewSegment] = useState<ReviewSegmentContext | null>(null);

  // Coordinate mount → enter and leave → unmount so both directions animate.
  useEffect(() => {
    if (chatOpen) {
      setChatMounted(true);
      setChatSession((n) => n + 1);
      // Double rAF: the first frame lets the browser paint the fully-closed
      // state, the second flips to open. A single frame can get coalesced with
      // the mount, so the transition starts mid-way and looks like a hard jump.
      let raf2 = 0;
      const raf1 = requestAnimationFrame(() => {
        raf2 = requestAnimationFrame(() => setChatIn(true));
      });
      return () => {
        cancelAnimationFrame(raf1);
        cancelAnimationFrame(raf2);
      };
    }
    // Closing: play the leave transition, then unmount once it finishes.
    setChatIn(false);
    setReviewCampaign(null);
    if (isAgentsOverlayOpen) setIsAgentsOverlayOpen(false);
  }, [chatOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  // Mirrors the agent-toggle wiring used on the home (Index) page.
  const handleToggleAgent = (agentId: string, agentName: string) => {
    const agent = marketingAgents.find((a) => a.id === agentId);
    if (!agent) return;

    setEnabledAgents((prev) => {
      const next = new Set(prev);
      const isJoining = !next.has(agentId);
      if (isJoining) next.add(agentId);
      else next.delete(agentId);

      window.dispatchEvent(
        new CustomEvent("agentStatusChange", {
          detail: {
            name: agentName,
            status: isJoining ? "join" : "leave",
            icon: agent.icon,
            colorClass: agent.colorClass,
          },
        })
      );
      return next;
    });
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#F4F8FF]">
      <L1Nav
        nudgeHighlightKey={
          nudgeStep === "decisioning" || nudgeStep === "ai-dashboard"
            ? nudgeStep
            : undefined
        }
      />

      {nudgeStep === "ai-dashboard" && (
        <AiDashboardNudge
          onClose={() => setNudgeStep("done")}
          onNext={() => setNudgeStep("comarketer")}
        />
      )}

      {nudgeStep === "decisioning" && (
        <DecisioningNudge
          onClose={() => setNudgeStep("done")}
          onBack={() => setNudgeStep("comarketer")}
          onNext={() => setNudgeStep("done")}
        />
      )}

      <div className="flex min-w-0 flex-1 flex-col p-2">
        <TopNav
          onOpenChat={() => {
            // A plain "Ask co-marketer" open starts blank, never on a campaign
            // left over from a previous Review tap.
            setReviewCampaign(null);
            setChatOpen(true);
          }}
          showCoMarketerNudge={nudgeStep === "comarketer"}
          onBackToAiDashboardNudge={() => setNudgeStep("ai-dashboard")}
          onCoMarketerNext={() => setNudgeStep("decisioning")}
          onFinishNudgeSequence={() => setNudgeStep("done")}
        />

        <div className="mt-2 flex min-h-0 flex-1 gap-2">
          {/* Campaigns content */}
          <div className="scroll-slim min-w-0 flex-1 overflow-y-auto px-2 pt-4">
            <PageHeader />

            {reviewBannerOpen && (
              <div className="mt-5">
                <CoMarketerReviewBanner
                  onDismiss={() => setReviewBannerOpen(false)}
                  onReview={(campaign) => {
                    setReviewCampaign(campaign);
                    setChatOpen(true);
                  }}
                />
              </div>
            )}

            {/* gap keeps the scrollable tab strip clear of the toolbar when the
                docked chat squeezes this column; the toolbar never shrinks.
                16px below the banner; falls back to the page-header gap when
                the banner is dismissed. */}
            <div
              className={cn(
                "flex items-end justify-between gap-6 border-b border-[#DDE2EE]",
                reviewBannerOpen ? "mt-4" : "mt-5"
              )}
            >
              <TabBar compact={chatOpen} />
              <div className="shrink-0 pb-2">
                <TableToolbar compact={chatOpen} />
              </div>
            </div>

            <div className="mt-4">
              <CampaignTable />
            </div>

            <div className="mt-4 pb-8">
              <Pagination />
            </div>
          </div>

          {/* Co-marketer chat — docked third column (fills column height, never exceeds viewport) */}
          {chatMounted && (
            <div
              className={cn(
                // justify-end pins the fixed-width panel to the right edge, so
                // the growing clip box reveals it as a slide-in from the right
                // rather than a left-to-right wipe.
                // NOTE: no will-change/transform here — those establish a
                // stacking context that would trap the chat's fullscreen
                // `fixed z-50` overlay behind the table's `sticky z-10` column.
                "flex h-full min-h-0 shrink-0 justify-end overflow-hidden pr-1",
                "transition-[width,opacity] duration-[360ms] ease-[cubic-bezier(0.22,1,0.36,1)]",
                "motion-reduce:transition-none",
                chatIn ? "w-[474px] opacity-100" : "w-0 opacity-0"
              )}
              onTransitionEnd={(e) => {
                // Only react to the width transition on this element (not bubbled
                // child transitions) and only when we've finished closing.
                if (e.target === e.currentTarget && e.propertyName === "width" && !chatIn) {
                  setChatMounted(false);
                }
              }}
            >
              <MarketingAgentsOverlay
                isOpen={isAgentsOverlayOpen}
                onOpenChange={setIsAgentsOverlayOpen}
                enabledAgents={enabledAgents}
                onToggleAgent={handleToggleAgent}
              />
              <ChatInterface
                key={chatSession}
                initialExpanded={false}
                docked
                conversationVariant="campaigns"
                initialReviewCampaign={reviewCampaign ?? undefined}
                onBotIconClick={() => setIsAgentsOverlayOpen(true)}
                enabledAgents={enabledAgents}
                setEnabledAgents={setEnabledAgents}
                onCloseInterface={() => setChatOpen(false)}
                onReviewArtifact={(card) =>
                  setReviewSegment({ title: card.title, description: card.description })
                }
              />
            </div>
          )}
        </div>
      </div>

      {/* Segment creation canvas — "Review segment" on the Segment agent's card
          in the campaigns thread lands here too, on the same rules. */}
      <SegmentCreationOverlay
        open={reviewSegment !== null}
        segment={reviewSegment}
        onClose={() => setReviewSegment(null)}
      />
    </div>
  );
}
