import React from 'react';
import { Minimize2, X, PanelLeftClose, PanelLeftOpen } from 'lucide-react';

interface RhsHeaderProps {
  chatName?: string | null; // hidden when null/empty (no active chat)
  showSidebarToggle?: boolean; // show the expand/collapse panel icon (collapsed state)
  sidebarCollapsed?: boolean; // current sidebar state, drives the toggle tooltip text
  onToggleSidebar?: () => void;
  onMinimize?: () => void;
  onClose?: () => void;
}

// Small dark tooltip shown below a header icon on hover.
// align: where the tooltip anchors relative to the button (avoids clipping at window edges).
const HeaderTooltip: React.FC<{ label: string; align?: 'left' | 'center' | 'right' }> = ({
  label,
  align = 'center',
}) => (
  <span
    className={
      'pointer-events-none absolute top-full mt-[6px] z-50 whitespace-nowrap rounded-[6px] bg-[#1C1C1E] px-[8px] py-[4px] text-[12px] leading-[16px] text-white opacity-0 translate-y-[-4px] transition-all duration-150 group-hover:opacity-100 group-hover:translate-y-0 ' +
      (align === 'left'
        ? 'left-0'
        : align === 'right'
          ? 'right-0'
          : 'left-1/2 -translate-x-1/2 group-hover:-translate-x-1/2')
    }
    style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 500 }}
  >
    {label}
  </span>
);

const RhsHeader: React.FC<RhsHeaderProps> = ({
  chatName,
  showSidebarToggle,
  sidebarCollapsed,
  onToggleSidebar,
  onMinimize,
  onClose,
}) => {
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
                className="group relative flex items-center justify-center p-[8px] rounded-[8.889px] hover:bg-[#F2F4F7] transition-colors shrink-0"
                aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              >
                {sidebarCollapsed
                  ? <PanelLeftOpen className="size-[16px] text-[#40474C]" />
                  : <PanelLeftClose className="size-[16px] text-[#40474C]" />}
                <HeaderTooltip label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'} align="left" />
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
              className="group relative flex items-center justify-center p-[8px] rounded-[8.889px] hover:bg-[#F2F4F7] transition-colors"
              aria-label="Minimize"
            >
              <Minimize2 className="size-[16px] text-[#40474C]" />
              <HeaderTooltip label="Minimize" align="center" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="group relative flex items-center justify-center p-[8px] rounded-[8.889px] hover:bg-[#F2F4F7] transition-colors"
              aria-label="Close"
            >
              <X className="size-[16px] text-[#40474C]" />
              <HeaderTooltip label="Close" align="right" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RhsHeader;
