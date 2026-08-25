import { type ReactNode } from "react";
import { cn } from "@/lib/utils";
import SegmentCreationNavbar from "./SegmentCreationNavbar";
import SegmentCanvasColumn from "./SegmentCanvasColumn";
import {
  segmentRowPadding,
  useSegmentBuild,
  type ReviewSegmentContext,
} from "./useSegmentBuild";

/**
 * The segment creation page as one self-contained block: navbar across the top,
 * rules below it, and whatever chat the host docks alongside them.
 *
 * Used by <SegmentCreationOverlay/>, which owns its own chat and can therefore
 * nest it here. A host that has to keep an *existing* chat mounted — the AI
 * dashboard — composes the same pieces itself (navbar in its chrome slot,
 * <SegmentCanvasColumn/> in its content column) so the chat never changes parent
 * and never remounts. The behaviour is shared through `useSegmentBuild`.
 */

export type { ReviewSegmentContext };

export default function SegmentCanvasStage({
  segment,
  active = true,
  chatSlot,
  chatDocked = false,
  onAskCoMarketer,
  onSaved,
  onClose,
}: {
  /** The segment to plot; null renders the blank "Untitled segment" canvas. */
  segment: ReviewSegmentContext | null;
  /** While false the build clock is parked — the overlay uses this so the rules
   *  don't start writing themselves behind a closed panel. */
  active?: boolean;
  /** Docked co-marketer column, rendered beside the canvas. */
  chatSlot?: ReactNode;
  /** Whether `chatSlot` is currently showing — only affects canvas gutters. */
  chatDocked?: boolean;
  onAskCoMarketer?: () => void;
  /** SAVE — handed what was built, so the caller can list and confirm it. */
  onSaved?: (saved: { name: string; count: string; aiGenerated: boolean }) => void;
  onClose: () => void;
}) {
  const build = useSegmentBuild(segment, active);

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col">
      <SegmentCreationNavbar
        segmentName={build.definition.name}
        showAiIcon={segment !== null && build.phase !== "thinking"}
        onAskCoMarketer={onAskCoMarketer}
        onSave={() => onSaved?.(build.saved)}
        onClose={onClose}
      />

      <div className={cn("flex min-h-0 flex-1", segmentRowPadding(build.phase, chatDocked))}>
        <SegmentCanvasColumn {...build} />
        {chatSlot}
      </div>
    </div>
  );
}
