import type { SeededTopic } from "@/components/ChatInterface";
import type { AdhocCondition } from "./CampaignAudienceStep";
import { toLocalInput } from "./CampaignScheduleStep";

/**
 * The "Welcome new customers" starter chip's own scripted, autonomous
 * walkthrough — segment → craft the message → template → subject/pre-header
 * → schedule → summary, each step chained via openTopic() in
 * CampaignCreationOverlay.tsx's onSetupApply. Canned rather than computed,
 * same spirit as previewFindings.data.ts's "Exclusive Deals" review: a fixed
 * demo, not a claim about the account's real history — but every number
 * below is used consistently everywhere it's referenced, so it still reads
 * as one coherent dataset rather than a random one.
 */

export const WELCOME_SEGMENT_NAME = "New Customers — Last 60 Days";
export const WELCOME_SEGMENT_REACH = 21_764;
export const WELCOME_SEGMENT_CONDITIONS: AdhocCondition[] = [
  { attribute: "Signup date", type: "recency", operator: "in the last", value: "60 days" },
];
const WELCOME_SIMILAR_CAMPAIGNS = 18;

/** Step 0 — the segment agent's own hand-off: reads engagement history, scores
 *  the audience, and proposes it before anything is actually plotted onto
 *  "Send to". Nothing is applied to the form until "Use segment" is tapped —
 *  mirrors audienceCutsTopic's own hand-off shape. */
export function welcomeSegmentTopic(): SeededTopic {
  return {
    prompt: "Welcome new customers",
    navLabel: "Audience",
    agentId: "segment-agent",
    reasoningSteps: [
      "Resolving the 60-day join window",
      "Reading first-purchase and signup events",
      "De-duplicating repeat identities",
      "Checking channel reachability",
    ],
    reply:
      "Built — everyone who joined inside the last 60 days, as a rolling window rather than a fixed date range.\n\n" +
      "<strong>How I defined it</strong>\n\nFirst signup or first purchase within the last 60 days, de-duplicated across email and mobile identities. Because it's relative, the segment refreshes itself — contacts age out on day 61 without you touching it.\n\n" +
      "<strong>Worth knowing</strong>\n\nThis is your onboarding audience. It's the highest-intent group you have right now, and also the easiest to lose — the first 60 days is where most of your churn is decided.",
    setupApplyCard: {
      kind: "audience",
      title: "Audience match",
      applyLabel: "Use segment conditions",
      appliedLabel: "Segment applied",
      audience: `${WELCOME_SEGMENT_NAME} · ${WELCOME_SEGMENT_REACH.toLocaleString()} reachable`,
    },
  };
}

/** Step 1 — segment just applied to "Send to"; offers the next action. */
export function welcomeCraftMessageTopic(): SeededTopic {
  return {
    prompt: "Use segment conditions",
    navLabel: "Audience",
    reply: "I've got your audience. I can use past campaign performance to craft a message for them.",
    setupApplyCard: {
      kind: "cta",
      title: "Craft the message",
      applyLabel: "Craft the message",
      appliedLabel: "Crafting the message",
    },
  };
}

/** Step 2 — 3 template recommendations, scored against this audience. */
export function welcomeTemplatesTopic(): SeededTopic {
  return {
    prompt: "Craft the message",
    navLabel: "Message",
    agentId: "content-agent",
    agentSaying: "Let me recommend a template for this audience.",
    reasoningSteps: [
      "Analyzing past campaign performance for this audience",
      "Finding templates that have worked well with similar audiences",
    ],
    reply: "Based on past campaign performance for similar audiences, these templates are likely to perform well.",
    setupApplyCard: {
      kind: "templates",
      title: "Recommended templates",
      applyLabel: "Use template",
      appliedLabel: "Template applied",
      templates: [
        {
          templateId: 8289,
          name: "Welcome to the Family",
          description: "Best for introducing new customers to your brand and setting expectations.",
          estimatedEngagement: "18–22%",
          basedOnCampaigns: 12,
        },
        {
          templateId: 8283,
          name: "Double the Indulgence",
          description: "Designed for new customers with an irresistible welcome offer.",
          estimatedEngagement: "16–20%",
          basedOnCampaigns: 9,
        },
        {
          templateId: 868,
          name: "Exclusive Deals — Gold Members",
          description: "Works well for turning first-time buyers into repeat customers.",
          estimatedEngagement: "14–18%",
          basedOnCampaigns: 7,
        },
      ],
    },
  };
}

