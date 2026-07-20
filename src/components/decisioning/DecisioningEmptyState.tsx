import { useNavigate } from "react-router-dom";
import {
  BookOpen,
  BrainCircuit,
  Check,
  Clock,
  Database,
  FileText,
  Settings,
  ShieldCheck,
  ShoppingBag,
  Tag,
  Target,
  User,
} from "lucide-react";
import iconDecisioning from "/campaign-assets/nav-decisioning.svg";
import { useDecisioningSetup } from "@/contexts/DecisioningSetupContext";

/* ------------------------------------------------------------------ */
/* LHS content                                                         */
/* ------------------------------------------------------------------ */

const STEPS = [
  {
    icon: BookOpen,
    title: "Teach the engine",
    desc: "Add brand context, map events and define guardrails",
  },
  {
    icon: Settings,
    title: "Prepare the engine",
    desc: "We validate your setup and prepare decision models",
  },
  {
    icon: Target,
    title: "Create an objective",
    desc: "Choose the business outcome the engine should optimise for",
  },
];

const HIGHLIGHTS = [
  {
    icon: Database,
    title: "Built around your data",
    desc: "Works seamlessly with your existing stack",
  },
  {
    icon: ShieldCheck,
    title: "Operates within your guardrails",
    desc: "Respects policies, limits and preferences",
  },
  {
    icon: FileText,
    title: "Every decision remains traceable",
    desc: "Full visibility into why decisions are made",
  },
];

/* ------------------------------------------------------------------ */
/* Illustration — an exact replica of the decision-flow diagram.       */
/* Cards are absolutely positioned within a fixed 540×560 canvas so    */
/* they line up with the SVG connectors drawn behind them.             */
/* ------------------------------------------------------------------ */

/** Shared entrance animation — fade + gentle rise, held hidden until the delay. */
const FLOW_ANIM =
  "animate-in fade-in zoom-in-95 slide-in-from-top-2 fill-mode-both duration-500 ease-out";

function FlowCard({
  style,
  icon: Icon,
  iconImg,
  iconBg,
  iconColor,
  title,
  subtitle,
  selected,
  compact,
  delayMs,
  shine,
}: {
  style: React.CSSProperties;
  icon?: React.ElementType;
  /** When set, renders this image instead of the lucide `icon`. */
  iconImg?: string;
  iconBg?: string;
  iconColor?: string;
  title: string;
  subtitle?: string;
  selected?: boolean;
  compact?: boolean;
  delayMs?: number;
  /** Sweeps a left-to-right shine once per relay cycle — "action taken". */
  shine?: boolean;
}) {
  const hasIcon = Boolean(iconImg || Icon);
  return (
    <div
      className={`absolute flex items-center gap-2.5 rounded-xl bg-white px-3 ${
        hasIcon ? "" : "justify-center text-center"
      } ${shine ? "overflow-hidden" : ""} ${
        compact ? "py-2.5" : "py-3"
      } shadow-[0px_6px_16px_rgba(23,23,58,0.06)] ${
        selected ? "border-2 border-[#2F68E5]" : "border border-[#E6EAF4]"
      } ${FLOW_ANIM}`}
      style={{ ...style, animationDelay: `${delayMs ?? 0}ms` }}
    >
      {selected && (
        <span className="absolute -right-2 -top-2 grid h-5 w-5 place-items-center rounded-full border-2 border-white bg-[#2F68E5]">
          <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />
        </span>
      )}
      {hasIcon && (
        <span
          className="grid h-8 w-8 shrink-0 place-items-center rounded-lg"
          style={{ backgroundColor: iconBg }}
        >
          {iconImg ? (
            <img src={iconImg} alt="" className="h-5 w-5" />
          ) : (
            Icon && <Icon className="h-4 w-4" strokeWidth={1.8} style={{ color: iconColor }} />
          )}
        </span>
      )}
      <div className="min-w-0">
        <div className="font-manrope text-[13px] font-bold leading-tight text-[#17173A]">
          {title}
        </div>
        {subtitle && (
          <div className="mt-0.5 truncate font-manrope text-[11px] leading-tight text-[#6F6F8D]">
            {subtitle}
          </div>
        )}
      </div>
      {shine && (
        <span
          className="pointer-events-none absolute inset-y-0 left-0 w-3/5 blur-[1px] bg-[linear-gradient(100deg,transparent_10%,rgba(232,236,244,0.55)_34%,rgba(255,255,255,0.85)_46%,#ffffff_50%,rgba(255,255,255,0.85)_54%,rgba(232,236,244,0.55)_66%,transparent_90%)]"
          style={{ animation: "cardShine 5s linear 2100ms infinite both" }}
        />
      )}
    </div>
  );
}

