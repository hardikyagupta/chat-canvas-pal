import React, { useMemo, useState } from 'react';
import {
  Search, MoreHorizontal, FileText, Download, Share2, Trash2, CalendarClock,
  Sparkles, Bot, LayoutGrid, List, type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { dsButtonVariants } from '@/components/ui/ds-button';
import type { ReportItem, ReportSource } from '@/data/reports';
import {
  ActionMenu,
  ActionMenuTrigger,
  ActionMenuContent,
  ActionMenuItem,
} from '@/components/ui/action-menu';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import DeleteChatDialog from './DeleteChatDialog';
import ScheduleDialog, { type SchedulePrefill } from './ScheduleDialog';
import { PAGE_COLUMN, pageHeaderPadTop } from './pageLayout';

const MANROPE: React.CSSProperties = { fontFamily: 'Manrope, sans-serif' };

type ViewMode = 'grid' | 'list';
type SourceFilter = ReportSource | 'all';

interface ReportsPageProps {
  title?: string;
  reports: ReportItem[];
  searchPlaceholder?: string;
  /** Open a report in the doc previewer (RHS artifact panel). */
  onSelectReport?: (report: ReportItem) => void;
  className?: string;
  /** Minimized (docked widget) view — shrinks the page title. */
  compact?: boolean;
}

// PDF badge is warm/orange; DOC badge is royal — a quick glance tells the type.
const typeStyles: Record<ReportItem['fileType'], { bg: string; fg: string }> = {
  PDF: { bg: 'color-mix(in oklch, var(--color-orange) 16%, transparent)', fg: 'var(--color-orange)' },
  DOC: { bg: 'color-mix(in oklch, var(--color-royal) 14%, transparent)', fg: 'var(--color-royal)' },
};

// Each source category has a label + icon. Used by the filter chips, the card
// meta row, and the list view's Source column — so "where did this come from"
// reads the same everywhere.
const SOURCE_META: Record<ReportSource, { label: string; icon: LucideIcon }> = {
  'deep-research': { label: 'Deep research', icon: Sparkles },
  'custom-agent': { label: 'Custom agents', icon: Bot },
  scheduled: { label: 'Scheduled', icon: CalendarClock },
};
const SOURCE_ORDER: ReportSource[] = ['deep-research', 'custom-agent', 'scheduled'];

const stripHtml = (s: string) => s.replace(/<[^>]+>/g, '');
const slugify = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

// Prototype download — exports the report's text as a downloadable file. (Real
// PDF/DOCX generation would need a library; this ships the content today.)
const downloadReport = (report: ReportItem) => {
  const { doc } = report;
  const body = [
    doc.title,
    '',
    doc.summaryHeading ?? 'Executive summary',
    '',
    ...doc.paragraphs.map(stripHtml),
  ].join('\n\n');
  const blob = new Blob([body], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${slugify(report.title)}.txt`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};

// Prototype share — copies a shareable link to the report to the clipboard.
const shareReport = (report: ReportItem) => {
  const link = `${window.location.origin}/reports/${report.id}`;
  navigator.clipboard?.writeText(link).catch(() => {});
};

/** Small inline "where it came from" tag — source icon + the specific label. */
const SourceTag: React.FC<{ report: ReportItem; className?: string }> = ({ report, className }) => {
  const Icon = SOURCE_META[report.source].icon;
  return (
    <span
      className={cn('inline-flex min-w-0 items-center gap-[6px] text-[13px] text-[var(--color-grey)]', className)}
      style={MANROPE}
    >
      <Icon className="size-[16px] shrink-0" />
      <span className="truncate">{report.sourceLabel}</span>
    </span>
  );
};

/** File-type pill (PDF / DOC) with the type's accent colour. */
const TypePill: React.FC<{ type: ReportItem['fileType'] }> = ({ type }) => {
  const s = typeStyles[type];
  return (
    <span
      className="inline-flex items-center h-[20px] px-[8px] rounded-full text-[11px] font-semibold"
      style={{ background: s.bg, color: s.fg, ...MANROPE }}
    >
      {type}
    </span>
  );
};

/** Shared row actions (quick download + three-dot menu). Reused by card + row. */
const RowActions: React.FC<{
  report: ReportItem;
  menuOpen: boolean;
  onMenuOpenChange: (open: boolean) => void;
  onDelete: () => void;
  onSchedule: () => void;
  className?: string;
}> = ({ report, menuOpen, onMenuOpenChange, onDelete, onSchedule, className }) => (
  <div className={cn('flex items-center gap-[2px]', className)} onClick={(e) => e.stopPropagation()}>
    <button
      type="button"
      onClick={() => downloadReport(report)}
      aria-label="Download report"
      className="flex items-center justify-center size-[30px] rounded-[8px] text-[var(--color-grey)] hover:bg-[var(--color-surface-1)] hover:text-[var(--color-ink)] transition-colors"
    >
      <Download className="size-[16px]" />
    </button>
    <ActionMenu open={menuOpen} onOpenChange={onMenuOpenChange} modal={false}>
      <ActionMenuTrigger asChild>
        <button
          type="button"
          aria-label="Report options"
          className="flex items-center justify-center size-[30px] rounded-[8px] text-[var(--color-grey)] hover:bg-[var(--color-surface-1)] hover:text-[var(--color-ink)] transition-colors"
        >
          <MoreHorizontal className="size-[16px]" />
        </button>
      </ActionMenuTrigger>
      <ActionMenuContent align="end" side="bottom">
        <ActionMenuItem icon={CalendarClock} onSelect={onSchedule}>Schedule</ActionMenuItem>
        <ActionMenuItem icon={Share2} onSelect={() => shareReport(report)}>Share</ActionMenuItem>
        <ActionMenuItem icon={Trash2} variant="danger" onSelect={onDelete}>Delete</ActionMenuItem>
      </ActionMenuContent>
    </ActionMenu>
  </div>
);

interface RowProps {
  report: ReportItem;
  menuOpen: boolean;
  onMenuOpenChange: (open: boolean) => void;
  onOpen: () => void;
  onDelete: () => void;
  onSchedule: () => void;
}

/**
 * A single report card (grid view): a faded doc-preview thumbnail (tap to open),
 * a hover three-dot menu, and a title + source · created meta row below.
 */
const ReportCard: React.FC<RowProps> = ({ report, menuOpen, onMenuOpenChange, onOpen, onDelete, onSchedule }) => {
  const type = typeStyles[report.fileType];
  return (
    <div className="group relative flex flex-col overflow-hidden rounded-[16px] border border-[var(--color-line-input)] bg-card transition-shadow hover:shadow-[0px_4px_16px_-4px_oklch(0_0_0_/_0.08)]">
      {/* Preview thumbnail — a scaled-down peek at the document, faded at the
          bottom. Tapping opens the full doc previewer. */}
      <button
        type="button"
        onClick={onOpen}
        aria-label={`Open ${report.title}`}
        className="relative h-[184px] w-full overflow-hidden border-b border-[var(--color-line-input)] bg-[var(--color-surface-0)] text-left"
      >
        <div className="pointer-events-none select-none px-[18px] pt-[18px]">
          <div className="mb-[8px] flex items-center gap-[6px]">
            <span
              className="flex items-center justify-center size-[18px] rounded-[5px] shrink-0"
              style={{ background: type.bg }}
            >
              <FileText className="size-[11px]" style={{ color: type.fg }} />
            </span>
            <span
              className="truncate text-[11px] font-semibold text-[var(--color-ink)]"
              style={MANROPE}
            >
              {report.doc.title}
            </span>
          </div>
          <p
            className="text-[9px] font-semibold uppercase tracking-[0.04em] text-[var(--color-grey)]"
            style={MANROPE}
          >
            {report.doc.summaryHeading ?? 'Executive summary'}
          </p>
          <p
            className="mt-[6px] text-[10px] leading-[16px] text-[var(--color-ink)] [&_strong]:font-semibold"
            style={MANROPE}
            dangerouslySetInnerHTML={{ __html: report.doc.paragraphs[0] ?? '' }}
          />
          {report.doc.paragraphs[1] && (
            <p
              className="mt-[6px] text-[10px] leading-[16px] text-[var(--color-ink)] [&_strong]:font-semibold"
              style={MANROPE}
              dangerouslySetInnerHTML={{ __html: report.doc.paragraphs[1] }}
            />
          )}
        </div>
        {/* Bottom fade so the clipped text dissolves into the card. */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-[72px]"
          style={{ background: 'linear-gradient(to bottom, transparent, var(--color-surface-0))' }}
        />
      </button>

      {/* Three-dot menu — top-right of the preview, appears on hover / when open. */}
      <div className={cn('absolute right-[10px] top-[10px]', menuOpen ? 'block' : 'hidden group-hover:block')}>
        <ActionMenu open={menuOpen} onOpenChange={onMenuOpenChange} modal={false}>
          <ActionMenuTrigger asChild>
            <button
              type="button"
              aria-label="Report options"
              className="flex items-center justify-center size-[28px] rounded-[8px] bg-card/90 text-[var(--color-charcoal)] shadow-[0px_1px_2px_0px_oklch(0_0_0_/_0.12)] backdrop-blur-sm hover:bg-card transition-colors"
            >
              <MoreHorizontal className="size-[16px]" />
            </button>
          </ActionMenuTrigger>
          <ActionMenuContent align="end" side="bottom">
            <ActionMenuItem icon={CalendarClock} onSelect={onSchedule}>Schedule</ActionMenuItem>
            <ActionMenuItem icon={Share2} onSelect={() => shareReport(report)}>Share</ActionMenuItem>
            <ActionMenuItem icon={Trash2} variant="danger" onSelect={onDelete}>Delete</ActionMenuItem>
          </ActionMenuContent>
        </ActionMenu>
      </div>

      {/* Meta row — title, then source · created time. */}
      <div className="flex items-start gap-[10px] px-[16px] py-[14px]">
        <div className="flex flex-1 min-w-0 flex-col gap-[3px]">
          <button
            type="button"
            onClick={onOpen}
            className="truncate text-left text-[15px] leading-[20px] font-semibold text-[var(--color-ink)]"
            style={MANROPE}
          >
            {report.title}
          </button>
          <span className="flex min-w-0 items-center gap-[6px] text-[13px] leading-[18px] text-[var(--color-grey)]" style={MANROPE}>
            <SourceTag report={report} />
            <span className="shrink-0">· Created {report.time} ago</span>
          </span>
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            downloadReport(report);
          }}
          aria-label="Download report"
          className="flex items-center justify-center size-[30px] rounded-[8px] text-[var(--color-grey)] hover:bg-[var(--color-surface-1)] hover:text-[var(--color-ink)] transition-colors shrink-0"
        >
          <Download className="size-[16px]" />
        </button>
      </div>
    </div>
  );
};

/** A single report row (list / table view). */
const ReportRow: React.FC<RowProps> = ({ report, menuOpen, onMenuOpenChange, onOpen, onDelete, onSchedule }) => {
  const type = typeStyles[report.fileType];
  return (
    <TableRow className="group cursor-pointer" onClick={onOpen}>
      {/* Name — file-type chip + title. */}
      <TableCell className="py-[12px]">
        <div className="flex min-w-0 items-center gap-[10px]">
          <span
            className="grid place-items-center size-[28px] rounded-[7px] shrink-0"
            style={{ background: type.bg }}
          >
            <FileText className="size-[15px]" style={{ color: type.fg }} />
          </span>
          <span className="truncate text-[14px] font-semibold text-[var(--color-ink)]" style={MANROPE}>
            {report.title}
          </span>
        </div>
      </TableCell>
      {/* Source — hidden on the narrowest widths. */}
      <TableCell className="hidden sm:table-cell py-[12px]">
        <SourceTag report={report} />
      </TableCell>
      {/* Type — hidden until there's room. */}
      <TableCell className="hidden md:table-cell py-[12px]">
        <TypePill type={report.fileType} />
      </TableCell>
      {/* Created. */}
      <TableCell className="py-[12px] whitespace-nowrap text-[13px] text-[var(--color-grey)]" style={MANROPE}>
        Created {report.time} ago
      </TableCell>
      {/* Actions. */}
      <TableCell className="py-[12px] text-right">
        <RowActions
          report={report}
          menuOpen={menuOpen}
          onMenuOpenChange={onMenuOpenChange}
          onDelete={onDelete}
          onSchedule={onSchedule}
          className={cn(
            'justify-end transition-opacity',
            menuOpen ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 focus-within:opacity-100',
          )}
        />
      </TableCell>
    </TableRow>
  );
};

/**
 * Full-page list of generated reports (PDFs / Docs). A sticky header (title +
 * view switch + search + source filters) sits above either a responsive card
 * grid or a dense table. Each report names its specific source and opens in the
 * doc previewer on tap.
 */
const ReportsPage: React.FC<ReportsPageProps> = ({
  title = 'Reports',
  reports,
  searchPlaceholder = 'Search reports',
  onSelectReport,
  className,
  compact = false,
}) => {
  const [query, setQuery] = useState('');
  const [view, setView] = useState<ViewMode>('grid');
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('all');
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [schedulePrefill, setSchedulePrefill] = useState<SchedulePrefill | undefined>();

  const openSchedule = (report: ReportItem) => {
    setMenuOpenId(null);
    setSchedulePrefill({ reportId: report.id, name: report.title, lockReport: true });
    setScheduleOpen(true);
  };

  const confirmDelete = () => {
    if (deleteTarget) setDeletedIds((prev) => new Set(prev).add(deleteTarget.id));
    setDeleteTarget(null);
  };

  // Chip counts reflect the live dataset (deletions applied), independent of
  // the active filter / search — so each chip always shows its total.
  const counts = useMemo(() => {
    const base = reports.filter((r) => !deletedIds.has(r.id));
    const bySource = SOURCE_ORDER.reduce(
      (acc, s) => ({ ...acc, [s]: base.filter((r) => r.source === s).length }),
      {} as Record<ReportSource, number>,
    );
    return { all: base.length, ...bySource };
  }, [reports, deletedIds]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return reports
      .filter((r) => !deletedIds.has(r.id))
      .filter((r) => sourceFilter === 'all' || r.source === sourceFilter)
      .filter((r) => !q || r.title.toLowerCase().includes(q) || r.sourceLabel.toLowerCase().includes(q));
  }, [reports, query, deletedIds, sourceFilter]);

  const chips: { key: SourceFilter; label: string; icon?: LucideIcon; count: number }[] = [
    { key: 'all', label: 'All', count: counts.all },
    ...SOURCE_ORDER.map((s) => ({ key: s, label: SOURCE_META[s].label, icon: SOURCE_META[s].icon, count: counts[s] })),
  ];

  const rowProps = (report: ReportItem): RowProps => ({
    report,
    menuOpen: menuOpenId === report.id,
    onMenuOpenChange: (o) => setMenuOpenId(o ? report.id : null),
    onOpen: () => onSelectReport?.(report),
    onDelete: () => {
      setMenuOpenId(null);
      setDeleteTarget({ id: report.id, title: report.title });
    },
    onSchedule: () => openSchedule(report),
  });

  return (
    <div className={cn('flex flex-col h-full w-full overflow-hidden bg-[var(--color-surface-0)]', className)}>
      {/* Page-level scroll — the whole panel scrolls, so the scrollbar sits at
          the panel edge rather than around an inner card box. */}
      <div className="flex-1 min-h-0 w-full overflow-y-auto hover-scroll">
        <div className={cn('mx-auto flex flex-col pb-[32px]', PAGE_COLUMN)}>
          {/* Header — title + view switch, then search, then source filters.
              Pinned (sticky) so controls stay reachable as the list grows. */}
          <div className={cn('sticky top-0 z-10 flex flex-col gap-[12px] pb-[12px] w-full bg-[var(--color-surface-0)]', pageHeaderPadTop(compact))}>
            <div className="flex items-center justify-between gap-[12px] min-h-[34px]">
              <h1
                className={cn(
                  'font-semibold text-[var(--color-ink)]',
                  compact ? 'text-[16px] leading-[24px]' : 'text-[24px] leading-[32px]',
                )}
                style={MANROPE}
              >
                {title}
              </h1>
              {/* Grid ⇄ list view switch. */}
              <ToggleGroup
                type="single"
                value={view}
                onValueChange={(v) => v && setView(v as ViewMode)}
                className="gap-0 rounded-[9px] border border-[var(--color-line-input)] p-[2px]"
              >
                <ToggleGroupItem
                  value="grid"
                  aria-label="Card view"
                  className="h-[32px] w-[36px] rounded-[7px] text-[var(--color-grey)] data-[state=on]:bg-[var(--color-surface-1)] data-[state=on]:text-[var(--color-ink)]"
                >
                  <LayoutGrid className="size-[20px]" />
                </ToggleGroupItem>
                <ToggleGroupItem
                  value="list"
                  aria-label="List view"
                  className="h-[32px] w-[36px] rounded-[7px] text-[var(--color-grey)] data-[state=on]:bg-[var(--color-surface-1)] data-[state=on]:text-[var(--color-ink)]"
                >
                  <List className="size-[20px]" />
                </ToggleGroupItem>
              </ToggleGroup>
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

            {/* Source filter chips. */}
            <div className="flex flex-wrap items-center gap-[8px]">
              {chips.map(({ key, label, icon: Icon, count }) => {
                const active = sourceFilter === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSourceFilter(key)}
                    // Chips ARE DS buttons — same variant recipe, not a lookalike:
                    // selected reads primary, the rest tertiary. Only the right
                    // padding is trimmed to sit closer to the count badge.
                    className={cn(
                      dsButtonVariants({ variant: active ? 'primary' : 'tertiary' }),
                      'pr-[10px]',
                    )}
                    style={MANROPE}
                  >
                    {Icon && <Icon className="size-[16px]" />}
                    {label}
                    <span
                      className={cn(
                        'inline-flex items-center justify-center min-w-[18px] h-[18px] px-[5px] rounded-full text-[11px] font-semibold',
                        active ? 'bg-white/20 text-white' : 'bg-[var(--color-surface-2)] text-[var(--btn-neutral)]',
                      )}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Body — card grid or table, driven by the view switch. */}
          <div className="pt-[12px]">
            {filtered.length === 0 ? (
              <div className="flex items-center justify-center w-full py-[48px]">
                <p className="text-[14px] text-[var(--color-grey-soft)]" style={MANROPE}>
                  No reports found
                </p>
              </div>
            ) : view === 'grid' ? (
              <div
                className={cn(
                  'grid gap-[16px]',
                  compact ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
                )}
              >
                {filtered.map((report) => (
                  <ReportCard key={report.id} {...rowProps(report)} />
                ))}
              </div>
            ) : (
              <div className="overflow-hidden rounded-[12px] border border-[var(--color-line-input)]">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="text-[12px] font-semibold text-[var(--color-grey)]" style={MANROPE}>Name</TableHead>
                      <TableHead className="hidden sm:table-cell text-[12px] font-semibold text-[var(--color-grey)]" style={MANROPE}>Source</TableHead>
                      <TableHead className="hidden md:table-cell text-[12px] font-semibold text-[var(--color-grey)]" style={MANROPE}>Type</TableHead>
                      <TableHead className="text-[12px] font-semibold text-[var(--color-grey)]" style={MANROPE}>Created</TableHead>
                      <TableHead className="w-[80px]" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((report) => (
                      <ReportRow key={report.id} {...rowProps(report)} />
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </div>
      </div>

      <DeleteChatDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title="Delete report?"
        fallbackName="this report"
        chatName={deleteTarget?.title}
        onConfirm={confirmDelete}
      />

      <ScheduleDialog
        open={scheduleOpen}
        onOpenChange={setScheduleOpen}
        reports={reports}
        onCreate={() => {}}
        prefill={schedulePrefill}
      />
    </div>
  );
};

export default ReportsPage;
