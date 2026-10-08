import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Eye, Plus, Route, Search, Send, Sparkles, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { JOURNEY_TEMPLATES, TONE_HEX, type JourneyTemplate } from "@/components/campaigns/journeyTemplates.data";
import TemplatePreviewModal from "@/components/campaigns/TemplatePreviewModal";
import "@/components/campaigns/journey-create.css";

/** An example chip's own prompt text, paired with which scripted co-marketer
 *  storyline it should open (see AI_JOURNEY_SCRIPTS in JourneyBuilder.tsx). */
const AI_EXAMPLES: { label: string; kind: "cart" | "welcome" | "winback" }[] = [
  { label: "Recover abandoned carts", kind: "cart" },
  { label: "Welcome new customers", kind: "welcome" },
  { label: "Re-engage inactive customers", kind: "winback" },
];

const FEATURED_COUNT = 3;

/**
 * "Create Journey" — full-screen entry point reached from the Journeys
 * page's "New journey" CTA (a focused page, not a modal, matching the rest
 * of the journey-creation surfaces like JourneyBuilder). An AI describe-box
 * (picking an example chip only fills the field with that prompt — it still
 * has to be submitted, via the send button or Enter, same as typed text —
 * which then hands the prompt to JourneyBuilder — see its doc comment —
 * opening the co-marketer chat docked on the canvas instead of showing the
 * trigger picker; the input itself reuses the same shimmer-bordered field
 * as the email Campaign
 * Composer's intro screen, and this page's content area sits on that same
 * screen's page background (#F4F8FF) rather than a separate white card, so
 * the two "create with AI" entry points feel like one component), then a
 * choice between browsing
 * templates or starting from scratch (goes straight to the builder canvas,
 * no naming step). "Start from scratch" and the featured templates sit under
 * one shared "Start building" heading; "See all templates" expands the rest
 * of the catalog into the same grid below, rather than opening a modal.
 */
