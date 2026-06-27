import React from 'react';
import { FileText } from 'lucide-react';

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

const DocArtifactCard: React.FC<DocArtifactCardProps> = ({ artifact, onDownload, onPreview }) => {
  return (
    <div className="flex flex-col gap-[16px] items-start w-full">
      {artifact.intro && (
        <p
          className="text-[14px] leading-[22px] text-[#17173A] w-full"
          style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 400 }}
        >
          {artifact.intro}
        </p>
      )}

      {/* Document card */}
      <div className="flex items-center bg-white border border-[#E5E7EB] rounded-[8px] px-[16px] py-[8px] w-full">
        <div className="flex flex-1 min-w-0 gap-[8px] items-center">
          <div className="flex items-center justify-center size-[32px] shrink-0 rounded-[6px] bg-[#F2F4F7]">
            <FileText className="size-[18px] text-[#6F6F8D]" />
          </div>
          <div className="flex flex-1 min-w-0 flex-col items-start">
            <p
              className="text-[14px] leading-[20px] text-[#17173A] w-full truncate"
              style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 500 }}
            >
              {artifact.title}
            </p>
            {artifact.subtitle && (
              <p
                className="text-[12px] leading-[18px] text-[#6F6F8D] w-full truncate"
                style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 400 }}
              >
                {artifact.subtitle}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Actions: Download + Preview */}
      <div className="flex gap-[16px] items-center">
        <button
          type="button"
          onClick={onDownload}
          className="flex items-center justify-center bg-white px-[12px] py-[6px] rounded-[8px] shadow-[inset_0px_-1px_0px_0px_#BDBDBD,inset_-1px_0px_0px_0px_#DCDCDC,inset_1px_0px_0px_0px_#DCDCDC,inset_0px_1px_0px_0px_#DCDCDC] hover:bg-[#F9FAFB] transition-colors"
        >
          <span
            className="text-[14px] leading-[20px] text-[#3D3D3D]"
            style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 500 }}
          >
            Download
          </span>
        </button>
        <button
          type="button"
          onClick={onPreview}
          className="relative flex items-center justify-center bg-[#3D3D3D] px-[12px] py-[6px] rounded-[8px] overflow-hidden hover:bg-[#2d2d2d] transition-colors"
        >
          {/* button shine */}
          <span
            aria-hidden
            className="absolute inset-0 rounded-[8px] pointer-events-none"
            style={{ background: 'linear-gradient(to bottom, rgba(255,255,255,0.07) 82%, rgba(255,255,255,0.15) 94%)' }}
          />
          <span
            className="relative z-10 text-[14px] leading-[20px] text-white"
            style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 500 }}
          >
            Preview
          </span>
        </button>
      </div>
    </div>
  );
};

export default DocArtifactCard;
