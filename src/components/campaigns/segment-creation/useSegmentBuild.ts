import { useEffect, useMemo, useState } from "react";
import {
  EMPTY_SEGMENT,
  resolveSegmentDefinition,
  type SegmentDefinition,
} from "./segmentRules.data";

/**
 * The behaviour behind the segment creation canvas, with no layout attached: the
 * agent thinks through its build steps, then writes the rules onto the canvas one
 * row at a time.
 *
 * Kept as a hook because the canvas has two hosts that must lay it out
 * differently while behaving identically:
 *   • <SegmentCreationOverlay/> — a self-contained full-screen panel that also
 *     owns the chat docked inside it.
 *   • <AiDashboard/> — the page hides its own chrome and puts the creation navbar
 *     where the top bar was, so the navbar spans the full width and the docked
 *     co-marketer sits beneath it. The chat has to stay exactly where it is in
 *     that page's tree: moved to a new parent it would remount, losing the
 *     conversation that produced the segment.
 */

/** Beat between the agent's reasoning steps while it thinks — also how long each
 *  line sits in the loader pill, so it has to be readable, not just quick. */
const STEP_MS = 900;
/** Beat between rule rows landing on the canvas. */
const ROW_MS = 300;

export interface ReviewSegmentContext {
  /** Artifact-card title — also the segment name in the navbar. */
  title: string;
  /** Card description, used to disambiguate which rule set this is. */
  description?: string;
}

export type SegmentBuildPhase = "thinking" | "plotting" | "ready";

export interface SegmentBuild {
  definition: SegmentDefinition;
  /** How many rule rows have landed so far. */
  plotted: number;
  phase: SegmentBuildPhase;
  /** 0→1 through the reasoning steps; drives the loader pill's label. */
  stepProgress: number;
  /** What SAVE should hand back to the page that lists segments. */
  saved: { name: string; count: string; aiGenerated: boolean };
}

/**
 * @param segment the segment to plot; null gives the blank "Untitled segment".
 * @param active while false the build clock is parked, so rules don't write
 *        themselves behind a closed panel.
 */
export function useSegmentBuild(
  segment: ReviewSegmentContext | null,
  active = true
): SegmentBuild {
  const [stepsDone, setStepsDone] = useState(0);
  const [plotted, setPlotted] = useState(0);

  const definition = useMemo(
    () => (segment ? resolveSegmentDefinition(segment.title, segment.description) : EMPTY_SEGMENT),
    [segment]
  );

  const totalRows =
    definition.include.reduce((n, b) => n + b.rows.length, 0) +
    (definition.exclude ?? []).reduce((n, b) => n + b.rows.length, 0);
  const totalSteps = definition.buildSteps.length;

  // One interval per phase, so row plotting can't start before the reasoning
  // finishes even if the definition changes mid-run.
  useEffect(() => {
    if (!active) return;
    // A blank canvas has nothing to think about — land it ready.
    if (totalSteps === 0) {
      setStepsDone(0);
      setPlotted(totalRows);
      return;
    }
    setStepsDone(0);
    setPlotted(0);
    const id = setInterval(() => {
      setStepsDone((n) => {
        if (n + 1 >= totalSteps) clearInterval(id);
        return Math.min(n + 1, totalSteps);
      });
    }, STEP_MS);
    return () => clearInterval(id);
  }, [active, definition, totalSteps, totalRows]);

  useEffect(() => {
    if (!active || totalSteps === 0 || stepsDone < totalSteps || plotted >= totalRows) return;
    const id = setInterval(() => {
      setPlotted((n) => {
        if (n + 1 >= totalRows) clearInterval(id);
        return Math.min(n + 1, totalRows);
      });
    }, ROW_MS);
    return () => clearInterval(id);
  }, [active, stepsDone, totalSteps, totalRows, plotted]);

  const phase: SegmentBuildPhase =
    totalSteps === 0 || plotted >= totalRows
      ? "ready"
      : stepsDone < totalSteps
        ? "thinking"
        : "plotting";

  return {
    definition,
    plotted,
    phase,
    stepProgress: totalSteps === 0 ? 0 : stepsDone / totalSteps,
    saved: {
      name: definition.name,
      count: definition.count,
      // Anything that came out of a review was written by the agent; a canvas the
      // user filled in by hand has no rules to review.
      aiGenerated: segment !== null,
    },
  };
}

/**
 * Gutters for the row holding the canvas (and the docked chat beside it). While
 * the agent is writing, the loader's wash has to reach the row's edges, so the
 * left gutter only appears once there are rules to inset.
 */
export function segmentRowPadding(phase: SegmentBuildPhase, chatDocked: boolean) {
  if (phase === "thinking") return chatDocked ? "pr-5" : "";
  return chatDocked ? "pl-14 pr-5" : "pl-14 pr-14";
}