export default function JourneyCreate() {
  const navigate = useNavigate();
  const [aiText, setAiText] = useState("");
  // Which scripted storyline the current aiText matches, if any — set when
  // an example chip fills the field, cleared the moment the user edits it
  // by hand, so an unmodified chip pick still gets its richer scripted
  // journey while free-typed text falls back to the generic one.
  const [aiPendingKind, setAiPendingKind] = useState<"cart" | "welcome" | "winback" | "custom">("custom");
  const [showAllTemplates, setShowAllTemplates] = useState(false);
  const [templateSearch, setTemplateSearch] = useState("");
  const [previewTemplate, setPreviewTemplate] = useState<JourneyTemplate | null>(null);

  const handleUseTemplate = (template: JourneyTemplate) => {
    // Router state must be structured-cloneable (history.pushState), and a
    // JourneyTemplate carries lucide icon components (functions) — so only
    // its id crosses the navigation; JourneyBuilder looks the template back
    // up from JOURNEY_TEMPLATES.
    navigate("/journeys/new", { state: { templateId: template.id, journeyName: template.title } });
  };

  // Picking an example chip, or submitting typed text, both hand the prompt
  // straight to JourneyBuilder — it opens the co-marketer chat docked on the
  // right (in place of the trigger-picker/drawer) with this prompt already
  // seeded, instead of showing the empty "Choose trigger" canvas first.
  const handleStartAIPrompt = (prompt: string, kind: "cart" | "welcome" | "winback" | "custom") => {
    navigate("/journeys/new", { state: { aiPrompt: prompt, aiPromptKind: kind } });
  };

  const filteredTemplates = useMemo(() => {
    const q = templateSearch.trim().toLowerCase();
    if (!q) return JOURNEY_TEMPLATES;
    return JOURNEY_TEMPLATES.filter(
      (t) => t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q),
    );
  }, [templateSearch]);

  const visibleTemplates = showAllTemplates ? filteredTemplates : filteredTemplates.slice(0, FEATURED_COUNT);
  const hasMoreTemplates = filteredTemplates.length > FEATURED_COUNT;

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-[#F4F8FF] p-2">
      <header className="flex items-center justify-between rounded-lg bg-white px-10 py-5 shadow-[0px_1px_3px_rgba(23,23,58,0.06)]">
        <div className="flex items-center gap-4">
          <span className="grid place-items-center rounded-[5px] bg-[#F7E8FD] p-1.5">
            <Route className="h-6 w-6 text-[#BE52F2]" strokeWidth={1.9} />
          </span>
          <h1 className="font-manrope text-[20px] font-bold tracking-[0.42px] text-[#17173A]">
            Create Journey
          </h1>
        </div>
        <button
          aria-label="Close"
          onClick={() => navigate("/journeys")}
          className="grid h-9 w-9 place-items-center rounded border-[1.5px] border-[#DDE2EE] bg-white text-[#6F6F8D] transition-colors hover:bg-[#F3F6FF]"
        >
          <X className="h-5 w-5" strokeWidth={1.9} />
        </button>
      </header>

      {/* Same page background as the email Campaign Composer's intro screen
          (no separate white card underneath) — only the header stays white. */}
      <div className="scroll-slim mt-2 min-h-0 flex-1 overflow-y-auto px-10 py-7">
        {/* AI hero */}
        <div className="mx-auto flex max-w-[640px] flex-col items-center text-center">
          <span className="grid h-14 w-14 place-items-center rounded-full bg-[#F1EBFF]">
            <Sparkles className="h-6 w-6 text-[#9449DF]" strokeWidth={2} />
          </span>
          <h2 className="mt-3 font-manrope text-[23px] font-bold text-[#17173A]">
            Create a journey with AI
          </h2>
          <p className="mt-1.5 font-manrope text-[14px] text-[#6F6F8D]">
            Tell me what you want to achieve, and I'll help you build it.
          </p>

          {/* Same shimmer-bordered prompt field as the email Campaign
              Composer's intro screen (CampaignCreationIntro), so the two
              "create with AI" entry points share one component language. */}
          <div className="relative mt-5 w-full overflow-hidden rounded-2xl">
            <span aria-hidden="true" className="input-border-shimmer" style={{ padding: "1px" }} />
            <div className="relative flex items-center gap-3 rounded-2xl bg-white px-5 py-3.5">
              <input
                value={aiText}
                onChange={(e) => {
                  setAiText(e.target.value);
                  setAiPendingKind("custom");
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && aiText.trim()) handleStartAIPrompt(aiText.trim(), aiPendingKind);
                }}
                placeholder="Describe the journey you want to create…"
                className="min-w-0 flex-1 bg-transparent font-manrope text-[14.5px] text-[#17173A] outline-none placeholder:text-[#9494AE]"
              />
              <button
                type="button"
                aria-label="Submit"
                disabled={!aiText.trim()}
                onClick={() => aiText.trim() && handleStartAIPrompt(aiText.trim(), aiPendingKind)}
                className={cn(
                  "grid size-9 shrink-0 place-items-center rounded-full transition-colors",
                  aiText.trim() ? "bg-[#2F68E5] text-white hover:bg-[#255ad2]" : "bg-[#F0F3F9] text-[#B9BAC7]",
                )}
              >
                <Send className="size-4" strokeWidth={2} />
              </button>
            </div>
          </div>

          <p className="mt-4 font-manrope text-[12.5px] font-medium text-[#6F6F8D]">
            Try these examples
          </p>
          <div className="mt-2.5 flex flex-wrap items-center justify-center gap-2">
            {AI_EXAMPLES.map((ex) => (
              <button
                key={ex.label}
                type="button"
                onClick={() => {
                  setAiText(ex.label);
                  setAiPendingKind(ex.kind);
                }}
                className="rounded-full bg-white px-3.5 py-1.5 font-manrope text-[12.5px] text-[#17173A] transition-colors hover:bg-[#EAF1FF]"
              >
                {ex.label}
              </button>
            ))}
          </div>
        </div>

        {/* OR divider */}
        <div className="mx-auto mt-6 flex max-w-[900px] items-center gap-4">
          <span className="h-px flex-1 bg-[#DDE2EE]" />
          <span className="font-manrope text-[13px] font-semibold tracking-[0.04em] text-[#6F6F8D]">
            OR
          </span>
          <span className="h-px flex-1 bg-[#DDE2EE]" />
        </div>

        {/* Start from scratch + templates — one heading, one row; no
            separate "Templates" sub-heading. */}
        <div className="mx-auto mt-5 max-w-[900px] pb-2">
          <div className="flex items-center justify-between">
            <h3 className="font-manrope text-[15px] font-bold text-[#17173A]">Start building</h3>
            {hasMoreTemplates && (
              <button
                type="button"
                onClick={() => setShowAllTemplates((v) => !v)}
                className="font-manrope text-[13.5px] font-semibold text-[#143F93] underline-offset-2 transition-colors hover:text-[#0B2A66] hover:underline"
              >
                {showAllTemplates ? "Show less" : "See all templates"}
              </button>
            )}
          </div>

          <div className="relative mt-3 max-w-[260px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6F6F8D]" strokeWidth={2} />
            <input
              value={templateSearch}
              onChange={(e) => setTemplateSearch(e.target.value)}
              placeholder="Search templates…"
              className="h-9 w-full rounded-md border border-[#DDE2EE] bg-white pl-9 pr-3 font-manrope text-[13px] text-[#17173A] outline-none placeholder:text-[#6F6F8D] focus:border-[#B9C4DD]"
            />
          </div>

          <div className="mt-4 grid grid-cols-2 items-start gap-4 sm:grid-cols-4">
            <ScratchCard onClick={() => navigate("/journeys/new")} />
            {visibleTemplates.map((t) => (
              <TemplateMiniCard key={t.id} template={t} onPreview={() => setPreviewTemplate(t)} />
            ))}
          </div>
        </div>
      </div>

      <TemplatePreviewModal
        template={previewTemplate}
        onClose={() => setPreviewTemplate(null)}
        onUseTemplate={(t) => {
          setPreviewTemplate(null);
          handleUseTemplate(t);
        }}
      />
    </div>
  );
}

