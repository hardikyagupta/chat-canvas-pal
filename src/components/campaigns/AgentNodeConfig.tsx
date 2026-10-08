import { useMemo, useState } from "react";
import { Check, Sparkles, X } from "lucide-react";
import { useCustomAgents } from "@/contexts/CustomAgentsContext";
import ConnectorAgentConfig, { type ConnectorAgentSetting } from "./ConnectorAgentConfig";

/**
 * "Agent Node" — an AI-powered step that hands this point in the journey to
 * one of the agents already set up in the Agents space (`/agents`), instead
 * of a fixed action. Reuses the live agents catalog (CustomAgentsProvider)
 * rather than a separate copy, so anything created or renamed there shows up
 * here automatically.
 */
export interface AgentNodeSetting {
  agentId: string;
  /** Stored alongside the id so the canvas label and re-opened panel still
   *  read correctly even if that agent is later renamed or removed. */
  agentName: string;
  /** Present only once the Connector agent's own guided setup (below) has
   *  been walked through — carries its API config and chosen output fields. */
  connector?: ConnectorAgentSetting;
}

/** The Audience Split agent's id in STARTER_AGENTS (src/data/customAgents.ts)
 *  — the one agent whose selection also gives the node its 4 fixed output
 *  paths (see JourneyBuilder.tsx's handleSaveConfiguredNode). */
export const AUDIENCE_SPLIT_AGENT_ID = "starter-audience-split";

/** The Connector agent's id in STARTER_AGENTS — pinned above Audience Split
 *  in this list (see orderedAgents below); no special canvas behavior wired
 *  up yet beyond that ordering. */
export const CONNECTOR_AGENT_ID = "starter-connector-agent";

export function isAgentNodeValid(s: AgentNodeSetting | undefined): boolean {
  return !!s?.agentId;
}

export default function AgentNodeConfig({
  initial,
  onCancel,
  onSave,
}: {
  initial?: AgentNodeSetting;
  onCancel: () => void;
  /** Called with the sentence to show on the canvas node — always just the
   *  agent's own name — and the raw setting, so re-opening pre-fills it. */
  onSave: (nodeLabel: string, setting: AgentNodeSetting) => void;
}) {
  const { allAgents } = useCustomAgents();
  const [selectedId, setSelectedId] = useState<string | null>(initial?.agentId ?? null);
  // Selecting the Connector agent swaps straight into its own guided setup
  // (below) instead of the plain "pick an agent, then Save" flow the other
  // agents use — there's nothing to manually confirm first.
  const [showConnectorSetup, setShowConnectorSetup] = useState(initial?.agentId === CONNECTOR_AGENT_ID);

  // Connector, then Audience Split, then everyone else — both pinned above
  // the rest since they're the agents with real, defined node behavior
  // (Audience Split builds the 4 output paths on save; Connector configures
  // an external API call), so neither gets buried among the others. Always
  // computed (even while showConnectorSetup is true and this list isn't
  // rendered) so every render calls the same hooks in the same order.
  const orderedAgents = useMemo(() => {
    const pinnedIds = [CONNECTOR_AGENT_ID, AUDIENCE_SPLIT_AGENT_ID];
    const pinned = pinnedIds
      .map((id) => allAgents.find((a) => a.id === id))
      .filter((a): a is (typeof allAgents)[number] => !!a);
    const rest = allAgents.filter((a) => !pinnedIds.includes(a.id));
    return [...pinned, ...rest];
  }, [allAgents]);

  if (showConnectorSetup) {
    const connectorAgent = allAgents.find((a) => a.id === CONNECTOR_AGENT_ID);
    return (
      <ConnectorAgentConfig
        initial={initial?.connector}
        onCancel={onCancel}
        onSave={(nodeLabel, connectorSetting) =>
          onSave(nodeLabel, {
            agentId: CONNECTOR_AGENT_ID,
            agentName: connectorAgent?.name ?? "Connector agent",
            connector: connectorSetting,
          })
        }
      />
    );
  }

  const valid = selectedId !== null;

  const handleSave = () => {
    const agent = allAgents.find((a) => a.id === selectedId);
    if (!agent) return;
    onSave(agent.name, { agentId: agent.id, agentName: agent.name });
  };

  return (
    <>
      {/* Header */}
      <div className="flex items-start gap-3 px-6 pt-6">
        <span
          className="grid h-10 w-10 shrink-0 place-items-center rounded-lg"
          style={{ background: "linear-gradient(135deg, #9449DF 0%, #2F68E5 100%)" }}
        >
          <Sparkles className="h-[18px] w-[18px] text-white" strokeWidth={2} />
        </span>
        <div className="flex-1">
          <h2 className="font-manrope text-[16px] font-bold leading-tight text-[#17173A]">Agent</h2>
          <p className="mt-1 font-manrope text-[12.5px] text-[#6F6F8D]">
            Pick an agent from your Agents space to run at this step.
          </p>
        </div>
        <button
          type="button"
          aria-label="Close"
          onClick={onCancel}
          className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center text-[#6F6F8D] transition-colors hover:text-[#17173A]"
        >
          <X className="h-5 w-5" strokeWidth={2} />
        </button>
      </div>

      <div className="mt-3 border-t border-[#EBEBF5]" />

      {/* Body */}
      <div className="scroll-slim min-h-0 flex-1 overflow-y-auto px-5 py-4">
        <label className="block font-manrope text-[14px] font-bold text-[#17173A]">
          Which agent should run here?
        </label>

        <div className="mt-3 flex flex-col gap-2">
          {orderedAgents.map((agent) => {
            const selected = agent.id === selectedId;
            return (
              <button
                key={agent.id}
                type="button"
                onClick={() => {
                  setSelectedId(agent.id);
                  if (agent.id === CONNECTOR_AGENT_ID) setShowConnectorSetup(true);
                }}
                className={`group flex items-center gap-3 rounded-lg border p-3 text-left transition-colors ${
                  selected
                    ? "border-[#2F68E5] bg-[#F4F8FF]"
                    : "border-[#DDE2EE] hover:border-[#B9C4DD] hover:bg-[#F7F9FF]"
                }`}
              >
                {agent.avatarSrc ? (
                  <img src={agent.avatarSrc} alt="" className="h-9 w-9 shrink-0 rounded-full object-cover" />
                ) : (
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#F1EBFF] text-[#9449DF]">
                    <Sparkles className="h-4 w-4" strokeWidth={2} />
                  </span>
                )}
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-manrope text-[13.5px] font-bold text-[#17173A]">
                    {agent.name}
                  </span>
                  <span className="block truncate font-manrope text-[12px] text-[#6F6F8D]">
                    {agent.description}
                  </span>
                </span>
                {selected && (
                  <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[#2F68E5] text-white">
                    <Check className="h-3 w-3" strokeWidth={3} />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="border-t border-[#EBEBF5]" />

      {/* Footer */}
      <div className="flex items-center justify-end px-6 py-4">
        <button type="button" disabled={!valid} onClick={handleSave} className="dc-btn dc-btn-primary">
          Save
        </button>
      </div>
    </>
  );
}
