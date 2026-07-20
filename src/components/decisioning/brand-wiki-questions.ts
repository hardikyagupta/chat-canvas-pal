import { Building2, Megaphone, MessageSquare, Tag, User } from "lucide-react";

export interface BrandWikiQuestion {
  id: string;
  label: string;
  placeholder: string;
  /** Render a multi-line textarea instead of a single-line input. */
  multiline?: boolean;
}

export interface BrandWikiQuestionGroup {
  id: string;
  title: string;
  subtitle: string;
  Icon: typeof Building2;
  /** Tailwind classes for the icon tile (bg + text). */
  tile: string;
  questions: BrandWikiQuestion[];
}

/**
 * The detailed brand questionnaire. Answers are stored on
 * BrandWikiData.answers keyed by question id, so the counts here drive the
 * "N questions" badge shown in the brand wiki UIs.
 */
export const BRAND_WIKI_GROUPS: BrandWikiQuestionGroup[] = [
  {
    id: "about",
    title: "About your brand",
    subtitle: "Core identity, mission, values, positioning",
    Icon: Building2,
    tile: "bg-[#E7EDFF] text-[#2F68E5]",
    questions: [
      { id: "about_mission", label: "What is your brand's mission?", placeholder: "The change you exist to make" },
      { id: "about_values", label: "What are your core values?", placeholder: "The principles that guide decisions" },
      { id: "about_story", label: "What is your brand's origin story?", placeholder: "How and why the brand started", multiline: true },
      { id: "about_positioning", label: "How do you position yourself against competitors?", placeholder: "What sets you apart in the market" },
      { id: "about_unique", label: "What makes your brand unique?", placeholder: "Your defining strength" },
      { id: "about_vision", label: "What is your vision for the future?", placeholder: "Where the brand is headed" },
    ],
  },
  {
    id: "products",
    title: "Products & services",
    subtitle: "What you offer and how you describe it",
    Icon: Tag,
    tile: "bg-[#E5F6EC] text-[#1F9D57]",
    questions: [
      { id: "products_offer", label: "What products or services do you offer?", placeholder: "Your main offerings", multiline: true },
      { id: "products_flagship", label: "What are your flagship or best-selling products?", placeholder: "The hero products" },
      { id: "products_pricing", label: "How do you describe your pricing?", placeholder: "e.g. Premium, value, subscription" },
      { id: "products_problems", label: "What problems do your products solve?", placeholder: "The customer need you address" },
      { id: "products_categories", label: "What are your product categories?", placeholder: "How your catalogue is organised" },
    ],
  },
  {
    id: "customers",
    title: "Customers",
    subtitle: "Audience segments, personas, needs",
    Icon: User,
    tile: "bg-[#EFEAFE] text-[#7C4DFF]",
    questions: [
      { id: "customers_segments", label: "Who are your primary customer segments?", placeholder: "Key audiences you serve" },
      { id: "customers_persona", label: "Describe your ideal customer persona.", placeholder: "Demographics, behaviour, goals", multiline: true },
      { id: "customers_needs", label: "What are your customers' main needs and pain points?", placeholder: "What they are trying to solve" },
      { id: "customers_motivation", label: "What motivates your customers to buy?", placeholder: "Triggers and drivers" },
    ],
  },
  {
    id: "voice",
    title: "Brand voice & messaging",
    subtitle: "Tone, language, key messages",
    Icon: MessageSquare,
    tile: "bg-[#FDEFE2] text-[#E77817]",
    questions: [
      { id: "voice_tone", label: "How would you describe your tone of voice?", placeholder: "e.g. Warm, confident, never pushy" },
      { id: "voice_use", label: "What words or phrases do you always use?", placeholder: "Signature language" },
      { id: "voice_avoid", label: "What words or phrases do you avoid?", placeholder: "Off-limits language" },
      { id: "voice_messages", label: "What are your key brand messages?", placeholder: "The points you repeat", multiline: true },
      { id: "voice_tagline", label: "What is your tagline or slogan?", placeholder: "Your signature line" },
    ],
  },
  {
    id: "marketing",
    title: "Marketing & communication",
    subtitle: "Channels, content, campaigns",
    Icon: Megaphone,
    tile: "bg-[#FCE7F3] text-[#DB2777]",
    questions: [
      { id: "marketing_channels", label: "Which marketing channels do you use most?", placeholder: "e.g. Email, SMS, push, social" },
      { id: "marketing_content", label: "What type of content performs best for you?", placeholder: "Formats and themes that work" },
      { id: "marketing_campaigns", label: "What are your typical campaign themes?", placeholder: "Recurring moments and hooks" },
      { id: "marketing_cadence", label: "How often do you communicate with customers?", placeholder: "e.g. Weekly newsletter, seasonal pushes" },
    ],
  },
];

export const BRAND_WIKI_TOTAL_QUESTIONS = BRAND_WIKI_GROUPS.reduce(
  (n, g) => n + g.questions.length,
  0
);
