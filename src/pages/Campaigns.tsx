import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import L1Nav from "@/components/campaigns/L1Nav";
import TopNav from "@/components/campaigns/TopNav";
import PageHeader from "@/components/campaigns/PageHeader";
import TabBar from "@/components/campaigns/TabBar";
import TableToolbar from "@/components/campaigns/TableToolbar";
import CampaignTable from "@/components/campaigns/CampaignTable";
import Pagination from "@/components/campaigns/Pagination";
import ChatInterface from "@/components/ChatInterface";
import DecisioningNudge from "@/components/campaigns/DecisioningNudge";
import MarketingAgentsOverlay from "@/components/MarketingAgentsOverlay";
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
  // Nudge sequencing: the decisioning-engine discovery card (and the pulsing
  // dot on its L1 entry) shows first; the co-marketer nudge appears only
  // after it closes.
  const [showDecisioningNudge, setShowDecisioningNudge] = useState(true);
  const [showCoMarketerNudge, setShowCoMarketerNudge] = useState(false);
  const [enabledAgents, setEnabledAgents] = useState<Set<string>>(new Set());

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
      <L1Nav decisioningNudge={showDecisioningNudge} />

      {showDecisioningNudge && (
        <DecisioningNudge
          onClose={() => {
            setShowDecisioningNudge(false);
            setShowCoMarketerNudge(true);
          }}
        />
      )}

      <div className="flex min-w-0 flex-1 flex-col p-2">
        <TopNav
          onOpenChat={() => setChatOpen(true)}
          showCoMarketerNudge={showCoMarketerNudge}
        />

        <div className="mt-2 flex min-h-0 flex-1 gap-2">
          {/* Campaigns content */}
          <div className="scroll-slim min-w-0 flex-1 overflow-y-auto px-2 pt-4">
            <PageHeader />

            {/* gap keeps the scrollable tab strip clear of the toolbar when the
                docked chat squeezes this column; the toolbar never shrinks. */}
            <div className="mt-5 flex items-end justify-between gap-6 border-b border-[#DDE2EE]">
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
                onBotIconClick={() => setIsAgentsOverlayOpen(true)}
                enabledAgents={enabledAgents}
                setEnabledAgents={setEnabledAgents}
                onCloseInterface={() => setChatOpen(false)}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
