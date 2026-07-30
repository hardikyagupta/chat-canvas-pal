import React from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import ReportCustomizationPanel from './ReportCustomizationPanel';

/**
 * ReportCustomizationModal — single-purpose wrapper around
 * ReportCustomizationPanel (same component SettingsModal's "Report
 * customization" nav item renders), for entry points that want just that
 * config surface without the full settings nav rail. Mirrors
 * SettingsModalV2's approach for the brand wiki.
 *
 * The inner wrapper (max-w-[720px] px-[32px] py-[40px]) matches the padding
 * SettingsModal gives this panel — ReportCustomizationPanel's sticky action
 * bar offsets itself with -mx-[32px]/-mb-[40px] to span the pane, so those
 * numbers need to line up here too.
 *
 * Portaled to <body> — see CustomAgentDetail's SetInstructionsModal: fixed
 * positioning inline gets scoped to the transformed content column, so the
 * backdrop wouldn't cover the sidebar and its border would peek through as a
 * stray vertical line.
 */

interface ReportCustomizationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ReportCustomizationModal: React.FC<ReportCustomizationModalProps> = ({ isOpen, onClose }) => {
  React.useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-[16px]">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative flex w-full max-w-[720px] h-[min(85vh,640px)] flex-col overflow-hidden rounded-[16px] bg-background shadow-[0px_20px_60px_-12px_oklch(0_0_0_/_0.28)]"
        role="dialog"
        aria-modal="true"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-[14px] top-[14px] z-10 flex size-[32px] items-center justify-center rounded-[8px] text-[var(--color-slate)] hover:bg-[oklch(0_0_0_/_0.06)] transition-colors"
        >
          <X className="size-[18px]" />
        </button>
        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="w-full max-w-[720px] px-[32px] py-[40px]">
            <ReportCustomizationPanel />
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ReportCustomizationModal;
