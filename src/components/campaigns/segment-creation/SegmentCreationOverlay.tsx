import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import ChatInterface from "@/components/ChatInterface";
import SegmentCreationNavbar from "./SegmentCreationNavbar";
import SegmentBuildBanner from "./SegmentBuildBanner";
import SegmentRuleCanvas from "./SegmentRuleCanvas";
import SegmentAIPanel, { type SegmentDiscoveryPoint } from "./SegmentAIPanel";
import {
  EMPTY_SEGMENT,
  resolveSegmentDefinition,
  type SegmentDefinition,
} from "./segmentRules.data";

/**
 * Full-screen segment creation canvas, opened by "Review segment" on the
 * Segment agent's artifact card (and by "+ → Segment" in the top bar for a
 * blank one). Same shell as the campaign creation wizard — slide-up overlay,
 * navbar, main canvas, right co-marketer column — so the two creation flows
 * feel like one system. Layout follows Figma node 5649:44769.
 *
 * The point of the flow is the hand-off: the user leaves a chat where the agent
 * described a segment in prose, and arrives here watching the same agent write
 * that description out as real rules. So the canvas doesn't render finished —
 * it thinks, then plots row by row.
 */

/** How long the slide runs; must match the duration class below. */
const SLIDE_MS = 380;
/** Beat between the agent's reasoning steps while it thinks. */
const STEP_MS = 720;
/** Beat between rule rows landing on the canvas. */
const ROW_MS = 300;

export interface ReviewSegmentContext {
  /** Artifact-card title — also the segment name in the navbar. */
  title: string;
  /** Card description, used to disambiguate which rule set this is. */
  description?: string;
}

export default function SegmentCreationOverlay({
  open,
  segment,
  onClose,
}: {
  open: boolean;
  /** The segment handed over from chat; null opens a blank canvas. */
  segment: ReviewSegmentContext | null;
  onClose: () => void;
}) {
  // `mounted` keeps the panel in the DOM through its exit slide; `shown` drives
  // the transform — same dance as the campaign creation overlay.
  const [mounted, setMounted] = useState(false);
  const [shown, setShown] = useState(false);

  // Build clock: steps tick first, then rules plot, then the canvas settles.
  const [stepsDone, setStepsDone] = useState(0);
  const [plotted, setPlotted] = useState(0);

  // Docked co-marketer chat. `chatSession` is bumped per open so the widget
  // remounts on a fresh thread; `chatTopic` is the point it opens on.
  const [chatOpen, setChatOpen] = useState(false);
  const [chatSession, setChatSession] = useState(0);
  const [chatTopic, setChatTopic] = useState<SegmentDiscoveryPoint | null>(null);
  const [enabledAgents, setEnabledAgents] = useState<Set<string>>(new Set());

  // Held so the canvas doesn't blank out mid-exit when the caller clears its
  // review context on close.
  const lastSegment = useRef<ReviewSegmentContext | null>(null);
  if (segment) lastSegment.current = segment;
  const active = segment ?? lastSegment.current;

  const definition: SegmentDefinition = useMemo(
    () => (active ? resolveSegmentDefinition(active.title, active.description) : EMPTY_SEGMENT),
    [active]
  );

  const totalRows =
    definition.include.reduce((n, b) => n + b.rows.length, 0) +
    (definition.exclude ?? []).reduce((n, b) => n + b.rows.length, 0);
  const totalSteps = definition.buildSteps.length;

  useEffect(() => {
    if (open) {
      setMounted(true);
      return;
    }
    setShown(false);
    const id = setTimeout(() => {
      setMounted(false);
      setChatOpen(false);
      // Reset the build clock only once the panel is gone, so the exit slide
      // doesn't show the rules unwinding.
      setStepsDone(0);
      setPlotted(0);
    }, SLIDE_MS);
    return () => clearTimeout(id);
  }, [open]);

  // Flip to open only once the closed panel is actually in the DOM, so the
  // closed state gets a frame of its own and the slide actually runs.
  useEffect(() => {
    if (!mounted || !open) return;
    let raf2 = 0;
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => setShown(true));
    });
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
  }, [mounted, open]);

  // The build itself: one interval per phase, so the row plotting can't start
  // before the reasoning finishes even if the user reopens mid-run.
  useEffect(() => {
    if (!open) return;
    // A blank canvas has nothing to think about — land it ready.
    if (totalSteps === 0) {
      setStepsDone(0);
      setPlotted(totalRows);
      return;
    }
    setStepsDone(0);
    setPlotted(0);
    const id = setInterval(() => {
      setStepsDone((n) => {
        if (n + 1 >= totalSteps) clearInterval(id);
        return Math.min(n + 1, totalSteps);
      });
    }, STEP_MS);
    return () => clearInterval(id);
  }, [open, definition, totalSteps, totalRows]);

  useEffect(() => {
    if (!open || totalSteps === 0 || stepsDone < totalSteps || plotted >= totalRows) return;
    const id = setInterval(() => {
      setPlotted((n) => {
        if (n + 1 >= totalRows) clearInterval(id);
        return Math.min(n + 1, totalRows);
      });
    }, ROW_MS);
    return () => clearInterval(id);
  }, [open, stepsDone, totalSteps, totalRows, plotted]);

  // Esc closes, and the page behind shouldn't scroll while we're over it.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!mounted) return null;

  const phase: "thinking" | "plotting" | "ready" =
    totalSteps === 0 || plotted >= totalRows
      ? "ready"
      : stepsDone < totalSteps
        ? "thinking"
        : "plotting";

  const openChat = (topic: SegmentDiscoveryPoint | null) => {
    setChatTopic(topic);
    setChatSession((n) => n + 1);
    setChatOpen(true);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Review segment"
      className={cn(
        "fixed inset-0 z-[60] flex flex-col bg-[#F4F8FF]",
        "transition-transform duration-[380ms] ease-[cubic-bezier(0.22,1,0.36,1)]",
        "motion-reduce:transition-none",
        shown ? "translate-y-0" : "translate-y-full"
      )}
    >
      <SegmentCreationNavbar
        segmentName={definition.name}
        onAskCoMarketer={() => openChat(null)}
        onSave={onClose}
        onClose={onClose}
      />

      <div className="flex min-h-0 flex-1">
        <div className="scroll-slim min-w-0 flex-1 overflow-y-auto py-6 pl-6 pr-3">
          {totalSteps > 0 && (
            <SegmentBuildBanner
              segmentName={definition.name}
              steps={definition.buildSteps}
              stepsDone={stepsDone}
              summary={definition.summary}
              phase={phase}
            />
          )}
          <SegmentRuleCanvas
            definition={definition}
            plotted={plotted}
            settled={phase === "ready"}
          />
        </div>

        <SegmentAIPanel onAsk={openChat} />

        {/* Co-marketer chat — docked column on the right, the same widget the
            segments list and campaign creation use. Remounted per open (key
            bump) so each session starts on a clean thread. */}
        {chatOpen && (
          <div className="flex h-full min-h-0 w-[474px] shrink-0 justify-end overflow-hidden py-3 pr-3">
            <ChatInterface
              key={chatSession}
              initialExpanded={false}
              docked
              conversationVariant="segments"
              initialTopic={chatTopic ?? undefined}
              enabledAgents={enabledAgents}
              setEnabledAgents={setEnabledAgents}
              onCloseInterface={() => setChatOpen(false)}
            />
          </div>
        )}
      </div>
    </div>
  );
}
