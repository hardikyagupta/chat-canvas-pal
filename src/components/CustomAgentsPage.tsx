import React, { useMemo, useState } from 'react';
import { Search, MoreHorizontal, Pencil, Trash2, Bot, Copy, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { AgentTools, CustomAgent } from '@/data/customAgents';
import {
  ActionMenu,
  ActionMenuTrigger,
  ActionMenuContent,
  ActionMenuItem,
} from '@/components/ui/action-menu';
import DeleteChatDialog from './DeleteChatDialog';
import CreateCustomAgentModal from './CreateCustomAgentModal';

const MANROPE: React.CSSProperties = { fontFamily: 'Manrope, sans-serif' };

interface CustomAgentsPageProps {
  title?: string;
  customAgents: CustomAgent[];
  starterAgents: CustomAgent[];
  searchPlaceholder?: string;
  onCreate: (data: { name: string; description: string; tools?: AgentTools }) => void;
  onOpenAgent: (id: string) => void;
  onCloneAgent: (agent: CustomAgent) => void;
  onEditAgent: (id: string, data: { name: string; description: string }) => void;
  onDeleteAgent: (id: string) => void;
  className?: string;
  /** Minimized (docked widget) view — shrinks the page title + single column. */
  compact?: boolean;
}

const NewAgentButton: React.FC<{ onClick: () => void; label?: string }> = ({ onClick, label = 'New agent' }) => (
  <button
    type="button"
    onClick={onClick}
    className="relative flex items-center justify-center px-[14px] py-[7px] rounded-[8px] bg-foreground overflow-hidden hover:bg-foreground/90 transition-colors shrink-0"
  >
    <span
      aria-hidden
      className="absolute inset-0 rounded-[8px] pointer-events-none"
      style={{ background: 'linear-gradient(to bottom, oklch(1 0 0 / 0.07) 82%, oklch(1 0 0 / 0.15) 94%)' }}
    />
    <span className="relative z-10 text-[14px] leading-[20px] font-medium text-background" style={MANROPE}>
      {label}
    </span>
  </button>
);

/** Enabled-domain pill (e.g. "campaigns") — read-only, shown on each agent card. */
const ToolChip: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span
    className="shrink-0 rounded-[6px] bg-[var(--color-surface-1)] px-[8px] py-[3px] text-[11px] leading-[14px] text-[var(--color-slate)]"
    style={{ fontFamily: 'monospace' }}
  >
    {children}
  </span>
);

/** The domains an agent's tools are scoped to, lowercased for the chip row. */
const domainChips = (agent: CustomAgent): string[] => {
  const domains = agent.tools?.domains;
  if (!domains) return [];
  return (
    [
      domains.campaigns && 'campaign',
      domains.journeys && 'journey',
      domains.segments && 'segment',
    ].filter(Boolean) as string[]
  );
};

const SectionLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <h2 className="text-[15px] font-semibold text-[var(--color-ink)]" style={MANROPE}>
    {children}
  </h2>
);

/** Placeholder shown in "Your agents" while a clone is being prepared — echoes
 *  the card shape with pulsing bars, a travelling shine, and a "Cloning…" pill,
 *  then the real card pops in over it once the clone lands. */
const CloningAgentCard: React.FC<{ agent: CustomAgent }> = ({ agent }) => (
  <div className="agent-clone-sweep relative flex flex-col overflow-hidden rounded-[16px] border border-[var(--color-line-input)] bg-card shadow-[0px_4px_16px_-4px_oklch(0_0_0_/_0.08)] animate-in fade-in-0 zoom-in-95 duration-300">
    <div className="flex flex-col gap-[10px] p-[18px]">
      {agent.avatarSrc ? (
        <img src={agent.avatarSrc} alt="" className="size-[36px] rounded-full object-cover shrink-0 opacity-60" />
      ) : (
        <span className="flex size-[36px] items-center justify-center rounded-[10px] bg-[color-mix(in_oklch,var(--color-plum)_16%,transparent)] shrink-0">
          <Bot className="size-[20px] text-[var(--color-plum)]" />
        </span>
      )}
      <div className="mt-[2px] h-[16px] w-[58%] rounded-[6px] bg-[var(--color-surface-1)] animate-pulse" />
      <div className="flex flex-col gap-[6px] min-h-[38px]">
        <div className="h-[11px] w-full rounded-[6px] bg-[var(--color-surface-1)] animate-pulse" />
        <div className="h-[11px] w-[78%] rounded-[6px] bg-[var(--color-surface-1)] animate-pulse" />
      </div>
      <div className="h-[18px] w-[68px] rounded-[6px] bg-[var(--color-surface-1)] animate-pulse" />
    </div>
    <div className="absolute right-[10px] top-[10px] z-10 flex items-center gap-[6px] rounded-[8px] bg-card/90 px-[8px] py-[4px] shadow-[0px_1px_2px_0px_oklch(0_0_0_/_0.12)] backdrop-blur-sm">
      <Loader2 className="size-[13px] animate-spin text-[var(--color-plum)]" />
      <span className="text-[11px] leading-[14px] font-medium text-[var(--color-slate)]" style={MANROPE}>
        Cloning…
      </span>
    </div>
  </div>
);

