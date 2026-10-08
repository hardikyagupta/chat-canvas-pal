import type { FlowStep } from "./journeyFlowTree";
import type { TimeDelaySetting } from "./journeyTimeDelay.data";
import { TIMEZONE_LABELS } from "./journeyTimeDelay.data";
import type { EmailSetting } from "./journeyEmail.data";
import { EMAIL_NODE_TEMPLATES } from "./journeyEmail.data";
import type { SmsSetting } from "./journeySms.data";
import type { ConditionSetting } from "./journeyCondition.data";
import type { AgentNodeSetting } from "./AgentNodeConfig";
import { ACTIVITY_DEFINITIONS } from "./journeyActivities.data";
import type { WaitForEventSetting } from "./journeyWaitForEvent.data";

/** Tone → the plain-English category shown next to a node's own type name
 *  in its hover tooltip, e.g. "Email · Action". */
const TONE_CATEGORY: Record<string, string> = {
  action: "Action",
  condition: "Condition",
  flow: "Flow control",
  agent: "Agent",
};

export interface NodeTooltipInfo {
  /** e.g. "Email · Action", "Connector Agent". */
  title: string;
  /** Everything else worth knowing at a glance — always includes the node's
   *  own task sentence (the same one on the card, in case it's truncated
   *  there), plus whatever its saved settings add beyond that. */
  lines: string[];
}

/** Whatever's genuinely useful to know about a canvas node without opening
 *  its settings — its type, its task sentence in full (cards can truncate
 *  a long one), and the parts of its saved config that sentence doesn't
 *  already say (a template's subject line, a condition's rule count, a
 *  connector's method/URL, …). Works for every node type, configured or
 *  not — a node with no settings screen (Web Push, Split Action, …) still
 *  gets its type and task sentence. */
export function getNodeTooltipInfo(step: FlowStep): NodeTooltipInfo {
  const category = TONE_CATEGORY[step.tone] ?? "Step";
  const title = step.kindLabel ? step.kindLabel : `${step.label} · ${category}`;
  const lines: string[] = [step.nodeLabel];

  switch (step.paletteNodeId) {
    case "time-delay": {
      const s = step.settings as TimeDelaySetting | undefined;
      if (s && (s.mode === "specific_datetime" || s.mode === "specific_time_of_day")) {
        lines.push(`Timezone: ${TIMEZONE_LABELS[s.timezone]}`);
      }
      break;
    }
    case "email": {
      const s = step.settings as EmailSetting | undefined;
      if (s?.templateId != null) {
        const template = EMAIL_NODE_TEMPLATES.find((t) => t.id === s.templateId);
        if (template) lines.push(`Template: ${template.name}`);
      }
      if (s?.subject) lines.push(`Subject: ${s.subject}`);
      if (s?.senderName) lines.push(`From: ${s.senderName}`);
      break;
    }
    case "sms": {
      const s = step.settings as SmsSetting | undefined;
      if (s?.senderId) lines.push(`Sender ID: ${s.senderId}`);
      break;
    }
    case "check-attribute": {
      const s = step.settings as ConditionSetting | undefined;
      if (s && s.rules.length > 0) {
        lines.push(`${s.rules.length} rule${s.rules.length === 1 ? "" : "s"} · match ${s.matchAll ? "all" : "any"}`);
      }
      break;
    }
    case "wait-for-event": {
      const s = step.settings as WaitForEventSetting | undefined;
      if (s && s.rows.length > 0) {
        const labels = s.rows
          .map((r) => ACTIVITY_DEFINITIONS.find((a) => a.id === r.activityId)?.label)
          .filter((label): label is string => !!label);
        if (labels.length > 1) lines.push(`Events: ${labels.join(", ")}`);
        const withWindow = s.rows.find((r) => r.activityId && r.windowOperator === "in the last" && r.atLeast);
        if (withWindow) {
          lines.push(`At least ${withWindow.atLeast}× in the last ${withWindow.windowValue}`);
        }
      }
      break;
    }
    case "agent-node": {
      const s = step.settings as AgentNodeSetting | undefined;
      if (s?.agentName) lines.unshift(`Agent: ${s.agentName}`);
      if (s?.connector) {
        const { method, url, selectedFields } = s.connector;
        if (url) lines.push(`${method} ${url}`);
        if (selectedFields.length > 0) lines.push(`Outputs: ${selectedFields.join(", ")}`);
      }
      break;
    }
    default:
      break;
  }

  return { title, lines };
}
