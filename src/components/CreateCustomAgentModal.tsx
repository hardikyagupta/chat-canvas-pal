import React from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import type { CustomAgent } from '@/data/customAgents';

const FONT = { fontFamily: 'Manrope, sans-serif' } as const;

interface CreateCustomAgentModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: { name: string; description: string }) => void;
  /** When set, the modal edits an existing agent (prefilled + "Edit details"). */
  initial?: Pick<CustomAgent, 'name' | 'description'> | null;
}

/**
 * Two-field dialog for creating a custom agent (name + description). Reused for
 * "Edit details" by passing `initial` (prefills the fields and swaps the copy).
 * Modal chrome mirrors SettingsModal's KnowledgeEditor so all dialogs match.
 */
const CreateCustomAgentModal: React.FC<CreateCustomAgentModalProps> = ({
  open,
  onClose,
  onSubmit,
  initial = null,
}) => {
  const isEdit = !!initial;
  const [name, setName] = React.useState('');
  const [description, setDescription] = React.useState('');

  // Reset the fields whenever the modal (re)opens so stale input never lingers.
  React.useEffect(() => {
    if (open) {
      setName(initial?.name ?? '');
      setDescription(initial?.description ?? '');
    }
  }, [open, initial]);

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const canSave = name.trim().length > 0;
  const handleSubmit = () => {
    if (!canSave) return;
    onSubmit({ name: name.trim(), description: description.trim() });
  };

  // Portal to <body> so the fixed backdrop covers the full viewport. Rendered
  // inline (inside the content column, which has transformed/overflow ancestors)
  // `position: fixed` gets scoped to that column, leaving the sidebar border
  // visible as a stray vertical line at the backdrop's edge.
  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-[16px]">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        className="relative flex w-full max-w-[560px] flex-col gap-[18px] rounded-[16px] bg-background p-[24px] shadow-[0px_20px_60px_-12px_oklch(0_0_0_/_0.32)]"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-[20px] font-bold text-[var(--color-ink)]" style={FONT}>
            {isEdit ? 'Edit details' : 'Create a custom agent'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex size-[30px] items-center justify-center rounded-[8px] text-[var(--color-slate)] transition-colors hover:bg-[oklch(0_0_0_/_0.06)]"
          >
            <X className="size-[17px]" />
          </button>
        </div>

        <div className="flex flex-col gap-[8px]">
          <label className="text-[13px] font-medium text-[var(--color-slate)]" style={FONT}>
            What are you working on?
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Name your agent"
            autoFocus
            onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(); }}
            className="h-[40px] w-full rounded-[9px] border border-[var(--color-line-input)] bg-[oklch(1_0_0_/_0.56)] px-[12px] text-[13px] text-[var(--color-ink)] placeholder:text-[var(--color-grey-soft)] outline-none transition-colors focus:border-[var(--color-line-strong)]"
            style={FONT}
          />
        </div>

        <div className="flex flex-col gap-[8px]">
          <label className="text-[13px] font-medium text-[var(--color-slate)]" style={FONT}>
            What are you trying to achieve?
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            placeholder="Describe your agent, goals, subject, etc…"
            className="w-full resize-none rounded-[9px] border border-[var(--color-line-input)] bg-[oklch(1_0_0_/_0.56)] px-[12px] py-[10px] text-[13px] leading-[1.5] text-[var(--color-ink)] placeholder:text-[var(--color-grey-soft)] outline-none transition-colors focus:border-[var(--color-line-strong)]"
            style={FONT}
          />
        </div>

        <div className="flex items-center justify-end gap-[10px]">
          <button
            type="button"
            onClick={onClose}
            className="flex h-[38px] items-center rounded-[9px] border border-[var(--color-line)] px-[16px] text-[13px] font-medium text-[var(--color-slate)] transition-colors hover:bg-[oklch(0_0_0_/_0.04)]"
            style={FONT}
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!canSave}
            onClick={handleSubmit}
            className="flex h-[38px] items-center rounded-[9px] bg-[var(--color-ink)] px-[16px] text-[13px] font-medium text-[var(--color-surface-0)] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            style={FONT}
          >
            {isEdit ? 'Save details' : 'Create agent'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default CreateCustomAgentModal;
