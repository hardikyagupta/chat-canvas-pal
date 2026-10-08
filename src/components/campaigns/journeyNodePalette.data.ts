import {
  CircleCheck,
  Clock,
  Contact,
  GitBranch,
  Globe,
  Hourglass,
  List,
  ListChecks,
  LogOut,
  Mail,
  MessageCircle,
  MessageSquare,
  MessageSquareText,
  MessagesSquare,
  Mic,
  PhoneCall,
  Send,
  Share2,
  Smartphone,
  Sparkles,
  UserCheck,
  Webhook,
  type LucideIcon,
} from "lucide-react";

/**
 * Node catalog for the right-side "Add to journey" drawer used once a
 * from-scratch journey has a trigger (JourneyNodeDrawer). Same categories,
 * icons and terminology as the existing left palette (JourneyPalette) —
 * this doesn't touch that component, which still serves template/AI
 * journeys unchanged. Four Actions (Viber, Zalo, RCS, Limechat) and two
 * Conditions ("Reachable channels", "Is in list") are new here versus the
 * old palette; "Reachable channels" replaces "Preferred Channel" as the
 * same capability rather than sitting alongside it as a near-duplicate.
 */

export type NodeTone = "action" | "condition" | "flow" | "agent";

export interface PaletteNode {
  id: string;
  /** Short catalog name, shown in the drawer's row list. */
  label: string;
  /** Action-oriented sentence shown on the canvas once added, e.g.
   *  "Send an email" — so the journey reads top-to-bottom in plain language. */
  nodeLabel: string;
  icon: LucideIcon;
  tone: NodeTone;
  /** Small badge for paid/add-on channels. */
  premium?: boolean;
  /**
   * When true, picking/dropping this node opens its own settings screen in
   * the drawer first (e.g. Time Delay) — it only lands on the canvas once
   * that's saved, instead of being added immediately like the other nodes.
   */
  requiresConfig?: boolean;
}

export const ACTION_NODES: PaletteNode[] = [
  { id: "email", label: "Email", nodeLabel: "Send an email", icon: Mail, tone: "action", requiresConfig: true },
  { id: "sms", label: "SMS", nodeLabel: "Send an SMS", icon: MessageSquare, tone: "action", requiresConfig: true },
  { id: "webpush", label: "Web Push", nodeLabel: "Send a web push notification", icon: Globe, tone: "action" },
  { id: "app-push", label: "App Push", nodeLabel: "Send an app push notification", icon: Smartphone, tone: "action" },
  { id: "voice", label: "Voice", nodeLabel: "Make a voice call", icon: Mic, tone: "action" },
  { id: "webhook", label: "Web-hook", nodeLabel: "Call a webhook", icon: Webhook, tone: "action" },
  { id: "update-attribute", label: "Update Attribute", nodeLabel: "Update their attribute", icon: ListChecks, tone: "action" },
  { id: "whatsapp", label: "Whatsapp", nodeLabel: "Send a WhatsApp message", icon: MessageCircle, tone: "action" },
  {
    id: "remove-from-journey",
    label: "Remove from Journey",
    nodeLabel: "Remove them from the journey",
    icon: LogOut,
    tone: "action",
    requiresConfig: true,
  },
  { id: "viber", label: "Viber", nodeLabel: "Send a Viber message", icon: PhoneCall, tone: "action", premium: true },
  { id: "zalo", label: "Zalo", nodeLabel: "Send a Zalo message", icon: Send, tone: "action", premium: true },
  { id: "rcs", label: "RCS", nodeLabel: "Send an RCS message", icon: MessageSquareText, tone: "action", premium: true },
  { id: "limechat", label: "Limechat", nodeLabel: "Send a Limechat message", icon: MessagesSquare, tone: "action", premium: true },
];

export const CONDITION_NODES: PaletteNode[] = [
  { id: "check-attribute", label: "Check Attribute", nodeLabel: "Check an attribute", icon: UserCheck, tone: "condition", requiresConfig: true },
  { id: "has-done-event", label: "Has done event", nodeLabel: "Check if they've done an event", icon: CircleCheck, tone: "condition" },
  { id: "reachable-channels", label: "Reachable channels", nodeLabel: "Check their reachable channels", icon: Contact, tone: "condition" },
  { id: "split-action", label: "Split Action", nodeLabel: "Split the path", icon: GitBranch, tone: "condition" },
  { id: "path-optimiser", label: "Path optimiser", nodeLabel: "Pick the best path for them", icon: Sparkles, tone: "condition" },
  { id: "is-in-segment", label: "Is in Segment", nodeLabel: "Check if they're in a segment", icon: Share2, tone: "condition" },
  { id: "is-in-list", label: "Is in List", nodeLabel: "Check if they're on a list", icon: List, tone: "condition" },
];

export const FLOW_CONTROL_NODES: PaletteNode[] = [
  {
    id: "wait-for-event",
    label: "Wait for event",
    nodeLabel: "Wait for an event",
    icon: Hourglass,
    tone: "flow",
    requiresConfig: true,
  },
  {
    id: "time-delay",
    label: "Time Delay",
    nodeLabel: "Wait",
    icon: Clock,
    tone: "flow",
    requiresConfig: true,
  },
];

/**
 * The single AI-powered node — hands this step to whichever agent (built-in
 * or custom) the user picks from the Agents space (`/agents`). Kept as its
 * own one-item list, shown ahead of Actions, rather than folded into
 * ACTION_NODES, since it's a different kind of thing (delegates to an
 * agent) rather than one more fixed action.
 */
export const AGENT_NODES: PaletteNode[] = [
  { id: "agent-node", label: "Agent", nodeLabel: "Use an AI agent", icon: Sparkles, tone: "agent", requiresConfig: true },
];

export const ALL_PALETTE_NODES: PaletteNode[] = [
  ...AGENT_NODES,
  ...ACTION_NODES,
  ...CONDITION_NODES,
  ...FLOW_CONTROL_NODES,
];

export function findPaletteNode(id: string): PaletteNode | undefined {
  return ALL_PALETTE_NODES.find((n) => n.id === id);
}
