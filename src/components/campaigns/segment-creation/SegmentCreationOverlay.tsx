import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import ChatInterface from "@/components/ChatInterface";
import SegmentCanvasStage, { type ReviewSegmentContext } from "./SegmentCanvasStage";

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
 * it thinks, then plots row by row. That machinery lives in
 * <SegmentCanvasStage/>; this file is the overlay presentation of it, and owns
 * the chat that gets docked *inside* the overlay on a fresh thread.
 *
 * Pages that need the user's existing thread to survive the hand-off render the
 * stage in their own content column instead — see <AiDashboard/>.
 */

/** How long the slide runs; must match the duration class below. */
const SLIDE_MS = 380;

export type { ReviewSegmentContext };

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
      // Reset only once the panel is gone, so the exit slide doesn't show the
      // rules unwinding.
      setReviewed(null);
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

  const openChat = () => {
    setChatSession((n) => n + 1);
    setChatOpen(true);
  };

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
      <SegmentCanvasStage
        segment={active}
        active={open}
        chatDocked={chatOpen}
        onAskCoMarketer={openChat}
        onSaved={(saved) => {
          onSaved?.(saved);
          onClose();
        }}
        onClose={onClose}
        chatSlot={
          // Co-marketer chat — docked column on the right, the same widget the
          // segments list and campaign creation use. Remounted per open (key
          // bump) so each session starts on a clean thread.
          chatOpen ? (
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
          ) : undefined
        }
      />
    </div>
  );
}
