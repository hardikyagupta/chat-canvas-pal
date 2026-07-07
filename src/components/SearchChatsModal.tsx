import React, { useState, useEffect, useRef } from 'react';
import { Search, X, SquarePen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LhsChatItem } from './LhsSidebar';

interface SearchChatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  chats: LhsChatItem[];
  onSelectChat: (id: string) => void;
  onNewChat?: () => void;
}

type TimeGroup = 'today' | 'yesterday' | 'week' | 'month' | 'older';

interface GroupedChats {
  [key: string]: LhsChatItem[];
}

const getTimeGroup = (timeStr: string): TimeGroup => {
  const lower = timeStr.toLowerCase();
  if (lower.includes('now') || lower.includes('min') || lower.includes('hour')) {
    return 'today';
  }
  if (lower.includes('yesterday')) {
    return 'yesterday';
  }
  if (lower.includes('d')) {
    return 'week';
  }
  if (lower.includes('w') || lower.includes('month') || lower.includes('mo')) {
    return 'month';
  }
  return 'older';
};

const CircularLoader: React.FC = () => (
  <div className="flex flex-col items-center justify-center py-[40px] px-[16px] gap-[12px]">
    <div className="relative w-[28px] h-[28px]">
      <svg
        className="w-full h-full animate-spin"
        viewBox="0 0 40 40"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle
          cx="20"
          cy="20"
          r="18"
          fill="none"
          stroke="var(--color-line)"
          strokeWidth="2"
          opacity="0.2"
        />
        <circle
          cx="20"
          cy="20"
          r="18"
          fill="none"
          stroke="var(--color-royal)"
          strokeWidth="2"
          strokeDasharray="56.5"
          strokeDashoffset="0"
          strokeLinecap="round"
        />
      </svg>
    </div>
    <p
      className="text-[13px] text-[var(--color-grey)]"
      style={{ fontFamily: 'Manrope, sans-serif' }}
    >
      Loading chats
    </p>
  </div>
);

const SkeletonChatItem: React.FC = () => (
  <div className="flex items-center justify-between w-full px-[16px] py-[10px] gap-[12px]">
    <div className="flex-1 min-w-0">
      <div className="h-[14px] bg-[var(--color-surface-1)] rounded-[4px] animate-pulse" />
    </div>
    <div className="h-[12px] w-[40px] bg-[var(--color-surface-1)] rounded-[4px] animate-pulse shrink-0" />
  </div>
);

