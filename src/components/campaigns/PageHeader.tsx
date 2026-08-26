import { Search, ChevronDown } from "lucide-react";
import sparkle from "/campaign-assets/ic-sparkle-ai.gif";
import CreateWithAINudge from "./CreateWithAINudge";

/** Title block with the search affordance + primary create CTA. */
export default function PageHeader({
  title = "Campaigns",
  subtitle = "View and manage campaigns",
  ctaLabel = "New campaign",
  showCtaChevron = true,
  showCtaAiIcon = false,
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
  /** Leads the primary CTA with an AI sparkle (e.g. Segments' "Create"). */
  showCtaAiIcon?: boolean;
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
              className="dc-btn dc-btn-secondary"
            >
              <img src={sparkle} alt="" className="h-4 w-4" />
              Create with AI
            </button>
            {showAiNudge && <CreateWithAINudge onClose={() => onCloseAiNudge?.()} />}
          </div>
        )}
        <button
          onClick={onCtaClick}
          className="dc-btn dc-btn-primary shadow-[0px_5px_5px_rgba(0,0,0,0.05)]"
        >
          {/* The animated AI sparkle asset. It's royal blue, which would vanish
              against this button's royal-blue fill, so it's flattened to white. */}
          {showCtaAiIcon && (
            <img
              src={sparkle}
              alt=""
              className="h-4 w-4 [filter:brightness(0)_invert(1)]"
            />
          )}
          {ctaLabel}
          {showCtaChevron && <ChevronDown className="h-4 w-4" strokeWidth={2} />}
        </button>
      </div>
    </div>
  );
}
