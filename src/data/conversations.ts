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
import { Users, Share2 } from 'lucide-react';

export type ConversationVariant = 'default' | 'campaigns';

export type StatCard = { label: string; value: string; sub?: string };

// --- Agent artifact card (Segment) -------------------------------------------
// A compact doc-style card an agent hands back at the end of a turn. Mirrors the
// Figma "Segment agent card" (title · stat rows · description · review action).
export type AgentArtifactKind = 'segment';

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
// Insights → Segment → Insights. Each turn drops a centered "Switched to <agent>"
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
    nextSuggestion: "Estimate the impact reaching this segment could have on conversions.",
  },
  // Turn 3 — hands back to the Insights agent (Segment agent → Insights agent)
  // to size the opportunity on the segment Segment agent just built.
  {
    userPrompt: "Estimate the impact reaching this segment could have on conversions.",
    navLabel: "Impact estimate",
    switchAgentId: "insight-agent",
    switchAgentLabel: "Insights agent",
    reasoningSteps: [
      "Loading the High-Intent Re-Engagers segment",
      "Applying per-channel click and conversion benchmarks",
      "Modeling reach across Email, WhatsApp, and APN",
      "Projecting the conversion lift vs. this cycle",
    ],
    output:
      "I ran this segment against your recent channel benchmarks — here's the realistic impact if you target it directly.\n\n" +
      "<strong>Projected reach</strong>\n\nOf the 12,133 users in this segment, roughly 11,400 should receive at least one message if you lead with Email and follow up on WhatsApp and APN for non-openers.\n\n" +
      "<strong>Projected conversions</strong>\n\nAt this segment's blended click and conversion rates, expect ~700–850 first purchases — a 55–70% lift over what these users would convert at on their own.\n\n" +
      "<strong>What moves the number</strong>\n\nA WhatsApp follow-up within 48 hours is the swing factor — it re-captures about a third of Email non-openers. If WhatsApp delivery slips below ~70%, the projection falls to roughly 600 conversions, so watch it in week one.\n\n" +
      "<strong>My read</strong>\n\nTargeting this segment directly should pay for itself within the first cycle. Launch it, and ask me to compare projection vs. actuals after the first week.",
  },
];

// --- Deep-research narratives (available from ANY co-marketer chat) ---------
// A small registry of scripted deep-research "topics" that can play from any
// storyline (`default`/`campaigns`), independent of how the chat was opened.
// Each topic runs one of two shapes:
//   • 'two-step' — the Insights agent gives a fast read and offers to go deeper
//     (a single follow-up chip); taking the offer kicks off the research.
//   • 'direct'   — the opener goes straight into a running deep research.
// The research turn is identical for both: a Co-marketer lead-in → thinking →
// a ChatGPT-style plan card. Tapping "Start" self-drives the card to the doc.
// The plan card + document reuse DeepResearchPlan / DeepResearchDoc, so all the
// "researching…" progress and skeleton→report machinery comes for free.
export interface DeepResearchDoc {
  title: string;
  citations: number;
  summaryHeading: string;
  docFeedback: boolean;
  paragraphs: string[];
}

export interface DeepResearchTopic {
  /** Stable id (debug / analytics). */
  id: string;
  /** 'two-step' opens with an Insights read + offer; 'direct' researches now. */
  mode: 'two-step' | 'direct';
  /** True when a user's message should open this topic. */
  matches: (m: string) => boolean;

  // --- two-step only: the opening Insights turn + the chip that goes deeper ---
  insightNavLabel?: string;
  insightReasoningSteps?: string[];
  /** The Insights agent's fast read. Each <strong> line is a section header. */
  insightOutput?: string;
  /** The single suggested chip shown after the insight. */
  followupChip?: string;

  // --- the research turn (both modes) ---------------------------------------
  /** Nav label for the turn that spins up the research. */
  researchNavLabel: string;
  /** The Co-marketer's "let me run a deep research while you work" lead-in. */
  leadIn: string;
  /** Reasoning steps shown while the plan is drafted (before the plan card). */
  planReasoningSteps: string[];
  /** The plan card the user taps "Start" on. */
  plan: { title: string; steps: string[] };
  /** A short Co-marketer line shown above the finished document (frames the
   *  result so the report doesn't land cold). */
  resultLeadIn: string;
  /** The finished report the plan card swaps itself into. */
  doc: DeepResearchDoc;
}

