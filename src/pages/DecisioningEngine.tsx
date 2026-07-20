import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import L1Nav from "@/components/campaigns/L1Nav";
import TopNav from "@/components/campaigns/TopNav";
import ChatInterface from "@/components/ChatInterface";
import MarketingAgentsOverlay from "@/components/MarketingAgentsOverlay";
import DecisioningEmptyState from "@/components/decisioning/DecisioningEmptyState";
import DecisioningProcessingState from "@/components/decisioning/DecisioningProcessingState";
import DecisioningReadyState from "@/components/decisioning/DecisioningReadyState";
import { useDecisioningSetup } from "@/contexts/DecisioningSetupContext";
import { marketingAgents } from "@/data/agents";

export default function DecisioningEngine() {
  const { status } = useDecisioningSetup();

  // Docked co-marketer chat — same mount/enter/leave choreography as the
  // Campaigns page (see there for the double-rAF rationale).
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMounted, setChatMounted] = useState(false);
  const [chatIn, setChatIn] = useState(false);
  const [chatSession, setChatSession] = useState(0);
  const [isAgentsOverlayOpen, setIsAgentsOverlayOpen] = useState(false);
  const [enabledAgents, setEnabledAgents] = useState<Set<string>>(new Set());

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

  // Mirrors the agent-toggle wiring used on the Campaigns page.
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
      <L1Nav active="decisioning" />

      <div className="flex min-w-0 flex-1 flex-col p-2">
        <TopNav
          label="Customer Engagement"
          showCoMarketerNudge={false}
          onOpenChat={() => setChatOpen(true)}
        />

        <div className="mt-2 flex min-h-0 flex-1 gap-2">
          <div className="min-w-0 flex-1 overflow-y-auto px-4 pt-4">
            <div key={status} className="animate-in fade-in duration-500">
              {status === "processing" ? (
                <DecisioningProcessingState />
              ) : status === "ready" ? (
                <DecisioningReadyState />
              ) : (
                <DecisioningEmptyState />
              )}
            </div>
          </div>

          {/* Co-marketer chat — docked column, identical to Campaigns. */}
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
