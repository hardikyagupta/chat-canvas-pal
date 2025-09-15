import React, { useState } from "react";
import { Button } from "@/components/ui/button";

interface ContentAgentRationaleProps {
  onContinue: () => void;
  onRefineThis: () => void;
}

export function ContentAgentRationale({ onContinue, onRefineThis }: ContentAgentRationaleProps) {
  const [clicked, setClicked] = useState(false);
  const [refinedClicked, setRefinedClicked] = useState(false);

  function handleContinue() {
    setClicked(true);
    onContinue();
  }

  function handleRefineThis() {
    setRefinedClicked(true);
    onRefineThis();
  }

  return (
    <div className="space-y-3 text-sm">
      <p>
        Here's the creative play I'm proposing to maximise Valentine's buzz:
      </p>
      <ul className="list-disc pl-5 space-y-1">
        <li>Lead with an emotive hero story, then personalise hooks for each segment.</li>
        <li>A/B playful vs. luxury tone in subject lines and push titles based on affinity.</li>
        <li>Sequence touch-points over seven days: tease ➜ reveal ➜ last-chance urgency.</li>
      </ul>
      <p className="font-medium">
        Does this direction resonate?
      </p>
      {!clicked && !refinedClicked && (
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleContinue}
            className="h-auto px-2 py-1 text-xs text-blue-700 hover:text-blue-700 hover:bg-blue-100 dark:text-white dark:hover:text-blue-400 dark:hover:bg-muted border border-blue-200 dark:border-muted-foreground/30 flex items-center"
          >
            Continue
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefineThis}
            className="h-auto px-2 py-1 text-xs text-blue-700 hover:text-blue-700 hover:bg-blue-100 dark:text-white dark:hover:text-blue-400 dark:hover:bg-muted border border-blue-200 dark:border-muted-foreground/30 flex items-center"
          >
            Refine this
          </Button>
        </div>
      )}
    </div>
  );
} 