/** The "Start from scratch" card — same compact shape and height as the
 *  template cards (icon, heading, one short line, then the CTA), just with a
 *  soft corner gradient to set it apart from the white template cards. */
function ScratchCard({ onClick }: { onClick: () => void }) {
  return (
    <div
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-[#DDE2EE] bg-white p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-[#B9C4DD] hover:shadow-[0_10px_24px_rgba(23,23,58,0.10)]"
      style={{
        backgroundImage:
          "radial-gradient(120% 100% at 100% 0%, rgba(148, 73, 223, 0.09) 0%, rgba(47, 104, 229, 0.07) 45%, rgba(255,255,255,0) 75%)",
      }}
    >
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#EAF1FF] transition-transform duration-200 group-hover:scale-110">
        <Plus className="h-[18px] w-[18px] text-[#2F68E5]" strokeWidth={2.2} />
      </span>
      <h4 className="mt-3 font-manrope text-[14px] font-bold leading-snug text-[#17173A]">
        Start from scratch
      </h4>
      <p className="mt-1 font-manrope text-[12px] leading-snug text-[#6F6F8D]">
        Build your journey step by step with full control.
      </p>

      <button
        type="button"
        onClick={onClick}
        className="mt-3 flex items-center gap-1 self-start font-manrope text-[12.5px] font-semibold text-[#143F93] transition-transform duration-200 group-hover:translate-x-0.5"
      >
        Create from scratch
        <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} />
      </button>
    </div>
  );
}

/** A featured template card — deliberately minimal: icon, heading, one short
 *  description line, and "Preview template", which opens the full flow
 *  preview (TemplatePreviewModal); actually starting the journey happens
 *  from that modal's own "Use template" button. */
function TemplateMiniCard({ template, onPreview }: { template: JourneyTemplate; onPreview: () => void }) {
  const GoalIcon = template.goal.icon;
  const tone = TONE_HEX[template.goal.tone];

  return (
    <div className="group flex flex-col rounded-2xl border border-[#DDE2EE] bg-white p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-[#B9C4DD] hover:shadow-[0_10px_24px_rgba(23,23,58,0.10)]">
      <span
        className="grid h-10 w-10 shrink-0 place-items-center rounded-lg transition-transform duration-200 group-hover:scale-110"
        style={{ backgroundColor: tone.pale }}
      >
        <GoalIcon className="h-[18px] w-[18px]" style={{ color: tone.text }} strokeWidth={2} />
      </span>

      <h4 className="mt-3 line-clamp-1 font-manrope text-[14px] font-bold leading-snug text-[#17173A]">
        {template.title}
      </h4>
      <p className="mt-1 line-clamp-2 font-manrope text-[12px] leading-snug text-[#6F6F8D]">
        {template.description}
      </p>

      <button
        type="button"
        onClick={onPreview}
        className="mt-3 flex items-center gap-1 self-start font-manrope text-[12.5px] font-semibold text-[#143F93] transition-transform duration-200 group-hover:translate-x-0.5"
      >
        <Eye className="h-3.5 w-3.5" strokeWidth={2} />
        Preview template
      </button>
    </div>
  );
}
