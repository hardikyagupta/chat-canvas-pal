import { useEffect, useRef } from "react";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";

/** Confetti visual is off for now — flip back to true to restore it. */
const SHOW_CONFETTI = false;

/** Safety net if the lottie's own 'complete' event never fires. */
const FALLBACK_MS = 4000;
/** With no confetti to wait on, the layer clears itself right after the sound. */
const SOUND_ONLY_MS = 400;

/** A short filtered-noise sweep — no audio asset needed, just enough to
 *  register as a "swoosh" alongside the launch. Synthesised rather than a
 *  file, so there's nothing to load before it plays. */
function playSwoosh() {
  try {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    const duration = 0.35;

    const bufferSize = Math.floor(ctx.sampleRate * duration);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.Q.value = 0.8;
    const start = ctx.currentTime;
    filter.frequency.setValueAtTime(2400, start);
    filter.frequency.exponentialRampToValueAtTime(280, start + duration);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(0.25, start + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start(start);
    noise.stop(start + duration);
    window.setTimeout(() => ctx.close(), (duration + 0.3) * 1000);
  } catch {
    // Blocked autoplay or no Web Audio support — the launch still completes
    // without the swoosh, so this is never worth surfacing as an error.
  }
}

/**
 * Full-bleed, click-through confetti burst for a campaign that just went
 * live — plays once, swooshes once, then tells the page it's done so the
 * layer can unmount instead of sitting over the table indefinitely.
 */
export default function LaunchConfetti({ onDone }: { onDone: () => void }) {
  const doneRef = useRef(onDone);
  doneRef.current = onDone;

  useEffect(() => {
    playSwoosh();
    const id = window.setTimeout(() => doneRef.current(), SHOW_CONFETTI ? FALLBACK_MS : SOUND_ONLY_MS);
    return () => window.clearTimeout(id);
  }, []);

  if (!SHOW_CONFETTI) return null;

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
