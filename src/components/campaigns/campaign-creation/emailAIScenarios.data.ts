import { Clapperboard, type LucideIcon } from "lucide-react";
import type { AdhocCondition } from "./CampaignAudienceStep";
import { CONTINUE_WATCHING_TEMPLATE_ID } from "./emailTemplates.data";

/**
 * A goal Email's AI flow can draft a specific campaign for, beyond the one
 * default draft every other typed goal still gets (see
 * applyAIGeneratedCampaign) — offered on the prompt screen as a starter card.
 */
export interface EmailAIScenario {
  id: string;
  prompt: string;
  starterLabel: string;
  icon: LucideIcon;
  campaignName: string;
  /** Recognises the scenario from whatever the user typed or edited. */
  matches: RegExp;
  senderName: string;
  subject: string;
  preHeader: string;
  templateId: number;
  conditions: AdhocCondition[];
  reach: number;
  /** Conversion goal the draft ships with — event, window and revenue field. */
  conversionEvent: string;
  conversionWindowValue: string;
  conversionWindowUnit: string;
  revenueParameter: string;
}

export const EMAIL_AI_SCENARIOS: EmailAIScenario[] = [
  {
    id: "continue-watching",
    prompt:
      "Bring back users who watched a series but haven't returned in the last 7 days. Remind them to continue watching their series and highlight the latest episode.",
    starterLabel: "Remind series watchers",
    icon: Clapperboard,
    campaignName: "Continue Watching Reminder — Viva One",
    matches: /series|episode|watch/i,
    senderName: "Viva One",
    subject: "Your next episode is waiting 🎬",
    preHeader: "Continue watching {{series_name}} on Viva One.",
    templateId: CONTINUE_WATCHING_TEMPLATE_ID,
    conditions: [
      { attribute: "Series watched", type: "recency", operator: "in the last", value: "30 days" },
      { attribute: "App opened", type: "recency", operator: "not in the last", value: "7 days" },
    ],
    reach: 14_820,
    conversionEvent: "Series watched",
    conversionWindowValue: "3",
    conversionWindowUnit: "Days",
    revenueParameter: "Order value",
  },
];

/** `null` means the typed goal doesn't match a specific scenario — the
 *  caller falls back to the one default AI draft every other prompt gets. */
export function emailScenarioFor(prompt: string): EmailAIScenario | null {
  return EMAIL_AI_SCENARIOS.find((s) => s.matches.test(prompt)) ?? null;
}
