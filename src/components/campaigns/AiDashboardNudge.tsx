import { X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import iconAiDashboard from "/campaign-assets/nav-ai-dashboard.svg";
import NudgeFooter from "./NudgeFooter";

/**
 * AI Dashboard discovery nudge — a small card anchored next to the AI
 * Dashboard entry in the L1 rail. First of the three-step discovery
 * sequence (AI Dashboard → Co-marketer → Decisioning). Mirrors
 * DecisioningNudge's card treatment; clicking the card opens the AI
 * Dashboard, "Next" steps through the sequence instead.
 */
export default function AiDashboardNudge({
  onClose,
  onNext,
}: {
  onClose: () => void;
  onNext: () => void;
}) {
  const navigate = useNavigate();

  return (
    <div
      className="fixed left-14 top-[96px] z-50 animate-in fade-in slide-in-from-bottom-4 duration-500"
      role="dialog"
      aria-label="See the story behind your numbers"
    >
      {/* Pointer arrow — points left at the AI Dashboard icon in the rail.
          Sits above the clipped card so overflow-hidden doesn't cut it. Its
          fill matches the banner tone behind it (not white), so the diamond
          reads as a continuation of the card edge rather than a cut-out. */}
      <span
        aria-hidden="true"
        className="absolute -left-[6px] top-[24px] z-10 h-3 w-3 rotate-45 border-b border-l border-[#DDE2EE] bg-[#EAF1FF]"
      />
      <div className="relative w-[260px] overflow-hidden rounded-[8px] border border-solid border-[#DDE2EE] bg-white shadow-[5px_5px_10px_0px_#E5E9F2]">
        {/* Dismiss */}
        <button
          aria-label="Dismiss"
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="absolute right-2 top-2 z-10 grid h-6 w-6 place-items-center rounded-full border border-[#DDE2EE] bg-white text-[#17173A] shadow-sm transition-colors hover:bg-[#F4F8FF]"
        >
          <X className="h-3.5 w-3.5" strokeWidth={2} />
        </button>

        <button
          onClick={() => {
            onClose();
            navigate("/ai-dashboard");
          }}
          className="block w-full text-left"
        >
          {/* Thumbnail banner — a solid badge behind the white glyph (same
              treatment as DecisioningNudge) rather than a pale wash, since a
              white icon barely reads against a light background. */}
          <div className="relative grid h-[120px] w-full place-items-center bg-[#EAF1FF]">
            <span className="absolute h-16 w-16 rounded-full bg-[#BFD6FF]" />
            <span className="relative grid h-14 w-14 place-items-center rounded-full bg-gradient-to-b from-[#5B93F5] to-[#2F68E5] shadow-[0px_8px_20px_rgba(47,104,229,0.35)]">
              <img src={iconAiDashboard} alt="" className="h-7 w-7" />
            </span>
          </div>

          {/* Blurb */}
          <div className="flex flex-col gap-1 p-4">
            <span className="font-manrope text-[14px] font-semibold leading-[20px] text-[#17173A]">
              Your metrics, minus the guesswork
            </span>
            <p className="font-manrope text-[13px] font-medium leading-[20px] text-[#6F6F8D]">
              The AI Dashboard reads your numbers for you — what's working, what needs attention, and what to do next.
            </p>
          </div>
        </button>

        <NudgeFooter onNext={onNext} step={1} />
      </div>
    </div>
  );
}
