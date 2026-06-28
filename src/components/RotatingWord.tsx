import React, { useEffect, useState } from 'react';
import { SlotText } from 'slot-text/react';

interface RotatingWordProps {
  words: string[];
  holdMs?: number; // how long each word stays before rolling to the next
  className?: string;
}

/**
 * Cycles a list of words through the `slot-text` library's text-roll animation
 * (https://textmotion.dev/lab). The library does all the animation — this only
 * advances the `text` prop on an interval; SlotText rolls whenever it changes.
 */
const RotatingWord: React.FC<RotatingWordProps> = ({ words, holdMs = 2400, className }) => {
  const [i, setI] = useState(0);

  useEffect(() => {
    if (words.length <= 1) return;
    const t = setInterval(() => setI((p) => (p + 1) % words.length), holdMs);
    return () => clearInterval(t);
  }, [words.length, holdMs]);

  return (
    <SlotText
      text={words[i]}
      className={className}
      options={{
        direction: 'up',
        duration: 300,
        stagger: 45,
        bounce: 0.6,
        easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      }}
    />
  );
};

export default RotatingWord;
