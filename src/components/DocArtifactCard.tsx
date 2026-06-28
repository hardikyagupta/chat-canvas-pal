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
          className="text-[14px] leading-[22px] text-[#17173A] w-full"
          style={{ ...MANROPE, fontWeight: 400 }}
        >
          {artifact.intro}
        </p>
      )}

      {/* Card — fixed 366px per Figma (shrinks on narrower widths, never fills) */}
      <div className="w-full max-w-[366px] bg-white border border-[#DDE2EE] rounded-[16px] overflow-hidden">
        {/* Header row: file icon · title/subtitle · bookmark */}
        <div className="flex items-center gap-[8px] px-[12px] py-[6px] w-full border-b-[0.5px] border-[#DDE2EE]">
          <div className="flex items-center justify-center size-[32px] shrink-0">
            <FileText className="size-[20px] text-[#17173A]" strokeWidth={1.5} />
          </div>
          <div className="flex flex-1 min-w-0 flex-col items-start">
            <p
              className="text-[14px] leading-[20px] font-medium text-[#17173A] w-full truncate"
              style={MANROPE}
            >
              {artifact.title}
            </p>
            {artifact.subtitle && (
              <p
                className="text-[12px] leading-[18px] font-normal text-[#6F6F8D] w-full truncate"
                style={MANROPE}
              >
                {artifact.subtitle}
              </p>
            )}
          </div>
          <button
            type="button"
            aria-label="Bookmark"
            className="flex items-center justify-center p-[6px] rounded-[8px] shrink-0 hover:bg-[#F2F4F7] transition-colors"
          >
            <Bookmark className="size-[18px] text-[#6F6F8D]" strokeWidth={1.5} />
          </button>
        </div>

        {/* Actions row: Download + Preview, side by side and full width */}
        <div className="flex gap-[8px] items-center px-[16px] py-[12px] w-full">
          <button
            type="button"
            onClick={onDownload}
            className="flex flex-1 items-center justify-center px-[12px] py-[6px] rounded-[6px] border-[0.75px] border-[#D4D4D4] bg-white shadow-[0px_1px_0px_0px_rgba(0,0,0,0.02)] hover:bg-[#F9FAFB] transition-colors"
          >
            <span className="text-[14px] leading-[20px] text-[#17173A]" style={{ ...MANROPE, fontWeight: 400 }}>
              Download
            </span>
          </button>
          <button
            type="button"
            onClick={onPreview}
            className="relative flex flex-1 items-center justify-center px-[12px] py-[6px] rounded-[8px] bg-[#3D3D3D] overflow-hidden hover:bg-[#2d2d2d] transition-colors"
          >
            {/* button shine */}
            <span
              aria-hidden
              className="absolute inset-0 rounded-[8px] pointer-events-none"
              style={{ background: 'linear-gradient(to bottom, rgba(255,255,255,0.07) 82%, rgba(255,255,255,0.15) 94%)' }}
            />
            <span className="relative z-10 text-[14px] leading-[20px] font-medium text-white" style={MANROPE}>
              Preview
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default DocArtifactCard;
