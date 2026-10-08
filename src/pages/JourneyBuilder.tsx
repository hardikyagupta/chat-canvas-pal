import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import JourneyBuilderHeader from "@/components/campaigns/JourneyBuilderHeader";
import KeyboardShortcutsPanel from "@/components/campaigns/KeyboardShortcutsPanel";
import JourneySettingsDrawer, { type JourneyDates } from "@/components/campaigns/JourneySettingsDrawer";
import JourneyPalette from "@/components/campaigns/JourneyPalette";
import JourneyCanvas from "@/components/campaigns/JourneyCanvas";
import JourneyAIModal from "@/components/campaigns/JourneyAIModal";
import JourneyTriggerDrawer from "@/components/campaigns/JourneyTriggerDrawer";
import JourneyNodeDrawer from "@/components/campaigns/JourneyNodeDrawer";
import { findPaletteNode } from "@/components/campaigns/journeyNodePalette.data";
import { AUDIENCE_SPLIT_AGENT_ID, CONNECTOR_AGENT_ID, type AgentNodeSetting } from "@/components/campaigns/AgentNodeConfig";
import { timeDelaySettingFromLabel } from "@/components/campaigns/journeyTimeDelay.data";
import { DEFAULT_EMAIL_SETTING, type EmailSetting } from "@/components/campaigns/journeyEmail.data";
import { DEFAULT_SMS_SETTING, type SmsSetting } from "@/components/campaigns/journeySms.data";
import { ACTIVITY_DEFINITIONS } from "@/components/campaigns/journeyActivities.data";
import { describeWaitForEvent, newWaitForEventRow, type WaitForEventSetting } from "@/components/campaigns/journeyWaitForEvent.data";
import { DEFAULT_REMOVE_FROM_JOURNEY_SETTING } from "@/components/campaigns/journeyRemoveFromJourney.data";
import { unionAttributes } from "@/components/campaigns/ActivityTriggerConfig";
import {
  buildExperimentProposal,
  hasExperimentableWait,
  parseRequestedHours,
  type ExperimentProposal,
} from "@/components/campaigns/journeyExperiment.data";
import type { ExperimentCardData, TestBranchConfig } from "@/components/ExperimentCard";
import type { NodeInsightCardData, NodeInsightResponse } from "@/components/NodeOptimizationInsightCard";
import type { JourneyProposalCardData, JourneyProposalResponse } from "@/components/JourneyOptimizationProposalCard";
import {
  buildNodeOptimizationInsight,
  buildProposalFromInsight,
  findFirstNodeWithInsight,
  formatHoursShort,
  type NodeOptimizationInsight,
} from "@/components/campaigns/journeyOptimizationInsight.data";
import { Bell, CornerDownRight, GitBranch, MessageSquare } from "lucide-react";
import ChatInterface, { type ChatMessageData, type SeededTopic } from "@/components/ChatInterface";
import CoMarketerQuestionCard, { type CoMarketerQuestion, type QuestionRecapEntry } from "@/components/campaigns/CoMarketerQuestionCard";
import { clearPendingOptimizerTest, peekPendingOptimizerTest } from "@/components/campaigns/pendingOptimizerTest";
import { playResponseCue } from "@/lib/playCue";
import {
  getCartAbandonmentSession,
  markCartAbandonmentMerged,
  markCartAbandonmentSummaryAppended,
  saveCartAbandonmentActiveTest,
  saveCartAbandonmentChatMessages,
  saveCartAbandonmentFlow,
  type ActiveTestState,
} from "@/components/campaigns/cartAbandonmentTestSession";
import { JOURNEY_TEMPLATES, type JourneyPreviewStep, type JourneyTemplate } from "@/components/campaigns/journeyTemplates.data";
import {
  collectStepAndDescendantIds,
  findStepById,
  findStepLocation,
  insertStepAt,
  pathIntersectsIds,
  pathsEqual,
  removeStepById,
  updateStepById,
  type FlowPath,
  type FlowStep,
  type SplitPath,
  type StepSettings,
} from "@/components/campaigns/journeyFlowTree";

// Same rocket "launch" Lottie the Decisioning Engine uses while going live.
const ROCKET_LOTTIE =
  "https://lottie.host/955cb302-39a6-4d43-80f5-54dce1391ac2/KgDRjdANks.lottie";

// How long the DE-activation loader plays before landing on the journeys page.
const ACTIVATE_MS = 3200;

const ACTIVATION_PHASES = [
  "Publishing your journey",
  "Calibrating the Decisioning Engine",
  "Taking your journey live",
];

/** Which node's settings panel is open right now. A node with
 *  `requiresConfig` (Time Delay, Email, SMS, Check Attribute) always attaches
 *  to the canvas immediately on drop/pick — this only tracks which
 *  already-attached step's panel to show, whether it's brand new (still
 *  showing its default/empty state) or being reopened to edit saved values. */
type ConfiguringNode = { stepId: string; paletteNodeId: string; initial?: StepSettings };

let stepSeq = 0;

/** The Audience Split agent's fixed 4-way output — always these exact
 *  labels/percentages, created the moment that agent is picked (see
 *  handleSaveConfiguredNode). Fresh path keys every call, so cloning a split
 *  step (Copy) and creating a new one never collide. */
const buildDefaultSplitPaths = (): SplitPath[] => [
  { key: `path-${stepSeq++}`, label: "Path A", percentage: 40, steps: [] },
  { key: `path-${stepSeq++}`, label: "Path B", percentage: 30, steps: [] },
  { key: `path-${stepSeq++}`, label: "Path C", percentage: 20, steps: [] },
  { key: `path-${stepSeq++}`, label: "Path D", percentage: 10, steps: [] },
];

/** Maps a template's preview step to the real palette node it should become
 *  once "pasted" onto the canvas — inferred from the step's own icon/type
 *  rather than a separate data field, since every template's preview icons
 *  already come straight from the matching palette node's own icon. */
function paletteNodeIdForPreviewStep(step: JourneyPreviewStep): string {
  if (step.type === "wait") return "time-delay";
  if (step.icon === MessageSquare) return "sms";
  if (step.icon === Bell) return "app-push";
  return "email";
}

/** Gives an AI-generated or template-derived step — which starts out with
 *  only a display `nodeLabel` string, not a real setting — something
 *  genuine to reopen to, matching what the canvas already shows. Without
 *  this, clicking one of these back open shows a blank/default config
 *  screen instead of the content the node's own label describes. Only the
 *  node types with a real config screen (requiresConfig in
 *  journeyNodePalette.data: time-delay, email, sms, check-attribute,
 *  agent-node) need one — check-attribute/agent-node are never produced by
 *  these two generators, so they're not handled here. */
function settingsForGeneratedStep(paletteNodeId: string, nodeLabel: string): StepSettings | undefined {
  switch (paletteNodeId) {
    case "time-delay":
      return timeDelaySettingFromLabel(nodeLabel);
    case "email":
      return { ...DEFAULT_EMAIL_SETTING, subject: nodeLabel } satisfies EmailSetting;
    case "sms":
      return { ...DEFAULT_SMS_SETTING, message: nodeLabel } satisfies SmsSetting;
    default:
      return undefined;
  }
}

/** A `routerState.templateId` naming the one pre-built branching journey
 *  this builder knows how to open directly (see
 *  buildCartAbandonmentOngoingFlow below) — deliberately not a real
 *  JOURNEY_TEMPLATES gallery entry, since it isn't a "use template" choice,
 *  just how journeys.data.ts's Cart_Abandonment_Ongoing row opens its own
 *  canvas pre-built, the same way other journeys open theirs via
 *  templateToFlowSteps. */
export const CART_ABANDONMENT_ONGOING_TEMPLATE_ID = "cart-abandonment-ongoing";
export const CART_ABANDONMENT_ONGOING_TRIGGER_LABEL = "When someone adds a product to cart";

/** Converts a chosen template's preview (trigger + a straight chain of
 *  wait/action steps) into real, editable FlowStep nodes — the same shape a
 *  hand-built scratch journey uses — so "Use template" pastes exactly what
 *  the preview showed onto the live canvas instead of a separate mock. */
export function templateToFlowSteps(template: JourneyTemplate): FlowStep[] {
  const steps: FlowStep[] = [];
  for (const step of template.preview) {
    if (step.type === "trigger") continue;
    const paletteNodeId = paletteNodeIdForPreviewStep(step);
    const node = findPaletteNode(paletteNodeId);
    if (!node) continue;
    steps.push({
      id: `${node.id}-${stepSeq++}`,
      paletteNodeId: node.id,
      label: node.label,
      nodeLabel: step.title,
      icon: node.icon,
      tone: node.tone,
      branches: undefined,
      settings: settingsForGeneratedStep(node.id, step.title),
    });
  }
  return steps;
}

/** The one journey this builder can open pre-built as a real branching tree
 *  (not the flat trigger+wait+action chain templateToFlowSteps produces) —
 *  see CART_ABANDONMENT_ONGOING_TEMPLATE_ID below. Three identical
 *  Wait for Event → Yes/Timeout stages, each built from the same existing
 *  node types (Wait for event, Email, Remove from Journey) a marketer would
 *  place by hand; nothing here is a new node or a new config shape. */
export function buildCartAbandonmentOngoingFlow(): FlowStep[] {
  const waitNode = findPaletteNode("wait-for-event")!;
  const emailNode = findPaletteNode("email")!;
  const removeNode = findPaletteNode("remove-from-journey")!;

  const buildWaitForEventSetting = (): WaitForEventSetting => ({
    rows: [{ ...newWaitForEventRow(), activityId: "product-purchased", atLeast: 1, windowValue: "1 day" }],
  });

  const buildRemoveStep = (): FlowStep => ({
    id: `${removeNode.id}-${stepSeq++}`,
    paletteNodeId: removeNode.id,
    label: removeNode.label,
    nodeLabel: removeNode.nodeLabel,
    icon: removeNode.icon,
    tone: removeNode.tone,
    branches: undefined,
    settings: DEFAULT_REMOVE_FROM_JOURNEY_SETTING,
  });

  const buildEmailStep = (): FlowStep => ({
    id: `${emailNode.id}-${stepSeq++}`,
    paletteNodeId: emailNode.id,
    label: emailNode.label,
    nodeLabel: emailNode.nodeLabel,
    icon: emailNode.icon,
    tone: emailNode.tone,
    branches: undefined,
    settings: DEFAULT_EMAIL_SETTING,
  });

  const buildWaitStep = (afterTimeout: FlowStep[]): FlowStep => {
    const setting = buildWaitForEventSetting();
    return {
      id: `${waitNode.id}-${stepSeq++}`,
      paletteNodeId: waitNode.id,
      label: waitNode.label,
      nodeLabel: describeWaitForEvent(setting),
      icon: waitNode.icon,
      tone: waitNode.tone,
      branches: { yes: [buildRemoveStep()], no: afterTimeout },
      settings: setting,
    };
  };

  const thirdWait = buildWaitStep([buildEmailStep()]);
  const secondWait = buildWaitStep([buildEmailStep(), thirdWait]);
  const firstWait = buildWaitStep([buildEmailStep(), secondWait]);
  return [firstWait];
}

/** Flattens the branching flow tree (yes/no or split paths) into one list,
 *  for the Audit/Analyze co-marketer replies below — they read the whole
 *  journey, not just its root chain. */
function flattenFlowSteps(steps: FlowStep[]): FlowStep[] {
  const out: FlowStep[] = [];
  for (const step of steps) {
    out.push(step);
    if (step.branches) {
      if ("paths" in step.branches) {
        for (const path of step.branches.paths) out.push(...flattenFlowSteps(path.steps));
      } else {
        out.push(...flattenFlowSteps(step.branches.yes));
        out.push(...flattenFlowSteps(step.branches.no));
      }
    }
  }
  return out;
}

/** Deep-clones a flow tree with fresh ids for every step (recorded into
 *  `idMap`, old id → new id) — used to build the Optimizer split node's two
 *  independent paths from the same starting flow. Two clones of the same
 *  tree must never share ids: `findStepById`/`updateStepById` search the
 *  whole tree and would only ever find the first match, silently making
 *  the second path's identical-id node unreachable. */
function cloneFlowWithNewIds(steps: FlowStep[], idMap: Map<string, string>): FlowStep[] {
  return steps.map((step) => {
    const newId = `${step.paletteNodeId}-${stepSeq++}`;
    idMap.set(step.id, newId);
    const clone: FlowStep = { ...step, id: newId };
    if (step.branches) {
      if ("paths" in step.branches) {
        clone.branches = { paths: step.branches.paths.map((p) => ({ ...p, steps: cloneFlowWithNewIds(p.steps, idMap) })) };
      } else {
        clone.branches = {
          yes: cloneFlowWithNewIds(step.branches.yes, idMap),
          no: cloneFlowWithNewIds(step.branches.no, idMap),
        };
      }
    }
    return clone;
  });
}

/** The journey's own split node, if a test is currently running — always
 *  at the root, right after the trigger (see handleCreateTestBranch) so
 *  every entry point can check "is a test already going?" the same way.
 *  Detected by its two path keys (existing/test), not by paletteNodeId —
 *  it's built with the same "Split Action" node identity a marketer could
 *  drag from the palette themselves (GitBranch icon, condition tone),
 *  so paletteNodeId alone can't tell it apart from one they configured by
 *  hand. */
function findOptimizerStep(steps: FlowStep[]): FlowStep | null {
  return (
    steps.find(
      (s) =>
        s.branches &&
        "paths" in s.branches &&
        s.branches.paths.some((p) => p.key === "test") &&
        s.branches.paths.some((p) => p.key === "existing"),
    ) ?? null
  );
}

/** Builds the Optimizer split node (Main Journey / Test Journey) from a
 *  source flow and the marketer's conversational answers — the one place
 *  this runs, whether the "Create" click happened inside the live builder
 *  (handleCreateTestBranch, mutating `flow` in place) or from the read-only
 *  Node-wise report (JourneyReport.tsx, which has no live flow to mutate
 *  and instead hands the built flow to this page via router state). Never
 *  hardcodes the WhatsApp/Cart Abandonment example — the actual change
 *  swapped in comes from `config`, generated from the marketer's own
 *  answers. */
