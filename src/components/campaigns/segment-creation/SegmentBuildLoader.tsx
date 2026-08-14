import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import dmStream from "/campaign-assets/dm-stream.svg";

/**
 * The loading state that covers the rule canvas while the co-marketer writes the
 * segment out (Figma node 13525:42044).
 *
 * A radial wash — near-white at the top, deepening to Secondary/Azure at the
 * bottom edge — with a single pill floating in the middle.
 *
 * The mark is the "Stream" dot-matrix loader from dot-matrix-animations.vercel.app
 * (MIT, self-contained SVG + CSS), recoloured to our charcoal field / azure lit
 * dots and with its dots enlarged so it reads at pill size. The label moves
 * through three stages beside it — reading the ask, looking up the data, writing
 * the rules — and the pill hugs whichever stage is showing, so no padding is
 * left over around a shorter line.
 *
 * Stays mounted through its fade so the canvas underneath is revealed rather
 * than uncovered in one frame.
 */

/** Must match the fade duration class below. */
const FADE_MS = 420;

/** The three stages the label moves through, in order. */
const STAGES = [
  "Reading your request",
  "Looking up your audience data",
  "Writing the rules",
] as const;

export default function SegmentBuildLoader({
  active,
  /** How far through the build we are, 0→1; picks the stage. */
  progress,
}: {
  active: boolean;
  progress: number;
}) {
  const [mounted, setMounted] = useState(active);

  useEffect(() => {
    if (active) {
      setMounted(true);
      return;
    }
    const id = setTimeout(() => setMounted(false), FADE_MS);
    return () => clearTimeout(id);
  }, [active]);

  if (!mounted) return null;

  const stageIndex = Math.min(
    STAGES.length - 1,
    Math.max(0, Math.floor(progress * STAGES.length))
  );
  const label = STAGES[stageIndex];

  return (
    <div
      // Sits over the canvas column only — the chat column stays interactive.
      className={cn(
        "seg-loader-wash absolute inset-0 z-20 grid place-items-center",
        "transition-opacity duration-[420ms] ease-out motion-reduce:transition-none",
        active ? "opacity-100" : "pointer-events-none opacity-0"
      )}
      role="status"
      aria-live="polite"
    >
      {/* Loader pill — 0.5px Tertiary/Almost Grey line, Light Shadow. Sized by
          its content, so it tightens and widens with the stage text. */}
      <div className="inline-flex items-center gap-[10px] rounded-[10px] border-[0.5px] border-solid border-[#DDE2EE] bg-white py-[8px] pl-[10px] pr-[14px] shadow-[0px_5px_12px_rgba(23,23,58,0.07)]">
        <img src={dmStream} alt="" aria-hidden="true" className="block size-[36px] shrink-0" />
        <span
          key={label}
          className="seg-stage-in whitespace-nowrap font-manrope text-[15px] leading-[20px] text-[#17173A]"
        >
          {label}
        </span>
      </div>
    </div>
  );
}
