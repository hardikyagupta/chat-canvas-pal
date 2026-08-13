import { X } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import GoalDropdown from "./GoalDropdown";
import StepCard from "./StepCard";

export interface SetupValues {
  /** What this campaign is for. Nothing else in the step opens until it's set. */
  goal: string;
  tags: string;
  gaTracking: boolean;
  conversionTracking: boolean;
  conversionEvent: string;
  audienceSuggestion: string;
}

export function parseTags(value: string): string[] {
  return value
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

export function mergeTags(current: string, incoming: string): string {
  const seen = new Set(parseTags(current).map((t) => t.toLowerCase()));
  const out = parseTags(current);
  for (const tag of parseTags(incoming)) {
    if (!seen.has(tag.toLowerCase())) {
      out.push(tag);
      seen.add(tag.toLowerCase());
    }
  }
  return out.join(", ");
}

/**
 * The goals a campaign can be created against. Deliberately outcomes the
 * platform can actually reason about — each one tells the co-marketer which
 * audience, content and timing advice is relevant, which is why the right-hand
 * suggestions stay closed until one is picked.
 */
export const CAMPAIGN_GOALS = [
  {
    value: "reengage-dormant",
    label: "Re-engage dormant contacts",
    hint: "Bring back people who've gone quiet",
  },
  {
    value: "first-purchase",
    label: "Drive a first purchase",
    hint: "Convert signups who haven't bought yet",
  },
  {
    value: "repeat-purchase",
    label: "Increase repeat purchases",
    hint: "Get existing customers ordering again",
  },
  {
    value: "abandoned-cart",
    label: "Recover abandoned carts",
    hint: "Close the sale someone walked away from",
  },
  {
    value: "product-launch",
    label: "Announce a product or feature launch",
    hint: "Put something new in front of the right people",
  },
  {
    value: "promo-offer",
    label: "Promote an offer or sale",
    hint: "Time-boxed discount or campaign moment",
  },
  {
    value: "onboarding",
    label: "Onboard new customers",
    hint: "Get new joiners to their first real action",
  },
  {
    value: "winback",
    label: "Win back churned customers",
    hint: "Last-chance reactivation for lapsed contacts",
  },
] as const;

/** Label for a stored goal value — used by the navbar and the AI panel. */
export function goalLabel(value: string): string | undefined {
  return CAMPAIGN_GOALS.find((g) => g.value === value)?.label;
}

const fieldClass =
  "h-10 w-full rounded-md border border-[#DDE2EE] bg-[#F7F9FC] px-3 font-manrope text-sm text-[#17173A] outline-none transition-colors placeholder:text-[#A0A0A0] focus:border-[#2F68E5] focus:bg-white";

function ToggleRow({
  title,
  description,
  checked,
  onChange,
  flash,
}: {
  title: string;
  description: React.ReactNode;
  checked: boolean;
  onChange: (v: boolean) => void;
  flash?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-start justify-between gap-4 rounded-md border border-[#DDE2EE] p-4",
        flash && "cmk-field-flash"
      )}
    >
      <div>
        <p className="font-manrope text-sm font-bold text-[#17173A]">{title}</p>
        <p className="mt-1 font-manrope text-xs leading-[18px] text-[#6F6F8D]">{description}</p>
      </div>
      <Switch
        checked={checked}
        onCheckedChange={onChange}
        className="shrink-0 data-[state=checked]:bg-[#00C48C]"
      />
    </div>
  );
}

/**
 * Setup step for an Email campaign. Starts as a single question — what is this
 * campaign for — and only opens up the rest of the form once it's answered, so
 * the goal is a real decision rather than a field to skip past.
 */
