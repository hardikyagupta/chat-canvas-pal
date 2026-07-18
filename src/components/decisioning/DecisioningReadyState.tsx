import { useNavigate } from "react-router-dom";
import { BookOpen, Check, GitMerge, ShieldCheck, Target } from "lucide-react";
import {
  STANDARD_EVENTS,
  useDecisioningSetup,
} from "@/contexts/DecisioningSetupContext";

const INTENT_EXAMPLES = ["Repeat purchase", "Acquisition", "Reactivation"];

/**
 * Post-processing state — the engine is live; invite the user to create
 * their first objective (intent + horizon + value per conversion).
 */
export default function DecisioningReadyState() {
  const navigate = useNavigate();
  const { eventMapping, guardrails } = useDecisioningSetup();

  const mappedCount = eventMapping
    ? STANDARD_EVENTS.filter(
        (e) => eventMapping.mappings[e.id] && eventMapping.mappings[e.id] !== "none"
      ).length
    : 0;

  return (
    <div className="mx-auto mt-8 flex w-full max-w-[640px] flex-col gap-4">
      {/* Live banner */}
      <div className="flex flex-col items-center rounded-lg border border-[#DDE2EE] bg-white p-8 text-center">
        <span className="grid h-12 w-12 place-items-center rounded-full bg-[#E7EFEA] animate-in zoom-in duration-500">
          <Check className="h-6 w-6 text-[#00C48C]" strokeWidth={2.5} />
        </span>
        <h2 className="mt-4 font-manrope text-[20px] font-bold leading-tight text-[#17173A]">
          Your decisioning engine is live
        </h2>
        <p className="mt-1.5 max-w-[420px] font-manrope text-[13px] leading-[19px] text-[#6F6F8D]">
          It's grounded in your brand, connected to your events, and operating inside
          your guardrails.
        </p>

        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          <span className="flex items-center gap-1.5 rounded bg-[#E7EDFF] px-2.5 py-1 font-manrope text-xs font-semibold text-[#2F68E5]">
            <BookOpen className="h-3 w-3" strokeWidth={2} />
            Brand wiki loaded
          </span>
          <span className="flex items-center gap-1.5 rounded bg-[#E7EDFF] px-2.5 py-1 font-manrope text-xs font-semibold text-[#2F68E5]">
            <GitMerge className="h-3 w-3" strokeWidth={2} />
            {mappedCount} events connected
          </span>
          <span className="flex items-center gap-1.5 rounded bg-[#E7EFEA] px-2.5 py-1 font-manrope text-xs font-semibold text-[#00C48C]">
            <ShieldCheck className="h-3 w-3" strokeWidth={2} />
            {guardrails ? "4 guardrails active" : "Guardrails active"}
          </span>
        </div>
      </div>

      {/* First objective invitation */}
      <div className="flex items-center gap-5 rounded-lg border border-[#DDE2EE] bg-white p-6">
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-[#E7EDFF]">
          <Target className="h-6 w-6 text-[#2F68E5]" strokeWidth={1.8} />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-manrope text-[15px] font-bold text-[#17173A]">
            Create your first objective
          </h3>
          <p className="mt-0.5 font-manrope text-[13px] leading-[19px] text-[#6F6F8D]">
            Set a goal in business terms — an intent, a horizon, and a value per
            conversion — and the engine finds the customers and the moves.
          </p>
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {INTENT_EXAMPLES.map((intent) => (
              <span
                key={intent}
                className="rounded border border-[#DDE2EE] px-2 py-0.5 font-manrope text-[11px] font-medium text-[#6F6F8D]"
              >
                {intent}
              </span>
            ))}
          </div>
        </div>
        <button
          onClick={() => navigate("/decisioning-engine/objective/new")}
          className="shrink-0 rounded bg-[#2F68E5] px-4 py-2 font-manrope text-[13px] font-semibold tracking-[0.42px] text-white transition-colors hover:bg-[#255ad2]"
        >
          Create objective
        </button>
      </div>

      <button
        onClick={() => navigate("/decisioning-engine/setup")}
        className="mx-auto w-fit rounded px-3 py-1.5 font-manrope text-[13px] font-medium text-[#6F6F8D] transition-colors hover:text-[#17173A]"
      >
        Edit configuration
      </button>
    </div>
  );
}
