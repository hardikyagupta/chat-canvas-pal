import React, { useEffect, useState } from 'react';

interface RotatingWordProps {
  words: string[];
  holdMs?: number; // how long each word stays before crossfading to the next
  className?: string;
}

/**
 * Cycles a list of words with a pure opacity crossfade — the current word fades
 * out, swaps while invisible, then fades in. No vertical movement, so the text
 * never jumps.
 */
const RotatingWord: React.FC<RotatingWordProps> = ({ words, holdMs = 2400, className }) => {
  const [i, setI] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (words.length <= 1) return;
    const FADE = 300; // matches the CSS transition below
    let swapTimer: ReturnType<typeof setTimeout>;
    const cycle = setInterval(() => {
      setVisible(false); // fade out
      swapTimer = setTimeout(() => {
        setI((p) => (p + 1) % words.length);
        setVisible(true); // fade in the next word
      }, FADE);
    }, holdMs);
    return () => {
      clearInterval(cycle);
      clearTimeout(swapTimer);
    };
  }, [words.length, holdMs]);

  return (
    <span
      className={className}
      style={{
        display: 'inline-block',
        opacity: visible ? 1 : 0,
        transition: 'opacity 300ms ease',
      }}
    >
      {words[i]}
    </span>
  );
};

export default RotatingWord;