export default function CampaignSetupStep({
  values,
  onChange,
  highlight,
}: {
  values: SetupValues;
  onChange: (patch: Partial<SetupValues>) => void;
  /** Field keys just written by a co-marketer apply — briefly flashed. */
  highlight?: Partial<Record<keyof SetupValues, boolean>>;
}) {
  const chosen = Boolean(values.goal);
  const tags = parseTags(values.tags);

  return (
    <StepCard
      title="Campaign goal"
      description={
        chosen
          ? "Everything from here on is tuned to this goal — change it and the recommendations change with it."
          : "Tell me what this campaign is for and I'll shape the rest of the setup around it."
      }
    >
      <div className={chosen ? "mb-8" : ""}>
        <label className="mb-1.5 block font-manrope text-sm font-semibold text-[#17173A]">
          What are you trying to achieve? <span className="text-[#FC5E02]">*</span>
        </label>
        <GoalDropdown
          options={CAMPAIGN_GOALS}
          value={values.goal}
          placeholder="Pick a goal for this campaign"
          onChange={(goal) => onChange({ goal })}
        />

        {!chosen && (
          <p className="mt-3 font-manrope text-xs leading-[18px] text-[#6F6F8D]">
            Pick a goal to unlock the rest of the setup — naming, tags, tracking and the
            co-marketer's recommendations all follow from it.
          </p>
        )}
      </div>

      <div className="t-acc" data-open={chosen ? "true" : "false"}>
        <div className="t-acc-panel">
          <div className="t-acc-panel-inner">
            <div className={cn("mb-8", highlight?.tags && "cmk-field-flash rounded-md")}>
              <label className="mb-1.5 block font-manrope text-sm font-semibold text-[#17173A]">
                Add tags
              </label>
              <input
                type="text"
                value={values.tags}
                onChange={(e) => onChange({ tags: e.target.value })}
                placeholder="Ex: Festive, Q3"
                className={fieldClass}
              />
              {tags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 rounded-full border border-[#DDE2EE] bg-[#F7F9FC] py-0.5 pl-2.5 pr-1 font-manrope text-[11px] font-medium text-[#17173A]"
                    >
                      {tag}
                      <button
                        type="button"
                        aria-label={`Remove ${tag}`}
                        onClick={() =>
                          onChange({
                            tags: tags.filter((t) => t !== tag).join(", "),
                          })
                        }
                        className="grid size-4 place-items-center rounded-full text-[#8A8AA3] hover:bg-[#E8ECF4] hover:text-[#17173A]"
                      >
                        <X className="size-3" strokeWidth={2.5} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="mb-5">
              <h2 className="font-manrope text-base font-bold text-[#17173A]">Advanced</h2>
              <p className="mt-1 font-manrope text-sm leading-5 text-[#6F6F8D]">
                Track your campaign performance to measure traffic and conversion. Set default values
                for Google Analytics tracking and conversion goal in global advanced settings.
              </p>
            </div>

            <div className="space-y-3">
              <ToggleRow
                title="GA tracking"
                description={
                  <>
                    Track performance of your campaign with UTM parameters{" "}
                    <a href="#" className="text-[#2F68E5] underline">
                      learn more
                    </a>
                  </>
                }
                checked={values.gaTracking}
                onChange={(v) => onChange({ gaTracking: v })}
                flash={highlight?.gaTracking}
              />
              <ToggleRow
                title="Conversion tracking"
                description="Activity which represents a conversion for this campaign."
                checked={values.conversionTracking}
                onChange={(v) => onChange({ conversionTracking: v })}
                flash={highlight?.conversionTracking}
              />
            </div>

            {values.conversionTracking && (
              <div
                className={cn(
                  "mt-3",
                  highlight?.conversionEvent && "cmk-field-flash rounded-md"
                )}
              >
                <label className="mb-1.5 block font-manrope text-sm font-semibold text-[#17173A]">
                  Conversion event
                </label>
                <input
                  type="text"
                  value={values.conversionEvent}
                  onChange={(e) => onChange({ conversionEvent: e.target.value })}
                  placeholder="e.g. Purchase completed"
                  className={fieldClass}
                />
              </div>
            )}

            {values.audienceSuggestion && (
              <div
                className={cn(
                  "mt-8 rounded-md border border-[#DDE2EE] bg-[#F7F9FC] p-4",
                  highlight?.audienceSuggestion && "cmk-field-flash"
                )}
              >
                <p className="font-manrope text-[11px] font-semibold uppercase tracking-wide text-[#8A8AA3]">
                  Planned audience
                </p>
                <p className="mt-1 font-manrope text-sm font-semibold text-[#17173A]">
                  {values.audienceSuggestion}
                </p>
                <p className="mt-1 font-manrope text-xs leading-[18px] text-[#6F6F8D]">
                  Parked from co-marketer. You can refine this on the Audience step.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </StepCard>
  );
}