/** Step 3 — 3 subject/pre-header combinations for the chosen template. */
export function welcomeSubjectOptionsTopic(templateName: string): SeededTopic {
  return {
    prompt: `Use the "${templateName}" template`,
    navLabel: "Message",
    agentId: "content-agent",
    reasoningSteps: ["Comparing subject line performance across similar campaigns"],
    reply:
      "Great choice. Based on past performance of similar campaigns, here are a few subject lines and pre-headers that are likely to perform well.",
    setupApplyCard: {
      kind: "subjectOptions",
      title: "Recommended subject lines",
      applyLabel: "Use this",
      appliedLabel: "Subject applied",
      subjectOptions: [
        {
          subject: "Welcome to the family! Here's something special for you ✨",
          preHeader: "Enjoy a warm welcome and an exclusive first-order treat.",
          estimatedOpenRate: "24–28%",
        },
        {
          subject: "You're in! Let's get you started 👋",
          preHeader: "Discover what makes us different, right from your first order.",
          estimatedOpenRate: "22–26%",
        },
        {
          subject: "A little welcome gift, just for you 🎁",
          preHeader: "Because your first visit here deserves something special.",
          estimatedOpenRate: "20–24%",
        },
      ],
    },
  };
}

/** Step 4 — the two scheduling options. */
export function welcomeScheduleChoiceTopic(subject: string): SeededTopic {
  return {
    prompt: `Use "${subject}"`,
    navLabel: "Schedule",
    reply: "Your message is ready. Let's choose the best time to send it.",
    setupApplyCard: {
      kind: "scheduleChoice",
      title: "Choose how to schedule",
      applyLabel: "",
      appliedLabel: "",
    },
  };
}

/** Step 5a — send-time optimizer's own recommendation, from historical
 *  engagement-by-time-of-day data for this audience. */
export function welcomeSendTimeRecommendationTopic(): SeededTopic {
  return {
    prompt: "Send time optimizer",
    navLabel: "Schedule",
    agentId: "scheduler-agent",
    reasoningSteps: ["Finding when this audience is most active"],
    reply: "Based on past engagement from this audience and similar campaigns, the recommended send time is:",
    setupApplyCard: {
      kind: "sendTimeRecommendation",
      title: "Recommended send time",
      applyLabel: "Use recommended time",
      appliedLabel: "Send time applied",
      sendTimeRecommendation: {
        recommendedAt: "Tomorrow at 10:30 AM",
        reasoning: "Users in this segment are most active between 9:30 AM and 11:30 AM.",
        basedOnCampaigns: WELCOME_SIMILAR_CAMPAIGNS,
      },
    },
  };
}

/** A real, always-in-the-future datetime-local value for "tomorrow at 10:30
 *  AM" — the recommended slot's display text is fixed (matches the card
 *  above), but the value actually written to the schedule form has to be a
 *  live date, not a stale one from whenever this file was written. */
export function welcomeRecommendedSendAt(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(10, 30, 0, 0);
  return toLocalInput(d);
}

/** Step 6 — everything's set; a plain-text summary plus the review CTA. */
export function welcomeSummaryTopic({
  templateName,
  subject,
  sendTimeLabel,
}: {
  templateName: string;
  subject: string;
  sendTimeLabel: string;
}): SeededTopic {
  return {
    prompt: sendTimeLabel === "manual" ? "Schedule set" : "Use recommended time",
    navLabel: "Summary",
    reply:
      "Your campaign is ready to go.\n\n" +
      `<strong>Audience:</strong> ${WELCOME_SEGMENT_NAME}\n` +
      `<strong>Template:</strong> ${templateName}\n` +
      `<strong>Subject:</strong> ${subject}\n` +
      `<strong>Send time:</strong> ${sendTimeLabel === "manual" ? "As scheduled" : sendTimeLabel}\n\n` +
      "Recommendations were based on historical performance from similar campaigns.",
    setupApplyCard: {
      kind: "cta",
      title: "Launch campaign",
      applyLabel: "Launch campaign",
      appliedLabel: "Launching",
    },
  };
}
