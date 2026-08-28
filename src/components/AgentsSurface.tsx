import React from 'react';
import CustomAgentsPage from './CustomAgentsPage';
import CustomAgentDetail from './CustomAgentDetail';
import { useCustomAgents } from '@/contexts/CustomAgentsContext';

export interface AgentsSurfaceProps {
  /** Minimized (docked widget) view — shrinks the page title + single column. */
  compact: boolean;
  /** Which agent's detail page is open; `null` shows the list. Controlled by the
   *  host so each surface navigates independently against the shared store. */
  selectedAgentId: string | null;
  onSelectAgentId: (id: string | null) => void;
  /** Start a chat with this agent — the host decides where the chat opens. */
  onStartChat: (agent: { id: string; name: string; avatarSrc?: string }, message: string) => void;
  /** Re-open one of the agent's past chats from its history list, by chat id. */
  onSelectChat: (id: string) => void;
  /** Override the surface both pages sit on. The co-marketer app leaves this
   *  alone (its own panel surface); the L1 page passes that shell's flat page
   *  background so the centre matches AI Dashboard rather than the chat app. */
  surfaceClassName?: string;
  /** Override the centred content column — the L1 page uses its own shell's
   *  full-width gutters instead of the co-marketer's 960px column. */
  columnClassName?: string;
  /**
   * Which shape this surface takes. 'chat' (default) is the co-marketer app,
   * where the agent page is where you chat and the list splits into "Your
   * agents" / "Get started with these". 'workspace' is the L1 page: the chat
   * lives in a docked column beside it, and the list is one merged table/grid.
   * See `CustomAgentDetail` and `CustomAgentsPage`.
   */
  variant?: 'chat' | 'workspace';
  /** Workspace variant only: "Start chat" in the detail header. */
  onOpenChat?: (agent: { id: string; name: string; avatarSrc?: string }) => void;
}

/**
 * The Agents surface — the list page, an agent's detail page, and the clone
 * overlay. Rendered by both the co-marketer chat app (as its `custom-agents`
 * view) and the L1 `/agents` page; the list is identical in both, and `variant`
 * picks which shape the detail page takes.
 *
 * The agent store comes from `useCustomAgents()`; only selection and where a
 * chat opens are the host's business.
 */
const AgentsSurface: React.FC<AgentsSurfaceProps> = ({
  compact,
  selectedAgentId,
  onSelectAgentId,
  onStartChat,
  onSelectChat,
  surfaceClassName,
  columnClassName,
  variant = 'chat',
  onOpenChat,
}) => {
  const {
    customAgents,
    starterAgents,
    allAgents,
    agentChats,
    cloningAgentName,
    detailLoadingId,
    createCustomAgent,
    updateAgent,
    deleteCustomAgent,
    cloneCustomAgent,
  } = useCustomAgents();

  const selectedAgent = allAgents.find((a) => a.id === selectedAgentId) ?? null;

  return (
    <>
      {selectedAgent ? (
        <CustomAgentDetail
          agent={selectedAgent}
          compact={compact}
          className={surfaceClassName}
          columnClassName={columnClassName}
          variant={variant}
          onOpenChat={
            onOpenChat
              ? () => onOpenChat({ id: selectedAgent.id, name: selectedAgent.name, avatarSrc: selectedAgent.avatarSrc })
              : undefined
          }
          loading={detailLoadingId === selectedAgent.id}
          onBack={() => onSelectAgentId(null)}
          onEditAgent={(id, data) => updateAgent(id, { ...data, updatedAt: 'now' })}
          onDeleteAgent={(id) => {
            deleteCustomAgent(id);
            if (id === selectedAgentId) onSelectAgentId(null);
          }}
          onUpdateAgent={updateAgent}
          onStartChat={(message) =>
            onStartChat({ id: selectedAgent.id, name: selectedAgent.name, avatarSrc: selectedAgent.avatarSrc }, message)
          }
          chats={agentChats.filter((c) => c.agentId === selectedAgent.id)}
          onSelectChat={onSelectChat}
        />
      ) : (
        <CustomAgentsPage
          customAgents={customAgents}
          starterAgents={starterAgents}
          compact={compact}
          className={surfaceClassName}
          columnClassName={columnClassName}
          variant={variant}
          onCreate={(data) => {
            const agent = createCustomAgent(data);
            onSelectAgentId(agent.id);
          }}
          onOpenAgent={(id) => onSelectAgentId(id)}
          onCloneAgent={(agent) => cloneCustomAgent(agent, onSelectAgentId)}
          onEditAgent={(id, data) => updateAgent(id, { ...data, updatedAt: 'now' })}
          onDeleteAgent={deleteCustomAgent}
        />
      )}
      {cloningAgentName ? (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-[var(--color-surface-0)]/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-[10px]">
            <span className="size-[22px] animate-spin rounded-full border-2 border-[var(--color-line-input)] border-t-[var(--color-plum)]" />
            <p className="text-[13px] font-medium text-[var(--color-grey)]" style={{ fontFamily: 'Manrope, sans-serif' }}>
              Cloning “{cloningAgentName}”…
            </p>
          </div>
        </div>
      ) : null}
    </>
  );
};

export default AgentsSurface;
