import { useState } from "react";
import L1Nav from "@/components/campaigns/L1Nav";
import TopNav from "@/components/campaigns/TopNav";
import PageHeader from "@/components/campaigns/PageHeader";
import TabBar from "@/components/campaigns/TabBar";
import TableToolbar from "@/components/campaigns/TableToolbar";
import CampaignTable from "@/components/campaigns/CampaignTable";
import Pagination from "@/components/campaigns/Pagination";
import ChatInterface from "@/components/ChatInterface";
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
  const [isAgentsOverlayOpen, setIsAgentsOverlayOpen] = useState(false);
  const [enabledAgents, setEnabledAgents] = useState<Set<string>>(new Set());

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
      <L1Nav />

      <div className="flex min-w-0 flex-1 flex-col p-2">
        <TopNav onOpenChat={() => setChatOpen(true)} />

        <div className="mt-2 flex min-h-0 flex-1 gap-2">
          {/* Campaigns content */}
          <div className="scroll-slim min-w-0 flex-1 overflow-y-auto px-2 pt-4">
            <PageHeader />

            <div className="mt-5 flex items-end justify-between border-b border-[#DDE2EE]">
              <TabBar compact={chatOpen} />
              <div className="pb-2">
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

          {/* Co-marketer chat — docked third column */}
          {chatOpen && (
            <div className="flex shrink-0 items-start pr-1">
              <MarketingAgentsOverlay
                isOpen={isAgentsOverlayOpen}
                onOpenChange={setIsAgentsOverlayOpen}
                enabledAgents={enabledAgents}
                onToggleAgent={handleToggleAgent}
              />
              <ChatInterface
                initialExpanded={false}
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
