import { Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import sparkle from "/campaign-assets/ic-sparkle-ai.gif";

/**
 * The "co-marketer is writing your rules" strip above the segment canvas.
 *
 * Three states, driven by the overlay's build clock:
 *  • thinking  — steps tick over one at a time, shimmer ring live
 *  • plotting  — steps all done, rules landing row by row below
 *  • ready     — collapses to a single confirmation line with the summary
 *
 * Uses the app's existing AI language: the sparkle GIF, the rotating
 * `.input-border-shimmer` stroke, #00C48C for anything completed.
 */
export default function SegmentBuildBanner({
  segmentName,
  steps,
  /** How many steps have completed. */
  stepsDone,
  summary,
  phase,
}: {
  segmentName: string;
  steps: string[];
  stepsDone: number;
  summary: string;
  phase: "thinking" | "plotting" | "ready";
}) {
  const working = phase !== "ready";

  return (
    <div
      className={cn(
        "relative mb-4 overflow-hidden rounded-xl bg-white transition-[padding] duration-300",
        working ? "p-5" : "border border-[#DDE2EE] p-4"
      )}
    >
      {/* While it's working the border IS the rotating stroke, so the card never
          shows two outlines; once ready we fall back to the static line above. */}
      {working && <span aria-hidden="true" className="input-border-shimmer" style={{ padding: "1px" }} />}

      <div className="relative flex items-start gap-3">
        <img
          src={sparkle}
          alt=""
          className={cn("mt-0.5 shrink-0 object-cover", working ? "size-6" : "size-5")}
        />

        <div className="min-w-0 flex-1">
          <p className="font-manrope text-sm font-bold text-[#17173A]">
            {phase === "thinking"
              ? "Co-marketer is translating your segment into rules"
              : phase === "plotting"
                ? "Writing the rules onto the canvas"
                : `${segmentName} is ready to review`}
          </p>

          {!working && (
            <p className="mt-1 font-manrope text-[13px] leading-[18px] text-[#6F6F8D]">{summary}</p>
          )}

          {working && steps.length > 0 && (
            <ul className="mt-3 flex flex-col gap-2">
              {steps.map((step, i) => {
                const done = i < stepsDone;
                const active = i === stepsDone;
                // Steps beyond the active one stay in the DOM but sit back, so
                // the list doesn't reflow as each one resolves.
                return (
                  <li
                    key={step}
                    className={cn(
                      "flex items-center gap-2 font-manrope text-[13px] leading-[18px] transition-opacity duration-300",
                      done ? "text-[#17173A]" : active ? "text-[#17173A]" : "text-[#A9B0C4]",
                      !done && !active && "opacity-70"
                    )}
                  >
                    {done ? (
                      <span className="seg-step-pop grid size-4 shrink-0 place-items-center rounded-full bg-[#00C48C]">
                        <Check className="size-2.5 text-white" strokeWidth={3} />
                      </span>
                    ) : active ? (
                      <Loader2 className="size-4 shrink-0 animate-spin text-[#2F68E5]" strokeWidth={2.5} />
                    ) : (
                      <span className="size-4 shrink-0 rounded-full border border-[#DDE2EE]" />
                    )}
                    <span className={cn(active && "seg-step-live")}>{step}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {!working && (
          <span className="seg-step-pop flex shrink-0 items-center gap-1.5 rounded-full bg-[#EDFBF5] px-2.5 py-1 font-manrope text-[11px] font-bold uppercase tracking-[0.42px] text-[#0B7A56]">
            <Check className="size-3" strokeWidth={3} />
            Rules applied
          </span>
        )}
      </div>
    </div>
  );
}
