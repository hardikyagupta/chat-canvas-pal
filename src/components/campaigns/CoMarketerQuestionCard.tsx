import { useState, type CSSProperties } from "react";
import { ChevronDown, ChevronUp, Sparkles, X } from "lucide-react";

/**
 * A short, structured sequence of questions the co-marketer needs answered
 * before it can act — e.g. audience/incentive/email-count when generating a
 * "recover abandoned carts" journey. Sits in the AI-chat column below the
 * docked ChatInterface (see JourneyBuilder.tsx's aiChatOpen), as its own
 * card rather than plain chat bubbles, so each choice reads as a clear step
 * instead of being buried in the conversation. Fixed-choice only (no
 * free-text answer) — "Skip" just moves on without recording a pick, the
 * same as any other co-marketer question in this app today.
 */
export interface CoMarketerQuestion {
  title: string;
  options: string[];
  /** The one option this agent itself suggests — tagged with a small "AI
   *  recommended" pill next to it. Optional; most question sets here don't
   *  set it and just show plain options. */
  recommended?: string;
}

/** One answered question, for recapping a batch of answers as the user's
 *  own chat turn (ChatMessage's `questionRecap`) — bold title, plain
 *  answer, instead of a single joined string. */
export interface QuestionRecapEntry {
  title: string;
  answer: string;
}

