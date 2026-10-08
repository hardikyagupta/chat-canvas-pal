import type { PaletteNode } from "./journeyNodePalette.data";
import type { TimeDelaySetting } from "./journeyTimeDelay.data";
import type { EmailSetting } from "./journeyEmail.data";
import type { SmsSetting } from "./journeySms.data";
import type { ConditionSetting } from "./journeyCondition.data";
import type { AgentNodeSetting } from "./AgentNodeConfig";
import type { WaitForEventSetting } from "./journeyWaitForEvent.data";
import type { RemoveFromJourneySetting } from "./journeyRemoveFromJourney.data";

/** The saved settings for whichever node type this step is — only the node
 *  types with a real config screen (Time Delay, Email, SMS, Check Attribute,
 *  Agent Node, Wait for Event, Remove from Journey) ever set this. */
export type StepSettings =
  | TimeDelaySetting
  | EmailSetting
  | SmsSetting
  | ConditionSetting
  | AgentNodeSetting
  | WaitForEventSetting
  | RemoveFromJourneySetting;

/** One output path of a multi-way split (currently only the Audience Split
 *  agent node produces these — always 4, at fixed percentages). Each path is
 *  its own independent chain, exactly like a Yes/No branch's `yes`/`no`
 *  array, just addressed by `key` instead of a fixed branch name. */
export interface SplitPath {
  key: string;
  label: string;
  percentage: number;
  steps: FlowStep[];
}

/**
 * The scratch-flow body (everything after the trigger) as a tree, not a
 * flat list. A step's `branches` is one of two shapes:
 *  - a Condition or (most) Flow Control node: always exactly `{ yes, no }`,
 *    unchanged since this was first built — every recursive helper below
 *    keeps treating this shape exactly as before.
 *  - the Audience Split agent node: `{ paths: SplitPath[] }`, always 4 fixed
 *    paths — additive, so it never touches the yes/no behavior above.
 * Either way, a branching step is always the last item in whatever array
 * it's in (that's what makes it "branching" — nothing renders after it in
 * the same chain; see FlowChain in JourneyCanvas.tsx). Action nodes don't
 * branch at all; they just continue to whatever comes next in the same chain.
 */
export interface FlowStep {
  id: string;
  paletteNodeId: string;
  /** Action-oriented sentence shown on the card, e.g. "Send an email". */
  label: PaletteNode["label"];
  nodeLabel: PaletteNode["nodeLabel"];
  icon: PaletteNode["icon"];
  tone: PaletteNode["tone"];
  branches?: { yes: FlowStep[]; no: FlowStep[] } | { paths: SplitPath[] };
  /** Persisted settings for node types with a real config screen — lets
   *  clicking the step later reopen its form pre-filled. */
  settings?: StepSettings;
  /** Small label shown above `nodeLabel` on the canvas card — e.g. "Connector
   *  Agent" above its task-specific line ("Get loyalty points…"). Unset for
   *  every other node type, which keeps their existing single-line card. */
  kindLabel?: string;
}

function isSplitBranches(
  branches: NonNullable<FlowStep["branches"]>,
): branches is { paths: SplitPath[] } {
  return "paths" in branches;
}

/** Every branch array a step has, each tagged with the key that addresses
 *  it — `"yes"`/`"no"` for a Condition/Time Delay step, or a path's own
 *  `key` for a split step. The one place that needs to know both branch
 *  shapes exist; every recursive helper below is written against this
 *  instead of switching on the shape itself. */
function branchEntries(branches: FlowStep["branches"]): { key: string; steps: FlowStep[] }[] {
  if (!branches) return [];
  if (isSplitBranches(branches)) return branches.paths.map((p) => ({ key: p.key, steps: p.steps }));
  return [
    { key: "yes", steps: branches.yes },
    { key: "no", steps: branches.no },
  ];
}

/** Rebuilds a step's `branches`, replacing just the one array named by
 *  `key` — mirrors branchEntries() but for writing instead of reading. */
function withBranchArray(
  branches: NonNullable<FlowStep["branches"]>,
  key: string,
  nextSteps: FlowStep[],
): FlowStep["branches"] {
  if (isSplitBranches(branches)) {
    return { paths: branches.paths.map((p) => (p.key === key ? { ...p, steps: nextSteps } : p)) };
  }
  if (key !== "yes" && key !== "no") return branches;
  return { ...branches, [key]: nextSteps };
}

export interface PathSegment {
  stepId: string;
  /** `"yes"` / `"no"` for a Condition/Time Delay branch, or a split path's
   *  own `key` for an Audience Split path. */
  branch: string;
}
/** Which chain (root, or nested inside some step's branch) a given index
 *  addresses. Empty = the root chain, right after the trigger. */
