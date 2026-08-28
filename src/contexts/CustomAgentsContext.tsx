import React from 'react';
import { toast } from 'sonner';
import type { LhsChatItem } from '@/components/LhsSidebar';
import {
  initialCustomAgents,
  STARTER_AGENTS,
  DEFAULT_AGENT_TOOLS,
  type CustomAgent,
} from '@/data/customAgents';
import { generateAgentAvatar } from '@/lib/agentAvatar';
import { CURRENT_USER_NAME } from '@/lib/chatMeta';

// Seeded chat history for the starter agents, so an agent's page opens with a
// populated Recents list instead of an empty one. These behave exactly like
// chats started in-session: opening one replays the agent's finished thread.
const seededAgentChats: LhsChatItem[] = [
  { id: 'agent-seed-report-1', title: "Generate last month's marketing performance report.", time: '3h', agentId: 'starter-monthly-report' },
  { id: 'agent-seed-launch-1', title: 'Help me plan the launch for our next campaign.', time: '6h', agentId: 'starter-campaign-launch' },
  { id: 'agent-seed-report-2', title: 'Compare Q2 revenue against the prior quarter', time: '1d', agentId: 'starter-monthly-report', owner: 'Dani Bristow' },
  { id: 'agent-seed-channel-1', title: 'Which channels need attention this week?', time: '1d', agentId: 'starter-channel-health' },
  { id: 'agent-seed-launch-2', title: 'Build a pre-flight QA checklist for the festive push', time: '2d', agentId: 'starter-campaign-launch', owner: 'Marcus Lee' },
  { id: 'agent-seed-audience-1', title: 'Which segments should I prioritize this quarter?', time: '2d', agentId: 'starter-audience-strategist' },
  { id: 'agent-seed-pulse-1', title: 'What should we know about competitors this week?', time: '3d', agentId: 'starter-market-pulse' },
  { id: 'agent-seed-report-3', title: 'Summarize which channels drove conversions last month', time: '4d', agentId: 'starter-monthly-report' },
  { id: 'agent-seed-channel-2', title: 'Check email deliverability after the domain change', time: '5d', agentId: 'starter-channel-health', owner: 'Priya Nair' },
  { id: 'agent-seed-audience-2', title: 'Find lapsed high-value buyers worth a win-back', time: '1w', agentId: 'starter-audience-strategist', owner: 'Sofia Almeida' },
];

/**
 * The two agents surfaces — the co-marketer app at `/` and the L1 page at
 * `/agents` — sit in separate shells with no client-side route between them, so
 * a React-only store would reset on the way over and the lists would drift.
 * Mirroring it into localStorage keeps them on one list across a reload and
 * across tabs. Still a prototype store: no server, and clearing the key resets.
 */
// v2 — v1 stores are abandoned rather than migrated, so the agents a session
// created while building this (and any older usage shape) drop away and the
// list starts from the Netcore agents alone.
const STORAGE_KEY = 'comarketer.customAgents.v2';

interface PersistedStore {
  customAgents: CustomAgent[];
  starterAgentPatches: Record<string, Partial<CustomAgent>>;
  agentChats: LhsChatItem[];
}

const readStore = (): PersistedStore | null => {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<PersistedStore>;
    if (!Array.isArray(parsed.customAgents)) return null;
    return {
      customAgents: parsed.customAgents,
      starterAgentPatches: parsed.starterAgentPatches ?? {},
      agentChats: Array.isArray(parsed.agentChats) ? parsed.agentChats : seededAgentChats,
    };
  } catch {
    return null; // Unavailable or corrupt storage just falls back to the seeds.
  }
};

export interface CustomAgentsContextValue {
  /** User-created agents, newest first. */
  customAgents: CustomAgent[];
  /** The immutable starter agents with any in-session edits laid over them. */
  starterAgents: CustomAgent[];
  /** Starter + custom, in list order. */
  allAgents: CustomAgent[];
  /** Chats started from an agent's page, shared across every agents surface. */
  agentChats: LhsChatItem[];
  setAgentChats: React.Dispatch<React.SetStateAction<LhsChatItem[]>>;
  /** Name shown in the "Cloning …" overlay while a clone is in flight. */
  cloningAgentName: string | null;
  /** Agent whose freshly-opened detail page is still showing its skeleton. */
  detailLoadingId: string | null;
  createCustomAgent: (data: { name: string; description: string; tools?: CustomAgent['tools'] }) => CustomAgent;
  updateAgent: (id: string, patch: Partial<CustomAgent>) => void;
  deleteCustomAgent: (id: string) => void;
  /**
   * Duplicates any agent into a new, independent custom agent. `onOpen` is the
   * host surface's navigation — it fires once the overlay has run, since where
   * the clone opens is view state, not store state.
   */
  cloneCustomAgent: (agent: CustomAgent, onOpen?: (id: string) => void) => void;
}

const CustomAgentsContext = React.createContext<CustomAgentsContextValue | null>(null);

