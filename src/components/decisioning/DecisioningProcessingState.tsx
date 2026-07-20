import { useEffect, useRef, useState } from "react";
import { Check, Loader2 } from "lucide-react";
import iconDecisioning from "/campaign-assets/nav-decisioning.svg";
import { Progress } from "@/components/ui/progress";
import {
  PROCESSING_DURATION_MS,
  useDecisioningSetup,
} from "@/contexts/DecisioningSetupContext";

const PHASES = [
  "Understanding your brand",
  "Connecting customer signals",
  "Preparing decision intelligence",
];

export default function DecisioningProcessingState() {
  const { processingStartedAt, markReady, simulateCompletion } = useDecisioningSetup();
  const [now, setNow] = useState(() => Date.now());
  // Hidden demo shortcut: 5 quick clicks on the countdown finishes processing.
  const skipClicks = useRef<{ count: number; timer: number | null }>({
    count: 0,
    timer: null,
  });

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const elapsed = processingStartedAt ? now - processingStartedAt : 0;
  const progress = Math.min(1, elapsed / PROCESSING_DURATION_MS);

  useEffect(() => {
    if (progress >= 1) markReady();
  }, [progress, markReady]);

  const almostDone = PROCESSING_DURATION_MS - elapsed < 2_500;

  const handleTimerClick = () => {
    const s = skipClicks.current;
    s.count += 1;
    if (s.timer) window.clearTimeout(s.timer);
    if (s.count >= 5) {
      s.count = 0;
      simulateCompletion();
      return;
    }
    s.timer = window.setTimeout(() => {
      s.count = 0;
    }, 3000);
  };

  return (
    <div className="w-full">
      <div className="flex flex-col items-center rounded-2xl bg-white px-10 py-16 text-center">
        {/* Pulsing engine mark */}
        <span className="relative grid h-14 w-14 place-items-center">
          <span className="absolute inset-0 animate-pulse rounded-full bg-[#FC5E02]/15" />
          <span className="relative grid h-11 w-11 place-items-center rounded-full bg-[#FFF1E6]">
            <img src={iconDecisioning} alt="" className="h-7 w-7" />
          </span>
        </span>

        <h2 className="mt-5 font-manrope text-[20px] font-bold leading-tight text-[#17173A]">
          Preparing your Decisioning Agent for launch
        </h2>
        <p className="mt-1.5 max-w-[400px] font-manrope text-[13px] leading-[19px] text-[#6F6F8D]">
          Your brand context, customer events, and operating rules are being transformed
          into a decision-ready intelligence layer.
        </p>
        <p className="mt-2 max-w-[400px] font-manrope text-[13px] leading-[19px] text-[#6F6F8D]">
          Once ready, your agent can begin optimising the next best action for every
          eligible customer.
        </p>

        <div className="mt-6 w-full max-w-[400px]">
          <Progress
            value={progress * 100}
            className="h-2 bg-[#E7EDFF] [&>div]:bg-[#2F68E5]"
          />
          <p
            onClick={handleTimerClick}
            className="mt-2 select-none font-manrope text-[12px] font-medium text-[#6F6F8D]"
          >
            {almostDone ? "Almost done — finishing touches" : "Takes approx. 4 hours"}
          </p>
        </div>

        {/* Phase checklist advances with progress thirds */}
        <ul className="mt-6 flex w-full max-w-[320px] flex-col gap-2.5 text-left">
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

        <p className="mt-7 font-manrope text-[12px] text-[#6F6F8D]">
          Feel free to move from this page — processing continues either way.
        </p>
      </div>
    </div>
  );
}
