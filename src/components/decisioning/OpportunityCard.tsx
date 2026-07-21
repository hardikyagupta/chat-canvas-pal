import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { BarChart3, ChevronDown, Plus, Target } from "lucide-react";

export interface Opportunity {
  title: string;
  /** Named segment this opportunity targets. */
  audience: string;
  /** Approximate reachable audience size, e.g. "~664K people". */
  reach: string;
  /** Expected value per conversion, e.g. "₹400 / conversion". */
  value: string;
  /** Channels to activate, e.g. "WhatsApp + Email". */
  channels: string;
  confidence: "high" | "medium";
  /** The objective the engine recommends seeding from this insight. */
  recommendedObjective: string;
  /** The reasoning behind the opportunity — shown alongside the metrics when
      the card is expanded. */
  detail: string;
}

/** One labelled metric in the summary row. */
function Metric({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="min-w-0">
      <div className="font-manrope text-[12px] font-medium text-[#9A9AB0]">{label}</div>
      <div
        className={`mt-1 truncate font-manrope text-[15px] font-semibold ${
          accent ? "text-[#00A576]" : "text-[#17173A]"
        }`}
      >
        {value}
      </div>
    </div>
  );
}

/**
 * A single ranked opportunity. Collapsed, it shows just the ranked title and
 * confidence; expanded, it reveals the full summary (audience, reach, value,
 * channels), the supporting reasoning, the recommended objective and a
 * "Create objective" CTA.
 */
export default function OpportunityCard({
  opportunity,
  rank,
}: {
  opportunity: Opportunity;
  rank: number;
}) {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="rounded-2xl border border-[#E6EAF4] bg-white p-6">
      {/* Header — rank, title, confidence + expand toggle */}
      <div className="flex items-start gap-4">
        <span className="flex h-9 shrink-0 items-center rounded-lg bg-[#EEF3FE] px-3 font-manrope text-[14px] font-bold text-[#2F68E5]">
          {String(rank).padStart(2, "0")}
        </span>
        <h3 className="mt-1 min-w-0 flex-1 font-manrope text-[18px] font-bold leading-snug text-[#17173A]">
          {opportunity.title}
        </h3>
        <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-[#E7F7EF] px-3 py-1.5 font-manrope text-[12px] font-semibold text-[#00A576]">
          <BarChart3 className="h-3.5 w-3.5" strokeWidth={2} />
          {opportunity.confidence === "high" ? "High" : "Medium"} confidence
        </span>
        <button
          onClick={() => setExpanded((v) => !v)}
          aria-label={expanded ? "Collapse" : "Expand"}
          className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[#9A9AB0] transition-colors hover:bg-[#EEF1F7] hover:text-[#17173A]"
        >
          <ChevronDown
            className={`h-5 w-5 transition-transform ${expanded ? "rotate-180" : ""}`}
            strokeWidth={2}
          />
        </button>
      </div>

      {expanded && (
        <>
          {/* Metric summary */}
          <div className="mt-5 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4">
            <Metric label="Audience" value={opportunity.audience} />
            <Metric label="Reach" value={opportunity.reach} />
            <Metric label="Value" value={opportunity.value} accent />
            <Metric label="Channels" value={opportunity.channels} />
          </div>

          {/* Reasoning */}
          <p className="mt-5 font-manrope text-[14px] leading-[22px] text-[#6F6F8D]">
            {opportunity.detail}
          </p>

          {/* Recommended objective */}
          <div className="mt-5 flex flex-wrap items-center gap-2">
            <Target className="h-4 w-4 text-[#2F68E5]" strokeWidth={1.8} />
            <span className="font-manrope text-[13px] text-[#9A9AB0]">Recommended objective</span>
            <span className="font-manrope text-[14px] font-semibold text-[#2F68E5]">
              {opportunity.recommendedObjective}
            </span>
          </div>

          {/* Action */}
          <div className="mt-5">
            <button
              onClick={() =>
                navigate("/decisioning-engine/objective/v2", {
                  state: { objectiveName: opportunity.recommendedObjective },
                })
              }
              className="dc-btn dc-btn-primary"
            >
              <Plus strokeWidth={2.5} />
              Create objective
            </button>
          </div>
        </>
      )}
    </div>
  );
}
