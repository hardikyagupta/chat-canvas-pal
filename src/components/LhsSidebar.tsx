import React, { useState, useRef } from 'react';
import { SquarePen, MessageSquare, Bookmark, Settings, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

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
    className="pointer-events-none absolute left-full ml-[10px] top-1/2 -translate-y-1/2 z-[100] whitespace-nowrap rounded-[6px] bg-[#1C1C1E] px-[8px] py-[4px] text-[12px] leading-[16px] text-white opacity-0 translate-x-[-4px] transition-all duration-150 group-hover:opacity-100 group-hover:translate-x-0"
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
}) => {
  const [chatsOpen, setChatsOpen] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const scrollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
    { key: 'new-chat', label: 'New chat', icon: SquarePen, onClick: onNewChat },
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
        'relative z-30 flex flex-col items-start h-full bg-white flex-shrink-0',
        // overflow-visible when collapsed lets the rail tooltips escape the 64px width
        collapsed ? 'overflow-visible' : 'overflow-hidden'
      )}
      style={{ width: collapsed ? 64 : 288, transition: 'width 300ms cubic-bezier(0.22, 1, 0.36, 1)' }}
    >
      {/* Logo — circle sits in the centered icon slot; the wordmark clips/fades */}
      <div className="flex items-center px-[12px] pt-[12px] pb-[16px] w-full shrink-0">
        <div className={ICON_SLOT}>
          <div
            className="flex items-center justify-center rounded-full shrink-0 size-[24px]"
            style={{ background: 'linear-gradient(to top, #143f93 13.75%, #97baff 76.25%)' }}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M6 1L7.545 4.455L11 6L7.545 7.545L6 11L4.455 7.545L1 6L4.455 4.455L6 1Z" fill="white" fillOpacity="0.9" />
            </svg>
          </div>
        </div>
        <span
          className={cn('font-bold text-[16px] leading-[20px] text-[#101828]', labelCls)}
          style={labelStyle({ fontFamily: 'Manrope, sans-serif' })}
        >
          Co-marketer
        </span>
      </div>

      {/* Menu actions — icons centered in 40×40 slots, aligned with the logo */}
      <div className="flex flex-col gap-[4px] items-start w-full px-[12px] pt-[20px] shrink-0">
        {menuActions.map(({ key, label, icon: Icon, onClick }) => (
          <button
            key={key}
            type="button"
            onClick={onClick}
            aria-label={label}
            className="group relative flex h-[40px] items-center w-full rounded-[8px] hover:bg-[#F2F4F7] transition-colors"
          >
            <span className={ICON_SLOT}>
              <Icon className="size-[16px] text-[#212E36]" />
            </span>
            <span
              className={cn('text-[14px] text-[#212E36]', labelCls)}
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
            className="text-[14px] leading-[20px] text-[#6F6F8D] tracking-[0.035px] whitespace-nowrap"
            style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 400 }}
          >
            Chats
          </span>
          <ChevronDown
            className={cn(
              'size-[14px] text-[#6F6F8D] shrink-0 transition-transform duration-200',
              !chatsOpen && '-rotate-90'
            )}
          />
        </button>

        {/* Scrollable chat list */}
        {chatsOpen && (
          <div ref={scrollRef} onScroll={handleScroll} className="chat-scroll flex-1 min-h-0 overflow-y-auto w-full px-[12px] pb-[8px]">
            <div className="flex flex-col gap-[2px] items-start w-full">
              {chats.map((chat) => {
                const isActive = chat.id === activeChatId;
                const isBusy = chat.id === busyChatId;
                return (
                  <button
                    key={chat.id}
                    type="button"
                    onClick={() => onSelectChat?.(chat.id)}
                    className={cn(
                      'flex gap-[8px] h-[34px] items-center pl-[12px] pr-[12px] w-full rounded-[8px] overflow-hidden transition-colors',
                      isActive ? 'bg-[rgba(0,0,0,0.12)]' : 'hover:bg-[#F2F4F7]'
                    )}
                  >
                    <span
                      className="flex-1 min-w-0 text-left text-[13px] text-[#212E36] whitespace-nowrap overflow-hidden text-ellipsis"
                      style={{ fontFamily: 'Manrope, sans-serif', fontWeight: isActive ? 500 : 400 }}
                    >
                      {chat.title}
                    </span>
                    {isBusy ? (
                      // Live "active" indicator while this chat is generating output
                      <span className="relative flex size-[8px] shrink-0" aria-label="Generating">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#0A8FFD] opacity-75" />
                        <span className="relative inline-flex size-[8px] rounded-full bg-[#0A8FFD]" />
                      </span>
                    ) : (
                      <span
                        className="text-[12px] text-[#637882] whitespace-nowrap shrink-0"
                        style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 400 }}
                      >
                        {chat.time}
                      </span>
                    )}
                  </button>
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
        className="group relative flex h-[40px] items-center mx-[12px] w-[calc(100%-24px)] rounded-[8px] bg-white hover:bg-[#F2F4F7] transition-colors shrink-0 mt-[4px] mb-[8px]"
      >
        <span className={ICON_SLOT}>
          <Settings className="size-[18px] text-[#212E36]" />
        </span>
        <span
          className={cn('text-[14px] text-[#212E36]', labelCls)}
          style={labelStyle({ fontFamily: 'Manrope, sans-serif', fontWeight: 400 })}
        >
          Settings
        </span>
        {collapsed && <RailTooltip label="Settings" />}
      </button>
    </div>
  );
};

export default LhsSidebar;