export type FlowPath = PathSegment[];

export function updateArrayAtPath(
  root: FlowStep[],
  path: FlowPath,
  updater: (arr: FlowStep[]) => FlowStep[],
): FlowStep[] {
  if (path.length === 0) return updater(root);
  const [head, ...rest] = path;
  return root.map((step) => {
    if (step.id !== head.stepId || !step.branches) return step;
    const entry = branchEntries(step.branches).find((e) => e.key === head.branch);
    if (!entry) return step;
    return { ...step, branches: withBranchArray(step.branches, head.branch, updateArrayAtPath(entry.steps, rest, updater)) };
  });
}

export function insertStepAt(
  root: FlowStep[],
  path: FlowPath,
  index: number,
  step: FlowStep,
): FlowStep[] {
  return updateArrayAtPath(root, path, (arr) => [...arr.slice(0, index), step, ...arr.slice(index)]);
}

export function removeStepById(root: FlowStep[], id: string): FlowStep[] {
  return root
    .filter((step) => step.id !== id)
    .map((step) => {
      if (!step.branches) return step;
      const entries = branchEntries(step.branches);
      let branches = step.branches;
      for (const entry of entries) {
        branches = withBranchArray(branches, entry.key, removeStepById(entry.steps, id));
      }
      return { ...step, branches };
    });
}

export function updateStepById(
  root: FlowStep[],
  id: string,
  updater: (step: FlowStep) => FlowStep,
): FlowStep[] {
  return root.map((step) => {
    if (step.id === id) return updater(step);
    if (!step.branches) return step;
    const entries = branchEntries(step.branches);
    let branches = step.branches;
    for (const entry of entries) {
      branches = withBranchArray(branches, entry.key, updateStepById(entry.steps, id, updater));
    }
    return { ...step, branches };
  });
}

export function findStepById(root: FlowStep[], id: string): FlowStep | null {
  for (const step of root) {
    if (step.id === id) return step;
    if (step.branches) {
      for (const entry of branchEntries(step.branches)) {
        const found = findStepById(entry.steps, id);
        if (found) return found;
      }
    }
  }
  return null;
}

/** Where a step currently lives — which chain (path) and at what index in
 *  it. Used by Copy (insert the clone right after) and Move (remove from
 *  here, insert at the target gap). */
export function findStepLocation(
  root: FlowStep[],
  id: string,
  path: FlowPath = [],
): { path: FlowPath; index: number } | null {
  for (let i = 0; i < root.length; i++) {
    const step = root[i];
    if (step.id === id) return { path, index: i };
    if (step.branches) {
      for (const entry of branchEntries(step.branches)) {
        const found = findStepLocation(entry.steps, id, [...path, { stepId: step.id, branch: entry.key }]);
        if (found) return found;
      }
    }
  }
  return null;
}

/** A step's own id plus every descendant's, across every branch — moving a
 *  step into its own branch would create a cycle, so Move checks its target
 *  against this set first. */
export function collectStepAndDescendantIds(step: FlowStep, acc: Set<string> = new Set()): Set<string> {
  acc.add(step.id);
  if (step.branches) {
    for (const entry of branchEntries(step.branches)) {
      for (const s of entry.steps) collectStepAndDescendantIds(s, acc);
    }
  }
  return acc;
}

/** Whether `path` passes through any step id in `ids` — used to block
 *  dropping a step into its own (former) branch. */
export function pathIntersectsIds(path: FlowPath, ids: Set<string>): boolean {
  return path.some((seg) => ids.has(seg.stepId));
}

export function pathsEqual(a: FlowPath, b: FlowPath): boolean {
  if (a.length !== b.length) return false;
  return a.every((seg, i) => seg.stepId === b[i].stepId && seg.branch === b[i].branch);
}

/**
 * Where to insert something "right after" a given step. A branching step
 * (one with `branches`) is always the last item in whatever array it's in —
 * that's the whole reason a chain splits there — so a literal `index + 1` in
 * the same array would land on a position FlowChain never renders (it stops
 * drawing a chain right at its branching step). For a branching step this
 * redirects into the start of its first branch instead (its "yes" branch, or
 * a split step's first path) — always a valid, visible position; for a plain
 * step it's just the next slot.
 */
export function locationAfterStep(root: FlowStep[], id: string): { path: FlowPath; index: number } | null {
  const step = findStepById(root, id);
  const location = findStepLocation(root, id);
  if (!step || !location) return null;
  if (step.branches) {
    const [firstEntry] = branchEntries(step.branches);
    if (!firstEntry) return null;
    return { path: [...location.path, { stepId: id, branch: firstEntry.key }], index: 0 };
  }
  return { path: location.path, index: location.index + 1 };
}
