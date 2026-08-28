import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import L1Nav from "@/components/campaigns/L1Nav";
import TopNav from "@/components/campaigns/TopNav";
import ChatInterface from "@/components/ChatInterface";
import MarketingAgentsOverlay from "@/components/MarketingAgentsOverlay";
import AgentsSurface from "@/components/AgentsSurface";

/** What the L1 page hands the docked chat when a chat opens from an agent — a
 *  fresh chat, a past one to replay, or just the agent bound to an empty
 *  composer ("Start chat"). Mirrors `initialAgentChat`. */
type AgentChatLaunch =
  | { agent: { id: string; name: string; avatarSrc?: string }; message: string }
  | { chatId: string }
  | { agent: { id: string; name: string; avatarSrc?: string }; bind: true };

/**
 * The Agents destination in the L1 rail — the same agents surface the
 * co-marketer app renders (`AgentsSurface`, reading the shared
 * `CustomAgentsProvider` store), wrapped in the L1 shell so it sits alongside
 * AI Dashboard, Engage and the rest.
 *
 * Starting a chat from an agent's detail page opens the docked co-marketer
 * column — the same choreography as AI Dashboard, Campaigns and Decisioning.
 */
export default function Agents() {
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);

  // Docked co-marketer chat — same mount/enter/leave choreography as the other
  // campaigns-ecosystem pages, so minimizing an expanded chat docks it to the
  // RHS instead of tearing it down.
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMounted, setChatMounted] = useState(false);
  const [chatIn, setChatIn] = useState(false);
  const [chatSession, setChatSession] = useState(0);
  const [chatInitialExpanded, setChatInitialExpanded] = useState(false);
  const [chatAgentLaunch, setChatAgentLaunch] = useState<AgentChatLaunch | null>(null);
  const [isAgentsOverlayOpen, setIsAgentsOverlayOpen] = useState(false);
  const [enabledAgents, setEnabledAgents] = useState<Set<string>>(new Set());

  // Opens the docked chat fresh (new session/key) with the given starting state.
  // If the chat is already open the mount effect below won't refire, so bump the
  // session here to force a remount against the new context.
  const openDockedChat = (opts: { expanded: boolean; agentLaunch?: AgentChatLaunch | null }) => {
    setChatInitialExpanded(opts.expanded);
    setChatAgentLaunch(opts.agentLaunch ?? null);
    if (chatOpen) setChatSession((n) => n + 1);
    setChatOpen(true);
  };

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

  const handleToggleAgent = (agentId: string) => {
    setEnabledAgents((prev) => {
      const next = new Set(prev);
      if (next.has(agentId)) next.delete(agentId);
      else next.add(agentId);
      return next;
    });
  };

  return (
    // Flat #F4F8FF, same as AI Dashboard and the rest of L1 — opaque, so the
    // `bg-main-app-bg` image painted on `body` stays behind it.
    <div className="flex h-screen w-full overflow-hidden bg-[#F4F8FF]">
      <L1Nav active="agents" />

      <div className="flex min-w-0 flex-1 flex-col p-2">
        <TopNav
          label="Agents"
          showCoMarketerNudge={false}
          onOpenChat={() => openDockedChat({ expanded: false })}
        />

        <div className="flex min-h-0 flex-1 mt-2 gap-2">
          {/* Content column. The agents surface centres itself on the shared
              PAGE_COLUMN and scrolls internally, so this is just the frame —
              `relative` for the clone overlay. `surfaceClassName` swaps the
              co-marketer panel surface for this shell's flat page background,
              so the centre reads like AI Dashboard, not the chat app. */}
          <div className="relative flex min-w-0 flex-1 flex-col overflow-hidden rounded-[8px]">
            <AgentsSurface
              compact={false}
              surfaceClassName="bg-[#F4F8FF]"
              // Full width on this shell's 16px gutters, same as AI Dashboard,
              // rather than the co-marketer's centred 960px column.
              columnClassName="w-full px-4"
              // The chat lives in the docked column here, not in the page, so
              // the detail page drops its composer and leads with the figures.
              variant="workspace"
              selectedAgentId={selectedAgentId}
              onSelectAgentId={setSelectedAgentId}
              // "Start chat" — open the docked chat empty, bound to this agent.
              onOpenChat={(agent) =>
                openDockedChat({ expanded: false, agentLaunch: { agent, bind: true } })
              }
              onStartChat={(agent, message) =>
                openDockedChat({ expanded: false, agentLaunch: { agent, message } })
              }
              // Re-opening a past chat from an agent's history: the docked chat
              // replays it as a finished thread rather than starting a new one.
              onSelectChat={(id) => openDockedChat({ expanded: false, agentLaunch: { chatId: id } })}
            />
          </div>

          {/* Co-marketer chat — docked column, identical to AI Dashboard's. */}
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
                initialExpanded={chatInitialExpanded}
                docked
                conversationVariant="campaigns"
                initialAgentChat={chatAgentLaunch ?? undefined}
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
