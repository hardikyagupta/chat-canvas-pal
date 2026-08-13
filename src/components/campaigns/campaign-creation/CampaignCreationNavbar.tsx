import { X, type LucideIcon } from "lucide-react";
import sparkle from "/campaign-assets/ic-sparkle.gif";

/**
 * Top bar of the campaign creation overlay — channel icon + campaign name on
 * the left, ASK CO-MARKETER / SAVE / NEXT STEP / close on the right. Structure
 * follows the shared campaign-creation reference; styling is this app's
 * language (Manrope, #2F68E5 primary, #DDE2EE lines).
 */
export default function CampaignCreationNavbar({
  campaignName,
  icon: Icon,
  nextLabel = "Next step",
  onAskCoMarketer,
  onSave,
  onNextStep,
  onClose,
}: {
  campaignName: string;
  icon: LucideIcon;
  /** Last step swaps this for the terminal action. */
  nextLabel?: string;
  onAskCoMarketer?: () => void;
  onSave?: () => void;
  onNextStep?: () => void;
  onClose?: () => void;
}) {
  return (
    <header className="flex h-14 shrink-0 items-center border-b border-[#DDE2EE] bg-white px-14">
      <div className="flex min-w-0 items-center gap-3">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded bg-[#E7EDFF]">
          <Icon className="h-4 w-4 text-[#2F68E5]" strokeWidth={2} />
        </span>
        <h1 className="truncate font-manrope text-base font-bold leading-[22px] text-[#17173A]">
          {campaignName}
        </h1>
      </div>

      <div className="ml-auto flex items-center gap-3">
        {/* Ask co-marketer — the top-nav CTA verbatim: rotating conic-gradient
            ring (.snake-border), sparkle GIF, h-8 to match Save/Next step. */}
        <button
          type="button"
          onClick={onAskCoMarketer}
          className="relative z-[1] flex h-8 items-center gap-1.5 overflow-hidden rounded-lg bg-white px-2.5 transition-shadow hover:shadow-sm"
        >
          <span aria-hidden="true" className="snake-border" />
          <img src={sparkle} alt="" className="relative z-[1] h-5 w-5" />
          <span className="relative z-[1] font-manrope text-xs font-semibold tracking-[0.42px] text-ash">
            Ask co-marketer
          </span>
        </button>
        <button
          type="button"
          onClick={onSave}
          className="h-8 rounded border border-[#DDE2EE] px-4 font-manrope text-xs font-semibold uppercase tracking-[0.42px] text-[#17173A] transition-colors hover:bg-[#F7F9FC]"
        >
          Save
        </button>
        <button
          type="button"
          onClick={onNextStep}
          className="h-8 rounded bg-[#2F68E5] px-4 font-manrope text-xs font-semibold uppercase tracking-[0.42px] text-white transition-colors hover:bg-[#255ad2]"
        >
          {nextLabel}
        </button>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close campaign creation"
          className="grid h-8 w-8 place-items-center rounded border border-[#DDE2EE] text-[#6F6F8D] transition-colors hover:bg-[#F7F9FC] hover:text-[#17173A]"
        >
          <X className="h-4 w-4" strokeWidth={2} />
        </button>
      </div>
    </header>
  );
}