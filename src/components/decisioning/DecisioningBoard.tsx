import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  BookOpen,
  Check,
  ChevronRight,
  GitMerge,
  Play,
  ShieldCheck,
} from "lucide-react";
import {
  BrandWikiPanel,
  EventMappingPanel,
  GuardrailsPanel,
} from "@/components/decisioning/ConfigPanels";
import {
  STANDARD_EVENTS,
  useDecisioningSetup,
} from "@/contexts/DecisioningSetupContext";

/* ------------------------------------------------------------------ */
/* PREVIEW of the "everything on the homepage" direction:              */
/*   - the three real configs live directly on the DE homepage         */
/*   - tapping a card opens a right-hand-side Sheet with its fields     */
/*   - a configured card's icon turns into a green tick                 */
/* Left the original empty state / setup page untouched.               */
/* ------------------------------------------------------------------ */

type OpenPanel = "brand" | "events" | "guardrails" | null;

/* ---- Config card -------------------------------------------------- */

function ConfigCard({
  icon: Icon,
  title,
  description,
  configured,
  summary,
  onClick,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  configured: boolean;
  summary?: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="group relative flex w-full items-center gap-4 rounded-xl border border-[#E6EAF4] bg-white p-4 text-left transition-all hover:border-[#C9D4EE] hover:shadow-[0px_6px_16px_rgba(23,23,58,0.06)]"
    >
      {/* icon square — turns into a green tick once configured */}
      <span
        className={`grid h-11 w-11 shrink-0 place-items-center rounded-lg transition-colors ${
          configured ? "bg-[#E7EFEA]" : "bg-[#EEF3FF]"
        }`}
      >
        {configured ? (
          <Check className="h-5 w-5 text-[#00A576]" strokeWidth={3} />
        ) : (
          <Icon className="h-5 w-5 text-[#2F68E5]" strokeWidth={1.8} />
        )}
      </span>
      <div className="min-w-0 flex-1">
        <span className="font-manrope text-[14px] font-bold text-[#17173A]">
          {title}
        </span>
        <div className="mt-0.5 truncate font-manrope text-[13px] leading-[18px] text-[#6F6F8D]">
          {configured && summary ? summary : description}
        </div>
      </div>
      {configured ? (
        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#E7EFEA] px-2 py-0.5 font-manrope text-[11px] font-semibold text-[#00A576]">
          Configured
        </span>
      ) : (
        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#FFF4E5] px-2 py-0.5 font-manrope text-[11px] font-semibold text-[#C77700]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#F5A623]" />
          Not configured
        </span>
      )}
      <ChevronRight className="h-4 w-4 shrink-0 text-[#B7C4E6] transition-transform group-hover:translate-x-0.5" />
    </button>
  );
}
/* ------------------------------------------------------------------ */

