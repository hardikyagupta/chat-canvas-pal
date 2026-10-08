import { useState } from "react";
import { ArrowUp, FlaskConical } from "lucide-react";
import { computeExperimentResults, type ExperimentProposal } from "@/components/campaigns/journeyExperiment.data";
import type { OptimizationChangeKind } from "@/components/campaigns/journeyOptimizationInsight.data";
import CoMarketerQuestionCard, { type CoMarketerQuestion } from "@/components/campaigns/CoMarketerQuestionCard";

export interface ExperimentCardData {
  proposal: ExperimentProposal;
  changeKind: OptimizationChangeKind;
  /** The step this test is anchored to, when it came from a specific
   *  node's insight — undefined for a whole-journey / free-idea test,
   *  which lands the change nowhere in particular. */
  anchorStepId?: string;
  /** Set when this card is reopening co-marketer on a test that's already
   *  running (JourneyBuilder's `activeTest`) — skips straight to the
   *  results/decision stage instead of asking the setup questions again,
   *  seeded with what was actually configured last time. */
  initialStage?: "decide";
  initialVariantPercent?: number;
  initialMetric?: string;
  initialChangeDescription?: string;
}

const SPLIT_OPTIONS = ["10%", "20%", "30%", "50%", "Custom"];
const WAIT_HOURS_BY_LABEL: Record<string, number> = { Immediately: 0, "2 hours": 2, "6 hours": 6, "1 day": 24 };
const METRIC_OPTIONS = ["Conversion rate", "Revenue", "Click-through rate"];

export interface TestBranchConfig {
  changeKind: OptimizationChangeKind;
  changeDescription: string;
  waitHours?: number;
  content?: string;
  variantPercent: number;
  metric: string;
  /** The step this test is anchored to — carried through from the card so
   *  the host can land a "reduce-wait"/"add-whatsapp" change on the right
   *  node without a second function argument to keep in sync. */
  anchorStepId?: string;
  /** The same proposal the results math is computed from — passed through
   *  so the host can reconstruct this exact card (results included) if
   *  co-marketer is closed and reopened while the test is still running. */
  proposal: ExperimentProposal;
}

type PostTestDecision = "make-main" | "keep-existing" | "test-another";
type Stage = "idea" | "questions" | "followup" | "decide" | "adjust-split";

interface FollowupItem {
  key: "wait" | "content" | "audience" | "metric";
  question: string;
}

interface Run {
  id: string;
  changeDescription: string;
  waitHours?: number;
  content?: string;
  variantPercent: number;
  metric: string;
  stage: Stage;
  followupQueue: FollowupItem[];
  /** True while "adjust-split" is waiting on a typed number after the
   *  marketer picked "Custom" from the fixed split choices. */
  awaitingCustomSplit?: boolean;
  decision: "made-main" | "kept-existing" | "moved-on" | null;
}

let runSeq = 0;

const DECISION_COPY: Record<Exclude<Run["decision"], null>, string> = {
  "made-main": "Done — the test path is now the journey everyone goes through.",
  "kept-existing": "Kept the existing journey unchanged. The test branch has been removed.",
  "moved-on": "Starting a fresh look at the journey for another opportunity — see the next message.",
};

/** A free-text answer — same inline composer shape (rounded field + small
 *  round submit button) as the co-marketer's own message box. Used for the
 *  one-off "describe your idea" step and for any answer that named a
 *  custom/other value CoMarketerQuestionCard's fixed choices don't cover. */
function CustomAnswerField({ placeholder, onSubmit }: { placeholder: string; onSubmit: (value: string) => void }) {
  const [value, setValue] = useState("");
  const submit = () => {
    const v = value.trim();
    if (v) onSubmit(v);
  };
  return (
    <div className="mt-2 flex items-center gap-1.5">
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && submit()}
        placeholder={placeholder}
        className="h-8 flex-1 rounded-full border border-[#DDE2EE] bg-white px-3 font-manrope text-[12.5px] text-[#17173A] outline-none focus:border-[#2F68E5]"
      />
      <button
        type="button"
        onClick={submit}
        disabled={!value.trim()}
        aria-label="Submit"
        className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#2F68E5] text-white transition-opacity disabled:opacity-40"
      >
        <ArrowUp className="h-4 w-4" strokeWidth={2.2} />
      </button>
    </div>
  );
}

