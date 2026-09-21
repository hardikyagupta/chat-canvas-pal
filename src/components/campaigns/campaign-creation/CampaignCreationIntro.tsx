import { useEffect, useState, type ComponentType, type SVGProps } from "react";
import {
  BellRing,
  Mail,
  PenLine,
  Rocket,
  Send,
  Sparkles,
  Tag,
  User,
  Users,
  ShoppingCart,
  Timer,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import CampaignNameField from "./CampaignNameField";

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

/** App Push's typed-out examples while the box is empty. */
const PUSH_ROTATING_PROMPTS = [
  "Create a push notification for users who added products to their cart but haven’t completed the purchase.",
  "Re-engage users who haven’t opened the app in the last 30 days with a personalized offer to bring them back.",
  "Create a Diwali push campaign for customers who purchased from us last year with an exclusive 20% discount.",
  "Send a personalized push to users who recently viewed running shoes, recommending similar products and offering 10% off.",
  "Send a personalized push to users who searched for flights to Goa but didn’t complete their booking.",
];

/** App Push's "Get started" cards — each drops its prompt into the box. The
 *  limited-time-deals one uses the coupon-expiry prompt, so it lands on the
 *  draft built for it. */
const PUSH_STARTERS: { label: string; icon: typeof Tag; prompt: string }[] = [
  {
    label: "Promote limited-time deals",
    icon: Timer,
    prompt:
      "Remind users that their ₹1000 coupon expires tonight and encourage them to use it before midnight.",
  },
  {
    label: "Recover abandoned carts",
    icon: ShoppingCart,
    prompt:
      "Create a push notification for users who added products to their cart but haven’t completed the purchase.",
  },
  {
    label: "Alert when items are back in stock",
    icon: BellRing,
    prompt:
      "Notify users when a product they viewed or added to their wishlist is back in stock.",
  },
  {
    label: "Drive app feature adoption",
    icon: Rocket,
    prompt:
      "Encourage users who haven’t tried our new app features to explore them with a quick walkthrough.",
  },
];

const TYPE_MS = 38;
const DELETE_MS = 22;
const HOLD_MS = 1600;
const NEXT_DELAY_MS = 300;

/** Types a prompt out, holds it, deletes it, then moves to the next one. */
function useTypewriter(prompts: string[], paused: boolean) {
  // Counts finished type→hold→delete rounds; the prompt is picked from it, so
  // a list of one still restarts instead of stalling on an unchanged index.
  const [cycle, setCycle] = useState(0);
  const [display, setDisplay] = useState("");

  useEffect(() => {
    if (paused) return;
    let alive = true;
    let charCount = 0;
    let deleting = false;
    let timeoutId: ReturnType<typeof setTimeout>;

    const tick = () => {
      if (!alive) return;
      const full = prompts[cycle % prompts.length];
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
            setCycle((c) => c + 1);
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
    // Restarting on every keystroke would fight the timers; only the round
    // counter (which only advances once a full type→hold→delete cycle
    // finishes) and the paused flag should ever re-run this.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cycle, paused]);

  return display;
}

/**
 * The first screen of the Email creation flow — a single prompt box asking
 * for the campaign's goal, with "Build from scratch" as the way past it into
 * the step-by-step wizard underneath. Typing and submitting a goal lands on
 * the same wizard for now; there's no goal-driven build yet to hand it to.
 */
export default function CampaignCreationIntro({
  channel = "Email",
  icon: ChannelIcon = Mail,
  campaignName,
  onRenameCampaign,
  onContinue,
  onGenerate,
  onClose,
}: {
  /** Picks the prompts and starters offered — Email and App Push each build
   *  their AI draft around their own goal. */
  channel?: string;
  icon?: ComponentType<SVGProps<SVGSVGElement>>;
  campaignName: string;
  onRenameCampaign?: (name: string) => void;
  onContinue: () => void;
  /** A typed-and-submitted goal, unlike "Build from scratch" — this one gets
   *  the AI-drafted campaign, not a blank wizard. */
  onGenerate: (prompt: string) => void;
  onClose: () => void;
}) {
  const [text, setText] = useState("");
  const isEmail = channel === "Email";
  const typed = useTypewriter(isEmail ? ROTATING_PROMPTS : PUSH_ROTATING_PROMPTS, Boolean(text));
  const starters = isEmail ? STARTERS : PUSH_STARTERS;

  const submit = () => {
    if (!text.trim()) return;
    onGenerate(text.trim());
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-[#DDE2EE] bg-white px-14">
        <div className="flex items-center gap-3">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded bg-[#E7EDFF]">
            <ChannelIcon className="h-4 w-4 text-[#2F68E5]" strokeWidth={2} />
          </span>
          <CampaignNameField campaignName={campaignName} onRenameCampaign={onRenameCampaign} />
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
              <ChannelIcon className="h-9 w-9 text-[#2F68E5]" strokeWidth={2} />
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
              Create with campaign composer
            </h1>
            <p className="mt-2 whitespace-nowrap font-manrope text-sm leading-6 text-[#6F6F8D]">
              Tell me what you want to achieve, and I'll help you build it.
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
            Get started with a campaign to
          </p>
          <div className={cn("mt-3 grid gap-3", starters.length > 1 ? "grid-cols-2" : "grid-cols-1")}>
            {starters.map((s) => {
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
