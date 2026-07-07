import React, { useEffect, useState } from 'react';

interface RotatingWordProps {
  words: string[];
  holdMs?: number; // how long each word stays before the next fades in
  className?: string;
}

/**
 * Cycles a list of words with a simple fade reveal — each new word fades in as a
 * whole (with a subtle rise), replacing the previous per-letter roll animation.
 */
const RotatingWord: React.FC<RotatingWordProps> = ({ words, holdMs = 2400, className }) => {
  const [i, setI] = useState(0);

  useEffect(() => {
    if (words.length <= 1) return;
    const t = setInterval(() => setI((p) => (p + 1) % words.length), holdMs);
    return () => clearInterval(t);
  }, [words.length, holdMs]);

  return (
    <span className={className} style={{ display: 'inline-block' }}>
      {/* key remount replays the fade each time the word changes */}
      <span key={i} className="inline-block animate-in fade-in slide-in-from-bottom-1 duration-500 ease-out">
        {words[i]}
      </span>
    </span>
  );
};

export default RotatingWord;
