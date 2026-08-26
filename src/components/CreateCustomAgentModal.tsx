import React from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AgentTools, CustomAgent } from '@/data/customAgents';
import { DEFAULT_AGENT_TOOLS } from '@/data/customAgents';
import { AgentToolsConfigPanel } from './AgentToolsConfig';
import { DsButton } from '@/components/ui/ds-button';

const FONT = { fontFamily: 'Manrope, sans-serif' } as const;

/** Descriptions are a one-line subtitle on the agent card, so they stay short.
 *  Mirrors INSTRUCTIONS_MAX_LENGTH in CustomAgentDetail. */
const DESCRIPTION_MAX_LENGTH = 100;

const fieldClass = (invalid: boolean) =>
  cn(
    'w-full rounded-[9px] border bg-[oklch(1_0_0_/_0.56)] px-[12px] text-[13px] text-[var(--color-ink)] placeholder:text-[var(--color-grey-soft)] outline-none transition-colors',
    invalid
      ? 'border-[var(--color-danger,#e5484d)] ring-2 ring-[color-mix(in_oklch,var(--color-danger,#e5484d)_18%,transparent)] focus:border-[var(--color-danger,#e5484d)]'
      : 'border-[var(--color-line-input)] ds-field',
  );

export interface CreateCustomAgentData {
  name: string;
  description: string;
  tools?: AgentTools;
}

interface CreateCustomAgentModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateCustomAgentData) => void;
  /** When set, the modal edits an existing agent (prefilled + "Edit details"). */
  initial?: Pick<CustomAgent, 'name' | 'description'> | null;
}

/**
 * Dialog for creating a custom agent (name, description, and tools on create).
 * Reused for "Edit details" by passing `initial` (name/description only).
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
  const [tools, setTools] = React.useState<AgentTools>(DEFAULT_AGENT_TOOLS);
  const [nameError, setNameError] = React.useState(false);
  const [descriptionError, setDescriptionError] = React.useState(false);
  const nameRef = React.useRef<HTMLInputElement>(null);
  const descriptionRef = React.useRef<HTMLTextAreaElement>(null);
  const bodyScrollRef = React.useRef<HTMLDivElement>(null);
  const scrollTimerRef = React.useRef<ReturnType<typeof setTimeout>>();

  React.useEffect(() => {
    if (open) {
      setName(initial?.name ?? '');
      setDescription(initial?.description ?? '');
      setNameError(false);
      setDescriptionError(false);
      if (!initial) setTools(DEFAULT_AGENT_TOOLS);
    }
  }, [open, initial]);

  React.useEffect(
    () => () => {
      if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current);
    },
    [],
  );

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const handleBodyScroll = () => {
    const el = bodyScrollRef.current;
    if (!el) return;
    el.classList.add('is-scrolling');
    if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current);
    scrollTimerRef.current = setTimeout(() => {
      el.classList.remove('is-scrolling');
    }, 800);
  };

  if (!open) return null;

  const handleSubmit = () => {
    const missingName = name.trim().length === 0;
    const missingDescription = !isEdit && description.trim().length === 0;
    setNameError(missingName);
    setDescriptionError(missingDescription);

    if (missingName || missingDescription) {
      if (missingName) {
        nameRef.current?.focus();
        nameRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      } else {
        descriptionRef.current?.focus();
        descriptionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
      return;
    }

    onSubmit({
      name: name.trim(),
      description: description.trim(),
      ...(isEdit ? {} : { tools }),
    });
  };

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-[16px]">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        className="relative flex max-h-[min(90vh,820px)] w-full max-w-[560px] flex-col overflow-hidden rounded-[16px] bg-background shadow-[0px_20px_60px_-12px_oklch(0_0_0_/_0.32)]"
      >
        <div className="flex shrink-0 items-center justify-between px-[24px] pt-[24px]">
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

        <div
          ref={bodyScrollRef}
          onScroll={handleBodyScroll}
          className="scroll-reveal flex min-h-0 flex-1 flex-col gap-[18px] overflow-y-auto px-[24px] py-[18px]"
        >
          <div className="flex flex-col gap-[8px]">
            <label className="text-[13px] font-medium text-[var(--color-slate)]" style={FONT}>
              What are you working on?
            </label>
            <input
              ref={nameRef}
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (nameError && e.target.value.trim()) setNameError(false);
              }}
              placeholder="Name your agent"
              autoFocus
              aria-invalid={nameError}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) handleSubmit(); }}
              className={cn(fieldClass(nameError), 'h-[40px]')}
              style={FONT}
            />
            {nameError ? (
              <p className="text-[12px] text-[var(--color-danger,#e5484d)]" style={FONT}>
                Enter a name for your agent
              </p>
            ) : null}
          </div>

          <div className="flex flex-col gap-[8px]">
            <label className="text-[13px] font-medium text-[var(--color-slate)]" style={FONT}>
              Description
            </label>
            {/* Counter rides the field's bottom-right corner — same treatment as
                the instructions modal, and costs no vertical space. */}
            <div className="relative">
              <textarea
                ref={descriptionRef}
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  if (descriptionError && e.target.value.trim()) setDescriptionError(false);
                }}
                rows={4}
                maxLength={DESCRIPTION_MAX_LENGTH}
                placeholder="Describe your agent, goals, subject, etc…"
                aria-invalid={descriptionError}
                className={cn(fieldClass(descriptionError), 'resize-none py-[10px] leading-[1.5]')}
                style={FONT}
              />
              <span
                className={cn(
                  'pointer-events-none absolute bottom-[12px] right-[8px] rounded-[6px] bg-background/95 px-[5px] py-[1px] text-[11px] tabular-nums',
                  description.length >= DESCRIPTION_MAX_LENGTH - 10
                    ? 'text-[var(--color-charcoal)]'
                    : 'text-[var(--color-grey-soft)]'
                )}
                style={FONT}
                aria-live="polite"
              >
                {description.length} / {DESCRIPTION_MAX_LENGTH}
              </span>
            </div>
            {descriptionError ? (
              <p className="text-[12px] text-[var(--color-danger,#e5484d)]" style={FONT}>
                Describe what this agent should help with
              </p>
            ) : null}
          </div>

          {!isEdit ? (
            <div className="flex flex-col gap-[8px]">
              <label className="text-[13px] font-medium text-[var(--color-slate)]" style={FONT}>
                Tools
              </label>
              <AgentToolsConfigPanel value={tools} onChange={setTools} />
            </div>
          ) : null}
        </div>

        <div className="flex shrink-0 items-center justify-end gap-[10px] border-t border-[var(--color-line)] bg-background px-[24px] py-[16px]">
          <DsButton variant="tertiary" onClick={onClose}>Cancel</DsButton>
          <DsButton onClick={handleSubmit}>{isEdit ? 'Save details' : 'Create agent'}</DsButton>
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default CreateCustomAgentModal;
