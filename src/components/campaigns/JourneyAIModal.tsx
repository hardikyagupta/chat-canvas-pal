import { useEffect, useRef, useState } from "react";
import { ChevronDown, X } from "lucide-react";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import sparkle from "/campaign-assets/ic-sparkle-ai.gif";
import { Switch } from "@/components/ui/switch";

/**
 * "Create journey with AI" — a right-side drawer with the same goal fields as
 * the first tab of objective creation (Goal / Horizon / Value per conversion +
 * arbitration toggle). Tapping "Generate journey" swaps to a centered white-box
 * loader that plays the audience-tab sparkle Lottie while the journey is
 * "generated", then hands off to the parent (which lands the user on the
 * builder and shows a success toast).
 */

// Same Lottie sparkle used by the objective flow's audience generating state.
const SPARKLE_LOTTIE =
  "https://lottie.host/ca72f8ab-de1d-4726-abde-28daa4777c71/gap4SvooBh.lottie";

const GENERATING_PHASES = [
  "Analyzing your goal and horizon",
  "Selecting channels and audiences",
  "Laying out the journey flow",
  "Finalizing your journey",
];

// How long the "generating" loader plays before landing on the builder.
const GENERATE_MS = 4200;

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="font-manrope text-[13px] font-semibold text-[#17173A]">
        {label}
        {required && <b className="font-semibold text-[#E5484D]"> *</b>}
      </span>
      {children}
    </label>
  );
}

const SELECT_CLASS =
  "h-11 w-full appearance-none rounded-md border border-[#DDE2EE] bg-white px-3 pr-9 font-manrope text-[14px] text-[#17173A] outline-none transition-colors focus:border-[#2F68E5]";

function SelectField({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <div className="relative">
      <select value={value} onChange={(e) => onChange(e.target.value)} className={SELECT_CLASS}>
        {options.map((o) => (
          <option key={o}>{o}</option>
        ))}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6F6F8D]"
        strokeWidth={2}
      />
    </div>
  );
}

