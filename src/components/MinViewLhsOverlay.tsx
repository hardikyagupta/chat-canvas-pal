import React, { useEffect, useRef, useState } from 'react';
import { X, Plus, MessageSquare, Bookmark, BarChart3, Bot, CalendarClock, ChevronDown, MoreHorizontal, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { LhsChatItem } from './LhsSidebar';
import ChatActionsMenu from './ChatActionsMenu';
import DeleteChatDialog from './DeleteChatDialog';

interface MinViewLhsOverlayProps {
  chats?: LhsChatItem[];
  activeChatId?: string | null;
  onClose: () => void;
  onSelectChat?: (id: string) => void;
  onNewChat?: () => void;
  onOpenCustomAgents?: () => void;
  onOpenChats?: () => void;
  onOpenBookmarks?: () => void;
  onOpenReports?: () => void;
  onOpenScheduler?: () => void;
}

const defaultChats: LhsChatItem[] = [
  { id: '1', title: 'Animate thumbs feedback', time: '1h' },
  { id: '2', title: 'Add follow-up questions scenario', time: '2h' },
  { id: '3', title: 'Create reusable workflow skill', time: '2h' },
  { id: '4', title: 'Check record workflow feature', time: '2h' },
  { id: '5', title: 'Inspect shimmer component', time: '16h' },
  { id: '6', title: 'Add teaser type icons', time: '2d' },
  { id: '7', title: 'Inspect shimmer component', time: '2d' },
  { id: '8', title: 'Name shimmer border component', time: '6d' },
  { id: '9', title: 'Access Figma MCP', time: '1w' },
];

const MANROPE: React.CSSProperties = { fontFamily: 'Manrope, sans-serif' };
// Slide/fade duration — kept in sync with the CSS transition below.
const ANIM_MS = 300;
const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';

/**
 * Mobile / minimized-view drawer — a left-anchored panel that mirrors the
 * expanded LhsSidebar (New chat pill, Chats/Bookmarks, collapsible Recents
 * list). Slides in from the left on open and back out on close. Uses
 * `atmo-glass` + a solid `bg-card` fallback so it always has a background.
 */
const MinViewLhsOverlay: React.FC<MinViewLhsOverlayProps> = ({
  chats = defaultChats,
  activeChatId = '1',
  onClose,
  onSelectChat,
  onNewChat,
  onOpenCustomAgents,
  onOpenChats,
  onOpenBookmarks,
  onOpenReports,
  onOpenScheduler,
}) => {
  // `entered` drives the enter/exit animation. We mount hidden, flip it on in
  // the next frame to slide in, and flip it off (then unmount) to slide out.
  const [entered, setEntered] = useState(false);
  const [recentsOpen, setRecentsOpen] = useState(true);

  // Local (prototype) per-chat action state — mirrors LhsSidebar so the row's
  // three-dot menu (rename / bookmark / delete) works in the minimized drawer too.
  const [titleOverrides, setTitleOverrides] = useState<Record<string, string>>({});
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const id = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(id);
  }, []);

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
  const requestDelete = (id: string, title: string) => {
    setMenuOpenId(null);
    setDeleteTarget({ id, title });
  };
  const confirmDelete = () => {
    if (deleteTarget) setDeletedIds((prev) => new Set(prev).add(deleteTarget.id));
    setDeleteTarget(null);
  };

  // Play the exit animation, then run the action + unmount.
  const dismiss = (action?: () => void) => {
    setEntered(false);
    window.setTimeout(() => {
      action?.();
      onClose();
    }, ANIM_MS);
  };

  const menuActions = [
    { key: 'new-chat', label: 'New chat', icon: Plus, onClick: onNewChat, isNewChat: true },
    { key: 'chats', label: 'Chats', icon: MessageSquare, onClick: onOpenChats },
    { key: 'custom-agents', label: 'Agents', icon: Bot, onClick: onOpenCustomAgents },
    { key: 'reports', label: 'Reports', icon: BarChart3, onClick: onOpenReports },
    { key: 'scheduler', label: 'Scheduled', icon: CalendarClock, onClick: onOpenScheduler },
    { key: 'bookmarks', label: 'Bookmarks', icon: Bookmark, onClick: onOpenBookmarks },
  ];

  return (
    <div
      className={cn(
        'absolute inset-0 z-50 bg-[oklch(0_0_0_/_0.15)] transition-opacity ease-out',
        entered ? 'opacity-100' : 'opacity-0'
      )}
      style={{ transitionDuration: `${ANIM_MS}ms` }}
      onClick={() => dismiss()}
    >
      {/* Sliding panel anchored to the left — matches the LHS rail (solid bg,
          right border, no rounding) plus a soft shadow for drawer depth. */}
      <div
        className={cn(
          'atmo-glass absolute inset-y-0 left-0 w-[88%] max-w-[320px] flex flex-col items-start bg-card border-r border-[var(--color-line)] shadow-[0px_0px_50px_-6px_oklch(0.493_0_0_/_0.25)] overflow-hidden will-change-transform',
          entered ? 'translate-x-0' : '-translate-x-full'
        )}
        style={{ transition: `transform ${ANIM_MS}ms ${EASE}` }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header — close only (no logo), aligned left with the menu items. */}
        <div className="flex items-center justify-start px-[12px] h-[56px] w-full shrink-0">
          <button
            type="button"
            onClick={() => dismiss()}
            aria-label="Close menu"
            className="flex items-center justify-center p-[8px] rounded-[8px] shrink-0 hover:bg-[oklch(0_0_0_/_0.06)] transition-colors"
          >
            <X className="size-[18px] text-[var(--color-slate)]" />
          </button>
        </div>

        {/* Menu actions — same 32px rows / icon slots / hover as the LHS. */}
        <div className="flex flex-col gap-[4px] items-start w-full px-[12px] pt-[0px] shrink-0">
          {menuActions.map(({ key, label, icon: Icon, onClick, isNewChat }) => (
            <button
              key={key}
              type="button"
              onClick={() => dismiss(onClick)}
              aria-label={label}
              className="group relative flex h-[32px] items-center w-full rounded-[8px] hover:bg-[oklch(0_0_0_/_0.06)] transition-colors"
            >
              <span className="flex items-center justify-center shrink-0 w-[40px] h-[32px]">
                {isNewChat ? (
                  <span className="flex items-center justify-center rounded-full bg-[oklch(0_0_0_/_0.08)] p-[5px] transition-transform duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:scale-[1.15] group-hover:-rotate-6">
                    <Plus className="size-[12px] text-[var(--color-charcoal)]" strokeWidth={2.5} />
                  </span>
                ) : (
                  <Icon className="size-[18px] text-[var(--color-charcoal)] transition-transform duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:scale-[1.15] group-hover:-rotate-6" />
                )}
              </span>
              <span className="text-[13px] text-[var(--color-charcoal)] whitespace-nowrap" style={{ ...MANROPE, fontWeight: 400 }}>
                {label}
              </span>
            </button>
          ))}
        </div>

        {/* Recents section + scrollable chat list (mirrors the LHS). */}
        <div className="flex flex-col flex-1 min-h-0 w-full">
          <button
            type="button"
            onClick={() => setRecentsOpen((v) => !v)}
            className="flex gap-[8px] items-center pl-[24px] py-[8px] w-full shrink-0 mt-[8px]"
          >
            <span
              className="text-[12px] leading-[16px] text-[var(--color-grey)] tracking-[0.035px] whitespace-nowrap"
              style={{ ...MANROPE, fontWeight: 400 }}
            >
              Recents
            </span>
            <ChevronDown
              className={cn(
                'size-[14px] text-[var(--color-grey)] shrink-0 transition-transform duration-200',
                !recentsOpen && '-rotate-90'
              )}
            />
          </button>

          {recentsOpen && (
            <div className="flex-1 min-h-0 overflow-y-auto w-full px-[12px] pb-[8px] scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
              <div className="flex flex-col gap-[2px] items-start w-full">
                {chats.filter((chat) => !deletedIds.has(chat.id)).map((chat) => {
                  const isActive = chat.id === activeChatId;
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
                            style={{ ...MANROPE, fontWeight: 500 }}
                          />
                          <button
                            type="button"
                            onClick={cancelRename}
                            aria-label="Cancel"
                            className="flex items-center justify-center size-[24px] rounded-[6px] text-[var(--color-charcoal)] hover:bg-[oklch(0_0_0_/_0.1)] shrink-0"
                          >
                            <X className="size-[16px]" />
                          </button>
                          <button
                            type="button"
                            onClick={commitRename}
                            aria-label="Save"
                            className="flex items-center justify-center size-[24px] rounded-[6px] text-[var(--color-charcoal)] hover:bg-[oklch(0_0_0_/_0.1)] shrink-0"
                          >
                            <Check className="size-[16px]" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => dismiss(() => onSelectChat?.(chat.id))}
                            className="flex-1 min-w-0 text-left text-[13px] text-[var(--color-charcoal)] whitespace-nowrap overflow-hidden text-ellipsis"
                            style={{ ...MANROPE, fontWeight: isActive ? 500 : 400 }}
                          >
                            {title}
                          </button>
                          {/* Three-dot menu. On touch there's no hover, so the trigger
                              stays visible (unlike the hover-reveal on desktop LHS). */}
                          <ChatActionsMenu
                            open={isMenuOpen}
                            onOpenChange={(o) => setMenuOpenId(o ? chat.id : null)}
                            align="start"
                            side="bottom"
                            // Non-modal: modal locks body scroll + adds scrollbar-gap
                            // padding, which visibly shifts/expands the drawer on open.
                            modal={false}
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

        <DeleteChatDialog
          open={!!deleteTarget}
          onOpenChange={(o) => !o && setDeleteTarget(null)}
          chatName={deleteTarget?.title}
          onConfirm={confirmDelete}
        />
      </div>
    </div>
  );
};

export default MinViewLhsOverlay;