export const SearchChatsModal: React.FC<SearchChatsModalProps> = ({
  isOpen,
  onClose,
  chats,
  onSelectChat,
  onNewChat,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [hoveredItemIndex, setHoveredItemIndex] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const scrollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const loadingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleScroll = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    el.classList.add('is-scrolling');
    if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current);
    scrollTimerRef.current = setTimeout(() => {
      el.classList.remove('is-scrolling');
    }, 800);
  };

  // Filter chats based on search query
  const filteredChats = chats.filter((chat) =>
    chat.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group filtered chats by time
  const groupedChats: GroupedChats = filteredChats.reduce((acc, chat) => {
    const group = getTimeGroup(chat.time);
    if (!acc[group]) {
      acc[group] = [];
    }
    acc[group].push(chat);
    return acc;
  }, {} as GroupedChats);

  const groupOrder: TimeGroup[] = ['today', 'yesterday', 'week', 'month', 'older'];
  const groupLabels: Record<TimeGroup, string> = {
    today: 'Today',
    yesterday: 'Yesterday',
    week: 'Previous 7 Days',
    month: 'Previous 30 Days',
    older: 'Older',
  };

  // Calculate total items (excluding "New chat" when searching)
  const shouldShowNewChat = !searchQuery && onNewChat;
  const totalItems =
    (shouldShowNewChat ? 1 : 0) +
    groupOrder.reduce((sum, group) => sum + (groupedChats[group]?.length || 0), 0);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setSearchQuery('');
      setSelectedIndex(0);
      setHoveredItemIndex(null);
    }
  }, [isOpen]);

  // Simulate loading when searching
  useEffect(() => {
    if (searchQuery.length > 0) {
      setIsLoading(true);
      if (loadingTimeoutRef.current) clearTimeout(loadingTimeoutRef.current);
      loadingTimeoutRef.current = setTimeout(() => {
        setIsLoading(false);
      }, 600);
    } else {
      setIsLoading(false);
      if (loadingTimeoutRef.current) clearTimeout(loadingTimeoutRef.current);
    }
  }, [searchQuery]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < totalItems - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      handleSelection(selectedIndex);
    }
  };

  const handleSelection = (index: number) => {
    let currentIndex = index;

    if (onNewChat && currentIndex === 0) {
      onNewChat();
      onClose();
      return;
    }

    if (onNewChat) {
      currentIndex--;
    }

    for (const group of groupOrder) {
      const groupChats = groupedChats[group] || [];
      if (currentIndex < groupChats.length) {
        handleSelectChat(groupChats[currentIndex].id);
        return;
      }
      currentIndex -= groupChats.length;
    }
  };

  const handleSelectChat = (id: string) => {
    onSelectChat(id);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      <style>{`
        .search-scroll {
          scrollbar-width: thin;
          scrollbar-color: transparent transparent;
          transition: scrollbar-color 200ms ease;
        }

        .search-scroll::-webkit-scrollbar {
          width: 6px;
        }

        .search-scroll::-webkit-scrollbar-track {
          background: transparent;
        }

        .search-scroll::-webkit-scrollbar-thumb {
          background-color: transparent;
          border-radius: 3px;
          transition: background-color 200ms ease;
        }

        .search-scroll:hover::-webkit-scrollbar-thumb {
          background-color: var(--color-line);
        }

        .search-scroll.is-scrolling::-webkit-scrollbar-thumb {
          background-color: var(--color-line);
        }

        .search-scroll:hover {
          scrollbar-color: var(--color-line) transparent;
        }

        .search-scroll.is-scrolling {
          scrollbar-color: var(--color-line) transparent;
        }
      `}</style>

      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-[80px] pointer-events-none">
        <div className="w-full max-w-[600px] mx-[16px] pointer-events-auto">
          <div className="rounded-[12px] bg-background shadow-[0px_20px_60px_-12px_oklch(0_0_0_/_0.2)] overflow-hidden">
            {/* Search Input */}
            <div className="flex items-center gap-[12px] px-[16px] py-[12px] border-b border-[var(--color-line-input)]">
              <Search className="size-[20px] text-[var(--color-grey)] shrink-0" />
              <input
                ref={inputRef}
                type="text"
                placeholder="Search chats..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setSelectedIndex(0);
                }}
                onKeyDown={handleKeyDown}
                className="flex-1 bg-transparent text-[14px] text-foreground placeholder:text-[var(--color-grey)] outline-none"
                style={{ fontFamily: 'Manrope, sans-serif' }}
              />
              <button
                type="button"
                onClick={onClose}
                className="p-[4px] rounded-[6px] hover:bg-muted transition-colors"
                aria-label="Close search"
              >
                <X className="size-[18px] text-[var(--color-grey)]" />
              </button>
            </div>

            {/* Results */}
            <div
              ref={scrollContainerRef}
              onScroll={handleScroll}
              className="search-scroll max-h-[480px] overflow-y-auto"
              style={{
                scrollbarWidth: 'thin',
                scrollbarColor: 'var(--color-line) transparent',
              }}
            >
              {isLoading && searchQuery ? (
                <div className="flex flex-col py-[8px]">
                  <CircularLoader />
                  <div className="flex flex-col">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <SkeletonChatItem key={`skeleton-${i}`} />
                    ))}
                  </div>
                </div>
              ) : totalItems > 0 ? (
                <div className="flex flex-col py-[8px]">
                  {/* New Chat Action - Only show when not searching */}
                  {shouldShowNewChat && (
                    <button
                      type="button"
                      onClick={() => {
                        onNewChat();
                        onClose();
                      }}
                      onMouseEnter={() => setSelectedIndex(0)}
                      className={cn(
                        'flex items-center gap-[12px] w-full px-[16px] py-[10px] text-left transition-colors',
                        selectedIndex === 0
                          ? 'bg-[var(--color-surface-1)]'
                          : 'hover:bg-[var(--color-surface-0)]'
                      )}
                    >
                      <SquarePen className="size-[16px] text-[var(--color-grey)] shrink-0" />
                      <p
                        className="text-[14px] text-foreground"
                        style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 400 }}
                      >
                        New chat
                      </p>
                    </button>
                  )}

                  {/* Grouped Chat Results */}
                  {groupOrder.map((group) => {
                    const groupChats = groupedChats[group];
                    if (!groupChats || groupChats.length === 0) return null;

                    let itemIndex = shouldShowNewChat ? 1 : 0;
                    for (const g of groupOrder) {
                      if (g === group) break;
                      itemIndex += groupedChats[g]?.length || 0;
                    }

                    return (
                      <div key={group}>
                        {/* Group Header */}
                        <p
                          className="text-[12px] text-[var(--color-grey-soft)] px-[16px] pt-[8px] pb-[6px] tracking-[0.035px]"
                          style={{
                            fontFamily: 'Manrope, sans-serif',
                            fontWeight: 400,
                          }}
                        >
                          {groupLabels[group]}
                        </p>

                        {/* Group Chats */}
                        {groupChats.map((chat, idx) => {
                          const currentItemIndex = itemIndex + idx;
                          return (
                            <button
                              key={chat.id}
                              type="button"
                              onClick={() => handleSelectChat(chat.id)}
                              onMouseEnter={() => {
                                setSelectedIndex(currentItemIndex);
                                setHoveredItemIndex(currentItemIndex);
                              }}
                              onMouseLeave={() => setHoveredItemIndex(null)}
                              className={cn(
                                'flex items-center justify-between w-full px-[16px] py-[10px] text-left transition-colors',
                                currentItemIndex === selectedIndex
                                  ? 'bg-[var(--color-surface-1)]'
                                  : 'hover:bg-[var(--color-surface-0)]'
                              )}
                            >
                              <p
                                className="text-[14px] text-foreground flex-1 min-w-0"
                                style={{
                                  fontFamily: 'Manrope, sans-serif',
                                  fontWeight: 400,
                                }}
                              >
                                {chat.title}
                              </p>
                              {hoveredItemIndex === currentItemIndex && (
                                <span
                                  className="text-[12px] text-[var(--color-grey-soft)] ml-[12px] shrink-0"
                                  style={{ fontFamily: 'Manrope, sans-serif' }}
                                >
                                  {chat.time}
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center px-[16px] py-[40px] gap-[12px]">
                  {searchQuery && <Search className="size-[24px] text-[var(--color-grey-soft)]" />}
                  <p
                    className="text-[14px] text-[var(--color-grey)] text-center"
                    style={{ fontFamily: 'Manrope, sans-serif' }}
                  >
                    {searchQuery ? 'No chats found' : 'Start typing to search chats'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default SearchChatsModal;