export const DEEP_RESEARCH_TOPICS: DeepResearchTopic[] = [
  // --- WhatsApp channel performance (two-step: insight → offer → research) ---
  {
    id: 'whatsapp-performance',
    mode: 'two-step',
    // Deliberately specific (WhatsApp + a "how's it doing" intent) so it doesn't
    // hijack unrelated prompts.
    matches: (m) =>
      m.includes('whatsapp') &&
      ['how', 'performing', 'performance', 'doing', 'this quarter', 'channel'].some((k) => m.includes(k)),
    insightNavLabel: 'WhatsApp this quarter',
    insightReasoningSteps: [
      "Pulling this quarter's WhatsApp campaigns",
      'Reconciling published vs delivered volumes',
      'Comparing engagement against Email and APN',
      'Spotting where the channel leaks',
    ],
    insightOutput:
      "Here's the quick read on WhatsApp this quarter — it's your widest-reaching channel on paper, but most of that reach never actually lands.\n\n" +
      "<strong>What stands out</strong>\n\nWhatsApp published more than any other channel, yet delivered the least of what it sent — over 60% never reached a person. Among the messages that do land, it's your strongest performer, clicking at ~1.41%, ahead of every other channel.\n\n" +
      "<strong>Where it's leaking</strong>\n\nThe gap isn't the audience — it's a handful of low-rated templates and unverified sender numbers throttling delivery, plus stale opt-ins Meta drops as inactive. That's mechanical, which means most of it is recoverable without spending more.\n\n" +
      "<strong>My read</strong>\n\nThis is a delivery problem wearing an engagement costume. There's a real, sizeable upside sitting in reach you've already paid to publish — but pinning the exact number means going campaign-by-campaign, template-by-template. Want me to run a full deep research on it?",
    followupChip: 'Yes — run a full deep research on WhatsApp performance',
    researchNavLabel: 'Deep research',
    leadIn:
      "Good call — this one deserves a proper dig, not a quick answer. I'll run a deep research across every WhatsApp campaign, template, and send this quarter, benchmark it against your other channels, and come back with the recoverable upside and the exact fixes.\n\n" +
      "It runs in the background and takes a few minutes, so you can keep working while it does — I'll drop the finished document right here when it's ready. Here's the plan I'll follow:",
    planReasoningSteps: [
      'Framing the research question and scope',
      'Mapping the WhatsApp delivery and engagement sources to pull',
      'Drafting the research plan before running',
    ],
    plan: {
      title: 'WhatsApp channel performance — this quarter',
      steps: [
        "Pull this quarter's WhatsApp delivery, open, and click-through rates across every campaign.",
        'Break down where messages are lost — undelivered, blocked, and opted-out — and size the leak.',
        'Benchmark WhatsApp against Email, SMS, and APN for the same audiences and journeys.',
        'Identify the segments, templates, and send-times driving the strongest WhatsApp engagement.',
        'Recommend the fixes most likely to recover delivery and lift conversions next quarter.',
      ],
    },
    resultLeadIn:
      "All done — here's the finished deep research on your WhatsApp channel this quarter. The short version: your reach is healthy, your delivery isn't, and most of the gap is recoverable at no extra send cost. The full document's below, and you can expand or schedule it from here.",
    doc: {
      title: 'WhatsApp Channel Performance — This Quarter',
      citations: 0,
      summaryHeading: 'Executive summary',
      docFeedback: true,
      paragraphs: [
        "WhatsApp was your highest-reach channel this quarter and your lowest-delivery one at the same time. It published the most messages of any channel but <strong>delivered only ~38% of them — more than 60% never landed</strong>. Critically, the messages that did arrive out-performed every other channel on engagement, clicking at ~1.41%. The channel isn't weak; its reach is being lost at the delivery step, which makes most of the shortfall recoverable at no additional send cost.",
        "<strong>Where the volume goes.</strong> Of everything WhatsApp published, roughly 38% was delivered, ~2% bounced as hard failures, and the remaining ~60% was silently dropped before reaching a handset. That silent drop traces to three stacking causes: <strong>stale opt-ins</strong> (numbers not messaged in 90+ days, which Meta suppresses as inactive), <strong>template quality</strong> (two high-volume templates fell to a “Medium” rating after user blocks, which throttles their delivery), and <strong>marketing-cap collisions</strong> (part of the list hit the per-user message limit, so those sends were never attempted). None of these surface as an error — they only show up as the gap between published and delivered.",
        "<strong>Templates are the single biggest lever.</strong> Just three templates account for the majority of undelivered volume. Their Medium quality rating compounds the problem: lower rating throttles throughput, throttling depresses engagement signals, and weak signals hold the rating down. Replacing these with fresh, High-rated templates breaks that loop and is the highest-leverage fix available this cycle.",
        "<strong>Benchmark against your other channels.</strong> Email proves a clean list can reach ~100% delivery, and APN already runs ~82%. WhatsApp sits far below both on delivery yet <strong>leads all of them on click-through</strong> among delivered messages. In other words, the audience wants to hear from you on WhatsApp — the pipe to reach them is the constraint, not the appetite.",
        "<strong>Who's worth protecting.</strong> A cluster of high-intent, multi-channel users — people active on WhatsApp plus at least one other channel who've clicked recently but not yet converted — are disproportionately caught in the delivery gap. These are your most valuable and most winnable users, and they're the ones most affected by the dropped sends.",
        "<strong>The recoverable upside.</strong> If delivery recovers to a realistic ~85% (below Email, in line with a cleaned WhatsApp list), delivered volume roughly doubles. At WhatsApp's current click and conversion rates, we estimate <strong>~4,800 recovered conversations and an 18–24% lift in WhatsApp-attributed conversions next quarter</strong> — captured entirely from reach you've already paid to publish, with ₹0 in added send cost.",
        "<strong>Recommended next steps.</strong> In priority order: (1) scrub inactive numbers and re-confirm opt-ins before the next send; (2) retire the three Medium-rated templates and ship fresh High-rated replacements; (3) re-verify sender identities so throttling lifts; (4) re-sequence the 48-hour follow-up so it recovers non-openers instead of re-hitting the same audience; and (5) stagger sends to stay under the per-user marketing cap. Steps 1–2 alone should recover the bulk of the delivery gap.",
        "<strong>What to watch in week one.</strong> WhatsApp delivery rate is the leading indicator — if it holds at or above ~70% after the template and list changes, the full projection is on track. If it slips below 70%, expect the conversion upside to land closer to the bottom of the range, and prioritize the sender-verification step first.",
      ],
    },
  },

  // --- Last-30-days revenue (direct: opener → running deep research) ---------
  {
    id: 'revenue-last-30-days',
    mode: 'direct',
    // "revenue" plus a recency/marketing intent — matches e.g. "tell me the last
    // 30 days of revenue in something more marketing-friendly".
    matches: (m) =>
      m.includes('revenue') &&
      ['30 day', 'last 30', 'last month', 'past month', 'month', 'marketing'].some((k) => m.includes(k)),
    researchNavLabel: 'Revenue deep research',
    leadIn:
      "On it — a headline revenue number is easy, but a number you can actually act on takes a proper dig. I'll run a deep research across the last 30 days of revenue, break it down the way a marketer thinks — by channel, campaign, segment, and journey — and turn it into a plain-English read with the moves worth making.\n\n" +
      "It runs in the background and takes a few minutes, so keep working — I'll drop the finished document right here when it's ready. Here's the plan I'll follow:",
    planReasoningSteps: [
      'Framing the revenue question in marketing terms',
      'Mapping the attribution, channel, and journey sources to pull',
      'Drafting the research plan before running',
    ],
    plan: {
      title: 'Last 30 days of revenue — a marketing-ready read',
      steps: [
        'Pull total marketing-attributed revenue for the last 30 days and compare it to the prior 30.',
        'Break revenue down by channel, campaign, and segment to see where it actually concentrates.',
        'Trace revenue back to journeys and send-times to find the moments that convert.',
        'Flag the fastest-growing and fastest-declining pockets, and what is driving each.',
        'Turn it into plain-English takeaways and the next best marketing moves.',
      ],
    },
    resultLeadIn:
      "All done — here's the finished read on your last 30 days of revenue, in plain marketing terms. The short version: this was a conversion win, not a traffic one, which means it's repeatable. The full document's below, and you can expand or schedule it from here.",
    doc: {
      title: 'Revenue — Last 30 Days (Marketing Read)',
      citations: 0,
      summaryHeading: 'Executive summary',
      docFeedback: true,
      paragraphs: [
        "Marketing-attributed revenue over the last 30 days was <strong>₹2.41 Cr, up +14.2% versus the prior 30 days</strong>. Reach was essentially flat, so the growth came from converting the audience you already have more effectively — not from sending more. In plain terms: the same list is worth more this month because a few journeys and one channel are pulling harder.",
        "<strong>Where the money comes from.</strong> Email is the workhorse at <strong>41% of attributed revenue</strong> on near-100% delivery, followed by a recovering WhatsApp and a quietly strong month for Push on click-through. SMS is the one channel trending the wrong way — engagement slipped for the third month running and it's now your least efficient rupee. The revenue is more concentrated than it looks: your top three campaigns drive roughly half of it.",
        "<strong>What's actually moving the number.</strong> Automated journeys are carrying the growth. Welcome, Abandoned Cart, and Win-back together account for <strong>68% of automated revenue</strong>, and Abandoned Cart alone jumped +31% after the 48-hour follow-up was re-sequenced — a single timing change worth a visible slice of the month. High-intent, multi-channel users remain your most valuable and fastest-growing segment.",
        "<strong>Where you're leaving money.</strong> Two soft spots: SMS templates are fatiguing and dragging efficiency, and a sizeable dormant segment hasn't been touched in 60+ days despite prior purchase history. Both are recoverable with re-engagement rather than new acquisition spend.",
        "<strong>The marketing-friendly takeaway.</strong> This wasn't a traffic win, it was a conversion win — and conversion wins are repeatable. The engine to lean on is clear: your automated journeys and Email, aimed at high-intent multi-channel users, with Push as the rising utility channel.",
        "<strong>Next best moves.</strong> In priority order: (1) scale the re-sequenced Abandoned Cart journey to more segments while the +31% lift holds; (2) refresh the two fatiguing SMS templates or shift that budget to Push, where cost-per-conversion is now lowest; (3) launch a Win-back to the 60-day dormant segment; and (4) protect Email deliverability, since it underwrites 41% of the number. Together these defend the +14.2% and set up next month's growth from the same audience.",
      ],
    },
  },
];

// Returns the topic a user's opening message should launch, or null if none.
export function resolveDeepResearchOpener(message: string): DeepResearchTopic | null {
  const m = message.toLowerCase();
  return DEEP_RESEARCH_TOPICS.find((t) => t.matches(m)) ?? null;
}

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
