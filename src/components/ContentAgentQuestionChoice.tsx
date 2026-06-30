import React from 'react';

interface ContentAgentQuestionChoiceProps {
  // No props needed since buttons are handled outside
}

export function ContentAgentQuestionChoice({}: ContentAgentQuestionChoiceProps) {
  return (
    <div>
      <p className="text-sm text-[var(--color-ink)] dark:text-white leading-normal font-['Manrope']">
        Great! Now onto content. How would you like to continue: answer a few detailed questions for more tailored content, or skip and get a quick draft?
      </p>
    </div>
  );
}
