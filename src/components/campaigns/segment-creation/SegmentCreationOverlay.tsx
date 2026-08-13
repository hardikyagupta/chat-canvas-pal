import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import ChatInterface from "@/components/ChatInterface";
import SegmentCreationNavbar from "./SegmentCreationNavbar";
import SegmentRuleCanvas from "./SegmentRuleCanvas";
import SegmentBuildLoader from "./SegmentBuildLoader";
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
/** Beat between the agent's reasoning steps while it thinks — also how long each
 *  line sits in the loader pill, so it has to be readable, not just quick. */
const STEP_MS = 900;
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
  initialPrompt,
  onSaved,
  onClose,
}: {
  open: boolean;
  /** The segment handed over from chat; null opens a blank canvas. */
  segment: ReviewSegmentContext | null;
  /**
   * Ask to fire at the co-marketer as the page opens. This is the prompt-card
   * entry point: the canvas arrives empty with the chat already docked and
   * working, and the rules only get written when the user taps "Review segment"
   * on the card the agent hands back.
   */
  initialPrompt?: string;
  /**
   * SAVE was pressed. Fired with what was built so the page behind can add the
   * segment to its list and confirm it; the canvas closes either way.
   */
  onSaved?: (saved: { name: string; count: string; aiGenerated: boolean }) => void;
  onClose: () => void;
}) {
  // `mounted` keeps the panel in the DOM through its exit slide; `shown` drives
  // the transform — same dance as the campaign creation overlay.
  const [mounted, setMounted] = useState(false);
  const [shown, setShown] = useState(false);

  // Build clock: steps tick first, then rules plot, then the canvas settles.
  const [stepsDone, setStepsDone] = useState(0);
  const [plotted, setPlotted] = useState(0);

  // Docked co-marketer chat. Opens with the page when we were handed a prompt,
  // otherwise from the navbar. `chatSession` is bumped per open so the widget
  // remounts on a fresh thread.
  const [chatOpen, setChatOpen] = useState(false);
  const [chatSession, setChatSession] = useState(0);
  const [enabledAgents, setEnabledAgents] = useState<Set<string>>(new Set());

  // "Review segment" from the chat docked *here* — this is what starts the build
  // on the canvas beside it. Callers that already reviewed elsewhere pass
  // `segment` instead and skip straight to the build.
  const [reviewed, setReviewed] = useState<ReviewSegmentContext | null>(null);

  // Held so the canvas doesn't blank out mid-exit when the caller clears its
  // review context on close.
  const lastSegment = useRef<ReviewSegmentContext | null>(null);
  if (segment) lastSegment.current = segment;
  const active = reviewed ?? segment ?? (initialPrompt ? null : lastSegment.current);

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
      // Handed a prompt: the page opens with the co-marketer already working on
      // it, so the user watches the answer arrive rather than asking for it.
      if (initialPrompt) {
        setChatSession((n) => n + 1);
        setChatOpen(true);
      }
      return;
    }
    setShown(false);
    const id = setTimeout(() => {
      setMounted(false);
      setChatOpen(false);
      // Reset the build clock only once the panel is gone, so the exit slide
      // doesn't show the rules unwinding.
      setReviewed(null);
      setStepsDone(0);
      setPlotted(0);
    }, SLIDE_MS);
    return () => clearTimeout(id);
  }, [open, initialPrompt]);

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

  const fromReview = Boolean(reviewed ?? segment);

  const phase: "thinking" | "plotting" | "ready" =
    totalSteps === 0 || plotted >= totalRows
      ? "ready"
      : stepsDone < totalSteps
        ? "thinking"
        : "plotting";

  /** SAVE — hand the finished segment back, then leave the canvas. */
  const handleSave = () => {
    onSaved?.({
      name: definition.name,
      count: definition.count,
      // Anything that came out of a review was written by the agent; a canvas
      // the user filled in by hand has no rules to review.
      aiGenerated: active !== null,
    });
    onClose();
  };

  const openChat = () => {
    setChatSession((n) => n + 1);
    setChatOpen(true);
  };

  // The loader's status line: a neutral opener, then this segment's own build
  // steps, so the pill says something true about the rules being written.
  const loaderLabels = ["Getting started...", ...definition.buildSteps.map((s) => `${s}...`)];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Segment creation"
      className={cn(
        "fixed inset-0 z-[60] flex flex-col bg-[#F4F8FF]",
        "transition-transform duration-[380ms] ease-[cubic-bezier(0.22,1,0.36,1)]",
        "motion-reduce:transition-none",
        shown ? "translate-y-0" : "translate-y-full"
      )}
    >
      <SegmentCreationNavbar
        segmentName={definition.name}
        showAiIcon={fromReview && phase !== "thinking"}
        onAskCoMarketer={openChat}
        onSave={handleSave}
        onClose={onClose}
      />

      <div
        className={cn(
          "flex min-h-0 flex-1",
          // While the agent is writing rules the wash covers the whole canvas
          // column — no page gutter, so the blue reaches the left edge and the chat.
          phase === "thinking"
            ? chatOpen
              ? "pr-5"
              : ""
            : cn("pl-14", chatOpen ? "pr-5" : "pr-14")
        )}
      >
        {/* Canvas column. Relative so the build loader can wash over exactly this
            column — the chat beside it stays visible and interactive. */}
        <div className="relative min-w-0 flex-1">
          <div
            className={cn(
              "scroll-slim h-full",
              phase === "thinking" ? "overflow-hidden" : "overflow-y-auto py-6 pr-3",
            )}
          >
            <SegmentRuleCanvas
              definition={definition}
              plotted={plotted}
              settled={phase === "ready"}
            />
          </div>

          <SegmentBuildLoader
            active={phase === "thinking"}
            labels={loaderLabels}
            index={stepsDone}
          />
        </div>

        {/* Co-marketer chat — docked column on the right, the same widget the
            segments list and campaign creation use. Remounted per open (key
            bump) so each session starts on a clean thread. */}
        {chatOpen && (
          <div className="flex h-full min-h-0 w-[474px] shrink-0 justify-end overflow-hidden py-3">
            <ChatInterface
              key={chatSession}
              initialExpanded={false}
              docked
              conversationVariant="segments"
              initialMessage={initialPrompt}
              enabledAgents={enabledAgents}
              setEnabledAgents={setEnabledAgents}
              onCloseInterface={() => setChatOpen(false)}
              // Review on the agent's card is what starts the build next door.
              onReviewArtifact={(card) =>
                setReviewed({ title: card.title, description: card.description })
              }
            />
          </div>
        )}
      </div>
    </div>
  );
}
