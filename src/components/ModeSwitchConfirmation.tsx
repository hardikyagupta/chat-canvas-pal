import React from 'react';
import { Button } from "@/components/ui/button";

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
          className="relative bg-white shadow-[0px_5px_10px_rgba(23,23,58,0.05)] rounded-[5px] p-8"
          style={{ width: '620px' }}
        >
          {/* Content Container */}
          <div className="flex flex-col">
            {/* Title */}
            <h2 
              className="font-['Nunito_Sans'] font-bold text-xl leading-7 text-[#17173A] mb-4"
              style={{ letterSpacing: '0.416667px' }}
            >
              Are you sure you want to switch to {modeDisplayName} mode?
            </h2>
            
            {/* Content Body */}
            <p 
              className="font-['Nunito_Sans'] font-normal text-sm leading-5 text-[#17173A] mb-8"
              style={{ letterSpacing: '0.42px' }}
            >
              A new conversation will be created. The current conversation will be saved in chat history and can be accessed from there to resume.
            </p>
            
            {/* Buttons */}
            <div className="flex flex-row gap-5 justify-end">
              {/* Cancel Button */}
              <Button
                onClick={onCancel}
                className="px-[18px] py-2 h-9 bg-white border-[1.5px] border-[#143F93] rounded-[4px] font-['Nunito_Sans'] font-semibold text-sm leading-5 uppercase text-[#143F93] hover:bg-white hover:text-[#143F93] hover:border-[#143F93]"
                style={{ letterSpacing: '0.42px' }}
                variant="outline"
              >
                CANCEL
              </Button>
              
              {/* Confirm Button */}
              <Button
                onClick={onConfirm}
                className="px-[18px] py-2 h-9 bg-[#143F93] rounded-[4px] font-['Nunito_Sans'] font-semibold text-sm leading-5 uppercase text-white hover:bg-[#0f2d70] hover:text-white"
                style={{ letterSpacing: '0.42px' }}
              >
                SWITCH MODE
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}; 