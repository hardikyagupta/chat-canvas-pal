import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Search, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { LhsChatItem } from './LhsSidebar';
import ChatActionsMenu from './ChatActionsMenu';
import DeleteChatDialog from './DeleteChatDialog';

const MANROPE: React.CSSProperties = { fontFamily: 'Manrope, sans-serif' };

interface ChatListPageProps {
  title: string;
  chats: LhsChatItem[];
  searchPlaceholder?: string;
  showNewChat?: boolean;        // Chats page shows it; Bookmarks page does not
  activeChatId?: string | null;
  onNewChat?: () => void;
  onSelectChat?: (id: string) => void;
  className?: string;
  /** Minimized (docked widget) view — shrinks the page title; expanded web view keeps 24px. */
  compact?: boolean;
}

/**
 * Full-page list of chats / bookmarks. A sticky header (title + search, plus a
 * New chat button on the Chats page) sits above a scrollable list of rows that
 * mirror the LHS chats-nav rows (hover highlight + three-dot actions popover).
 * Search filters the list by title. The scroll area has faded top/bottom edges.
 */
const ChatListPage: React.FC<ChatListPageProps> = ({
  title,
  chats,
  searchPlaceholder = 'Search',
  showNewChat = false,
  activeChatId = null,
  onNewChat,
  onSelectChat,
  className,
  compact = false,
}) => {
  const [query, setQuery] = useState('');

  // Local (prototype) per-row state — mirrors LhsSidebar: rename overrides,
  // deletions, bookmarks, which row's menu is open, inline-rename editing.
  const [titleOverrides, setTitleOverrides] = useState<Record<string, string>>({});
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);
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
  const requestDelete = (id: string, title: string) => {
    setMenuOpenId(null);
    setDeleteTarget({ id, title });
  };
  const confirmDelete = () => {
    if (deleteTarget) setDeletedIds((prev) => new Set(prev).add(deleteTarget.id));
    setDeleteTarget(null);
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return chats
      .filter((c) => !deletedIds.has(c.id))
      .filter((c) => {
        const t = titleOverrides[c.id] ?? c.title;
        return !q || t.toLowerCase().includes(q);
      });
  }, [chats, query, deletedIds, titleOverrides]);

  return (
    // Header sticks; only the list below scrolls. Background matches the top
    // navbar (surface-0) so the page reads as one continuous surface.
    <div className={cn('flex flex-col h-full w-full overflow-hidden bg-[var(--color-surface-0)]', className)}>
      <div className="mx-auto flex flex-col min-h-0 w-full max-w-[820px] flex-1 px-[20px]">
        {/* Sticky header — title + New chat, then search. */}
        {/* Minimized widget gets a touch more breathing room above the title
            row; the expanded web view keeps the original 8px. */}
        <div className={cn('flex flex-col gap-[16px] pb-[12px] w-full shrink-0', compact ? 'pt-[12px]' : 'pt-[8px]')}>
          {/* Fixed height so the row is the same whether or not the New chat
              button is present — keeps the search bar / list from shifting
              vertically when switching between Chats and Bookmarks. */}
          <div className="flex items-center justify-between gap-[12px] h-[34px]">
            <h1
              // Minimized widget gets a 16px title ("Chats" / "Bookmarks");
              // the expanded web view keeps the original 24px.
              className={cn(
                'font-semibold text-[var(--color-ink)]',
                compact ? 'text-[16px] leading-[24px]' : 'text-[24px] leading-[32px]'
              )}
              style={MANROPE}
            >
              {title}
            </h1>
            {showNewChat && (
              // Black button — matches the Artifact card's primary button (DocArtifactCard).
              <button
                type="button"
                onClick={onNewChat}
                className="relative flex items-center justify-center px-[14px] py-[7px] rounded-[8px] bg-foreground overflow-hidden hover:bg-foreground/90 transition-colors shrink-0"
              >
                <span
                  aria-hidden
                  className="absolute inset-0 rounded-[8px] pointer-events-none"
                  style={{ background: 'linear-gradient(to bottom, oklch(1 0 0 / 0.07) 82%, oklch(1 0 0 / 0.15) 94%)' }}
                />
                <span className="relative z-10 text-[14px] leading-[20px] font-medium text-background" style={MANROPE}>
                  New chat
                </span>
              </button>
            )}
          </div>

          {/* Search — blue active line on focus, 36px tall. */}
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

        {/* Scrollable list — faded top/bottom edges so the scroll feels smooth. */}
        <div
          className="flex-1 min-h-0 overflow-y-auto w-full pt-[12px] pb-[24px] hover-scroll"
          style={{
            maskImage: 'linear-gradient(to bottom, transparent 0, black 8px, black calc(100% - 24px), transparent 100%)',
            WebkitMaskImage: 'linear-gradient(to bottom, transparent 0, black 8px, black calc(100% - 24px), transparent 100%)',
          }}
        >
          {filtered.length === 0 ? (
            <div className="flex items-center justify-center w-full py-[48px]">
              <p className="text-[14px] text-[var(--color-grey-soft)]" style={MANROPE}>
                No results found
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-stretch w-full">
              {filtered.map((chat, idx) => {
                const isActive = chat.id === activeChatId;
                const isRenaming = chat.id === renamingId;
                const isMenuOpen = chat.id === menuOpenId;
                const title = titleOverrides[chat.id] ?? chat.title;
                const isLast = idx === filtered.length - 1;
                return (
                  <div
                    key={chat.id}
                    className={cn(
                      'group relative flex gap-[8px] items-center h-[48px] px-[12px] w-full rounded-[8px] transition-colors',
                      isRenaming
                        ? 'bg-[var(--color-surface-0)] ring-2 ring-inset ring-[var(--color-royal)]'
                        : isActive ? 'bg-[oklch(0_0_0_/_0.06)]' : 'hover:bg-[oklch(0_0_0_/_0.06)]'
                    )}
                  >
                    {/* Straight, full-width divider drawn as a separate line so the
                        row's rounded corners don't curve it. Hidden on hover / active. */}
                    {!isLast && (
                      <span
                        aria-hidden
                        className={cn(
                          'pointer-events-none absolute bottom-0 left-0 right-0 h-px bg-[var(--color-line)]',
                          (isActive || isRenaming) && 'hidden',
                          'group-hover:hidden'
                        )}
                      />
                    )}
                    {isRenaming ? (
                      <input
                        ref={renameInputRef}
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') commitRename();
                          else if (e.key === 'Escape') cancelRename();
                        }}
                        onBlur={commitRename}
                        className="flex-1 min-w-0 bg-transparent border-0 p-0 text-[14px] text-[var(--color-ink)] focus:outline-none"
                        style={{ ...MANROPE, fontWeight: 500 }}
                      />
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => onSelectChat?.(chat.id)}
                          className="flex-1 min-w-0 text-left text-[14px] leading-[20px] text-[var(--color-ink)] whitespace-nowrap overflow-hidden text-ellipsis"
                          style={{ ...MANROPE, fontWeight: isActive ? 500 : 400 }}
                        >
                          {title}
                        </button>
                        {/* Timestamp by default; hides to make room for the actions
                            menu on hover / when the menu is open (mirrors the LHS). */}
                        <span
                          className={cn(
                            'text-[13px] text-[var(--color-grey)] whitespace-nowrap shrink-0',
                            isMenuOpen ? 'hidden' : 'group-hover:hidden'
                          )}
                          style={{ ...MANROPE, fontWeight: 400 }}
                        >
                          {chat.time}
                        </span>
                        <ChatActionsMenu
                          open={isMenuOpen}
                          onOpenChange={(o) => setMenuOpenId(o ? chat.id : null)}
                          align="end"
                          side="bottom"
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
                                'items-center justify-center size-[26px] rounded-[6px] text-[var(--color-charcoal)] hover:bg-[oklch(0_0_0_/_0.1)] data-[state=open]:bg-[oklch(0_0_0_/_0.1)] shrink-0',
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
          )}
        </div>
      </div>

      <DeleteChatDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        chatName={deleteTarget?.title}
        onConfirm={confirmDelete}
      />
    </div>
  );
};

export default ChatListPage;
