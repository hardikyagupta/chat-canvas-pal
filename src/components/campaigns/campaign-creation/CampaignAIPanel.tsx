import {
  BarChart3,
  Check,
  ChevronRight,
  Info,
  Tag,
  Target,
  Users,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import sparkle from "/campaign-assets/ic-sparkle-ai.gif";
import type { SetupApplyCardData } from "./SetupApplyCard";
import type { SetupValues } from "./CampaignSetupStep";

export type SuggestionId = "tags" | "tracking" | "conversion" | "audience";

export interface CampaignSuggestion {
  id: SuggestionId;
  title: string;
  /** Short line on the list card (omitted when `tags` is set). */
  blurb?: string;
  tags?: string[];
  icon: LucideIcon;
  iconWrap: string;
  iconColor: string;
  /** What the user "asks" when they tap the card — seeds the chat thread. */
  prompt: string;
  navLabel: string;
  /** Spoken reply in the thread; the apply card carries the values. */
  reply: string;
  applyLabel: string;
  appliedLabel: string;
  patch: Partial<SetupValues>;
}

export function toSetupApplyCard(s: CampaignSuggestion): SetupApplyCardData {
  return {
    kind: s.id,
    title: s.title,
    applyLabel: s.applyLabel,
    appliedLabel: s.appliedLabel,
    tags: s.tags,
    conversionEvent: s.patch.conversionEvent,
    audience: s.patch.audienceSuggestion,
    blurb: s.blurb,
    patch: s.patch,
  };
}

const ICON: Record<
  SuggestionId,
  { icon: LucideIcon; iconWrap: string; iconColor: string }
> = {
  tags: { icon: Tag, iconWrap: "bg-[#E6F8F0]", iconColor: "text-[#00A86B]" },
  tracking: { icon: BarChart3, iconWrap: "bg-[#E8F0FE]", iconColor: "text-[#2F68E5]" },
  conversion: { icon: Target, iconWrap: "bg-[#F0E8FF]", iconColor: "text-[#7B5CFA]" },
  audience: { icon: Users, iconWrap: "bg-[#FFF1E6]", iconColor: "text-[#E07A2F]" },
};

function tagsForGoal(goal: string): string[] {
  switch (goal) {
    case "promo-offer":
      return ["sale", "promo", "limited-time"];
    case "reengage-dormant":
      return ["reengagement", "q3-retention", "email"];
    case "first-purchase":
      return ["first-purchase", "conversion", "welcome"];
    case "repeat-purchase":
      return ["loyalty", "repeat", "retention"];
    case "abandoned-cart":
      return ["cart-recovery", "checkout", "urgency"];
    case "product-launch":
      return ["launch", "new-product", "announcement"];
    case "onboarding":
      return ["onboarding", "welcome", "activation"];
    case "winback":
      return ["winback", "churn", "last-chance"];
    default:
      return ["campaign", "email"];
  }
}

function suggestionsFor(goal: string, stepId: string): CampaignSuggestion[] {
  const tags = tagsForGoal(goal);
  const isPromo = goal === "promo-offer";
  const isCart = goal === "abandoned-cart";

  if (stepId === "setup") {
    return [
      {
        id: "tags",
        title: "Suggested tags",
        tags,
        ...ICON.tags,
        prompt: "What tags should I put on this campaign?",
        navLabel: "Tagging help",
        reply:
          "I'd use these three — they match how you already group similar campaigns, so this one lands in the quarterly rollup without anyone backfilling it later.",
        applyLabel: "Add tags to campaign",
        appliedLabel: "Tags added",
        patch: { tags: tags.join(", ") },
      },
      {
        id: "tracking",
        title: "Tracking recommendation",
        blurb: isPromo
          ? "Enable GA tracking with sale UTMs to measure traffic and conversions accurately."
          : "Turn on GA tracking with campaign UTMs so this send isn’t dumped into Direct.",
        ...ICON.tracking,
        prompt: "Do I need GA tracking on for this campaign?",
        navLabel: "Tracking advice",
        reply:
          "Yes — with UTMs. Your last few sends went out without them, so the traffic landed in GA as direct and the channel got no credit. I can turn it on from here.",
        applyLabel: "Enable GA tracking",
        appliedLabel: "GA tracking on",
        patch: { gaTracking: true },
      },
      {
        id: "conversion",
        title: "Conversion goal",
        blurb: isCart
          ? "Track Checkout completed as the primary conversion for this campaign."
          : "Track Purchase completed as the primary conversion for this campaign.",
        ...ICON.conversion,
        prompt: "What conversion goal should I set for this campaign?",
        navLabel: "Conversion goal",
        reply:
          "Set a primary conversion or the attribution window closes and you’ll only be able to report opens and clicks. This is the event I’d track.",
        applyLabel: "Set conversion goal",
        appliedLabel: "Conversion goal set",
        patch: {
          conversionTracking: true,
          conversionEvent: isCart ? "Checkout completed" : "Purchase completed",
        },
      },
      {
        id: "audience",
        title: "Audience suggestion",
        blurb: isPromo
          ? "Target past purchasers and engaged visitors for better response to your offer."
          : "Target people who’ve gone quiet but still open — hold back anyone already in a journey.",
        ...ICON.audience,
        prompt: "Who should receive this campaign?",
        navLabel: "Audience",
        reply:
          "This is the starting cut I’d use on the Audience step. Apply it and I’ll park it on setup so you don’t lose it.",
        applyLabel: "Use this audience",
        appliedLabel: "Audience saved",
        patch: {
          audienceSuggestion: isPromo
            ? "Past purchasers and engaged visitors"
            : "Opened in the last 12 months, inactive 60 days, at least one prior purchase — exclude active journeys",
        },
      },
    ];
  }

  if (stepId === "audience") {
    return [
      {
        id: "audience",
        title: "Audience suggestion",
        blurb: "Opened in the last 12 months, nothing in 60 days, at least one purchase.",
        ...ICON.audience,
        prompt: "Who should receive this campaign?",
        navLabel: "Audience",
        reply:
          "That’s the cut that has actually reactivated on this goal. Hold back contacts already in a journey so they don’t get two messages this week.",
        applyLabel: "Use this audience",
        appliedLabel: "Audience saved",
        patch: {
          audienceSuggestion:
            "Opened in the last 12 months, inactive 60 days, at least one prior purchase — exclude active journeys",
        },
      },
    ];
  }

  return [
    {
      id: "tags",
      title: "Keep tagging consistent",
      tags,
      ...ICON.tags,
      prompt: "What tags should I put on this campaign?",
      navLabel: "Tagging help",
      reply: "Same tags as setup — applying again just fills any that are still missing.",
      applyLabel: "Add tags to campaign",
      appliedLabel: "Tags added",
      patch: { tags: tags.join(", ") },
    },
  ];
}

export function isPatchApplied(patch: Partial<SetupValues>, values: SetupValues): boolean {
  if (patch.tags) {
    const have = new Set(
      values.tags
        .split(",")
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean)
    );
    return patch.tags
      .split(",")
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean)
      .every((t) => have.has(t));
  }
  if (patch.gaTracking) return values.gaTracking;
  if (patch.conversionTracking) {
    return (
      values.conversionTracking &&
      (!patch.conversionEvent || values.conversionEvent === patch.conversionEvent)
    );
  }
  if (patch.audienceSuggestion) {
    return values.audienceSuggestion === patch.audienceSuggestion;
  }
  return false;
}