const AgentCard: React.FC<{
  agent: CustomAgent;
  menuOpen: boolean;
  reveal?: boolean;
  onMenuOpenChange: (open: boolean) => void;
  onOpen: () => void;
  onClone: () => void;
  onEdit: () => void;
  onDelete: () => void;
}> = ({ agent, menuOpen, reveal = false, onMenuOpenChange, onOpen, onClone, onEdit, onDelete }) => {
  const chips = domainChips(agent);
  return (
    <div
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-[16px] border border-[var(--color-line-input)] bg-card transition-shadow hover:shadow-[0px_4px_16px_-4px_oklch(0_0_0_/_0.08)]',
        // Fresh clone lands with a soft pop + plum ring that fades as it settles.
        reveal && 'animate-in fade-in-0 zoom-in-95 duration-500 ring-2 ring-[var(--color-plum)]/40',
      )}
    >
      <button
        type="button"
        onClick={onOpen}
        aria-label={`Open ${agent.name}`}
        className="flex flex-col gap-[10px] p-[18px] text-left"
      >
        {agent.avatarSrc ? (
          <img
            src={agent.avatarSrc}
            alt=""
            className="size-[36px] rounded-full object-cover shrink-0"
          />
        ) : (
          <span className="flex size-[36px] items-center justify-center rounded-[10px] bg-[color-mix(in_oklch,var(--color-plum)_16%,transparent)] shrink-0">
            <Bot className="size-[20px] text-[var(--color-plum)]" />
          </span>
        )}
        <span className="mt-[2px] truncate text-[16px] leading-[22px] font-semibold text-[var(--color-ink)]" style={MANROPE}>
          {agent.name}
        </span>
        <span
          className="text-[13px] leading-[19px] text-[var(--color-grey)] line-clamp-2 min-h-[38px]"
          style={MANROPE}
        >
          {agent.description || 'No description yet.'}
        </span>
        {chips.length > 0 ? (
          <div className="flex flex-wrap gap-[6px]">
            {chips.map((chip) => (
              <ToolChip key={chip}>{chip}</ToolChip>
            ))}
          </div>
        ) : null}
        {!agent.isBuiltIn ? (
          <span className="mt-[2px] text-[12px] leading-[16px] text-[var(--color-grey-soft)]" style={MANROPE}>
            Created {agent.updatedAt === 'now' ? 'just now' : `${agent.updatedAt} ago`}
          </span>
        ) : null}
      </button>

      <div
        className={cn(
          'absolute right-[10px] top-[10px]',
          // Default (starter) cards: kebab always visible. "Your agents" (custom):
          // hover-only, as before.
          agent.isBuiltIn || menuOpen ? 'block' : 'hidden group-hover:block',
        )}
      >
        <ActionMenu open={menuOpen} onOpenChange={onMenuOpenChange} modal={false}>
          <ActionMenuTrigger asChild>
            <button
              type="button"
              aria-label="Agent options"
              className="flex items-center justify-center size-[28px] rounded-[8px] bg-card/90 text-[var(--color-charcoal)] shadow-[0px_1px_2px_0px_oklch(0_0_0_/_0.12)] backdrop-blur-sm hover:bg-card transition-colors"
            >
              <MoreHorizontal className="size-[16px]" />
            </button>
          </ActionMenuTrigger>
          <ActionMenuContent align="end" side="bottom">
            {agent.isBuiltIn ? (
              <ActionMenuItem icon={Copy} onSelect={onClone}>Clone</ActionMenuItem>
            ) : (
              <>
                <ActionMenuItem icon={Pencil} onSelect={onEdit}>Edit details</ActionMenuItem>
                <ActionMenuItem icon={Trash2} variant="danger" onSelect={onDelete}>Delete</ActionMenuItem>
              </>
            )}
          </ActionMenuContent>
        </ActionMenu>
      </div>
    </div>
  );
};

