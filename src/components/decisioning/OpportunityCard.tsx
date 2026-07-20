import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";

export interface Opportunity {
  title: string;
  tags: string[];
  valueTag: string;
  channelTags: string[];
  confidence: "high" | "medium";
  description: string;
  creativeTags: string[];
  evidence: string;
}

/** Chip shared by every tag row — rendered in a monospace face to match the
    data-driven look of the ranked opportunities list. */
function Chip({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "neutral" | "positive" }) {
  return (
    <span
      className={`inline-flex items-center rounded-[4px] px-2 py-1 font-mono text-[12px] leading-none ${
        tone === "positive"
          ? "bg-[#E7F7EF] text-[#00A576]"
          : "bg-[#EEF1F7] text-[#4B4B68]"
      }`}
    >
      {children}
    </span>
  );
}

/**
 * A single ranked opportunity — the audience, its expected value, and a
 * "Create objective" CTA that seeds an objective from this insight. Every
 * card uses the same neutral grey treatment regardless of rank.
 */
export default function OpportunityCard({
  opportunity,
  rank,
}: {
  opportunity: Opportunity;
  rank: number;
}) {
  const navigate = useNavigate();

  return (
    <div className="relative rounded-xl border border-[#E6EAF4] bg-white p-6 pt-8">
      <span className="absolute -top-3 left-6 rounded-[4px] bg-[#9A9AB0] px-2.5 py-1 font-manrope text-[12px] font-bold text-white">
        #{rank}
      </span>

      <h3 className="font-manrope text-[18px] font-bold leading-tight text-[#17173A]">
        {opportunity.title}
      </h3>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {opportunity.tags.map((t) => (
          <Chip key={t}>{t}</Chip>
        ))}
        <Chip tone="positive">{opportunity.valueTag}</Chip>
        {opportunity.channelTags.map((c) => (
          <Chip key={c}>{c}</Chip>
        ))}
        <Chip tone="positive">{opportunity.confidence} confidence</Chip>
      </div>

      <p className="mt-4 max-w-[820px] font-manrope text-[14px] leading-[22px] text-[#6F6F8D]">
        {opportunity.description}
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="font-manrope text-[13px] text-[#6F6F8D]">creative:</span>
        {opportunity.creativeTags.map((c) => (
          <Chip key={c}>{c}</Chip>
        ))}
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button
          onClick={() =>
            navigate("/decisioning-engine/objective/new", {
              state: { objectiveName: opportunity.title },
            })
          }
          className="dc-btn dc-btn-primary"
        >
          <Plus strokeWidth={2.5} />
          Create objective
        </button>
        <Chip>evidence: {opportunity.evidence}</Chip>
      </div>
    </div>
  );
}
