import React, { useMemo, useState } from 'react';
import { Search, MoreHorizontal, Pencil, Trash2, Bot } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CustomAgent } from '@/data/customAgents';
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
  agents: CustomAgent[];
  searchPlaceholder?: string;
  onCreate: (data: { name: string; description: string }) => void;
  onOpenAgent: (id: string) => void;
  onEditAgent: (id: string, data: { name: string; description: string }) => void;
  onDeleteAgent: (id: string) => void;
  className?: string;
  /** Minimized (docked widget) view — shrinks the page title + single column. */
  compact?: boolean;
}

// Black primary button — matches the ChatListPage "New chat" button.
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

/**
 * A single custom-agent card: a bot avatar, name + description (2-line clamp),
 * and a hover three-dot menu (Edit details / Archive / Delete). Tapping the card
 * body opens the agent detail page.
 */
const AgentCard: React.FC<{
  agent: CustomAgent;
  menuOpen: boolean;
  onMenuOpenChange: (open: boolean) => void;
  onOpen: () => void;
  onEdit: () => void;
  onDelete: () => void;
}> = ({ agent, menuOpen, onMenuOpenChange, onOpen, onEdit, onDelete }) => (
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
      <span className="mt-[2px] text-[12px] leading-[16px] text-[var(--color-grey-soft)]" style={MANROPE}>
        Edited {agent.updatedAt === 'now' ? 'just now' : `${agent.updatedAt} ago`}
      </span>
    </button>

    {/* Three-dot menu — top-right, appears on hover / when open. */}
    <div className={cn('absolute right-[10px] top-[10px]', menuOpen ? 'block' : 'hidden group-hover:block')}>
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
          <ActionMenuItem icon={Pencil} onSelect={onEdit}>Edit details</ActionMenuItem>
          <ActionMenuItem icon={Trash2} variant="danger" onSelect={onDelete}>Delete</ActionMenuItem>
        </ActionMenuContent>
      </ActionMenu>
    </div>
  </div>
);

/**
 * Full-page grid of custom agents. A sticky header (title + New agent, then
 * search) sits above a responsive card grid. When there are no agents, an empty
 * state invites the user to create their first one. Layout mirrors ReportsPage.
 */
const CustomAgentsPage: React.FC<CustomAgentsPageProps> = ({
  title = 'Agents',
  agents,
  searchPlaceholder = 'Search agents',
  onCreate,
  onOpenAgent,
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

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return agents.filter(
      (a) => !q || a.name.toLowerCase().includes(q) || a.description.toLowerCase().includes(q)
    );
  }, [agents, query]);

  const isEmpty = agents.length === 0;

  const handleModalSubmit = (data: { name: string; description: string }) => {
    if (editing) onEditAgent(editing.id, data);
    else onCreate(data);
    setCreateOpen(false);
    setEditing(null);
  };

  return (
    <div className={cn('flex flex-col h-full w-full overflow-hidden bg-[var(--color-surface-0)]', className)}>
      <div className="mx-auto flex flex-col min-h-0 w-full max-w-[1080px] flex-1 px-[20px]">
        {/* Sticky header — title + New agent, then search. Padding matches the
            agent detail page so the two views line up. */}
        <div className="flex flex-col gap-[16px] pb-[12px] w-full shrink-0 pt-[12px]">
          <div className="flex items-center justify-between gap-[12px] h-[34px]">
            <h1
              className={cn(
                'font-semibold text-[var(--color-ink)]',
                compact ? 'text-[16px] leading-[24px]' : 'text-[24px] leading-[32px]'
              )}
              style={MANROPE}
            >
              {title}
            </h1>
            {!isEmpty && <NewAgentButton onClick={() => { setEditing(null); setCreateOpen(true); }} />}
          </div>

          {!isEmpty && (
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
          )}
        </div>

        {/* Body — empty state or card grid. */}
        <div className="flex-1 min-h-0 overflow-y-auto w-full pt-[12px] pb-[32px] hover-scroll">
          {isEmpty ? (
            <div className="flex flex-col items-center justify-center gap-[14px] py-[72px] text-center">
              <div className="flex size-[56px] items-center justify-center rounded-[16px] bg-[color-mix(in_oklch,var(--color-plum)_14%,transparent)]">
                <Bot className="size-[28px] text-[var(--color-plum)]" />
              </div>
              <div className="flex flex-col gap-[6px]">
                <p className="text-[17px] font-semibold text-[var(--color-ink)]" style={MANROPE}>
                  Create your first custom agent
                </p>
                <p className="max-w-[360px] text-[13px] leading-[19px] text-[var(--color-grey)]" style={MANROPE}>
                  Set instructions and reference files once, then chat with a tailored agent again and again.
                </p>
              </div>
              <NewAgentButton onClick={() => { setEditing(null); setCreateOpen(true); }} />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex items-center justify-center w-full py-[48px]">
              <p className="text-[14px] text-[var(--color-grey-soft)]" style={MANROPE}>
                No agents found
              </p>
            </div>
          ) : (
            <div
              className={cn(
                'grid gap-[16px]',
                compact ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
              )}
            >
              {filtered.map((agent) => (
                <AgentCard
                  key={agent.id}
                  agent={agent}
                  menuOpen={menuOpenId === agent.id}
                  onMenuOpenChange={(o) => setMenuOpenId(o ? agent.id : null)}
                  onOpen={() => onOpenAgent(agent.id)}
                  onEdit={() => { setMenuOpenId(null); setEditing(agent); setCreateOpen(true); }}
                  onDelete={() => { setMenuOpenId(null); setDeleteTarget({ id: agent.id, name: agent.name }); }}
                />
              ))}
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
