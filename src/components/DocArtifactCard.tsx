import React from 'react';
import { FileText, Bookmark } from 'lucide-react';

export interface DocArtifact {
  title: string;
  subtitle?: string; // e.g. "WhatsApp Document"
  intro?: string;    // optional line shown above the card
}

interface DocArtifactCardProps {
  artifact: DocArtifact;
  onDownload?: () => void;
  onPreview?: () => void;
}

const MANROPE = { fontFamily: 'Manrope, sans-serif' } as const;

const DocArtifactCard: React.FC<DocArtifactCardProps> = ({ artifact, onDownload, onPreview }) => {
  return (
    <div className="flex flex-col gap-[16px] items-start w-full">
      {artifact.intro && (
        <p
          className="text-[14px] leading-[22px] text-[var(--color-ink)] w-full"
          style={{ ...MANROPE, fontWeight: 400 }}
        >
          {artifact.intro}
        </p>
      )}

      {/* Card — fixed 366px per Figma (shrinks on narrower widths, never fills) */}
      <div className="w-full max-w-[366px] bg-card border border-[var(--color-line-input)] rounded-[16px] overflow-hidden">
        {/* Header row: file icon · title/subtitle · bookmark */}
        <div className="flex items-center gap-[8px] px-[12px] py-[6px] w-full border-b-[0.5px] border-[var(--color-line-input)]">
          <div className="flex items-center justify-center size-[32px] shrink-0">
            <FileText className="size-[20px] text-[var(--color-ink)]" strokeWidth={1.5} />
          </div>
          <div className="flex flex-1 min-w-0 flex-col items-start">
            <p
              className="text-[14px] leading-[20px] font-medium text-[var(--color-ink)] w-full truncate"
              style={MANROPE}
            >
              {artifact.title}
            </p>
            {artifact.subtitle && (
              <p
                className="text-[12px] leading-[18px] font-normal text-[var(--color-grey)] w-full truncate"
                style={MANROPE}
              >
                {artifact.subtitle}
              </p>
            )}
          </div>
          <button
            type="button"
            aria-label="Bookmark"
            className="flex items-center justify-center p-[6px] rounded-[8px] shrink-0 hover:bg-[var(--color-surface-1)] transition-colors"
          >
            <Bookmark className="size-[18px] text-[var(--color-grey)]" strokeWidth={1.5} />
          </button>
        </div>

        {/* Actions row: Download + Preview, side by side and full width */}
        <div className="flex gap-[8px] items-center px-[16px] py-[12px] w-full">
          <button
            type="button"
            onClick={onDownload}
            className="flex flex-1 items-center justify-center px-[12px] py-[6px] rounded-[6px] border-[0.75px] border-[var(--color-line-strong)] bg-card shadow-[0px_1px_0px_0px_oklch(0_0_0_/_0.02)] hover:bg-[var(--color-surface-0)] transition-colors"
          >
            <span className="text-[14px] leading-[20px] text-[var(--color-ink)]" style={{ ...MANROPE, fontWeight: 400 }}>
              Download
            </span>
          </button>
          <button
            type="button"
            onClick={onPreview}
            className="relative flex flex-1 items-center justify-center px-[12px] py-[6px] rounded-[8px] bg-foreground overflow-hidden hover:bg-foreground/90 transition-colors"
          >
            {/* button shine */}
            <span
              aria-hidden
              className="absolute inset-0 rounded-[8px] pointer-events-none"
              style={{ background: 'linear-gradient(to bottom, oklch(1 0 0 / 0.07) 82%, oklch(1 0 0 / 0.15) 94%)' }}
            />
            <span className="relative z-10 text-[14px] leading-[20px] font-medium text-background" style={MANROPE}>
              Preview
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default DocArtifactCard;
