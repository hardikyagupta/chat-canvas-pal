import React, { useMemo, useState } from 'react';
import { Search, MoreHorizontal, Trash2, Clock, Pause, Play, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { ReportItem } from '@/data/reports';
import type { ScheduleItem, ScheduleCadence, ScheduleStatus, ScheduleTemplate } from '@/data/schedules';
import { CADENCE_OPTIONS } from '@/data/schedules';
import {
  ActionMenu,
  ActionMenuTrigger,
  ActionMenuContent,
  ActionMenuItem,
  ActionMenuSeparator,
} from '@/components/ui/action-menu';
import DeleteChatDialog from './DeleteChatDialog';
import ScheduleDialog, { type SchedulePrefill } from './ScheduleDialog';
import { PAGE_COLUMN, pageHeaderPadTop } from './pageLayout';

const MANROPE: React.CSSProperties = { fontFamily: 'Manrope, sans-serif' };

interface SchedulerPageProps {
  title?: string;
  /** Seed list of schedules; the page owns its own state so Create/Delete mutate in memory. */
  initialSchedules: ScheduleItem[];
  /** One-tap suggested schedules shown below the created ones. */
  templates: ScheduleTemplate[];
  /** Reports selectable in the create dialog. */
  availableReports: ReportItem[];
  searchPlaceholder?: string;
  /** Open a schedule's report in the doc previewer (RHS artifact panel). */
  onSelectSchedule?: (schedule: ScheduleItem) => void;
  className?: string;
  /** Minimized (docked widget) view — shrinks the page title + forces one column. */
  compact?: boolean;
}

const statusStyles: Record<ScheduleStatus, { bg: string; fg: string; dot: string; label: string }> = {
  active: { bg: 'color-mix(in oklch, var(--color-emerald, oklch(0.72 0.15 155)) 16%, transparent)', fg: 'oklch(0.5 0.13 155)', dot: 'oklch(0.62 0.15 155)', label: 'Active' },
  running: { bg: 'color-mix(in oklch, var(--color-emerald, oklch(0.72 0.15 155)) 16%, transparent)', fg: 'oklch(0.5 0.13 155)', dot: 'oklch(0.62 0.15 155)', label: 'Running' },
  paused: { bg: 'oklch(0 0 0 / 0.06)', fg: 'var(--color-grey)', dot: 'var(--color-grey-soft)', label: 'Paused' },
};

const stripHtml = (s: string) => s.replace(/<[^>]+>/g, '');

// Human-readable schedule label for a cadence (reused by suggestion cards).
const cadenceLabelFor = (cadence: ScheduleCadence) =>
  CADENCE_OPTIONS.find((o) => o.value === cadence)?.label ?? '';

const PRIMARY_ACTION: Record<ScheduleStatus, { label: string; icon: typeof Play }> = {
  active: { label: 'Run now', icon: Play },
  running: { label: 'Pause', icon: Pause },
  paused: { label: 'Resume', icon: Play },
};

/**
 * A single created-schedule card (no thumbnail): the schedule name, a short
 * description, and a green "schedule" pill (clock + cadence label). A three-dot
 * menu (Run now · Pause · Resume / Edit / Delete) sits at the top-right.
 */
const ScheduleCard: React.FC<{
  schedule: ScheduleItem;
  menuOpen: boolean;
  onMenuOpenChange: (open: boolean) => void;
  onOpen: () => void;
  onCycleStatus: () => void;
  onEdit: () => void;
  onDelete: () => void;
}> = ({ schedule, menuOpen, onMenuOpenChange, onOpen, onCycleStatus, onEdit, onDelete }) => {
  const isPaused = schedule.status === 'paused';
  const primary = PRIMARY_ACTION[schedule.status];
  // Green pill when active/running; muted grey when paused so status still reads.
  const pill = isPaused
    ? { bg: statusStyles.paused.bg, fg: statusStyles.paused.fg }
    : { bg: statusStyles.active.bg, fg: statusStyles.active.fg };
  const description = stripHtml(schedule.doc.paragraphs[0] ?? '');
  return (
    <div className="group relative flex flex-col gap-[12px] rounded-[16px] border border-[var(--color-line-input)] bg-card p-[18px] transition-shadow hover:shadow-[0px_4px_16px_-4px_oklch(0_0_0_/_0.08)]">
      {/* Title (tap to open the report) — pr reserves room for the menu. */}
      <button
        type="button"
        onClick={onOpen}
        className="block w-full truncate pr-[30px] text-left text-[16px] leading-[22px] font-semibold text-[var(--color-ink)]"
        style={MANROPE}
      >
        {schedule.title}
      </button>

      {/* Description — a two-line peek at the report summary. */}
      <p className="line-clamp-2 text-[13px] leading-[19px] text-[var(--color-grey)]" style={MANROPE}>
        {description}
      </p>

      {/* Green schedule pill. */}
      <span
        className="inline-flex max-w-full self-start items-center gap-[6px] rounded-[8px] px-[9px] py-[4px] text-[12px] font-semibold"
        style={{ background: pill.bg, color: pill.fg }}
      >
        <Clock className="size-[13px] shrink-0" />
        <span className="truncate">{schedule.cadenceLabel}</span>
      </span>

      {/* Three-dot menu — top-right, appears on hover / when open. */}
      <div className={cn('absolute right-[12px] top-[12px]', menuOpen ? 'block' : 'hidden group-hover:block')}>
        <ActionMenu open={menuOpen} onOpenChange={onMenuOpenChange} modal={false}>
          <ActionMenuTrigger asChild>
            <button
              type="button"
              aria-label="Schedule options"
              className="flex items-center justify-center size-[28px] rounded-[8px] text-[var(--color-charcoal)] hover:bg-[oklch(0_0_0_/_0.06)] data-[state=open]:bg-[oklch(0_0_0_/_0.06)] transition-colors"
            >
              <MoreHorizontal className="size-[16px]" />
            </button>
          </ActionMenuTrigger>
          <ActionMenuContent align="end" side="bottom">
            <ActionMenuItem icon={primary.icon} onSelect={onCycleStatus}>
              {primary.label}
            </ActionMenuItem>
            <ActionMenuItem icon={Pencil} onSelect={onEdit}>
              Edit
            </ActionMenuItem>
            <ActionMenuSeparator />
            <ActionMenuItem icon={Trash2} variant="danger" onSelect={onDelete}>
              Delete
            </ActionMenuItem>
          </ActionMenuContent>
        </ActionMenu>
      </div>
    </div>
  );
};

/** A suggested-schedule card (icon tile + title + description + schedule line) —
 *  opens the create dialog pre-filled. Laid out in a two-column grid. */
const SuggestionCard: React.FC<{ template: ScheduleTemplate; onSelect: () => void }> = ({ template, onSelect }) => (
  <button
    type="button"
    onClick={onSelect}
    className="group flex w-full items-start gap-[12px] rounded-[12px] p-[12px] text-left transition-colors hover:bg-[oklch(0_0_0_/_0.04)]"
  >
    <span className="flex size-[40px] items-center justify-center rounded-[10px] bg-[var(--color-surface-1)] text-[18px] leading-none shrink-0">
      <span aria-hidden>{template.emoji}</span>
    </span>
    <span className="flex min-w-0 flex-1 flex-col gap-[3px]">
      <span className="truncate text-[15px] leading-[20px] font-semibold text-[var(--color-ink)]" style={MANROPE}>
        {template.title}
      </span>
      <span className="line-clamp-2 text-[13px] leading-[18px] text-[var(--color-grey)]" style={MANROPE}>
        {template.description}
      </span>
      <span className="mt-[2px] flex items-center gap-[6px] text-[12px] leading-[16px] text-[var(--color-grey-soft)]" style={MANROPE}>
        <Clock className="size-[13px] shrink-0" />
        <span className="truncate">{cadenceLabelFor(template.cadence)}</span>
      </span>
    </span>
  </button>
);

const SectionLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p className="mb-[10px] text-[12px] font-semibold uppercase tracking-[0.04em] text-[var(--color-grey)]" style={MANROPE}>
    {children}
  </p>
);