const AgentGrid: React.FC<{
  agents: CustomAgent[];
  compact: boolean;
  menuOpenId: string | null;
  /** Placeholder card rendered first while a clone is being prepared. */
  cloningAgent?: CustomAgent | null;
  /** Pop-in the first card (the just-landed clone). */
  revealFirst?: boolean;
  onMenuOpenIdChange: (id: string | null) => void;
  onOpenAgent: (id: string) => void;
  onCloneAgent: (agent: CustomAgent) => void;
  onEditAgent: (agent: CustomAgent) => void;
  onDeleteAgent: (id: string, name: string) => void;
}> = ({ agents, compact, menuOpenId, cloningAgent = null, revealFirst = false, onMenuOpenIdChange, onOpenAgent, onCloneAgent, onEditAgent, onDeleteAgent }) => (
  <div
    className={cn(
      'grid gap-[16px]',
      compact ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    )}
  >
    {cloningAgent ? <CloningAgentCard agent={cloningAgent} /> : null}
    {agents.map((agent, i) => (
      <AgentCard
        key={agent.id}
        agent={agent}
        menuOpen={menuOpenId === agent.id}
        reveal={revealFirst && i === 0 && !cloningAgent}
        onMenuOpenChange={(o) => onMenuOpenIdChange(o ? agent.id : null)}
        onOpen={() => onOpenAgent(agent.id)}
        onClone={() => { onMenuOpenIdChange(null); onCloneAgent(agent); }}
        onEdit={() => { onMenuOpenIdChange(null); onEditAgent(agent); }}
        onDelete={() => { onMenuOpenIdChange(null); onDeleteAgent(agent.id, agent.name); }}
      />
    ))}
  </div>
);

