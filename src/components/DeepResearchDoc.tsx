import React, { useEffect, useState } from 'react';
import { Calendar, Check, Copy, Download, FileText, Maximize2, ThumbsDown, ThumbsUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

/**
 * DeepResearchDoc — the finished deep-research report shown inline once the
 * plan card completes. It opens on a brief skeleton (the "generating the doc"
 * beat), then fades into a full-width document preview faded out at the bottom.
 * Tapping expand opens the report in the RHS artifact panel (via onExpand).
 */

const MANROPE = { fontFamily: 'Manrope, sans-serif' } as const;

interface DeepResearchDocProps {
  title: string;
  /** Citation count; the label is hidden when 0 or omitted. */
  citations?: number;
  summaryHeading?: string;
  /** Report paragraphs; may contain inline <strong> markup. */
  paragraphs: string[];
  /** How long the skeleton shows before the doc reveals, in ms. */
  skeletonMs?: number;
  onDownload?: () => void;
  /** Open the report in the RHS artifact panel. */
  onExpand?: () => void;
  /** Show copy + thumbs feedback below the doc (ChatGPT-style). */
  showFeedback?: boolean;
  onThumbsUp?: () => void;
  onThumbsDown?: () => void;
  /** Show a create-schedule CTA below the doc card. */
  showCreateSchedule?: boolean;
  onCreateSchedule?: () => void;
}

export const DocBody: React.FC<Pick<DeepResearchDocProps, 'title' | 'summaryHeading' | 'paragraphs'>> = ({
  title,
  summaryHeading = 'Executive summary',
  paragraphs,
}) => (
  <>
    <h1 className="text-[28px] leading-[36px] font-bold text-[var(--color-ink)]" style={MANROPE}>
      {title}
    </h1>
    <h2 className="mt-[24px] text-[18px] leading-[26px] font-semibold text-[var(--color-ink)]" style={MANROPE}>
      {summaryHeading}
    </h2>
    <div className="mt-[12px] flex flex-col gap-[16px]">
      {paragraphs.map((p, i) => (
        <p
          key={i}
          className="text-[15px] leading-[26px] text-[var(--color-ink)] [&_strong]:font-semibold"
          style={MANROPE}
          dangerouslySetInnerHTML={{ __html: p }}
        />
      ))}
    </div>
  </>
);

// The "generating the doc" placeholder shown before the report reveals.
const DocSkeleton: React.FC = () => (
  <div className="flex w-full flex-col gap-[12px]">
    <div className="h-[14px] w-[84px] animate-pulse rounded-full bg-[var(--color-line)]" />
    <div className="w-full overflow-hidden rounded-[16px] border border-[var(--color-line-input)] bg-card">
      <div className="flex items-center gap-[10px] border-b-[0.5px] border-[var(--color-line-input)] px-[16px] py-[12px]">
        <div className="size-[28px] shrink-0 animate-pulse rounded-[8px] bg-[var(--color-line)]" />
        <div className="h-[16px] w-[220px] animate-pulse rounded-full bg-[var(--color-line)]" />
      </div>
      <div className="flex flex-col gap-[14px] px-[24px] pb-[40px] pt-[24px]">
        <div className="h-[28px] w-[52%] animate-pulse rounded-[6px] bg-[var(--color-line)]" />
        <div className="mt-[8px] h-[18px] w-[34%] animate-pulse rounded-[6px] bg-[var(--color-line)]" />
        {[100, 96, 92, 88, 70].map((w, i) => (
          <div
            key={i}
            className="h-[12px] animate-pulse rounded-full bg-[var(--color-line)]"
            style={{ width: `${w}%` }}
          />
        ))}
      </div>
    </div>
  </div>
);

function stripHtml(html: string) {
  return html.replace(/<[^>]+>/g, '');
}

function DocFeedbackRow({
  copyText,
  onThumbsUp,
  onThumbsDown,
}: {
  copyText: string;
  onThumbsUp?: () => void;
  onThumbsDown?: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const [copyTipOpen, setCopyTipOpen] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(copyText);
      setCopied(true);
      setCopyTipOpen(true);
      window.setTimeout(() => {
        setCopied(false);
        setCopyTipOpen(false);
      }, 1600);
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <div className="flex w-full justify-start border-t border-[var(--color-line)] pt-3">
      <div className="flex items-center gap-1 text-[var(--color-grey-soft)]">
        <TooltipProvider delayDuration={200}>
          <Tooltip open={copyTipOpen} onOpenChange={(open) => { if (!copied) setCopyTipOpen(open); }}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-auto rounded-md p-2 hover:bg-muted hover:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0"
                onClick={handleCopy}
                aria-label={copied ? 'Copied' : 'Copy'}
              >
                <span className="relative inline-flex h-3.5 w-3.5 items-center justify-center">
                  <Copy
                    className={cn(
                      'absolute h-3.5 w-3.5 transition-all duration-200 ease-out',
                      copied ? 'scale-50 opacity-0' : 'scale-100 opacity-100'
                    )}
                  />
                  <Check
                    className={cn(
                      'absolute h-3.5 w-3.5 text-[var(--color-success)] transition-all duration-200 ease-out',
                      copied ? 'scale-100 opacity-100' : 'scale-50 opacity-0'
                    )}
                  />
                </span>
              </Button>
            </TooltipTrigger>
            <TooltipContent
              side="top"
              className="border-0 bg-foreground px-[8px] py-[4px] text-background"
              style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 500 }}
            >
              <span className="text-[12px] leading-[16px]">{copied ? 'Copied!' : 'Copy'}</span>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={onThumbsUp}
                className="h-auto rounded-md p-2 hover:bg-[color-mix(in_oklab,var(--color-success)_10%,transparent)] hover:text-[var(--color-success)] focus-visible:ring-0 focus-visible:ring-offset-0"
                aria-label="Good response"
              >
                <ThumbsUp className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent
              side="top"
              className="border-0 bg-foreground px-[8px] py-[4px] text-[12px] leading-[16px] text-background"
              style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 500 }}
            >
              Good response
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={onThumbsDown}
                className="h-auto rounded-md p-2 hover:bg-destructive/10 hover:text-destructive focus-visible:ring-0 focus-visible:ring-offset-0"
                aria-label="Bad response"
              >
                <ThumbsDown className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent
              side="top"
              className="border-0 bg-foreground px-[8px] py-[4px] text-[12px] leading-[16px] text-background"
              style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 500 }}
            >
              Bad response
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
}

