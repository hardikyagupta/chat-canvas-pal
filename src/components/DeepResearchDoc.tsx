import React, { useEffect, useState } from 'react';
import { FileText, Download, Maximize2 } from 'lucide-react';

/**
 * DeepResearchDoc — the finished deep-research report shown inline once the
 * plan card completes. It opens on a brief skeleton (the "generating the doc"
 * beat), then fades into a full-width document preview faded out at the bottom.
 * Tapping expand opens the report in the RHS artifact panel (via onExpand).
 */

const MANROPE = { fontFamily: 'Manrope, sans-serif' } as const;

interface DeepResearchDocProps {
  title: string;
  citations: number;
  summaryHeading?: string;
  /** Report paragraphs; may contain inline <strong> markup. */
  paragraphs: string[];
  /** How long the skeleton shows before the doc reveals, in ms. */
  skeletonMs?: number;
  onDownload?: () => void;
  /** Open the report in the RHS artifact panel. */
  onExpand?: () => void;
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

const DeepResearchDoc: React.FC<DeepResearchDocProps> = ({
  title,
  citations,
  summaryHeading = 'Executive summary',
  paragraphs,
  skeletonMs = 1200,
  onDownload,
  onExpand,
}) => {
  const [ready, setReady] = useState(false);

  // Skeleton → doc reveal.
  useEffect(() => {
    const t = setTimeout(() => setReady(true), skeletonMs);
    return () => clearTimeout(t);
  }, [skeletonMs]);

  if (!ready) return <DocSkeleton />;

  return (
    <div className="flex w-full flex-col gap-[12px] animate-in fade-in duration-500">
      <p className="text-[13px] leading-[18px] text-[var(--color-grey)]" style={MANROPE}>
        {citations} citations
      </p>

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
    </div>
  );
};

export default DeepResearchDoc;
