import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import spinnerTrack from "/campaign-assets/seg-spinner-track.svg";

/**
 * The loading state that covers the rule canvas while the co-marketer writes the
 * segment out (Figma node 13525:42044).
 *
 * A radial wash — near-white at the top, deepening to Secondary/Azure at the
 * bottom edge — with a single white pill floating in the middle: round spinner
 * plus one line of status text. The text is a clipped 18px window over a stack
 * of labels, so each step slides up into place rather than swapping.
 *
 * Stays mounted through its fade so the canvas underneath is revealed rather
 * than uncovered in one frame.
 */

/** Height of one label slot. The design's window is 18px, but Manrope's
 *  ascenders overshoot an 18px box, so the slot gets a little room and the text
 *  keeps its 18px leading centred inside it. */
const LINE_H = 22;
/** Must match the fade duration class below. */
const FADE_MS = 420;

export default function SegmentBuildLoader({
  active,
  labels,
  /** Which label is showing; clamped to the last one. */
  index,
}: {
  active: boolean;
  labels: string[];
  index: number;
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

  if (!mounted || labels.length === 0) return null;

  const shown = Math.min(index, labels.length - 1);

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
      {/* Loader pill — 0.5px Tertiary/Almost Grey line, Light Shadow. */}
      <div className="flex items-center gap-[10px] rounded-[8px] border-[0.5px] border-solid border-[#DDE2EE] bg-white px-[8px] py-[6px] shadow-[0px_5px_12px_rgba(23,23,58,0.07)]">
        <div className="flex items-center gap-[8px]">
          {/* Spinner — the designed 20px box with the stroke bleeding 8.33%
              outside it, rotating as one piece so the azure cap orbits. */}
          <div className="seg-spinner relative size-[20px] shrink-0">
            {/* Outer asset box is 20px; the track keeps its own 23.33px box so
                its 3.33px stroke overhangs exactly as designed. */}
            <span className="absolute inset-[-8.33%]">
              <img src={spinnerTrack} alt="" className="block size-full max-w-none" />
            </span>
            {/* Azure leading cap. Figma exports it as a 3.33x0.07 viewBox — a
                zero-height stroke that any renderer clips to nothing — so it's
                drawn here at the geometry the export describes: a 3.33px round
                cap centred on the track's stroke at 3 o'clock. */}
            <span
              className="absolute left-full top-1/2 rounded-full bg-[#0A8FFD]"
              style={{ width: 3.3333, height: 3.3333, transform: "translate(-50%, -50%)" }}
            />
          </div>

          {/* No fixed width: the stack's widest label sizes the window, so the
              pill holds still as the lines slide and nothing gets clipped. */}
          <div className="overflow-hidden" style={{ height: LINE_H }}>
            <div
              className="flex flex-col transition-transform duration-[420ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
              style={{ transform: `translateY(-${shown * LINE_H}px)` }}
            >
              {labels.map((label, i) => (
                <p
                  key={label}
                  className={cn(
                    "flex shrink-0 items-center whitespace-nowrap font-manrope text-[14px] leading-[18px] text-[#17173A]",
                    "transition-opacity duration-200",
                    i === shown ? "opacity-100" : "opacity-0"
                  )}
                  style={{ height: LINE_H }}
                >
                  {label}
                </p>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