export function buildOptimizerFlow(sourceFlow: FlowStep[], config: TestBranchConfig): FlowStep[] {
  const existingIdMap = new Map<string, string>();
  const existingSteps = cloneFlowWithNewIds(sourceFlow, existingIdMap);

  const testIdMap = new Map<string, string>();
  let testSteps = cloneFlowWithNewIds(sourceFlow, testIdMap);

  const anchorStepId = config.anchorStepId;
  if (config.changeKind === "reduce-wait" && anchorStepId && config.waitHours !== undefined) {
    const newId = testIdMap.get(anchorStepId);
    if (newId) {
      testSteps = updateStepById(testSteps, newId, (step) => ({
        ...step,
        settings: timeDelaySettingFromLabel(formatHoursShort(config.waitHours!)),
        nodeLabel: `Wait ${formatHoursShort(config.waitHours!)}`,
      }));
    }
  } else if (config.changeKind === "add-whatsapp" && anchorStepId) {
    // Swaps the anchor step itself for WhatsApp — same position, same id —
    // rather than inserting a second touchpoint alongside it, so the test
    // branch reads as "this channel instead of email" at that step.
    const newId = testIdMap.get(anchorStepId);
    const whatsappNode = findPaletteNode("whatsapp");
    if (newId && whatsappNode) {
      testSteps = updateStepById(testSteps, newId, (step) => ({
        ...step,
        paletteNodeId: whatsappNode.id,
        label: whatsappNode.label,
        nodeLabel: `Send a WhatsApp message — ${config.content ?? "Product rating & review"}`,
        icon: whatsappNode.icon,
        tone: whatsappNode.tone,
        settings: undefined,
      }));
    }
  }
  // "other" (a free-typed idea): this app has no structural way to build
  // an arbitrary marketer idea automatically, so the test branch mirrors
  // the existing one as-is — the description alone records what's
  // actually meant to be tested manually.

  // Reuses the existing "Split Action" palette node's own identity
  // (src/components/campaigns/journeyNodePalette.data.ts) rather than a
  // one-off "Optimizer" look — same icon/tone a marketer seess if they drop
  // a Split Action node from the palette themselves.
  const splitActionNode = findPaletteNode("split-action");
  const optimizerStep: FlowStep = {
    id: `optimizer-${stepSeq++}`,
    paletteNodeId: splitActionNode?.id ?? "split-action",
    label: splitActionNode?.label ?? "Split Action",
    nodeLabel: splitActionNode?.nodeLabel ?? "Split the path",
    icon: splitActionNode?.icon ?? GitBranch,
    tone: splitActionNode?.tone ?? "condition",
    branches: {
      paths: [
        { key: "existing", label: "Main Journey", percentage: 100 - config.variantPercent, steps: existingSteps },
        { key: "test", label: "Test Journey", percentage: config.variantPercent, steps: testSteps },
      ],
    },
  };

  return [optimizerStep];
}

/** The same branch shape a step already has, but with every array emptied —
 *  used by beginTestBuildAnimation to insert a node's own branch structure
 *  (so its eventual children have somewhere to go) without its children
 *  existing yet, since those get revealed on their own later ticks. */
function emptyBranchesLike(branches: FlowStep["branches"]): FlowStep["branches"] {
  if (!branches) return undefined;
  if ("paths" in branches) return { paths: branches.paths.map((p) => ({ ...p, steps: [] })) };
  return { yes: [], no: [] };
}

/** One step in build order, and exactly where it belongs — a plain
 *  pre-order walk of a *complete* flow (trunk first, then each of a step's
 *  own branches in order), which is also the order FlowChain itself renders
 *  in. Since a parent is always walked before its children, inserting these
 *  one at a time (in this exact order) into a growing tree always finds its
 *  parent already there — see beginTestBuildAnimation. */
function flattenForReveal(steps: FlowStep[], path: FlowPath = []): { step: FlowStep; path: FlowPath; index: number }[] {
  const out: { step: FlowStep; path: FlowPath; index: number }[] = [];
  steps.forEach((step, index) => {
    out.push({ step, path, index });
    if (step.branches) {
      if ("paths" in step.branches) {
        for (const p of step.branches.paths) {
          out.push(...flattenForReveal(p.steps, [...path, { stepId: step.id, branch: p.key }]));
        }
      } else {
        // "no" (the TIMEOUT branch on a Wait step) is the chain that keeps
        // building the journey forward — revealed before "yes" (the short
        // "remove them from the journey" exit), so the build reads as the
        // main path extending, with each step's own exit appearing right
        // after it rather than ahead of it.
        out.push(...flattenForReveal(step.branches.no, [...path, { stepId: step.id, branch: "no" }]));
        out.push(...flattenForReveal(step.branches.yes, [...path, { stepId: step.id, branch: "yes" }]));
      }
    }
  });
  return out;
}

/** Same anchor swap buildOptimizerFlow's test branch applies (reduce-wait's
 *  duration edit, add-whatsapp's channel swap), but returns one plain flow
 *  instead of wrapping two branches in an Optimizer node — used for the
 *  goal-first conversation's canvas preview, and for "make it my primary
 *  journey" applying that same change directly, with no split at all. */
function applyRecommendedChange(sourceFlow: FlowStep[], insight: NodeOptimizationInsight, step: FlowStep): FlowStep[] {
  const idMap = new Map<string, string>();
  let cloned = cloneFlowWithNewIds(sourceFlow, idMap);
  const newId = idMap.get(step.id);
  if (!newId) return cloned;

  if (insight.changeKind === "reduce-wait" && insight.suggestedNewHours !== undefined) {
    cloned = updateStepById(cloned, newId, (s) => ({
      ...s,
      settings: timeDelaySettingFromLabel(formatHoursShort(insight.suggestedNewHours!)),
      nodeLabel: `Wait ${formatHoursShort(insight.suggestedNewHours!)}`,
    }));
  } else if (insight.changeKind === "add-whatsapp") {
    const whatsappNode = findPaletteNode("whatsapp");
    if (whatsappNode) {
      cloned = updateStepById(cloned, newId, (s) => ({
        ...s,
        paletteNodeId: whatsappNode.id,
        label: whatsappNode.label,
        nodeLabel: "Send a WhatsApp message — Product rating & review",
        icon: whatsappNode.icon,
        tone: whatsappNode.tone,
        settings: undefined,
      }));
    }
  }
  return cloned;
}

/** Reasoning steps shown while the Journey review agent "thinks" — same
 *  short-imperative-phrase style as every other agent hand-off in this app
 *  (see CAMPAIGNS_FLOW in conversations.ts). Shared by the "Audit flow"
 *  button and a typed "audit" request in the docked co-marketer, so both
 *  entry points play the identical hand-off. */
export const JOURNEY_REVIEW_REASONING_STEPS = [
  "Walking the trigger and every node",
  "Checking each condition for contradictions",
  "Tracing every branch to make sure it ends somewhere",
  "Scoring readiness to activate",
];

/** "Audit flow" / a typed "audit my flow" — genuinely reads the current
 *  canvas (not a fixed canned reply) and reports the same way the
 *  "Journey review agent" (see src/data/customAgents.ts's
 *  starter-journey-review entry) describes its own review: findings as
 *  Blocker / Warning / Note, most severe first, closing with a single
 *  activate-readiness verdict — NO only when a real Blocker was found. */
export function buildJourneyAuditReply(flow: FlowStep[], triggerLabel: string | null): string {
  if (!triggerLabel || flow.length === 0) {
    return "This canvas is still empty — there's nothing to audit yet. Add a trigger and at least one step, then ask me again.";
  }
  const steps = flattenFlowSteps(flow);
  const actionSteps = steps.filter((s) => s.tone === "action");
  const hasCondition = steps.some((s) => s.tone === "condition");
  const channels = new Set(actionSteps.map((s) => s.paletteNodeId));

  const findings: { severity: "Blocker" | "Warning" | "Note"; text: string }[] = [];

  // A step whose palette node requires setup (Email, Check Attribute, an
  // Agent, …) but was left with no `settings` at all — attached to the
  // canvas but never actually configured (see handleInsertNode's "no-loss
  // add": a node attaches immediately, before its config panel is saved).
  // That's a genuine blocker — there's nothing real for it to send or check.
  for (const step of steps) {
    if (findPaletteNode(step.paletteNodeId)?.requiresConfig && !step.settings) {
      findings.push({
        severity: "Blocker",
        text: `"${step.nodeLabel}" was added but never configured — it still has no real content to send or check.`,
      });
    }
  }
  if (steps[0]?.tone === "action") {
    findings.push({
      severity: "Warning",
      text: "The very first step after the trigger is a message with no wait beforehand — people get messaged the instant they trigger this, which can feel abrupt. Consider adding a Time Delay first.",
    });
  }
  if (actionSteps.length >= 2 && !hasCondition) {
    findings.push({
      severity: "Warning",
      text: "There's no condition checking engagement between messages — everyone gets every step regardless of whether they opened or clicked the last one.",
    });
  }
  if (actionSteps.length > 1 && channels.size === 1) {
    findings.push({
      severity: "Note",
      text: `Every message goes out on the same channel (${actionSteps[0].label}) — if someone doesn't engage there, they never get a second chance on a different one.`,
    });
  }

  const severityRank = { Blocker: 0, Warning: 1, Note: 2 };
  findings.sort((a, b) => severityRank[a.severity] - severityRank[b.severity]);
  const hasBlocker = findings.some((f) => f.severity === "Blocker");
  const readiness = hasBlocker ? "NO" : findings.length > 0 ? "YES WITH WARNINGS" : "YES";

  const header = `<strong>Journey review — "${triggerLabel}"</strong>\n\n${steps.length} step${
    steps.length === 1 ? "" : "s"
  } checked.`;
  const body =
    findings.length === 0
      ? "\n\nNo blockers, warnings, or notes — the trigger, every node, and every branch check out."
      : "\n\n" + findings.map((f, i) => `${i + 1}. [${f.severity}] ${f.text}`).join("\n\n");

  return `${header}${body}\n\nReady to activate — ${readiness}`;
}

/** Reasoning steps shown while the Journey Experiment Agent "thinks" — same
 *  hand-off pattern as the Journey review agent above. Shared by the
 *  "Experiment" pill and a typed change-request in the docked co-marketer. */
export const JOURNEY_EXPERIMENT_REASONING_STEPS = [
  "Reading the journey's nodes and configuration",
  "Understanding what you want to improve",
  "Finding the step this change would affect",
  "Drafting a Control vs Variant comparison",
];

/** "Experiment" / a typed change request (e.g. "reduce the wait to 2
 *  hours") — proposes testing the change on a slice of the audience rather
 *  than editing the live journey (see journeyExperiment.data.ts /
 *  ExperimentCard.tsx). Only knows how to propose a Wait-step duration
 *  change, the one scenario this agent's own spec walks through — nothing
 *  invented for node types it doesn't actually reason about. */
export function buildExperimentIntroReply(proposal: ExperimentProposal | null): string {
  if (!proposal) {
    return "I couldn't find a Wait step on this journey's main path to test a duration change on — add one, or point me at a specific step you'd like to experiment with.";
  }
  return `I found one change to test:\n\n${proposal.changeSummary}`;
}

/** Which message-channel palette nodes get send-performance stats in "Show
 *  analytics" (below), and whether that channel has a real "open" concept —
 *  email/push are opened, SMS-style channels are only clicked. Everything
 *  else (Wait, Condition, Agent, Webhook, Update Attribute…) has no message
 *  performance to simulate, so it's left out of the per-step breakdown. */
const ANALYTICS_CHANNELS: Record<string, { hasOpen: boolean }> = {
  email: { hasOpen: true },
  "web-push": { hasOpen: true },
  "app-push": { hasOpen: true },
  sms: { hasOpen: false },
  whatsapp: { hasOpen: false },
  voice: { hasOpen: false },
  viber: { hasOpen: false },
  zalo: { hasOpen: false },
  rcs: { hasOpen: false },
  limechat: { hasOpen: false },
};

const randInt = (min: number, max: number) => min + Math.floor(Math.random() * (max - min + 1));
const fmt = (n: number) => n.toLocaleString("en-IN");

