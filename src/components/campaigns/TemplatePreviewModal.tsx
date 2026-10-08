import { Fragment, useEffect } from "react";
import { createPortal } from "react-dom";
import { Clock, Layers, X, Zap } from "lucide-react";
import "./journey-canvas.css";
import { CHANNEL_META, TONE_HEX, type JourneyTemplate } from "./journeyTemplates.data";

/**
 * "Preview template" — opened from a template card on the Create Journey
 * page (JourneyCreate.tsx). Left pane is the template's own info (the same
 * fields the card summarizes, in full); right pane is a static, read-only
 * render of its flow using the exact same node/connector classes as the real
 * Journey Builder canvas (journey-canvas.css's `.jc-canvas`/`.jc-pending-*`/
 * `.jc-added-node`), so this reads as a live look at what "Use template"
 * will actually build — not a separate, differently-styled mockup.
 */
export default function TemplatePreviewModal({
  template,
  onClose,
  onUseTemplate,
}: {
  template: JourneyTemplate | null;
  onClose: () => void;
  onUseTemplate: (template: JourneyTemplate) => void;
}) {
  useEffect(() => {
    if (!template) return;
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
  }, [template, onClose]);

  if (!template) return null;

  const goalColor = TONE_HEX[template.goal.tone].text;
  const tags = Array.from(new Set([template.goal.label, template.industry, ...template.tags]));

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#17173A]/20 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={template.title}
        className="relative flex h-[720px] max-h-[90vh] w-full max-w-[1080px] flex-col overflow-hidden rounded-2xl bg-white shadow-[0_24px_60px_rgba(23,23,58,0.22)]"
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between px-8 py-6">
          <h2 className="font-manrope text-[22px] font-bold leading-tight text-[#17173A]">
            {template.title}
          </h2>
          <button
            aria-label="Close"
            onClick={onClose}
            className="grid h-6 w-6 shrink-0 place-items-center text-[#6F6F8D] transition-colors hover:text-[#17173A]"
          >
            <X className="h-5 w-5" strokeWidth={2} />
          </button>
        </div>
        <div className="shrink-0 border-t border-[#EBEBF5]" />

        <div className="grid min-h-0 flex-1 grid-cols-[360px_1fr]">
          {/* Left: template info */}
          <div className="scroll-slim flex min-h-0 flex-col overflow-y-auto border-r border-[#EBEBF5] px-6 py-6">
            <p className="font-manrope text-[13px] font-bold uppercase tracking-[0.06em] text-[#6F6F8D]">
              Description
            </p>
            <p className="mt-2 font-manrope text-[14px] leading-relaxed text-[#17173A]">
              {template.description}
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-[#DDE2EE] px-3 py-1 font-manrope text-[12.5px] font-medium text-[#17173A]"
                >
                  {tag}
                </span>
              ))}
            </div>

            <div className="mt-5 border-t border-[#EBEBF5] pt-5">
              <p className="font-manrope text-[13px] font-bold uppercase tracking-[0.06em] text-[#6F6F8D]">
                Channels
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
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

            <div className="mt-5 border-t border-[#EBEBF5] pt-5">
              <p className="font-manrope text-[13px] font-bold uppercase tracking-[0.06em] text-[#6F6F8D]">
                Trigger
              </p>
              <div className="mt-2 flex items-center gap-2.5">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-[#EAF1FF]">
                  <Zap className="h-4 w-4 text-[#2F68E5]" strokeWidth={2} />
                </span>
                <span className="font-manrope text-[14px] font-semibold text-[#17173A]">
                  {template.trigger}
                </span>
              </div>
            </div>

            <p className="mt-5 flex items-center gap-2 font-manrope text-[13px] text-[#6F6F8D]">
              {template.industry}
              <span aria-hidden>·</span>
              <span className="flex items-center gap-1.5 font-medium" style={{ color: goalColor }}>
                {template.goal.label}
              </span>
            </p>

            <div className="mt-auto flex justify-end gap-2 pt-6">
              <button type="button" onClick={onClose} className="dc-btn dc-btn-secondary">
                Cancel
              </button>
              <button type="button" onClick={() => onUseTemplate(template)} className="dc-btn dc-btn-primary">
                Use template
              </button>
            </div>
          </div>

          {/* Right: the flow, rendered with the real Journey Canvas's own
              node/connector classes (see journey-canvas.css) — a read-only
              instance of `.jc-canvas` rather than a separate mockup. */}
          <div
            className="jc-canvas rounded-none border-0 shadow-none"
            style={{
              backgroundColor: "#FBFCFF",
              backgroundImage: "radial-gradient(#DEE4F0 1.2px, transparent 1.2px)",
              backgroundSize: "22px 22px",
            }}
          >
            <div className="scroll-slim flex h-full items-center justify-center overflow-auto p-10">
              <TemplateFlowPreview template={template} />
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

/** The template's flow, as a straight `.jc-pending` chain — trigger card,
 *  then each preview step as an `.jc-added-node` in its own tone, exactly
 *  the way a real from-scratch journey with no branches renders on canvas. */
function TemplateFlowPreview({ template }: { template: JourneyTemplate }) {
  const [triggerStep, ...restSteps] = template.preview;
  const TriggerIcon = triggerStep?.icon ?? Zap;

  return (
    <div className="jc-pending">
      <div className="jc-pending-node">
        <span className="jc-pending-icon">
          <TriggerIcon strokeWidth={2} />
        </span>
        <span className="jc-pending-text">
          <strong>Trigger</strong>
          <span>{triggerStep?.subtitle ?? template.trigger}</span>
        </span>
      </div>

      {restSteps.map((step, i) => {
        const Icon = step.icon;
        const tone = step.type === "wait" ? "flow" : "action";
        return (
          <Fragment key={i}>
            <span className="jc-pending-line" aria-hidden />
            <div className={`jc-added-node tone-${tone}`}>
              <span className="jc-added-icon">
                <Icon strokeWidth={1.9} />
              </span>
              <span className="font-manrope text-[14px] font-bold text-[#17173A]">{step.title}</span>
            </div>
          </Fragment>
        );
      })}

      <span className="jc-pending-line" aria-hidden />
      <span className="jc-pending-end">End</span>
    </div>
  );
}
