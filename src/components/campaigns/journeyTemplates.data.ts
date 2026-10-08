import {
  Bell,
  BarChart3,
  Clock,
  Mail,
  MessageSquare,
  Smartphone,
  ShoppingCart,
  Star,
  Users,
  Zap,
  type LucideIcon,
} from "lucide-react";

/**
 * Data for the redesigned "What would you like to achieve?" template gallery
 * (Journey Creation flow). Post-Purchase Upsell mirrors the provided
 * reference exactly; the other five follow the same shape, inferred from
 * their card copy/channels.
 */

export type TemplateTone = "blue" | "green" | "amber" | "red";

export const TONE_HEX: Record<TemplateTone, { text: string; pale: string; line: string }> = {
  blue: { text: "#143F93", pale: "#F4F8FF", line: "#B9C4DD" },
  green: { text: "#22A565", pale: "#EAFAF2", line: "#A9E3C6" },
  amber: { text: "#B7791F", pale: "#FDF3DC", line: "#EACD8B" },
  red: { text: "#D92D20", pale: "#FDECEA", line: "#F0AFA8" },
};

export type ChannelId = "email" | "sms" | "in-app" | "push";

export const CHANNEL_META: Record<ChannelId, { label: string; icon: LucideIcon }> = {
  email: { label: "Email", icon: Mail },
  sms: { label: "SMS", icon: MessageSquare },
  "in-app": { label: "In-App", icon: Smartphone },
  push: { label: "Push", icon: Bell },
};

export interface JourneyPreviewStep {
  type: "trigger" | "wait" | "action";
  title: string;
  subtitle?: string;
  icon: LucideIcon;
  tone: "blue" | "amber";
}

export interface JourneyTemplate {
  id: string;
  title: string;
  description: string;
  industry: string;
  goal: { label: string; icon: LucideIcon; tone: TemplateTone };
  channels: ChannelId[];
  tags: string[];
  steps: number;
  setupMinutes: number;
  trigger: string;
  preview: JourneyPreviewStep[];
}

