import { cn } from "@/lib/utils";
import SegmentRuleCanvas from "./SegmentRuleCanvas";
import SegmentBuildLoader from "./SegmentBuildLoader";
import type { SegmentBuild } from "./useSegmentBuild";

/**
 * The rules half of the segment creation page: the canvas, plus the loader that
 * washes over it while the agent is still writing.
 *
 * Relative so the wash covers exactly this column — a chat docked beside it stays
 * visible and interactive throughout.
 */
export default function SegmentCanvasColumn({
  definition,
  plotted,
  phase,
  stepProgress,
}: Pick<SegmentBuild, "definition" | "plotted" | "phase" | "stepProgress">) {
  return (
    <div className="relative min-w-0 flex-1">
      <div
        className={cn(
          "scroll-slim h-full",
          phase === "thinking" ? "overflow-hidden" : "overflow-y-auto py-6 pr-3"
        )}
      >
        <SegmentRuleCanvas
          definition={definition}
          plotted={plotted}
          settled={phase === "ready"}
        />
      </div>

      <SegmentBuildLoader active={phase === "thinking"} progress={stepProgress} />
    </div>
  );
}