/** The question set for a given change — same shape (and same component)
 *  the AI Journey Creation flow already uses for its own audience/incentive
 *  questions, so "configure the test" reads as the same kind of step
 *  rather than a new UI pattern. */
function questionsFor(changeKind: OptimizationChangeKind, metricOptions: string[]): CoMarketerQuestion[] {
  const metrics = metricOptions.length > 0 ? metricOptions : METRIC_OPTIONS;
  const shared: CoMarketerQuestion[] = [
    {
      title: "What percentage of users should see this test?",
      options: ["1%", "5%", "10%", "20%", "Custom"],
      recommended: "5%",
    },
    { title: "What should we measure?", options: [...metrics, "Other"], recommended: metrics[0] },
  ];
  if (changeKind !== "add-whatsapp") return shared;
  return [
    {
      title: "How long should we wait before sending the WhatsApp message?",
      options: ["Immediately", "2 hours", "6 hours", "1 day", "Custom"],
      recommended: "2 hours",
    },
    {
      title: "What should the WhatsApp message include?",
      options: ["Product name + rating/review", "Product name + discount reminder", "Just a friendly reminder", "Something else"],
      recommended: "Product name + rating/review",
    },
    ...shared,
  ];
}

const DECISION_QUESTION: CoMarketerQuestion = {
  title: "What would you like to do with this test?",
  options: ["Make test the main Journey", "Test with more users", "Keep current Journey", "Test another improvement"],
};

const SPLIT_QUESTION: CoMarketerQuestion = {
  title: "What percentage of users should see the test now?",
  options: SPLIT_OPTIONS,
};

/**
 * The Journey Optimization Agent's conversational configuration + test
 * card. Questions are asked one at a time via CoMarketerQuestionCard — the
 * same paginated question component the AI Journey Creation flow uses —
 * ending with a test branch created directly inside the existing journey
 * canvas (Existing Journey / Test Journey, not "Version A/B"). Nothing
 * here ever edits the journey by itself: creating the test, adjusting its
 * split, and resolving it are all handled by the three host callbacks.
 * "Test another improvement" hands off to a brand-new analysis rather than
 * looping in place, so every prior test stays visible as its own card.
 */
