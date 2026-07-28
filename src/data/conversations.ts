// Scripted co-marketer conversations, keyed by variant.
//
// The chat has no backend — every conversation is hardcoded mock content. Each
// page that renders <ChatInterface/> picks a variant so different surfaces can
// play different storylines while sharing the same flow machinery.
//   - 'default'   → the June 8–19 performance story (home page, `/`)
//   - 'campaigns' → a separate storyline for the /campaigns docked chat
//
// To add a new storyline: add a variant to ConversationVariant and an entry to
// CONVERSATIONS with the same ConversationScript shape.

import type { LucideIcon } from 'lucide-react';
import { Users, Share2, GitBranch, Target } from 'lucide-react';

export type ConversationVariant = 'default' | 'campaigns';

export type StatCard = { label: string; value: string; sub?: string };

// --- Agent artifact card (Segment / Journey) --------------------------------
// A compact doc-style card an agent hands back at the end of a turn. Mirrors the
// Figma "Segment agent card" (title · stat rows · description · review action);
// the Journey card reuses the same shape with journey-level stats.
export type AgentArtifactKind = 'segment' | 'journey';

export interface AgentArtifactStat {
  icon: LucideIcon;
  label: string;
}

export interface AgentArtifactCardData {
  kind: AgentArtifactKind;
  title: string;
  stats: AgentArtifactStat[];
  description: string;
  actionLabel: string;
}

// --- Campaigns (`/campaigns`) agent-relay flow ------------------------------
// A scripted three-turn conversation that hands off between specialist agents:
// Insights → Segment → Journey. Each turn drops a centered "Switched to <agent>"
// divider, streams the agent's answer, and (except the last) surfaces a single
// suggested prompt that leads into the next agent.
export interface CampaignsTurn {
  /** What the user types (or taps) to start this turn. */
  userPrompt: string;
  /** Short label for the vertical line-nav. */
  navLabel: string;
  /** Roster id of the agent this turn switches to. */
  switchAgentId: string;
  /** Display name on the switch divider (e.g. "Insights agent"). */
  switchAgentLabel: string;
  /** Reasoning steps shown while the agent "thinks". */
  reasoningSteps: string[];
  /** The agent's answer. Intro line renders above any cards; each <strong> is a section header. */
  output: string;
  /** Show the shared campaign-performance dashboard (cards + charts) under the intro. */
  showDashboard?: boolean;
  /** Doc-style artifact card appended after the answer streams in. */
  artifactCard?: AgentArtifactCardData;
  /** Suggested prompt shown after this turn (seeds the next turn). Omit on the last turn. */
  nextSuggestion?: string;
}