export const JOURNEY_TEMPLATES: JourneyTemplate[] = [
  {
    id: "post-purchase-review-request",
    title: "Post-Purchase Review Request",
    description: "Ask customers for a product review a few days after delivery.",
    industry: "E-commerce",
    goal: { label: "Collect Reviews", icon: Star, tone: "green" },
    channels: ["email", "sms"],
    tags: ["Post-purchase", "Reviews", "Retention"],
    steps: 4,
    setupMinutes: 4,
    trigger: "Order Delivered",
    preview: [
      { type: "trigger", title: "Trigger", subtitle: "Order Delivered", icon: Zap, tone: "blue" },
      { type: "wait", title: "Wait 2 days", icon: Clock, tone: "amber" },
      {
        type: "action",
        title: "Leave us a review",
        subtitle: "Review request email",
        icon: Mail,
        tone: "blue",
      },
      { type: "wait", title: "Wait 3 days", icon: Clock, tone: "amber" },
      {
        type: "action",
        title: "Still thinking it over? Leave a quick review",
        subtitle: "Review reminder SMS",
        icon: MessageSquare,
        tone: "blue",
      },
    ],
  },
  {
    id: "abandoned-checkout-reminder",
    title: "Abandoned Checkout Reminder",
    description: "Recover sales from customers who left items in their cart.",
    industry: "E-commerce",
    goal: { label: "Convert Sales", icon: ShoppingCart, tone: "blue" },
    channels: ["email", "sms"],
    tags: ["Abandonment", "Checkout", "Recovery"],
    steps: 3,
    setupMinutes: 5,
    trigger: "Cart Abandoned",
    preview: [
      { type: "trigger", title: "Trigger", subtitle: "Cart Abandoned", icon: Zap, tone: "blue" },
      { type: "wait", title: "Wait 1 hour", icon: Clock, tone: "amber" },
      {
        type: "action",
        title: "Complete your purchase",
        subtitle: "Cart reminder email",
        icon: Mail,
        tone: "blue",
      },
    ],
  },
  {
    id: "welcome-series",
    title: "Welcome Series",
    description: "Onboard new customers with a warm multi-touch welcome journey.",
    industry: "E-commerce",
    goal: { label: "Onboarding", icon: Users, tone: "green" },
    channels: ["email", "in-app"],
    tags: ["Welcome", "Onboarding", "New Customer"],
    steps: 3,
    setupMinutes: 5,
    trigger: "Signup Completed",
    preview: [
      { type: "trigger", title: "Trigger", subtitle: "Signup Completed", icon: Zap, tone: "blue" },
      { type: "wait", title: "Wait 1 day", icon: Clock, tone: "amber" },
      {
        type: "action",
        title: "Welcome aboard!",
        subtitle: "Getting-started tips",
        icon: Mail,
        tone: "blue",
      },
    ],
  },
  {
    id: "win-back-lapsed-customers",
    title: "Win-Back Lapsed Customers",
    description: "Re-engage customers who haven't purchased in 60+ days.",
    industry: "E-commerce",
    goal: { label: "Retention", icon: Star, tone: "amber" },
    channels: ["email", "push"],
    tags: ["Win-Back", "Retention", "Lapsed"],
    steps: 3,
    setupMinutes: 6,
    trigger: "60 Days Since Last Purchase",
    preview: [
      {
        type: "trigger",
        title: "Trigger",
        subtitle: "60 Days Since Last Purchase",
        icon: Zap,
        tone: "blue",
      },
      { type: "wait", title: "Wait 3 days", icon: Clock, tone: "amber" },
      {
        type: "action",
        title: "We miss you!",
        subtitle: "Special comeback offer",
        icon: Bell,
        tone: "blue",
      },
    ],
  },
  {
    id: "post-purchase-upsell",
    title: "Post-Purchase Upsell",
    description: "Target customers with complementary products after their first purchase.",
    industry: "E-commerce",
    goal: { label: "Revenue Growth", icon: BarChart3, tone: "blue" },
    channels: ["email", "sms"],
    tags: ["Upsell", "Post-Purchase", "Revenue"],
    steps: 3,
    setupMinutes: 6,
    trigger: "Order Completed",
    preview: [
      { type: "trigger", title: "Trigger", subtitle: "Order Completed", icon: Zap, tone: "blue" },
      { type: "wait", title: "Wait 2 days", icon: Clock, tone: "amber" },
      {
        type: "action",
        title: "You might also love…",
        subtitle: "Personalised product recs",
        icon: Mail,
        tone: "blue",
      },
    ],
  },
  {
    id: "trial-expiry-nudge",
    title: "Trial Expiry Nudge",
    description: "Convert free-trial users before their trial period ends.",
    industry: "E-commerce",
    goal: { label: "Conversion", icon: Zap, tone: "blue" },
    channels: ["email", "in-app", "push"],
    tags: ["Trial", "Conversion", "Upgrade"],
    steps: 3,
    setupMinutes: 5,
    trigger: "Trial Ending Soon",
    preview: [
      { type: "trigger", title: "Trigger", subtitle: "Trial Ending Soon", icon: Zap, tone: "blue" },
      { type: "wait", title: "Wait 1 day", icon: Clock, tone: "amber" },
      {
        type: "action",
        title: "Upgrade now",
        subtitle: "Trial expiry reminder",
        icon: Mail,
        tone: "blue",
      },
    ],
  },
  {
    id: "loyalty-reward-notification",
    title: "Loyalty Reward Notification",
    description: "Notify customers when they earn or are close to a loyalty reward.",
    industry: "E-commerce",
    goal: { label: "Engagement", icon: Bell, tone: "red" },
    channels: ["email", "sms", "push"],
    tags: ["Loyalty", "Rewards", "Engagement"],
    steps: 3,
    setupMinutes: 5,
    trigger: "Reward Threshold Reached",
    preview: [
      {
        type: "trigger",
        title: "Trigger",
        subtitle: "Reward Threshold Reached",
        icon: Zap,
        tone: "blue",
      },
      { type: "wait", title: "Wait 1 hour", icon: Clock, tone: "amber" },
      {
        type: "action",
        title: "You've earned a reward!",
        subtitle: "Loyalty points update",
        icon: Bell,
        tone: "blue",
      },
    ],
  },
];

export const GOAL_LABELS = Array.from(
  new Set(JOURNEY_TEMPLATES.map((t) => t.goal.label)),
);

export const INDUSTRY_LABELS = Array.from(
  new Set(JOURNEY_TEMPLATES.map((t) => t.industry)),
);
