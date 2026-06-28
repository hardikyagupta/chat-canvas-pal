import React from 'react';
import { SquarePen, MessageSquare, Bookmark, Settings } from 'lucide-react';

interface LhsSidebarCollapsedProps {
  onNewChat?: () => void;
  onOpenChats?: () => void;
  onOpenBookmarks?: () => void;
  onOpenSettings?: () => void;
}

const LhsSidebarCollapsed: React.FC<LhsSidebarCollapsedProps> = ({
  onNewChat,
  onOpenChats,
  onOpenBookmarks,
  onOpenSettings,
}) => {
  const actions = [
    { key: 'new-chat', icon: SquarePen, label: 'New chat', onClick: onNewChat },
    { key: 'chats', icon: MessageSquare, label: 'Chats', onClick: onOpenChats },
    { key: 'bookmarks', icon: Bookmark, label: 'Bookmarks', onClick: onOpenBookmarks },
  ];

  return (
    <div className="flex flex-col items-center w-[64px] h-full bg-white pb-[16px] flex-shrink-0">
      {/* Top: logo only — h-56 to align center with RHS header icons */}
      <div className="flex items-center justify-center h-[56px] shrink-0">
        <div className="flex items-center justify-center size-[40px]">
          <div
            className="flex items-center justify-center rounded-full shrink-0 size-[24px]"
            style={{ background: 'linear-gradient(to top, #143f93 13.75%, #97baff 76.25%)' }}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M6 1L7.545 4.455L11 6L7.545 7.545L6 11L4.455 7.545L1 6L4.455 4.455L6 1Z" fill="white" fillOpacity="0.9" />
            </svg>
          </div>
        </div>
      </div>

      {/* Middle: icon-only menu actions (32x32 squares) */}
      <div className="flex flex-1 flex-col items-center min-h-0 overflow-hidden pt-[20px]">
        <div className="flex flex-col gap-[4px] items-center">
          {actions.map(({ key, icon: Icon, label, onClick }) => (
            <button
              key={key}
              type="button"
              onClick={onClick}
              aria-label={label}
              title={label}
              className="flex items-center justify-center size-[40px] rounded-[8px] hover:bg-[#F2F4F7] transition-colors"
            >
              <Icon className="size-[16px] text-[#212E36] shrink-0" />
            </button>
          ))}
        </div>
      </div>

      {/* Bottom: settings (32x32 square) */}
      <div className="flex items-center justify-center shrink-0">
        <button
          type="button"
          onClick={onOpenSettings}
          aria-label="Settings"
          title="Settings"
          className="flex items-center justify-center size-[40px] rounded-[8px] hover:bg-[#F2F4F7] transition-colors"
        >
          <Settings className="size-[18px] text-[#212E36] shrink-0" />
        </button>
      </div>
    </div>
  );
};

export default LhsSidebarCollapsed;
