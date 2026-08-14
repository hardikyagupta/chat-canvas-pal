/**
 * Saved email templates for the Content step's picker.
 *
 * `preview` decides what the card's thumbnail draws. Most saved templates in a
 * real account have never had a thumbnail generated, which is why "none" — the
 * empty-frame placeholder — is the common case rather than the exception.
 */
export type TemplatePreview =
  | "none"
  | "watch"
  | "brand"
  | "heading"
  | "band"
  | "fashion"
  | "text"
  | "receipt";

export interface EmailTemplate {
  id: number;
  name: string;
  preview: TemplatePreview;
  /** Shown under "Create new" and in filters; also drives the AI badge. */
  aiGenerated?: boolean;
}

/** The most recently touched templates — these carry real thumbnails. */
const RECENT: EmailTemplate[] = [
  { id: 868, name: "New launch (1)", preview: "watch" },
  { id: 8289, name: "adda", preview: "brand" },
  { id: 8286, name: "testtemplatenam", preview: "none" },
  { id: 8284, name: "swsaz", preview: "heading" },
  { id: 8283, name: "Test-Amit-4zc", preview: "band" },
  { id: 8281, name: "Limited-time offerafaf", preview: "fashion" },
  { id: 8280, name: "adaaf23e", preview: "none" },
  { id: 8278, name: "product feed", preview: "none" },
  { id: 8273, name: "tesfsfsfff", preview: "text" },
  { id: 8275, name: "adfe", preview: "receipt" },
];

/**
 * The long tail. Real accounts accumulate hundreds of half-named drafts, so the
 * picker has to page — these give the pager something honest to page through.
 */
const TAIL_NAMES = [
  "Festive teaser v2",
  "Cart nudge — 24h",
  "adfsdf",
  "Welcome series 01",
  "Welcome series 02",
  "Winback — 60 day",
  "Loyalty tier upgrade",
  "test copy final",
  "Weekend drop",
  "Price drop alert",
  "asdasd23",
  "Back in stock",
  "Order confirmation",
  "Referral invite",
  "NPS follow-up",
  "Monsoon sale hero",
  "temp-clone-3",
  "App install push-through",
  "Birthday offer",
  "Restock reminder",
  "Q3 newsletter",
  "flash-sale-copy",
  "Abandoned browse",
  "Free shipping banner",
  "test-amit-99",
  "Membership renewal",
  "Category spotlight",
  "New arrivals grid",
  "Post-purchase thanks",
  "dfgdfg",
  "Survey invite",
  "Clearance final call",
  "Bundle offer",
  "Early access invite",
  "Wishlist price cut",
  "draft-untitled-7",
  "Store event RSVP",
  "Reactivation nudge",
];

/** Deterministic preview mix so cards don't all look identical down the pages. */
const TAIL_PREVIEWS: TemplatePreview[] = ["none", "none", "band", "none", "text", "none", "heading"];

const TAIL: EmailTemplate[] = TAIL_NAMES.map((name, i) => ({
  id: 8270 - i * 3,
  name,
  preview: TAIL_PREVIEWS[i % TAIL_PREVIEWS.length],
}));

export const emailTemplates: EmailTemplate[] = [...RECENT, ...TAIL];

/** Blank starting points offered under the "Create new" tab. */
export const templateStarters = [
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
