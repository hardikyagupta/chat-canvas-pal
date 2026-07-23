import { Search, ChevronDown } from "lucide-react";
import sparkle from "/campaign-assets/ic-sparkle-ai.gif";
import CreateWithAINudge from "./CreateWithAINudge";

/** Title block with the search affordance + primary create CTA. */
export default function PageHeader({
  title = "Campaigns",
  subtitle = "View and manage campaigns",
  ctaLabel = "New campaign",
  showCtaChevron = true,
  showAiCta = false,
  showAiNudge = false,
  onCloseAiNudge,
  onCtaClick,
  onAiCtaClick,
}: {
  title?: string;
  subtitle?: string;
  ctaLabel?: string;
  /** Hides the chevron on the primary CTA (it doesn't open a menu everywhere). */
  showCtaChevron?: boolean;
  /** Shows a secondary "Create with AI" button before the primary CTA. */
  showAiCta?: boolean;
  /** Shows the discovery nudge dropped below the Create with AI button. */
  showAiNudge?: boolean;
  onCloseAiNudge?: () => void;
  /** Click handler for the primary CTA (e.g. open the create flow). */
  onCtaClick?: () => void;
  /** Click handler for the secondary "Create with AI" button. */
  onAiCtaClick?: () => void;
}) {
  return (
    <div className="flex items-start justify-between">
      <div>
        <h1 className="font-manrope text-[20px] font-bold leading-tight text-[#17173A]">
          {title}
        </h1>
        <p className="mt-1 font-manrope text-[13px] text-[#6F6F8D]">
          {subtitle}
        </p>
      </div>

      <div className="flex items-center gap-4">
        <button
          aria-label={`Search ${title.toLowerCase()}`}
          className="grid h-[29px] w-[29px] place-items-center rounded-[2px] border border-[#DDE2EE] bg-white text-[#6F6F8D] transition-colors hover:bg-[#F4F8FF]"
        >
          <Search className="h-4 w-4" strokeWidth={1.8} />
        </button>
        {showAiCta && (
          <div className="relative">
            <button
              onClick={onAiCtaClick}
              className="flex items-center gap-1.5 rounded border border-[#DDE2EE] bg-white px-3 py-[5px] font-manrope text-sm font-semibold tracking-[0.42px] text-[#17173A] transition-colors hover:bg-[#F4F8FF]"
            >
              <img src={sparkle} alt="" className="h-4 w-4" />
              Create with AI
            </button>
            {showAiNudge && <CreateWithAINudge onClose={() => onCloseAiNudge?.()} />}
          </div>
        )}
        <button
          onClick={onCtaClick}
          className="flex items-center gap-2 rounded bg-[#2F68E5] px-3 py-[5px] font-manrope text-sm font-semibold tracking-[0.42px] text-white shadow-[0px_5px_5px_rgba(0,0,0,0.05)] transition-colors hover:bg-[#255ad2]"
        >
          {ctaLabel}
          {showCtaChevron && <ChevronDown className="h-4 w-4" strokeWidth={2} />}
        </button>
      </div>
    </div>
  );
}