export const CAMPAIGNS_FLOW: CampaignsTurn[] = [
  // Turn 1 — Insights agent: what's happening + what to do next.
  {
    userPrompt: "We've been pushing hard across channels lately, but I honestly can't tell if it's paying off. Take a look at how things are going and tell me what I should be doing about it.",
    navLabel: "Recent campaigns",
    switchAgentId: "insight-agent",
    switchAgentLabel: "Insights agent",
    reasoningSteps: [
      "Pulling your last 30 days of campaigns",
      "Reconciling delivery vs engagement by channel",
      "Spotting where audiences drop off",
      "Shaping the next best action",
    ],
    output:
      "Here's what's happening across your recent campaigns — plenty of reach, but the value is concentrated in a small, highly-engaged group.\n\n" +
      "<strong>What's working</strong>\n\nEmail is your most reliable channel — near-100% delivery and the steadiest click rates, with APN close behind. Together they're carrying most of your qualified engagement this month.\n\n" +
      "<strong>Where you're leaking</strong>\n\nWhatsApp published the most but delivered the least — over 60% never landed, so a large slice of spend never reached a person. RCS and BPN show the same delivery gap.\n\n" +
      "<strong>The opportunity</strong>\n\nA clear cluster of users opened, clicked, and came back across multiple channels but haven't converted yet — high intent, low friction. That's the group worth acting on first.\n\n" +
      "<strong>What I'd do next</strong>\n\nStop spreading budget evenly. Pull these recently-engaged, high-intent users into their own segment and target them with a focused journey. Want me to build that segment for you?",
    showDashboard: true,
    nextSuggestion: "Create a segment for these users.",
  },
  // Turn 2 — Segment agent: build the segment + hand back a segment card.
  {
    userPrompt: "Create a segment for these users.",
    navLabel: "Create segment",
    switchAgentId: "segment-agent",
    switchAgentLabel: "Segment agent",
    reasoningSteps: [
      "Reading the high-intent cluster from Insights",
      "Applying recency + engagement rules",
      "De-duplicating across channels",
      "Estimating the reachable audience",
    ],
    output:
      "I've built a segment from the high-intent, recently-engaged users the Insights agent surfaced — the people most likely to convert with one more nudge.\n\n" +
      "<strong>How I defined it</strong>\n\nOpened or clicked in the last 30 days, active on 2+ channels, and no purchase in the current cycle. I've excluded fatigued and unsubscribed users so we only message people who'll welcome it.",
    artifactCard: {
      kind: "segment",
      title: "High-Intent Re-Engagers",
      stats: [
        { icon: Users, label: "12,133 users" },
        { icon: Share2, label: "Active on 3 channels" },
      ],
      description:
        "Recently engaged, multi-channel users with high purchase intent and no conversion yet.",
      actionLabel: "Review segment",
    },
    nextSuggestion: "Now create a journey for this segment.",
  },
  // Turn 3 — Journey agent: design the journey + hand back a journey card.
  {
    userPrompt: "Now create a journey for this segment.",
    navLabel: "Create journey",
    switchAgentId: "journey-agent",
    switchAgentLabel: "Journey agent",
    reasoningSteps: [
      "Loading the High-Intent Re-Engagers segment",
      "Sequencing channels by responsiveness",
      "Setting entry, wait, and exit rules",
      "Wiring the conversion goal",
    ],
    output:
      "Here's a journey designed around how this segment actually behaves — it leads with the channels they respond to and stops the moment they convert.\n\n" +
      "<strong>How it flows</strong>\n\nEntry on segment match, an Email opener, a WhatsApp nudge for non-openers after 48 hours, and an APN reminder before exit. Anyone who purchases drops out automatically, so we never over-message.",
    artifactCard: {
      kind: "journey",
      title: "Re-Engagement Journey",
      stats: [
        { icon: Users, label: "12,133 users entering" },
        { icon: GitBranch, label: "4 steps · 3 channels" },
        { icon: Target, label: "Goal: first purchase" },
      ],
      description:
        "A 3-channel, conversion-capped journey that leads with Email and exits on purchase.",
      actionLabel: "Review journey",
    },
    nextSuggestion: "Estimate the impact this journey could have on conversions.",
  },
  // Turn 4 — routes the question back to the Insights agent (Journey agent →
  // Insights agent) with the standard switch-divider hand-off.
  {
    userPrompt: "Estimate the impact this journey could have on conversions.",
    navLabel: "Impact estimate",
    switchAgentId: "insight-agent",
    switchAgentLabel: "Insights agent",
    reasoningSteps: [
      "Loading the journey and its 12,133-user segment",
      "Applying per-channel click and conversion benchmarks",
      "Modeling step-by-step reach through the journey",
      "Projecting the conversion lift vs. this cycle",
    ],
    output:
      "I ran the Re-Engagement Journey against this segment's recent behavior — here's the realistic impact if it launches as designed.\n\n" +
      "<strong>Projected reach</strong>\n\nOf the 12,133 users entering, roughly 11,400 should receive at least one message — the Email opener lands near-100%, and the WhatsApp and APN follow-ups recover most non-openers.\n\n" +
      "<strong>Projected conversions</strong>\n\nAt this segment's blended click and conversion rates, expect ~700–850 first purchases over the journey window — a 55–70% lift over what these users would convert at on their own.\n\n" +
      "<strong>What moves the number</strong>\n\nThe 48-hour WhatsApp nudge is the swing factor — it re-captures about a third of Email non-openers. If WhatsApp delivery slips below ~70%, the projection falls to roughly 600 conversions, so watch it in week one.\n\n" +
      "<strong>My read</strong>\n\nThis journey should pay for itself within the first cycle. Launch it, and ask me to compare projection vs. actuals after the first week.",
  },
];

export interface Followup {
  label: string;
  q: string;
  a: string;
  statCards?: StatCard[];
  miniChart?: 'delivery' | 'rates';
}

