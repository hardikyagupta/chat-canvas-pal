import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  BookOpen,
  Check,
  GitMerge,
  Settings,
  ShieldCheck,
  X,
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
import "@/components/decisioning/config-edit.css";

type OpenPanel = "brand" | "events" | "guardrails" | null;

function ConfigCard({
  icon: Icon,
  title,
  configured,
  summary,
  onEdit,
}: {
  icon: React.ElementType;
  title: string;
  configured: boolean;
  summary: string;
  onEdit: () => void;
}) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-[#E6EAF4] bg-white p-4">
      <span
        className={`grid h-11 w-11 shrink-0 place-items-center rounded-lg ${
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
        <div className="flex items-center gap-2">
          <span className="font-manrope text-[14px] font-bold text-[#17173A]">
            {title}
          </span>
          {configured ? (
            <span className="inline-flex items-center rounded-full bg-[#E7EFEA] px-2 py-0.5 font-manrope text-[11px] font-semibold text-[#00A576]">
              Configured
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-[#FFF4E5] px-2 py-0.5 font-manrope text-[11px] font-semibold text-[#C77700]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#F5A623]" />
              Not configured
            </span>
          )}
        </div>
        <div className="mt-0.5 truncate font-manrope text-[13px] leading-[18px] text-[#6F6F8D]">
          {summary}
        </div>
      </div>
      <button
        onClick={onEdit}
        className="shrink-0 rounded-lg border border-[#DDE2EE] bg-white px-4 py-2 font-manrope text-[12px] font-semibold uppercase tracking-[0.5px] text-[#2F68E5] transition-colors hover:bg-[#EEF3FF]"
      >
        Edit
      </button>
    </div>
  );
}

/**
 * Dedicated "Edit configuration" page — creation-flow header (Save + close),
 * cloned from the objective/campaign creation navbar. Lists the three configs;
 * each Edit opens its side panel (the same panels used during initial setup).
 */
export default function DecisioningConfiguration() {
  const navigate = useNavigate();
  const {
    brandWiki,
    eventMapping,
    guardrails,
    saveBrandWiki,
    saveEventMapping,
    saveGuardrails,
  } = useDecisioningSetup();
  const [openPanel, setOpenPanel] = useState<OpenPanel>(null);

  const exit = () => navigate("/decisioning-engine");

  const brandWikiSummary = brandWiki
    ? [
        brandWiki.files.length > 0 &&
          `${brandWiki.files.length} document${brandWiki.files.length > 1 ? "s" : ""}`,
        (brandWiki.brandVoice || brandWiki.audience) && "Voice and audience captured",
        brandWiki.brandName && !brandWiki.brandVoice && !brandWiki.audience && brandWiki.brandName,
      ]
        .filter(Boolean)
        .join(" · ") || "Brand story, voice and audience"
    : "Brand story, voice and audience";

  const mappedCount = eventMapping
    ? STANDARD_EVENTS.filter(
        (e) => eventMapping.mappings[e.id] && eventMapping.mappings[e.id] !== "none"
      ).length
    : 0;
  const eventSummary = eventMapping
    ? `${mappedCount} of ${STANDARD_EVENTS.length} events mapped`
    : "Map your events to the engine's";

  const guardrailsSummary = guardrails
    ? `Consent ${guardrails.requireConsent ? "on" : "off"} · Max ${
        guardrails.frequencyCapPerWeek
      }/wk · ${guardrails.holdoutPercent}% hold-out`
    : "Limits the engine always respects";

  return (
    <div className="decfg-flow">
      {/* Creation-flow header — cloned from the objective/campaign navbar */}
      <header className="decfg-navbar">
        <div className="decfg-title-lockup">
          <span className="decfg-thumbnail">
            <Settings strokeWidth={1.8} />
          </span>
          <strong>Edit configuration</strong>
        </div>
        <div className="decfg-actions">
          <button className="decfg-save" onClick={exit}>
            Save
          </button>
          <button className="decfg-close" aria-label="Close" onClick={exit}>
            <X strokeWidth={2} />
          </button>
        </div>
      </header>

      {/* Body */}
      <div className="mx-auto w-full max-w-[720px] px-4 pt-10">
        <h1 className="font-manrope text-[20px] font-bold leading-tight text-[#17173A]">
          Your engine configuration
        </h1>
        <p className="mt-1 font-manrope text-[13px] text-[#6F6F8D]">
          Update your brand context, events or guardrails. Tap Edit to change one
          — updates apply to future decisions.
        </p>

        <div className="mt-6 flex flex-col gap-3">
          <ConfigCard
            icon={BookOpen}
            title="Brand wiki"
            configured={!!brandWiki}
            summary={brandWikiSummary}
            onEdit={() => setOpenPanel("brand")}
          />
          <ConfigCard
            icon={GitMerge}
            title="Event definition"
            configured={!!eventMapping}
            summary={eventSummary}
            onEdit={() => setOpenPanel("events")}
          />
          <ConfigCard
            icon={ShieldCheck}
            title="Guardrails"
            configured={!!guardrails}
            summary={guardrailsSummary}
            onEdit={() => setOpenPanel("guardrails")}
          />
        </div>

        {/* Warning — re-configuring re-triggers the 4h preparation */}
        <div className="mt-6 flex items-start gap-3 rounded-xl border border-[#F5D9A8] bg-[#FEF7EC] p-4">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[#C77700]" strokeWidth={2} />
          <p className="font-manrope text-[13px] leading-[19px] text-[#8A5A00]">
            Editing configuration can affect your ongoing objectives. Any change
            here re-prepares the engine, which takes about 4 hours before the new
            setup goes live.
          </p>
        </div>
      </div>

      {/* Side panels — same components used during initial setup */}
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
