import React from 'react';
import { Button } from "@/components/ui/button";
import { DsButton } from '@/components/ui/ds-button';

interface ModeSwitchConfirmationProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  targetMode: 'collaborative' | 'autonomous';
}

export const ModeSwitchConfirmation: React.FC<ModeSwitchConfirmationProps> = ({
  isOpen,
  onConfirm,
  onCancel,
  targetMode
}) => {
  if (!isOpen) return null;

  const modeDisplayName = targetMode === 'collaborative' ? 'execution' : 'plan';

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/20 z-[60] flex items-center justify-center">
        {/* Popup Container - Following Figma specs */}
        <div 
          className="relative bg-card shadow-[0px_5px_10px_oklch(0.227_0.066_279.78_/_0.05)] rounded-[5px] p-8"
          style={{ width: '620px' }}
        >
          {/* Content Container */}
          <div className="flex flex-col">
            {/* Title */}
            <h2 
              className="font-['Manrope'] font-bold text-xl leading-7 text-[var(--color-ink)] mb-4"
              style={{ letterSpacing: '0.416667px' }}
            >
              Are you sure you want to switch to {modeDisplayName} mode?
            </h2>
            
            {/* Content Body */}
            <p 
              className="font-['Manrope'] font-normal text-sm leading-5 text-[var(--color-ink)] mb-8"
              style={{ letterSpacing: '0.42px' }}
            >
              A new conversation will be created. The current conversation will be saved in chat history and can be accessed from there to resume.
            </p>
            
            {/* Buttons */}
            <div className="flex flex-row gap-5 justify-end">
              <DsButton variant="secondary" onClick={onCancel}>Cancel</DsButton>
              <DsButton onClick={onConfirm}>Switch mode</DsButton>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}; 