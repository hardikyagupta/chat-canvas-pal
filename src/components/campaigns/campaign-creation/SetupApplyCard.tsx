import { BarChart3, Check, Tag, Target, Users, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SetupValues } from "./CampaignSetupStep";

export type SetupApplyKind = "tags" | "tracking" | "conversion" | "audience";

/** Visual payload the co-marketer drops into the chat so the user can plot values onto setup. */
export interface SetupApplyCardData {
  kind: SetupApplyKind;
  title: string;
  applyLabel: string;
  appliedLabel: string;
  tags?: string[];
  conversionEvent?: string;
  audience?: string;
  blurb?: string;
  /** Written onto the setup form when the user taps apply. */
  patch?: Partial<SetupValues>;
}

const ICON: Record<SetupApplyKind, { icon: LucideIcon; wrap: string; color: string }> = {
  tags: { icon: Tag, wrap: "bg-[#E6F8F0]", color: "text-[#00A86B]" },
  tracking: { icon: BarChart3, wrap: "bg-[#E8F0FE]", color: "text-[#2F68E5]" },
  conversion: { icon: Target, wrap: "bg-[#F0E8FF]", color: "text-[#7B5CFA]" },
  audience: { icon: Users, wrap: "bg-[#FFF1E6]", color: "text-[#E07A2F]" },
};

export default function SetupApplyCard({
  card,
  applied,
  onApply,
}: {
  card: SetupApplyCardData;
  applied?: boolean;
  onApply?: () => void;
}) {
  const meta = ICON[card.kind];
  const Icon = meta.icon;

  return (
    <div className="w-full overflow-hidden rounded-lg border border-[#DDE2EE] bg-white">
      <div className="flex items-center gap-2.5 border-b border-[#E6EAF4] px-4 py-3">
        <span className={cn("grid size-8 shrink-0 place-items-center rounded-md", meta.wrap)}>
          <Icon className={cn("size-4", meta.color)} strokeWidth={2} />
        </span>
        <p className="font-manrope text-sm font-bold text-[#17173A]">{card.title}</p>
      </div>

      <div className="px-4 py-3">
        {card.kind === "tags" && card.tags && (
          <div className="flex flex-wrap gap-1.5">
            {card.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-[#DDE2EE] bg-[#F7F9FC] px-2.5 py-0.5 font-manrope text-[12px] font-medium text-[#17173A]"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
        {card.kind === "tracking" && (
          <>
            <p className="font-manrope text-[13px] font-semibold text-[#17173A]">Google Analytics</p>
            {card.blurb && (
              <p className="mt-1 font-manrope text-xs leading-[18px] text-[#6F6F8D]">{card.blurb}</p>
            )}
          </>
        )}
        {card.kind === "conversion" && (
          <>
            <p className="font-manrope text-[11px] font-semibold uppercase tracking-wide text-[#8A8AA3]">
              Primary conversion
            </p>
            <p className="mt-1 font-manrope text-sm font-bold text-[#17173A]">{card.conversionEvent}</p>
          </>
        )}
        {card.kind === "audience" && (
          <>
            <p className="font-manrope text-[11px] font-semibold uppercase tracking-wide text-[#8A8AA3]">
              Who to target
            </p>
            <p className="mt-1 font-manrope text-xs leading-[18px] text-[#17173A]">{card.audience}</p>
          </>
        )}
      </div>

      <div className="px-4 pb-3">
        <button
          type="button"
          onClick={onApply}
          disabled={applied}
          className={cn(
            "flex h-9 w-full items-center justify-center gap-1.5 rounded-md font-manrope text-[13px] font-semibold",
            applied
              ? "cursor-default bg-[#EDFBF5] text-[#0B7A56]"
              : "bg-[#2F68E5] text-white hover:bg-[#2557C4]"
          )}
        >
          {applied ? (
            <>
              <Check className="size-3.5" strokeWidth={3} />
              {card.appliedLabel}
            </>
          ) : (
            card.applyLabel
          )}
        </button>
      </div>
    </div>
  );
}
