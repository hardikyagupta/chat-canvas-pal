import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen, Check, Clock, GitMerge, ShieldCheck, type LucideIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { STANDARD_EVENTS, useDecisioningSetup } from "@/contexts/DecisioningSetupContext";

function SummarySection({
  icon: Icon,
  title,
  lines,
}: {
  icon: LucideIcon;
  title: string;
  lines: [string, string][];
}) {
  return (
    <div className="rounded-lg border border-[#DDE2EE] p-4">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-[#2F68E5]" strokeWidth={1.8} />
        <span className="text-[13px] font-semibold text-[#17173A]">{title}</span>
        <span className="ml-auto grid h-4 w-4 place-items-center rounded-full bg-[#E7EFEA]">
          <Check className="h-2.5 w-2.5 text-[#00C48C]" strokeWidth={3} />
        </span>
      </div>
      <dl className="mt-2.5 flex flex-col gap-1">
        {lines.map(([label, value]) => (
          <div key={label} className="flex justify-between gap-4 text-[13px]">
            <dt className="text-[#6F6F8D]">{label}</dt>
            <dd className="text-right font-medium text-[#17173A]">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export default function ReviewConfirmModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const navigate = useNavigate();
  const { brandWiki, eventMapping, guardrails, startProcessing } = useDecisioningSetup();
  const [phase, setPhase] = useState<"review" | "confirmed">("review");

  useEffect(() => {
    if (open) setPhase("review");
  }, [open]);

  const goHome = () => {
    onOpenChange(false);
    navigate("/decisioning-engine");
  };

  if (!brandWiki || !eventMapping || !guardrails) return null;

  const mappedCount = STANDARD_EVENTS.filter(
    (e) => eventMapping.mappings[e.id] && eventMapping.mappings[e.id] !== "none"
  ).length;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        // Once processing has started, any dismissal lands on the homepage so
        // the user always sees the progress state.
        if (!next && phase === "confirmed") goHome();
        else onOpenChange(next);
      }}
    >
      <DialogContent className="rounded-[16px] font-manrope sm:max-w-[520px]">
        {phase === "review" ? (
          <>
            <DialogHeader>
              <DialogTitle className="text-[18px] font-bold text-[#17173A]">
                Ready when you are
              </DialogTitle>
              <DialogDescription className="text-[13px] text-[#6F6F8D]">
                Here's everything the engine will learn from. You can change any of
                this later.
              </DialogDescription>
            </DialogHeader>

            <div className="flex max-h-[50vh] flex-col gap-3 overflow-y-auto pr-1">
              <SummarySection
                icon={BookOpen}
                title="Brand wiki"
                lines={[
                  ["Documents", `${brandWiki.files.length} uploaded`],
                  ["Brand name", brandWiki.brandName || "From documents"],
                  [
                    "Voice & audience",
                    brandWiki.brandVoice || brandWiki.audience ? "Captured" : "From documents",
                  ],
                ]}
              />
              <SummarySection
                icon={GitMerge}
                title="Event definition"
                lines={[
                  ["Events mapped", `${mappedCount} of ${STANDARD_EVENTS.length}`],
                  [
                    "Add to cart",
                    eventMapping.mappings.add_to_cart !== "none"
                      ? eventMapping.mappings.add_to_cart
                      : "Not tracked",
                  ],
                  [
                    "Purchase",
                    eventMapping.mappings.purchase !== "none"
                      ? eventMapping.mappings.purchase
                      : "Not tracked",
                  ],
                ]}
              />
              <SummarySection
                icon={ShieldCheck}
                title="Guardrails"
                lines={[
                  ["Consent required", guardrails.requireConsent ? "Yes" : "No"],
                  ["Frequency cap", `${guardrails.frequencyCapPerWeek} per week`],
                  ["Quiet hours", `${guardrails.quietHoursStart} – ${guardrails.quietHoursEnd}`],
                  ["Hold-out group", `${guardrails.holdoutPercent}%`],
                ]}
              />

              <div className="flex gap-2.5 rounded-lg bg-[#EEF3FF] p-3">
                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-[#2F68E5]" strokeWidth={1.8} />
                <p className="text-[12px] leading-[18px] text-[#17173A]">
                  <span className="font-semibold">Processing takes about 4 hours.</span>{" "}
                  The engine reads your brand wiki, wires up events, and builds its
                  first decision models. We'll show progress on the homepage — no need
                  to stick around.
                </p>
              </div>
            </div>

            <DialogFooter>
              <button
                onClick={() => onOpenChange(false)}
                className="rounded border border-[#DDE2EE] bg-white px-4 py-2 font-manrope text-[13px] font-semibold text-[#17173A] transition-colors hover:bg-[#F4F8FF]"
              >
                Go back
              </button>
              <button
                onClick={() => {
                  startProcessing();
                  setPhase("confirmed");
                }}
                className="rounded bg-[#2F68E5] px-4 py-2 font-manrope text-[13px] font-semibold tracking-[0.42px] text-white transition-colors hover:bg-[#255ad2]"
              >
                Confirm and start processing
              </button>
            </DialogFooter>
          </>
        ) : (
          <div className="flex flex-col items-center py-6 text-center animate-in zoom-in-95 fade-in duration-500">
            <span className="relative grid h-16 w-16 place-items-center">
              <span className="absolute inset-0 animate-ping rounded-full bg-[#00C48C]/30" />
              <span className="relative grid h-16 w-16 place-items-center rounded-full bg-[#E7EFEA]">
                <Check
                  className="h-8 w-8 text-[#00C48C] animate-in zoom-in duration-300 delay-150"
                  strokeWidth={2.5}
                />
              </span>
            </span>
            <h3 className="mt-5 text-[18px] font-bold text-[#17173A]">
              The engine is on it
            </h3>
            <p className="mt-1.5 max-w-[340px] text-[13px] leading-[19px] text-[#6F6F8D]">
              Processing has started and takes about 4 hours. Come back anytime — we'll
              keep the lights on.
            </p>
            <button
              onClick={goHome}
              className="mt-6 rounded bg-[#2F68E5] px-4 py-2 font-manrope text-[13px] font-semibold tracking-[0.42px] text-white transition-colors hover:bg-[#255ad2]"
            >
              Back to Decisioning engine
            </button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
