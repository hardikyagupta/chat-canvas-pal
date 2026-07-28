import React, { useMemo, useState } from 'react';
import { Search, MoreHorizontal, FileText, Download, Share2, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ReportItem } from '@/data/reports';
import {
  ActionMenu,
  ActionMenuTrigger,
  ActionMenuContent,
  ActionMenuItem,
} from '@/components/ui/action-menu';
import DeleteChatDialog from './DeleteChatDialog';

const MANROPE: React.CSSProperties = { fontFamily: 'Manrope, sans-serif' };

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

/**
 * A single report card: a faded doc-preview thumbnail (tap to open in the doc
 * previewer), a hover three-dot menu (Share / Delete), and a title + "Edited …"
 * meta row below.
 */
const ReportCard: React.FC<{
  report: ReportItem;
  menuOpen: boolean;
  onMenuOpenChange: (open: boolean) => void;
  onOpen: () => void;
  onDelete: () => void;
}> = ({ report, menuOpen, onMenuOpenChange, onOpen, onDelete }) => {
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
            <ActionMenuItem icon={Share2} onSelect={() => shareReport(report)}>
              Share
            </ActionMenuItem>
            <ActionMenuItem icon={Trash2} variant="danger" onSelect={onDelete}>
              Delete
            </ActionMenuItem>
          </ActionMenuContent>
        </ActionMenu>
      </div>

      {/* Meta row — title + type · edited time. */}
      <div className="flex items-start gap-[10px] px-[16px] py-[14px]">
        <div className="flex flex-1 min-w-0 flex-col gap-[2px]">
          <button
            type="button"
            onClick={onOpen}
            className="truncate text-left text-[15px] leading-[20px] font-semibold text-[var(--color-ink)]"
            style={MANROPE}
          >
            {report.title}
          </button>
          <span className="text-[13px] leading-[18px] text-[var(--color-grey)]" style={MANROPE}>
            {report.fileType} · Edited {report.time} ago
          </span>
        </div>
        {/* Quick download affordance (always visible, alongside the menu). */}
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

/**
 * Full-page grid of generated reports (PDFs / Docs). A sticky header (title +
 * search) sits above a responsive card grid. Each card previews the document,
 * opens it in the doc previewer on tap, and offers Download / Bookmark / Delete.
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
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);

  const confirmDelete = () => {
    if (deleteTarget) setDeletedIds((prev) => new Set(prev).add(deleteTarget.id));
    setDeleteTarget(null);
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return reports
      .filter((r) => !deletedIds.has(r.id))
      .filter((r) => !q || r.title.toLowerCase().includes(q));
  }, [reports, query, deletedIds]);

  return (
    <div className={cn('flex flex-col h-full w-full overflow-hidden bg-[var(--color-surface-0)]', className)}>
      <div className="mx-auto flex flex-col min-h-0 w-full max-w-[820px] flex-1 px-[20px]">
        {/* Sticky header — title, then search. */}
        <div className={cn('flex flex-col gap-[16px] pb-[12px] w-full shrink-0', compact ? 'pt-[12px]' : 'pt-[8px]')}>
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

        {/* Scrollable card grid. */}
        <div className="flex-1 min-h-0 overflow-y-auto w-full pt-[12px] pb-[32px] hover-scroll">
          {filtered.length === 0 ? (
            <div className="flex items-center justify-center w-full py-[48px]">
              <p className="text-[14px] text-[var(--color-grey-soft)]" style={MANROPE}>
                No reports found
              </p>
            </div>
          ) : (
            <div
              className={cn(
                'grid gap-[16px]',
                compact ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
              )}
            >
              {filtered.map((report) => (
                <ReportCard
                  key={report.id}
                  report={report}
                  menuOpen={menuOpenId === report.id}
                  onMenuOpenChange={(o) => setMenuOpenId(o ? report.id : null)}
                  onOpen={() => onSelectReport?.(report)}
                  onDelete={() => {
                    setMenuOpenId(null);
                    setDeleteTarget({ id: report.id, title: report.title });
                  }}
                />
              ))}
            </div>
          )}
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
    </div>
  );
};

export default ReportsPage;
