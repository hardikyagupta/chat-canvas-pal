import { useEffect, useState } from "react";
import {
  Mail,
  PenLine,
  Send,
  Sparkles,
  Tag,
  User,
  Users,
  ShoppingCart,
  X,
} from "lucide-react";
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

/** "Try asking" starters — clicking one drops its prompt into the box rather
 *  than submitting straight away, so there's still a chance to edit it. */
const STARTERS: { label: string; icon: typeof Tag; prompt: string }[] = [
  {
    label: "Promote our summer sale",
    icon: Tag,
    prompt: "Help me promote our summer sale.",
  },
  {
    label: "Win back inactive customers",
    icon: Users,
    prompt: "I want to bring back customers who haven't purchased in 90 days.",
  },
  {
    label: "Welcome new customers",
    icon: User,
    prompt: "Create a welcome campaign for new customers.",
  },
  {
    label: "Drive repeat purchases",
    icon: ShoppingCart,
    prompt: "Help me drive repeat purchases from recent buyers.",
  },
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
 * for the campaign's goal, with "Build from scratch" as the way past it into
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
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-[#DDE2EE] bg-white px-14">
        <div className="flex items-center gap-3">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded bg-[#E7EDFF]">
            <Mail className="h-4 w-4 text-[#2F68E5]" strokeWidth={2} />
          </span>
          <span className="font-manrope text-base font-bold leading-[22px] text-[#17173A]">
            New email campaign
          </span>
        </div>
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          className="grid h-8 w-8 place-items-center rounded border border-[#DDE2EE] text-[#6F6F8D] transition-colors hover:bg-[#F7F9FC] hover:text-[#17173A]"
        >
          <X className="h-4 w-4" strokeWidth={2} />
        </button>
      </header>

      <div className="scroll-slim flex min-h-0 flex-1 flex-col items-center justify-center overflow-y-auto px-6 py-10">
        <div className="w-full max-w-[640px]">
          <div className="flex flex-col items-center text-center">
            <div className="relative mb-5 grid h-20 w-20 place-items-center rounded-full bg-[#E7EDFF]">
              <Mail className="h-9 w-9 text-[#2F68E5]" strokeWidth={2} />
              <Sparkles
                className="absolute -right-1.5 -top-1 h-5 w-5 text-[#7B5CFA]"
                strokeWidth={2}
              />
              <Sparkles
                className="absolute -bottom-1 -left-2 h-3.5 w-3.5 text-[#FC5E02]"
                strokeWidth={2}
              />
            </div>
            <h1 className="font-manrope text-[26px] font-bold leading-tight text-[#17173A]">
              Create your email campaign
            </h1>
            <p className="mt-2 font-manrope text-sm leading-6 text-[#6F6F8D]">
              Tell me what you want to achieve,
              <br />
              and I'll help you build it.
            </p>
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

          <p className="mt-6 text-center font-manrope text-sm font-semibold text-[#6F6F8D]">
            Try asking
          </p>
          <div className="mt-3 grid grid-cols-2 gap-3">
            {STARTERS.map((s) => {
              const StarterIcon = s.icon;
              return (
                <button
                  key={s.label}
                  type="button"
                  onClick={() => setText(s.prompt)}
                  className="flex items-center gap-2.5 rounded-xl border border-[#DDE2EE] bg-white px-4 py-3 text-left transition-colors hover:border-[#2F68E5] hover:bg-[#F4F8FF]"
                >
                  <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-[#F0E8FF]">
                    <StarterIcon className="size-4 text-[#7B5CFA]" strokeWidth={2} />
                  </span>
                  <span className="font-manrope text-sm font-semibold leading-5 text-[#17173A]">
                    {s.label}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="my-8 flex items-center gap-3">
            <div className="h-px flex-1 bg-[#E4E8F0]" />
            <span className="font-manrope text-xs font-semibold uppercase tracking-wide text-[#9494AE]">
              or
            </span>
            <div className="h-px flex-1 bg-[#E4E8F0]" />
          </div>

          <div className="flex flex-col items-center">
            <button
              type="button"
              onClick={onContinue}
              className="flex items-center gap-2 rounded-full bg-[#F0F3F9] px-6 py-3 font-manrope text-sm font-semibold text-[#17173A] transition-colors hover:bg-[#E8ECF4]"
            >
              <PenLine className="size-4" strokeWidth={2} />
              Build from scratch
            </button>
            <p className="mt-2 font-manrope text-xs text-[#9494AE]">Start with a blank campaign</p>
          </div>
        </div>
      </div>
    </div>
  );
}
