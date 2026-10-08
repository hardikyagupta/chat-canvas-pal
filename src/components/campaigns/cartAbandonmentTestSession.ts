import type { FlowStep } from "./journeyFlowTree";
import type { ExperimentProposal } from "./journeyExperiment.data";
import type { OptimizationChangeKind } from "./journeyOptimizationInsight.data";
import type { ChatMessageData } from "@/components/ChatInterface";

/**
 * Persists the Cart Abandonment Ongoing journey's Optimizer test session
 * (canvas + co-marketer conversation) across a route navigation — Journey
 * Builder fully unmounts when the marketer leaves for the Report page or
 * the Journeys list, so its own `useState` can't survive that trip. A
 * plain in-memory module singleton, same idea as pendingOptimizerTest.ts,
 * except this one is read-and-written continuously for the life of the
 * tab rather than consumed once — "leave and come back" must show the
 * exact same canvas and the exact same conversation, not a rebuilt one.
 *
 * Deliberately scoped to this one demo journey (there's only one Optimizer
 * flow in the app right now) rather than a generic keyed store — Journey
 * Builder's own route (`/journeys/new`) doesn't carry a real journey id,
 * only a templateId, so keying by journey id isn't available anyway.
 *
 * In-memory only: a hard refresh loses it, same as every other piece of
 * this prototype's state today. Not backed by localStorage.
 */

export interface ActiveTestState {
  proposal: ExperimentProposal;
  changeKind: OptimizationChangeKind;
  anchorStepId?: string;
  changeDescription: string;
  variantPercent: number;
  metric: string;
}

interface CartAbandonmentSession {
  flow: FlowStep[] | null;
  activeTest: ActiveTestState | null;
  chatMessages: ChatMessageData[];
  /** Whether the "test journey is performing well… merge?" follow-up has
   *  already been appended onto the persisted conversation — set once, so
   *  reopening the builder never appends it a second time. */
  summaryAppended: boolean;
  /** Whether "Yes, merge as main journey" has already been actioned — once
   *  true, the test journey has replaced the main journey on canvas and
   *  there's no longer a running Optimizer to summarize or merge again. */
  merged: boolean;
}

let session: CartAbandonmentSession = {
  flow: null,
  activeTest: null,
  chatMessages: [],
  summaryAppended: false,
  merged: false,
};

export function getCartAbandonmentSession(): CartAbandonmentSession {
  return session;
}

export function saveCartAbandonmentFlow(flow: FlowStep[]) {
  session = { ...session, flow };
}

export function saveCartAbandonmentActiveTest(activeTest: ActiveTestState | null) {
  session = { ...session, activeTest };
}

export function saveCartAbandonmentChatMessages(chatMessages: ChatMessageData[]) {
  session = { ...session, chatMessages };
}

export function markCartAbandonmentSummaryAppended() {
  session = { ...session, summaryAppended: true };
}

export function markCartAbandonmentMerged() {
  session = { ...session, merged: true };
}
