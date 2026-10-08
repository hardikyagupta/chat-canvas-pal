import { useEffect, useMemo, useState, type ComponentType } from "react";
import { Search, Sparkles, Star, X } from "lucide-react";
import {
  ACTION_NODES,
  AGENT_NODES,
  CONDITION_NODES,
  FLOW_CONTROL_NODES,
  type PaletteNode,
} from "./journeyNodePalette.data";
import TimeDelayConfig from "./TimeDelayConfig";
import EmailConfig from "./EmailConfig";
import SmsConfig from "./SmsConfig";
import ConditionConfig from "./ConditionConfig";
import AgentNodeConfig from "./AgentNodeConfig";
import WaitForEventConfig from "./WaitForEventConfig";
import RemoveFromJourneyConfig from "./RemoveFromJourneyConfig";
import type { StepSettings } from "./journeyFlowTree";
import type { ActivityAttribute } from "./journeyActivities.data";

/** Every node id with a real config screen, mapped to the component that
 *  renders it and the label shown in its wrapper's aria-label. Add a new
 *  node type's settings screen here rather than branching by id inline.
 *  Each screen's own props type its `initial`/`onSave` setting more
 *  specifically than `any` — this registry just needs to hold them side by
 *  side, so the props are widened here and nowhere else. */
const CONFIG_SCREENS: Record<string, { component: ComponentType<any>; label: string }> = {
  "time-delay": { component: TimeDelayConfig, label: "Time Delay settings" },
  email: { component: EmailConfig, label: "Email settings" },
  sms: { component: SmsConfig, label: "SMS settings" },
  "check-attribute": { component: ConditionConfig, label: "Check Attribute settings" },
  "agent-node": { component: AgentNodeConfig, label: "Agent settings" },
  "wait-for-event": { component: WaitForEventConfig, label: "Wait for Event settings" },
  "remove-from-journey": { component: RemoveFromJourneyConfig, label: "Remove from Journey settings" },
};

/**
 * "Add to journey" — right-side panel that replaces the left JourneyPalette
 * once a from-scratch journey has a trigger. Same node categories/icons as
 * the old palette, reorganized as a searchable, scannable row list (the
 * user's reference for this layout direction) instead of an icon grid.
 * Persistent (not opened/closed via a button) for as long as the scratch
 * flow's canvas is in view. Now purely a drag source plus a host for node
 * config screens (Time Delay, Email, SMS, Check Attribute — see
 * CONFIG_SCREENS) — clicking a "+" on the canvas opens its own small
 * contextual picker there instead (NodePickerPopup in JourneyCanvas), so
 * rows here are drag-only.
 */

const TONE_STYLES: Record<PaletteNode["tone"], { bar: string; box: string; icon: string }> = {
  action: { bar: "#9449DF", box: "bg-[#EBD2FF]", icon: "text-[#9449DF]" },
  condition: { bar: "#00C48C", box: "bg-[#D5F2D6]", icon: "text-[#00B27E]" },
  flow: { bar: "#E8A23B", box: "bg-[#FCEBD2]", icon: "text-[#B8791F]" },
  // Unused by the plain NodeRow (Agent Node gets its own AgentRow instead,
  // styled with a gradient) — present so TONE_STYLES stays a total map over
  // every NodeTone.
  agent: { bar: "#2F68E5", box: "bg-[#EAF1FF]", icon: "text-[#2F68E5]" },
};

const SECTIONS: { title: string; nodes: PaletteNode[] }[] = [
  { title: "Actions", nodes: ACTION_NODES },
  { title: "Conditions", nodes: CONDITION_NODES },
  { title: "Flow Control", nodes: FLOW_CONTROL_NODES },
];