export function DecisioningIllustration() {
  return (
    <div className="relative h-[560px] w-[540px] shrink-0 overflow-visible">
      {/* Connectors — each segment fades in with the node it feeds into */}
      <svg
        viewBox="0 0 540 560"
        className="absolute inset-0 h-full w-full"
        fill="none"
      >
        <defs>
          <marker
            id="arrow"
            viewBox="0 0 12 12"
            refX="7.5"
            refY="6"
            markerWidth="14"
            markerHeight="14"
            markerUnits="userSpaceOnUse"
            orient="auto-start-reverse"
          >
            <path
              d="M3 1.5 L8.5 6 L3 10.5"
              fill="none"
              stroke="#B7C4E6"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </marker>
        </defs>

        {/* Base connectors — each fades in just as its target node lands, so the
            line leads into the node rather than showing up ahead of the flow.
            Corners are rounded (Q curves) instead of hard right angles. */}
        <g stroke="#D8E0F1" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
          {/* signal -> engine (the ellipse + card are one DE unit) */}
          <line
            x1="270" y1="66" x2="270" y2="94" markerEnd="url(#arrow)"
            className="animate-in fade-in fill-mode-both duration-500"
            style={{ animationDelay: "200ms" }}
          />
          {/* engine -> branches (curved corners) */}
          <g className="animate-in fade-in fill-mode-both duration-500" style={{ animationDelay: "880ms" }}>
            <path d="M270 233 V288" />
            <path d="M270 288 H104 Q90 288 90 302 V320" markerEnd="url(#arrow)" />
            <path d="M270 288 V320" markerEnd="url(#arrow)" />
            <path d="M270 288 H436 Q450 288 450 302 V320" markerEnd="url(#arrow)" />
          </g>
          {/* feedback loop — the chosen action's outcome is learned, and that
              learning loops back into the action layer (Send offer) below the
              row, so the engine keeps improving its next-best-action choice */}
          <g className="animate-in fade-in fill-mode-both duration-500" style={{ animationDelay: "1620ms" }}>
            <path d="M450 378 C 450 452 430 494 372 494" strokeDasharray="5 5" markerEnd="url(#arrow)" />
            <path d="M168 494 C 120 494 90 452 90 384" strokeDasharray="5 5" markerEnd="url(#arrow)" />
          </g>
        </g>

        {/* Traveling pulse — RELAYS through the path in the order decisioning
            actually works: (1) customer signal reaches the engine, (2) engine
            evaluates and (3) selects the single best action (Recommend item),
            (4) the outcome is observed and learned, (5) that learning feeds
            back into the engine to sharpen the next decision. One dot at a
            time, handing off segment to segment, then repeating. The other two
            branches are options considered but not chosen, so they stay static. */}
        <g stroke="#4B7BEA" strokeWidth="3" fill="none" strokeLinecap="round" strokeDasharray="0.16 1">
          {/* 1 · signal -> engine */}
          <path pathLength="1" d="M270 66 V94" style={{ animation: "flowSeg1 5s linear 2100ms infinite both" }} />
          {/* 2 · engine -> Recommend item (selected) */}
          <path pathLength="1" d="M270 233 V288 H436 Q450 288 450 302 V320" style={{ animation: "flowSeg2 5s linear 2100ms infinite both" }} />
          {/* 3 · Recommend item -> Learns from outcome */}
          <path pathLength="1" d="M450 378 C 450 452 430 494 372 494" style={{ animation: "flowSeg3 5s linear 2100ms infinite both" }} />
          {/* 4 · Learns from outcome -> back into the action layer (Send offer) */}
          <path pathLength="1" d="M168 494 C 120 494 90 452 90 384" style={{ animation: "flowSeg4 5s linear 2100ms infinite both" }} />
        </g>
      </svg>

      {/* Engine node */}
      <div
        className={`absolute ${FLOW_ANIM}`}
        style={{ left: 214, top: 84, animationDelay: "350ms" }}
      >
        <div className="relative grid h-28 w-28 place-items-center">
          <span
            className="absolute h-[76px] w-[76px] rounded-full bg-[#FDE0C8]"
            style={{ animation: "deHalo 2.6s ease-out infinite" }}
          />
          <span className="absolute h-16 w-16 rounded-full bg-[#FBD9BC] opacity-70" />
          <span className="relative grid h-14 w-14 place-items-center rounded-full border border-[#FCE3CE] bg-[#FFF1E6] shadow-[0px_8px_20px_rgba(252,94,2,0.18)]">
            <img src={iconDecisioning} alt="" className="h-8 w-8" />
          </span>
        </div>
      </div>

      {/* Customer signal */}
      <FlowCard
        style={{ left: 145, top: 8, width: 250 }}
        icon={User}
        iconBg="#E7EDFF"
        iconColor="#2F68E5"
        title="Customer signal"
        subtitle="Product viewed twice"
        delayMs={0}
      />

      {/* Decisioning engine — no icon (the ellipse above is the single DE
          reference); comes in together with the ellipse */}
      <FlowCard
        style={{ left: 135, top: 178, width: 270 }}
        title="Decisioning engine"
        subtitle="Evaluates intent, eligibility and guardrails"
        compact
        delayMs={350}
      />

      {/* Actions */}
      <FlowCard
        style={{ left: 15, top: 324, width: 150 }}
        icon={Tag}
        iconBg="#E7EFEA"
        iconColor="#00C48C"
        title="Send offer"
        compact
        delayMs={1000}
        shine
      />
      <FlowCard
        style={{ left: 195, top: 324, width: 150 }}
        icon={Clock}
        iconBg="#FFEEDF"
        iconColor="#FC5E02"
        title="Wait 24 hours"
        compact
        delayMs={1080}
      />
      <FlowCard
        style={{ left: 375, top: 324, width: 150 }}
        icon={ShoppingBag}
        iconBg="#E7EDFF"
        iconColor="#2F68E5"
        title="Recommend item"
        selected
        compact
        delayMs={1160}
      />

      {/* Selected pill */}
      <div
        className={`absolute flex items-center gap-2 rounded-lg bg-[#E7EFEA] px-3 py-2 ${FLOW_ANIM}`}
        style={{ left: 105, top: 404, width: 330, animationDelay: "1350ms" }}
      >
        <span className="grid h-4 w-4 shrink-0 place-items-center rounded-full bg-[#00C48C]">
          <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />
        </span>
        <span className="font-manrope text-[12px] font-semibold text-[#17173A]">
          Selected: Recommend a complementary product
        </span>
      </div>

      {/* Learns from outcome */}
      <FlowCard
        style={{ left: 175, top: 468, width: 190 }}
        icon={BrainCircuit}
        iconBg="#E7EDFF"
        iconColor="#2F68E5"
        title="Learns from outcome"
        compact
        delayMs={1500}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */

export default function DecisioningEmptyState() {
  const navigate = useNavigate();
  const { status, configuredCount } = useDecisioningSetup();
  const resuming = status === "configuring";

  return (
    <div className="w-full">
      {/* Hero */}
      <div className="flex w-full items-start gap-10 rounded-2xl bg-white p-10">
        {/* Copy */}
        <div className="flex min-w-0 flex-1 flex-col pt-2">
          <span className="font-manrope text-[12px] font-bold uppercase tracking-[0.6px] text-[#2F68E5]">
            Decisioning engine
          </span>
          <h2 className="mt-3 font-manrope text-[34px] font-extrabold leading-[1.15] text-[#17173A]">
            Turn customer signals into
            <br />
            the next best action
          </h2>
          <p className="mt-4 font-manrope text-[14px] leading-[22px] text-[#6F6F8D]">
            Set up your brand context, customer events and operating guardrails.
            Once ready, the decisioning engine continuously evaluates each
            eligible customer and selects the best action for your objectives.
          </p>

          {/* Steps */}
          <ol className="mt-7 flex flex-col gap-3">
            {STEPS.map((step) => (
              <li
                key={step.title}
                className="flex items-center gap-3.5 rounded-xl border border-[#E6EAF4] p-3.5"
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[#EEF3FF]">
                  <step.icon className="h-5 w-5 text-[#2F68E5]" strokeWidth={1.8} />
                </span>
                <div className="min-w-0">
                  <div className="font-manrope text-[14px] font-bold text-[#17173A]">
                    {step.title}
                  </div>
                  <div className="mt-0.5 font-manrope text-[13px] leading-[18px] text-[#6F6F8D]">
                    {step.desc}
                  </div>
                </div>
              </li>
            ))}
          </ol>

          {resuming && (
            <p className="mt-6 font-manrope text-[12px] font-semibold text-[#2F68E5]">
              You're partway there — {configuredCount} of 3 steps done.
            </p>
          )}

          <button
            onClick={() => navigate("/decisioning-engine/preview")}
            className={`${
              resuming ? "mt-2" : "mt-8"
            } flex w-fit items-center gap-2 rounded-lg bg-[#2F68E5] px-5 py-3 font-manrope text-[14px] font-semibold tracking-[0.3px] text-white transition-colors hover:bg-[#255ad2]`}
          >
            {resuming ? "Resume setup" : "GET STARTED"}
          </button>

          <p className="mt-4 font-manrope text-[12px] text-[#9A9AB0]">
            About 10 minutes of setup · Preparation continues in the background
          </p>
        </div>

        {/* Illustration */}
        <DecisioningIllustration />
      </div>

      {/* Highlights strip */}
      <div className="mt-2 grid w-full grid-cols-1 gap-6 rounded-2xl bg-white p-8 md:grid-cols-3">
        {HIGHLIGHTS.map((h) => (
          <div key={h.title} className="flex items-start gap-3.5">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#EEF3FF]">
              <h.icon className="h-5 w-5 text-[#2F68E5]" strokeWidth={1.8} />
            </span>
            <div className="min-w-0">
              <div className="font-manrope text-[14px] font-bold text-[#17173A]">
                {h.title}
              </div>
              <div className="mt-0.5 font-manrope text-[13px] leading-[18px] text-[#6F6F8D]">
                {h.desc}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
