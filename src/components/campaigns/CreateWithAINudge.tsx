import { X } from "lucide-react";
import sparkle from "/campaign-assets/ic-sparkle-ai.gif";

/**
 * "Create with AI" discovery nudge — a replica of DecisioningNudge's card
 * treatment (thumbnail banner, blurb, dismiss cross), but dropped below its
 * anchor button like CoMarketerNudge rather than fixed beside the L1 rail.
 */
export default function CreateWithAINudge({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="absolute left-0 top-[calc(100%+12px)] z-50 animate-in fade-in slide-in-from-top-2 duration-300"
      role="dialog"
      aria-label="Create with AI"
    >
      {/* Pointer arrow — points up at the Create with AI button. */}
      <span
        aria-hidden="true"
        className="absolute -top-[6px] left-[26px] z-10 h-3 w-3 rotate-45 border-l border-t border-[#DDE2EE] bg-white"
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

        {/* Thumbnail banner — plain white so the pointer arrow reads as one
            continuous surface with the card, not a cut-out square. */}
        <div className="grid h-[120px] w-full place-items-center bg-white">
          <img src={sparkle} alt="" className="h-14 w-14" />
        </div>

        {/* Blurb */}
        <div className="flex flex-col gap-1 p-4">
          <span className="font-manrope text-[14px] font-semibold leading-[20px] text-[#17173A]">
            Skip the builder — describe it, AI builds it
          </span>
          <p className="font-manrope text-[13px] font-medium leading-[20px] text-[#6F6F8D]">
            Tell AI the journey you want in plain language and it drafts the
            audience, steps, and content for you.
          </p>
        </div>
      </div>
    </div>
  );
}
