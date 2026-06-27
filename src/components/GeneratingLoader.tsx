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

const GeneratingLoader: React.FC = () => {
  const [labelIndex, setLabelIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setLabelIndex((prev) => (prev + 1) % loaderLabels.length);
    }, 1500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex justify-start w-full">
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 shrink-0 overflow-hidden flex items-center justify-center" aria-hidden="true">
          <img
            src="/thinking-loader.gif"
            alt=""
            className="w-6 h-6 pointer-events-none"
          />
        </div>
        <span className="text-sm thinking-shimmer-gradient">
          {loaderLabels[labelIndex]}
        </span>
      </div>
    </div>
  );
};

export default GeneratingLoader;