export default function JourneyAIModal({
  open,
  onClose,
  onGenerated,
}: {
  open: boolean;
  onClose: () => void;
  onGenerated: () => void;
}) {
  const [rendered, setRendered] = useState(open);
  const [entered, setEntered] = useState(false);
  const closeTimer = useRef<number>();
  const genTimer = useRef<number>();

  const [phase, setPhase] = useState<"form" | "generating">("form");
  const [genStep, setGenStep] = useState(0);

  // Goal fields — mirror the objective-creation "Define the goal" tab.
  const [goal, setGoal] = useState("Repeat purchase");
  const [horizon, setHorizon] = useState("90 days");
  const [value, setValue] = useState("40");
  const [arbitration, setArbitration] = useState(true);

  useEffect(() => {
    window.clearTimeout(closeTimer.current);
    if (open) {
      setRendered(true);
      setPhase("form");
      const r = requestAnimationFrame(() => requestAnimationFrame(() => setEntered(true)));
      return () => cancelAnimationFrame(r);
    }
    setEntered(false);
    closeTimer.current = window.setTimeout(() => setRendered(false), 280);
  }, [open]);

  useEffect(
    () => () => {
      window.clearTimeout(closeTimer.current);
      window.clearTimeout(genTimer.current);
    },
    [],
  );

  useEffect(() => {
    if (!rendered) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && phase === "form") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [rendered, onClose, phase]);

  // Cycle the loader copy while generating.
  useEffect(() => {
    if (phase !== "generating") return;
    setGenStep(0);
    const interval = window.setInterval(() => {
      setGenStep((s) => Math.min(s + 1, GENERATING_PHASES.length - 1));
    }, GENERATE_MS / GENERATING_PHASES.length);
    return () => window.clearInterval(interval);
  }, [phase]);

  const handleGenerate = () => {
    setPhase("generating");
    genTimer.current = window.setTimeout(() => onGenerated(), GENERATE_MS);
  };

  if (!rendered) return null;

  const generating = phase === "generating";

  return (
    <div className="fixed inset-0 z-[100]">
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-[#17173A]/30 transition-opacity duration-[280ms] ${
          entered ? "opacity-100" : "opacity-0"
        }`}
        onClick={() => (generating ? undefined : onClose())}
        aria-hidden
      />

      {generating ? (
        /* Centered white-box loader */
        <div className="absolute inset-0 grid place-items-center p-6">
          <div
            className={`flex w-[440px] max-w-[92vw] flex-col items-center rounded-2xl bg-white px-10 py-14 text-center shadow-[0_24px_60px_rgba(23,23,58,0.22)] transition-all duration-[280ms] ${
              entered ? "scale-100 opacity-100" : "scale-95 opacity-0"
            }`}
          >
            <DotLottieReact src={SPARKLE_LOTTIE} autoplay loop className="h-[140px] w-[140px]" />
            <h2 className="mt-4 font-manrope text-[20px] font-bold leading-tight text-[#17173A]">
              AI is generating your journey
            </h2>
            <p
              key={genStep}
              className="mt-2 font-manrope text-[13px] leading-[19px] text-[#6F6F8D] duration-300 animate-in fade-in"
            >
              {GENERATING_PHASES[genStep]}…
            </p>
          </div>
        </div>
      ) : (
        /* Right drawer — goal form */
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Create journey with AI"
          className={`absolute right-0 top-0 flex h-full w-[520px] max-w-[94vw] flex-col bg-white shadow-[-12px_0_40px_rgba(23,23,58,0.16)] transition-transform duration-[280ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
            entered ? "translate-x-0" : "translate-x-full"
          }`}
        >
          {/* Header */}
          <div className="flex items-start justify-between px-8 pt-8">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[#E7EDFF]">
                <img src={sparkle} alt="" className="h-5 w-5" />
              </span>
              <div>
                <h2 className="font-manrope text-[20px] font-bold leading-tight text-[#17173A]">
                  Create a journey with AI
                </h2>
                <p className="mt-1 font-manrope text-[13px] leading-snug text-[#6F6F8D]">
                  Set your objective and the AI will draft a journey for you.
                </p>
              </div>
            </div>
            <button
              aria-label="Close"
              onClick={onClose}
              className="mt-1 grid h-6 w-6 shrink-0 place-items-center text-[#6F6F8D] transition-colors hover:text-[#17173A]"
            >
              <X className="h-5 w-5" strokeWidth={2} />
            </button>
          </div>

          {/* Body — goal fields */}
          <div className="scroll-slim min-h-0 flex-1 overflow-y-auto px-8 py-7">
            <h3 className="font-manrope text-[15px] font-bold text-[#17173A]">Define the goal</h3>
            <p className="mt-1 font-manrope text-[13px] leading-snug text-[#6F6F8D]">
              The engine turns business value into a calibrated decision.
            </p>

            <div className="mt-5 flex flex-col gap-5">
              <Field label="Goal" required>
                <SelectField
                  value={goal}
                  onChange={setGoal}
                  options={["Repeat purchase", "Acquisition", "Reactivation", "Premium grow"]}
                />
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Horizon" required>
                  <SelectField
                    value={horizon}
                    onChange={setHorizon}
                    options={["45 days", "60 days", "90 days", "120 days"]}
                  />
                </Field>
                <Field label="Value per conversion · relative" required>
                  <input
                    value={value}
                    inputMode="numeric"
                    onChange={(e) => setValue(e.target.value)}
                    className="h-11 w-full rounded-md border border-[#DDE2EE] bg-white px-3 font-manrope text-[14px] text-[#17173A] outline-none transition-colors focus:border-[#2F68E5]"
                  />
                </Field>
              </div>

              <div className="flex items-center justify-between gap-4 rounded-lg border border-[#EBEBF5] bg-[#FBFCFF] px-4 py-3">
                <div>
                  <strong className="block font-manrope text-[14px] font-semibold text-[#17173A]">
                    Arbitrate against my other objectives
                  </strong>
                  <p className="mt-0.5 font-manrope text-[12px] leading-snug text-[#6F6F8D]">
                    Pick one best action per person across running goals.
                  </p>
                </div>
                <Switch
                  checked={arbitration}
                  onCheckedChange={setArbitration}
                  aria-label="Arbitrate against my other objectives"
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-[#EBEBF5] px-8 py-5">
            <button
              onClick={handleGenerate}
              className="flex w-full items-center justify-center gap-2 rounded bg-[#143F93] px-5 py-3 font-manrope text-sm font-semibold uppercase tracking-[0.42px] text-white transition-colors hover:bg-[#0f3277]"
            >
              <img src={sparkle} alt="" className="h-4 w-4" />
              Generate journey
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
