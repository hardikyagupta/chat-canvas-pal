import React from 'react';
import { createPortal } from 'react-dom';
import {
  ArrowLeft, MoreHorizontal, Plus, Pencil, Trash2, X, Check,
  Paperclip, TextCursorInput, Github, FileText, Bot, MessageSquare,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CustomAgent, AgentFile, AgentTools } from '@/data/customAgents';
import { DEFAULT_AGENT_TOOLS } from '@/data/customAgents';
import type { LhsChatItem } from './LhsSidebar';
import {
  ActionMenu,
  ActionMenuTrigger,
  ActionMenuContent,
  ActionMenuItem,
} from '@/components/ui/action-menu';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import ChatInput from './ChatInput';
import ChatActionsMenu from './ChatActionsMenu';
import DeleteChatDialog from './DeleteChatDialog';
import CreateCustomAgentModal from './CreateCustomAgentModal';

const FONT: React.CSSProperties = { fontFamily: 'Manrope, sans-serif' };

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

interface CustomAgentDetailProps {
  agent: CustomAgent;
  compact?: boolean;
  onBack: () => void;
  onEditAgent: (id: string, data: { name: string; description: string }) => void;
  onDeleteAgent: (id: string) => void;
  onUpdateAgent: (id: string, patch: Partial<CustomAgent>) => void;
  /** Drop into a normal chat (reuses the parent's new-chat handler). */
  onStartChat: (message: string) => void;
  /** This agent's past chats, shown as history below the composer. */
  chats?: LhsChatItem[];
  /** Open a past chat by id. */
  onSelectChat?: (id: string) => void;
}