export default function DecisioningBoard() {
  const navigate = useNavigate();
  const {
    brandWiki,
    eventMapping,
    guardrails,
    saveBrandWiki,
    saveEventMapping,
    saveGuardrails,
    startProcessing,
    allConfigured,
    configuredCount,
  } = useDecisioningSetup();

  const [openPanel, setOpenPanel] = useState<OpenPanel>(null);

  const handleStartPreparation = () => {
    startProcessing();
    // Land on the real DE page, which renders the processing/progress state.
    navigate("/decisioning-engine");
  };

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
    ? `Consent ${guardrails.requireConsent ? "on" : "off"} · Max ${
        guardrails.frequencyCapPerWeek
      }/wk · ${guardrails.holdoutPercent}% hold-out`
    : undefined;

  return (
    <div className="w-full">
      <div className="w-full rounded-2xl bg-white p-10">
        <button
          onClick={() => navigate("/decisioning-engine")}
          className="mb-6 flex items-center gap-1.5 font-manrope text-[13px] font-semibold text-[#6F6F8D] transition-colors hover:text-[#17173A]"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={2} />
          Back
        </button>

        <div className="flex w-full items-center gap-10">
          <div className="flex min-w-0 flex-1 flex-col">
          <h2 className="font-manrope text-[26px] font-extrabold leading-[1.15] text-[#17173A]">
            Turn customer signals into
            <br />
            the next best action
          </h2>
          <p className="mt-4 font-manrope text-[14px] leading-[22px] text-[#6F6F8D]">
            Configure everything right here. Tap any card to set it up in a side
            panel — a configured step shows a green tick.
          </p>

          {/* progress */}
          <div className="mt-7 flex items-center gap-3">
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
            <span className="font-manrope text-[12px] font-semibold text-[#6F6F8D]">
              {allConfigured ? "All configured" : `${configuredCount} of 3 configured`}
            </span>
          </div>

          {/* config cards */}
          <div className="mt-4 flex w-1/2 flex-col gap-3">
            <ConfigCard
              icon={BookOpen}
              title="Brand wiki"
              description="Brand story, voice and audience"
              configured={!!brandWiki}
              summary={brandWikiSummary}
              onClick={() => setOpenPanel("brand")}
            />
            <ConfigCard
              icon={GitMerge}
              title="Event mapping"
              description="Map your events to the engine's"
              configured={!!eventMapping}
              summary={`${mappedCount} of ${STANDARD_EVENTS.length} events mapped`}
              onClick={() => setOpenPanel("events")}
            />
            <ConfigCard
              icon={ShieldCheck}
              title="Guardrails"
              description="Limits the engine always respects"
              configured={!!guardrails}
              summary={guardrailsSummary}
              onClick={() => setOpenPanel("guardrails")}
            />
          </div>

          {allConfigured ? (
            /* All three done — the gate to kick off the 4-hour preparation */
            <div className="mt-6 rounded-xl border border-[#E6EAF4] bg-[#F8FAFF] p-6 animate-in fade-in slide-in-from-bottom-2 duration-400">
              <h3 className="font-manrope text-[18px] font-bold text-[#17173A]">
                Your Decisioning Engine is ready for a launch
              </h3>
              <p className="mt-1.5 font-manrope text-[13px] leading-[20px] text-[#6F6F8D]">
                Review your setup and start preparation. This takes about 4 hours
                and continues in the background.
              </p>
              <button
                onClick={handleStartPreparation}
                className="mt-4 flex w-fit items-center gap-2 rounded-lg bg-[#2F68E5] px-5 py-3 font-manrope text-[14px] font-semibold uppercase tracking-[0.5px] text-white transition-colors hover:bg-[#255ad2]"
              >
                <Play className="h-4 w-4 fill-current" strokeWidth={0} />
                Review &amp; Launch
              </button>
              <div className="mt-4 flex items-start gap-2">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#9AA0C0]" strokeWidth={1.8} />
                <p className="font-manrope text-[12px] leading-[18px] text-[#9A9AB0]">
                  You can leave this page once preparation starts — we'll notify
                  you when it's ready.
                </p>
              </div>
            </div>
          ) : (
            <p className="mt-5 font-manrope text-[12px] text-[#9A9AB0]">
              About 10 minutes of setup · Preparation continues in the background
            </p>
          )}
          </div>
        </div>
      </div>

      {/* RHS config panels */}
      <BrandWikiPanel
        open={openPanel === "brand"}
        onOpenChange={(o) => setOpenPanel(o ? "brand" : null)}
        initialData={brandWiki}
        onSave={saveBrandWiki}
      />
      <EventMappingPanel
        open={openPanel === "events"}
        onOpenChange={(o) => setOpenPanel(o ? "events" : null)}
        initialData={eventMapping}
        onSave={saveEventMapping}
      />
      <GuardrailsPanel
        open={openPanel === "guardrails"}
        onOpenChange={(o) => setOpenPanel(o ? "guardrails" : null)}
        initialData={guardrails}
        onSave={saveGuardrails}
      />
    </div>
  );
}
