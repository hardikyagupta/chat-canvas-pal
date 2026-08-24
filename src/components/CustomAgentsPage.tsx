import React, { useMemo, useState } from 'react';
import { Search, MoreHorizontal, Pencil, Trash2, Bot, Copy, LayoutGrid, Rows3 } from 'lucide-react';
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
import { PAGE_COLUMN, pageHeaderPadTop } from './pageLayout';

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

type AgentView = 'grid' | 'list';

/**
 * Grid / list switch that sits on the page-title line, flush to the right edge
 * next to "Create agent". The active half is a raised white pill on a muted
 * track, so the switch reads as "changed" the moment a view is picked.
 */
const ViewToggle: React.FC<{ view: AgentView; onChange: (view: AgentView) => void }> = ({ view, onChange }) => {
  const options: { id: AgentView; label: string; Icon: typeof LayoutGrid }[] = [
    { id: 'grid', label: 'Card view', Icon: LayoutGrid },
    { id: 'list', label: 'Table view', Icon: Rows3 },
  ];
  return (
    <div
      role="group"
      aria-label="Agent layout"
      className="flex items-center gap-[2px] rounded-[9px] border border-[var(--color-line-input)] bg-[var(--color-surface-1)] p-[2px] shrink-0"
    >
      {options.map(({ id, label, Icon }) => {
        const active = view === id;
        return (
          <button
            key={id}
            type="button"
            aria-label={label}
            aria-pressed={active}
            title={label}
            onClick={() => onChange(id)}
            className={cn(
              'flex items-center justify-center size-[28px] rounded-[7px] transition-colors',
              active
                ? 'bg-card text-[var(--color-ink)] shadow-[0px_1px_2px_0px_oklch(0_0_0_/_0.10)]'
                : 'text-[var(--color-grey-soft)] hover:text-[var(--color-slate)]',
            )}
          >
            <Icon className="size-[15px]" />
          </button>
        );
      })}
    </div>
  );
};

/** Small status/type pill used by the table rows. */
const TablePill: React.FC<{ tone: 'success' | 'neutral' | 'accent'; children: React.ReactNode }> = ({ tone, children }) => (
  <span
    className={cn(
      'inline-flex items-center rounded-full px-[7px] py-[1px] text-[10px] leading-[14px] font-medium whitespace-nowrap',
      // NOTE: the `color:` prefix is required — without it tailwind-merge reads
      // these arbitrary values as font sizes and strips the text-[10px] above.
      tone === 'success' &&
        'bg-[color-mix(in_oklch,var(--color-success)_14%,transparent)] text-[color:color-mix(in_oklch,var(--color-success)_75%,var(--color-ink))]',
      tone === 'accent' &&
        'bg-[color-mix(in_oklch,var(--color-royal)_12%,transparent)] text-[color:var(--color-royal)]',
      tone === 'neutral' && 'bg-[var(--color-surface-2)] text-[color:var(--color-grey)]',
    )}
    style={MANROPE}
  >
    {children}
  </span>
);

const TH: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <th
    scope="col"
    className={cn(
      'px-[14px] py-[10px] text-left text-[12px] leading-[16px] font-semibold text-[var(--color-grey)] whitespace-nowrap',
      className,
    )}
    style={MANROPE}
  >
    {children}
  </th>
);