/**
 * Full-page Scheduler. A sticky header (title + New schedule + search) sits above
 * two sections: the schedules you've created (card grid, each with a status pill)
 * and a list of suggested schedules that open the create dialog pre-filled.
 */
const SchedulerPage: React.FC<SchedulerPageProps> = ({
  title = 'Scheduled',
  initialSchedules,
  templates,
  availableReports,
  searchPlaceholder = 'Search scheduled tasks...',
  onSelectSchedule,
  className,
  compact = false,
}) => {
  const [schedules, setSchedules] = useState<ScheduleItem[]>(initialSchedules);
  const [query, setQuery] = useState('');
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [prefill, setPrefill] = useState<SchedulePrefill | undefined>(undefined);
  // When set, the create dialog is editing this schedule in place.
  const [editingId, setEditingId] = useState<string | null>(null);

  const confirmDelete = () => {
    if (deleteTarget) setSchedules((prev) => prev.filter((s) => s.id !== deleteTarget.id));
    setDeleteTarget(null);
  };

  // The dialog always emits a fresh item; when editing, keep the original id/slot
  // and swap its fields in place (including status so Run now / Pause / Resume
  // is not reset), otherwise prepend the new schedule.
  const handleCreate = (item: ScheduleItem) => {
    if (editingId) {
      const id = editingId;
      setSchedules((prev) =>
        prev.map((s) => (s.id === id ? { ...item, id, status: s.status } : s))
      );
    } else {
      setSchedules((prev) => [item, ...prev]);
    }
    setEditingId(null);
  };

  const cycleStatus = (schedule: ScheduleItem) => {
    const next: ScheduleStatus =
      schedule.status === 'active' ? 'running' : schedule.status === 'running' ? 'paused' : 'running';
    setSchedules((prev) => prev.map((s) => (s.id === schedule.id ? { ...s, status: next } : s)));
    if (schedule.status === 'active') {
      toast.success(`Running "${schedule.title}" now`, { description: schedule.cadenceLabel });
    } else if (schedule.status === 'running') {
      toast.success(`Paused "${schedule.title}"`, { description: schedule.cadenceLabel });
    } else {
      toast.success(`Resumed "${schedule.title}"`, { description: schedule.cadenceLabel });
    }
  };

  const openBlank = () => {
    setEditingId(null);
    setPrefill(undefined);
    setDialogOpen(true);
  };
  const openFromTemplate = (t: ScheduleTemplate) => {
    setEditingId(null);
    setPrefill({ reportId: t.reportId, cadence: t.cadence, recipients: t.recipients });
    setDialogOpen(true);
  };
  const openEdit = (s: ScheduleItem) => {
    setEditingId(s.id);
    setPrefill({ reportId: s.reportId, name: s.title, cadence: s.cadence, cron: s.cron, recipients: s.recipients });
    setDialogOpen(true);
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return schedules.filter((s) => !q || s.title.toLowerCase().includes(q));
  }, [schedules, query]);

  const searching = query.trim().length > 0;

  return (
    <div className={cn('flex flex-col h-full w-full overflow-hidden bg-[var(--color-surface-0)]', className)}>
      <div className={cn('mx-auto flex flex-col min-h-0 flex-1', PAGE_COLUMN)}>
        {/* Sticky header — title + New schedule, then search. */}
        <div className={cn('flex flex-col gap-[16px] pb-[12px] w-full shrink-0', pageHeaderPadTop(compact))}>
          <div className="flex items-center justify-between gap-[12px] h-[34px]">
            <h1
              className={cn(
                'font-semibold text-[var(--color-ink)]',
                compact ? 'text-[16px] leading-[24px]' : 'text-[24px] leading-[32px]'
              )}
              style={MANROPE}
            >
              {title}
            </h1>
            {/* Black button — matches the New chat button (ChatListPage) / DocArtifactCard. */}
            <button
              type="button"
              onClick={openBlank}
              className="relative flex items-center justify-center px-[14px] py-[7px] rounded-[8px] bg-foreground overflow-hidden hover:bg-foreground/90 transition-colors shrink-0"
            >
              <span
                aria-hidden
                className="absolute inset-0 rounded-[8px] pointer-events-none"
                style={{ background: 'linear-gradient(to bottom, oklch(1 0 0 / 0.07) 82%, oklch(1 0 0 / 0.15) 94%)' }}
              />
              <span className="relative z-10 text-[14px] leading-[20px] font-medium text-background" style={MANROPE}>
                New schedule
              </span>
            </button>
          </div>

          <div className="flex items-center gap-[8px] h-[36px] px-[14px] w-full rounded-[10px] border border-[var(--color-line-input)] bg-white focus-within:border-[var(--color-royal)] transition-colors">
            <Search className="size-[16px] text-[var(--color-grey-soft)] shrink-0" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={searchPlaceholder}
              className="flex-1 min-w-0 bg-transparent outline-none text-[14px] leading-[20px] text-[var(--color-ink)] placeholder:text-[var(--color-grey-soft)]"
              style={MANROPE}
            />
          </div>
        </div>

        {/* Scrollable body — Your schedules (cards) + Suggested (rows). */}
        <div className="flex-1 min-h-0 overflow-y-auto w-full pt-[12px] pb-[32px] hover-scroll">
          {/* Your schedules */}
          {filtered.length > 0 && (
            <section className="mb-[28px]">
              <SectionLabel>Your schedules</SectionLabel>
              <div
                className={cn(
                  'grid gap-[16px]',
                  compact ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
                )}
              >
                {filtered.map((schedule) => (
                  <ScheduleCard
                    key={schedule.id}
                    schedule={schedule}
                    menuOpen={menuOpenId === schedule.id}
                    onMenuOpenChange={(o) => setMenuOpenId(o ? schedule.id : null)}
                    onOpen={() => onSelectSchedule?.(schedule)}
                    onCycleStatus={() => cycleStatus(schedule)}
                    onEdit={() => {
                      setMenuOpenId(null);
                      openEdit(schedule);
                    }}
                    onDelete={() => {
                      setMenuOpenId(null);
                      setDeleteTarget({ id: schedule.id, title: schedule.title });
                    }}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Empty state for created schedules (only when not searching). */}
          {filtered.length === 0 && !searching && (
            <div className="mb-[28px] flex flex-col items-center justify-center gap-[6px] rounded-[16px] border border-dashed border-[var(--color-line-input)] py-[36px]">
              <p className="text-[14px] font-medium text-[var(--color-ink)]" style={MANROPE}>No schedules yet</p>
              <p className="text-[13px] text-[var(--color-grey)]" style={MANROPE}>Pick a suggestion below or create your own.</p>
            </div>
          )}

          {filtered.length === 0 && searching && (
            <div className="flex items-center justify-center w-full py-[48px]">
              <p className="text-[14px] text-[var(--color-grey-soft)]" style={MANROPE}>No schedules found</p>
            </div>
          )}

          {/* Suggested schedules — hidden while actively searching. */}
          {!searching && templates.length > 0 && (
            <section>
              <SectionLabel>Suggested</SectionLabel>
              <div className={cn('grid gap-x-[24px] gap-y-[4px]', compact ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2')}>
                {templates.map((t) => (
                  <SuggestionCard key={t.id} template={t} onSelect={() => openFromTemplate(t)} />
                ))}
              </div>
            </section>
          )}
        </div>
      </div>

      <ScheduleDialog
        open={dialogOpen}
        onOpenChange={(o) => {
          setDialogOpen(o);
          if (!o) setEditingId(null);
        }}
        reports={availableReports}
        prefill={prefill}
        onCreate={handleCreate}
      />

      <DeleteChatDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title="Delete schedule?"
        fallbackName="this schedule"
        chatName={deleteTarget?.title}
        onConfirm={confirmDelete}
      />
    </div>
  );
};

export default SchedulerPage;
