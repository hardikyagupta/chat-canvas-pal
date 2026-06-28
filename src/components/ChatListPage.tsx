import React, { useMemo, useState } from 'react';
import { Search, SquarePen } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { LhsChatItem } from './LhsSidebar';

interface ChatListPageProps {
  title: string;
  chats: LhsChatItem[];
  searchPlaceholder?: string;
  showNewChat?: boolean;        // Chats page shows it; Bookmarks page does not
  activeChatId?: string | null;
  onNewChat?: () => void;
  onSelectChat?: (id: string) => void;
  className?: string;
}

/**
 * Full-page list of chats / bookmarks. Header (title + search, and a New chat
 * button on the Chats page only) over a scrollable list of rows that mirror the
 * LHS chats-nav rows (title + timestamp). Search filters the list by title.
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
}) => {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return chats;
    return chats.filter((c) => c.title.toLowerCase().includes(q));
  }, [chats, query]);

  return (
    <div className={cn('flex flex-col h-full w-full bg-white', className)}>
      {/* Header */}
      <div className="flex flex-col gap-[12px] px-[24px] pt-[20px] pb-[12px] w-full shrink-0 border-b border-[#EDEFF3]">
        <div className="flex items-center justify-between gap-[12px]">
          <h1
            className="text-[18px] leading-[24px] font-semibold text-[#17173A]"
            style={{ fontFamily: 'Manrope, sans-serif' }}
          >
            {title}
          </h1>
          {showNewChat && (
            <button
              type="button"
              onClick={onNewChat}
              className="fig-chip flex items-center gap-[6px] px-[12px] py-[6px] rounded-[6px] whitespace-nowrap shrink-0"
            >
              <SquarePen className="size-[14px] text-[#17173A]" />
              <span
                className="text-[14px] leading-[20px] font-normal text-[#17173A]"
                style={{ fontFamily: 'Manrope, sans-serif' }}
              >
                New chat
              </span>
            </button>
          )}
        </div>

        {/* Search */}
        <div className="flex items-center gap-[8px] h-[40px] px-[12px] w-full rounded-[8px] border border-[#DDE2EE] bg-white focus-within:border-[#C9C9C9] transition-colors">
          <Search className="size-[16px] text-[#9AA3B2] shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={searchPlaceholder}
            className="flex-1 min-w-0 bg-transparent outline-none text-[14px] leading-[20px] text-[#17173A] placeholder:text-[#9AA3B2]"
            style={{ fontFamily: 'Manrope, sans-serif' }}
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 min-h-0 overflow-y-auto w-full px-[12px] py-[8px] scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
        {filtered.length === 0 ? (
          <div className="flex items-center justify-center w-full py-[48px]">
            <p
              className="text-[14px] text-[#9AA3B2]"
              style={{ fontFamily: 'Manrope, sans-serif' }}
            >
              No results found
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-[2px] items-start w-full">
            {filtered.map((chat) => {
              const isActive = chat.id === activeChatId;
              return (
                <button
                  key={chat.id}
                  type="button"
                  onClick={() => onSelectChat?.(chat.id)}
                  className={cn(
                    'flex gap-[8px] h-[44px] items-center px-[12px] w-full rounded-[8px] overflow-hidden transition-colors',
                    isActive ? 'bg-[rgba(0,0,0,0.12)]' : 'hover:bg-[#F2F4F7]'
                  )}
                >
                  <span
                    className="flex-1 min-w-0 text-left text-[14px] text-[#212E36] whitespace-nowrap overflow-hidden text-ellipsis"
                    style={{ fontFamily: 'Manrope, sans-serif', fontWeight: isActive ? 500 : 400 }}
                  >
                    {chat.title}
                  </span>
                  <span
                    className="text-[12px] text-[#637882] whitespace-nowrap shrink-0"
                    style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 400 }}
                  >
                    {chat.time}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatListPage;
