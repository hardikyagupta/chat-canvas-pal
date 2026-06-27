import React from 'react';
import { Minimize2, X, PanelLeft } from 'lucide-react';

interface RhsHeaderProps {
  chatName?: string | null; // hidden when null/empty (no active chat)
  showSidebarToggle?: boolean; // show the expand/collapse panel icon (collapsed state)
  onToggleSidebar?: () => void;
  onMinimize?: () => void;
  onClose?: () => void;
}

const RhsHeader: React.FC<RhsHeaderProps> = ({ chatName, showSidebarToggle, onToggleSidebar, onMinimize, onClose }) => {
  return (
    <div className="flex items-start pl-[16px] w-full shrink-0">
      <div className="flex flex-1 min-w-0 items-center justify-end h-[56px] pr-[24px] self-stretch">
        <div className="flex gap-[8px] items-center w-full">
          {/* Left: sidebar toggle (when collapsed) + chat-name context */}
          <div className="flex flex-1 min-w-0 h-full items-center gap-[8px]">
            {showSidebarToggle && (
              <button
                type="button"
                onClick={onToggleSidebar}
                className="flex items-center p-[4px] rounded-[8px] hover:bg-[#F2F4F7] transition-colors shrink-0"
                aria-label="Expand sidebar"
              >
                <PanelLeft className="size-[16px] text-[#40474C]" />
              </button>
            )}
            {chatName ? (
              <p
                className="font-medium text-[13px] text-[#212E36] whitespace-nowrap overflow-hidden text-ellipsis"
                style={{ fontFamily: 'Manrope, sans-serif' }}
              >
                {chatName}
              </p>
            ) : null}
          </div>

          {/* Right: actions */}
          <div className="flex gap-[8px] items-center shrink-0">
            <button
              type="button"
              onClick={onMinimize}
              className="flex items-center justify-center p-[8px] rounded-[8.889px] hover:bg-[#F2F4F7] transition-colors"
              aria-label="Minimize"
            >
              <Minimize2 className="size-[16px] text-[#40474C]" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex items-center justify-center p-[8px] rounded-[8.889px] hover:bg-[#F2F4F7] transition-colors"
              aria-label="Close"
            >
              <X className="size-[16px] text-[#40474C]" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RhsHeader;