export function isApplied(suggestion: CampaignSuggestion, values: SetupValues): boolean {
  return isPatchApplied(suggestion.patch, values);
}

function SuggestionSkeleton() {
  return (
    <div className="space-y-3" aria-hidden>
      <div className="flex items-center gap-2">
        <span className="cmk-skel-pulse size-5 shrink-0 rounded-full bg-[#E4EAF4]" />
        <div className="flex-1 space-y-1.5">
          <div className="cmk-skel-pulse h-2.5 w-[70%] rounded bg-[#E4EAF4]" />
          <div className="cmk-skel-pulse h-2.5 w-[44%] rounded bg-[#E4EAF4]" />
        </div>
      </div>
      {[0, 1].map((i) => (
        <div
          key={i}
          className="flex items-center gap-3 rounded-lg border border-[#E6EAF4] bg-white p-3"
        >
          <span className="cmk-skel-pulse size-9 shrink-0 rounded-md bg-[#E4EAF4]" />
          <div className="flex-1 space-y-1.5">
            <div className="cmk-skel-pulse h-2.5 w-[88%] rounded bg-[#E4EAF4]" />
            <div className="cmk-skel-pulse h-2.5 w-[62%] rounded bg-[#E4EAF4]" />
          </div>
        </div>
      ))}
    </div>
  );
}

