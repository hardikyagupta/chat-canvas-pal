import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Clock, Layers, LayoutTemplate, MousePointerClick, X, Zap } from "lucide-react";
import { CHANNEL_META, JOURNEY_TEMPLATES, TONE_HEX, type JourneyTemplate } from "./journeyTemplates.data";

/**
 * Template picker — opened from the "Create Journey" page's "Browse
 * templates" card. Two panes in one modal (no separate preview screen):
 * a scrollable list of templates on the left, and on the right either an
 * empty state (nothing picked yet) or the selected template's description +
 * a small flow preview + a "Use Template" button. Structure is loosely
 * informed by a competitor reference the user shared (list-left/detail-right
 * with an empty-state illustration) but restyled entirely in this app's own
 * design language — not a visual copy of that reference.
 */
export default function TemplateGalleryModal({
  open,
  onClose,
  onUseTemplate,
}: {
  open: boolean;
  onClose: () => void;
  onUseTemplate: (template: JourneyTemplate) => void;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (open) setSelectedId(null);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  const selected = JOURNEY_TEMPLATES.find((t) => t.id === selectedId) ?? null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#17173A]/20 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Choose a template"
        className="relative flex h-[720px] max-h-[90vh] w-full max-w-[1080px] flex-col overflow-hidden rounded-2xl bg-white shadow-[0_24px_60px_rgba(23,23,58,0.22)]"
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between px-10 py-6">
          <h2 className="font-manrope text-[20px] font-bold leading-tight text-[#17173A]">
            Choose a template
          </h2>
          <button
            aria-label="Close"
            onClick={onClose}
            className="grid h-6 w-6 place-items-center text-[#6F6F8D] transition-colors hover:text-[#17173A]"
          >
            <X className="h-5 w-5" strokeWidth={2} />
          </button>
        </div>
        <div className="shrink-0 border-t border-[#EBEBF5]" />

        <div className="grid min-h-0 flex-1 grid-cols-[320px_1fr]">
          {/* Left: template list */}
          <div className="scroll-slim min-h-0 overflow-y-auto border-r border-[#EBEBF5] p-4">
            {JOURNEY_TEMPLATES.map((t) => {
              const GoalIcon = t.goal.icon;
              const active = t.id === selectedId;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setSelectedId(t.id)}
                  className={`mb-1.5 flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left transition-colors ${
                    active ? "bg-[#F4F8FF]" : "hover:bg-[#F7F7FB]"
                  }`}
                >
                  <span
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-lg"
                    style={{ backgroundColor: TONE_HEX[t.goal.tone].pale }}
                  >
                    <GoalIcon className="h-4 w-4" style={{ color: TONE_HEX[t.goal.tone].text }} strokeWidth={2} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span
                      className={`block truncate font-manrope text-[14px] ${
                        active ? "font-bold text-[#143F93]" : "font-semibold text-[#17173A]"
                      }`}
                    >
                      {t.title}
                    </span>
                    <span className="block truncate font-manrope text-[12.5px] text-[#6F6F8D]">
                      {t.goal.label}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>

          {/* Right: empty state or selected template detail */}
          <div className="scroll-slim min-h-0 overflow-y-auto">
            {selected ? (
              <TemplateDetail template={selected} onUseTemplate={() => onUseTemplate(selected)} />
            ) : (
              <TemplateEmptyState />
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function TemplateDetail({
  template,
  onUseTemplate,
}: {
  template: JourneyTemplate;
  onUseTemplate: () => void;
}) {
  const GoalIcon = template.goal.icon;
  const goalColor = TONE_HEX[template.goal.tone].text;

  return (
    <div className="flex h-full flex-col px-8 py-7">
      <div>
        <h3 className="font-manrope text-[22px] font-bold leading-tight text-[#17173A]">
          {template.title}
        </h3>
        <p className="mt-1.5 flex items-center gap-2 font-manrope text-[14px] text-[#6F6F8D]">
          {template.industry}
          <span aria-hidden>·</span>
          <span className="flex items-center gap-1.5 font-medium" style={{ color: goalColor }}>
            <GoalIcon className="h-3.5 w-3.5" strokeWidth={2} />
            {template.goal.label}
          </span>
        </p>
        <p className="mt-3 max-w-[560px] font-manrope text-[14px] leading-relaxed text-[#17173A]">
          {template.description}
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          {template.channels.map((c) => {
            const meta = CHANNEL_META[c];
            const Icon = meta.icon;
            return (
              <span
                key={c}
                className="flex items-center gap-1.5 rounded-md border border-[#DDE2EE] px-3 py-1.5 font-manrope text-[13px] text-[#17173A]"
              >
                <Icon className="h-3.5 w-3.5 text-[#143F93]" strokeWidth={2} />
                {meta.label}
              </span>
            );
          })}
          <span className="flex items-center gap-1.5 rounded-md border border-[#DDE2EE] px-3 py-1.5 font-manrope text-[13px] text-[#17173A]">
            <Layers className="h-3.5 w-3.5 text-[#6F6F8D]" strokeWidth={2} />
            {template.steps} steps
          </span>
          <span className="flex items-center gap-1.5 rounded-md border border-[#DDE2EE] px-3 py-1.5 font-manrope text-[13px] text-[#17173A]">
            <Clock className="h-3.5 w-3.5 text-[#6F6F8D]" strokeWidth={2} />
            ~{template.setupMinutes} min setup
          </span>
        </div>
      </div>

      {/* Flow preview, on the same dot-grid canvas background as the real
          Journey Builder canvas, so this reads as a live overview. */}
      <p className="mt-6 font-manrope text-[13px] font-bold text-[#17173A]">Journey overview</p>
      <div
        className="mt-3 flex min-h-0 flex-1 flex-col items-start rounded-lg border border-[#EBEBF5] p-6"
        style={{
          backgroundColor: "#FBFCFF",
          backgroundImage: "radial-gradient(#DEE4F0 1.2px, transparent 1.2px)",
          backgroundSize: "22px 22px",
        }}
      >
        {template.preview.map((step, i) => {
          const Icon = step.icon;
          const tone = TONE_HEX[step.tone === "amber" ? "amber" : "blue"];
          return (
            <div key={i} className="flex flex-col items-start">
              <div
                className="flex min-w-[220px] items-start gap-2.5 rounded-md border bg-white px-4 py-3"
                style={{ borderColor: tone.line, backgroundColor: tone.pale }}
              >
                <Icon className="mt-0.5 h-4 w-4 shrink-0" style={{ color: tone.text }} strokeWidth={2} />
                <div>
                  <p className="font-manrope text-[14px] font-bold text-[#17173A]">{step.title}</p>
                  {step.subtitle && (
                    <p className="font-manrope text-[13px] text-[#6F6F8D]">{step.subtitle}</p>
                  )}
                </div>
              </div>
              {i < template.preview.length - 1 && <span className="ml-6 h-8 w-px bg-[#DDE2EE]" aria-hidden />}
            </div>
          );
        })}
      </div>

      <div className="mt-6 flex shrink-0 justify-end">
        <button type="button" onClick={onUseTemplate} className="dc-btn dc-btn-primary">
          Use Template
        </button>
      </div>
    </div>
  );
}

/** Nothing picked yet — a small original illustration (not a copy of any
 *  reference) built from the same node/dot-grid language as the rest of
 *  the journey builder, so the empty state still feels "in world". */
function TemplateEmptyState() {
  return (
    <div className="flex h-full flex-col items-center justify-center px-10 text-center">
      <div
        className="relative flex h-[180px] w-[260px] items-center justify-center overflow-hidden rounded-xl border border-[#EBEBF5]"
        style={{
          backgroundColor: "#FBFCFF",
          backgroundImage: "radial-gradient(#DEE4F0 1.2px, transparent 1.2px)",
          backgroundSize: "20px 20px",
        }}
      >
        <div className="flex flex-col items-center gap-2 opacity-70">
          <span className="flex items-center gap-1.5 rounded-md border border-[#DDE2EE] bg-white px-3 py-1.5">
            <Zap className="h-3 w-3 text-[#2F68E5]" strokeWidth={2} />
            <span className="h-1.5 w-16 rounded-full bg-[#DDE2EE]" />
          </span>
          <span className="h-6 w-px bg-[#DDE2EE]" aria-hidden />
          <span className="flex items-center gap-1.5 rounded-md border border-[#DDE2EE] bg-white px-3 py-1.5">
            <span className="h-1.5 w-20 rounded-full bg-[#DDE2EE]" />
          </span>
        </div>
        <span className="absolute right-5 top-5 grid h-9 w-9 -rotate-6 place-items-center rounded-full bg-white shadow-[0_4px_10px_rgba(23,23,58,0.12)]">
          <MousePointerClick className="h-4 w-4 text-[#9449DF]" strokeWidth={2} />
        </span>
      </div>

      <span className="mt-6 grid h-11 w-11 place-items-center rounded-lg bg-[#EAF1FF]">
        <LayoutTemplate className="h-5 w-5 text-[#2F68E5]" strokeWidth={2} />
      </span>
      <h3 className="mt-3 font-manrope text-[16px] font-bold text-[#17173A]">
        Select a template to preview
      </h3>
      <p className="mt-1.5 max-w-[260px] font-manrope text-[13.5px] leading-snug text-[#6F6F8D]">
        Pick any journey on the left to see what it does and how it flows.
      </p>
    </div>
  );
}
