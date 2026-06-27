import React from 'react';
import { cn } from '@/lib/utils';

interface EngagementScoreProps {
  score: number;
  className?: string;
  showLabel?: boolean;
}

export function EngagementScore({ 
  score, 
  className, 
  showLabel = true 
}: EngagementScoreProps) {
  
  // Calculate the progress arc path
  const radius = 5; // Inner circle radius
  const centerX = 9;
  const centerY = 9;
  const circumference = 2 * Math.PI * radius;
  const progress = score / 100;
  const angle = progress * 2 * Math.PI - Math.PI / 2; // Start from top
  
  const endX = centerX + radius * Math.cos(angle);
  const endY = centerY + radius * Math.sin(angle);
  const largeArcFlag = progress > 0.5 ? 1 : 0;
  
  const progressPath = `M ${centerX} ${centerY - radius} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX} ${endY}`;

  return (
    <div className={cn("inline-flex items-center gap-2", className)}>
      {/* Circular progress indicator with Figma design */}
      <div className="w-[18px] h-[18px] relative">
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Outer dotted circle */}
          <path 
            d="M9 17C4.58172 17 1 13.4183 1 9C1 4.58172 4.58172 1 9 1C13.4183 1 17 4.58172 17 9C17 13.4183 13.4183 17 9 17Z" 
            stroke="#DDE2EE" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeDasharray="0 3"
          />
          {/* Inner circle outline */}
          <path 
            d="M14 9C14 6.23858 11.7614 4 9 4C6.23858 4 4 6.23858 4 9C4 11.7614 6.23858 14 9 14C11.7614 14 14 11.7614 14 9Z" 
            stroke="#DDE2EE" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          />
          {/* Progress arc with shadow */}
          <g filter="url(#filter0_d_10214_8281)">
            <path 
              d={progressPath}
              stroke={score >= 70 ? '#00C48C' : '#E7B231'}
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            />
          </g>
          <defs>
            <filter id="filter0_d_10214_8281" x="2" y="2" width="14" height="14" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
              <feFlood floodOpacity="0" result="BackgroundImageFix"/>
              <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
              <feOffset/>
              <feGaussianBlur stdDeviation="0.5"/>
              <feComposite in2="hardAlpha" operator="out"/>
              <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"/>
              <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_10214_8281"/>
              <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_10214_8281" result="shape"/>
            </filter>
          </defs>
        </svg>
      </div>
      
      {/* Score percentage and label */}
      <div className="flex items-center gap-1">
        <div 
          className="text-xs font-bold font-['Manrope'] leading-none"
          style={{ color: score >= 70 ? '#00C48C' : '#E7B231' }}
        >
          {score}%
        </div>
        {showLabel && (
          <div className="text-slate-900 dark:text-white text-[10px] font-normal font-['Manrope'] leading-none">
            Engagement score
          </div>
        )}
      </div>
    </div>
  );
}
