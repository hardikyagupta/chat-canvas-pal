import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { BookOpen, ChevronLeft, GitMerge, ShieldCheck } from "lucide-react";
import SetupCard from "@/components/decisioning/SetupCard";
import BrandWikiModal from "@/components/decisioning/BrandWikiModal";
import EventMappingModal from "@/components/decisioning/EventMappingModal";
import GuardrailsModal from "@/components/decisioning/GuardrailsModal";
import ReviewConfirmModal from "@/components/decisioning/ReviewConfirmModal";
import {
  STANDARD_EVENTS,
  useDecisioningSetup,
} from "@/contexts/DecisioningSetupContext";

type OpenModal = "brandWiki" | "eventMapping" | "guardrails" | "review" | null;

export default function DecisioningSetup() {
  const navigate = useNavigate();
  const {
    status,
    brandWiki,
    eventMapping,
    guardrails,
    saveBrandWiki,
    saveEventMapping,
    saveGuardrails,
    allConfigured,
    configuredCount,
  } = useDecisioningSetup();
  const [openModal, setOpenModal] = useState<OpenModal>(null);

  // Mid-processing there is nothing left to configure — always show progress.
  // Exception: while the review modal is up, confirming flips status to
  // "processing"; hold the redirect so its celebration moment can play out.
  if (status === "processing" && openModal !== "review") {
    return <Navigate to="/decisioning-engine" replace />;
  }

  const brandWikiSummary = brandWiki
    ? [
        brandWiki.files.length > 0 &&
          `${brandWiki.files.length} document${brandWiki.files.length > 1 ? "s" : ""}`,
        (brandWiki.brandVoice || brandWiki.audience) && "Voice and audience captured",
        brandWiki.brandName && !brandWiki.brandVoice && !brandWiki.audience && brandWiki.brandName,
      ]
        .filter(Boolean)
        .join(" · ")
    : undefined;

  const mappedCount = eventMapping
    ? STANDARD_EVENTS.filter(
        (e) => eventMapping.mappings[e.id] && eventMapping.mappings[e.id] !== "none"
      ).length
    : 0;

  const guardrailsSummary = guardrails
    ? `${guardrails.requireConsent ? "Consent on" : "Consent off"} · Max ${
        guardrails.frequencyCapPerWeek
      }/week · Quiet ${guardrails.quietHoursStart}–${guardrails.quietHoursEnd} · ${
        guardrails.holdoutPercent
      }% hold-out`
    : undefined;

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-[#F4F8FF]">
      {/* Focused-setup header — the only chrome on this page */}
      <header className="flex h-14 shrink-0 items-center gap-3 border-b border-[#DDE2EE] bg-white px-4">
        <button
          onClick={() => navigate("/decisioning-engine")}
          aria-label="Back to Decisioning engine"
          className="grid h-8 w-8 place-items-center rounded text-[#6F6F8D] transition-colors hover:bg-[#F4F8FF] hover:text-[#17173A]"
        >
          <ChevronLeft className="h-4 w-4" strokeWidth={2} />
        </button>
        <span className="font-manrope text-sm font-semibold text-[#17173A]">
          Configuring decisioning engine
        </span>
      </header>

      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 pt-8">
        <div className="mx-auto flex w-full max-w-[720px] flex-1 flex-col">
            <h2 className="font-manrope text-[20px] font-bold leading-tight text-[#17173A]">
              Let's teach the engine your brand
            </h2>
            <p className="mt-1 font-manrope text-[13px] text-[#6F6F8D]">
              Three quick setups — about 10 minutes — and the engine takes it from
              there.
            </p>

            <div className="mt-6 flex flex-col gap-3">
              <SetupCard
                icon={BookOpen}
                title="Brand wiki"
                description="Give the engine your brand's story — docs, voice, and who you sell to"
                configured={!!brandWiki}
                summary={brandWikiSummary}
                onConfigure={() => setOpenModal("brandWiki")}
              />
              <SetupCard
                icon={GitMerge}
                title="Event definition"
                description="Map your events to the engine's"
                configured={!!eventMapping}
                summary={`${mappedCount} of ${STANDARD_EVENTS.length} events mapped`}
                onConfigure={() => setOpenModal("eventMapping")}
              />
              <SetupCard
                icon={ShieldCheck}
                title="Guardrails"
                description="Set the hard limits the engine will always respect"
                configured={!!guardrails}
                summary={guardrailsSummary}
                onConfigure={() => setOpenModal("guardrails")}
              />
            </div>

            {/* Sticky footer: progress dots + the gate to Review & confirm */}
            <div className="sticky bottom-0 mt-auto pt-6">
              <div className="flex items-center justify-between rounded-lg border border-[#DDE2EE] bg-white px-5 py-3.5">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    {[0, 1, 2].map((i) => (
                      <span
                        key={i}
                        className={`h-2 w-2 rounded-full transition-colors duration-300 ${
                          i < configuredCount ? "bg-[#00C48C]" : "bg-[#DDE2EE]"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="font-manrope text-[13px] font-medium text-[#6F6F8D]">
                    {allConfigured
                      ? "All set — take one last look"
                      : `${configuredCount} of 3 configured`}
                  </span>
                </div>
                <button
                  key={String(allConfigured)}
                  disabled={!allConfigured}
                  onClick={() => setOpenModal("review")}
                  className={`rounded bg-[#2F68E5] px-4 py-2 font-manrope text-[13px] font-semibold tracking-[0.42px] text-white transition-colors hover:bg-[#255ad2] disabled:cursor-not-allowed disabled:opacity-50 ${
                    allConfigured ? "animate-in fade-in zoom-in-95 duration-300" : ""
                  }`}
                >
                  Review and confirm
                </button>
              </div>
            </div>
        </div>
      </div>

      <BrandWikiModal
        open={openModal === "brandWiki"}
        onOpenChange={(o) => setOpenModal(o ? "brandWiki" : null)}
        initialData={brandWiki}
        onSave={saveBrandWiki}
      />
      <EventMappingModal
        open={openModal === "eventMapping"}
        onOpenChange={(o) => setOpenModal(o ? "eventMapping" : null)}
        initialData={eventMapping}
        onSave={saveEventMapping}
      />
      <GuardrailsModal
        open={openModal === "guardrails"}
        onOpenChange={(o) => setOpenModal(o ? "guardrails" : null)}
        initialData={guardrails}
        onSave={saveGuardrails}
      />
      <ReviewConfirmModal
        open={openModal === "review"}
        onOpenChange={(o) => setOpenModal(o ? "review" : null)}
      />
    </div>
  );
}
