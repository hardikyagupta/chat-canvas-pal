import type { FlowStep } from "./journeyFlowTree";
import type { TestBranchConfig } from "@/components/ExperimentCard";

/**
 * Hands a just-built Optimizer flow off from the read-only Node-wise report
 * page (JourneyReport.tsx) to the live builder (JourneyBuilder.tsx) across
 * a route navigation — "Create" on the report's co-marketer has no live
 * flow of its own to mutate, so it builds the flow, stashes it here, and
 * navigates to the builder to show it.
 *
 * Deliberately NOT carried as router `navigate(path, { state })` — that
 * state has to survive `history.pushState`, which requires it be
 * structured-cloneable, and a FlowStep's `icon` is a live component
 * reference (see JourneyBuilder.tsx's own routerState comment on why
 * templates are looked up by id rather than passed whole). A plain
 * in-memory module singleton sidesteps that; it only needs to survive the
 * one synchronous navigate() call right after it's set.
 */
let pending: { flow: FlowStep[]; config: TestBranchConfig } | null = null;

export function setPendingOptimizerTest(flow: FlowStep[], config: TestBranchConfig) {
  pending = { flow, config };
}

/** Non-destructive read — safe to call from more than one `useState`
 *  initializer (JourneyBuilder reads it for both `flow` and `activeTest`),
 *  and safe under StrictMode's double-invoked initial render, which would
 *  otherwise consume a "take"-style read on the throwaway first pass and
 *  leave the real one with nothing. */
export function peekPendingOptimizerTest() {
  return pending;
}

/** Clears the pending flow once the builder has actually picked it up —
 *  call from a mount effect (after render, past StrictMode's double-render)
 *  rather than during render itself. */
export function clearPendingOptimizerTest() {
  pending = null;
}
