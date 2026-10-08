import { emailTemplates, type EmailTemplate } from "./campaign-creation/emailTemplates.data";

/**
 * "Email" action node — a lightweight, journey-scoped settings screen (pick
 * a template, write the subject/pre-header, set the sender), not the full
 * multi-step campaign composer. Template choices reuse this account's real
 * saved templates (campaign-creation/emailTemplates.data) rather than a
 * separate invented list, with the win-back template surfaced first since
 * it already fits a cart-abandonment send.
 */
export { type EmailTemplate };

const FEATURED_ID = 9101; // "Still Thinking About It? — Free Shipping"

export const EMAIL_NODE_TEMPLATES: EmailTemplate[] = [
  ...emailTemplates.filter((t) => t.id === FEATURED_ID),
  ...emailTemplates.filter((t) => t.id !== FEATURED_ID),
];

/** Verified sending domains — same list the campaign composer's own
 *  "Sender email" field offers (CampaignContentStep's DOMAINS). */
export const EMAIL_DOMAINS = ["m3m.in", "mailer.m3m.in", "news.m3m.in", "offers.m3m.in"];

/** Where a recipient's reply lands — a fixed illustrative set, same spirit
 *  as the campaign composer's own "Reply email id" field. */
export const REPLY_TO_INBOXES = ["Do not reply", "Support Inbox", "Sales Inbox"];

export type EmailFormat = "html" | "amp";

export interface EmailSetting {
  messageName: string;
  senderName: string;
  emailFormat: EmailFormat;
  senderEmail: string;
  senderDomain: string;
  /** "" means no reply-to inbox configured (optional field). */
  replyToInbox: string;
  templateId: number | null;
  subject: string;
  preheader: string;
  personalizeLatestActivity: boolean;
  googleAnalyticsTracking: boolean;
}

export const DEFAULT_EMAIL_SETTING: EmailSetting = {
  messageName: "",
  senderName: "",
  emailFormat: "html",
  senderEmail: "",
  senderDomain: EMAIL_DOMAINS[0],
  replyToInbox: "",
  templateId: null,
  subject: "",
  preheader: "",
  personalizeLatestActivity: false,
  googleAnalyticsTracking: false,
};

export function isEmailValid(s: EmailSetting): boolean {
  return (
    s.messageName.trim() !== "" &&
    s.senderName.trim() !== "" &&
    s.senderEmail.trim() !== "" &&
    s.senderDomain.trim() !== "" &&
    s.subject.trim() !== "" &&
    s.templateId !== null
  );
}

/** The sentence shown on the canvas node once saved, e.g.
 *  "Send 'Still Thinking About It? — Free Shipping'". */
export function describeEmail(s: EmailSetting): string {
  const template = EMAIL_NODE_TEMPLATES.find((t) => t.id === s.templateId);
  return template ? `Send "${template.name}"` : "Send an email";
}
