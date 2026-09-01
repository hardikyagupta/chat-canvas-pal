import thumbExclusiveDeals from "/campaign-assets/template-thumbs/tpl-exclusive-deals.png";
import thumbWelcomeFamily from "/campaign-assets/template-thumbs/tpl-welcome-family.png";
import thumbPriceDrop from "/campaign-assets/template-thumbs/tpl-price-drop.png";
import thumbGiftCouple from "/campaign-assets/template-thumbs/tpl-gift-couple.png";
import thumbDoubleIndulgence from "/campaign-assets/template-thumbs/tpl-double-indulgence.jpg";
import thumbIndependenceDay from "/campaign-assets/template-thumbs/tpl-independence-day.png";
import thumbElevatedGrooming from "/campaign-assets/template-thumbs/tpl-elevated-grooming.jpg";
import thumbPanchpushp from "/campaign-assets/template-thumbs/tpl-panchpushp.jpg";
import thumbFragranceNotes from "/campaign-assets/template-thumbs/tpl-fragrance-notes.jpg";
import thumbCologneLaunch from "/campaign-assets/template-thumbs/tpl-cologne-launch.jpg";

/**
 * Saved email templates for the Content step's picker.
 *
 * `image` is a real, rendered thumbnail (cropped to the top of the template)
 * for the account's recent templates. `preview` decides what the card draws
 * instead when there's no `image` — most saved templates in a real account
 * have never had a thumbnail generated, which is why "none", the empty-frame
 * placeholder, is the common case rather than the exception there.
 */
export type TemplatePreview =
  | "none"
  | "launch"
  | "brand"
  | "heading"
  | "band"
  | "giftset"
  | "text"
  | "receipt"
  | "skincare";

export interface EmailTemplate {
  id: number;
  name: string;
  preview: TemplatePreview;
  /** A real rendered thumbnail; takes over from `preview` when set. */
  image?: string;
  /** Shown under "Create new" and in filters; also drives the AI badge. */
  aiGenerated?: boolean;
}

/** The most recently touched templates — these carry real thumbnails. */
const RECENT: EmailTemplate[] = [
  { id: 868, name: "Exclusive Deals — Gold Members", preview: "none", image: thumbExclusiveDeals },
  { id: 8289, name: "Welcome to the Family", preview: "none", image: thumbWelcomeFamily },
  { id: 8286, name: "Price Drop Alert", preview: "none", image: thumbPriceDrop },
  { id: 8284, name: "Festive Gifting — Couple", preview: "none", image: thumbGiftCouple },
  { id: 8283, name: "Double the Indulgence", preview: "none", image: thumbDoubleIndulgence },
  { id: 8281, name: "Independence Day Delight", preview: "none", image: thumbIndependenceDay },
  { id: 8280, name: "Elevated Grooming Rituals", preview: "none", image: thumbElevatedGrooming },
  { id: 8278, name: "Panchpushp Launch", preview: "none", image: thumbPanchpushp },
  { id: 8273, name: "Fragrance Notes — Cologne", preview: "none", image: thumbFragranceNotes },
  { id: 8275, name: "Introducing the New Cologne", preview: "none", image: thumbCologneLaunch },
];

export const emailTemplates: EmailTemplate[] = RECENT;

/** Blank starting points offered under the "Create new" tab. */
export const templateStarters = [
  {
    id: "ai",
    name: "Create with AI",
    description: "Use co-marketer to create interactive templates.",
  },
  {
    id: "drag-drop",
    name: "Drag & drop editor",
    description: "Build the email visually from blocks — no code needed.",
  },
  {
    id: "rich-text",
    name: "Rich text",
    description: "A plain, text-first email that renders anywhere.",
  },
  {
    id: "html",
    name: "Import HTML",
    description: "Paste or upload HTML you've already built.",
  },
] as const;
