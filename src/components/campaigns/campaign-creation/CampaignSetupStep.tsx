import { Info } from "lucide-react";
import * as SwitchPrimitives from "@radix-ui/react-switch";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import GoalDropdown from "./GoalDropdown";
import StepCard from "./StepCard";

/** A smaller toggle than the shared Switch — matches the compact toggle+text
 *  rows used elsewhere in the wizard (e.g. Audience's "Don't include"). */
function MiniSwitch({
  checked,
  onCheckedChange,
}: {
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
}) {
  return (
    <SwitchPrimitives.Root
      checked={checked}
      onCheckedChange={onCheckedChange}
      className="peer inline-flex h-4 w-7 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background data-[state=checked]:bg-[#00C48C] data-[state=unchecked]:bg-input"
    >
      <SwitchPrimitives.Thumb className="pointer-events-none block h-3 w-3 rounded-full bg-background shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-3 data-[state=unchecked]:translate-x-0" />
    </SwitchPrimitives.Root>
  );
}

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

/** Account-level UTM defaults shown on hover of the GA-tracking pill. */
const GA_ACCOUNT_UTMS = [
  { label: "Source (utm_source)", value: "netcore" },
  { label: "Medium (utm_medium)", value: "email" },
  { label: "Campaign (utm_campaign)", value: "summer_sale_2026" },
  { label: "Content (utm_content)", value: "hero_cta" },
  { label: "Key 1, Value 1", value: "coupon, SAVE20" },
];

function GaConfigPill() {
  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            tabIndex={0}
            className="inline-flex cursor-default items-center rounded-full border border-[#D6E2FF] bg-[#EDF1FF] px-2 py-0.5 font-manrope text-[11px] font-medium leading-4 text-[#2F68E5]"
          >
            Pre-filled from account config
          </span>
        </TooltipTrigger>
        <TooltipContent
          side="top"
          align="start"
          className="max-w-[280px] border border-[#DDE2EE] bg-white p-3 text-[#17173A] shadow-[0_8px_24px_rgba(23,23,58,0.12)]"
        >
          <ul className="space-y-1.5 font-manrope text-xs leading-[18px]">
            {GA_ACCOUNT_UTMS.map((row) => (
              <li key={row.label}>
                <span className="text-[#6F6F8D]">{row.label}</span>
                <span className="text-[#6F6F8D]"> — </span>
                <span className="font-semibold text-[#17173A]">{row.value}</span>
              </li>
            ))}
          </ul>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function HeadingInfo({ children }: { children: React.ReactNode }) {
  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            aria-label="More information"
            className="inline-grid shrink-0 place-items-center text-[#8A8AA3] transition-colors hover:text-[#6F6F8D]"
          >
            <Info className="size-3.5" strokeWidth={2} />
          </button>
        </TooltipTrigger>
        <TooltipContent
          side="top"
          align="start"
          className="max-w-[260px] border border-[#DDE2EE] bg-white px-3 py-2 text-[#17173A] shadow-[0_8px_24px_rgba(23,23,58,0.12)]"
        >
          <p className="font-manrope text-xs leading-[18px] text-[#6F6F8D]">{children}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function ToggleRow({
  title,
  info,
  checked,
  onChange,
  flash,
  badge,
}: {
  title: string;
  /** Helper copy shown in a tooltip on the info icon beside the heading. */
  info?: React.ReactNode;
  checked: boolean;
  onChange: (v: boolean) => void;
  flash?: boolean;
  /** Optional chip sitting next to the title, e.g. the GA-tracking source pill. */
  badge?: React.ReactNode;
}) {
  return (
    <div className={cn("flex flex-wrap items-center gap-2", flash && "cmk-field-flash")}>
      <MiniSwitch checked={checked} onCheckedChange={onChange} />
      <p className="font-manrope text-sm font-semibold text-[#17173A]">{title}</p>
      {info && <HeadingInfo>{info}</HeadingInfo>}
      {badge}
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
  // The goal question is out of phase 1, so nothing here is gated any more —
  // tracking is open from the moment the step is. Tags live in Campaign settings.
  const chosen = true;
  // Previously: const chosen = Boolean(values.goal);

  return (
    <StepCard>
      {/* Campaign goal question — not part of phase 1.
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
      */}

      <div className="t-acc" data-open={chosen ? "true" : "false"}>
        <div className="t-acc-panel">
          <div className="t-acc-panel-inner">
            <div className="mb-5">
              <h2 className="font-manrope text-base font-bold text-[#17173A]">Tracking</h2>
              <p className="mt-1 font-manrope text-sm leading-5 text-[#6F6F8D]">
                Add UTM parameters to track campaign performance. Set default values in{" "}
                <a
                  href="https://pr1r.netcoresmartech.com/qa_manual1/admin/index.php/admin/acc_config#ga_tracking"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#2F68E5]"
                >
                  global advanced settings
                </a>
                .
              </p>
            </div>

            <div className="space-y-3">
              <ToggleRow
                title="GA tracking"
                badge={<GaConfigPill />}
                info={
                  <>
                    Track performance of your campaign with UTM parameters{" "}
                    <a href="#" className="text-[#2F68E5]">
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
                info="Activity which represents a conversion for this campaign."
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
                <input
                  type="text"
                  value={values.conversionEvent}
                  onChange={(e) => onChange({ conversionEvent: e.target.value })}
                  placeholder="Select conversion event"
                  aria-label="Select conversion event"
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
