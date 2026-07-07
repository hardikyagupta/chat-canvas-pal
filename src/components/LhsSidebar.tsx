import React, { useState, useRef, useEffect } from 'react';
import { Plus, MessageSquare, Bookmark, Settings, ChevronDown, MoreHorizontal, X, Check, Search, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import ChatActionsMenu from './ChatActionsMenu';
import DeleteChatDialog from './DeleteChatDialog';
import SearchChatsModal from './SearchChatsModal';

export interface LhsChatItem {
  id: string;
  title: string;
  time: string;
}

interface LhsSidebarProps {
  collapsed?: boolean;
  chats?: LhsChatItem[];
  activeChatId?: string | null;
  // Chat that is currently generating output — shows a live "active" indicator.
  busyChatId?: string | null;
  onSelectChat?: (id: string) => void;
  onNewChat?: () => void;
  onOpenChats?: () => void;
  onOpenBookmarks?: () => void;
  onOpenSettings?: () => void;
  // Collapse/expand the sidebar. The header toggle collapses; when collapsed the
  // logo doubles as the expand button.
  onToggleCollapse?: () => void;
}

export const defaultChats: LhsChatItem[] = [
  { id: '1', title: 'Animate thumbs feedback', time: '1h' },
  { id: '2', title: 'Add follow-up questions scenario for onboarding edge cases', time: '2h' },
  { id: '3', title: 'Create reusable workflow skill', time: '2h' },
  { id: '4', title: 'Check record workflow feature and validate the export pipeline end to end', time: '2h' },
  { id: '5', title: 'Inspect shimmer component', time: '16h' },
  { id: '6', title: 'Add teaser type icons', time: '2d' },
  { id: '7', title: 'Inspect shimmer loading skeleton across all breakpoints', time: '2d' },
  { id: '8', title: 'Name shimmer border component', time: '6d' },
  { id: '9', title: 'Access Figma MCP', time: '1w' },
  { id: '10', title: 'Refactor sidebar layout and the collapse transition behaviour', time: '1w' },
  { id: '11', title: 'Update color palette tokens', time: '1w' },
  { id: '12', title: 'Fix scroll overflow in chat list', time: '2w' },
  { id: '13', title: 'Design new onboarding flow', time: '2w' },
  { id: '14', title: 'Integrate MCP server tools', time: '2w' },
  { id: '15', title: 'Build prompt chaining demo', time: '3w' },
  { id: '16', title: 'Export design tokens to CSS custom properties for the whole system', time: '3w' },
  { id: '17', title: 'Review Claude API rate limits', time: '1mo' },
  { id: '18', title: 'Optimize token usage in chains', time: '1mo' },
  { id: '19', title: 'Write tests for agent hooks', time: '1mo' },
  { id: '20', title: 'Ship co-marketer v1', time: '1mo' },
];

// 40×40 slot that centers an icon. Matches the collapsed rail's inner width
// (64 − 2×12px padding = 40px) so each menu button becomes a perfect 40×40 square
// when collapsed, the icon sits dead-center, and it never moves when expanded.
// The icon's left edge lands at 24px — the shared start line for every label.
const ICON_SLOT = 'flex items-center justify-center w-[40px] h-[40px] shrink-0';

// Small dark tooltip shown to the right of an icon (only rendered when collapsed)
const RailTooltip: React.FC<{ label: string }> = ({ label }) => (
  <span
    className="pointer-events-none absolute left-full ml-[10px] top-1/2 -translate-y-1/2 z-[100] whitespace-nowrap rounded-[6px] bg-foreground px-[8px] py-[4px] text-[12px] leading-[16px] text-background opacity-0 translate-x-[-4px] transition-all duration-150 group-hover:opacity-100 group-hover:translate-x-0"
    style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 500 }}
  >
    {label}
  </span>
);

