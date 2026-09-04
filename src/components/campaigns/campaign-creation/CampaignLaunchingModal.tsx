import { useEffect } from "react";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";

/** How long the launching modal stays up before handing off to the listing page. */
const LAUNCH_MS = 2200;

/**
 * Pop-up shown the moment "Launch" is clicked — a brief, subtle beat before
 * the wizard hands off to the campaigns list. Same rocket lottie the AI
 * generating screen and the Decisioning Engine's processing state use, so
 * "something is happening" reads the same way everywhere in the product;
 * this one skips the phase checklist since there's nothing to stage.
 */
export default function CampaignLaunchingModal({
  campaignName,
  onDone,
}: {
  campaignName: string;
  onDone: () => void;
}) {
  useEffect(() => {
    const id = window.setTimeout(onDone, LAUNCH_MS);
    return () => window.clearTimeout(id);
    // Fires once per mount — onDone is stable for the life of this modal.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Launching campaign"
      className="fixed inset-0 z-[300] flex items-center justify-center bg-[#0B0B1F]/45 backdrop-blur-[2px] animate-in fade-in duration-200"
    >
      <div className="flex w-full max-w-[360px] flex-col items-center rounded-2xl bg-white px-10 py-12 text-center shadow-[0_24px_60px_rgba(11,11,31,0.35)] animate-in zoom-in-95 duration-200">
        <DotLottieReact
          src="https://lottie.host/955cb302-39a6-4d43-80f5-54dce1391ac2/KgDRjdANks.lottie"
          autoplay
          loop
          className="h-[96px] w-[96px]"
        />
        <h2 className="mt-4 font-manrope text-[17px] font-bold leading-tight text-[#17173A]">
          Launching campaign
        </h2>
        <p className="mt-1.5 max-w-[260px] truncate font-manrope text-[13px] leading-[19px] text-[#6F6F8D]">
          {campaignName}
        </p>
      </div>
    </div>
  );
}
