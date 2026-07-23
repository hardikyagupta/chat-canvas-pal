import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import L1Nav from "@/components/campaigns/L1Nav";
import TopNav from "@/components/campaigns/TopNav";
import PageHeader from "@/components/campaigns/PageHeader";
import TabBar from "@/components/campaigns/TabBar";
import TableToolbar from "@/components/campaigns/TableToolbar";
import JourneyTable from "@/components/campaigns/JourneyTable";
import Pagination from "@/components/campaigns/Pagination";
import { journeys as baseJourneys, journeyTabs, type Journey } from "@/components/campaigns/journeys.data";
import ChatInterface from "@/components/ChatInterface";
import MarketingAgentsOverlay from "@/components/MarketingAgentsOverlay";
import { marketingAgents } from "@/data/agents";

/**
 * Journeys listing page — same shell as Campaigns (reached via the Engage
 * L2 menu), with the table/tabs still standing in for real journey data.
 */
export default function Journeys() {
  const navigate = useNavigate();
  const location = useLocation();
  const [journeyList, setJourneyList] = useState<Journey[]>(baseJourneys);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMounted, setChatMounted] = useState(false);
  const [chatIn, setChatIn] = useState(false);
  const [chatSession, setChatSession] = useState(0);
  const [isAgentsOverlayOpen, setIsAgentsOverlayOpen] = useState(false);
  const [enabledAgents, setEnabledAgents] = useState<Set<string>>(new Set());
  const [showAiNudge, setShowAiNudge] = useState(true);

  // A journey activated from the builder arrives via router state. Prepend it
  // to the list, flag it (so the table shows the "made with AI" sparkle), and
  // clear the state so a refresh/back-nav doesn't re-add it.
  useEffect(() => {
    const activated = (location.state as {
      activatedJourney?: { name: string; generatedByAI?: boolean };
    } | null)?.activatedJourney;
    if (!activated) return;

    const newJourney: Journey = {
      id: "activated-journey",
      name: activated.name,
      status: "SCHEDULED",
      journeyId: "5115",
      startEnd: "--",
      lastEdited: "Just now",
      sent: "--",
      delivered: "--",
      openedRead: "--",
      openedRead2: "--",
      generatedByAI: activated.generatedByAI,
    };
    setJourneyList((prev) => [newJourney, ...prev]);
    setShowAiNudge(false);
    toast.success(
      activated.generatedByAI ? "AI journey created successfully" : "Journey activated successfully"
    );
    navigate(location.pathname, { replace: true, state: null });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (chatOpen) {
      setChatMounted(true);
      setChatSession((n) => n + 1);
      let raf2 = 0;
      const raf1 = requestAnimationFrame(() => {
        raf2 = requestAnimationFrame(() => setChatIn(true));
      });
      return () => {
        cancelAnimationFrame(raf1);
        cancelAnimationFrame(raf2);
      };
    }
    setChatIn(false);
    if (isAgentsOverlayOpen) setIsAgentsOverlayOpen(false);
  }, [chatOpen]); // eslint-disable-line react-hooks/exhaustive-deps

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
      <L1Nav active="engage" activeEngageItem="journey" />

      <div className="flex min-w-0 flex-1 flex-col p-2">
        <TopNav onOpenChat={() => setChatOpen(true)} showCoMarketerNudge={false} />

        <div className="mt-2 flex min-h-0 flex-1 gap-2">
          {/* Journeys content */}
          <div className="scroll-slim min-w-0 flex-1 overflow-y-auto px-2 pt-4">
            <PageHeader
              title="Journeys"
              subtitle="View and manage journeys"
              ctaLabel="New journey"
              showCtaChevron={false}
              showAiCta
              showAiNudge={showAiNudge}
              onCloseAiNudge={() => setShowAiNudge(false)}
              onCtaClick={() => navigate("/journeys/new")}
              onAiCtaClick={() => {
                setShowAiNudge(false);
                navigate("/journeys/new", { state: { openAI: true } });
              }}
            />

            <div className="mt-5 flex items-end justify-between gap-6 border-b border-[#DDE2EE]">
              <TabBar compact={chatOpen} tabs={journeyTabs} />
              <div className="shrink-0 pb-2">
                <TableToolbar compact={chatOpen} />
              </div>
            </div>

            <div className="mt-4">
              <JourneyTable journeys={journeyList} />
            </div>

            <div className="mt-4 pb-8">
              <Pagination unitLabel="journeys" />
            </div>
          </div>

          {/* Co-marketer chat — docked third column */}
          {chatMounted && (
            <div
              className={cn(
                "flex h-full min-h-0 shrink-0 justify-end overflow-hidden pr-1",
                "transition-[width,opacity] duration-[360ms] ease-[cubic-bezier(0.22,1,0.36,1)]",
                "motion-reduce:transition-none",
                chatIn ? "w-[474px] opacity-100" : "w-0 opacity-0"
              )}
              onTransitionEnd={(e) => {
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
