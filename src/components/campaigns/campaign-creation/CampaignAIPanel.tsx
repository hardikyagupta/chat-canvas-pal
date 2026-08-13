import { ArrowUpRight } from "lucide-react";
import type { SeededTopic } from "@/components/ChatInterface";
import sparkle from "/campaign-assets/ic-sparkle-ai.gif";

/**
 * Right-hand co-marketer panel in the campaign creation wizard — replaces the
 * old read-only summary with things the agent can actually do at this point in
 * the setup. Each card opens the docked co-marketer already answering, so the
 * user never has to work out how to phrase the ask.
 *
 * Points are keyed to the step you're on: setup gets naming/tagging/tracking
 * help, the later steps get content, audience and send-time help.
 */

export interface DiscoveryPoint extends SeededTopic {
  /** Card headline — phrased as the outcome, not the feature. */
  title: string;
  /** One line on what the agent will actually come back with. */
  blurb: string;
}

const POINTS: Record<string, DiscoveryPoint[]> = {
  setup: [
    {
      title: "Name this campaign for me",
      blurb: "Follows the naming pattern your team already reports on.",
      navLabel: "Naming help",
      prompt: "Suggest a name for this campaign that fits how we name things.",
      reply:
        "Your last 40 campaigns follow `{channel}_{intent}_{audience}_{month}`, and the ones that break the " +
        "pattern are the ones that go missing in reporting.\n\nFor this one I'd use " +
        "**EM_Reengagement_DormantHighValue_Aug** — it slots straight into your existing dashboards. " +
        "Want me to apply it, or shall I give you three alternatives?",
    },
    {
      title: "Which tags should I apply?",
      blurb: "Keeps this campaign groupable with the rest of the quarter.",
      navLabel: "Tagging help",
      prompt: "What tags should I put on this campaign?",
      reply:
        "Based on what you're building, I'd tag it **reengagement**, **q3-retention** and **email**.\n\n" +
        "Those three are what your retention rollup filters on, so tagging it now means it shows up in the " +
        "quarterly view without anyone backfilling it later. I'd skip free-text tags — you have 60-odd " +
        "one-off tags already and none of them are queried.",
    },
    {
      title: "Should tracking be on?",
      blurb: "GA and conversion tracking, judged against this campaign's goal.",
      navLabel: "Tracking advice",
      prompt: "Do I need GA tracking and conversion tracking on for this one?",
      reply:
        "**Conversion tracking: yes.** This is a revenue campaign, and without it the attribution window " +
        "closes and you'll only be able to report opens and clicks.\n\n**GA tracking: yes, with UTMs.** " +
        "Your last three sends went out without them, so the traffic landed in GA as direct and the " +
        "channel got no credit. I can generate the UTM set for you now.",
    },
    {
      title: "What worked last time?",
      blurb: "A read on your comparable sends before you commit to a setup.",
      navLabel: "Past performance",
      prompt: "How have similar campaigns performed for us before?",
      reply:
        "You've run 6 comparable re-engagement emails in the last year.\n\n**What held up:** a 2-touch " +
        "sequence beat a single send by 34% on reactivation, and Tuesday/Wednesday mornings beat weekends " +
        "consistently.\n\n**What didn't:** discount-led subject lines pulled clicks but the revenue per " +
        "recipient was 18% lower — the discount was going to people who'd have converted anyway.",
    },
  ],
  content: [
    {
      title: "Draft the subject line",
      blurb: "Three options in your brand voice, with a predicted open rate.",
      navLabel: "Subject lines",
      prompt: "Draft subject lines for this campaign.",
      reply:
        "Three, in your voice, ranked by what your audience has actually opened:\n\n" +
        "1. **\"You left something behind — still interested?\"** (predicted 41% open)\n" +
        "2. **\"It's been a while. Here's what's new.\"** (predicted 38%)\n" +
        "3. **\"A quick one, before this closes\"** (predicted 36%)\n\n" +
        "The first one wins because your audience responds to direct questions — statement subject lines " +
        "underperform by about 6 points here. Want me to write the body for one?",
    },
    {
      title: "Write the whole email",
      blurb: "Body copy and CTA, built from your best-performing template.",
      navLabel: "Draft email",
      prompt: "Write the email body for this campaign.",
      reply:
        "I'll build on your highest-converting re-engagement template: short opener, one clear benefit, " +
        "single CTA above the fold.\n\nBefore I write it — should the CTA push to the category page or " +
        "straight to their abandoned cart? Cart-direct converts about twice as well but only for the " +
        "third of this audience that actually has one, so I'd usually split it.",
    },
  ],
  audience: [
    {
      title: "Build the audience for me",
      blurb: "A segment described in plain language, sized before you commit.",
      navLabel: "Build audience",
      prompt: "Who should receive this campaign?",
      reply:
        "For a re-engagement send I'd target: **opened in the last 12 months, nothing in the last 60 days, " +
        "at least one prior purchase.** That's roughly 48,200 contacts.\n\nI'd hold back the 4,100 who are " +
        "already in an active journey so they don't get two messages this week, which leaves 44,100. " +
        "Say the word and I'll create the segment.",
    },
    {
      title: "Who should I exclude?",
      blurb: "Suppression checks before this collides with another send.",
      navLabel: "Exclusions",
      prompt: "Who should I exclude from this campaign?",
      reply:
        "Three suppressions I'd apply:\n\n• **Already in an active journey** (4,100) — avoids a double " +
        "message this week.\n• **Contacted in the last 5 days** (2,300) — you're near the fatigue " +
        "threshold where unsubscribes climb.\n• **Hard bounces and complainers** (900) — deliverability.\n\n" +
        "That's 7,300 removed. Your sender reputation has been slipping slightly, so this one matters.",
    },
  ],
  schedule: [
    {
      title: "Pick the best send time",
      blurb: "Timing from when this audience actually opens, not a global rule.",
      navLabel: "Send time",
      prompt: "When should this campaign go out?",
      reply:
        "**Wednesday, 10:00–11:00 in the recipient's own timezone.**\n\nThat window carries 31% of this " +
        "segment's opens against 12% for your current default of Monday 9am. Sunday is the worst slot for " +
        "them, in case it comes up.\n\nIf you'd rather not stagger by timezone, 10am IST is the single best " +
        "fixed slot — it costs you about 4 points of open rate.",
    },
    {
      title: "Should I A/B test this?",
      blurb: "Whether your volume can actually resolve a winner.",
      navLabel: "A/B advice",
      prompt: "Is it worth A/B testing this campaign?",
      reply:
        "Yes — at 44,000 recipients you have the volume to resolve a real difference.\n\nI'd test **subject " +
        "line only**, 20% of the audience split across two variants, winner going to the remaining 80% " +
        "after 4 hours. Testing more than one variable at this size just gives you a result you can't " +
        "attribute to anything.",
    },
  ],
};

export default function CampaignAIPanel({
  stepId,
  onAsk,
}: {
  /** Active wizard step — decides which points are surfaced. */
  stepId: string;
  /** Fired with the tapped point so the caller can open the docked chat on it. */
  onAsk: (point: DiscoveryPoint) => void;
}) {
  const points = POINTS[stepId] ?? POINTS.setup;

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
        {points.map((point) => (
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