export default function JourneyNodeDrawer({
  configuringNodeId = null,
  configuringStepId = null,
  configuringInitial,
  onCancelConfigure,
  onSaveConfigure,
  onClose,
  connectorFields,
  triggerPayloadAttributes,
}: {
  /**
   * Set to a palette node's id (e.g. "time-delay", "email") the moment it's
   * dragged or picked, for any node whose `requiresConfig` is true — this
   * whole panel swaps to that node's own settings screen (looked up in
   * CONFIG_SCREENS) until it's saved or cancelled, instead of the node
   * landing on the canvas right away. Also set when re-opening an
   * already-placed node's settings to edit it.
   */
  configuringNodeId?: string | null;
  /** The specific step being configured, if any — distinct from
   *  `configuringNodeId` (its palette type, e.g. "email"), so switching
   *  straight from one Email node's settings to a *different* Email node's
   *  settings is recognized as a real switch (see targetKey below) instead
   *  of both resolving to the same "email" identity and the panel quietly
   *  reusing the previous node's mounted form/state. */
  configuringStepId?: string | null;
  /** The existing node's saved settings, when reopening one to edit. */
  configuringInitial?: StepSettings;
  onCancelConfigure?: () => void;
  /** Called with the sentence to show on the canvas node, and the raw
   *  setting (so it can be persisted for re-editing later). */
  onSaveConfigure?: (nodeLabel: string, setting: StepSettings) => void;
  /** Closes the whole panel. */
  onClose?: () => void;
  /** Connector Agent output fields available elsewhere in this journey —
   *  only ConditionConfig reads this (as extra checkable attributes); every
   *  other config screen ignores the prop it doesn't declare. */
  connectorFields?: string[];
  /** This journey's actual trigger activity's payload fields (e.g. Cart
   *  Abandoned → cart_value) — only EmailConfig reads this, for its
   *  "User activity payload" personalize menu; empty/undefined when the
   *  trigger isn't a from-scratch Activity pick. */
  triggerPayloadAttributes?: ActivityAttribute[];
}) {
  const [query, setQuery] = useState("");

  // Which "screen" this panel should be showing right now: the node list,
  // or one specific node's settings. Snapshotted into `displayed` rather
  // than read directly, so a switch plays a real out→in transition instead
  // of instantly popping to the new content — see the effect below.
  const targetKey = configuringNodeId ? (configuringStepId ?? configuringNodeId) : "list";
  const [displayed, setDisplayed] = useState({
    key: targetKey,
    nodeId: configuringNodeId,
    initial: configuringInitial,
  });
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (targetKey === displayed.key) return;
    // Fade the currently-mounted screen out in place first (see the
    // `leaving` class below), then swap to the new one — a plain key swap
    // has no exit animation at all, which is what made switching between
    // two nodes' settings feel like an instant, jarring cut rather than a
    // transition.
    setLeaving(true);
    const timer = window.setTimeout(() => {
      setDisplayed({ key: targetKey, nodeId: configuringNodeId, initial: configuringInitial });
      setLeaving(false);
    }, 140);
    return () => window.clearTimeout(timer);
    // Only the target identity should retrigger this — configuringInitial
    // changing in place (e.g. a live re-render) shouldn't replay the swap.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetKey]);

  // Shared between both branches below: the enter animation on a fresh
  // mount, or a quick fade-and-settle out of the way while `leaving`.
  const panelTransitionClassName = leaving
    ? "opacity-0 translate-x-1 scale-[0.99] transition-all duration-150 ease-in"
    : "duration-200 ease-out animate-in fade-in slide-in-from-right-3";

  const filteredSections = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return SECTIONS;
    return SECTIONS.map((s) => ({
      ...s,
      nodes: s.nodes.filter((n) => n.label.toLowerCase().includes(q)),
    })).filter((s) => s.nodes.length > 0);
  }, [query]);

  const showAgentNode = useMemo(() => {
    const q = query.trim().toLowerCase();
    return !q || AGENT_NODES[0].label.toLowerCase().includes(q);
  }, [query]);

  const configScreen = displayed.nodeId ? CONFIG_SCREENS[displayed.nodeId] : undefined;
  if (configScreen) {
    const ConfigComponent = configScreen.component;
    return (
      <div
        // Keyed by the *displayed* screen (not the live target) so a fresh
        // mount — and its enter animation — only happens once the leaving
        // fade above has actually finished, not the instant a new node is
        // clicked.
        key={displayed.key}
        role="complementary"
        aria-label={configScreen.label}
        className={`jc-drawer-panel flex h-full w-[420px] max-w-[94vw] shrink-0 flex-col overflow-hidden rounded-lg bg-white shadow-[0px_1px_3px_rgba(23,23,58,0.06)] ${panelTransitionClassName}`}
      >
        <ConfigComponent
          initial={displayed.initial}
          onCancel={onCancelConfigure ?? (() => {})}
          onSave={onSaveConfigure ?? (() => {})}
          connectorFields={connectorFields}
          triggerPayloadAttributes={triggerPayloadAttributes}
        />
      </div>
    );
  }

  return (
    <div
      key={displayed.key}
      role="complementary"
      aria-label="Add to journey"
      className={`jc-drawer-panel flex h-full w-[420px] max-w-[94vw] shrink-0 flex-col overflow-hidden rounded-lg bg-white shadow-[0px_1px_3px_rgba(23,23,58,0.06)] ${panelTransitionClassName}`}
    >
      {/* Header */}
      <div className="flex items-start gap-3 px-5 pt-5">
        <div className="flex-1">
          <h2 className="font-manrope text-[16px] font-bold leading-tight text-[#17173A]">
            Add to journey
          </h2>
          <p className="mt-1 font-manrope text-[12.5px] text-[#6F6F8D]">
            Drag a step onto the canvas, or click "+" on the flow.
          </p>
        </div>
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center text-[#6F6F8D] transition-colors hover:text-[#17173A]"
        >
          <X className="h-5 w-5" strokeWidth={2} />
        </button>
      </div>

      <div className="px-5 pt-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6F6F8D]" strokeWidth={2} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search steps…"
            className="h-9 w-full rounded-md border border-[#DDE2EE] bg-white pl-9 pr-3 font-manrope text-[13.5px] text-[#17173A] outline-none placeholder:text-[#6F6F8D] focus:border-[#B9C4DD]"
          />
        </div>
      </div>

      <div className="mt-3 border-t border-[#EBEBF5]" />

      {/* Sections */}
      <div className="scroll-slim min-h-0 flex-1 overflow-y-auto px-3 py-3">
        {showAgentNode && (
          <div className="mb-4">
            <p className="mb-1.5 px-2 font-manrope text-[11.5px] font-bold uppercase tracking-[0.06em] text-[#6F6F8D]">
              Agent
            </p>
            <AgentRow node={AGENT_NODES[0]} />
          </div>
        )}

        {filteredSections.length === 0 && !showAgentNode ? (
          <p className="px-2 py-6 text-center font-manrope text-[13px] text-[#6F6F8D]">
            No steps match "{query}".
          </p>
        ) : (
          filteredSections.map((section) => (
            <div key={section.title} className="mb-4 last:mb-0">
              <p className="mb-1.5 px-2 font-manrope text-[11.5px] font-bold uppercase tracking-[0.06em] text-[#6F6F8D]">
                {section.title}
              </p>
              <div className="grid grid-cols-2 gap-1.5">
                {section.nodes.map((node) => (
                  <NodeRow key={node.id} node={node} />
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

/** The Agent Node's own row — visually set apart from the flat-tone
 *  NodeRow below with a subtle gradient icon and a tinted card, since it's a
 *  different kind of thing (hands the step to an AI agent) rather than one
 *  more fixed action, condition, or flow-control step. Still the same
 *  draggable row shape/behavior otherwise. */
function AgentRow({ node }: { node: PaletteNode }) {
  const Icon = node.icon;
  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", node.id);
        e.dataTransfer.effectAllowed = "copy";
      }}
      className="jc-agent-row relative flex w-full cursor-grab items-center gap-2.5 rounded-lg border border-transparent py-2 pl-2.5 pr-3 text-left transition-colors active:cursor-grabbing"
      style={{
        backgroundImage: "linear-gradient(135deg, rgba(148,73,223,0.07), rgba(47,104,229,0.07))",
      }}
    >
      {/* Same ring the "Ask co-marketer" CTA uses (.snake-border, defined in
          src/index.css), in the Agent Node's own violet-to-blue palette —
          see .snake-border--purple in journey-canvas.css. */}
      <span aria-hidden="true" className="snake-border snake-border--purple" />
      <span
        className="relative z-[1] grid h-8 w-8 shrink-0 place-items-center rounded-md"
        style={{ background: "linear-gradient(135deg, #9449DF 0%, #2F68E5 100%)" }}
      >
        <Icon className="h-4 w-4 text-white" strokeWidth={1.9} />
      </span>
      <span className="relative z-[1] min-w-0 flex-1">
        <span className="block truncate font-manrope text-[13.5px] font-bold text-[#17173A]">{node.label}</span>
        <span className="block truncate font-manrope text-[11.5px] text-[#6F6F8D]">Run an AI agent at this step</span>
      </span>
    </div>
  );
}

function NodeRow({ node }: { node: PaletteNode }) {
  const Icon = node.icon;
  const s = TONE_STYLES[node.tone];

  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", node.id);
        e.dataTransfer.effectAllowed = "copy";
      }}
      className="group relative flex w-full min-w-0 cursor-grab items-center gap-2 rounded-md py-1.5 pl-3 pr-1.5 text-left transition-colors hover:bg-[#F7F7FB] active:cursor-grabbing"
    >
      {/* A straight-edged accent bar, independent of the row's own rounded
          corners — border-left on the rounded container itself would curve
          the bar's top/bottom ends to match (clipped by the radius), which
          is exactly what keeping it a separate, unclipped element avoids. */}
      <span className="absolute inset-y-0 left-0 w-[3px]" style={{ backgroundColor: s.bar }} aria-hidden />
      <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-md ${s.box}`}>
        <Icon className={`h-3.5 w-3.5 ${s.icon}`} strokeWidth={1.9} />
      </span>
      <span className="min-w-0 flex-1 truncate font-manrope text-[13px] font-medium text-[#17173A]">
        {node.label}
      </span>
      {node.premium && (
        <span
          aria-label="Add-on channel"
          title="Add-on channel"
          className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[#FEF3C7]"
        >
          <Star className="h-3 w-3 text-[#B8860B]" strokeWidth={2} fill="#B8860B" />
        </span>
      )}
    </div>
  );
}
