import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Info, X } from "lucide-react";
import * as SwitchPrimitives from "@radix-ui/react-switch";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { parseTags, type SetupValues } from "./CampaignSetupStep";

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

/** Settings icon in the navbar opens this — a right-side drawer over the
 *  wizard, for campaign-level settings that don't belong to any one step,
 *  plus the campaign's tracking configuration. */
export default function CampaignSettingsDrawer({
  open,
  values,
  onChange,
  highlight,
  onClose,
}: {
  open: boolean;
  values: SetupValues;
  onChange: (patch: Partial<SetupValues>) => void;
  /** Field keys just written by a co-marketer apply — briefly flashed. */
  highlight?: Partial<Record<keyof SetupValues, boolean>>;
  onClose: () => void;
}) {
  const [shown, setShown] = useState(false);

  useEffect(() => {
    if (!open) {
      setShown(false);
      return;
    }
    const id = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(id);
  }, [open]);

  if (!open) return null;

  const tagList = parseTags(values.tags);

  return createPortal(
    <div className="fixed inset-0 z-[100] flex justify-end">
      <div
        className={cn(
          "absolute inset-0 bg-black/40 transition-opacity duration-300",
          shown ? "opacity-100" : "opacity-0"
        )}
        onClick={onClose}
      />
      <div
        className={cn(
          "relative flex h-full w-full max-w-[420px] flex-col bg-white shadow-[-20px_0_60px_rgba(23,23,58,0.15)] transition-transform duration-300 ease-out",
          shown ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="flex items-center justify-between border-b border-[#DDE2EE] px-6 py-5">
          <h2 className="font-manrope text-lg font-bold text-[#17173A]">Settings & tracking</h2>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="grid size-8 place-items-center rounded-full text-[#8A8AA3] transition-colors hover:bg-[#F0F3F9] hover:text-[#17173A]"
          >
            <X className="size-5" strokeWidth={2} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6">
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
          {tagList.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {tagList.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 rounded-full border border-[#DDE2EE] bg-[#F7F9FC] py-0.5 pl-2.5 pr-1 font-manrope text-[11px] font-medium text-[#17173A]"
                >
                  {tag}
                  <button
                    type="button"
                    aria-label={`Remove ${tag}`}
                    onClick={() => onChange({ tags: tagList.filter((t) => t !== tag).join(", ") })}
                    className="grid size-4 place-items-center rounded-full text-[#8A8AA3] hover:bg-[#E8ECF4] hover:text-[#17173A]"
                  >
                    <X className="size-3" strokeWidth={2.5} />
                  </button>
                </span>
              ))}
            </div>
          )}

          <div className="mt-8 border-t border-[#DDE2EE] pt-6">
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

            <div className="mt-4 space-y-3">
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
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
