import { X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import iconDecisioning from "/campaign-assets/nav-decisioning.svg";

/**
 * Decisioning engine discovery nudge — a small card anchored next to the
 * decisioning entry in the L1 rail, floating up into place. Shown first on
 * the Campaigns page; closing it (sequenced by that page) reveals the
 * co-marketer nudge. Thumbnail banner on top (the animated decisioning orb
 * itself), a short blurb below, and a cross to dismiss. Clicking the card
 * opens the decisioning engine.
 */
export default function DecisioningNudge({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();

  return (
    <div
      className="fixed left-14 top-[96px] z-50 animate-in fade-in slide-in-from-bottom-4 duration-500"
      role="dialog"
      aria-label="Go beyond regular campaigns"
    >
      {/* Pointer arrow — points left at the decisioning icon in the rail.
          Sits above the clipped card so overflow-hidden doesn't cut it. */}
      <span
        aria-hidden="true"
        className="absolute -left-[6px] top-[24px] z-10 h-3 w-3 rotate-45 border-b border-l border-[#DDE2EE] bg-white"
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
            navigate("/decisioning-engine");
          }}
          className="block w-full text-left"
        >
          {/* Thumbnail banner — the animated orb on a warm wash. */}
          <div className="grid h-[120px] w-full place-items-center bg-gradient-to-b from-[#FFF4E5] to-[#FFE8D2]">
            <img src={iconDecisioning} alt="" className="h-14 w-14" />
          </div>

          {/* Blurb */}
          <div className="flex flex-col gap-1 p-4">
            <span className="font-manrope text-[14px] font-semibold leading-[20px] text-[#17173A]">
            Still creating campaigns the old way? Let AI take it from idea to action
            </span>
            <p className="font-manrope text-[13px] font-medium leading-[20px] text-[#6F6F8D]">
            Let the Decisioning Engine choose the right customer, channel, message, timing.
            </p>
          </div>
        </button>
      </div>
    </div>
  );
}