function TagPills({ tags }: { tags: string[] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {tags.map((tag) => (
        <span
          key={tag}
          className="rounded-full border border-[#DDE2EE] bg-white px-2.5 py-0.5 font-manrope text-[11px] font-medium text-[#17173A]"
        >
          {tag}
        </span>
      ))}
    </div>
  );
}

/**
 * Right-hand co-marketer panel. Once a goal is picked it skeletons, then
 * surfaces suggestion cards. Tapping a card opens the docked co-marketer
 * already answering that prompt, with a card to plot the values onto setup.
 */
export default function CampaignAIPanel({
  stepId,
  goal,
  loading,
  values,
  onAsk,
}: {
  stepId: string;
  goal: string;
  loading: boolean;
  values: SetupValues;
  onAsk: (point: CampaignSuggestion) => void;
}) {
  const suggestions = suggestionsFor(goal, stepId);

  return (
    <aside className="flex w-[320px] shrink-0 flex-col pt-5">
      <div className="flex items-center gap-1.5">
        <img src={sparkle} alt="" className="h-5 w-5 shrink-0" />
        <h2 className="font-manrope text-base font-bold text-[#17173A]">Co-marketer</h2>
      </div>
      <p className="mb-4 mt-1 font-manrope text-xs text-[#6F6F8D]">
        Suggestions based on your campaign goal.
      </p>

      <div className="min-h-0 flex-1 overflow-y-auto scroll-slim pb-4">
        {loading ? (
          <div>
            <div className="mb-3 flex items-center gap-2">
              <img src={sparkle} alt="" className="h-4 w-4 shrink-0" />
              <p className="font-manrope text-xs font-medium text-[#2F68E5]">
                Preparing suggestions...
              </p>
            </div>
            <SuggestionSkeleton />
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {suggestions.map((s, i) => {
              const applied = isApplied(s, values);
              const Icon = s.icon;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => onAsk(s)}
                  style={{ animationDelay: `${i * 50}ms` }}
                  className={cn(
                    "cmk-reveal group flex w-full items-center gap-3 rounded-lg border bg-white p-3 text-left",
                    "border-[#DDE2EE] transition-colors hover:border-[#2F68E5] hover:bg-[#F7F9FF]"
                  )}
                >
                  <span
                    className={cn(
                      "grid size-9 shrink-0 place-items-center rounded-md",
                      s.iconWrap
                    )}
                  >
                    <Icon className={cn("size-4", s.iconColor)} strokeWidth={2} />
                  </span>
                  <span className="min-w-0 flex-1">
                    {s.tags ? (
                      <>
                        <span className="mb-1.5 block font-manrope text-[13px] font-semibold leading-[18px] text-[#17173A]">
                          {s.title}
                        </span>
                        <TagPills tags={s.tags} />
                      </>
                    ) : (
                      <>
                        <span className="block font-manrope text-[13px] font-semibold leading-[18px] text-[#17173A]">
                          {s.title}
                        </span>
                        {s.blurb && (
                          <span className="mt-0.5 block font-manrope text-[11px] leading-[16px] text-[#6F6F8D]">
                            {s.blurb}
                          </span>
                        )}
                      </>
                    )}
                    {applied && (
                      <span className="mt-1.5 inline-flex items-center gap-1 font-manrope text-[10px] font-semibold text-[#00A86B]">
                        <Check className="size-3" strokeWidth={3} />
                        Applied
                      </span>
                    )}
                  </span>
                  <ChevronRight
                    className="size-4 shrink-0 text-[#A0A0B8] transition-colors group-hover:text-[#2F68E5]"
                    strokeWidth={2}
                  />
                </button>
              );
            })}
            <p className="mt-1 flex items-start gap-1.5 pb-5 font-manrope text-[11px] leading-[16px] text-[#8A8AA3]">
              <Info className="mt-px size-3.5 shrink-0" strokeWidth={2} />
              Suggestions improve as you add more campaign details.
            </p>
          </div>
        )}
      </div>
    </aside>
  );
}