const CustomAgentsPage: React.FC<CustomAgentsPageProps> = ({
  title = 'Agents',
  customAgents,
  starterAgents,
  searchPlaceholder = 'Search agents',
  onCreate,
  onOpenAgent,
  onCloneAgent,
  onEditAgent,
  onDeleteAgent,
  className,
  compact = false,
}) => {
  const [query, setQuery] = useState('');
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<CustomAgent | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  // Clone interaction: hold the source agent while its skeleton card shows, then
  // land the real clone with a pop-in + success toast.
  const [cloning, setCloning] = useState<CustomAgent | null>(null);
  const [revealClone, setRevealClone] = useState(false);

  const handleClone = (agent: CustomAgent) => {
    if (cloning) return; // one clone in flight at a time
    setMenuOpenId(null);
    setCloning(agent);
    window.setTimeout(() => {
      onCloneAgent(agent); // prepends the new "(copy)" into customAgents
      setCloning(null);
      setRevealClone(true);
      toast.success('Successfully cloned the agent', {
        description: `“${agent.name} (copy)” is ready in Your agents.`,
      });
      window.setTimeout(() => setRevealClone(false), 900);
    }, 1100);
  };

  const filterAgents = (list: CustomAgent[]) => {
    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (a) => a.name.toLowerCase().includes(q) || a.description.toLowerCase().includes(q),
    );
  };

  const filteredCustom = useMemo(() => filterAgents(customAgents), [customAgents, query]);
  const filteredStarter = useMemo(() => filterAgents(starterAgents), [starterAgents, query]);
  const hasQuery = query.trim().length > 0;
  const noResults = hasQuery && filteredCustom.length === 0 && filteredStarter.length === 0;

  const hasCustomAgents = customAgents.length > 0;

  const handleModalSubmit = (data: { name: string; description: string; tools?: AgentTools }) => {
    if (editing) onEditAgent(editing.id, data);
    else onCreate(data);
    setCreateOpen(false);
    setEditing(null);
  };

  const openCreate = () => {
    setEditing(null);
    setCreateOpen(true);
  };

  return (
    <div className={cn('flex flex-col h-full w-full overflow-hidden bg-[var(--color-surface-0)]', className)}>
      <div className="mx-auto flex flex-col min-h-0 w-full max-w-[1080px] flex-1 px-[20px]">
        <div className="flex flex-col gap-[16px] pb-[12px] w-full shrink-0 pt-[12px]">
          <div className="flex items-center justify-between gap-[12px] h-[34px]">
            <h1
              className={cn(
                'font-semibold text-[var(--color-ink)]',
                compact ? 'text-[16px] leading-[24px]' : 'text-[24px] leading-[32px]',
              )}
              style={MANROPE}
            >
              {title}
            </h1>
            {hasCustomAgents ? <NewAgentButton onClick={openCreate} label="Create agent" /> : null}
          </div>

          <div className="flex items-center gap-[8px] h-[36px] px-[14px] w-full rounded-[10px] border border-[var(--color-line-input)] bg-white focus-within:border-[var(--color-royal)] transition-colors">
            <Search className="size-[16px] text-[var(--color-grey-soft)] shrink-0" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={searchPlaceholder}
              className="flex-1 min-w-0 bg-transparent outline-none text-[14px] leading-[20px] text-[var(--color-ink)] placeholder:text-[var(--color-grey-soft)]"
              style={MANROPE}
            />
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto w-full pt-[12px] pb-[32px] hover-scroll">
          {noResults ? (
            <div className="flex items-center justify-center w-full py-[48px]">
              <p className="text-[14px] text-[var(--color-grey-soft)]" style={MANROPE}>
                No agents found
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-[28px]">
              {(filteredCustom.length > 0 || cloning || !hasQuery) && (
                <section className="flex flex-col gap-[12px]">
                  <SectionLabel>Your agents</SectionLabel>
                  {filteredCustom.length === 0 && !cloning ? (
                    <div className="flex flex-col items-center justify-center gap-[12px] rounded-[16px] border border-dashed border-[var(--color-line-input)] bg-[oklch(1_0_0_/_0.4)] px-[24px] py-[32px] text-center">
                      <p className="text-[14px] font-medium text-[var(--color-ink)]" style={MANROPE}>
                        No custom agents yet
                      </p>
                      <p className="max-w-[360px] text-[13px] leading-[19px] text-[var(--color-grey)]" style={MANROPE}>
                        Set instructions and reference files once, then chat with a tailored agent again and again.
                      </p>
                      <NewAgentButton onClick={openCreate} label="Create agent" />
                    </div>
                  ) : (
                    <AgentGrid
                      agents={filteredCustom}
                      compact={compact}
                      menuOpenId={menuOpenId}
                      cloningAgent={cloning}
                      revealFirst={revealClone}
                      onMenuOpenIdChange={setMenuOpenId}
                      onOpenAgent={onOpenAgent}
                      onCloneAgent={handleClone}
                      onEditAgent={(agent) => { setEditing(agent); setCreateOpen(true); }}
                      onDeleteAgent={(id, name) => setDeleteTarget({ id, name })}
                    />
                  )}
                </section>
              )}

              {filteredStarter.length > 0 && (
                <section className="flex flex-col gap-[12px]">
                  <SectionLabel>Get started with these</SectionLabel>
                  <AgentGrid
                    agents={filteredStarter}
                    compact={compact}
                    menuOpenId={menuOpenId}
                    onMenuOpenIdChange={setMenuOpenId}
                    onOpenAgent={onOpenAgent}
                    onCloneAgent={handleClone}
                    onEditAgent={(agent) => { setEditing(agent); setCreateOpen(true); }}
                    onDeleteAgent={(id, name) => setDeleteTarget({ id, name })}
                  />
                </section>
              )}
            </div>
          )}
        </div>
      </div>

      <CreateCustomAgentModal
        open={createOpen}
        onClose={() => { setCreateOpen(false); setEditing(null); }}
        onSubmit={handleModalSubmit}
        initial={editing}
      />

      <DeleteChatDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title="Delete agent?"
        fallbackName="this agent"
        chatName={deleteTarget?.name}
        onConfirm={() => {
          if (deleteTarget) onDeleteAgent(deleteTarget.id);
          setDeleteTarget(null);
        }}
      />
    </div>
  );
};

export default CustomAgentsPage;