/**
 * The agents store, shared by every surface that renders the Agents page — the
 * co-marketer chat app's `custom-agents` view and the L1 `/agents` page. Both
 * read and write the same list, so an agent created in one shows up in the other.
 *
 * Prototype store: React state only, no persistence.
 */
export const CustomAgentsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const persisted = React.useRef(readStore()).current;
  const [customAgents, setCustomAgents] = React.useState<CustomAgent[]>(persisted?.customAgents ?? initialCustomAgents);
  const [starterAgentPatches, setStarterAgentPatches] = React.useState<Record<string, Partial<CustomAgent>>>(
    persisted?.starterAgentPatches ?? {},
  );
  const [agentChats, setAgentChats] = React.useState<LhsChatItem[]>(persisted?.agentChats ?? seededAgentChats);
  // Clone transition: a brief loading overlay before the detail page opens,
  // then the freshly-opened detail page itself shows a skeleton before settling.
  const [cloningAgentName, setCloningAgentName] = React.useState<string | null>(null);
  const [detailLoadingId, setDetailLoadingId] = React.useState<string | null>(null);

  // Mirror every change out, so the other surface picks it up when it loads.
  React.useEffect(() => {
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ customAgents, starterAgentPatches, agentChats } satisfies PersistedStore),
      );
    } catch {
      // Storage full or blocked — the in-memory store still works for this tab.
    }
  }, [customAgents, starterAgentPatches, agentChats]);

  // …and pick up changes made in another tab, so two open surfaces stay level.
  React.useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY) return;
      const next = readStore();
      if (!next) return;
      setCustomAgents(next.customAgents);
      setStarterAgentPatches(next.starterAgentPatches);
      setAgentChats(next.agentChats);
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const starterAgents = React.useMemo(
    () => STARTER_AGENTS.map((agent) => ({ ...agent, ...starterAgentPatches[agent.id] })),
    [starterAgentPatches],
  );
  const allAgents = React.useMemo(() => [...starterAgents, ...customAgents], [starterAgents, customAgents]);

  const createCustomAgent = React.useCallback(
    (data: { name: string; description: string; tools?: CustomAgent['tools'] }): CustomAgent => {
      const agent: CustomAgent = {
        id: `agent-${Date.now()}`,
        name: data.name,
        description: data.description,
        instructions: '',
        files: [],
        updatedAt: 'now',
        avatarSrc: generateAgentAvatar(data.name),
        tools: data.tools ?? DEFAULT_AGENT_TOOLS,
        starterQuestions: [],
        createdBy: CURRENT_USER_NAME,
      };
      setCustomAgents((prev) => [agent, ...prev]);
      return agent;
    },
    [],
  );

  const updateAgent = React.useCallback((id: string, patch: Partial<CustomAgent>) => {
    if (STARTER_AGENTS.some((a) => a.id === id)) {
      setStarterAgentPatches((prev) => ({
        ...prev,
        [id]: { ...prev[id], ...patch, updatedAt: patch.updatedAt ?? 'now' },
      }));
      return;
    }
    setCustomAgents((prev) => prev.map((a) => (a.id === id ? { ...a, ...patch } : a)));
  }, []);

  const deleteCustomAgent = React.useCallback((id: string) => {
    setCustomAgents((prev) => prev.filter((a) => a.id !== id));
  }, []);

  // Duplicates any agent (starter or custom) into a new, independent custom
  // agent the user can edit — starter agents themselves stay read-only.
  const cloneCustomAgent = React.useCallback((agent: CustomAgent, onOpen?: (id: string) => void) => {
    const clone: CustomAgent = {
      ...agent,
      id: `agent-${Date.now()}`,
      name: `${agent.name} (copy)`,
      updatedAt: 'now',
      isBuiltIn: false,
      // The clone is the cloner's agent, whoever authored the original.
      createdBy: CURRENT_USER_NAME,
    };
    setCustomAgents((prev) => [clone, ...prev]);
    // Brief loading overlay before the detail view opens, then the freshly
    // opened page shows a skeleton before settling and confirming with a toast.
    setCloningAgentName(agent.name);
    window.setTimeout(() => {
      onOpen?.(clone.id);
      setCloningAgentName(null);
      setDetailLoadingId(clone.id);
      window.setTimeout(() => {
        setDetailLoadingId(null);
        toast.success('Agent cloned successfully');
      }, 700);
    }, 550);
  }, []);

  const value = React.useMemo<CustomAgentsContextValue>(
    () => ({
      customAgents,
      starterAgents,
      allAgents,
      agentChats,
      setAgentChats,
      cloningAgentName,
      detailLoadingId,
      createCustomAgent,
      updateAgent,
      deleteCustomAgent,
      cloneCustomAgent,
    }),
    [
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
    ],
  );

  return <CustomAgentsContext.Provider value={value}>{children}</CustomAgentsContext.Provider>;
};

export const useCustomAgents = (): CustomAgentsContextValue => {
  const ctx = React.useContext(CustomAgentsContext);
  if (!ctx) throw new Error('useCustomAgents must be used within a CustomAgentsProvider');
  return ctx;
};