const DeepResearchDoc: React.FC<DeepResearchDocProps> = ({
  title,
  citations,
  summaryHeading = 'Executive summary',
  paragraphs,
  skeletonMs = 1200,
  onDownload,
  onExpand,
  showFeedback = false,
  onThumbsUp,
  onThumbsDown,
  showCreateSchedule = false,
  onCreateSchedule,
}) => {
  const [ready, setReady] = useState(false);

  // Skeleton → doc reveal.
  useEffect(() => {
    const t = setTimeout(() => setReady(true), skeletonMs);
    return () => clearTimeout(t);
  }, [skeletonMs]);

  if (!ready) return <DocSkeleton />;

  const copyText = [
    title,
    '',
    summaryHeading,
    '',
    ...paragraphs.map(stripHtml),
  ].join('\n');

  return (
    <div className="flex w-full flex-col gap-[12px] animate-in fade-in duration-500">
      {typeof citations === 'number' && citations > 0 && (
        <p className="text-[13px] leading-[18px] text-[var(--color-grey)]" style={MANROPE}>
          {citations} citations
        </p>
      )}

      <div className="w-full overflow-hidden rounded-[16px] border border-[var(--color-line-input)] bg-card">
        {/* Header — doc icon · title · download · expand */}
        <div className="flex items-center gap-[10px] border-b-[0.5px] border-[var(--color-line-input)] px-[16px] py-[12px]">
          <span className="flex size-[28px] shrink-0 items-center justify-center rounded-[8px] bg-[var(--color-royal)]">
            <FileText className="size-[16px] text-white" strokeWidth={2} />
          </span>
          <p className="min-w-0 flex-1 truncate text-[15px] leading-[22px] font-medium text-[var(--color-ink)]" style={MANROPE}>
            {title}
          </p>
          <button
            type="button"
            onClick={onDownload}
            aria-label="Download report"
            className="flex size-[32px] shrink-0 items-center justify-center rounded-[8px] text-[var(--color-grey)] transition-colors hover:bg-[var(--color-surface-0)] hover:text-[var(--color-ink)]"
          >
            <Download className="size-[18px]" strokeWidth={1.75} />
          </button>
          <button
            type="button"
            onClick={() => onExpand?.()}
            aria-label="Expand report"
            className="flex size-[32px] shrink-0 items-center justify-center rounded-[8px] text-[var(--color-grey)] transition-colors hover:bg-[var(--color-surface-0)] hover:text-[var(--color-ink)]"
          >
            <Maximize2 className="size-[18px]" strokeWidth={1.75} />
          </button>
        </div>

        {/* Body — rendered report, faded out at the bottom to read as a preview. */}
        <div className="relative">
          <div className="max-h-[460px] overflow-hidden px-[24px] pb-[48px] pt-[24px]">
            <DocBody title={title} summaryHeading={summaryHeading} paragraphs={paragraphs} />
          </div>
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0 h-[96px] bg-gradient-to-t from-card to-transparent"
          />
        </div>
      </div>

      {showCreateSchedule ? (
        <button
          type="button"
          onClick={onCreateSchedule}
          className="inline-flex h-[36px] w-fit items-center gap-[8px] rounded-[8px] border border-[var(--color-line-input)] bg-card px-[12px] text-[13px] font-medium text-[var(--color-ink)] transition-colors hover:bg-[var(--color-surface-0)]"
          style={MANROPE}
        >
          <Calendar className="size-[15px] text-[var(--color-royal)]" strokeWidth={1.75} />
          Create schedule
        </button>
      ) : null}

      {showFeedback ? (
        <DocFeedbackRow
          copyText={copyText}
          onThumbsUp={onThumbsUp}
          onThumbsDown={onThumbsDown}
        />
      ) : null}
    </div>
  );
};

export default DeepResearchDoc;
