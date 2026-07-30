import React from 'react';
import { X } from 'lucide-react';
import { PersonalizationPanel } from './SettingsModal';

/**
 * SettingsModalV2 — early-release cut of Settings.
 *
 * The full SettingsModal (Theme, Reports, Model & behavior, Tools,
 * Notifications, Privacy, Advanced, ...) isn't ready to ship yet. Rather than
 * expose half-built sections behind an LHS nav rail, this version drops the
 * rail entirely and opens straight into the one section that's ready: the
 * brand wiki (same PersonalizationPanel component V1 uses, so the brand-wiki
 * behavior is identical). No intermediate menu/tab — the LHS entry point
 * (labeled "Configure brand wiki" to match, since that's all this opens)
 * leads directly to it.
 *
 * The title/description sit in this file's own header row, next to the close
 * button (`hideHeading` suppresses PersonalizationPanel's copy of them so they
 * don't render twice) — a floating X with no header row around it read as
 * broken chrome, not a dialog. Profile fields aren't ready either, so
 * `wikiOnly` drops that tab and shows the brand wiki directly under a plain
 * label instead of a two-item (one dead) tab switcher. Creating/uploading
 * entries isn't ready yet either, so `hideWikiActions` drops the Add/Upload
 * buttons — this early release is browse-only.
 *
 * TODO(early-release): once more sections are ready, either bring back a nav
 * rail here or retire this file and re-point callers at SettingsModal.
 */

const FONT = { fontFamily: 'Manrope, sans-serif' } as const;

interface SettingsModalV2Props {
  isOpen: boolean;
  onClose: () => void;
}

const SettingsModalV2: React.FC<SettingsModalV2Props> = ({ isOpen, onClose }) => {
  React.useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal — single column, no LHS nav rail (early-release: only one
          section exists, so a sidebar of nav items would be empty chrome). */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-[16px] pointer-events-none">
        <div
          className="relative flex w-full max-w-[640px] h-[min(85vh,560px)] flex-col overflow-hidden rounded-[16px] bg-background shadow-[0px_20px_60px_-12px_oklch(0_0_0_/_0.28)] pointer-events-auto"
          role="dialog"
          aria-modal="true"
        >
          {/* Header row — title/description on the left, close button on the
              right, both top-aligned so the close button reads as part of the
              dialog's header instead of floating on its own. */}
          <div className="flex shrink-0 items-start justify-between gap-[16px] px-[24px] pt-[24px] pb-[16px]">
            <div className="flex flex-col gap-[8px]">
              <h1 className="text-[24px] font-medium text-[var(--color-ink)]" style={FONT}>Configure brand wiki</h1>
              <p className="text-[13px] text-[var(--color-grey)]" style={FONT}>
                Manage the brand knowledge the assistant references.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close settings"
              className="flex size-[32px] shrink-0 items-center justify-center rounded-[8px] text-[var(--color-slate)] hover:bg-[oklch(0_0_0_/_0.06)] transition-colors"
            >
              <X className="size-[18px]" />
            </button>
          </div>

          <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-[24px] pb-[24px]">
            <PersonalizationPanel hideHeading wikiOnly hideWikiActions />
          </div>
        </div>
      </div>
    </>
  );
};

export default SettingsModalV2;
