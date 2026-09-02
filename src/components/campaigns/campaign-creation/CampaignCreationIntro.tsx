import { useEffect, useState } from "react";
import { Send, X } from "lucide-react";
import { cn } from "@/lib/utils";

/** Rotates through while the box is empty — typed out, held, then deleted. */
const ROTATING_PROMPTS = [
  "I want to bring back customers who haven't purchased in 90 days.",
  "Help me promote our summer sale.",
  "I want to reach customers who abandoned their carts.",
  "Create a welcome campaign for new customers",
  "Help me drive repeat purchases from recent buyers.",
  "Create a campaign to promote our summer sale.",
  "Create a campaign for high-value customers with an exclusive offer.",
];

const TYPE_MS = 38;
const DELETE_MS = 22;
const HOLD_MS = 1600;
const NEXT_DELAY_MS = 300;

/** Types a prompt out, holds it, deletes it, then moves to the next one. */
function useTypewriter(prompts: string[], paused: boolean) {
  const [promptIndex, setPromptIndex] = useState(0);
  const [display, setDisplay] = useState("");

  useEffect(() => {
    if (paused) return;
    let alive = true;
    let charCount = 0;
    let deleting = false;
    let timeoutId: ReturnType<typeof setTimeout>;

    const tick = () => {
      if (!alive) return;
      const full = prompts[promptIndex];
      if (!deleting) {
        charCount++;
        setDisplay(full.slice(0, charCount));
        if (charCount >= full.length) {
          timeoutId = setTimeout(() => {
            deleting = true;
            tick();
          }, HOLD_MS);
          return;
        }
        timeoutId = setTimeout(tick, TYPE_MS);
      } else {
        charCount--;
        setDisplay(full.slice(0, charCount));
        if (charCount <= 0) {
          timeoutId = setTimeout(() => {
            setPromptIndex((i) => (i + 1) % prompts.length);
          }, NEXT_DELAY_MS);
          return;
        }
        timeoutId = setTimeout(tick, DELETE_MS);
      }
    };

    timeoutId = setTimeout(tick, TYPE_MS);
    return () => {
      alive = false;
      clearTimeout(timeoutId);
    };
    // Restarting on every keystroke would fight the timers; only the prompt
    // index (which only advances once a full type→hold→delete cycle finishes)
    // and the paused flag should ever re-run this.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [promptIndex, paused]);

  return display;
}

/**
 * The first screen of the Email creation flow — a single prompt box asking
 * for the campaign's goal, with "Start from scratch" as the way past it into
 * the step-by-step wizard underneath. Typing and submitting a goal lands on
 * the same wizard for now; there's no goal-driven build yet to hand it to.
 */
export default function CampaignCreationIntro({
  onContinue,
  onClose,
}: {
  onContinue: () => void;
  onClose: () => void;
}) {
  const [text, setText] = useState("");
  const typed = useTypewriter(ROTATING_PROMPTS, Boolean(text));

  const submit = () => {
    if (!text.trim()) return;
    onContinue();
  };

  return (
    <div className="flex flex-1 flex-col">
      {/* Same white header bar as the wizard, but with nothing else in it —
          there's no campaign yet to name or save. */}
      <header className="flex h-14 shrink-0 items-center justify-end border-b border-[#DDE2EE] bg-white px-14">
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          className="grid h-8 w-8 place-items-center rounded border border-[#DDE2EE] text-[#6F6F8D] transition-colors hover:bg-[#F7F9FC] hover:text-[#17173A]"
        >
          <X className="h-4 w-4" strokeWidth={2} />
        </button>
      </header>

      <div className="flex flex-1 flex-col items-center justify-center px-6">
      <div className="w-full max-w-[620px]">
        <div className="text-center">
          <p className="font-manrope text-sm font-semibold text-[#6F6F8D]">Hi, admin!</p>
          <h1 className="mt-2 font-manrope text-[28px] font-bold leading-tight text-[#17173A]">
            What campaign would you like to create?
          </h1>
        </div>

        <div className="relative mt-8 overflow-hidden rounded-2xl">
          <span aria-hidden="true" className="input-border-shimmer" style={{ padding: "1px" }} />
          <div className="relative flex flex-col rounded-2xl bg-white p-5">
            <div className="relative min-h-[64px]">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    submit();
                  }
                }}
                rows={3}
                className="min-h-[64px] w-full resize-none bg-transparent font-manrope text-[15px] text-[#17173A] outline-none"
              />
              {!text && (
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 whitespace-pre-wrap font-manrope text-[15px] text-[#9494AE]"
                >
                  {typed}
                  <span className="cc-typewriter-caret" />
                </div>
              )}
            </div>
            <div className="mt-3 flex items-center justify-end">
              <button
                type="button"
                aria-label="Submit"
                disabled={!text.trim()}
                onClick={submit}
                className={cn(
                  "grid size-8 place-items-center rounded-full transition-colors",
                  text.trim()
                    ? "bg-[#2F68E5] text-white hover:bg-[#255ad2]"
                    : "bg-[#F0F3F9] text-[#B9BAC7]"
                )}
              >
                <Send className="size-4" strokeWidth={2} />
              </button>
            </div>
          </div>
        </div>

        <div className="my-8 h-px w-full bg-[#E4E8F0]" />

        <div className="flex items-center justify-center">
          <button
            type="button"
            onClick={onContinue}
            className="rounded-full bg-[#F0F3F9] px-6 py-3 font-manrope text-sm font-semibold text-[#17173A] transition-colors hover:bg-[#E8ECF4]"
          >
            Start from scratch
          </button>
        </div>
      </div>
      </div>
    </div>
  );
}