export default function CoMarketerQuestionCard({
  questions,
  onComplete,
  onClose,
  style,
  id,
  finalLabel,
}: {
  questions: CoMarketerQuestion[];
  /** Called once every question has been answered or skipped, with one
   *  entry per question (the picked option's label, or null if skipped). */
  onComplete: (answers: (string | null)[]) => void;
  /** Called from the card's own close button. */
  onClose: () => void;
  /** Label for the last question's primary button — e.g. "Create" when
   *  answering it triggers building something (the Journey Optimization
   *  Agent's test setup), instead of the default "Continue". Every earlier
   *  question keeps saying "Continue" regardless. */
  finalLabel?: string;
  /** Position/size, set by the host (JourneyBuilder's questionCardMetrics)
   *  — applied directly to this root element rather than a wrapping div, so
   *  its `maxHeight` (a real px cap, not a percentage) reliably bounds the
   *  card regardless of CSS percentage-height resolution rules. */
  style?: CSSProperties;
  /** Lets the host find this exact card in the DOM (JourneyBuilder excludes
   *  it from its own "where does the message thread end" measurement). */
  id?: string;
}) {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<(string | null)[]>(() => questions.map(() => null));
  const [furthest, setFurthest] = useState(0);

  const question = questions[index];
  const isLast = index === questions.length - 1;
  const selected = answers[index];

  const goTo = (next: number) => setIndex(Math.max(0, Math.min(next, furthest)));

  const advance = (answer: string | null) => {
    const next = answers.map((a, i) => (i === index ? answer : a));
    setAnswers(next);
    if (isLast) {
      onComplete(next);
      return;
    }
    setIndex((i) => i + 1);
    setFurthest((f) => Math.max(f, index + 1));
  };

  return (
    // Fixed header + footer, scrollable body only — same shape as the
    // node-config drawers (header/scroll-slim body/footer) — so Skip and
    // Continue stay reachable even when the host has little vertical room
    // to give this card (see JourneyBuilder's questionCardMetrics, which
    // caps this card's height to whatever's actually free above the
    // composer and lets it scroll internally rather than ever overlapping
    // real conversation content). z-20 keeps it above ChatInterface's own
    // message-action icons, which otherwise sit at a higher paint order
    // than a plain later sibling would expect.
    <div
      id={id}
      style={style}
      // overflow-anchor aside, some mobile/narrow-viewport browsers apply
      // their own text-size-adjust auto-inflation to small px values —
      // pinning it to 100% keeps this card's sizes exactly what's set
      // below, regardless of viewport width.
      className="z-20 flex flex-col overflow-hidden rounded-2xl border border-[#EBEBF5] bg-white shadow-[0_4px_16px_rgba(23,23,58,0.08)] [-webkit-text-size-adjust:100%] [text-size-adjust:100%]"
    >
      <div className="flex shrink-0 items-start justify-between gap-3 px-4 pt-4">
        {/* Inline font-size, not a Tailwind arbitrary-value class — some
            other rule in this app's CSS wins the cascade against
            `text-[11px]` here (computed size still came out ~14px with the
            class applied), the same kind of arbitrary-value flakiness the
            branch tag's clip-path hit earlier. Inline style has no
            specificity fight to lose. */}
        <p
          className="font-manrope font-bold uppercase tracking-[0.08em] text-[#6F6F8D]"
          style={{ fontSize: "11px" }}
        >
          Co-marketer
        </p>
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          className="grid h-5 w-5 shrink-0 place-items-center text-[#6F6F8D] transition-colors hover:text-[#17173A]"
        >
          <X className="h-4 w-4" strokeWidth={2} />
        </button>
      </div>

      {/* Inline font-size — same arbitrary-value cascade issue as the
          eyebrow above (text-[11.5px] here computed to 18px in practice). */}
      <h3
        className="mt-1 shrink-0 px-4 font-manrope font-bold leading-snug text-[#17173A]"
        style={{ fontSize: "11.5px" }}
      >
        {question.title}
      </h3>

      <div className="scroll-slim min-h-0 flex-1 overflow-y-auto px-4 py-2.5">
        <div className="flex flex-col gap-1.5">
          {question.options.map((opt) => {
            const isSelected = selected === opt;
            return (
              <button
                key={opt}
                type="button"
                onClick={() => setAnswers((prev) => prev.map((a, i) => (i === index ? opt : a)))}
                className={`flex items-center justify-between gap-2 rounded-lg border px-2.5 py-1.5 text-left font-manrope font-semibold transition-colors ${
                  isSelected
                    ? "border-[#2F68E5] bg-[#F4F8FF] text-[#143F93]"
                    : "border-[#DDE2EE] text-[#17173A] hover:border-[#B9C4DD] hover:bg-[#F7F7FB]"
                }`}
                style={{ fontSize: "11.5px" }}
              >
                {opt}
                {opt === question.recommended && (
                  <span
                    className="flex shrink-0 items-center gap-1 rounded-full border border-[#C9D7F5] bg-[#E7EDFF] px-1.5 py-0.5 font-manrope font-bold uppercase tracking-[0.03em] text-[#2F68E5]"
                    style={{ fontSize: "9.5px" }}
                  >
                    <Sparkles className="h-2.5 w-2.5 shrink-0" strokeWidth={2.2} />
                    AI recommended
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex shrink-0 items-center justify-between border-t border-[#EBEBF5] px-4 py-3">
        <div className="flex items-center gap-1 font-manrope font-medium text-[#6F6F8D]" style={{ fontSize: "12px" }}>
          <button
            type="button"
            aria-label="Previous question"
            disabled={index === 0}
            onClick={() => goTo(index - 1)}
            className="grid h-5 w-5 place-items-center rounded transition-colors hover:bg-[#F3F6FF] disabled:pointer-events-none disabled:opacity-30"
          >
            <ChevronUp className="h-3.5 w-3.5" strokeWidth={2} />
          </button>
          <span className="tabular-nums">
            {index + 1}/{questions.length}
          </span>
          <button
            type="button"
            aria-label="Next question"
            disabled={index >= furthest}
            onClick={() => goTo(index + 1)}
            className="grid h-5 w-5 place-items-center rounded transition-colors hover:bg-[#F3F6FF] disabled:pointer-events-none disabled:opacity-30"
          >
            <ChevronDown className="h-3.5 w-3.5" strokeWidth={2} />
          </button>
        </div>
        <div className="flex items-center gap-2">
          {/* Hidden on the question a finalLabel (e.g. "Create") turns into
              a real action — skipping it would build that thing off an
              unanswered question, so it must be answered instead. */}
          {!(isLast && finalLabel) && (
            <button type="button" onClick={() => advance(null)} className="dc-btn dc-btn-secondary">
              Skip
            </button>
          )}
          <button
            type="button"
            disabled={!selected}
            onClick={() => selected && advance(selected)}
            className="dc-btn dc-btn-primary"
          >
            {isLast && finalLabel ? finalLabel : "Continue"}
          </button>
        </div>
      </div>
    </div>
  );
}