const LhsSidebar: React.FC<LhsSidebarProps> = ({
  collapsed = false,
  chats = defaultChats,
  activeChatId = '1',
  busyChatId = null,
  onSelectChat,
  onNewChat,
  onOpenChats,
  onOpenBookmarks,
  onOpenSettings,
  onToggleCollapse,
}) => {
  const [chatsOpen, setChatsOpen] = useState(true);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const scrollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Local (prototype) state for per-chat actions: rename overrides, deletions,
  // bookmarks, which row's menu is open, and the inline-rename editing state.
  const [titleOverrides, setTitleOverrides] = useState<Record<string, string>>({});
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const renameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (renamingId) renameInputRef.current?.focus();
  }, [renamingId]);

  const startRename = (id: string, current: string) => {
    setMenuOpenId(null);
    setRenamingId(id);
    setRenameValue(current);
  };
  const commitRename = () => {
    if (renamingId) {
      const next = renameValue.trim();
      if (next) setTitleOverrides((prev) => ({ ...prev, [renamingId]: next }));
    }
    setRenamingId(null);
  };
  const cancelRename = () => setRenamingId(null);
  const toggleBookmark = (id: string) =>
    setBookmarkedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  // Delete goes through a confirmation dialog first.
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);
  const requestDelete = (id: string, title: string) => {
    setMenuOpenId(null);
    setDeleteTarget({ id, title });
  };
  const confirmDelete = () => {
    if (deleteTarget) setDeletedIds((prev) => new Set(prev).add(deleteTarget.id));
    setDeleteTarget(null);
  };

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    el.classList.add('is-scrolling');
    if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current);
    scrollTimerRef.current = setTimeout(() => {
      el.classList.remove('is-scrolling');
    }, 800);
  };

  const menuActions = [
    // New chat's plus sits in a light-blue pill (Figma), so it renders specially.
    // Search now lives in the header (next to the collapse toggle), not here.
    { key: 'new-chat', label: 'New chat', icon: Plus, onClick: onNewChat, isNewChat: true },
    { key: 'chats', label: 'Chats', icon: MessageSquare, onClick: onOpenChats },
    { key: 'bookmarks', label: 'Bookmarks', icon: Bookmark, onClick: onOpenBookmarks },
  ];

  // Labels self-clip via max-width (so the root can be overflow-visible for tooltips)
  // and fade out. Icons live in fixed slots and never move, so there is no jump.
  const labelCls = 'overflow-hidden whitespace-nowrap';
  const labelStyle = (extra?: React.CSSProperties): React.CSSProperties => ({
    maxWidth: collapsed ? 0 : 200,
    opacity: collapsed ? 0 : 1,
    transition: 'max-width 260ms cubic-bezier(0.22, 1, 0.36, 1), opacity 150ms ease',
    ...extra,
  });

  return (
    <div
      className={cn(
        'atmo-glass relative z-30 flex flex-col items-start h-full bg-sidebar-background flex-shrink-0 border-r border-[var(--color-line)]',
        // overflow-visible when collapsed lets the rail tooltips escape the 64px width
        collapsed ? 'overflow-visible' : 'overflow-hidden'
      )}
      style={{ width: collapsed ? 64 : 288, transition: 'width 300ms cubic-bezier(0.22, 1, 0.36, 1)' }}
    >
      {/* Header — logo + wordmark + collapse toggle. The logo circle sits in the
          centered icon slot; when collapsed it doubles as the expand button
          (logo fades to a panel-open icon on hover). The wordmark clips/fades. */}
      <div className="flex items-center px-[12px] h-[56px] w-full shrink-0">
        <button
          type="button"
          onClick={collapsed ? onToggleCollapse : undefined}
          aria-label={collapsed ? 'Expand sidebar' : 'Co-marketer'}
          className={cn(
            'group relative flex items-center justify-center w-[40px] h-[40px] shrink-0 rounded-[8px] transition-colors',
            collapsed ? 'cursor-pointer hover:bg-[oklch(0_0_0_/_0.06)]' : 'cursor-default'
          )}
        >
          <span
            className={cn(
              'flex items-center justify-center rounded-full overflow-hidden size-[24px] bg-[var(--color-plum)] transition-opacity duration-150',
              collapsed && 'group-hover:opacity-0'
            )}
          >
            <img
              src="/co-marketer-logo.gif"
              alt="Co-marketer"
              className="size-full object-cover"
            />
          </span>
          {collapsed && (
            <>
              <span className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-150 group-hover:opacity-100">
                <PanelLeftOpen className="size-[16px] text-[var(--color-slate)]" />
              </span>
              <RailTooltip label="Expand sidebar" />
            </>
          )}
        </button>

        <span
          className={cn('flex-1 min-w-0 font-bold text-[16px] leading-[20px] text-[var(--color-ink)]', labelCls)}
          style={labelStyle({ fontFamily: 'Manrope, sans-serif' })}
        >
          Co-marketer
        </span>

        {!collapsed && (
          <div className="flex items-center gap-[2px] shrink-0">
            {/* Search — opens the same modal as the old menu item */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => setSearchModalOpen(true)}
                  aria-label="Search"
                  className="flex items-center justify-center p-[8px] rounded-[8px] hover:bg-[oklch(0_0_0_/_0.06)] transition-colors shrink-0"
                >
                  <Search className="size-[16px] text-[var(--color-slate)]" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="border-0 bg-foreground text-background text-[12px] leading-[16px] px-[8px] py-[4px]" style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 500 }}>
                Search
              </TooltipContent>
            </Tooltip>
            {/* Collapse toggle */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={onToggleCollapse}
                  aria-label="Collapse sidebar"
                  className="flex items-center justify-center p-[8px] rounded-[8px] hover:bg-[oklch(0_0_0_/_0.06)] transition-colors shrink-0"
                >
                  <PanelLeftClose className="size-[16px] text-[var(--color-slate)]" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="border-0 bg-foreground text-background text-[12px] leading-[16px] px-[8px] py-[4px]" style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 500 }}>
                Collapse sidebar
              </TooltipContent>
            </Tooltip>
          </div>
        )}
      </div>

      {/* Menu actions — icons centered in 40-wide slots (aligned with the logo),
          32px-tall rows. */}
      <div className="flex flex-col gap-[4px] items-start w-full px-[12px] pt-[8px] shrink-0">
        {menuActions.map(({ key, label, icon: Icon, onClick, isNewChat }) => (
          <button
            key={key}
            type="button"
            onClick={onClick}
            aria-label={label}
            className="group relative flex h-[32px] items-center w-full rounded-[8px] hover:bg-[oklch(0_0_0_/_0.06)] transition-colors"
          >
            <span className="flex items-center justify-center w-[40px] h-[32px] shrink-0">
              {isNewChat ? (
                <span className="flex items-center justify-center rounded-full bg-[var(--color-royal-pale)] p-[5px]">
                  <Plus className="size-[12px] text-[var(--color-royal)]" strokeWidth={2.5} />
                </span>
              ) : (
                <Icon className="size-[18px] text-[var(--color-charcoal)]" />
              )}
            </span>
            <span
              className={cn('text-[14px] text-[var(--color-charcoal)]', labelCls)}
              style={labelStyle({ fontFamily: 'Manrope, sans-serif', fontWeight: 400 })}
            >
              {label}
            </span>
            {collapsed && <RailTooltip label={label} />}
          </button>
        ))}
      </div>

      {/* Chats section header + list — fades/clips away when collapsed */}
      <div
        className={cn(
          'flex flex-col flex-1 min-h-0 w-full transition-opacity duration-150',
          collapsed ? 'opacity-0 pointer-events-none' : 'opacity-100 delay-100'
        )}
      >
        {/* Section header with expand/collapse chevron */}
        <button
          type="button"
          onClick={() => setChatsOpen((v) => !v)}
          className="flex gap-[8px] items-center pl-[24px] py-[8px] w-full shrink-0 mt-[8px]"
        >
          <span
            className="text-[12px] leading-[16px] text-[var(--color-grey)] tracking-[0.035px] whitespace-nowrap"
            style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 400 }}
          >
            Recent
          </span>
          <ChevronDown
            className={cn(
              'size-[14px] text-[var(--color-grey)] shrink-0 transition-transform duration-200',
              !chatsOpen && '-rotate-90'
            )}
          />
        </button>

        {/* Scrollable chat list */}
        {chatsOpen && (
          <div ref={scrollRef} onScroll={handleScroll} className="chat-scroll flex-1 min-h-0 overflow-y-auto w-full px-[12px] pb-[8px]">
            <div className="flex flex-col gap-[2px] items-start w-full">
              {chats.filter((chat) => !deletedIds.has(chat.id)).map((chat) => {
                const isActive = chat.id === activeChatId;
                const isBusy = chat.id === busyChatId;
                const isRenaming = chat.id === renamingId;
                const isMenuOpen = chat.id === menuOpenId;
                const title = titleOverrides[chat.id] ?? chat.title;
                return (
                  <div
                    key={chat.id}
                    className={cn(
                      'group relative flex gap-[8px] h-[34px] items-center pl-[12px] pr-[8px] w-full rounded-[10px] overflow-hidden transition-colors',
                      (isActive || isRenaming) ? 'bg-[oklch(0_0_0_/_0.12)]' : 'hover:bg-[oklch(0_0_0_/_0.06)]'
                    )}
                  >
                    {isRenaming ? (
                      <>
                        <input
                          ref={renameInputRef}
                          value={renameValue}
                          onChange={(e) => setRenameValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') commitRename();
                            else if (e.key === 'Escape') cancelRename();
                          }}
                          className="flex-1 min-w-0 bg-transparent border-0 p-0 text-[13px] text-[var(--color-charcoal)] focus:outline-none"
                          style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 500 }}
                        />
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              type="button"
                              onClick={cancelRename}
                              aria-label="Cancel"
                              className="flex items-center justify-center size-[24px] rounded-[6px] text-[var(--color-charcoal)] hover:bg-[oklch(0_0_0_/_0.1)] shrink-0"
                            >
                              <X className="size-[16px]" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="bottom" className="border-0 bg-foreground text-background text-[12px] leading-[16px] px-[8px] py-[4px]" style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 500 }}>
                            Cancel
                          </TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              type="button"
                              onClick={commitRename}
                              aria-label="Save"
                              className="flex items-center justify-center size-[24px] rounded-[6px] text-[var(--color-charcoal)] hover:bg-[oklch(0_0_0_/_0.1)] shrink-0"
                            >
                              <Check className="size-[16px]" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="bottom" className="border-0 bg-foreground text-background text-[12px] leading-[16px] px-[8px] py-[4px]" style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 500 }}>
                            Save
                          </TooltipContent>
                        </Tooltip>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => onSelectChat?.(chat.id)}
                          className="flex-1 min-w-0 text-left text-[13px] text-[var(--color-charcoal)] whitespace-nowrap overflow-hidden text-ellipsis"
                          style={{ fontFamily: 'Manrope, sans-serif', fontWeight: isActive ? 500 : 400 }}
                        >
                          {title}
                        </button>
                        {/* Right slot: time / busy dot by default; three-dot on hover or when its menu is open */}
                        {isBusy ? (
                          <span className="relative flex size-[8px] shrink-0 mr-[4px]" aria-label="Generating">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--color-royal)] opacity-75" />
                            <span className="relative inline-flex size-[8px] rounded-full bg-[var(--color-royal)]" />
                          </span>
                        ) : (
                          <span
                            className={cn(
                              'text-[12px] text-[var(--color-grey)] whitespace-nowrap shrink-0 mr-[4px]',
                              isMenuOpen ? 'hidden' : 'group-hover:hidden'
                            )}
                            style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 400 }}
                          >
                            {chat.time}
                          </span>
                        )}
                        <ChatActionsMenu
                          open={isMenuOpen}
                          onOpenChange={(o) => setMenuOpenId(o ? chat.id : null)}
                          align="start"
                          side="bottom"
                          isBookmarked={bookmarkedIds.has(chat.id)}
                          onRename={() => startRename(chat.id, title)}
                          onBookmark={() => toggleBookmark(chat.id)}
                          onDelete={() => requestDelete(chat.id, title)}
                          trigger={
                            <button
                              type="button"
                              onClick={(e) => e.stopPropagation()}
                              aria-label="Chat options"
                              className={cn(
                                'items-center justify-center size-[24px] rounded-[6px] text-[var(--color-charcoal)] hover:bg-[oklch(0_0_0_/_0.1)] data-[state=open]:bg-[oklch(0_0_0_/_0.1)] shrink-0',
                                isMenuOpen ? 'flex' : 'hidden group-hover:flex'
                              )}
                            >
                              <MoreHorizontal className="size-[16px]" />
                            </button>
                          }
                        />
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Settings — sticky bottom; icon centered in the same fixed slot, label fades */}
      <button
        type="button"
        onClick={onOpenSettings}
        aria-label="Settings"
        className="group relative flex h-[40px] items-center mx-[12px] w-[calc(100%-24px)] rounded-[8px] hover:bg-[oklch(0_0_0_/_0.06)] transition-colors shrink-0 mt-[4px] mb-[8px]"
      >
        <span className={ICON_SLOT}>
          <Settings className="size-[18px] text-[var(--color-charcoal)]" />
        </span>
        <span
          className={cn('text-[14px] text-[var(--color-charcoal)]', labelCls)}
          style={labelStyle({ fontFamily: 'Manrope, sans-serif', fontWeight: 400 })}
        >
          Settings
        </span>
        {collapsed && <RailTooltip label="Settings" />}
      </button>

      <DeleteChatDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        chatName={deleteTarget?.title}
        onConfirm={confirmDelete}
      />

      <SearchChatsModal
        isOpen={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
        chats={chats}
        onSelectChat={(id) => {
          onSelectChat?.(id);
          setSearchModalOpen(false);
        }}
        onNewChat={onNewChat}
      />
    </div>
  );
};

export default LhsSidebar;