// The domain terms worth calling out alongside numbers in a Journey
// Optimization Agent reply — channel names and the handful of metric nouns
// these replies actually use. Deliberately short: common words (e.g.
// "journey") appear constantly and would turn into visual noise rather
// than emphasis if bolded every time.
const HI_KEYWORDS = ["WhatsApp", "purchase conversion", "engagement", "delivery", "open/read rate", "click rate", "email"];
const HI_PATTERN = new RegExp(
  `(${HI_KEYWORDS.map((k) => `\\b${k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`).join("|")})|([\\d,]*\\d+(?:\\.\\d+)?%?)`,
  "gi",
);
// Bolds those keywords plus every number/percentage in a reply (e.g. "32%",
// "15,000", "WhatsApp") in the app's normal ink colour — just a heavier
// font weight, same size, no colour change — so the key facts stand out at
// a glance without shouting. Uses its own "chat-num" class rather than a
// bare <strong> because .text-sm strong (index.css) is already claimed by
// this same chat's own section headers ("What I'd test:") as an 18px
// block-level style — reusing it here would both enlarge the text AND
// force it onto its own line (see .chat-num's override in index.css). A
// caller that feeds this into a chat message must still wrap the whole
// resulting sentence in a single parent <p>...</p> (or already have one) —
// a bare inline element dropped straight into plain text is its own
// top-level node to ChatMessage's splitIntoBlocks and renders as its own
// line otherwise.
const hi = (text: string) => text.replace(HI_PATTERN, (m) => `<strong class="chat-num">${m}</strong>`);

/** "Show analytics" — a simulated performance readout for the whole journey
 *  (this app has no live send data anywhere — see ChatInterface.tsx), with
 *  one section per message step, matching the metrics a real send report
 *  shows: open rate (where the channel has one), click rate, and placed
 *  orders. Numbers are freshly rolled each time, like a live dashboard. */
export function buildJourneyAnalyticsReply(flow: FlowStep[], triggerLabel: string | null): string {
  if (!triggerLabel || flow.length === 0) {
    return "This canvas is still empty — there's no journey to show analytics for yet. Add a trigger and at least one step, then ask me again.";
  }
  const messageSteps = flattenFlowSteps(flow).filter((s) => s.tone === "action" && s.paletteNodeId in ANALYTICS_CHANNELS);
  if (messageSteps.length === 0) {
    return `<strong>Journey performance</strong>\n\n"${triggerLabel}" doesn't have any message steps yet — add an Email, SMS, or another channel step to see performance here.`;
  }

  const entered = randInt(1200, 5400);
  const sections = [`<strong>Journey performance</strong>\n\n${fmt(entered)} profiles entered "${triggerLabel}" this period.`];

  for (const step of messageSteps) {
    const { hasOpen } = ANALYTICS_CHANNELS[step.paletteNodeId];
    const delivered = Math.round(entered * (randInt(70, 96) / 100));
    const lines = [`<strong>${step.nodeLabel}</strong>`];

    if (hasOpen) {
      const openRate = randInt(22, 58);
      lines.push(`Open rate: ${openRate}% (${fmt(Math.round((delivered * openRate) / 100))})`);
    }
    const clickRate = randInt(3, 14);
    lines.push(`Click rate: ${clickRate}% (${fmt(Math.round((delivered * clickRate) / 100))})`);

    const orderRate = Math.round(clickRate * (randInt(10, 30) / 100) * 10) / 10;
    const orders = Math.round((delivered * orderRate) / 100);
    const revenue = orders * randInt(300, 1200);
    lines.push(`Placed order: ${orderRate}% (₹${fmt(revenue)})`);

    sections.push(lines.join("\n"));
  }

  return sections.join("\n\n");
}

/** Which scripted co-marketer storyline a "Create Journey" page prompt opens
 *  — set by JourneyCreate.tsx's example chips ("custom" is any typed text). */
export type AIPromptKind = "cart" | "welcome" | "winback" | "custom";

/** One scripted co-marketer conversation: an opening acknowledgment, a short
 *  sequence of questions asked one at a time in CoMarketerQuestionCard, and
 *  the resulting journey's shape (a trigger, then a single Wait + one
 *  action step) once every question is answered — mirrors the same
 *  trigger/wait/action shape templates use (see templateToFlowSteps above).
 *  Entirely scripted/hardcoded, same as every other co-marketer
 *  conversation in this app (see conversations.ts) — no real generation
 *  happens, and the questions' answers don't change the generated shape
 *  below except where they're explicitly wired to (channelPaletteNodeIds). */
interface AIJourneyScript {
  openingReply: string;
  /** Shown one at a time in CoMarketerQuestionCard — separate from
   *  openingReply (still shown as the chat bubble text) so the card carries
   *  its own short prompts instead of the full acknowledgment sentence. */
  questions: CoMarketerQuestion[];
  /** Shown once every question is answered, before the "Create journey" step. */
  summaryReply: string;
  triggerLabel: string;
  waitLabel: string;
  actionTitle: string;
  /** Which palette node the generated action step becomes. Used as-is for
   *  scripts whose questions aren't about channel (e.g. "cart" below, which
   *  asks about audience/incentive/email count instead); for scripts whose
   *  first question *is* the channel choice, channelPaletteNodeIds maps
   *  that question's picked label to the real id instead. */
  defaultPaletteNodeId: string;
  /** Present only when questions[0] is itself the channel choice — maps its
   *  option labels to the palette node they mean. */
  channelPaletteNodeIds?: Record<string, string>;
  /** Present only for scripts whose answers should actually shape the
   *  generated journey (e.g. "cart"'s audience/incentive/email-count
   *  answers) instead of the fixed single Wait+action pair every other
   *  script produces. Returns the real trigger label plus one Wait+action
   *  pair per generated step. */
  resolve?: (answers: (string | null)[]) => {
    triggerLabel: string;
    steps: { waitLabel: string; actionTitle: string }[];
  };
}

const AI_JOURNEY_SCRIPTS: Record<Exclude<AIPromptKind, "custom">, AIJourneyScript> = {
  cart: {
    openingReply:
      "Got it — let's win back people who left items in their cart. I've got a few quick questions first.",
    questions: [
      {
        title: "Who should enter this flow?",
        options: ["All cart abandoners", "First-time customers only", "Returning customers only"],
      },
      {
        title: "Should the flow include an incentive?",
        options: ["No incentive", "Offer a discount", "Free shipping"],
      },
      {
        title: "How many emails should the series include?",
        options: ["2 emails", "3 emails", "Use your recommendation"],
      },
    ],
    summaryReply: "Got it — sending a reminder 1 hour after they abandon their cart. Ready to build this?",
    triggerLabel: "Cart Abandoned",
    waitLabel: "Wait 1 hour",
    actionTitle: "Complete your purchase",
    defaultPaletteNodeId: "email",
    resolve: (answers) => {
      const [audience, incentive, emailCount] = answers;
      const audienceSuffix =
        audience === "First-time customers only"
          ? " (First-time customers)"
          : audience === "Returning customers only"
            ? " (Returning customers)"
            : "";
      const waitLabels = ["Wait 1 hour", "Wait 1 day", "Wait 3 days"];
      const titles = ["Complete your purchase", "Still thinking about it?", "Last chance — complete your purchase"];
      const n = emailCount === "3 emails" ? 3 : 2;
      const incentiveSuffix =
        incentive === "Offer a discount"
          ? " — 10% off inside"
          : incentive === "Free shipping"
            ? " — free shipping today"
            : "";
      const steps = waitLabels.slice(0, n).map((waitLabel, i) => ({
        waitLabel,
        actionTitle: titles[i] + (i === n - 1 ? incentiveSuffix : ""),
      }));
      return { triggerLabel: `Cart Abandoned${audienceSuffix}`, steps };
    },
  },
  welcome: {
    openingReply: "Let's set up a warm welcome for new customers.",
    questions: [{ title: "Which channel should send the welcome message?", options: ["Email", "App Push"] }],
    summaryReply: "Sending it 1 day after signup. Ready to build this?",
    triggerLabel: "Signup Completed",
    waitLabel: "Wait 1 day",
    actionTitle: "Welcome aboard!",
    defaultPaletteNodeId: "email",
    channelPaletteNodeIds: { Email: "email", "App Push": "app-push" },
  },
  winback: {
    openingReply: "Let's re-engage customers who've gone quiet.",
    questions: [{ title: "Which channel should I use?", options: ["Email", "Push notification"] }],
    summaryReply: "Sending it 3 days after they hit 60 days of inactivity. Ready to build this?",
    triggerLabel: "60 Days Since Last Purchase",
    waitLabel: "Wait 3 days",
    actionTitle: "We miss you!",
    defaultPaletteNodeId: "email",
    channelPaletteNodeIds: { Email: "email", "Push notification": "app-push" },
  },
};

/** Free-typed text can't be matched to a real storyline, so it plays a
 *  generic version of the same script, quoting the text back. */
function customAIJourneyScript(promptText: string): AIJourneyScript {
  return {
    openingReply: `Got it — let's build a journey for: "${promptText}".`,
    questions: [{ title: "Which channel should I use?", options: ["Email", "SMS"] }],
    summaryReply: "Ready to build this?",
    triggerLabel: "Custom Trigger",
    waitLabel: "Wait 1 day",
    actionTitle: "Following up",
    defaultPaletteNodeId: "email",
    channelPaletteNodeIds: { Email: "email", SMS: "sms" },
  };
}

function scriptForAIPrompt(kind: AIPromptKind, promptText: string): AIJourneyScript {
  return kind === "custom" ? customAIJourneyScript(promptText) : AI_JOURNEY_SCRIPTS[kind];
}

/** Resolves the answered (or skipped) questions to the real palette node the
 *  generated action step becomes — the picked channel label for scripts
 *  whose first question is the channel choice, or the script's fixed
 *  default otherwise (e.g. "cart", whose 3 questions are about audience/
 *  incentive/email count, not channel). */
function paletteNodeIdForAnswers(script: AIJourneyScript, answers: (string | null)[]): string {
  if (script.channelPaletteNodeIds) {
    const picked = answers[0];
    if (picked && script.channelPaletteNodeIds[picked]) return script.channelPaletteNodeIds[picked];
  }
  return script.defaultPaletteNodeId;
}

/** Builds the scripted journey's trigger label + Wait/action step pairs once
 *  a channel is picked — same FlowStep shape templateToFlowSteps produces.
 *  Scripts with a `resolve` (e.g. "cart") turn the answered questions into
 *  a real trigger label and one or more Wait+action pairs; every other
 *  script falls back to its fixed single Wait+action pair, unaffected by
 *  the answers. */
function buildAIGeneratedFlowSteps(
  script: AIJourneyScript,
  channelPaletteNodeId: string,
  answers: (string | null)[],
): { triggerLabel: string; steps: FlowStep[] } {
  const resolved = script.resolve
    ? script.resolve(answers)
    : { triggerLabel: script.triggerLabel, steps: [{ waitLabel: script.waitLabel, actionTitle: script.actionTitle }] };
  const waitNode = findPaletteNode("time-delay");
  const actionNode = findPaletteNode(channelPaletteNodeId);
  const steps: FlowStep[] = [];
  for (const { waitLabel, actionTitle } of resolved.steps) {
    if (waitNode) {
      steps.push({
        id: `${waitNode.id}-${stepSeq++}`,
        paletteNodeId: waitNode.id,
        label: waitNode.label,
        nodeLabel: waitLabel,
        icon: waitNode.icon,
        tone: waitNode.tone,
        branches: undefined,
        settings: settingsForGeneratedStep(waitNode.id, waitLabel),
      });
    }
    if (actionNode) {
      steps.push({
        id: `${actionNode.id}-${stepSeq++}`,
        paletteNodeId: actionNode.id,
        label: actionNode.label,
        nodeLabel: actionTitle,
        icon: actionNode.icon,
        tone: actionNode.tone,
        branches: undefined,
        settings: settingsForGeneratedStep(actionNode.id, actionTitle),
      });
    }
  }
  return { triggerLabel: resolved.triggerLabel, steps };
}

/** "Untitled" + a creation timestamp — the default name for a journey no one
 *  has renamed yet, e.g. "Untitled Sep 17, 3:52 PM". */
function generateUntitledName(): string {
  const now = new Date();
  const stamp = now.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
  return `Untitled ${stamp}`;
}

/**
 * Journey creation page — a focused, full-screen builder with no app chrome
 * (no L1 rail, no top navbar). Its own header bar sits on top, with a
 * two-pane body below: the LHS node palette and the RHS journey canvas.
 *
 * The "type of journey" picker now lives on the Journeys listing page (it
 * opens there, over the list, before the user ever navigates here) — by the
 * time this page mounts, that choice has already been made. For a
 * from-scratch journey, the canvas shows a single "Choose trigger" CTA card
 * right away (no naming step); the left JourneyPalette never shows at all
 * for this flow — the right side always carries either the trigger picker
 * (JourneyTriggerDrawer, while no trigger is set) or, once one is, the
 * searchable JourneyNodeDrawer for dragging steps onto the canvas. The
 * scratch-flow body is a tree, not a list: any Condition or Flow Control
 * step automatically splits into its own "yes"/"no" branch, each an
 * independent chain ending in its own End — see journeyFlowTree.ts. A
 * template-based journey (arrives via a `template` in router state, set by
 * TemplatePreviewModal's "Use template") uses this exact same canvas too,
 * just pre-filled with that template's steps (see templateToFlowSteps)
 * instead of starting empty — so it's fully editable from the moment it
 * lands here. A journey started from a "Create Journey" page AI prompt
 * (arrives via `aiPrompt`/`aiPromptKind`) also lands on this same canvas,
 * but with the co-marketer chat (the same ChatInterface/SeededTopic
 * mechanism the Email Campaign flow's docked "Ask co-marketer" panel uses)
 * open on the right in place of the trigger picker/drawer — see the
 * `aiChatOpen` state below — until the scripted conversation finishes and
 * pastes its generated trigger + steps onto the canvas. Only AI-generated
 * journeys from the OTHER "Create with AI" entry point (Journeys.tsx's own
 * CTA, `openAI`) are untouched: they still use JourneyPalette on the left.
 * That "create with AI" drawer (JourneyAIModal) is a separate, unrelated
 * overlay that opens over an empty canvas and reveals the generated journey
 * once it finishes.
 */
export default function JourneyBuilder() {
  const navigate = useNavigate();
  const location = useLocation();
  const routerState = location.state as
    | {
        openAI?: boolean;
        templateId?: string;
        journeyName?: string;
        aiPrompt?: string;
        aiPromptKind?: AIPromptKind;
      }
    | null;
  // `openAI` arrives from the "Create with AI" CTA — the AI drawer opens over
  // an empty builder. A `templateId` means "Use template" was tapped in
  // TemplatePreviewModal — looked back up here (router state must be
  // structured-cloneable, so the template's own icon components can't cross
  // navigation) and its steps pasted onto this same editable canvas below
  // (see templateToFlowSteps), so a template-based journey now behaves
  // exactly like a scratch one, just pre-filled. An `aiPrompt` means an
  // example chip (or typed text) was submitted on the "Create Journey" page
  // — its scripted co-marketer conversation plays out in `aiChatOpen` below.
  const openAI = routerState?.openAI ?? false;
  const initialTemplate: JourneyTemplate | null =
    JOURNEY_TEMPLATES.find((t) => t.id === routerState?.templateId) ?? null;
  const isCartAbandonmentOngoing = routerState?.templateId === CART_ABANDONMENT_ONGOING_TEMPLATE_ID;
  // "Edit journey" on an already-built journey (Report page's Overall tab,
  // or anywhere else that hands over a real templateId) — the canvas lands
  // pre-filled, so there's nothing to pick from "Add to journey" yet; the
  // co-marketer panel is what a marketer actually wants open first here,
  // not the from-scratch node drawer (see nodeDrawerVisible/aiChatOpen
  // below). A true blank/from-scratch canvas keeps the old default.
  const isEditingExistingJourney = isCartAbandonmentOngoing || !!initialTemplate;
  const initialAIPrompt = routerState?.aiPrompt ?? null;
  const initialAIPromptKind: AIPromptKind = routerState?.aiPromptKind ?? "custom";
  const isScratchFlow = !openAI;

  const [aiModalOpen, setAiModalOpen] = useState(openAI);
  const [showTriggerDrawer, setShowTriggerDrawer] = useState(false);
  const [triggerLabel, setTriggerLabel] = useState<string | null>(() => {
    if (isCartAbandonmentOngoing) return CART_ABANDONMENT_ONGOING_TRIGGER_LABEL;
    if (!initialTemplate) return null;
    const triggerStep = initialTemplate.preview.find((s) => s.type === "trigger");
    return triggerStep?.subtitle ?? initialTemplate.trigger;
  });
  // Set only when the trigger is a from-scratch "Activity" pick — the real
  // ActivityDefinition id(s) behind triggerLabel's sentence, so the Email
  // node's "User activity payload" personalize menu can look up this
  // journey's actual payload fields (see triggerPayloadAttributes below).
  // Template/AI journeys never set this — triggerLabel there is fixed,
  // scripted copy with no real ActivityDefinition behind it.
  const [triggerActivityIds, setTriggerActivityIds] = useState<string[] | null>(() =>
    isCartAbandonmentOngoing ? ["add-to-cart"] : null,
  );
  // A test just created from the read-only Node-wise report's co-marketer
  // (JourneyReport.tsx has no live flow of its own to mutate) — stashed via
  // pendingOptimizerTest.ts and consumed exactly once, right here, by both
  // `flow` and `activeTest` below. See that module for why this isn't
  // carried as router state instead.
  const [pendingTest] = useState(() => peekPendingOptimizerTest());
  useEffect(() => {
    if (pendingTest) clearPendingOptimizerTest();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // Cart Abandonment Ongoing's own Optimizer session (canvas + co-marketer
  // conversation), persisted across a Journey Builder unmount/remount — see
  // cartAbandonmentTestSession.ts. Read fresh (not memoized) everywhere it's
  // used below — `saveCartAbandonment*` reassigns the module's `session` to
  // a new object on every write, so a snapshot taken once at mount would go
  // stale the moment anything changed, e.g. across an in-session panel
  // close/reopen (JourneyBuilder itself stays mounted for that).
  const [flow, setFlow] = useState<FlowStep[]>(() => {
    if (pendingTest) return pendingTest.flow;
    if (isCartAbandonmentOngoing) return getCartAbandonmentSession().flow ?? buildCartAbandonmentOngoingFlow();
    return initialTemplate ? templateToFlowSteps(initialTemplate) : [];
  });
  const [configuringNode, setConfiguringNode] = useState<ConfiguringNode | null>(null);
  // The running Optimizer's own setup — the canvas's optimizer-split node
  // only stores the two branches' steps/percentages (what the canvas needs
  // to render), not the proposal/metric/description behind it. Kept here so
  // reopening co-marketer on an existing test can show its real results
  // (see handleExperimentJourney/handleOptimizeNode), and — for Cart
  // Abandonment Ongoing — persisted into cartAbandonmentTestSession.ts too,
  // since that journey's whole session (including its chat thread) now
  // survives a close/reopen rather than resetting.
  const [activeTest, setActiveTest] = useState<ActiveTestState | null>(() => {
    if (pendingTest) {
      const c = pendingTest.config;
      return {
        proposal: c.proposal,
        changeKind: c.changeKind,
        anchorStepId: c.anchorStepId,
        changeDescription: c.changeDescription,
        variantPercent: c.variantPercent,
        metric: c.metric,
      };
    }
    if (isCartAbandonmentOngoing) return getCartAbandonmentSession().activeTest;
    return null;
  });
  // Write-through: every canvas/test-state change mirrors into the
  // persisted session so a later "Edit journey" round trip resumes exactly
  // here instead of rebuilding the fresh template.
  useEffect(() => {
    if (isCartAbandonmentOngoing) saveCartAbandonmentFlow(flow);
  }, [flow, isCartAbandonmentOngoing]);
  useEffect(() => {
    if (isCartAbandonmentOngoing) saveCartAbandonmentActiveTest(activeTest);
  }, [activeTest, isCartAbandonmentOngoing]);
  // The co-marketer chat, opened straight onto an AI-prompt journey's
  // scripted conversation. `aiScript` is fixed for the session (computed
  // once from the prompt that arrived via router state); `aiStage` tracks
  // where the scripted exchange is; `aiFollowUpTopic`/`aiFollowUpSeq` feed
  // ChatInterface's existing "append another turn to an open thread"
  // mechanism (the same one the campaign flow's suggestion chips use).
  const [aiChatOpen, setAiChatOpen] = useState(() => !!initialAIPrompt || isEditingExistingJourney);
  const [aiScript] = useState<AIJourneyScript | null>(() =>
    initialAIPrompt ? scriptForAIPrompt(initialAIPromptKind, initialAIPrompt) : null,
  );
  const [aiStage, setAiStage] = useState<"seeded" | "channelPicked" | "created">("seeded");
  const [aiPaletteNodeId, setAiPaletteNodeId] = useState<string | null>(null);
  const [aiAnswers, setAiAnswers] = useState<(string | null)[]>([]);
  const [aiFollowUpTopic, setAiFollowUpTopic] = useState<SeededTopic | null>(null);
  const [aiFollowUpSeq, setAiFollowUpSeq] = useState(0);
  // ChatInterface's own "specialist agents" roster toggle — required by the
  // component (used internally regardless of variant); this journey chat
  // doesn't surface agent-switching, so it just stays empty.
  const [aiChatEnabledAgents, setAiChatEnabledAgents] = useState<Set<string>>(new Set());
  // Once the test journey has finished building (activeTest just got set —
  // whether that happened this session or was resumed from a previous one),
  // volunteer a performance summary and the merge question exactly once —
  // `getCartAbandonmentSession().summaryAppended` is a plain module-level
  // read, so under StrictMode's double-invoked effect the second
  // invocation always sees the first one's write and skips, with no ref
  // needed. Never fires again once merged (activeTest goes back to null).
  useEffect(() => {
    if (!isCartAbandonmentOngoing || !activeTest) return;
    if (getCartAbandonmentSession().summaryAppended) return;
    markCartAbandonmentSummaryAppended();
    setAiFollowUpTopic({
      prompt: "",
      suppressPromptTurn: true,
      reply:
        `<p>${hi(
          "Your test journey is performing well. It achieved an 8.1% purchase conversion rate across 15,000 users, with 97.1% delivery, 52.0% open/read rate, and 40.8% click rate.",
        )}</p>` + `<p>Would you like to merge this test journey into your main journey?</p>`,
      agentId: "journey-experiment-agent",
      skipAgentSwitchBanner: true,
      thinkingDurationSeconds: 3,
      mergeTestCta: true,
    });
    setAiFollowUpSeq((n) => n + 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTest, isCartAbandonmentOngoing]);
  // The docked panel fully remounts every time aiChatOpen flips back to
  // true (it's conditionally rendered), which would replay the original
  // prompt's opening line again on every reopen. This flips true the first
  // time the panel closes, so a later reopen (via the header's Co-marketer
  // button, or the Audit/Analyze pills) starts fresh instead of repeating
  // the original conversation.
  const aiChatSeededOnceRef = useRef(false);
  // The question card is stuck to the top of ChatInterface's own composer —
  // there's no slot to render it *inside* that component (it's a large,
  // shared, self-contained panel used across the whole app), so instead
  // it's absolutely positioned over it: same left/width as the composer's
  // own bordered field (not just an approximate padding guess), offset up
  // by the composer's measured height, and capped to the space actually
  // available above the composer so it can never grow up over the header
  // or the message thread — it scrolls internally instead. Re-measured on
  // resize and while open, since the composer grows with multi-line text.
  const aiChatColumnRef = useRef<HTMLDivElement>(null);
  const [questionCardMetrics, setQuestionCardMetrics] = useState<{
    bottom: number;
    left: number;
    width: number;
    maxHeight: number;
  } | null>(null);
  useEffect(() => {
    if (!aiChatOpen || (aiStage !== "seeded" && aiStage !== "channelPicked")) return;
    const container = aiChatColumnRef.current;
    if (!container) return;
    const measure = () => {
      const textarea = container.querySelector("textarea");
      if (!textarea) return;
      // The composer's own bordered field, not the bare <textarea> (which
      // sits inset from it by its own padding) — walk up from the textarea
      // to the rounded, bordered box around it.
      let box: HTMLElement = textarea;
      for (let i = 0; i < 6 && box.parentElement; i++) {
        box = box.parentElement;
        if (box.className.includes("rounded-[18px]")) break;
      }
      const containerRect = container.getBoundingClientRect();
      const boxRect = box.getBoundingClientRect();
      // The real ceiling isn't the panel's own top — it's wherever the last
      // message bubble actually ends, so the card never covers real
      // conversation text; only capping against the container's top edge
      // left it free to overlap the message above it whenever the thread
      // was short. Excludes the card's own paragraphs (#ai-question-card)
      // and anything already below the composer (the disclaimer footer),
      // which isn't part of the scrollable thread above it.
      const messageBottoms = [...container.querySelectorAll("p")]
        .filter((p) => !p.closest("#ai-question-card"))
        .map((p) => p.getBoundingClientRect().bottom)
        .filter((bottom) => bottom < boxRect.top);
      const contentBottom = messageBottoms.length ? Math.max(...messageBottoms) : containerRect.top;
      const ceiling = Math.max(contentBottom + 12, containerRect.top + 16);
      // Floor is high enough to fit a full question (header + title + up to
      // 3 options + footer) without the card's own body having to scroll —
      // on a short window the gap between the last message and the composer
      // can be much smaller than that, so this floor can win over the
      // message-clearance ceiling above and let the card overlap an
      // already-answered message rather than force-scroll the active
      // question, which is the worse of the two trade-offs.
      const QUESTION_CARD_MIN_HEIGHT = 340;
      setQuestionCardMetrics({
        bottom: containerRect.bottom - boxRect.top + 8,
        left: boxRect.left - containerRect.left,
        width: boxRect.width,
        maxHeight: Math.max(QUESTION_CARD_MIN_HEIGHT, boxRect.top - 8 - ceiling),
      });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(container);
    const interval = window.setInterval(measure, 250);
    return () => {
      observer.disconnect();
      window.clearInterval(interval);
    };
  }, [aiChatOpen, aiStage]);
  // The AI's next actionable step (the question card, or "Create journey")
  // appears after a short "thinking" pause instead of the instant it's
  // technically ready — reads as the co-marketer actually working rather
  // than a canned UI flash. Re-arms on every aiStage change.
  const [aiNextStepRevealed, setAiNextStepRevealed] = useState(false);
  useEffect(() => {
    setAiNextStepRevealed(false);
    const t = window.setTimeout(() => setAiNextStepRevealed(true), 2200);
    return () => window.clearTimeout(t);
  }, [aiStage]);
  // Whether the "Add to journey" panel is showing; its own X hides it.
  // Defaults closed when landing on an already-built journey (co-marketer
  // opens instead — see isEditingExistingJourney/aiChatOpen above); a true
  // from-scratch canvas still opens straight onto it.
  const [nodeDrawerVisible, setNodeDrawerVisible] = useState(() => !isEditingExistingJourney);
  const [hasJourney, setHasJourney] = useState(!openAI);
  const [journeyName, setJourneyName] = useState(routerState?.journeyName ?? generateUntitledName());
  const [generatedByAI, setGeneratedByAI] = useState(false);
  // A fresh id per journey — not persisted anywhere, just enough for the
  // header to show something other than a hardcoded demo id.
  const [journeyId] = useState(() => String(Math.floor(1000 + Math.random() * 9000)));
  // Unset until Settings saves one — the header's schedule row only renders
  // once this is set.
  const [journeyDates, setJourneyDates] = useState<JourneyDates | null>(null);
  // Unset until Settings saves one — together with journeyDates, this gates
  // "Publish journey" (see JourneyBuilderHeader's publishReady).
  const [journeyGoal, setJourneyGoal] = useState<string | null>(null);
  // Where a typed "I want to optimize my journey" is in its own
  // goal-first conversation — see handleCoMarketerBeforeSend. "none" until
  // that phrase is typed; back to "none" once the marketer has kept or set
  // a goal and the agent has moved on to the journey's actual analysis.
  const [goalStage, setGoalStage] = useState<"none" | "awaiting-keep-or-change" | "awaiting-new-goal">("none");
  // Set the moment a JourneyOptimizationProposalCard's question is asked —
  // that card has no buttons of its own, so whatever the marketer types
  // next answers it (see handleCoMarketerBeforeSend); cleared once handled.
  const [pendingProposal, setPendingProposal] = useState<JourneyProposalCardData | null>(null);
  // Set once "Test this optimization" starts the audience-percentage
  // question — carries what the eventual test needs (proposal/insight/
  // anchor) through the percentage question and the summary that follows,
  // without re-deriving either. Cleared once the percentage is answered.
  const [pendingAudienceTest, setPendingAudienceTest] = useState<{
    insight: NodeOptimizationInsight;
    anchorStepId: string;
    proposal: ExperimentProposal;
  } | null>(null);
  // Set once the audience percentage is answered and the final summary
  // ("Would you like me to set up this test journey...?") is asked —
  // whatever's typed next answers THAT, same pattern as pendingAudienceTest.
  const [pendingTestConfirmation, setPendingTestConfirmation] = useState<{
    insight: NodeOptimizationInsight;
    anchorStepId: string;
    proposal: ExperimentProposal;
    variantPercent: number;
  } | null>(null);
  // True while beginTestBuildAnimation is progressively revealing the test
  // journey on canvas — the canvas goes read-only for this (no add/edit/
  // optimize affordances) so nothing can interrupt the build mid-way.
  const [isBuildingTest, setIsBuildingTest] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  // The node the bottom action toolbar (Add/Copy/Move/Delete) currently
  // applies to — null means the toolbar shows only its default "Add" state.
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null);
  // The "Keyboard shortcuts" side panel, opened from the header's overflow menu.
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  const buildStep = (paletteNodeId: string, overrideLabel?: string, settings?: StepSettings): FlowStep | null => {
    const node = findPaletteNode(paletteNodeId);
    if (!node) return null;
    return {
      id: `${node.id}-${stepSeq++}`,
      paletteNodeId: node.id,
      label: node.label,
      nodeLabel: overrideLabel ?? node.nodeLabel,
      icon: node.icon,
      tone: node.tone,
      // A Condition or Flow Control step always starts its own Yes/No
      // branches, each with nothing in it yet (so each renders its own End).
      branches: node.tone === "condition" || node.tone === "flow" ? { yes: [], no: [] } : undefined,
      settings,
    };
  };

  // The single insertion entry point — called with exactly where to insert
  // from either a drawer row dropped on a gap, or a node picked from that
  // gap's own contextual popup (NodePickerPopup, owned by JourneyCanvas).
  // Every node attaches to the canvas immediately, in its default/empty
  // state — a node with `requiresConfig` then has its settings panel opened
  // on top of that, already-attached step, rather than withholding the
  // attach until the panel is saved. This also means adding a second node
  // before an earlier one is configured can never lose the first: each
  // insert is independent of whatever the settings panel is doing.
  const handleInsertNode = (paletteNodeId: string, path: FlowPath, index: number) => {
    const step = buildStep(paletteNodeId);
    if (!step) return;
    setFlow((prev) => insertStepAt(prev, path, index, step));
    // A freshly-added node is also the toolbar's selection, same as clicking
    // an existing one — Copy/Move/Delete apply to it right away.
    setSelectedStepId(step.id);
    setShowTriggerDrawer(false);
    setSettingsOpen(false);
    setShortcutsOpen(false);
    if (findPaletteNode(paletteNodeId)?.requiresConfig) {
      // The sidebar can be hidden (its own X, independent of any config
      // panel) while the canvas "+" popup is still reachable — force it back
      // open so the settings panel it's about to show actually renders.
      setNodeDrawerVisible(true);
      setConfiguringNode({ stepId: step.id, paletteNodeId, initial: undefined });
    }
  };
  // Opens the "Add to journey" drawer straight onto its node list — used by
  // both the bottom toolbar's "Add" button and the "A" keyboard shortcut.
  // Clears any open config screen first, since the drawer shares that same
  // panel: without this, clicking/pressing Add while a node's settings are
  // open would look like a dead click, still showing that panel.
  const handleOpenAddDrawer = () => {
    setConfiguringNode(null);
    setNodeDrawerVisible(true);
    setShowTriggerDrawer(false);
    setSettingsOpen(false);
    setShortcutsOpen(false);
  };
  // The seed topic ChatInterface plays the moment the co-marketer chat
  // mounts — only relevant while aiChatOpen, so it's fine to recompute this
  // every render (aiScript/initialAIPrompt never change after mount). Only
  // offered on the panel's very first-ever mount (see aiChatSeededOnceRef) —
  // a later reopen (Co-marketer button, Audit/Analyze pills) shouldn't
  // replay the original prompt's conversation.
  const aiInitialTopic: SeededTopic | undefined =
    !aiChatSeededOnceRef.current && initialAIPrompt && aiScript
      ? { prompt: initialAIPrompt, reply: aiScript.openingReply }
      : undefined;
  // Opens the docked co-marketer panel, closing the node drawer/trigger
  // picker first since they share the same right-hand column — used by the
  // header's "Co-marketer" button and the canvas's Audit/Analyze pills.
  const handleOpenCoMarketer = () => {
    setConfiguringNode(null);
    setNodeDrawerVisible(false);
    setShowTriggerDrawer(false);
    setSettingsOpen(false);
    setShortcutsOpen(false);
    setAiChatOpen(true);
  };
  // The canvas's own top "Co-marketer" button (as opposed to the bottom
  // bar's Audit/Optimize/Simulate pills, or a node's own Sparkles button) —
  // when a test is already running, this is what the marketer decides its
  // fate from, so it skips straight to the Journey Optimization Agent and
  // its decision question rather than landing on the generic starter chips
  // and making them click "Optimize journey" first. With no test running,
  // it opens exactly as before.
  const handleOpenCoMarketerButton = () => {
    handleOpenCoMarketer();
    const optimizer = findOptimizerStep(flow);
    if (optimizer) showActiveTestStatus(optimizer);
  };
  // Every right-column panel (trigger drawer, node settings, co-marketer,
  // keyboard shortcuts) closes before Settings opens, and Settings closes
  // before any of them open — see the matching closeNodeSettings/
  // onClickTrigger/handleOpenCoMarketer/onOpenShortcuts calls below. Only
  // one panel ever occupies that column at a time.
  const handleOpenSettings = () => {
    closeNodeSettings();
    setShowTriggerDrawer(false);
    setShortcutsOpen(false);
    if (aiChatOpen) {
      aiChatSeededOnceRef.current = true;
      setAiChatOpen(false);
    }
    setSettingsOpen(true);
  };
  // "Audit flow" / "Show analytics" — both genuinely inspect the current
  // canvas (see buildJourneyAuditReply/buildJourneyAnalyticsReply) rather
  // than showing a fixed canned reply, so the answer actually reflects
  // what's been built. Appended as a follow-up turn onto whatever
  // co-marketer thread is open (or about to open). The audit hands off to
  // the "Journey review agent" (agentId, plus its own reasoning steps) —
  // same specialist the /agents catalog's starter-journey-review entry is,
  // so this reads as that agent actually running rather than co-marketer
  // just commenting on it.
  const handleAuditFlow = () => {
    handleOpenCoMarketer();
    setAiFollowUpTopic({
      prompt: "Audit journey",
      reply: buildJourneyAuditReply(flow, triggerLabel),
      agentId: "journey-review-agent",
      reasoningSteps: JOURNEY_REVIEW_REASONING_STEPS,
    });
    setAiFollowUpSeq((n) => n + 1);
  };
  const handleShowAnalytics = () => {
    handleOpenCoMarketer();
    setAiFollowUpTopic({ prompt: "Simulate journey", reply: buildJourneyAnalyticsReply(flow, triggerLabel) });
    setAiFollowUpSeq((n) => n + 1);
  };
  // A test already running is always the Optimizer node sitting at the
  // journey's own root (see handleCreateTestBranch) — this is the one place
  // every entry point (bottom pill, a node's own Sparkles button) checks
  // "is something already being tested?" before drafting a fresh proposal.
  // Reopens straight onto the same results/decision card handleCreateTestBranch
  // first showed — the docked chat's own message history doesn't survive a
  // close/reopen, so `activeTest` (not the chat thread) is the source of
  // truth for "what's this test actually testing". Falls back to a plain
  // status line only if that state is somehow missing (e.g. mid-navigation).
  function showActiveTestStatus(optimizer: FlowStep) {
    const paths = optimizer.branches && "paths" in optimizer.branches ? optimizer.branches.paths : [];
    const existing = paths.find((p) => p.key === "existing");
    const test = paths.find((p) => p.key === "test");
    if (activeTest) {
      setAiFollowUpTopic({
        prompt: "Optimize journey",
        reply: "Let's decide what to do with this test.",
        agentId: "journey-experiment-agent",
        reasoningSteps: JOURNEY_EXPERIMENT_REASONING_STEPS,
        experimentCard: {
          proposal: activeTest.proposal,
          changeKind: activeTest.changeKind,
          anchorStepId: activeTest.anchorStepId,
          initialStage: "decide",
          initialVariantPercent: activeTest.variantPercent,
          initialMetric: activeTest.metric,
          initialChangeDescription: activeTest.changeDescription,
        } satisfies ExperimentCardData,
      });
      setAiFollowUpSeq((n) => n + 1);
      return;
    }
    setAiFollowUpTopic({
      prompt: "Optimize journey",
      reply: [
        "A test is already running on this journey.",
        existing && test
          ? `Main Journey — ${existing.percentage}% of users. Test Journey — ${test.percentage}% of users.`
          : "",
      ]
        .filter(Boolean)
        .join("\n\n"),
      agentId: "journey-experiment-agent",
      reasoningSteps: JOURNEY_EXPERIMENT_REASONING_STEPS,
    });
    setAiFollowUpSeq((n) => n + 1);
  }

  // "Optimize journey" — hands off to the Journey Optimization Agent, same
  // hand-off shape as handleAuditFlow above. Not anchored to a specific
  // node (that's handleOptimizeNode below), so it scans the whole journey
  // for the first step with a real insight and shows that — the same
  // Problem/Cause/Recommended change/Why test this card a node click shows,
  // not a generic "found a change to test" line.
  const handleExperimentJourney = () => {
    handleOpenCoMarketer();
    const optimizer = findOptimizerStep(flow);
    if (optimizer) {
      showActiveTestStatus(optimizer);
      return;
    }
    const target = findFirstNodeWithInsight(flow);
    if (target) {
      handleOptimizeNode(target);
      return;
    }
    setAiFollowUpTopic({
      prompt: "Optimize journey",
      reply: "I looked through this journey and didn't find a clear optimization opportunity right now.",
      agentId: "journey-experiment-agent",
      reasoningSteps: JOURNEY_EXPERIMENT_REASONING_STEPS,
    });
    setAiFollowUpSeq((n) => n + 1);
  };
  // Opens co-marketer straight onto one step's insight
  // (NodeOptimizationInsightCard), not a configuration screen — shared by
  // handleExperimentJourney's "Path Advisor" pill (scans for the first node
  // with an insight) and the other callers below. The "would you like to
  // test this?" question is answered right on that card (see
  // handleRespondNodeInsight below), not via a separate "Explore" click.
  const handleOptimizeNode = (step: FlowStep) => {
    handleOpenCoMarketer();
    const optimizer = findOptimizerStep(flow);
    if (optimizer) {
      showActiveTestStatus(optimizer);
      return;
    }
    const insight = buildNodeOptimizationInsight(step);
    setAiFollowUpTopic({
      prompt: "Optimize journey",
      reply: insight.hasInsight
        ? `I looked at "${step.nodeLabel}" and found something worth testing.`
        : `I looked at "${step.nodeLabel}" for an optimization opportunity.`,
      agentId: "journey-experiment-agent",
      reasoningSteps: JOURNEY_EXPERIMENT_REASONING_STEPS,
      nodeInsightCard: { stepId: step.id, stepLabel: step.label, insight },
    });
    setAiFollowUpSeq((n) => n + 1);
  };
  // The three answers on NodeOptimizationInsightCard's own inline question.
  const handleRespondNodeInsight = (response: NodeInsightResponse, data: NodeInsightCardData, recap: QuestionRecapEntry[]) => {
    if (response === "test") {
      const step = findStepById(flow, data.stepId) ?? undefined;
      const proposal = buildProposalFromInsight(data.insight, step);
      setAiFollowUpTopic({
        prompt: "Optimize journey",
        questionRecap: recap,
        reply: `Let's set up a test for: ${data.insight.recommendedChange}`,
        experimentCard: { proposal, changeKind: data.insight.changeKind, anchorStepId: data.stepId } satisfies ExperimentCardData,
      });
      setAiFollowUpSeq((n) => n + 1);
      return;
    }
    if (response === "another-idea") {
      const proposal = buildProposalFromInsight({ ...data.insight, changeKind: "other", recommendedChange: "your own idea" });
      setAiFollowUpTopic({
        prompt: "Optimize journey",
        questionRecap: recap,
        reply: "Sure — tell me what you'd like to try.",
        experimentCard: { proposal, changeKind: "other" } satisfies ExperimentCardData,
      });
      setAiFollowUpSeq((n) => n + 1);
      return;
    }
    // "explore-another" — look for a different node with a real insight
    // rather than fabricating a second finding on the same evidence.
    const alt = findFirstNodeWithInsight(flow, data.stepId);
    if (alt) {
      handleOptimizeNode(alt);
    } else {
      setAiFollowUpTopic({
        prompt: "Optimize journey",
        questionRecap: recap,
        reply: "I don't see another clear optimization opportunity in this journey right now.",
      });
      setAiFollowUpSeq((n) => n + 1);
    }
  };
  // "Create test" on the conversational ExperimentCard — builds the
  // Optimizer split node directly in the journey canvas (Existing Journey /
  // Test Journey), right after the trigger, wrapping the whole current
  // flow. Never Version A/B, never a separate version history.
  const handleCreateTestBranch = (config: TestBranchConfig) => {
    setFlow(buildOptimizerFlow(flow, config));
    setActiveTest({
      proposal: config.proposal,
      changeKind: config.changeKind,
      anchorStepId: config.anchorStepId,
      changeDescription: config.changeDescription,
      variantPercent: config.variantPercent,
      metric: config.metric,
    });
    // Closes co-marketer so the marketer lands straight on the canvas and
    // sees the new Optimizer node — the split it just asked for — rather
    // than staying inside the chat that built it.
    setAiChatOpen(false);
    toast.success("Test created — Main Journey and Test Journey are both live in the canvas");
  };

  // The goal-first conversation's own "yes, set it up" — same end state as
  // handleCreateTestBranch (an Optimizer/Split Action node with Main/Test
  // branches), but revealed one node at a time instead of pasted in whole,
  // while the co-marketer panel shows "Setting up your test journey…" for
  // exactly as long as the reveal takes.
  const buildTimeoutRef = useRef<number | null>(null);
  const beginTestBuildAnimation = (confirmation: {
    insight: NodeOptimizationInsight;
    anchorStepId: string;
    proposal: ExperimentProposal;
    variantPercent: number;
  }) => {
    const { insight, anchorStepId, proposal, variantPercent } = confirmation;
    const config: TestBranchConfig = {
      changeKind: insight.changeKind,
      changeDescription: insight.recommendedChange,
      waitHours: insight.suggestedNewHours,
      variantPercent,
      metric: proposal.metricOptions[0] ?? "Conversion rate",
      anchorStepId,
      proposal,
    };
    const completeFlow = buildOptimizerFlow(flow, config);
    const optimizerStep = completeFlow[0];
    const paths = optimizerStep.branches && "paths" in optimizerStep.branches ? optimizerStep.branches.paths : [];
    const mainPath = paths.find((p) => p.key === "existing");
    const testPath = paths.find((p) => p.key === "test");
    // Main Journey is shown complete and static from the start — only the
    // Test Journey branch builds progressively, node by node.
    const revealList = flattenForReveal(testPath?.steps ?? [], [
      { stepId: optimizerStep.id, branch: "test" },
    ]);
    const SKELETON_MS = 500;
    const GAP_MS = 400;
    const totalSeconds = Math.max(1, Math.round((revealList.length * (SKELETON_MS + GAP_MS)) / 1000));

    if (buildTimeoutRef.current) window.clearTimeout(buildTimeoutRef.current);
    setIsBuildingTest(true);
    setFlow([
      {
        ...optimizerStep,
        branches: {
          paths: [
            mainPath ?? { key: "existing", label: "Main Journey", percentage: 100 - variantPercent, steps: [] },
            {
              key: "test",
              label: testPath?.label ?? "Test Journey",
              percentage: testPath?.percentage ?? variantPercent,
              steps: [],
            },
          ],
        },
      },
    ]);
    setAiFollowUpTopic({
      prompt: "Yes, set up this test journey",
      reply: "",
      agentId: "journey-experiment-agent",
      skipAgentSwitchBanner: true,
      thinkingDurationSeconds: totalSeconds,
      thinkingLabel: "Setting up your test journey…",
    });
    setAiFollowUpSeq((n) => n + 1);

    let cursor = 0;
    const revealNext = () => {
      if (cursor >= revealList.length) {
        setIsBuildingTest(false);
        setActiveTest({
          proposal: config.proposal,
          changeKind: config.changeKind,
          anchorStepId: config.anchorStepId,
          changeDescription: config.changeDescription,
          variantPercent: config.variantPercent,
          metric: config.metric,
        });
        // Stays open on the confirmation screen — the marketer just watched
        // the test build here and should see it land, not get bounced to
        // the canvas.
        toast.success("Test created — Main Journey and Test Journey are both live in the canvas");
        return;
      }
      const { step: realStep, path, index } = revealList[cursor];
      const skeletonId = `__skeleton__-${cursor}`;
      setFlow((prev) =>
        insertStepAt(prev, path, index, {
          id: skeletonId,
          paletteNodeId: "__skeleton__",
          label: "",
          nodeLabel: "",
          icon: realStep.icon,
          tone: realStep.tone,
        }),
      );
      buildTimeoutRef.current = window.setTimeout(() => {
        setFlow((prev) =>
          insertStepAt(removeStepById(prev, skeletonId), path, index, {
            ...realStep,
            branches: emptyBranchesLike(realStep.branches),
          }),
        );
        cursor += 1;
        buildTimeoutRef.current = window.setTimeout(revealNext, GAP_MS);
      }, SKELETON_MS);
    };
    revealNext();
  };
  // "Test with more users" — updates the Optimizer's own split, in place,
  // rather than creating a second Optimizer.
  const handleUpdateTestSplit = (variantPercent: number) => {
    setFlow((prev) => {
      const optimizer = findOptimizerStep(prev);
      if (!optimizer) return prev;
      return updateStepById(prev, optimizer.id, (step) => {
        if (!step.branches || !("paths" in step.branches)) return step;
        return {
          ...step,
          branches: {
            paths: step.branches.paths.map((p) =>
              p.key === "test" ? { ...p, percentage: variantPercent } : { ...p, percentage: 100 - variantPercent },
            ),
          },
        };
      });
    });
    setActiveTest((prev) => (prev ? { ...prev, variantPercent } : prev));
    toast.success(`Test audience updated to ${variantPercent}%`);
  };
  // The other three post-test choices — all resolve the Optimizer node one
  // way or another, so the canvas always ends up a single plain flow again.
  const handlePostTestDecision = (decision: "make-main" | "keep-existing" | "test-another") => {
    const optimizer = findOptimizerStep(flow);
    if (!optimizer || !optimizer.branches || !("paths" in optimizer.branches)) return;
    const existing = optimizer.branches.paths.find((p) => p.key === "existing")!;
    const test = optimizer.branches.paths.find((p) => p.key === "test")!;

    if (decision === "make-main") {
      setFlow(test.steps);
      setActiveTest(null);
      // Same audible cue as a co-marketer reply finishing generation — the
      // merge is itself the result of that "Done — the test journey is now
      // your main journey" reply landing.
      playResponseCue();
      toast.success("Test Journey is now the main journey");
      return;
    }
    setFlow(existing.steps);
    if (decision === "keep-existing") {
      setActiveTest(null);
      toast.success("Kept the existing journey — the test has been removed");
      return;
    }
    // "test-another" — fresh analysis on top of the now-restored journey,
    // computed from `existing.steps` directly rather than re-reading `flow`
    // (which won't reflect the setFlow above until the next render).
    setActiveTest(null);
    toast.success("Kept the existing journey — looking for another opportunity");
    const proposal = buildExperimentProposal(existing.steps);
    setAiFollowUpTopic({
      prompt: "Optimize journey",
      reply: buildExperimentIntroReply(proposal),
      agentId: "journey-experiment-agent",
      reasoningSteps: JOURNEY_EXPERIMENT_REASONING_STEPS,
      experimentCard: proposal ? ({ proposal, changeKind: "reduce-wait" } satisfies ExperimentCardData) : undefined,
    });
    setAiFollowUpSeq((n) => n + 1);
  };
  // The goal-first conversation's own "Yes, merge as main journey" CTA —
  // same end state handlePostTestDecision("make-main") already gives the
  // ExperimentCard's own decision question (Test Journey's steps become the
  // whole flow — Main Journey and the Split Action node are both gone, so
  // the Trigger now runs straight into what used to be the test branch),
  // reused here rather than duplicated. Only adds a short confirmation
  // reply and marks the persisted session merged, so a later "Edit
  // journey" round trip never re-offers this merge or re-summarizes a test
  // that no longer exists.
  const handleMergeTestJourney = () => {
    handlePostTestDecision("make-main");
    markCartAbandonmentMerged();
    setAiFollowUpTopic({
      prompt: "Yes, merge as main journey",
      suppressPromptTurn: true,
      reply:
        "Done — the test journey is now your main journey. The previous main path and the Split Action node have been removed.",
      agentId: "journey-experiment-agent",
      skipAgentSwitchBanner: true,
      thinkingDurationSeconds: 2,
    });
    setAiFollowUpSeq((n) => n + 1);
  };
  // Recognizes a typed audit request, or a typed experiment/change request
  // (e.g. "test reducing the wait time to 2 hours"), in the docked
  // co-marketer thread and routes each to its own specialist agent via
  // ChatInterface's onBeforeSend — otherwise a typed message would fall
  // into ChatInterface's own generic scripted routing (CAMPAIGNS_FLOW)
  // instead of actually reasoning about this journey. Returns false for
  // anything else so normal sending proceeds.
  // The fixed illustrative goal this demo journey's Settings hasn't
  // actually been given (journeyGoal starts null) — the agent still speaks
  // as though one exists, per the scripted conversation, without writing it
  // into journeyGoal itself unless the marketer explicitly sets a new one.
  const EXISTING_JOURNEY_GOAL_TEXT = "increase purchases and improve conversion";
  // Once the Journey Goal question is settled (kept or changed), this is
  // "the next relevant question needed to analyze the journey" — the same
  // test-status/insight lookup handleExperimentJourney itself runs, just
  // folded into the same reply as the goal acknowledgment instead of a
  // separate turn, and never asking the marketer to define the goal again.
  // No `agentId` on any of these three replies — the "Switched to Journey
  // Optimization Agent" hand-off already played once, on the very first
  // "optimize my journey" message (see the `agentId` below); everything
  // from here runs as a continuation of that same conversation, not a
  // fresh hand-off, so it shouldn't replay that banner.
  const proceedToJourneyAnalysis = (userMessage: string, ackPrefix: string) => {
    setGoalStage("none");
    const optimizer = findOptimizerStep(flow);
    if (optimizer) {
      const paths = optimizer.branches && "paths" in optimizer.branches ? optimizer.branches.paths : [];
      const existing = paths.find((p) => p.key === "existing");
      const test = paths.find((p) => p.key === "test");
      setAiFollowUpTopic({
        prompt: userMessage,
        reply: [
          ackPrefix,
          "A test is already running on this journey.",
          existing && test ? `Main Journey — ${existing.percentage}% of users. Test Journey — ${test.percentage}% of users.` : "",
        ]
          .filter(Boolean)
          .join(" "),
      });
      setAiFollowUpSeq((n) => n + 1);
      return;
    }
    const target = findFirstNodeWithInsight(flow);
    if (target) {
      const insight = buildNodeOptimizationInsight(target);
      if (insight.hasInsight) {
        // The goal-first conversation's own richer reveal — a staged,
        // line-by-line write-up (see ChatInterface's replySegments) ending
        // in a live preview of the proposed flow, rather than the node
        // Sparkles button's plainer Problem/Cause card (NodeOptimizationInsightCard
        // is untouched — this is a separate, parallel presentation of the
        // same real, seeded insight).
        const proposedFlow = applyRecommendedChange(flow, insight, target);
        // Illustrative only (this is still the goal-first conversation's
        // proposal stage — no test has been asked for yet), same 5%
        // default the audience question offers as its own example, so the
        // "expand" preview shows a real Main/Test split rather than a
        // second, separately-invented mock.
        const previewProposal = buildProposalFromInsight(insight, target);
        const splitPreviewFlow = buildOptimizerFlow(flow, {
          changeKind: insight.changeKind,
          changeDescription: insight.recommendedChange,
          waitHours: insight.suggestedNewHours,
          variantPercent: 5,
          metric: previewProposal.metricOptions[0] ?? "Conversion rate",
          anchorStepId: target.id,
          proposal: previewProposal,
        });
        const opportunitySentence = `<p>${hi(
          insight.changeKind === "add-whatsapp" && insight.emailEngagementPct !== undefined
            ? `Your journey is currently driving ${insight.emailEngagementPct}% engagement through email, but only ${insight.purchaseConversionPct}% of users are converting to a purchase. One potential opportunity stands out: this audience is showing higher engagement on WhatsApp (${insight.whatsappEngagementPct}%) than on email (${insight.emailEngagementPct}%), while the current journey relies primarily on email.`
            : `${insight.problem} ${insight.cause}`,
        )}</p>`;
        const testDescription =
          insight.changeKind === "add-whatsapp"
            ? "Replace the first communication channel — email — with a WhatsApp message featuring the abandoned product's rating/review."
            : insight.recommendedChange;
        setAiFollowUpTopic({
          prompt: userMessage,
          agentId: "journey-experiment-agent",
          skipAgentSwitchBanner: true,
          thinkingDurationSeconds: 6,
          replySegments: [
            "I found an opportunity to improve purchase conversion.",
            opportunitySentence,
            `<div class="chat-section-divider"></div><p><strong>What I'd test:</strong><br/>${hi(testDescription)}</p>`,
            `<div class="chat-section-divider"></div><p><strong>Why this could help:</strong><br/>${hi(insight.whyTest)}</p>`,
          ],
          journeyProposalCard: { proposedFlow, splitPreviewFlow, triggerLabel, anchorStepId: target.id, insight },
          replyOptions: [
            { label: "Test this optimization", value: "Test this optimization" },
            { label: "Make it my primary journey", value: "Make it my primary journey" },
          ],
        });
        setPendingProposal({ proposedFlow, splitPreviewFlow, triggerLabel, anchorStepId: target.id, insight });
        setAiFollowUpSeq((n) => n + 1);
        return;
      }
      setAiFollowUpTopic({
        prompt: userMessage,
        reply: `${ackPrefix} I looked at "${target.nodeLabel}" for an optimization opportunity.`,
      });
      setAiFollowUpSeq((n) => n + 1);
      return;
    }
    setAiFollowUpTopic({
      prompt: userMessage,
      reply: `${ackPrefix} I looked through this journey and didn't find a clear optimization opportunity right now.`,
    });
    setAiFollowUpSeq((n) => n + 1);
  };

  // The goal-first proposal card's question, answered by typing rather than
  // a button (see pendingProposal/handleCoMarketerBeforeSend) — "test",
  // "make it my primary journey", or "explore another opportunity". Only
  // this handler ever touches the live flow.
  const handleRespondJourneyProposal = (
    response: JourneyProposalResponse,
    data: JourneyProposalCardData,
    userMessage: string,
  ) => {
    if (response === "make-primary") {
      const step = findStepById(flow, data.anchorStepId) ?? undefined;
      if (!step) return;
      setFlow(applyRecommendedChange(flow, data.insight, step));
      setAiFollowUpTopic({
        prompt: userMessage,
        reply: "Done — this optimization is now your primary journey.",
      });
      setAiFollowUpSeq((n) => n + 1);
      return;
    }
    if (response === "test") {
      // Doesn't create anything yet — first asks what slice of the
      // audience to test with, conversationally (see
      // handleAudienceTestPercent for what happens once that's answered).
      const step = findStepById(flow, data.anchorStepId) ?? undefined;
      const proposal = buildProposalFromInsight(data.insight, step);
      setPendingAudienceTest({ insight: data.insight, anchorStepId: data.anchorStepId, proposal });
      const exampleUsers = Math.round(proposal.totalAudience * 0.05);
      setAiFollowUpTopic({
        prompt: userMessage,
        agentId: "journey-experiment-agent",
        skipAgentSwitchBanner: true,
        thinkingDurationSeconds: 6,
        replySegments: [
          `Got it. I can test this optimization against your current journey. You currently have ${proposal.totalAudience.toLocaleString()} potential users in this audience — for example, 5% would be ${exampleUsers.toLocaleString()} users. How much of the audience would you like to expose to the new test?`,
        ],
        audienceTestCard: { totalAudience: proposal.totalAudience },
      });
      setAiFollowUpSeq((n) => n + 1);
      return;
    }
    // "explore-another" — same "look past this one node" search the node
    // insight card's own third option uses.
    const alt = findFirstNodeWithInsight(flow, data.anchorStepId);
    if (alt) {
      handleOptimizeNode(alt);
      return;
    }
    setAiFollowUpTopic({
      prompt: userMessage,
      reply: "I don't see another clear optimization opportunity in this journey right now.",
    });
    setAiFollowUpSeq((n) => n + 1);
  };

  // The audience-percentage question's own answer — confirms the split in
  // real numbers, then a plain-language summary of what would be created,
  // ending with a typed-yes/no question. Nothing is created on the canvas
  // yet; that's a later step in this same conversation.
  const handleAudienceTestPercent = (percent: number) => {
    if (!pendingAudienceTest) return;
    const { insight, proposal, anchorStepId } = pendingAudienceTest;
    setPendingAudienceTest(null);
    const pct = Math.min(99, Math.max(1, percent));
    const variantUsers = Math.round((proposal.totalAudience * pct) / 100);
    const controlUsers = proposal.totalAudience - variantUsers;
    const controlPct = 100 - pct;
    const testChangeSummary =
      insight.changeKind === "add-whatsapp"
        ? "WhatsApp + product rating/review touchpoint"
        : insight.recommendedChange;
    setAiFollowUpTopic({
      prompt: `${pct}%`,
      agentId: "journey-experiment-agent",
      skipAgentSwitchBanner: true,
      thinkingDurationSeconds: 4,
      replySegments: [
        `<p>${hi(
          `Understood. You'll run the test with ${pct}% of your audience — ${variantUsers.toLocaleString()} users out of ${proposal.totalAudience.toLocaleString()}. The remaining ${controlPct}% (${controlUsers.toLocaleString()} users) will continue through your current journey.`,
        )}</p>`,
        hi(
          `<p><strong>Here's what I'll set up:</strong></p>` +
            `<div class="chat-section-divider"></div>` +
            `<p><strong>Current journey:</strong> Your existing journey will remain unchanged for ${controlPct}% of users (${controlUsers.toLocaleString()}).</p>` +
            `<div class="chat-section-divider"></div>` +
            `<p><strong>Test journey:</strong> ${pct}% of users (${variantUsers.toLocaleString()}) will enter the optimized version with the new ${testChangeSummary}.</p>` +
            `<div class="chat-section-divider"></div>` +
            `<p><strong>Goal:</strong> Compare purchase conversion between the current journey and the optimized journey.</p>` +
            `<p>No changes will be made to the existing journey until you confirm the test setup.</p>`,
        ),
        "Would you like me to set up this test journey with this current configuration?",
      ],
      replyOptions: [
        { label: "Yes, set up this test journey", value: "Yes, set up this test journey" },
      ],
    });
    setPendingTestConfirmation({ insight, anchorStepId, proposal, variantPercent: pct });
    setAiFollowUpSeq((n) => n + 1);
  };

  const handleCoMarketerBeforeSend = (message: string): boolean => {
    // The final "set up this test?" confirmation — checked first since
    // it's the latest stage this conversation can be in.
    if (pendingTestConfirmation) {
      const confirmation = pendingTestConfirmation;
      setPendingTestConfirmation(null);
      if (/\b(no|not|don't|dont|cancel|stop)\b/i.test(message)) {
        setAiFollowUpTopic({
          prompt: message,
          reply: "No problem — I haven't changed anything. Let me know if you'd like to adjust the setup or try something else.",
        });
        setAiFollowUpSeq((n) => n + 1);
        return true;
      }
      beginTestBuildAnimation(confirmation);
      return true;
    }
    // The journey proposal card's own question has no buttons — whatever
    // was just typed answers it. Checked first, same reasoning as
    // goalStage below.
    if (pendingProposal) {
      const data = pendingProposal;
      setPendingProposal(null);
      const lower = message.toLowerCase();
      const response: JourneyProposalResponse = /primary|main journey/.test(lower)
        ? "make-primary"
        : /explore|another|different/.test(lower)
          ? "explore-another"
          : "test";
      handleRespondJourneyProposal(response, data, message);
      return true;
    }
    // A goal-first conversation already in progress — whatever was just
    // typed answers THAT question, regardless of what it says, rather than
    // falling through to audit/experiment keyword matching below.
    if (goalStage === "awaiting-keep-or-change") {
      if (/\b(yes|change|different|update|new goal)\b/i.test(message)) {
        setGoalStage("awaiting-new-goal");
        setAiFollowUpTopic({
          prompt: message,
          reply: "Sure — what would you like the new Journey Goal to be?",
        });
        setAiFollowUpSeq((n) => n + 1);
        return true;
      }
      proceedToJourneyAnalysis(message, "Got it — I'll keep your existing Journey Goal.");
      return true;
    }
    if (goalStage === "awaiting-new-goal") {
      setJourneyGoal(message);
      proceedToJourneyAnalysis(message, `Got it — I've updated your Journey Goal to "${message}".`);
      return true;
    }
    if (/optimi[sz]e/i.test(message)) {
      setGoalStage("awaiting-keep-or-change");
      setAiFollowUpTopic({
        prompt: message,
        reply: `Your current Journey Goal is to ${EXISTING_JOURNEY_GOAL_TEXT}. I'll use this goal to guide my analysis and identify potential opportunities within the journey.\n\nShould I continue with this goal, or would you like to update it?`,
        agentId: "journey-experiment-agent",
        reasoningSteps: JOURNEY_EXPERIMENT_REASONING_STEPS,
        replyOptions: [
          { label: "Continue with this goal", value: "Continue with this goal" },
          { label: "Update the goal", value: "Update the goal" },
        ],
      });
      setAiFollowUpSeq((n) => n + 1);
      return true;
    }
    if (/audit/i.test(message)) {
      setAiFollowUpTopic({
        prompt: message,
        reply: buildJourneyAuditReply(flow, triggerLabel),
        agentId: "journey-review-agent",
        reasoningSteps: JOURNEY_REVIEW_REASONING_STEPS,
      });
      setAiFollowUpSeq((n) => n + 1);
      return true;
    }
    if (/experiment|\btest\b|reduce|shorten|a\/?b test/i.test(message) && hasExperimentableWait(flow)) {
      const proposal = buildExperimentProposal(flow, parseRequestedHours(message) ?? undefined);
      setAiFollowUpTopic({
        prompt: message,
        reply: buildExperimentIntroReply(proposal),
        agentId: "journey-experiment-agent",
        reasoningSteps: JOURNEY_EXPERIMENT_REASONING_STEPS,
        experimentCard: proposal ? ({ proposal, changeKind: "reduce-wait" } satisfies ExperimentCardData) : undefined,
      });
      setAiFollowUpSeq((n) => n + 1);
      return true;
    }
    return false;
  };
  // The bottom bar's "Optimize journey" pill — opens co-marketer and feeds
  // "Optimize journey" straight through handleCoMarketerBeforeSend, the
  // exact function a typed "I want to optimize my journey" goes through, so
  // this button reproduces that identical goal-first conversation (and
  // everything after it, up through the eventual merge) rather than a
  // shortcut of its own.
  const handleOptimizeJourneyButton = () => {
    handleOpenCoMarketer();
    handleCoMarketerBeforeSend("Optimize journey");
  };
  // The user finished the question card (answered or skipped every
  // question) — resolves the real channel from those answers, then appends
  // the script's summary line as a genuine turn onto the already-open
  // thread.
  const handleAIQuestionsComplete = (answers: (string | null)[]) => {
    if (!aiScript) return;
    setAiPaletteNodeId(paletteNodeIdForAnswers(aiScript, answers));
    setAiAnswers(answers);
    setAiStage("channelPicked");
    const prompt = answers.filter((a): a is string => !!a).join(" · ") || "Skipped";
    setAiFollowUpTopic({ prompt, reply: aiScript.summaryReply });
    setAiFollowUpSeq((n) => n + 1);
  };
  // "Create journey" — pastes the scripted trigger + Wait/action steps onto
  // the canvas, exactly like a template's "Use template" does.
  const handleCreateAIJourney = () => {
    if (!aiScript || !aiPaletteNodeId) return;
    const { triggerLabel: resolvedTriggerLabel, steps } = buildAIGeneratedFlowSteps(
      aiScript,
      aiPaletteNodeId,
      aiAnswers,
    );
    setTriggerLabel(resolvedTriggerLabel);
    setFlow(steps);
    setAiStage("created");
    setAiFollowUpTopic({
      prompt: "Create journey",
      reply: "Done — I've added it to your journey canvas. You can keep editing it from here.",
    });
    setAiFollowUpSeq((n) => n + 1);
  };
  const handleSaveConfiguredNode = (nodeLabel: string, settings: StepSettings) => {
    if (!configuringNode) return;
    setFlow((prev) =>
      updateStepById(prev, configuringNode.stepId, (step) => {
        const next: FlowStep = { ...step, nodeLabel, settings };
        // The Audience Split agent gets its 4 fixed output paths the moment
        // it's picked — only if it doesn't already have them, so re-saving
        // an already-split node (e.g. just to switch to a different agent —
        // not that switching away from Audience Split is exposed today)
        // never resets whatever's already built inside each path.
        if (configuringNode.paletteNodeId === "agent-node") {
          const agentSettings = settings as AgentNodeSetting;
          if (agentSettings.agentId === AUDIENCE_SPLIT_AGENT_ID && !next.branches) {
            next.branches = { paths: buildDefaultSplitPaths() };
          }
          // The Connector agent's card shows its own kind above the
          // task-specific label ("Connector Agent" / "Get loyalty points…"),
          // unlike every other node's single-line card — see kindLabel on
          // FlowStep and AddedNodeCard in JourneyCanvas.tsx.
          next.kindLabel = agentSettings.agentId === CONNECTOR_AGENT_ID ? "Connector Agent" : undefined;
        }
        return next;
      }),
    );
    closeNodeSettings();
  };
  // The one place a node's settings panel actually closes — Save above,
  // Cancel/the panel's own X, or the AI chat reclaiming this column all
  // route through this, so the rule is never just "hide the panel" but
  // always all three together: close the panel, clear the canvas
  // selection, and collapse the bottom toolbar back to its bare "Add"
  // state. Without deselecting, the toolbar would stay expanded
  // (Copy/Move/Delete) for a node whose settings aren't open anymore.
  // Applies to every node type (Email, Condition, Agent, Connector, …) and
  // both the scratch and AI-built entry flows, since they all close through
  // this one handler.
  const closeNodeSettings = () => {
    setConfiguringNode(null);
    setNodeDrawerVisible(false);
    setSelectedStepId(null);
  };
  // Selecting a node (clicking its card) does two things at once: it becomes
  // the bottom toolbar's target (Add/Copy/Move/Delete), and — only for node
  // types with a real config screen — its settings panel opens, exactly like
  // before. Non-configurable nodes are now selectable too (for the toolbar),
  // they just don't also open a panel.
  const handleSelectNode = (step: FlowStep) => {
    // The trigger's own drawer and a node's settings panel share the same
    // right-hand column and never both make sense at once — without this,
    // the node drawer below is guarded by `!showTriggerDrawer` and simply
    // wouldn't render, silently swallowing the click while the trigger
    // panel stayed open. Closing it here means any trigger→node click
    // always swaps straight to that node's own panel, never leaves both
    // (or neither) open.
    setShowTriggerDrawer(false);
    setSettingsOpen(false);
    setShortcutsOpen(false);
    setSelectedStepId(step.id);
    if (findPaletteNode(step.paletteNodeId)?.requiresConfig) {
      // The sidebar may have been hidden (via its own X) since this node was
      // last configured — always bring it back so reopening a node's
      // settings is never a dead click.
      setNodeDrawerVisible(true);
      setConfiguringNode({ stepId: step.id, paletteNodeId: step.paletteNodeId, initial: step.settings });
    }
  };
  // Clicking empty canvas deselects — the toolbar collapses back to just
  // "Add", and any open config panel for the (now former) selection closes.
  const handleDeselectNode = () => {
    setSelectedStepId(null);
    setConfiguringNode(null);
  };
  const handleRemoveNode = (id: string) => {
    setFlow((prev) => removeStepById(prev, id));
  };
  const handleDeleteSelected = (id: string) => {
    handleRemoveNode(id);
    setSelectedStepId(null);
    setConfiguringNode(null);
  };
  // Deep-clones a step and every nested step in its branches with fresh
  // ids, so a copy never collides with the original in React keys or the
  // tree lookups (findStepById etc). Handles both branch shapes — a split
  // step's own path `key`s are reused as-is (they only need to be unique
  // among sibling paths of the same step, and the clone is a different step).
  const cloneStepDeep = (step: FlowStep): FlowStep => {
    let branches: FlowStep["branches"];
    if (step.branches) {
      branches =
        "paths" in step.branches
          ? { paths: step.branches.paths.map((p) => ({ ...p, steps: p.steps.map(cloneStepDeep) })) }
          : { yes: step.branches.yes.map(cloneStepDeep), no: step.branches.no.map(cloneStepDeep) };
    }
    return { ...step, id: `${step.paletteNodeId}-${stepSeq++}`, branches };
  };
  // ⌘C (or the toolbar's Copy) no longer duplicates a node in place —
  // instead it copies the node to a clipboard and arms every gap in every
  // chain/branch as a paste target (see JourneyCanvas's pasteArmed/
  // onGapHover and .jc-gap.paste-target). The actual duplicate only lands
  // once the user hovers a specific gap and presses ⌘V there — see
  // handlePasteAtGap below. This is a snapshot: later edits to the
  // original step don't change what a later paste produces.
  const [clipboardStep, setClipboardStep] = useState<FlowStep | null>(null);
  // The gap currently under the mouse while pasteArmed — read (not
  // subscribed to) by the ⌘V keydown handler, so hovering doesn't need to
  // re-render anything on every mouse move.
  const hoveredGapRef = useRef<{ path: FlowPath; index: number } | null>(null);
  const handleCopyNode = (id: string) => {
    const original = findStepById(flow, id);
    if (!original) return;
    setClipboardStep(original);
  };
  const handlePasteAtGap = (path: FlowPath, index: number) => {
    if (!clipboardStep) return;
    const clone = cloneStepDeep(clipboardStep);
    setFlow((prev) => insertStepAt(prev, path, index, clone));
  };
  // Relocates the selected node to a gap the user clicked while "Move" was
  // armed (JourneyCanvas owns the armed/disarmed UI state; this just does
  // the actual tree surgery once a target gap is picked).
  const handleMoveNode = (id: string, targetPath: FlowPath, targetIndex: number) => {
    const step = findStepById(flow, id);
    const location = findStepLocation(flow, id);
    if (!step || !location) return;
    // Dropping a step into its own (former) branch would create a cycle —
    // silently ignore rather than corrupt the tree.
    if (pathIntersectsIds(targetPath, collectStepAndDescendantIds(step))) return;
    // The target gap's index was computed against the tree BEFORE removal —
    // if the step is moving within the same chain and was positioned before
    // the target, removing it shifts everything after it down by one.
    const adjustedIndex =
      pathsEqual(location.path, targetPath) && location.index < targetIndex ? targetIndex - 1 : targetIndex;
    setFlow((prev) => insertStepAt(removeStepById(prev, id), targetPath, adjustedIndex, step));
  };

  // DE-activation loader: tapping "Activate journey" plays the rocket launch
  // animation for a beat, then lands the user on the journeys homepage.
  const [activating, setActivating] = useState(false);
  const [activateStep, setActivateStep] = useState(0);
  const activateTimer = useRef<number>();

  useEffect(() => () => window.clearTimeout(activateTimer.current), []);

  useEffect(() => {
    if (!activating) return;
    setActivateStep(0);
    const interval = window.setInterval(() => {
      setActivateStep((s) => Math.min(s + 1, ACTIVATION_PHASES.length - 1));
    }, ACTIVATE_MS / ACTIVATION_PHASES.length);
    return () => window.clearInterval(interval);
  }, [activating]);

  const handleActivate = (name: string) => {
    setActivating(true);
    activateTimer.current = window.setTimeout(() => {
      navigate("/journeys", { state: { activatedJourney: { name, generatedByAI } } });
    }, ACTIVATE_MS);
  };

  // Keyboard shortcuts — see KeyboardShortcutsPanel for the full reference
  // list. Only the shortcuts below have a real, existing action behind them
  // (the same ones their buttons already trigger via a click); the rest of
  // the list documents shortcuts for things this canvas doesn't have yet and
  // is intentionally left inert here.
  useEffect(() => {
    const isTypingTarget = (target: EventTarget | null) => {
      if (!(target instanceof HTMLElement)) return false;
      return target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable;
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (isTypingTarget(e.target) || activating || aiModalOpen || settingsOpen) return;
      const key = e.key.toLowerCase();
      const mod = e.metaKey || e.ctrlKey;

      if (!mod && !e.altKey && key === "r") {
        // Mirrors the header's own "Publish journey" gate — same
        // journeyDates/journeyGoal check as publishReady below, so the R
        // shortcut can't activate what the disabled button itself blocks.
        if (journeyDates !== null && journeyGoal !== null) {
          e.preventDefault();
          handleActivate(journeyName);
        }
      } else if (!mod && !e.altKey && key === "s") {
        e.preventDefault();
        handleOpenSettings();
      } else if (!mod && !e.altKey && key === "a") {
        if (isScratchFlow && triggerLabel !== null && !showTriggerDrawer) {
          e.preventDefault();
          handleOpenAddDrawer();
        }
      } else if (mod && key === "c") {
        if (selectedStepId) {
          e.preventDefault();
          handleCopyNode(selectedStepId);
        }
      } else if (mod && key === "v") {
        // Only lands where the mouse actually is — hovering a gap is what
        // arms it (see JourneyCanvas's onGapHover/.jc-gap.paste-target), so
        // a ⌘V with the mouse nowhere near a gap does nothing rather than
        // guessing a fallback spot.
        const target = hoveredGapRef.current;
        if (clipboardStep && target) {
          e.preventDefault();
          handlePasteAtGap(target.path, target.index);
        }
      } else if (key === "escape") {
        if (clipboardStep) setClipboardStep(null);
      } else if (!mod && key === "backspace") {
        if (selectedStepId) {
          e.preventDefault();
          handleDeleteSelected(selectedStepId);
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [
    activating,
    aiModalOpen,
    settingsOpen,
    isScratchFlow,
    triggerLabel,
    showTriggerDrawer,
    journeyName,
    journeyDates,
    journeyGoal,
    selectedStepId,
    clipboardStep,
    handleActivate,
    handleOpenSettings,
    handleOpenAddDrawer,
    handleCopyNode,
    handlePasteAtGap,
    handleDeleteSelected,
  ]);

  // Every Connector Agent step's chosen output fields, deduped — offered to
  // Check Attribute/Condition config as extra checkable attributes (e.g.
  // "loyalty_points"), so a Connector's retrieved value can drive a Yes/No
  // branch further down the journey. Read from the whole tree, not just the
  // root chain, since a Connector step can sit inside any branch.
  const connectorOutputFields = useMemo(() => {
    const fields = new Set<string>();
    for (const step of flattenFlowSteps(flow)) {
      if (step.paletteNodeId !== "agent-node") continue;
      const agentSettings = step.settings as AgentNodeSetting | undefined;
      if (agentSettings?.agentId === CONNECTOR_AGENT_ID) {
        agentSettings.connector?.selectedFields.forEach((f) => fields.add(f));
      }
    }
    return Array.from(fields);
  }, [flow]);

  // The current trigger's real payload fields (e.g. Cart Abandoned →
  // cart_value, product_category) — only populated for a from-scratch
  // "Activity" trigger (see triggerActivityIds above). Offered to the
  // Email node's "User activity payload" personalize menu.
  const triggerPayloadAttributes = useMemo(() => {
    if (!triggerActivityIds || triggerActivityIds.length === 0) return [];
    const activities = triggerActivityIds
      .map((id) => ACTIVITY_DEFINITIONS.find((a) => a.id === id))
      .filter((a): a is (typeof ACTIVITY_DEFINITIONS)[number] => !!a);
    return unionAttributes(activities);
  }, [triggerActivityIds]);

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-[#F4F8FF] p-2">
      <JourneyBuilderHeader
        name={journeyName}
        created={hasJourney}
        generatedByAI={generatedByAI}
        journeyId={hasJourney ? journeyId : undefined}
        dates={journeyDates}
        publishReady={journeyDates !== null && journeyGoal !== null}
        onRenameJourney={setJourneyName}
        onActivate={handleActivate}
        onEditObjective={() => setAiModalOpen(true)}
        onOpenSettings={handleOpenSettings}
        onOpenShortcuts={() => {
          closeNodeSettings();
          setShowTriggerDrawer(false);
          setSettingsOpen(false);
          setShortcutsOpen(true);
        }}
        onOpenCoMarketer={handleOpenCoMarketerButton}
      />

      <div className="mt-2 flex min-h-0 flex-1 gap-2">
        {/* Scratch flow never shows the left palette — its node library
            lives in the right-side drawers instead. Template/AI journeys
            keep the palette exactly as before. */}
        {!isScratchFlow && <JourneyPalette />}

        <div className="min-w-0 flex-1">
          <JourneyCanvas
            hasJourney={hasJourney}
            triggerOnly={isScratchFlow}
            triggerLabel={triggerLabel}
            triggerActive={showTriggerDrawer}
            aiGenerating={aiChatOpen && aiStage !== "created"}
            onChooseTrigger={() => {
              closeNodeSettings();
              setSettingsOpen(false);
              setShortcutsOpen(false);
              setShowTriggerDrawer(true);
            }}
            onClickTrigger={() => {
              // Symmetric with handleSelectNode below: clicking the trigger
              // while a node's settings panel is open swaps straight to the
              // trigger drawer instead of leaving the node panel stuck open
              // underneath it (same shared-column, only-one-at-a-time rule).
              closeNodeSettings();
              setSettingsOpen(false);
              setShortcutsOpen(false);
              setShowTriggerDrawer(true);
            }}
            onCanvasClick={() => {
              setShowTriggerDrawer(false);
              // Any open side drawer (trigger picker above, or the "Add to
              // journey" / node-settings drawer here) closes on a plain
              // click on empty canvas.
              setNodeDrawerVisible(false);
              handleDeselectNode();
              setClipboardStep(null);
            }}
            flow={flow}
            onInsertNode={handleInsertNode}
            onRemoveNode={handleRemoveNode}
            onClickNode={isBuildingTest ? undefined : handleSelectNode}
            // Read-only while the test journey is being progressively
            // revealed (beginTestBuildAnimation) — no add/edit affordances
            // to interrupt mid-build, same as the report page's own
            // read-only embedding.
            showActions={!isBuildingTest}
            selectedStepId={selectedStepId}
            onCopyNode={handleCopyNode}
            onDeleteNode={handleDeleteSelected}
            onMoveNode={handleMoveNode}
            pasteArmed={clipboardStep !== null}
            onGapHover={(target) => {
              hoveredGapRef.current = target;
            }}
            onOpenDrawer={handleOpenAddDrawer}
            onAuditFlow={handleAuditFlow}
            onShowAnalytics={handleShowAnalytics}
            onExperiment={() => handleExperimentJourney()}
            onOptimizeJourney={handleOptimizeJourneyButton}
          />
        </div>

        {isScratchFlow && !aiChatOpen && (
          // Always mounted (not conditionally rendered) so its own
          // mount/enter/exit state machine can play the slide-out animation
          // on close instead of being yanked out of the tree immediately.
          <JourneyTriggerDrawer
            open={showTriggerDrawer}
            // The journey already exists (named) by the time this can open,
            // so dismissing it just returns to the "Choose trigger" CTA
            // rather than discarding the journey.
            onClose={() => setShowTriggerDrawer(false)}
            onSelect={(trigger) => {
              setTriggerLabel(trigger.nodeLabel);
              setTriggerActivityIds(trigger.activityIds ?? null);
              setShowTriggerDrawer(false);
              // Only here — finishing the trigger picker — auto-opens the
              // "Add to journey" node drawer; nowhere else force-opens it
              // (e.g. onCanvasClick/onClose still just hide it), so it
              // stays a plain toggle everywhere but this one entry point.
              setNodeDrawerVisible(true);
            }}
          />
        )}

        {isScratchFlow &&
          // Once the co-marketer chat has placed a journey on canvas, its
          // nodes stay fully editable — clicking a configurable one (e.g.
          // the generated email step) opens its settings here even while
          // the chat is still open, the same way it always does; the chat
          // only owns this space for as long as no node's settings are open.
          (!aiChatOpen || configuringNode !== null) &&
          !showTriggerDrawer &&
          triggerLabel !== null &&
          nodeDrawerVisible && (
            <JourneyNodeDrawer
              configuringNodeId={configuringNode?.paletteNodeId ?? null}
              configuringStepId={configuringNode?.stepId ?? null}
              configuringInitial={configuringNode?.initial}
              onCancelConfigure={closeNodeSettings}
              onSaveConfigure={handleSaveConfiguredNode}
              onClose={() => setNodeDrawerVisible(false)}
              connectorFields={connectorOutputFields}
              triggerPayloadAttributes={triggerPayloadAttributes}
            />
          )}

        {aiChatOpen && configuringNode === null && (
          // The co-marketer panel — same docked ChatInterface + SeededTopic
          // mechanism as the Email Campaign flow's right-side "Ask
          // co-marketer" panel, seeded with the prompt picked on the Create
          // Journey page. Replaces the trigger picker/drawer above for the
          // life of this session; closing it (its own header control) falls
          // back to the normal scratch-flow drawers.
          <div className="flex h-full w-[474px] shrink-0 flex-col gap-3 overflow-hidden py-3">
            <div ref={aiChatColumnRef} className="relative min-h-0 flex-1">
              <ChatInterface
                key="ai-journey-chat"
                initialExpanded={false}
                docked
                conversationVariant="campaigns"
                initialTopic={aiInitialTopic}
                followUpTopic={aiFollowUpTopic}
                followUpSeq={aiFollowUpSeq}
                enabledAgents={aiChatEnabledAgents}
                setEnabledAgents={setAiChatEnabledAgents}
                onBeforeSend={handleCoMarketerBeforeSend}
                onCreateTest={handleCreateTestBranch}
                onUpdateTestSplit={handleUpdateTestSplit}
                onPostTestDecision={handlePostTestDecision}
                onRespondNodeInsight={handleRespondNodeInsight}
                onRespondAudienceTest={handleAudienceTestPercent}
                onMergeTestJourney={handleMergeTestJourney}
                initialMessages={isCartAbandonmentOngoing ? getCartAbandonmentSession().chatMessages : undefined}
                onMessagesChange={
                  isCartAbandonmentOngoing ? (msgs) => saveCartAbandonmentChatMessages(msgs) : undefined
                }
                onCloseInterface={() => {
                  aiChatSeededOnceRef.current = true;
                  setAiChatOpen(false);
                  // nodeDrawerVisible defaults true (it's the scratch-flow
                  // drawer's own default) but never got a chance to turn
                  // false while the AI chat owned this column — without
                  // this, closing the chat immediately reveals "Add to
                  // journey" behind it instead of leaving a clean canvas.
                  setNodeDrawerVisible(false);
                }}
              />
              {aiScript && aiStage === "seeded" && aiNextStepRevealed && questionCardMetrics && (
                // The co-marketer's actual question(s) — a structured,
                // paginated card (bold question, numbered options, Skip)
                // instead of plain chat bubbles — stuck to the top of the
                // chat's own composer, exactly matching its width/position
                // (see questionCardMetrics above) so it reads as part of the
                // panel rather than a separate, misaligned block.
                <CoMarketerQuestionCard
                  id="ai-question-card"
                  style={{
                    position: "absolute",
                    bottom: questionCardMetrics.bottom,
                    left: questionCardMetrics.left,
                    width: questionCardMetrics.width,
                    maxHeight: questionCardMetrics.maxHeight,
                  }}
                  questions={aiScript.questions}
                  onComplete={handleAIQuestionsComplete}
                  onClose={() => {
                    aiChatSeededOnceRef.current = true;
                    setAiChatOpen(false);
                  }}
                />
              )}
              {aiScript && aiStage === "channelPicked" && aiNextStepRevealed && questionCardMetrics && (
                // Same absolute-positioning technique as the question card
                // above — stuck to the composer's own top edge, inside the
                // chat panel, instead of floating in the gray canvas gutter
                // below it.
                <div
                  className="z-20"
                  style={{
                    position: "absolute",
                    bottom: questionCardMetrics.bottom,
                    left: questionCardMetrics.left,
                  }}
                >
                  <button
                    type="button"
                    onClick={handleCreateAIJourney}
                    className="dc-btn dc-btn-primary w-fit max-w-full shadow-[0_4px_16px_rgba(23,23,58,0.08)]"
                  >
                    <CornerDownRight className="h-4 w-4 shrink-0" strokeWidth={1.75} />
                    <span className="font-manrope text-[13px] leading-[18px]">Create journey</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {shortcutsOpen && <KeyboardShortcutsPanel onClose={() => setShortcutsOpen(false)} />}

        {settingsOpen && (
          <JourneySettingsDrawer
            initial={journeyDates}
            initialGoal={journeyGoal}
            onClose={() => setSettingsOpen(false)}
            onSave={(dates, goal) => {
              setJourneyDates(dates);
              setJourneyGoal(goal);
            }}
          />
        )}

      </div>

      <JourneyAIModal
        open={aiModalOpen}
        // Closing while a journey already exists (re-editing the objective) just
        // dismisses the drawer; closing during initial creation cancels out.
        onClose={() => (hasJourney ? setAiModalOpen(false) : navigate("/journeys"))}
        onGenerated={() => {
          setAiModalOpen(false);
          setHasJourney(true);
          setGeneratedByAI(true);
          toast.success("Journey generated successfully via AI");
        }}
      />

      {activating && (
        <div className="fixed inset-0 z-[110] grid place-items-center bg-[#17173A]/30 p-6">
          <div className="flex w-[440px] max-w-[92vw] flex-col items-center rounded-2xl bg-white px-10 py-14 text-center shadow-[0_24px_60px_rgba(23,23,58,0.22)]">
            <DotLottieReact src={ROCKET_LOTTIE} autoplay loop className="h-[140px] w-[140px]" />
            <h2 className="mt-4 font-manrope text-[20px] font-bold leading-tight text-[#17173A]">
              Activating your journey
            </h2>
            <p
              key={activateStep}
              className="mt-2 font-manrope text-[13px] leading-[19px] text-[#6F6F8D] duration-300 animate-in fade-in"
            >
              {ACTIVATION_PHASES[activateStep]}…
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