/* ── Set instructions modal ──────────────────────────────────────── */
const SetInstructionsModal: React.FC<{
  open: boolean;
  initial: string;
  onClose: () => void;
  onSave: (value: string) => void;
}> = ({ open, initial, onClose, onSave }) => {
  const [value, setValue] = React.useState(initial);

  React.useEffect(() => { if (open) setValue(initial); }, [open, initial]);
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;
  const canSave = value.trim().length > 0;

  // Portal to <body> — see CreateCustomAgentModal: fixed positioning inline gets
  // scoped to the transformed content column, so the backdrop wouldn't cover the
  // sidebar and its border would peek through as a stray vertical line.
  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-[16px]">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        className="relative flex w-full max-w-[640px] flex-col gap-[18px] rounded-[16px] bg-background p-[24px] shadow-[0px_20px_60px_-12px_oklch(0_0_0_/_0.32)]"
      >
        <div className="flex flex-col gap-[6px]">
          <h2 className="text-[20px] font-bold text-[var(--color-ink)]" style={FONT}>Set agent instructions</h2>
          <p className="text-[13px] leading-[19px] text-[var(--color-grey)]" style={FONT}>
            Provide relevant instructions and information for chats within this agent.
          </p>
        </div>
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          autoFocus
          rows={10}
          placeholder="Think step by step and show reasoning for complex problems. Use specific examples."
          className="w-full resize-none rounded-[12px] border border-[var(--color-line-input)] bg-[oklch(1_0_0_/_0.56)] px-[14px] py-[12px] text-[13px] leading-[1.5] text-[var(--color-ink)] placeholder:text-[var(--color-grey-soft)] outline-none transition-colors focus:border-[var(--color-line-strong)]"
          style={FONT}
        />
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
            onClick={() => canSave && onSave(value.trim())}
            className="flex h-[38px] items-center rounded-[9px] bg-[var(--color-ink)] px-[16px] text-[13px] font-medium text-[var(--color-surface-0)] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            style={FONT}
          >
            Save instructions
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

/* ── Add text content modal ──────────────────────────────────────── */
const AddTextContentModal: React.FC<{
  open: boolean;
  onClose: () => void;
  onAdd: (data: { title: string; content: string }) => void;
}> = ({ open, onClose, onAdd }) => {
  const [title, setTitle] = React.useState('');
  const [content, setContent] = React.useState('');

  React.useEffect(() => { if (open) { setTitle(''); setContent(''); } }, [open]);
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;
  const canAdd = title.trim().length > 0 && content.trim().length > 0;

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-[16px]">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        className="relative flex w-full max-w-[640px] flex-col gap-[18px] rounded-[16px] bg-background p-[24px] shadow-[0px_20px_60px_-12px_oklch(0_0_0_/_0.32)]"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-[20px] font-bold text-[var(--color-ink)]" style={FONT}>Add text content</h2>
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
          <label className="text-[13px] font-medium text-[var(--color-slate)]" style={FONT}>Title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Name your content"
            autoFocus
            className="h-[40px] w-full rounded-[9px] border border-[var(--color-line-input)] bg-[oklch(1_0_0_/_0.56)] px-[12px] text-[13px] text-[var(--color-ink)] placeholder:text-[var(--color-grey-soft)] outline-none transition-colors focus:border-[var(--color-line-strong)]"
            style={FONT}
          />
        </div>
        <div className="flex flex-col gap-[8px]">
          <label className="text-[13px] font-medium text-[var(--color-slate)]" style={FONT}>Content</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={8}
            placeholder="Type or paste in content…"
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
            disabled={!canAdd}
            onClick={() => canAdd && onAdd({ title: title.trim(), content: content.trim() })}
            className="flex h-[38px] items-center rounded-[9px] bg-[var(--color-ink)] px-[16px] text-[13px] font-medium text-[var(--color-surface-0)] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            style={FONT}
          >
            Add Content
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

const TOOL_COLUMN_HEADING = 'text-[11px] font-semibold uppercase tracking-[0.6px] text-[var(--color-grey-soft)]';

function ToolCheckbox({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-[8px] py-[3px]">
      <button
        type="button"
        role="checkbox"
        aria-checked={checked}
        onClick={onChange}
        className={cn(
          'flex size-[16px] shrink-0 items-center justify-center rounded-[4px] border transition-colors',
          checked
            ? 'border-[var(--color-royal)] bg-[var(--color-royal)] text-white'
            : 'border-[var(--color-line-input)] bg-white text-transparent'
        )}
      >
        <Check className="size-[11px]" strokeWidth={3} />
      </button>
      <span className="text-[13px] text-[var(--color-ink)]" style={FONT}>{label}</span>
    </label>
  );
}

function ToolRadio({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-[8px] py-[3px]">
      <button
        type="button"
        role="radio"
        aria-checked={checked}
        onClick={onChange}
        className={cn(
          'flex size-[16px] shrink-0 items-center justify-center rounded-full border transition-colors',
          checked ? 'border-[var(--color-royal)] bg-white' : 'border-[var(--color-line-input)] bg-white'
        )}
      >
        {checked ? <span className="size-[8px] rounded-full bg-[var(--color-royal)]" /> : null}
      </button>
      <span className="text-[13px] text-[var(--color-ink)]" style={FONT}>{label}</span>
    </label>
  );
}

/* ── Set tools modal ─────────────────────────────────────────────── */
const SetToolsModal: React.FC<{
  open: boolean;
  initial: AgentTools;
  onClose: () => void;
  onSave: (value: AgentTools) => void;
}> = ({ open, initial, onClose, onSave }) => {
  const [value, setValue] = React.useState<AgentTools>(initial);

  React.useEffect(() => { if (open) setValue(initial); }, [open, initial]);
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-[16px]">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        className="relative flex w-full max-w-[640px] flex-col gap-[18px] rounded-[16px] bg-background p-[24px] shadow-[0px_20px_60px_-12px_oklch(0_0_0_/_0.32)]"
      >
        <div className="flex flex-col gap-[6px]">
          <h2 className="text-[20px] font-bold text-[var(--color-ink)]" style={FONT}>Configure agent tools</h2>
          <p className="text-[13px] leading-[19px] text-[var(--color-grey)]" style={FONT}>
            Choose which domains and capabilities this agent can access, and who can use it.
          </p>
        </div>

        <div className="rounded-[12px] bg-[var(--color-surface-0)] px-[14px] py-[14px]">
          <div className="flex flex-col gap-[16px]">
            <div className="flex flex-col gap-[6px]">
              <span className={TOOL_COLUMN_HEADING} style={FONT}>Domains</span>
              <ToolCheckbox
                label="Campaigns"
                checked={value.domains.campaigns}
                onChange={() => setValue((prev) => ({ ...prev, domains: { ...prev.domains, campaigns: !prev.domains.campaigns } }))}
              />
              <ToolCheckbox
                label="Journeys"
                checked={value.domains.journeys}
                onChange={() => setValue((prev) => ({ ...prev, domains: { ...prev.domains, journeys: !prev.domains.journeys } }))}
              />
              <ToolCheckbox
                label="Segments"
                checked={value.domains.segments}
                onChange={() => setValue((prev) => ({ ...prev, domains: { ...prev.domains, segments: !prev.domains.segments } }))}
              />
            </div>

            <div className="flex flex-col gap-[6px]">
              <span className={TOOL_COLUMN_HEADING} style={FONT}>Capabilities</span>
              <ToolCheckbox
                label="Generate reports"
                checked={value.capabilities.generateReports}
                onChange={() => setValue((prev) => ({ ...prev, capabilities: { ...prev.capabilities, generateReports: !prev.capabilities.generateReports } }))}
              />
              <ToolCheckbox
                label="Brand Wiki"
                checked={value.capabilities.brandWiki}
                onChange={() => setValue((prev) => ({ ...prev, capabilities: { ...prev.capabilities, brandWiki: !prev.capabilities.brandWiki } }))}
              />
              <ToolCheckbox
                label="Deep research"
                checked={value.capabilities.deepResearch}
                onChange={() => setValue((prev) => ({ ...prev, capabilities: { ...prev.capabilities, deepResearch: !prev.capabilities.deepResearch } }))}
              />
              <ToolCheckbox
                label="Memory"
                checked={value.capabilities.memory}
                onChange={() => setValue((prev) => ({ ...prev, capabilities: { ...prev.capabilities, memory: !prev.capabilities.memory } }))}
              />
            </div>

            <div className="flex flex-col gap-[6px]">
              <span className={TOOL_COLUMN_HEADING} style={FONT}>Visibility</span>
              <ToolRadio
                label="Private (only me)"
                checked={value.visibility === 'private'}
                onChange={() => setValue((prev) => ({ ...prev, visibility: 'private' }))}
              />
              <ToolRadio
                label="Workspace (whole team)"
                checked={value.visibility === 'workspace'}
                onChange={() => setValue((prev) => ({ ...prev, visibility: 'workspace' }))}
              />
            </div>
          </div>
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
            onClick={() => onSave(value)}
            className="flex h-[38px] items-center rounded-[9px] bg-[var(--color-ink)] px-[16px] text-[13px] font-medium text-[var(--color-surface-0)] transition-opacity hover:opacity-90"
            style={FONT}
          >
            Save tools
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

function ToolsSummary({ tools }: { tools: AgentTools }) {
  const domainItems = [
    tools.domains.campaigns ? 'Campaigns' : null,
    tools.domains.journeys ? 'Journeys' : null,
    tools.domains.segments ? 'Segments' : null,
  ].filter((item): item is string => !!item);

  const capabilityItems = [
    tools.capabilities.generateReports ? 'Generate reports' : null,
    tools.capabilities.brandWiki ? 'Brand Wiki' : null,
    tools.capabilities.deepResearch ? 'Deep research' : null,
    tools.capabilities.memory ? 'Memory' : null,
  ].filter((item): item is string => !!item);

  const visibilityLabel =
    tools.visibility === 'workspace' ? 'Workspace (whole team)' : 'Private (only me)';

  const hasSelections = domainItems.length > 0 || capabilityItems.length > 0;

  if (!hasSelections) {
    return (
      <p className="text-[13px] leading-[19px] text-[var(--color-grey-soft)]" style={FONT}>
        Configure domains, capabilities, and visibility for this agent
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-[14px]">
      {domainItems.length > 0 ? (
        <div>
          <span className={TOOL_COLUMN_HEADING} style={FONT}>Domains</span>
          <ul className="mt-[6px] flex flex-col gap-[4px]">
            {domainItems.map((item) => (
              <li key={item} className="text-[13px] leading-[19px] text-[var(--color-charcoal)]" style={FONT}>
                {item}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {capabilityItems.length > 0 ? (
        <div>
          <span className={TOOL_COLUMN_HEADING} style={FONT}>Capabilities</span>
          <ul className="mt-[6px] flex flex-col gap-[4px]">
            {capabilityItems.map((item) => (
              <li key={item} className="text-[13px] leading-[19px] text-[var(--color-charcoal)]" style={FONT}>
                {item}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div>
        <span className={TOOL_COLUMN_HEADING} style={FONT}>Visibility</span>
        <p className="mt-[6px] text-[13px] leading-[19px] text-[var(--color-charcoal)]" style={FONT}>
          {visibilityLabel}
        </p>
      </div>
    </div>
  );
}

/* ── Set starter questions modal ─────────────────────────────────── */
const SetStarterQuestionsModal: React.FC<{
  open: boolean;
  initial: string[];
  onClose: () => void;
  onSave: (value: string[]) => void;
}> = ({ open, initial, onClose, onSave }) => {
  const [questions, setQuestions] = React.useState<string[]>(initial);

  React.useEffect(() => { if (open) setQuestions(initial.length > 0 ? initial : ['']); }, [open, initial]);
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const updateQuestion = (index: number, next: string) => {
    setQuestions((prev) => prev.map((question, i) => (i === index ? next : question)));
  };

  const removeQuestion = (index: number) => {
    setQuestions((prev) => (prev.length <= 1 ? [''] : prev.filter((_, i) => i !== index)));
  };

  const addQuestion = () => setQuestions((prev) => [...prev, '']);

  const handleSave = () => {
    onSave(questions.map((question) => question.trim()).filter(Boolean));
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-[16px]">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        className="relative flex w-full max-w-[640px] flex-col gap-[18px] rounded-[16px] bg-background p-[24px] shadow-[0px_20px_60px_-12px_oklch(0_0_0_/_0.32)]"
      >
        <div className="flex flex-col gap-[6px]">
          <h2 className="text-[20px] font-bold text-[var(--color-ink)]" style={FONT}>Starter questions</h2>
          <p className="text-[13px] leading-[19px] text-[var(--color-grey)]" style={FONT}>
            Shown instead of generic suggestions whenever this agent is bound to the chat, so users start with questions the agent is built for.
          </p>
        </div>

        <div className="flex max-h-[320px] flex-col gap-[8px] overflow-y-auto pr-[2px]">
          {questions.map((question, index) => (
            <div key={index} className="flex items-center gap-[8px]">
              <input
                value={question}
                onChange={(e) => updateQuestion(index, e.target.value)}
                placeholder="Enter a starter question"
                className="h-[40px] min-w-0 flex-1 rounded-[9px] border border-[var(--color-line-input)] bg-[oklch(1_0_0_/_0.56)] px-[12px] text-[13px] text-[var(--color-ink)] placeholder:text-[var(--color-grey-soft)] outline-none transition-colors focus:border-[var(--color-line-strong)]"
                style={FONT}
              />
              <button
                type="button"
                onClick={() => removeQuestion(index)}
                aria-label="Remove question"
                className="flex size-[34px] shrink-0 items-center justify-center rounded-[8px] text-[var(--color-grey)] transition-colors hover:bg-[oklch(0_0_0_/_0.06)] hover:text-[var(--color-ink)]"
              >
                <X className="size-[15px]" />
              </button>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={addQuestion}
          className="inline-flex h-[36px] w-fit items-center gap-[6px] rounded-[9px] border border-[var(--color-line)] px-[12px] text-[13px] font-medium text-[var(--color-slate)] transition-colors hover:bg-[oklch(0_0_0_/_0.04)]"
          style={FONT}
        >
          <Plus className="size-[15px]" />
          Add question
        </button>

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
            onClick={handleSave}
            className="flex h-[38px] items-center rounded-[9px] bg-[var(--color-ink)] px-[16px] text-[13px] font-medium text-[var(--color-surface-0)] transition-opacity hover:opacity-90"
            style={FONT}
          >
            Save questions
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

function StarterQuestionsSummary({ questions }: { questions: string[] }) {
  if (questions.length === 0) {
    return (
      <p className="text-[13px] leading-[19px] text-[var(--color-grey-soft)]" style={FONT}>
        Add starter questions users can click to begin a conversation
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-[8px]">
      <div className="max-h-[132px] overflow-y-auto rounded-[10px] border border-[var(--color-line-input)] bg-[var(--color-royal-pale-soft)] px-[12px] py-[10px]">
        <ul className="flex flex-col gap-[6px]">
          {questions.map((question, index) => (
            <li key={`${index}-${question}`} className="text-[13px] leading-[19px] text-[var(--color-charcoal)]" style={FONT}>
              {question}
            </li>
          ))}
        </ul>
      </div>
      <p className="text-[12px] leading-[17px] text-[var(--color-grey-soft)]" style={FONT}>
        Shown instead of the generic suggestions whenever this agent is bound to the chat, so users start with questions the agent is built for.
      </p>
    </div>
  );
}

/* ── Detail page ─────────────────────────────────────────────────── */
const CustomAgentDetail: React.FC<CustomAgentDetailProps> = ({
  agent,
  compact = false,
  onBack,
  onEditAgent,
  onDeleteAgent,
  onUpdateAgent,
  onStartChat,
  chats = [],
  onSelectChat,
}) => {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [editOpen, setEditOpen] = React.useState(false);
  const [instructionsOpen, setInstructionsOpen] = React.useState(false);
  const [toolsOpen, setToolsOpen] = React.useState(false);
  const [starterQuestionsOpen, setStarterQuestionsOpen] = React.useState(false);
  const [textContentOpen, setTextContentOpen] = React.useState(false);
  const [filesMenuOpen, setFilesMenuOpen] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const agentTools = agent.tools ?? DEFAULT_AGENT_TOOLS;
  const starterQuestions = agent.starterQuestions ?? [];
  // Ids of files currently "uploading" — they render as skeleton rows until the
  // simulated upload settles (mirrors ChatInput's mock upload).
  const [uploadingIds, setUploadingIds] = React.useState<Set<string>>(new Set());
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Local (prototype) state for per-chat actions in Recents: rename overrides,
  // deletions, bookmarks, which row's menu is open, and inline-rename editing.
  // Mirrors LhsSidebar / ChatListPage so the popover behaves identically.
  const [titleOverrides, setTitleOverrides] = React.useState<Record<string, string>>({});
  const [deletedChatIds, setDeletedChatIds] = React.useState<Set<string>>(new Set());
  const [bookmarkedIds, setBookmarkedIds] = React.useState<Set<string>>(new Set());
  const [chatMenuOpenId, setChatMenuOpenId] = React.useState<string | null>(null);
  const [renamingId, setRenamingId] = React.useState<string | null>(null);
  const [renameValue, setRenameValue] = React.useState('');
  const [deleteChatTarget, setDeleteChatTarget] = React.useState<{ id: string; title: string } | null>(null);
  const renameInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (renamingId) renameInputRef.current?.focus();
  }, [renamingId]);

  const startRename = (id: string, current: string) => {
    setChatMenuOpenId(null);
    setRenamingId(id);
    setRenameValue(current);
  };
  const commitRename = () => {
    if (renamingId) {
      const next = renameValue.trim();
      if (next) setTitleOverrides((prev) => ({ ...prev, [renamingId]: next }));
    }
    setRenamingId(null);
  };
  const cancelRename = () => setRenamingId(null);
  const toggleBookmark = (id: string) =>
    setBookmarkedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const requestDeleteChat = (id: string, title: string) => {
    setChatMenuOpenId(null);
    setDeleteChatTarget({ id, title });
  };
  const confirmDeleteChat = () => {
    if (deleteChatTarget) setDeletedChatIds((prev) => new Set(prev).add(deleteChatTarget.id));
    setDeleteChatTarget(null);
  };

  const genId = () => `f-${Date.now()}-${Math.round(Math.random() * 1e6)}`;

  const addFiles = (files: AgentFile[]) =>
    onUpdateAgent(agent.id, { files: [...agent.files, ...files], updatedAt: 'now' });
  const removeFile = (fileId: string) =>
    onUpdateAgent(agent.id, { files: agent.files.filter((f) => f.id !== fileId), updatedAt: 'now' });

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files ?? []);
    if (picked.length) {
      const added = picked.map((f) => ({ id: genId(), title: f.name, kind: 'upload' as const, size: f.size }));
      addFiles(added);
      // Show a skeleton for each new file, then settle after ~1.4s.
      setUploadingIds((prev) => new Set([...prev, ...added.map((a) => a.id)]));
      added.forEach((a) => {
        setTimeout(() => {
          setUploadingIds((prev) => {
            const next = new Set(prev);
            next.delete(a.id);
            return next;
          });
        }, 1400);
      });
    }
    e.target.value = '';
  };

  return (
    <div className="flex flex-col h-full w-full overflow-hidden bg-[var(--color-surface-0)]">
      <div className="mx-auto flex flex-col min-h-0 w-full max-w-[1080px] flex-1 px-[20px]">
        {/* Back link */}
        <div className={cn('shrink-0', compact ? 'pt-[12px]' : 'pt-[12px]')}>
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-[6px] text-[13px] text-[var(--color-grey)] hover:text-[var(--color-ink)] transition-colors"
            style={FONT}
          >
            <ArrowLeft className="size-[16px]" />
            All agents
          </button>
        </div>

        {/* Header — avatar + name + description, three-dot menu (no star/bookmark). */}
        <div className="flex items-start justify-between gap-[12px] pt-[10px] pb-[16px] shrink-0">
          <div className="flex min-w-0 items-start gap-[14px]">
            {agent.avatarSrc && (
              <img
                src={agent.avatarSrc}
                alt=""
                className={cn('rounded-full object-cover shrink-0', compact ? 'size-[40px]' : 'size-[52px]')}
              />
            )}
            <div className="flex min-w-0 flex-col gap-[4px]">
              <h1
                className={cn('font-semibold text-[var(--color-ink)]', compact ? 'text-[20px] leading-[26px]' : 'text-[28px] leading-[34px]')}
                style={FONT}
              >
                {agent.name}
              </h1>
              {agent.description && (
                <p className="text-[14px] leading-[20px] text-[var(--color-grey)]" style={FONT}>
                  {agent.description}
                </p>
              )}
            </div>
          </div>
          <ActionMenu open={menuOpen} onOpenChange={setMenuOpen} modal={false}>
            <ActionMenuTrigger asChild>
              <button
                type="button"
                aria-label="Agent options"
                className="flex items-center justify-center size-[34px] rounded-[8px] text-[var(--color-charcoal)] hover:bg-[oklch(0_0_0_/_0.06)] data-[state=open]:bg-[oklch(0_0_0_/_0.06)] transition-colors shrink-0"
              >
                <MoreHorizontal className="size-[18px]" />
              </button>
            </ActionMenuTrigger>
            <ActionMenuContent align="end" side="bottom">
              <ActionMenuItem icon={Pencil} onSelect={() => { setMenuOpen(false); setEditOpen(true); }}>Edit details</ActionMenuItem>
              <ActionMenuItem icon={Trash2} variant="danger" onSelect={() => { setMenuOpen(false); setDeleteOpen(true); }}>Delete</ActionMenuItem>
            </ActionMenuContent>
          </ActionMenu>
        </div>

        {/* Body — chat input (left) + Instructions/Files card (right).
            `overflow-y-auto` also clips horizontally, which would cut the chat
            input's focus ring at the edge. The -mx/px pair widens the clip area
            by 4px on each side while keeping content aligned with the header. */}
        <div className={cn('flex-1 min-h-0 overflow-y-auto pt-[6px] pb-[32px] hover-scroll -mx-[4px] px-[4px]', compact ? 'flex flex-col gap-[16px]' : 'grid grid-cols-[minmax(0,1fr)_360px] gap-[24px] items-start')}>
          {/* Chat input column */}
          <div className="flex flex-col gap-[10px]">
            <ChatInput
              key={agent.id}
              placeholder="How can I help you today?"
              onSend={onStartChat}
              initialValue={agent.starterPrompt}
            />

            {/* Recents — this agent's chat history, newest first. */}
            {chats.length > 0 && (
              <div className="flex flex-col mt-[16px]">
                <span
                  className="px-[6px] pb-[6px] text-[13px] font-medium text-[var(--color-grey)]"
                  style={FONT}
                >
                  Recents
                </span>
                <div className="flex flex-col">
                  {chats.filter((chat) => !deletedChatIds.has(chat.id)).map((chat) => {
                    const isRenaming = chat.id === renamingId;
                    const isMenuOpen = chat.id === chatMenuOpenId;
                    const title = titleOverrides[chat.id] ?? chat.title;
                    return (
                      <div
                        key={chat.id}
                        className={cn(
                          'group flex items-center gap-[12px] rounded-[10px] px-[6px] py-[10px] transition-colors',
                          isRenaming ? 'bg-[oklch(0_0_0_/_0.04)]' : 'hover:bg-[oklch(0_0_0_/_0.04)]'
                        )}
                      >
                        <MessageSquare className="size-[18px] shrink-0 text-[var(--color-slate)]" />
                        {isRenaming ? (
                          <input
                            ref={renameInputRef}
                            value={renameValue}
                            onChange={(e) => setRenameValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') commitRename();
                              else if (e.key === 'Escape') cancelRename();
                            }}
                            onBlur={commitRename}
                            className="flex-1 min-w-0 bg-transparent border-0 p-0 text-[15px] text-[var(--color-ink)] focus:outline-none"
                            style={FONT}
                          />
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => onSelectChat?.(chat.id)}
                              className="flex-1 min-w-0 truncate text-left text-[15px] text-[var(--color-ink)]"
                              style={FONT}
                            >
                              {title}
                            </button>
                            {/* Timestamp by default; hides to make room for the actions
                                menu on hover / when the menu is open (mirrors the LHS). */}
                            <span
                              className={cn(
                                'shrink-0 text-[13px] text-[var(--color-grey)]',
                                isMenuOpen ? 'hidden' : 'group-hover:hidden'
                              )}
                              style={FONT}
                            >
                              {chat.time === 'now' ? 'just now' : chat.time}
                            </span>
                            <ChatActionsMenu
                              open={isMenuOpen}
                              onOpenChange={(o) => setChatMenuOpenId(o ? chat.id : null)}
                              align="end"
                              side="bottom"
                              modal={false}
                              isBookmarked={bookmarkedIds.has(chat.id)}
                              onRename={() => startRename(chat.id, title)}
                              onBookmark={() => toggleBookmark(chat.id)}
                              onDelete={() => requestDeleteChat(chat.id, title)}
                              trigger={
                                <button
                                  type="button"
                                  onClick={(e) => e.stopPropagation()}
                                  aria-label="Chat options"
                                  className={cn(
                                    'items-center justify-center size-[26px] rounded-[6px] text-[var(--color-charcoal)] hover:bg-[oklch(0_0_0_/_0.1)] data-[state=open]:bg-[oklch(0_0_0_/_0.1)] shrink-0',
                                    isMenuOpen ? 'flex' : 'hidden group-hover:flex'
                                  )}
                                >
                                  <MoreHorizontal className="size-[16px]" />
                                </button>
                              }
                            />
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Instructions + Files + Tools + Starter questions card */}
          <div className="flex flex-col rounded-[16px] border border-[var(--color-line-input)] bg-card overflow-hidden">
            {/* Instructions */}
            <div className="flex flex-col border-b border-[var(--color-line)]">
              <div className="flex items-center justify-between gap-[8px] px-[18px] pt-[16px] pb-[10px]">
                <span className="text-[15px] font-semibold text-[var(--color-ink)]" style={FONT}>Instructions</span>
                <button
                  type="button"
                  onClick={() => setInstructionsOpen(true)}
                  aria-label="Edit instructions"
                  className="flex items-center justify-center size-[28px] rounded-[8px] text-[var(--color-charcoal)] hover:bg-[oklch(0_0_0_/_0.06)] transition-colors"
                >
                  <Pencil className="size-[15px]" />
                </button>
              </div>
              <button
                type="button"
                onClick={() => setInstructionsOpen(true)}
                className="px-[18px] pb-[16px] text-left"
              >
                {agent.instructions ? (
                  <p className="line-clamp-3 break-words text-[13px] leading-[19px] text-[var(--color-charcoal)] whitespace-pre-wrap" style={FONT}>
                    {agent.instructions}
                  </p>
                ) : (
                  <p className="text-[13px] leading-[19px] text-[var(--color-grey-soft)]" style={FONT}>
                    Add instructions to tailor the agent's responses
                  </p>
                )}
              </button>
            </div>

            {/* Files */}
            <div className="flex flex-col">
              <div className="flex items-center justify-between gap-[8px] px-[18px] pt-[16px] pb-[10px]">
                <span className="text-[15px] font-semibold text-[var(--color-ink)]" style={FONT}>Files</span>
                <Popover open={filesMenuOpen} onOpenChange={setFilesMenuOpen}>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      aria-label="Add file"
                      className="flex items-center justify-center size-[28px] rounded-[8px] text-[var(--color-charcoal)] hover:bg-[oklch(0_0_0_/_0.06)] data-[state=open]:bg-[oklch(0_0_0_/_0.06)] transition-colors"
                    >
                      <Plus className="size-[16px]" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent
                    align="end"
                    sideOffset={6}
                    className="w-[212px] p-[6px] rounded-[12px] border border-border bg-popover shadow-[0px_8px_20px_0px_oklch(0_0_0_/_0.12)]"
                    style={FONT}
                  >
                    <button
                      type="button"
                      onClick={() => { setFilesMenuOpen(false); fileInputRef.current?.click(); }}
                      className="flex w-full items-center gap-[8px] h-[32px] px-[8px] rounded-[8px] text-[13px] font-medium text-[var(--color-charcoal)] hover:bg-[oklch(0_0_0_/_0.06)] transition-colors"
                    >
                      <Paperclip className="size-[16px] shrink-0" strokeWidth={1.75} />
                      Upload from device
                    </button>
                    <button
                      type="button"
                      onClick={() => { setFilesMenuOpen(false); setTextContentOpen(true); }}
                      className="flex w-full items-center gap-[8px] h-[32px] px-[8px] rounded-[8px] text-[13px] font-medium text-[var(--color-charcoal)] hover:bg-[oklch(0_0_0_/_0.06)] transition-colors"
                    >
                      <TextCursorInput className="size-[16px] shrink-0" strokeWidth={1.75} />
                      Add text content
                    </button>
                    <button
                      type="button"
                      onClick={() => setFilesMenuOpen(false)}
                      className="flex w-full items-center gap-[8px] h-[32px] px-[8px] rounded-[8px] text-[13px] font-medium text-[var(--color-charcoal)] hover:bg-[oklch(0_0_0_/_0.06)] transition-colors"
                    >
                      <Github className="size-[16px] shrink-0" strokeWidth={1.75} />
                      GitHub
                    </button>
                  </PopoverContent>
                </Popover>
              </div>

              <div className="px-[18px] pb-[18px]">
                {agent.files.length === 0 ? (
                  <div className="flex flex-col items-center gap-[8px] rounded-[12px] border border-dashed border-[var(--color-line-input)] bg-[var(--color-surface-0)] py-[26px] px-[16px] text-center">
                    <Bot className="size-[22px] text-[var(--color-grey-soft)]" />
                    <p className="text-[12px] leading-[17px] text-[var(--color-grey-soft)]" style={FONT}>
                      Add PDFs, documents, or other text to reference in this agent.
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-[8px]">
                    {agent.files.map((file) => {
                      const isUploading = uploadingIds.has(file.id);
                      if (isUploading) {
                        // Skeleton row while the (simulated) upload settles.
                        return (
                          <div
                            key={file.id}
                            className="flex items-center gap-[10px] rounded-[10px] border border-[var(--color-line-input)] bg-[var(--color-surface-0)] px-[12px] py-[9px]"
                          >
                            <span className="size-[28px] rounded-[7px] bg-[var(--color-surface-1)] animate-pulse shrink-0" />
                            <div className="flex min-w-0 flex-1 flex-col gap-[5px]">
                              <span className="h-[10px] w-[62%] rounded-[4px] bg-[var(--color-surface-1)] animate-pulse" />
                              <span className="h-[8px] w-[34%] rounded-[4px] bg-[var(--color-surface-1)] animate-pulse" />
                            </div>
                          </div>
                        );
                      }
                      return (
                        <div
                          key={file.id}
                          className="group flex items-center gap-[10px] rounded-[10px] border border-[var(--color-line-input)] bg-[var(--color-surface-0)] px-[12px] py-[9px]"
                        >
                          <span className="flex size-[28px] items-center justify-center rounded-[7px] bg-[var(--color-surface-1)] text-[var(--color-charcoal)] shrink-0">
                            <FileText className="size-[15px]" />
                          </span>
                          <div className="flex min-w-0 flex-1 flex-col">
                            <span className="truncate text-[13px] font-medium text-[var(--color-ink)]" style={FONT}>{file.title}</span>
                            <span className="text-[11px] text-[var(--color-grey-soft)]" style={FONT}>
                              {file.kind === 'upload' && file.size != null
                                ? formatFileSize(file.size)
                                : file.kind === 'text' ? 'Text' : 'GitHub'}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeFile(file.id)}
                            aria-label={`Remove ${file.title}`}
                            className="flex size-[26px] items-center justify-center rounded-[7px] text-[var(--color-grey)] hover:bg-[oklch(0_0_0_/_0.06)] hover:text-[var(--color-ink)] transition-colors shrink-0"
                          >
                            <X className="size-[15px]" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Tools */}
            <div className="flex flex-col border-t border-[var(--color-line)]">
              <div className="flex items-center justify-between gap-[8px] px-[18px] pt-[16px] pb-[10px]">
                <span className="text-[15px] font-semibold text-[var(--color-ink)]" style={FONT}>Tools</span>
                <button
                  type="button"
                  onClick={() => setToolsOpen(true)}
                  aria-label="Edit tools"
                  className="flex items-center justify-center size-[28px] rounded-[8px] text-[var(--color-charcoal)] hover:bg-[oklch(0_0_0_/_0.06)] transition-colors"
                >
                  <Pencil className="size-[15px]" />
                </button>
              </div>
              <button
                type="button"
                onClick={() => setToolsOpen(true)}
                className="px-[18px] pb-[16px] text-left"
              >
                <ToolsSummary tools={agentTools} />
              </button>
            </div>

            {/* Starter questions */}
            <div className="flex flex-col border-t border-[var(--color-line)]">
              <div className="flex items-center justify-between gap-[8px] px-[18px] pt-[16px] pb-[10px]">
                <span className="text-[15px] font-semibold text-[var(--color-ink)]" style={FONT}>
                  Starter questions <span className="font-medium text-[var(--color-grey-soft)]">(optional)</span>
                </span>
                <button
                  type="button"
                  onClick={() => setStarterQuestionsOpen(true)}
                  aria-label="Edit starter questions"
                  className="flex items-center justify-center size-[28px] rounded-[8px] text-[var(--color-charcoal)] hover:bg-[oklch(0_0_0_/_0.06)] transition-colors"
                >
                  <Pencil className="size-[15px]" />
                </button>
              </div>
              <button
                type="button"
                onClick={() => setStarterQuestionsOpen(true)}
                className="px-[18px] pb-[16px] text-left"
              >
                <StarterQuestionsSummary questions={starterQuestions} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleUpload} />

      <CreateCustomAgentModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        initial={{ name: agent.name, description: agent.description }}
        onSubmit={(data) => { onEditAgent(agent.id, data); setEditOpen(false); }}
      />

      <SetInstructionsModal
        open={instructionsOpen}
        initial={agent.instructions}
        onClose={() => setInstructionsOpen(false)}
        onSave={(value) => { onUpdateAgent(agent.id, { instructions: value, updatedAt: 'now' }); setInstructionsOpen(false); }}
      />

      <SetToolsModal
        open={toolsOpen}
        initial={agentTools}
        onClose={() => setToolsOpen(false)}
        onSave={(value) => { onUpdateAgent(agent.id, { tools: value, updatedAt: 'now' }); setToolsOpen(false); }}
      />

      <SetStarterQuestionsModal
        open={starterQuestionsOpen}
        initial={starterQuestions}
        onClose={() => setStarterQuestionsOpen(false)}
        onSave={(value) => { onUpdateAgent(agent.id, { starterQuestions: value, updatedAt: 'now' }); setStarterQuestionsOpen(false); }}
      />

      <AddTextContentModal
        open={textContentOpen}
        onClose={() => setTextContentOpen(false)}
        onAdd={({ title, content }) => {
          addFiles([{ id: genId(), title, kind: 'text', content }]);
          setTextContentOpen(false);
        }}
      />

      <DeleteChatDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete agent?"
        fallbackName="this agent"
        chatName={agent.name}
        onConfirm={() => { setDeleteOpen(false); onDeleteAgent(agent.id); }}
      />

      <DeleteChatDialog
        open={!!deleteChatTarget}
        onOpenChange={(o) => !o && setDeleteChatTarget(null)}
        chatName={deleteChatTarget?.title}
        onConfirm={confirmDeleteChat}
      />
    </div>
  );
};

export default CustomAgentDetail;
