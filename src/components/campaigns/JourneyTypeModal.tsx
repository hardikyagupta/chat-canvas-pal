import { useEffect, useRef, useState } from "react";
import { ChevronDown, Plus, Search, X } from "lucide-react";
import sparkle from "/campaign-assets/ic-sparkle-ai.gif";

/**
 * "Which type of journey would you like to create?" — a right-side drawer
 * overlay shown before the user lands on the journey builder (Figma node
 * 16791:23795). An Industry filter, a grid of journey templates (with the
 * blank "Create New" card selected by default), and a PROCEED action.
 */

interface JourneyTemplate {
  id: string;
  title: string;
  description: string;
  industry: string;
}

const TEMPLATES: JourneyTemplate[] = [
  {
    id: "convert-shoppers",
    title: "Convert window shoppers into customers",
    description: "Engage with shoppers who seem to be interested in your products",
    industry: "ECommerce",
  },
  {
    id: "reduce-abandonment",
    title: "Reduce shopping cart abandonement",
    description: "Target shoppers who have left products in their cart",
    industry: "ECommerce",
  },
  {
    id: "post-purchase",
    title: "Post purchase upsell targeting",
    description: "Target customers with products which might interest them",
    industry: "ECommerce",
  },
  {
    id: "prevent-churn",
    title: "Prevent churn of existing customers",
    description: "Target customers and engage with them before they churn",
    industry: "ECommerce",
  },
  {
    id: "one-step-welcome",
    title: "One step welcome",
    description:
      "One step Welcome Journey, reaching out to users only where they are Reachable; Strictly one communication sent once!",
    industry: "ECommerce",
  },
];

export default function JourneyTypeModal({
  open,
  onClose,
  onProceed,
}: {
  open: boolean;
  onClose: () => void;
  onProceed: (selectedId: string) => void;
}) {
  // Three-flag mount/enter so the drawer slides + backdrop fades on both open
  // and close instead of snapping.
  const [rendered, setRendered] = useState(open);
  const [entered, setEntered] = useState(false);
  const closeTimer = useRef<number>();
  const [selected, setSelected] = useState("create-new");

  useEffect(() => {
    window.clearTimeout(closeTimer.current);
    if (open) {
      setRendered(true);
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
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [rendered, onClose]);

  if (!rendered) return null;

  return (
    <div className="fixed inset-0 z-[100]">
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-[#17173A]/30 transition-opacity duration-[280ms] ${
          entered ? "opacity-100" : "opacity-0"
        }`}
        onClick={onClose}
        aria-hidden
      />

      {/* Right drawer */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Which type of journey would you like to create?"
        className={`absolute right-0 top-0 flex h-full w-[746px] max-w-[94vw] flex-col bg-white shadow-[-12px_0_40px_rgba(23,23,58,0.16)] transition-transform duration-[280ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
          entered ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-10 pt-8">
          <h2 className="max-w-[560px] font-manrope text-[22px] font-bold leading-tight text-[#17173A]">
            Which type of journey would you like to create?
          </h2>
          <button
            aria-label="Close"
            onClick={onClose}
            className="mt-1 grid h-6 w-6 place-items-center text-[#6F6F8D] transition-colors hover:text-[#17173A]"
          >
            <X className="h-5 w-5" strokeWidth={2} />
          </button>
        </div>

        {/* Body */}
        <div className="scroll-slim min-h-0 flex-1 overflow-y-auto px-10 pb-6 pt-6">
          {/* Industry filter row */}
          <label className="block font-manrope text-sm font-medium text-[#17173A]">Industry</label>
          <div className="mt-2 flex items-center justify-between gap-4">
            <button
              type="button"
              className="flex h-11 w-[320px] max-w-[52%] items-center justify-between rounded-md bg-[#F4F4F8] px-4 font-manrope text-[15px] text-[#17173A] transition-colors hover:bg-[#EEEEF4]"
            >
              ECommerce
              <ChevronDown className="h-4 w-4 text-[#6F6F8D]" strokeWidth={2} />
            </button>
            <button
              aria-label="Search journeys"
              className="grid h-11 w-11 place-items-center rounded-md border border-[#DDE2EE] bg-white text-[#6F6F8D] transition-colors hover:bg-[#F4F8FF]"
            >
              <Search className="h-[18px] w-[18px]" strokeWidth={2} />
            </button>
          </div>

          {/* Template grid */}
          <div className="mt-6 grid grid-cols-2 gap-5">
            {/* Create New */}
            <button
              type="button"
              onClick={() => setSelected("create-new")}
              className={`flex min-h-[172px] flex-col items-center justify-center rounded-[10px] border bg-white px-6 text-center transition-colors ${
                selected === "create-new"
                  ? "border-2 border-[#143F93]"
                  : "border border-[#DDE2EE] hover:border-[#B9C4DD]"
              }`}
            >
              <span className="relative">
                <Plus className="mx-auto h-6 w-6 text-[#143F93]" strokeWidth={2.5} />
                <span className="mt-2 block font-manrope text-base font-bold text-[#143F93]">
                  Create New
                </span>
                <span className="mt-1 block max-w-[210px] font-manrope text-[13px] leading-snug text-[#6F6F8D]">
                  Create a new Journey with a blank canvas
                </span>
              </span>
            </button>

            {/* Create with AI */}
            <button
              type="button"
              onClick={() => setSelected("create-with-ai")}
              className={`flex min-h-[172px] flex-col items-center justify-center rounded-[10px] bg-white px-6 text-center transition-colors ${
                selected === "create-with-ai"
                  ? "border-2 border-[#143F93]"
                  : "border border-[#DDE2EE] hover:border-[#B9C4DD]"
              }`}
            >
              <span className="relative">
                <img src={sparkle} alt="" className="mx-auto h-7 w-7" />
                <span className="mt-2 block font-manrope text-base font-bold text-[#143F93]">
                  Create with AI
                </span>
                <span className="mt-1 block max-w-[230px] font-manrope text-[13px] leading-snug text-[#6F6F8D]">
                  Let AI draft a complete journey from your objective
                </span>
              </span>
            </button>

            {/* Templates */}
            {TEMPLATES.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setSelected(t.id)}
                className={`flex min-h-[172px] flex-col rounded-[10px] bg-white p-5 text-left transition-colors ${
                  selected === t.id
                    ? "border-2 border-[#143F93]"
                    : "border border-[#DDE2EE] hover:border-[#B9C4DD]"
                }`}
              >
                <h3 className="font-manrope text-base font-bold leading-snug text-[#17173A]">
                  {t.title}
                </h3>
                <p className="mt-2 font-manrope text-sm leading-snug text-[#6F6F8D]">
                  {t.description}
                </p>
                <p className="mt-auto pt-4 font-manrope text-sm text-[#6F6F8D]">
                  Industry: <span className="font-semibold text-[#17173A]">{t.industry}</span>
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-10 py-6">
          <button
            onClick={() => onProceed(selected)}
            className="rounded bg-[#143F93] px-5 py-2.5 font-manrope text-sm font-semibold uppercase tracking-[0.42px] text-white transition-colors hover:bg-[#0f3277]"
          >
            Proceed
          </button>
        </div>
      </div>
    </div>
  );
}