export default function ExperimentCard({
  card,
  onCreateTest,
  onUpdateSplit,
  onPostTestDecision,
}: {
  card: ExperimentCardData;
  /** Called once, on the last setup question's "Create" — builds the
   *  Optimizer split node in the journey canvas. */
  onCreateTest?: (config: TestBranchConfig) => void;
  /** Called when "Test with more users" picks a new split — updates the
   *  already-created Optimizer node's percentages. */
  onUpdateSplit?: (variantPercent: number) => void;
  /** Called for the other three post-test choices. */
  onPostTestDecision?: (decision: PostTestDecision) => void;
}) {
  const { proposal, changeKind } = card;
  const [runs, setRuns] = useState<Run[]>([
    {
      id: `run-${++runSeq}`,
      changeDescription: card.initialChangeDescription ?? proposal.changeSummary,
      variantPercent: card.initialVariantPercent ?? 5,
      metric: card.initialMetric ?? (proposal.metricOptions[0] ?? METRIC_OPTIONS[0]),
      stage: card.initialStage ?? (changeKind === "other" ? "idea" : "questions"),
      followupQueue: [],
      decision: null,
    },
  ]);

  const updateRun = (id: string, patch: Partial<Run>) =>
    setRuns((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  return (
    <div className="w-full space-y-3">
      {runs.map((run, i) => {
        const metricOptions = proposal.metricOptions.length > 0 ? proposal.metricOptions : METRIC_OPTIONS;

        // Builds the finished config from this run (plus whatever the very
        // last answer just patched in) and hands it to the host — the
        // question flow's own last "Create" click, not a separate
        // confirmation step.
        const finalizeAndCreate = (patch: Partial<Run>) => {
          const merged = { ...run, ...patch };
          onCreateTest?.({
            changeKind,
            changeDescription: merged.changeDescription,
            waitHours: merged.waitHours,
            content: merged.content,
            variantPercent: merged.variantPercent,
            metric: merged.metric,
            anchorStepId: card.anchorStepId,
            proposal,
          });
          updateRun(run.id, { ...patch, followupQueue: [], stage: "decide" });
        };

        // Turns CoMarketerQuestionCard's flat answers array into this run's
        // real fields, queuing a plain-text follow-up for anything answered
        // "Custom"/"Something else"/"Other" instead of guessing a value —
        // and, once nothing is left to ask, creates the test right away.
        const handleQuestionsComplete = (answers: (string | null)[]) => {
          const labels = questionsFor(changeKind, metricOptions).map((q) => q.title);
          const patch: Partial<Run> = {};
          const queue: FollowupItem[] = [];
          let idx = 0;
          if (changeKind === "add-whatsapp") {
            const waitAns = answers[idx++];
            if (waitAns === "Custom") queue.push({ key: "wait", question: labels[0] });
            else if (waitAns) patch.waitHours = WAIT_HOURS_BY_LABEL[waitAns] ?? 0;
            const contentAns = answers[idx++];
            if (contentAns === "Something else") queue.push({ key: "content", question: labels[1] });
            else if (contentAns) patch.content = contentAns;
          }
          const audienceAns = answers[idx++];
          const audienceLabel = labels[idx - 1];
          if (audienceAns === "Custom") queue.push({ key: "audience", question: audienceLabel });
          else if (audienceAns) patch.variantPercent = Math.min(99, Math.max(1, parseInt(audienceAns, 10) || 5));
          const metricAns = answers[idx++];
          const metricLabel = labels[idx - 1];
          if (metricAns === "Other") queue.push({ key: "metric", question: metricLabel });
          else if (metricAns) patch.metric = metricAns;

          if (queue.length > 0) {
            updateRun(run.id, { ...patch, followupQueue: queue, stage: "followup" });
          } else {
            finalizeAndCreate(patch);
          }
        };

        const submitFollowup = (value: string) => {
          const [item, ...rest] = run.followupQueue;
          if (!item) return;
          const patch: Partial<Run> =
            item.key === "wait"
              ? { waitHours: Number(value.replace(/[^\d.]/g, "")) || 0 }
              : item.key === "content"
                ? { content: value }
                : item.key === "audience"
                  ? { variantPercent: Math.min(99, Math.max(1, Number(value.replace(/[^\d.]/g, "")) || 5)) }
                  : { metric: value };
          if (rest.length > 0) {
            updateRun(run.id, { ...patch, followupQueue: rest, stage: "followup" });
          } else {
            finalizeAndCreate(patch);
          }
        };

        // The question stage renders CoMarketerQuestionCard bare — it's
        // already its own bordered card, so wrapping it in another one (plus
        // a "Test N" label contributing nothing here) just doubled up the
        // chrome without adding anything. The last question's own button
        // reads "Create" — answering it is what builds the test, no
        // separate confirmation step after.
        if (run.stage === "questions") {
          return (
            <CoMarketerQuestionCard
              key={run.id}
              questions={questionsFor(changeKind, metricOptions)}
              onComplete={handleQuestionsComplete}
              onClose={() => {}}
              finalLabel="Create"
            />
          );
        }

        // Reopening co-marketer on a running test (or landing here right
        // after a "Test with more users" split change) shows the real
        // Test-vs-Main numbers first — why the test is or isn't working —
        // then the decision question right below, same bordered-card shape
        // NodeOptimizationInsightCard uses for its own finding-then-question
        // layout.
        if (run.stage === "decide" && !run.decision) {
          const results = computeExperimentResults(proposal, proposal.newHours, run.variantPercent);
          // Actual conversion counts, not just the rate — rounded from the
          // same rate/user numbers already shown, not a separate invented
          // figure.
          const variantConversions = Math.round(results.variantRate * results.variantUsers);
          const controlConversions = Math.round(results.controlRate * results.controlUsers);
          const controlPercent = 100 - run.variantPercent;

          return (
            <div key={run.id} className="w-full rounded-lg border border-[#DDE2EE] bg-white p-4">
              <div className="flex items-center gap-2">
                <FlaskConical className="h-4 w-4 shrink-0 text-[#2F68E5]" strokeWidth={2} />
                <p className="font-manrope text-[13px] font-bold text-[#17173A]">Test {i + 1} · Results</p>
              </div>

              <p className="mt-2 font-manrope text-[12px] leading-[17px] text-[#17173A]">
                <span className="font-bold">Testing: </span>
                {run.changeDescription}
              </p>

              <div className="mt-3 grid grid-cols-2 gap-2.5">
                <div className="rounded-md bg-[#F4F8FF] p-2.5">
                  <p className="font-manrope text-[10.5px] font-bold uppercase tracking-[0.05em] text-[#2F68E5]">
                    Test Journey · {run.variantPercent}%
                  </p>
                  <p className="mt-1 font-manrope text-[20px] font-bold leading-none text-[#17173A]">
                    {(results.variantRate * 100).toFixed(1)}%
                  </p>
                  <p className="mt-1 font-manrope text-[11px] text-[#6F6F8D]">{run.metric}</p>
                  <p className="mt-1.5 font-manrope text-[11px] text-[#6F6F8D]">
                    {variantConversions.toLocaleString()} of {results.variantUsers.toLocaleString()} users converted
                  </p>
                </div>
                <div className="rounded-md bg-[#F7F7FB] p-2.5">
                  <p className="font-manrope text-[10.5px] font-bold uppercase tracking-[0.05em] text-[#6F6F8D]">
                    Main Journey · {controlPercent}%
                  </p>
                  <p className="mt-1 font-manrope text-[20px] font-bold leading-none text-[#17173A]">
                    {(results.controlRate * 100).toFixed(1)}%
                  </p>
                  <p className="mt-1 font-manrope text-[11px] text-[#6F6F8D]">{run.metric}</p>
                  <p className="mt-1.5 font-manrope text-[11px] text-[#6F6F8D]">
                    {controlConversions.toLocaleString()} of {results.controlUsers.toLocaleString()} users converted
                  </p>
                </div>
              </div>

              <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                <span className="rounded-full bg-[#EAFAF2] px-2.5 py-1 font-manrope text-[11.5px] font-bold text-[#1A8354]">
                  {results.absoluteDiffPts >= 0 ? "+" : ""}
                  {results.absoluteDiffPts.toFixed(1)} pts
                </span>
                <span className="rounded-full bg-[#EAFAF2] px-2.5 py-1 font-manrope text-[11.5px] font-bold text-[#1A8354]">
                  {results.relativeDiffPct >= 0 ? "+" : ""}
                  {results.relativeDiffPct.toFixed(1)}% relative
                </span>
                {results.confidence && (
                  <span className="rounded-full bg-[#F0F3F9] px-2.5 py-1 font-manrope text-[11.5px] font-semibold text-[#6F6F8D]">
                    {results.confidence}
                  </span>
                )}
              </div>

              <p className="mt-2.5 font-manrope text-[12px] leading-[17px] text-[#6F6F8D]">
                {results.confidence === "Not enough data yet"
                  ? "There isn't enough data yet to determine whether the test is performing differently."
                  : results.absoluteDiffPts > 0
                    ? `The test journey's ${run.metric.toLowerCase()} is ${(results.variantRate * 100).toFixed(1)}%, versus ${(results.controlRate * 100).toFixed(1)}% for the main journey — a ${results.relativeDiffPct.toFixed(1)}% relative lift, based on ${results.variantUsers.toLocaleString()} users tested so far.`
                    : "The test journey hasn't outperformed the main journey during the test period."}
              </p>

              <div className="mt-3.5">
                <CoMarketerQuestionCard
                  questions={[DECISION_QUESTION]}
                  onComplete={(answers) => {
                    const picked = answers[0];
                    if (picked === "Make test the main Journey") {
                      onPostTestDecision?.("make-main");
                      updateRun(run.id, { decision: "made-main" });
                    } else if (picked === "Test with more users") {
                      updateRun(run.id, { stage: "adjust-split" });
                    } else if (picked === "Keep current Journey") {
                      onPostTestDecision?.("keep-existing");
                      updateRun(run.id, { decision: "kept-existing" });
                    } else if (picked === "Test another improvement") {
                      onPostTestDecision?.("test-another");
                      updateRun(run.id, { decision: "moved-on" });
                    }
                  }}
                  onClose={() => {}}
                />
              </div>
            </div>
          );
        }

        if (run.stage === "adjust-split" && !run.awaitingCustomSplit) {
          return (
            <CoMarketerQuestionCard
              key={run.id}
              questions={[SPLIT_QUESTION]}
              onComplete={(answers) => {
                const picked = answers[0];
                if (!picked) return;
                if (picked === "Custom") {
                  updateRun(run.id, { awaitingCustomSplit: true });
                  return;
                }
                const pct = Math.min(99, Math.max(1, parseInt(picked, 10) || 10));
                onUpdateSplit?.(pct);
                updateRun(run.id, { variantPercent: pct, stage: "decide" });
              }}
              onClose={() => updateRun(run.id, { stage: "decide" })}
            />
          );
        }

        return (
          <div key={run.id} className="rounded-lg border border-[#DDE2EE] bg-white p-4">
            <div className="flex items-center gap-2">
              <FlaskConical className="h-4 w-4 shrink-0 text-[#2F68E5]" strokeWidth={2} />
              <p className="font-manrope text-[13px] font-bold text-[#17173A]">Test {i + 1}</p>
            </div>

            {run.stage === "idea" && (
              <div className="mt-3">
                <p className="font-manrope text-[12.5px] font-semibold text-[#17173A]">What would you like to test?</p>
                <CustomAnswerField
                  placeholder="Describe the change you'd like to test…"
                  onSubmit={(v) => updateRun(run.id, { changeDescription: v, stage: "questions" })}
                />
              </div>
            )}

            {run.stage === "followup" && run.followupQueue[0] && (
              <div className="mt-3">
                <p className="font-manrope text-[12.5px] font-semibold text-[#17173A]">{run.followupQueue[0].question}</p>
                <CustomAnswerField placeholder="Type your answer…" onSubmit={submitFollowup} />
              </div>
            )}

            {run.stage === "adjust-split" && run.awaitingCustomSplit && (
              <div className="mt-3">
                <p className="font-manrope text-[12.5px] font-semibold text-[#17173A]">
                  What percentage of users should see the test now?
                </p>
                <CustomAnswerField
                  placeholder="Custom % (e.g. 25)"
                  onSubmit={(v) => {
                    const pct = Math.min(99, Math.max(1, Number(v.replace(/[^\d.]/g, "")) || 10));
                    onUpdateSplit?.(pct);
                    updateRun(run.id, { variantPercent: pct, stage: "decide", awaitingCustomSplit: false });
                  }}
                />
              </div>
            )}

            {run.stage === "decide" && run.decision && (
              <p className="mt-3 rounded-md bg-[#F4F8FF] px-3 py-2 font-manrope text-[12.5px] text-[#143F93]">
                {DECISION_COPY[run.decision]}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
