import React, { useState, useEffect } from 'react';

const loaderLabels = [
  'Starting to roll...',
  'Crunching the numbers...',
  'Analyzing channels...',
  'Compiling insights...',
  'Building your dashboard...',
  'Almost there...',
  'Finalizing results...',
];

// `pill`: floating white pill (rounded, grey outline, shadow) — used in the
// collapse view as a "still loading" nudge centered above the input field.
const GeneratingLoader: React.FC<{ pill?: boolean }> = ({ pill = false }) => {
  const [labelIndex, setLabelIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setLabelIndex((prev) => (prev + 1) % loaderLabels.length);
    }, 1500);

    return () => clearInterval(interval);
  }, []);

  const content = (
    <>
      <div className="w-6 h-6 shrink-0 overflow-hidden flex items-center justify-center" aria-hidden="true">
        <img
          src="/thinking-loader.gif"
          alt=""
          className="w-6 h-6 pointer-events-none"
        />
      </div>
      <span className="text-sm thinking-shimmer-gradient whitespace-nowrap">
        {loaderLabels[labelIndex]}
      </span>
    </>
  );

  if (pill) {
    return (
      <div className="inline-flex items-center gap-2 rounded-full border border-[var(--color-line)] bg-card pl-[8px] pr-[14px] py-[6px] shadow-[0_8px_20px_-6px_oklch(0.21_0.034_263.436_/_0.22)]">
        {content}
      </div>
    );
  }

  return (
    <div className="flex justify-start w-full">
      <div className="flex items-center gap-2">{content}</div>
    </div>
  );
};

export default GeneratingLoader;
