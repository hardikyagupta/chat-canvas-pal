import React from 'react';
import { X, SquarePen, MessageSquare, Bookmark, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { LhsChatItem } from './LhsSidebar';

interface MinViewLhsOverlayProps {
  chats?: LhsChatItem[];
  activeChatId?: string | null;
  onClose: () => void;
  onSelectChat?: (id: string) => void;
  onNewChat?: () => void;
  onOpenChats?: () => void;
  onOpenBookmarks?: () => void;
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

const MinViewLhsOverlay: React.FC<MinViewLhsOverlayProps> = ({
  chats = defaultChats,
  activeChatId = '1',
  onClose,
  onSelectChat,
  onNewChat,
  onOpenChats,
  onOpenBookmarks,
}) => {
  const menuActions = [
    { key: 'new-chat', label: 'New chat', icon: SquarePen, onClick: onNewChat },
    { key: 'chats', label: 'Chats', icon: MessageSquare, onClick: onOpenChats },
    { key: 'bookmarks', label: 'Bookmarks', icon: Bookmark, onClick: onOpenBookmarks },
  ];

  return (
    <div
      className="absolute inset-0 z-50 bg-[oklch(0_0_0_/_0.15)]"
      onClick={onClose}
    >
      {/* Sliding panel anchored to the left */}
      <div
        className="absolute inset-y-0 left-0 w-[88%] max-w-[360px] flex flex-col gap-[8px] items-start bg-sidebar-background border border-[var(--color-line-input)] rounded-[12px] shadow-[0px_0px_50px_-6px_oklch(0.493_0_0_/_0.25)] px-[24px] py-[16px] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close — compact square hover to match the other icon buttons */}
        <button
          type="button"
          onClick={onClose}
          className="flex items-center justify-center p-[8px] rounded-[8px] shrink-0 hover:bg-[var(--color-surface-1)] transition-colors"
          aria-label="Close menu"
        >
          <X className="size-[20px] text-[var(--color-charcoal)]" />
        </button>

        {/* Scrollable content */}
        <div className="flex flex-col gap-[24px] items-start w-full flex-1 min-h-0 overflow-y-auto scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
          {/* Menu actions */}
          <div className="flex flex-col gap-[4px] items-start w-full shrink-0">
            {menuActions.map(({ key, label, icon: Icon, onClick }) => (
              <button
                key={key}
                type="button"
                onClick={onClick}
                className="flex gap-[12px] h-[38px] items-center px-[6px] w-full rounded-[8px] hover:bg-[var(--color-surface-1)] transition-colors"
              >
                <Icon className="size-[16px] text-[var(--color-charcoal)] shrink-0" />
                <span
                  className="text-[14px] text-[var(--color-charcoal)] whitespace-nowrap"
                  style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 400 }}
                >
                  {label}
                </span>
              </button>
            ))}
          </div>

          {/* Chats section */}
          <div className="flex flex-col items-start w-full">
            <button
              type="button"
              onClick={onOpenChats}
              className="flex gap-[8px] items-center pl-[8px] py-[8px] w-full"
            >
              <span
                className="text-[14px] leading-[20px] text-[var(--color-grey)] tracking-[0.035px] whitespace-nowrap"
                style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 400 }}
              >
                Chats
              </span>
              <ChevronDown className="size-[14px] text-[var(--color-grey)] shrink-0" />
            </button>

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
                      isActive ? 'bg-[oklch(0_0_0_/_0.12)]' : 'hover:bg-[var(--color-surface-1)]'
                    )}
                  >
                    <span
                      className="text-[13px] text-[var(--color-charcoal)] whitespace-nowrap overflow-hidden text-ellipsis"
                      style={{ fontFamily: 'Manrope, sans-serif', fontWeight: isActive ? 500 : 400 }}
                    >
                      {chat.title}
                    </span>
                    <span className="flex-1 min-w-0" />
                    <span
                      className="text-[12px] text-[var(--color-grey)] whitespace-nowrap shrink-0"
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
    </div>
  );
};

export default MinViewLhsOverlay;
