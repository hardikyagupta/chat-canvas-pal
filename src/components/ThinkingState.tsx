import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Brain } from 'lucide-react';

interface ThinkingStateProps {
  onComplete?: () => void;
  thinkingDuration?: number; // in seconds
  reasoningSteps?: string[]; // custom reasoning text
}

export const ThinkingState: React.FC<ThinkingStateProps> = ({
  onComplete,
  thinkingDuration = 3,
  reasoningSteps
}) => {
  const [isThinking, setIsThinking] = useState(true);
  const [showText, setShowText] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);

  // Default reasoning steps if none provided
  const defaultReasoningSteps = [
    "Analyzing past campaign performance data across different customer segments",
    "Identifying high-value customer archetypes based on purchase history and engagement patterns",
    "Evaluating CLV and profitability metrics for each segment",
    "Cross-referencing behavioral data with product category preferences",
    "Calculating optimal discount structures for maximum profitability"
  ];

  const thinkingRationale = reasoningSteps || defaultReasoningSteps;

  // Show text after a short delay (after dots appear)
  useEffect(() => {
    const textTimer = setTimeout(() => {
      setShowText(true);
    }, 500); // Show text 500ms after dots

    return () => clearTimeout(textTimer);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedTime(prev => {
        const newTime = prev + 0.1;
        if (newTime >= thinkingDuration) {
          clearInterval(interval);
          setIsThinking(false);
          if (onComplete) {
            onComplete();
          }
          return thinkingDuration;
        }
        return newTime;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [thinkingDuration, onComplete]);

  return (
    <div className="flex justify-start w-full py-2">
      {/* Thinking Content - Left Aligned */}
      <div className="max-w-[75%] flex flex-col items-start">
        {/* Thinking Phase (Active) */}
        {isThinking && (
          <div className="flex items-center gap-3">
            {/* Three bouncing dots - smaller size */}
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms', animationDuration: '1s' }}></div>
              <div className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms', animationDuration: '1s' }}></div>
              <div className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms', animationDuration: '1s' }}></div>
            </div>
            
            {/* Thinking text with shimmer - appears after dots */}
            {showText && (
              <span className="text-sm thinking-shimmer-gradient">
                Thinking...
              </span>
            )}
          </div>
        )}
        
        {/* Completed Phase (Collapsible Summary) */}
        {!isThinking && (
          <div className="w-full min-w-[300px]">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-2 text-left hover:opacity-80 transition-opacity"
              aria-expanded={isExpanded}
              aria-label={isExpanded ? "Collapse thinking details" : "Expand thinking details"}
            >
              <Brain className="w-4 h-4 text-[#6f6f8d] flex-shrink-0" />
              <span className="text-sm font-semibold text-[#6f6f8d] leading-[20px] tracking-[0.42px]">
                Thought for {thinkingDuration.toFixed(0)} second{thinkingDuration !== 1 ? 's' : ''}
              </span>
              {isExpanded ? (
                <ChevronUp className="w-4 h-4 text-[#6f6f8d] transition-transform duration-200 ml-auto" />
              ) : (
                <ChevronDown className="w-4 h-4 text-[#6f6f8d] transition-transform duration-200 ml-auto" />
              )}
            </button>
            
            {/* Expanded Content */}
            {isExpanded && (
              <div className="mt-3 animate-in slide-in-from-top-2 duration-200">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Let me think about this problem step by step. {thinkingRationale.join('. ')}.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};








