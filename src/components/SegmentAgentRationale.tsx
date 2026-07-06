import React, { useState } from 'react';
import { Button } from "@/components/ui/button";

interface SegmentAgentRationaleProps {
  onContinue: () => void;
}

export function SegmentAgentRationale({ onContinue }: SegmentAgentRationaleProps) {
  const [isClicked, setIsClicked] = useState(false);

  const handleContinue = () => {
    setIsClicked(true);
    onContinue();
  };
  return (
    <div className="space-y-4">
      <div className="space-y-3 text-sm">
        <p>
          To keep messaging razor-focused, I've divided the audience into four micro-segments:
        </p>
        
        <div className="space-y-1 pl-4">
          <ul className="list-disc pl-4 space-y-1">
            <li><strong>High-Value Loyalists:</strong> repeat premium buyers we'll reward with exclusives.</li>
            <li><strong>Affinity Browsers:</strong> beauty explorers showing fragrance interest.</li>
            <li><strong>Seasonal Shoppers:</strong> holiday-driven customers to spark nostalgia.</li>
            <li><strong>New High-Intent:</strong> fresh prospects with strong purchase signals.</li>
          </ul>
        </div>

        <p className="font-medium">
          Shall we lock this segmentation and move on?
        </p>
        {!isClicked && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleContinue}
            className="h-auto px-2 py-1 text-xs text-royal hover:text-royal hover:bg-royal-pale border border-royal-pale flex items-center"
          >
            Continue
          </Button>
        )}
      </div>
    </div>
  );
} 