import React from 'react';
import { SquarePen, MessageSquare, Bookmark, Settings, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface LhsChatItem {
  id: string;
  title: string;
  time: string; // e.g. "1h", "2d", "1w"
}

interface LhsSidebarProps {
  chats?: LhsChatItem[];
  activeChatId?: string | null;
  onSelectChat?: (id: string) => void;
  onNewChat?: () => void;
  onOpenChats?: () => void;
  onOpenBookmarks?: () => void;
  onOpenSettings?: () => void;
}

// Default mock chats — mirrors the Figma reference list
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

const LhsSidebar: React.FC<LhsSidebarProps> = ({
  chats = defaultChats,
  activeChatId = '1',
  onSelectChat,
  onNewChat,
  onOpenChats,
  onOpenBookmarks,
  onOpenSettings,
}) => {
  const menuActions = [
    { key: 'new-chat', label: 'New chat', icon: SquarePen, onClick: onNewChat },
    { key: 'chats', label: 'Chats', icon: MessageSquare, onClick: onOpenChats },
    { key: 'bookmarks', label: 'Bookmarks', icon: Bookmark, onClick: onOpenBookmarks },
  ];

  return (
    <div className="flex flex-col items-start w-[288px] h-full bg-white flex-shrink-0">
      {/* Top: logo */}
      <div className="flex flex-col items-start justify-center pl-[16px] py-[16px] w-full shrink-0">
        <div className="flex gap-[4px] items-center">
          <div
            className="flex items-center justify-center rounded-full shrink-0 size-[24px]"
            style={{ background: 'linear-gradient(to top, #143f93 13.75%, #97baff 76.25%)' }}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M6 1L7.545 4.455L11 6L7.545 7.545L6 11L4.455 7.545L1 6L4.455 4.455L6 1Z" fill="white" fillOpacity="0.9" />
            </svg>
          </div>
          <span
            className="font-bold text-[16px] leading-[20px] text-[#101828] whitespace-nowrap"
            style={{ fontFamily: 'Manrope, sans-serif' }}
          >
            Co-marketer
          </span>
        </div>
      </div>

      {/* Middle: scrollable layout */}
      <div className="flex flex-1 flex-col items-start min-h-0 overflow-hidden w-full">
        <div className="flex flex-1 flex-col gap-[16px] items-start min-h-0 px-[10px] w-full overflow-y-auto scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
          {/* Menu actions */}
          <div className="flex flex-col gap-[4px] items-start w-full shrink-0">
            {menuActions.map(({ key, label, icon: Icon, onClick }) => (
              <button
                key={key}
                type="button"
                onClick={onClick}
                className="flex gap-[11px] h-[38px] items-center px-[6px] w-full rounded-[8px] hover:bg-[#F2F4F7] transition-colors"
              >
                <Icon className="size-[16px] text-[#212E36] shrink-0" />
                <span
                  className="text-[14px] text-[#212E36] whitespace-nowrap"
                  style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 400 }}
                >
                  {label}
                </span>
              </button>
            ))}
          </div>

          {/* Chats section */}
          <div className="flex flex-col items-start w-full">
            {/* Section header */}
            <button
              type="button"
              onClick={onOpenChats}
              className="flex gap-[8px] items-center pl-[8px] py-[8px] w-full"
            >
              <span
                className="text-[14px] leading-[20px] text-[#6F6F8D] tracking-[0.035px] whitespace-nowrap"
                style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 400 }}
              >
                Chats
              </span>
              <ChevronDown className="size-[14px] text-[#6F6F8D] shrink-0" />
            </button>

            {/* Chat list */}
            <div className="flex flex-col gap-[2px] items-start w-full">
              {chats.map((chat) => {
                const isActive = chat.id === activeChatId;
                return (
                  <button
                    key={chat.id}
                    type="button"
                    onClick={() => onSelectChat?.(chat.id)}
                    className={cn(
                      'flex gap-[8px] h-[34px] items-center px-[8px] w-full rounded-[10px] overflow-hidden transition-colors',
                      isActive ? 'bg-[rgba(0,0,0,0.12)]' : 'hover:bg-[#F2F4F7]'
                    )}
                  >
                    <span
                      className="text-[13px] text-[#212E36] whitespace-nowrap overflow-hidden text-ellipsis"
                      style={{ fontFamily: 'Manrope, sans-serif', fontWeight: isActive ? 500 : 400 }}
                    >
                      {chat.title}
                    </span>
                    <span className="flex-1 min-w-0" />
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
          </div>
        </div>
      </div>

      {/* Bottom: settings */}
      <button
        type="button"
        onClick={onOpenSettings}
        className="flex gap-[11px] h-[54px] items-center px-[16px] w-full bg-white hover:bg-[#F2F4F7] transition-colors shrink-0"
      >
        <Settings className="size-[18px] text-[#212E36] shrink-0" />
        <span
          className="text-[14px] text-[#212E36] whitespace-nowrap"
          style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 400 }}
        >
          Settings
        </span>
      </button>
    </div>
  );
};

export default LhsSidebar;