export interface ConversationScript {
  /** Opening user prompt that seeds the story turn. */
  storyPrompt: string;
  /** Short nav label for the opening story turn (vertical line-nav). */
  storyNavLabel: string;
  /** The opening AI recap. Intro line renders above the metric tiles; each
   *  <strong> line is a standalone section header. */
  storyOutput: string;
  /** Reasoning steps shown in the opening "thinking" state. */
  storyReasoningSteps: string[];
  /** Doc-like artifact attached to the opening recap. */
  storyArtifact: { intro: string; title: string; subtitle: string };
  /** Reasoning steps shown in the follow-up ("chapter 2") thinking state. */
  followupReasoningSteps: string[];
  /** Scripted follow-up Q&A batch. followups[0] is shown as the user's own
   *  bubble; the rest unfold as the conversation continues. */
  followups: Followup[];
  /** Suggested follow-up chips shown under the first output. */
  suggestedPrompts: string[];
}

export const CONVERSATIONS: Record<ConversationVariant, ConversationScript> = {
  // --- Home (`/`) — the June 8–19 performance story -----------------------
  default: {
    storyPrompt:
      "We just wrapped our mid-June push — 50 campaigns across 6 channels between June 8 and 19. Everyone keeps telling me it “did well,” but I need the real story: how many messages actually reached people, where we’re losing the audience, and which channels turned attention into revenue. Walk me through it.",
    storyNavLabel: "June 8–19 recap",
    storyOutput:
      "Here’s the full story of your June 8–19 push — 50 campaigns across 6 channels, with one clear plot line: we earned plenty of attention, but most of it slips away before it becomes revenue.\n\n" +
      "<strong>The headline</strong>\n\nWe published 1.12M messages and delivered 589K of them — about a 52.5% delivery rate. Those reached audiences produced 5,016 clicks, 590 conversions, and ₹24.3L in revenue. A strong top of funnel, but a thin bottom.\n\n" +
      "<strong>Chapter 1 — Where the audience leaks</strong>\n\nDelivery is the first crack. WhatsApp carried the volume at 510K published but only 195K landed — we lost more than 60% before a single customer saw the message, and RCS and BPN tell the same story. The bright spots are Email, which delivered all 52K it sent, and APN at 47K of 57K. The first chart below makes the gap clear.\n\n" +
      "<strong>Chapter 2 — Where attention stalls</strong>\n\nAmong the messages that did land, WhatsApp leads on engagement at a 1.41% click rate, with SMS close behind. But conversion collapses across the board — Email clicks at 0.97% yet converts just 0.02%, and BPN converts almost no one. People are clicking; the journey after the click isn’t closing.\n\n" +
      "<strong>How the story ends</strong>\n\nJune wasn’t an attention problem — it was a delivery and conversion problem. Recover WhatsApp, RCS and BPN delivery and we widen reach without spending more; tighten the post-click experience on Email and we convert traffic we already have. Two levers, both ready for the next chapter.",
    storyReasoningSteps: [
      "Pulling 50 campaigns across 6 channels (Jun 8–19)",
      "Reconciling published vs delivered volumes",
      "Tracing where the audience drops off",
      "Linking engagement to revenue by channel",
    ],
    storyArtifact: {
      intro: "I've created the Highest Engagement Last Quarter summary in an artifact with all the information you provided, formatted and ready to use",
      title: "Highest Engagement Last Quarter",
      subtitle: "WhatsApp Document",
    },
    followupReasoningSteps: [
      "Re-checking WhatsApp published vs delivered",
      "Diagnosing the delivery gap",
      "Pulling template quality + opt-in status",
      "Estimating recoverable reach",
    ],
    followups: [
      {
        label: "WhatsApp delivery",
        q: "WhatsApp delivery looks brutal — only 195K of 510K landed. Why is it leaking that badly?",
        a:
          "<strong>Why WhatsApp delivery is only ~38%</strong>\n\nIt isn’t one failure — three issues stack up:\n• Stale opt-ins — much of the 510K hadn’t been messaged in 90+ days, so Meta drops them as inactive.\n• Template quality — two high-volume templates fell to a “Medium” rating after blocks, which throttles delivery.\n• Marketing caps — we hit the per-user limit for part of the list, so those sends were never attempted.\n\nIt never shows as a hard failure; it just surfaces as the gap between published and delivered, shown below.",
        statCards: [
          { label: "WhatsApp published", value: "510K", sub: "most of any channel" },
          { label: "Delivered", value: "195K", sub: "~38% delivery rate" },
          { label: "Lost in delivery", value: "315K", sub: "never reached" },
        ],
        miniChart: 'delivery',
      },
      {
        label: "Biggest fix",
        q: "If we could fix only one thing before the next send, what’s the single biggest lever?",
        a:
          "<strong>Fix delivery before anything else</strong>\n\nEngagement isn’t the problem — among messages that land, WhatsApp clicks at 1.41%, the best of any channel. The issue is that 60%+ never arrive.\n\nThe highest-ROI move is a list-hygiene and template pass on WhatsApp: suppress inactive numbers, replace the Medium-rated templates with fresh ones, and stagger sends under the marketing cap. It recovers reach we already paid to publish — at no extra cost.",
        statCards: [
          { label: "WhatsApp click rate", value: "1.41%", sub: "best of all channels" },
          { label: "Delivery gap", value: "62%", sub: "the real bottleneck" },
          { label: "Added spend to fix", value: "₹0", sub: "hygiene, not budget" },
        ],
      },
      {
        label: "Quantify upside",
        q: "Quantify it for me — if we recover WhatsApp delivery, what’s the upside?",
        a:
          "<strong>The upside, in round numbers</strong>\n\nWhatsApp delivers 195K today (~38%). Email proves a clean list can reach ~100% and APN already runs ~82%, so a realistic post-cleanup target is 70% delivery.\n\nThat lifts delivered volume to roughly 357K — about 162K more customers reached. At WhatsApp’s current click and conversion rates that’s ~2,280 more clicks and ~400 more conversions: a ~68% lift, with no added send cost.",
        statCards: [
          { label: "Delivered (target)", value: "~357K", sub: "from 195K" },
          { label: "Extra reach", value: "+162K", sub: "more customers" },
          { label: "Extra clicks", value: "~2,280", sub: "at 1.41% CTR" },
          { label: "Extra conversions", value: "~400", sub: "+68% on WhatsApp" },
        ],
      },
      {
        label: "Next-cycle plan",
        q: "Good. Draft the plan for the next cycle so I can share it with the team.",
        a:
          "<strong>Next-cycle plan — June recovery</strong>\n\nWhatsApp is the priority: scrub inactive numbers, swap the Medium-rated templates for High-rated ones, and stagger sends to target 70% delivery. For Email, delivery is already ~100% — the leak is post-click, so A/B test landing pages and tighten the offer-to-page match. RCS and BPN get the same hygiene playbook, since both lose ~60% in delivery.\n\nThe goal: recover ~162K in WhatsApp reach and lift conversions without increasing spend. I’ll prep the send calendar once you approve.",
        statCards: [
          { label: "Delivery target", value: "70%", sub: "from ~38%" },
          { label: "Reach recovered", value: "+162K", sub: "no extra send" },
          { label: "Added spend", value: "₹0", sub: "hygiene-driven" },
        ],
      },
    ],
    suggestedPrompts: [
      "Why is WhatsApp delivery only ~38%?",
      "What's the single biggest fix before the next send?",
      "If we recover WhatsApp delivery, what's the realistic upside?",
      "Draft the next-cycle plan I can share with the team",
    ],
  },

  // --- Campaigns (`/campaigns`) — separate storyline ----------------------
  // TODO: replace all placeholder copy below with the real campaigns storyline.
  campaigns: {
    storyPrompt:
      "TODO: campaigns opening prompt — what the user asks the co-marketer from the Campaigns page.",
    storyNavLabel: "Campaigns recap",
    storyOutput:
      "TODO: campaigns opening recap.\n\n" +
      "<strong>Section one</strong>\n\nTODO: first section of the campaigns story.\n\n" +
      "<strong>Section two</strong>\n\nTODO: second section of the campaigns story.",
    storyReasoningSteps: [
      "TODO: campaigns reasoning step 1",
      "TODO: campaigns reasoning step 2",
      "TODO: campaigns reasoning step 3",
    ],
    storyArtifact: {
      intro: "TODO: campaigns artifact intro line.",
      title: "TODO: Campaigns Artifact Title",
      subtitle: "TODO Document",
    },
    followupReasoningSteps: [
      "TODO: campaigns follow-up reasoning step 1",
      "TODO: campaigns follow-up reasoning step 2",
    ],
    followups: [
      {
        label: "Follow-up one",
        q: "TODO: first campaigns follow-up question (shown as the user's bubble).",
        a: "<strong>TODO: first follow-up answer</strong>\n\nTODO: body of the first campaigns follow-up answer.",
      },
      {
        label: "Follow-up two",
        q: "TODO: second campaigns follow-up question.",
        a: "<strong>TODO: second follow-up answer</strong>\n\nTODO: body of the second campaigns follow-up answer.",
      },
    ],
    suggestedPrompts: [
      "TODO: campaigns suggested prompt 1",
      "TODO: campaigns suggested prompt 2",
      "TODO: campaigns suggested prompt 3",
    ],
  },
};
