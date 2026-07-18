import { useNavigate } from "react-router-dom";
import { Check, Waypoints } from "lucide-react";
import { useDecisioningSetup } from "@/contexts/DecisioningSetupContext";

const features = [
  "Set rules once and let the engine decide the best action in real time",
  "Automatically route customers down the right next-best journey",
  "Continuously learn from outcomes to sharpen future decisions",
  "Get full audit trails and visibility into every decision made",
];

/** Illustration — a small decision-flow diagram: one node branching into two,
 * echoing the "Decisioning engine" concept without a literal image asset. */
function DecisioningIllustration() {
  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br from-[#EEF3FF] to-[#E7EDFF]">
      <svg viewBox="0 0 200 160" className="h-[140px] w-[176px]">
        <path
          d="M100 28 V64 M100 64 L48 108 M100 64 L152 108"
          stroke="#B9C6EE"
          strokeWidth="2"
          fill="none"
        />
        <circle cx="100" cy="20" r="16" fill="#2F68E5" />
        <foreignObject x="84" y="4" width="32" height="32">
          <div className="flex h-full w-full items-center justify-center">
            <Waypoints className="h-4 w-4 text-white" strokeWidth={2} />
          </div>
        </foreignObject>
        <circle cx="48" cy="116" r="12" fill="#FFFFFF" stroke="#DDE2EE" strokeWidth="2" />
        <circle cx="152" cy="116" r="12" fill="#FFFFFF" stroke="#DDE2EE" strokeWidth="2" />
        <circle cx="48" cy="116" r="4" fill="#00C48C" />
        <circle cx="152" cy="116" r="4" fill="#FC5E02" />
      </svg>
    </div>
  );
}

export default function DecisioningEmptyState() {
  const navigate = useNavigate();
  const { status, configuredCount } = useDecisioningSetup();
  const resuming = status === "configuring";

  return (
    <div className="w-full">
      <div className="flex w-full items-center gap-10 rounded-lg bg-white p-6">
        {/* Illustration */}
        <div className="h-[220px] w-[280px] shrink-0">
          <DecisioningIllustration />
        </div>

        {/* Copy */}
        <div className="flex min-w-0 flex-1 flex-col">
          <h2 className="font-manrope text-[20px] font-bold leading-tight text-[#17173A]">
            Turn every signal into the right decision
          </h2>
          <p className="mt-1 font-manrope text-[13px] text-[#6F6F8D]">
            The decisioning engine picks the best next action for each customer,
            automatically and in real time
          </p>

          <ul className="mt-5 flex flex-col gap-2.5">
            {features.map((feature) => (
              <li key={feature} className="flex items-start gap-2.5">
                <span className="mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full bg-[#E7EFEA]">
                  <Check className="h-2.5 w-2.5 text-[#00C48C]" strokeWidth={2} />
                </span>
                <span className="font-manrope text-[13px] leading-[18px] text-[#17173A]">
                  {feature}
                </span>
              </li>
            ))}
          </ul>

          {resuming && (
            <p className="mt-5 font-manrope text-[12px] font-medium text-[#2F68E5]">
              You're partway there — {configuredCount} of 3 steps done.
            </p>
          )}
          <button
            onClick={() => navigate("/decisioning-engine/setup")}
            className={`${
              resuming ? "mt-2" : "mt-6"
            } flex w-fit items-center gap-2 rounded bg-[#2F68E5] px-2 py-2 font-manrope text-sm font-semibold tracking-[0.42px] text-white shadow-[0px_5px_5px_rgba(0,0,0,0.05)] transition-colors hover:bg-[#255ad2]`}
          >
            {resuming ? "Resume setup" : "Get started"}
          </button>
        </div>
      </div>
    </div>
  );
}
