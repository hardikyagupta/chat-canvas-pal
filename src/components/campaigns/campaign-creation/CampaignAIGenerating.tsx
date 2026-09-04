import { useEffect, useState } from "react";
import { Check, Loader2, Mail, X } from "lucide-react";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { Progress } from "@/components/ui/progress";
import CampaignNameField from "./CampaignNameField";

/** How long the whole build takes, split evenly across the three phases. */
const DURATION_MS = 3600;

const PHASES = [
  "Selecting the right target audience",
  "Drafting the perfect message",
  "Scheduling the campaign",
];

/**
 * Shown between submitting a goal on the intro screen and landing on the
 * filled-in wizard — same rocket-launch language as the Decisioning Engine's
 * own processing state, so "the AI is building something" reads the same
 * way everywhere it happens.
 */
export default function CampaignAIGenerating({
  campaignName,
  onClose,
  onDone,
}: {
  campaignName: string;
  onClose: () => void;
  /** Fires once the phase checklist finishes. */
  onDone: () => void;
}) {
  const [startedAt] = useState(() => Date.now());
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 80);
    return () => window.clearInterval(id);
  }, []);

  const progress = Math.min(1, (now - startedAt) / DURATION_MS);

  useEffect(() => {
    if (progress >= 1) onDone();
    // Only the crossing into "done" matters — onDone is stable per mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progress >= 1]);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-[#DDE2EE] bg-white px-14">
        <div className="flex items-center gap-3">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded bg-[#E7EDFF]">
            <Mail className="h-4 w-4 text-[#2F68E5]" strokeWidth={2} />
          </span>
          <CampaignNameField campaignName={campaignName} />
        </div>
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          className="grid h-8 w-8 place-items-center rounded border border-[#DDE2EE] text-[#6F6F8D] transition-colors hover:bg-[#F7F9FC] hover:text-[#17173A]"
        >
          <X className="h-4 w-4" strokeWidth={2} />
        </button>
      </header>

      <div className="scroll-slim flex min-h-0 flex-1 flex-col items-center justify-center overflow-y-auto px-6 py-10">
        <div className="flex w-full max-w-[440px] flex-col items-center rounded-2xl bg-white px-10 py-16 text-center">
          <DotLottieReact
            src="https://lottie.host/955cb302-39a6-4d43-80f5-54dce1391ac2/KgDRjdANks.lottie"
            autoplay
            loop
            className="h-[140px] w-[140px]"
          />

          <h2 className="mt-5 font-manrope text-[20px] font-bold leading-tight text-[#17173A]">
            Building your campaign
          </h2>
          <p className="mt-1.5 max-w-[360px] font-manrope text-[13px] leading-[19px] text-[#6F6F8D]">
            Turning your goal into a ready-to-review campaign — audience, message, and schedule.
          </p>

          <div className="mt-6 w-full max-w-[320px]">
            <Progress value={progress * 100} className="h-2 bg-[#E7EDFF] [&>div]:bg-[#2F68E5]" />
          </div>

          <ul className="mt-6 flex w-full max-w-[300px] flex-col gap-2.5 text-left">
            {PHASES.map((phase, i) => {
              const phaseStart = i / PHASES.length;
              const phaseEnd = (i + 1) / PHASES.length;
              const state =
                progress >= phaseEnd ? "done" : progress >= phaseStart ? "loading" : "pending";
              return (
                <li key={phase} className="flex items-center gap-2.5">
                  <span className="grid h-5 w-5 shrink-0 place-items-center">
                    {state === "done" ? (
                      <span className="grid h-4 w-4 place-items-center rounded-full bg-[#E7EFEA] animate-in zoom-in duration-300">
                        <Check className="h-2.5 w-2.5 text-[#00C48C]" strokeWidth={3} />
                      </span>
                    ) : state === "loading" ? (
                      <Loader2 className="h-4 w-4 animate-spin text-[#2F68E5]" strokeWidth={2} />
                    ) : (
                      <span className="h-2 w-2 rounded-full bg-[#DDE2EE]" />
                    )}
                  </span>
                  <span
                    className={`font-manrope text-[13px] ${
                      state === "pending" ? "text-[#6F6F8D]" : "font-medium text-[#17173A]"
                    }`}
                  >
                    {phase}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}
