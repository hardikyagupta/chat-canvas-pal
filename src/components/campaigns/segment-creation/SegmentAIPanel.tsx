import { ArrowUpRight } from "lucide-react";
import type { SeededTopic } from "@/components/ChatInterface";
import sparkle from "/campaign-assets/ic-sparkle-ai.gif";

/**
 * Right-hand co-marketer panel on the segment canvas — the segment-flow twin of
 * <CampaignAIPanel/>. Each card opens the docked co-marketer already answering
 * about the rules on screen, so the user never has to phrase the ask.
 *
 * Points are about the rule set itself (tighten it, size it, check consent),
 * not about a campaign, and each answer is written against the segment the
 * agent just built.
 */

export interface SegmentDiscoveryPoint extends SeededTopic {
  title: string;
  blurb: string;
}

const POINTS: SegmentDiscoveryPoint[] = [
  {
    title: "Explain these rules back to me",
    blurb: "What each condition does, and why it's in the set.",
    navLabel: "Explain rules",
    prompt: "Walk me through the rules you applied to this segment.",
    reply:
      "Reading top to bottom:\n\n**The attribute condition** narrows to the population you asked for — it's the cheap filter, so it runs first and everything else is scoped inside it.\n\n" +
      "**The engagement condition** is what makes this a segment worth sending to rather than a list. Without a recency window you'd be including contacts who technically qualify but haven't looked at an email in a year.\n\n" +
      "**The exclusions** are unsubscribes and hard bounces. They can't legally or technically receive the send, so leaving them in only inflates the count and hides your real reach.",
  },
  {
    title: "Is this segment too tight?",
    blurb: "Where the rules are costing you reachable contacts.",
    navLabel: "Loosen rules",
    prompt: "Am I over-filtering this segment?",
    reply:
      "Slightly, in one place. The engagement window is doing most of the cutting — widening it from 30 to 45 days adds about 14% more contacts and they click only marginally below the current group.\n\n" +
      "What I would **not** loosen is the consent and suppression rules. They're not costing you anyone you can actually reach; they're just stopping you counting people you can't.\n\n" +
      "Want me to widen the window and re-run the count so you can compare?",
  },
  {
    title: "What overlaps with my other segments?",
    blurb: "Collision check before this goes into a campaign.",
    navLabel: "Overlap check",
    prompt: "Does this segment overlap with the ones I already have?",
    reply:
      "There's meaningful overlap with two of your live segments — enough that if both get campaigns this week, a slice of your audience gets messaged twice.\n\n" +
      "The clean fix is an exclusion on this segment rather than shrinking the other one, since this rule set is the more specific of the two. I can add **not in an active journey** as an exclusion block, which resolves most of it without touching your existing segments.",
  },
  {
    title: "Will this stay accurate?",
    blurb: "Whether the rules refresh themselves or go stale.",
    navLabel: "Refresh behaviour",
    prompt: "Does this segment update itself over time?",
    reply:
      "Yes — every window in here is relative, not a fixed date range, so the segment re-evaluates on each refresh and contacts age in and out on their own.\n\n" +
      "The one thing to watch is the count: it drifts as the population moves, so don't hard-code the number into a forecast. If you need a frozen audience for a specific send, tell me and I'll snapshot it as a static list instead.",
  },
];

export default function SegmentAIPanel({
  onAsk,
}: {
  /** Fired with the tapped point so the caller can open the docked chat on it. */
  onAsk: (point: SegmentDiscoveryPoint) => void;
}) {
  return (
    <aside className="scroll-slim w-[300px] shrink-0 overflow-y-auto px-5 pt-5">
      <div className="flex items-center gap-1.5">
        <img src={sparkle} alt="" className="h-5 w-5 shrink-0" />
        <h2 className="font-manrope text-base font-bold text-[#17173A]">Co-marketer can help</h2>
      </div>
      <p className="mb-4 mt-1 font-manrope text-xs text-[#6F6F8D]">
        Tap any of these and I'll pick it up from here
      </p>

      <div className="flex flex-col gap-2 pb-6">
        {POINTS.map((point) => (
          <button
            key={point.title}
            type="button"
            onClick={() => onAsk(point)}
            className="group rounded-md border border-[#DDE2EE] bg-white px-3 py-3 text-left transition-colors hover:border-[#2F68E5] hover:bg-[#F7F9FF]"
          >
            <span className="flex items-start justify-between gap-2">
              <span className="font-manrope text-[13px] font-semibold leading-[18px] text-[#17173A]">
                {point.title}
              </span>
              <ArrowUpRight
                className="mt-0.5 h-4 w-4 shrink-0 text-[#6F6F8D] transition-colors group-hover:text-[#2F68E5]"
                strokeWidth={2}
              />
            </span>
            <span className="mt-1 block font-manrope text-xs leading-[16px] text-[#6F6F8D]">
              {point.blurb}
            </span>
          </button>
        ))}
      </div>
    </aside>
  );
}
