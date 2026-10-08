import { useEffect, useRef, useState } from "react";
import { X, Zap } from "lucide-react";
import { JOURNEY_TRIGGER_OPTIONS, type JourneyTriggerOption } from "./journeyTriggers.data";
import ActivityTriggerConfig from "./ActivityTriggerConfig";

/**
 * "Select a trigger" — right-side drawer shown once, right after naming a
 * from-scratch journey. A 2-column grid of square trigger/activity cards;
 * picking most of them closes the drawer immediately (no separate confirm
 * step) and updates the trigger node on the canvas. "Activity" is the one
 * exception — it swaps this same drawer to a second step
 * (ActivityTriggerConfig) for picking the activity and its optional
 * conditions/frequency before saving. Deliberately has no dimming backdrop
 * and isn't `fixed` — it renders as a real flex sibling of the canvas
 * (replacing the hidden JourneyPalette), so the canvas simply gets narrower
 * rather than being covered: it (and its own zoom/pan controls) stay fully
 * visible and interactive while this is open.
 */
export default function JourneyTriggerDrawer({
  open,
  onClose,
  onSelect,
}: {
  open: boolean;
  onClose: () => void;
  onSelect: (trigger: JourneyTriggerOption) => void;
}) {
  const [rendered, setRendered] = useState(open);
  const [entered, setEntered] = useState(false);
  const [step, setStep] = useState<"list" | "activity">("list");
  const closeTimer = useRef<number>();

  useEffect(() => {
    window.clearTimeout(closeTimer.current);
    if (open) {
      setRendered(true);
      // Deliberately does NOT reset step to "list" here — if the user closed
      // mid-way through the Activity step and reopens (via the trigger CTA
      // or by clicking the still-unresolved trigger node), it should come
      // back on that same step rather than losing their place.
      const r = requestAnimationFrame(() => requestAnimationFrame(() => setEntered(true)));
      return () => cancelAnimationFrame(r);
    }
    setEntered(false);
    closeTimer.current = window.setTimeout(() => setRendered(false), 280);
  }, [open]);

  useEffect(() => () => window.clearTimeout(closeTimer.current), []);

  useEffect(() => {
    if (!rendered) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [rendered, onClose]);

  if (!rendered) return null;

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-label="Select a trigger"
      className={`flex h-full w-[420px] max-w-[94vw] shrink-0 flex-col overflow-hidden rounded-lg bg-white shadow-[0px_1px_3px_rgba(23,23,58,0.06)] transition-transform duration-[280ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
        entered ? "translate-x-0" : "translate-x-full"
      }`}
    >
      {step === "activity" ? (
        <ActivityTriggerConfig
          onBack={() => setStep("list")}
          onClose={onClose}
          onSave={(nodeLabel, activityIds) =>
            onSelect({
              id: "activity",
              label: "Activity",
              description: "",
              icon: Zap,
              nodeLabel,
              activityIds,
            })
          }
        />
      ) : (
        <>
          {/* Header */}
          <div className="flex items-start gap-3 px-6 pt-6">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[#EAF1FF]">
              <Zap className="h-[18px] w-[18px] text-[#2F68E5]" strokeWidth={2} />
            </span>
            <div className="flex-1">
              <h2 className="font-manrope text-[17px] font-bold leading-tight text-[#17173A]">
                Select a trigger
              </h2>
              <p className="mt-1 font-manrope text-[13px] text-[#6F6F8D]">
                Choose the event that starts this journey.
              </p>
            </div>
            <button
              aria-label="Close"
              onClick={onClose}
              className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center text-[#6F6F8D] transition-colors hover:text-[#17173A]"
            >
              <X className="h-5 w-5" strokeWidth={2} />
            </button>
          </div>

          <div className="mt-4 border-t border-[#EBEBF5]" />

          {/* Trigger grid */}
          <div className="scroll-slim min-h-0 flex-1 overflow-y-auto px-6 py-4">
            <div className="grid grid-cols-2 gap-3">
              {JOURNEY_TRIGGER_OPTIONS.map((trigger) => {
                const Icon = trigger.icon;
                return (
                  <button
                    key={trigger.id}
                    type="button"
                    onClick={() => (trigger.id === "activity" ? setStep("activity") : onSelect(trigger))}
                    className="flex min-h-[148px] flex-col items-start gap-2 rounded-xl border border-[#DDE2EE] bg-white p-4 text-left transition-colors hover:border-[#2F68E5] hover:bg-[#F5F9FF]"
                  >
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[#EAF1FF]">
                      <Icon className="h-4 w-4 text-[#2F68E5]" strokeWidth={2} />
                    </span>
                    <span className="font-manrope text-[14px] font-bold leading-snug text-[#17173A]">
                      {trigger.label}
                    </span>
                    <span className="font-manrope text-[12.5px] leading-snug text-[#6F6F8D]">
                      {trigger.description}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
