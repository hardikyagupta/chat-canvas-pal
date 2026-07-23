import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import JourneyBuilderHeader from "@/components/campaigns/JourneyBuilderHeader";
import JourneyPalette from "@/components/campaigns/JourneyPalette";
import JourneyCanvas from "@/components/campaigns/JourneyCanvas";
import JourneyTypeModal from "@/components/campaigns/JourneyTypeModal";
import JourneyAIModal from "@/components/campaigns/JourneyAIModal";

// Same rocket "launch" Lottie the Decisioning Engine uses while going live.
const ROCKET_LOTTIE =
  "https://lottie.host/955cb302-39a6-4d43-80f5-54dce1391ac2/KgDRjdANks.lottie";

// How long the DE-activation loader plays before landing on the journeys page.
const ACTIVATE_MS = 3200;

const ACTIVATION_PHASES = [
  "Publishing your journey",
  "Calibrating the Decisioning Engine",
  "Taking your journey live",
];

/**
 * Journey creation page — a focused, full-screen builder with no app chrome
 * (no L1 rail, no top navbar). Its own header bar sits on top, with a
 * two-pane body below: the LHS node palette and the RHS journey canvas.
 *
 * Two entry overlays sit on top of the builder:
 *  - the "type of journey" picker (New journey CTA), and
 *  - the "create with AI" drawer (Create with AI CTA), which opens over an
 *    empty canvas and reveals the generated journey once it finishes.
 */
export default function JourneyBuilder() {
  const navigate = useNavigate();
  const location = useLocation();
  // `openAI` arrives from the "Create with AI" CTA — the AI drawer opens over
  // an empty builder. Otherwise the type-picker drawer opens over a sample.
  const openAI = (location.state as { openAI?: boolean } | null)?.openAI ?? false;

  const [showTypeModal, setShowTypeModal] = useState(!openAI);
  const [aiModalOpen, setAiModalOpen] = useState(openAI);
  const [hasJourney, setHasJourney] = useState(!openAI);
  const [generatedByAI, setGeneratedByAI] = useState(false);

  // DE-activation loader: tapping "Activate journey" plays the rocket launch
  // animation for a beat, then lands the user on the journeys homepage.
  const [activating, setActivating] = useState(false);
  const [activateStep, setActivateStep] = useState(0);
  const activateTimer = useRef<number>();

  useEffect(() => () => window.clearTimeout(activateTimer.current), []);

  useEffect(() => {
    if (!activating) return;
    setActivateStep(0);
    const interval = window.setInterval(() => {
      setActivateStep((s) => Math.min(s + 1, ACTIVATION_PHASES.length - 1));
    }, ACTIVATE_MS / ACTIVATION_PHASES.length);
    return () => window.clearInterval(interval);
  }, [activating]);

  const handleActivate = (name: string) => {
    setActivating(true);
    activateTimer.current = window.setTimeout(() => {
      navigate("/journeys", { state: { activatedJourney: { name, generatedByAI } } });
    }, ACTIVATE_MS);
  };

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-[#F4F8FF] p-2">
      <JourneyBuilderHeader
        created={hasJourney}
        generatedByAI={generatedByAI}
        onActivate={handleActivate}
        onEditObjective={() => setAiModalOpen(true)}
      />

      <div className="mt-2 flex min-h-0 flex-1 gap-2">
        <JourneyPalette />

        <div className="min-w-0 flex-1">
          <JourneyCanvas hasJourney={hasJourney} />
        </div>
      </div>

      <JourneyTypeModal
        open={showTypeModal}
        onClose={() => navigate("/journeys")}
        onProceed={(selectedId) => {
          setShowTypeModal(false);
          // Picking "Create with AI" hands off to the AI drawer over an
          // empty canvas; any other choice drops straight into the builder.
          if (selectedId === "create-with-ai") {
            setHasJourney(false);
            setAiModalOpen(true);
          }
        }}
      />

      <JourneyAIModal
        open={aiModalOpen}
        // Closing while a journey already exists (re-editing the objective) just
        // dismisses the drawer; closing during initial creation cancels out.
        onClose={() => (hasJourney ? setAiModalOpen(false) : navigate("/journeys"))}
        onGenerated={() => {
          setAiModalOpen(false);
          setHasJourney(true);
          setGeneratedByAI(true);
          toast.success("Journey generated successfully via AI");
        }}
      />

      {activating && (
        <div className="fixed inset-0 z-[110] grid place-items-center bg-[#17173A]/30 p-6">
          <div className="flex w-[440px] max-w-[92vw] flex-col items-center rounded-2xl bg-white px-10 py-14 text-center shadow-[0_24px_60px_rgba(23,23,58,0.22)]">
            <DotLottieReact src={ROCKET_LOTTIE} autoplay loop className="h-[140px] w-[140px]" />
            <h2 className="mt-4 font-manrope text-[20px] font-bold leading-tight text-[#17173A]">
              Activating your journey
            </h2>
            <p
              key={activateStep}
              className="mt-2 font-manrope text-[13px] leading-[19px] text-[#6F6F8D] duration-300 animate-in fade-in"
            >
              {ACTIVATION_PHASES[activateStep]}…
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
