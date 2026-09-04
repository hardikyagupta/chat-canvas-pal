import { useEffect, useRef } from "react";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";

/** Safety net if the lottie's own 'complete' event never fires. */
const FALLBACK_MS = 4000;

/** A quick two-note lift — no audio asset needed, just enough to register as
 *  a little "pop" alongside the confetti. Synthesised rather than a file, so
 *  there's nothing to load before the burst starts. */
function playChime() {
  try {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    [660, 880].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      const start = ctx.currentTime + i * 0.09;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.08, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.22);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.25);
    });
    window.setTimeout(() => ctx.close(), 600);
  } catch {
    // Blocked autoplay or no Web Audio support — the confetti still lands
    // without the chime, so this is never worth surfacing as an error.
  }
}

/**
 * Full-bleed, click-through confetti burst for a campaign that just went
 * live — plays once, chimes once, then tells the page it's done so the
 * layer can unmount instead of sitting over the table indefinitely.
 */
export default function LaunchConfetti({ onDone }: { onDone: () => void }) {
  const doneRef = useRef(onDone);
  doneRef.current = onDone;

  useEffect(() => {
    playChime();
    const id = window.setTimeout(() => doneRef.current(), FALLBACK_MS);
    return () => window.clearTimeout(id);
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 z-[90] overflow-hidden">
      <DotLottieReact
        src="/campaign-assets/confetti.lottie"
        autoplay
        loop={false}
        dotLottieRefCallback={(instance) => {
          if (!instance) return;
          instance.addEventListener("complete", () => doneRef.current());
        }}
        className="h-full w-full"
      />
    </div>
  );
}