const AgentTable: React.FC<{
  agents: CustomAgent[];
  menuOpenId: string | null;
  onMenuOpenIdChange: (id: string | null) => void;
  onOpenAgent: (id: string) => void;
  onCloneAgent: (agent: CustomAgent) => void;
  onEditAgent: (agent: CustomAgent) => void;
  onDeleteAgent: (id: string, name: string) => void;
}> = ({ agents, menuOpenId, onMenuOpenIdChange, onOpenAgent, onCloneAgent, onEditAgent, onDeleteAgent }) => (
  <div className="w-full overflow-x-auto rounded-[14px] border border-[var(--color-line-input)] bg-card">
    <table className="w-full min-w-[900px] border-collapse">
      <thead>
        <tr className="border-b border-[var(--color-line-input)] bg-[var(--color-surface-0)]">
          <TH className="w-[236px]">Agent name</TH>
          <TH>Description</TH>
          <TH className="w-[132px]">Scope</TH>
          <TH className="w-[104px]">Visibility</TH>
          <TH className="w-[112px]">Last executed</TH>
          <TH className="w-[100px]">Last edited</TH>
          <TH className="w-[52px]"><span className="sr-only">Actions</span></TH>
        </tr>
      </thead>
      <tbody>
        {agents.map((agent) => {
          const chips = domainChips(agent);
          const workspace = (agent.tools?.visibility ?? 'workspace') === 'workspace';
          const menuOpen = menuOpenId === agent.id;
          return (
            <tr
              key={agent.id}
              className="group border-b border-[var(--color-line-input)] last:border-0 transition-colors hover:bg-[var(--color-surface-0)]"
            >
              <td className="px-[14px] py-[12px] align-middle">
                <div className="flex items-center gap-[10px] min-w-0">
                  {agent.avatarSrc ? (
                    <img src={agent.avatarSrc} alt="" className="size-[26px] rounded-full object-cover shrink-0" />
                  ) : (
                    <span className="flex size-[26px] items-center justify-center rounded-[8px] bg-[color-mix(in_oklch,var(--color-plum)_16%,transparent)] shrink-0">
                      <Bot className="size-[14px] text-[var(--color-plum)]" />
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => onOpenAgent(agent.id)}
                    className="min-w-0 truncate text-left text-[14px] leading-[20px] font-semibold text-[var(--color-ink)] hover:text-[var(--color-royal)] hover:underline transition-colors"
                    style={MANROPE}
                  >
                    {agent.name}
                  </button>
                </div>
              </td>
              <td className="px-[14px] py-[12px] align-middle">
                <span className="line-clamp-2 text-[13px] leading-[18px] text-[var(--color-grey)]" style={MANROPE}>
                  {agent.description || 'No description yet.'}
                </span>
              </td>
              <td className="px-[14px] py-[12px] align-middle">
                {chips.length > 0 ? (
                  <div className="flex flex-wrap gap-[4px]">
                    {chips.map((chip) => (
                      <ToolChip key={chip}>{chip}</ToolChip>
                    ))}
                  </div>
                ) : (
                  <span className="text-[13px] text-[var(--color-grey-soft)]" style={MANROPE}>—</span>
                )}
              </td>
              <td className="px-[14px] py-[12px] align-middle">
                <TablePill tone={workspace ? 'success' : 'neutral'}>{workspace ? 'Workspace' : 'Private'}</TablePill>
              </td>
              <td className="px-[14px] py-[12px] align-middle">
                <span
                  className={cn(
                    'text-[13px] leading-[18px] whitespace-nowrap',
                    agent.lastExecutedAt ? 'text-[var(--color-grey)]' : 'text-[var(--color-grey-soft)]',
                  )}
                  style={MANROPE}
                >
                  {agent.lastExecutedAt ? `${agent.lastExecutedAt} ago` : 'N/A'}
                </span>
              </td>
              <td className="px-[14px] py-[12px] align-middle">
                <span className="text-[13px] leading-[18px] text-[var(--color-grey)] whitespace-nowrap" style={MANROPE}>
                  {agent.updatedAt === 'now' ? 'Just now' : `${agent.updatedAt} ago`}
                </span>
              </td>
              <td className="px-[14px] py-[12px] align-middle">
                <div className={cn('flex justify-end', menuOpen ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 focus-within:opacity-100')}>
                  <ActionMenu open={menuOpen} onOpenChange={(o) => onMenuOpenIdChange(o ? agent.id : null)} modal={false}>
                    <ActionMenuTrigger asChild>
                      <button
                        type="button"
                        aria-label="Agent options"
                        className="flex items-center justify-center size-[26px] rounded-[7px] text-[var(--color-charcoal)] hover:bg-[var(--color-surface-1)] transition-colors"
                      >
                        <MoreHorizontal className="size-[16px]" />
                      </button>
                    </ActionMenuTrigger>
                    <ActionMenuContent align="end" side="bottom">
                      {agent.isBuiltIn ? (
                        <ActionMenuItem icon={Copy} onSelect={() => { onMenuOpenIdChange(null); onCloneAgent(agent); }}>
                          Clone
                        </ActionMenuItem>
                      ) : (
                        <>
                          <ActionMenuItem icon={Pencil} onSelect={() => { onMenuOpenIdChange(null); onEditAgent(agent); }}>
                            Edit details
                          </ActionMenuItem>
                          <ActionMenuItem
                            icon={Trash2}
                            variant="danger"
                            onSelect={() => { onMenuOpenIdChange(null); onDeleteAgent(agent.id, agent.name); }}
                          >
                            Delete
                          </ActionMenuItem>
                        </>
                      )}
                    </ActionMenuContent>
                  </ActionMenu>
                </div>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  </div>
);

const SectionLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <h2 className="text-[15px] font-semibold text-[var(--color-ink)]" style={MANROPE}>
    {children}
  </h2>
);

const AgentCard: React.FC<{
  agent: CustomAgent;
  menuOpen: boolean;
  onMenuOpenChange: (open: boolean) => void;
  onOpen: () => void;
  onClone: () => void;
  onEdit: () => void;
  onDelete: () => void;
}> = ({ agent, menuOpen, onMenuOpenChange, onOpen, onClone, onEdit, onDelete }) => {
  const chips = domainChips(agent);
  return (
    <div className="group relative flex flex-col overflow-hidden rounded-[16px] border border-[var(--color-line-input)] bg-card transition-shadow hover:shadow-[0px_4px_16px_-4px_oklch(0_0_0_/_0.08)]">
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
  onMenuOpenIdChange: (id: string | null) => void;
  onOpenAgent: (id: string) => void;
  onCloneAgent: (agent: CustomAgent) => void;
  onEditAgent: (agent: CustomAgent) => void;
  onDeleteAgent: (id: string, name: string) => void;
}> = ({ agents, compact, menuOpenId, onMenuOpenIdChange, onOpenAgent, onCloneAgent, onEditAgent, onDeleteAgent }) => (
  <div
    className={cn(
      'grid gap-[16px]',
      compact ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    )}
  >
    {agents.map((agent) => (
      <AgentCard
        key={agent.id}
        agent={agent}
        menuOpen={menuOpenId === agent.id}
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
  const [view, setView] = useState<AgentView>('grid');
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<CustomAgent | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

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
  // The docked widget column is too narrow for a table — always show cards there.
  const effectiveView: AgentView = compact ? 'grid' : view;

  const renderAgents = (agents: CustomAgent[]) =>
    effectiveView === 'list' ? (
      <AgentTable
        agents={agents}
        menuOpenId={menuOpenId}
        onMenuOpenIdChange={setMenuOpenId}
        onOpenAgent={onOpenAgent}
        onCloneAgent={onCloneAgent}
        onEditAgent={(agent) => { setEditing(agent); setCreateOpen(true); }}
        onDeleteAgent={(id, name) => setDeleteTarget({ id, name })}
      />
    ) : (
      <AgentGrid
        agents={agents}
        compact={compact}
        menuOpenId={menuOpenId}
        onMenuOpenIdChange={setMenuOpenId}
        onOpenAgent={onOpenAgent}
        onCloneAgent={onCloneAgent}
        onEditAgent={(agent) => { setEditing(agent); setCreateOpen(true); }}
        onDeleteAgent={(id, name) => setDeleteTarget({ id, name })}
      />
    );

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
      <div className={cn('mx-auto flex flex-col min-h-0 flex-1', PAGE_COLUMN)}>
        <div className={cn('flex flex-col gap-[16px] pb-[12px] w-full shrink-0', pageHeaderPadTop(compact))}>
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
            <div className="flex items-center gap-[10px] shrink-0">
              {!compact ? <ViewToggle view={view} onChange={setView} /> : null}
              {hasCustomAgents ? <NewAgentButton onClick={openCreate} label="Create agent" /> : null}
            </div>
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
              {(filteredCustom.length > 0 || !hasQuery) && (
                <section className="flex flex-col gap-[12px]">
                  <SectionLabel>Your agents</SectionLabel>
                  {filteredCustom.length === 0 ? (
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
                    renderAgents(filteredCustom)
                  )}
                </section>
              )}

              {filteredStarter.length > 0 && (
                <section className="flex flex-col gap-[12px]">
                  <SectionLabel>Get started with these</SectionLabel>
                  {renderAgents(filteredStarter)}
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
