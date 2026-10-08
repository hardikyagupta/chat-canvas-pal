import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { BarChart3, Calendar, ClipboardCheck, FlaskConical, Info, Pencil, Route, Sparkles, X } from "lucide-react";
import { journeys } from "@/components/campaigns/journeys.data";
import JourneyStatusBadge from "@/components/campaigns/JourneyStatusBadge";
import Dropdown from "@/components/campaigns/Dropdown";
import CoMarketerButton from "@/components/campaigns/CoMarketerButton";
import JourneyCanvas from "@/components/campaigns/JourneyCanvas";
import CoMarketerInsightsTab from "@/components/campaigns/CoMarketerInsightsTab";
import { findStepById, type FlowStep } from "@/components/campaigns/journeyFlowTree";
import { JOURNEY_TEMPLATES } from "@/components/campaigns/journeyTemplates.data";
import type { ExperimentCardData, TestBranchConfig } from "@/components/ExperimentCard";
import type { NodeInsightCardData, NodeInsightResponse } from "@/components/NodeOptimizationInsightCard";
import type { QuestionRecapEntry } from "@/components/campaigns/CoMarketerQuestionCard";
import {
  buildNodeOptimizationInsight,
  buildProposalFromInsight,
  findFirstNodeWithInsight,
} from "@/components/campaigns/journeyOptimizationInsight.data";
import { setPendingOptimizerTest } from "@/components/campaigns/pendingOptimizerTest";
import ChatInterface, { type SeededTopic, type StarterChip } from "@/components/ChatInterface";
import {
  buildCartAbandonmentOngoingFlow,
  buildExperimentIntroReply,
  buildJourneyAnalyticsReply,
  buildJourneyAuditReply,
  buildOptimizerFlow,
  CART_ABANDONMENT_ONGOING_TEMPLATE_ID,
  CART_ABANDONMENT_ONGOING_TRIGGER_LABEL,
  JOURNEY_EXPERIMENT_REASONING_STEPS,
  JOURNEY_REVIEW_REASONING_STEPS,
  templateToFlowSteps,
} from "@/pages/JourneyBuilder";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const PERIOD_OPTIONS = ["Last 7 Days", "Last 30 Days", "All Time"];
const TREND_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
// A fixed weekly shape (busiest midweek) applied to whichever metric is
// selected below — deterministic rather than random, so the chart looks
// the same across reloads instead of jittering.
const TREND_WEIGHTS = [0.1, 0.16, 0.14, 0.18, 0.15, 0.12, 0.15];

const toNumber = (v: string) => Number(v.replace(/,/g, "")) || 0;
const buildTrend = (total: number) => TREND_WEIGHTS.map((w) => Math.round(total * w));

interface Metric {
  key: string;
  label: string;
  value: string;
  info?: string;
}

/** The journey's own real flow (built the same way JourneyBuilder.tsx would
 *  put it on canvas) plus its trigger sentence — feeds both the node-wise
 *  tab's canvas (rendered with the real JourneyCanvas component, so it's
 *  pixel-identical to the builder rather than a separate lookalike) and the
 *  co-marketer's Audit/Simulate/Optimize chips, which reuse JourneyBuilder's
 *  own reply-building functions against this same data. */
function getJourneyFlow(journey: { templateId?: string }): { flow: FlowStep[]; triggerLabel: string } {
  if (journey.templateId === CART_ABANDONMENT_ONGOING_TEMPLATE_ID) {
    return { flow: buildCartAbandonmentOngoingFlow(), triggerLabel: CART_ABANDONMENT_ONGOING_TRIGGER_LABEL };
  }
  const template = JOURNEY_TEMPLATES.find((t) => t.id === journey.templateId);
  return template ? { flow: templateToFlowSteps(template), triggerLabel: template.trigger } : { flow: [], triggerLabel: "" };
}

const TABS = ["Overall", "Channel wise", "Node wise", "Co-marketer insights"] as const;

/**
 * "Report: <journey>" — opened by clicking a journey's name in the Journeys
 * list (see JourneyTable's name button). A read-only performance snapshot,
 * not part of the builder's own right-hand-column panel stack — its own
 * full page, the same way JourneyBuilder is. "Edit journey" is the one live
 * link back into the builder, passing this journey's own templateId (when
 * it has one — see journeys.data) so the canvas opens already built instead
 * of a blank scratch one.
 */
export default function JourneyReport() {
  const { journeyId } = useParams<{ journeyId: string }>();
  const navigate = useNavigate();
  const journey = journeys.find((j) => j.journeyId === journeyId);

  const [period, setPeriod] = useState(PERIOD_OPTIONS[0]);
  const [tab, setTab] = useState<(typeof TABS)[number]>("Overall");
  const [activeMetric, setActiveMetric] = useState("sent");

  const journeyFlow = useMemo(
    () => (journey ? getJourneyFlow(journey) : { flow: [], triggerLabel: "" }),
    [journey],
  );

  // Co-marketer — same docked ChatInterface + SeededTopic mechanism as the
  // Journey Builder's own panel (see JourneyBuilder.tsx's handleOpenCoMarketer/
  // handleAuditFlow/handleShowAnalytics/handleExperimentJourney), reusing its
  // exact reply-building functions so an audit/simulate/optimize here reads
  // the same as running it from inside the builder.
  const [coMarketerOpen, setCoMarketerOpen] = useState(false);
  const [chatEnabledAgents, setChatEnabledAgents] = useState<Set<string>>(new Set());
  const [followUpTopic, setFollowUpTopic] = useState<SeededTopic | null>(null);
  const [followUpSeq, setFollowUpSeq] = useState(0);

  const runReportAgent = (kind: "audit" | "simulate" | "optimize") => {
    if (!journey) return;
    // Reuses the same memoized `journeyFlow` the canvas itself renders
    // from, rather than calling getJourneyFlow(journey) fresh — that
    // regenerates every step's id (see buildCartAbandonmentOngoingFlow's
    // own id counter), which would make a step id captured here (e.g. for
    // "Test this recommendation") stop matching anything by the time a
    // later handler goes looking for it.
    const { flow, triggerLabel } = journeyFlow;
    if (kind === "audit") {
      setFollowUpTopic({
        prompt: "Audit journey",
        reply: buildJourneyAuditReply(flow, triggerLabel),
        agentId: "journey-review-agent",
        reasoningSteps: JOURNEY_REVIEW_REASONING_STEPS,
      });
      setFollowUpSeq((n) => n + 1);
      return;
    }
    if (kind === "simulate") {
      setFollowUpTopic({ prompt: "Simulate journey", reply: buildJourneyAnalyticsReply(flow, triggerLabel) });
      setFollowUpSeq((n) => n + 1);
      return;
    }
    // "optimize" — same node-level insight the builder's own Sparkles
    // button and bottom-bar pill show (Problem / Cause / Recommended
    // change / Why test this), not a generic "found a change" line. This
    // page has no persistent flow to mutate, so "Test this recommendation"
    // still walks the full conversational flow through to a summary —
    // ExperimentCard's onCreateTest/etc. are simply left unset here.
    const target = findFirstNodeWithInsight(flow);
    if (target) {
      showNodeInsight(target);
      return;
    }
    setFollowUpTopic({
      prompt: "Optimize journey",
      reply: "I looked through this journey and didn't find a clear optimization opportunity right now.",
      agentId: "journey-experiment-agent",
      reasoningSteps: JOURNEY_EXPERIMENT_REASONING_STEPS,
    });
    setFollowUpSeq((n) => n + 1);
  };

  const showNodeInsight = (step: FlowStep) => {
    const insight = buildNodeOptimizationInsight(step);
    setFollowUpTopic({
      prompt: "Optimize journey",
      reply: insight.hasInsight
        ? `I looked at "${step.nodeLabel}" and found something worth testing.`
        : `I looked at "${step.nodeLabel}" for an optimization opportunity.`,
      agentId: "journey-experiment-agent",
      reasoningSteps: JOURNEY_EXPERIMENT_REASONING_STEPS,
      nodeInsightCard: { stepId: step.id, stepLabel: step.label, insight },
    });
    setFollowUpSeq((n) => n + 1);
  };

  // The three answers on NodeOptimizationInsightCard's own inline question —
  // same behavior as the builder's handleRespondNodeInsight, minus the
  // parts that would mutate a live canvas this page doesn't own.
  const handleRespondNodeInsight = (response: NodeInsightResponse, data: NodeInsightCardData, recap: QuestionRecapEntry[]) => {
    if (!journey) return;
    const { flow } = journeyFlow;
    if (response === "test") {
      const step = findStepById(flow, data.stepId) ?? undefined;
      const proposal = buildProposalFromInsight(data.insight, step);
      setFollowUpTopic({
        prompt: "Optimize journey",
        questionRecap: recap,
        reply: `Let's set up a test for: ${data.insight.recommendedChange}`,
        experimentCard: { proposal, changeKind: data.insight.changeKind, anchorStepId: data.stepId } satisfies ExperimentCardData,
      });
      setFollowUpSeq((n) => n + 1);
      return;
    }
    if (response === "another-idea") {
      const proposal = buildProposalFromInsight({ ...data.insight, changeKind: "other", recommendedChange: "your own idea" });
      setFollowUpTopic({
        prompt: "Optimize journey",
        questionRecap: recap,
        reply: "Sure — tell me what you'd like to try.",
        experimentCard: { proposal, changeKind: "other" } satisfies ExperimentCardData,
      });
      setFollowUpSeq((n) => n + 1);
      return;
    }
    const alt = findFirstNodeWithInsight(flow, data.stepId);
    if (alt) {
      showNodeInsight(alt);
    } else {
      setFollowUpTopic({
        prompt: "Optimize journey",
        questionRecap: recap,
        reply: "I don't see another clear optimization opportunity in this journey right now.",
      });
      setFollowUpSeq((n) => n + 1);
    }
  };

  // "Create" on the conversational ExperimentCard — this read-only report
  // has no live flow of its own to drop the Optimizer node into, so it
  // builds the same flow handleCreateTestBranch would (buildOptimizerFlow,
  // shared with the live builder) and hands the marketer over to the real
  // canvas to see it, instead of showing results on a page that can't
  // actually run the test.
  const handleCreateTestBranch = (config: TestBranchConfig) => {
    if (!journey) return;
    setPendingOptimizerTest(buildOptimizerFlow(journeyFlow.flow, config), config);
    navigate("/journeys/new", { state: { templateId: journey.templateId, journeyName: journey.name } });
  };

  // Replaces ChatInterface's own default starter chips (Seasonal Trend/CTR
  // Monitoring/…) with this journey's three real agent actions.
  const REPORT_STARTER_CHIPS: StarterChip[] = [
    { label: "Audit journey", icon: ClipboardCheck, onSelect: () => runReportAgent("audit") },
    { label: "Simulate journey", icon: BarChart3, onSelect: () => runReportAgent("simulate") },
    { label: "Optimize journey", icon: FlaskConical, onSelect: () => runReportAgent("optimize") },
  ];

  const metrics: Metric[] = useMemo(() => {
    if (!journey) return [];
    return [
      { key: "sent", label: "Sent", value: journey.sent },
      { key: "delivered", label: "Delivered", value: journey.delivered },
      {
        key: "openedRead",
        label: "Opened / Read",
        value: journey.openedRead,
        info: "Unique contacts who opened the email or read the message.",
      },
      { key: "clicked", label: "Clicked", value: journey.clicked ?? "--" },
      { key: "submissions", label: "Submissions", value: journey.submissions ?? "--" },
    ];
  }, [journey]);

  const selected = metrics.find((m) => m.key === activeMetric) ?? metrics[0];
  const trend = selected ? buildTrend(toNumber(selected.value)) : [];
  const maxTrend = Math.max(1, ...trend);

  const handleEditJourney = () => {
    if (!journey) return;
    navigate("/journeys/new", {
      state: { templateId: journey.templateId, journeyName: journey.name },
    });
  };

  if (!journey) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center gap-3 bg-[#F4F8FF]">
        <p className="font-manrope text-[14px] text-[#6F6F8D]">No journey found with that ID.</p>
        <button type="button" onClick={() => navigate("/journeys")} className="dc-btn dc-btn-secondary">
          Back to Journeys
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full gap-2 overflow-hidden bg-[#F4F8FF] p-2">
      <div className="flex h-full flex-1 flex-col overflow-hidden rounded-lg bg-white shadow-[0px_1px_3px_rgba(23,23,58,0.06)]">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 px-8 pt-6">
          <div className="flex items-center gap-3">
            <span className="grid place-items-center rounded-[5px] bg-[#F7E8FD] p-1.5">
              <Route className="h-6 w-6 text-[#BE52F2]" strokeWidth={1.9} />
            </span>
            <h1 className="font-manrope text-[20px] font-bold tracking-[0.42px] text-[#17173A]">
              Report: {journey.name.replace(/_/g, " ")}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <button type="button" onClick={handleEditJourney} className="dc-btn dc-btn-primary">
              <Pencil className="h-4 w-4" strokeWidth={2} />
              Edit journey
            </button>
            <button
              type="button"
              aria-label="Close"
              onClick={() => navigate("/journeys")}
              className="grid h-9 w-9 place-items-center rounded border-[1.5px] border-[#DDE2EE] bg-white text-[#6F6F8D] transition-colors hover:bg-[#F3F6FF]"
            >
              <X className="h-5 w-5" strokeWidth={1.9} />
            </button>
          </div>
        </div>

        {/* Meta row */}
        <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 px-8 font-manrope text-[13px] text-[#6F6F8D]">
          <JourneyStatusBadge status={journey.status} />
          <span className="text-[#DDE2EE]">|</span>
          <span>ID: {journey.journeyId}</span>
          <span className="text-[#DDE2EE]">|</span>
          <span>Start - End date: {journey.startEnd}</span>
          <span className="text-[#DDE2EE]">|</span>
          <span>Last edited: {journey.lastEdited}</span>
          <span className="text-[#DDE2EE]">|</span>
          <button
            type="button"
            onClick={handleEditJourney}
            className="font-semibold text-[#2F68E5] transition-colors hover:underline"
          >
            Journey settings
          </button>
        </div>

        <div className="mt-4 border-t border-[#EBEBF5]" />

        {/* Tabs */}
        <div className="flex items-center gap-6 px-8">
          {TABS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`relative flex items-center gap-1.5 py-3 font-manrope text-[13.5px] font-semibold transition-colors ${
                tab === t ? "text-[#2F68E5]" : "text-[#6F6F8D] hover:text-[#17173A]"
              }`}
            >
              {t === "Co-marketer insights" && <Sparkles className="h-3.5 w-3.5 shrink-0" strokeWidth={2.2} />}
              {t}
              {tab === t && <span className="absolute inset-x-0 -bottom-px h-0.5 bg-[#2F68E5]" />}
            </button>
          ))}
        </div>
        <div className="border-t border-[#EBEBF5]" />

        {/* Body */}
        <div className="scroll-slim min-h-0 flex-1 overflow-y-auto px-8 py-6">
          {tab === "Channel wise" ? (
            <div className="grid h-full min-h-[300px] place-items-center">
              <p className="font-manrope text-[13.5px] text-[#6F6F8D]">Channel wise breakdown coming soon.</p>
            </div>
          ) : tab === "Node wise" ? (
            <>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-[#6F6F8D]" strokeWidth={1.9} />
                  <span className="font-manrope text-[13px] text-[#6F6F8D]">Performance period:</span>
                  <Dropdown value={period} options={PERIOD_OPTIONS} onChange={setPeriod} widthClass="w-[160px]" heightClass="h-8" />
                </div>
                <CoMarketerButton label="Co-marketer" onClick={() => setCoMarketerOpen(true)} />
              </div>

              <div className="mt-4 flex items-center gap-2 rounded-md bg-[#F4F8FF] px-3.5 py-2.5">
                <Info className="h-4 w-4 shrink-0 text-[#6F6F8D]" strokeWidth={1.9} />
                <p className="font-manrope text-[12.5px] text-[#6F6F8D]">
                  <span className="font-semibold text-[#17173A]">Wait node</span> counts are as on date and not for
                  the selected performance period.
                </p>
              </div>

              {/* The real Journey Builder canvas, read-only in effect (no
                  drawer/chat wiring behind its click handlers here) — so
                  this is pixel-identical to opening the journey in the
                  builder, not a separate lookalike diagram. */}
              <div className="mt-4 h-[600px]">
                <JourneyCanvas
                  triggerOnly
                  hasJourney
                  triggerLabel={journeyFlow.triggerLabel || null}
                  flow={journeyFlow.flow}
                  showActions={false}
                />
              </div>
            </>
          ) : tab === "Co-marketer insights" ? (
            journey && <CoMarketerInsightsTab journey={journey} flow={journeyFlow.flow} />
          ) : (
            <>
              <Dropdown
                value={period}
                options={PERIOD_OPTIONS}
                onChange={setPeriod}
                widthClass="w-[190px]"
              />

              <div className="mt-4 grid grid-cols-5 gap-3">
                {metrics.map((m) => {
                  const active = m.key === activeMetric;
                  return (
                    <button
                      key={m.key}
                      type="button"
                      onClick={() => setActiveMetric(m.key)}
                      className={`relative rounded-lg border px-4 py-3.5 text-left transition-colors ${
                        active ? "border-[#2F68E5] bg-[#F4F8FF]" : "border-[#DDE2EE] bg-white hover:border-[#B9C4DD]"
                      }`}
                    >
                      <span className="flex items-center gap-1 font-manrope text-[12.5px] font-medium text-[#6F6F8D]">
                        {m.label}
                        {m.info && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="h-3 w-3 shrink-0" strokeWidth={2} />
                            </TooltipTrigger>
                            <TooltipContent
                              side="top"
                              className="max-w-[220px] border-0 bg-foreground text-background text-[12px] leading-[16px]"
                            >
                              {m.info}
                            </TooltipContent>
                          </Tooltip>
                        )}
                      </span>
                      <span className="mt-1.5 block font-manrope text-[22px] font-bold text-[#17173A]">
                        {m.value}
                      </span>
                      {active && <span className="absolute inset-x-0 bottom-0 h-[3px] rounded-b-lg bg-[#2F68E5]" />}
                    </button>
                  );
                })}
              </div>

              <div className="mt-6">
                <p className="font-manrope text-[13.5px] font-bold text-[#17173A]">Performance trend</p>
                <div className="mt-3 rounded-lg border border-[#DDE2EE] p-5">
                  <div className="flex h-[180px] items-end gap-4">
                    {trend.map((v, i) => (
                      <div key={TREND_DAYS[i]} className="flex flex-1 flex-col items-center gap-2">
                        <span className="font-manrope text-[11px] font-semibold text-[#17173A]">
                          {v.toLocaleString()}
                        </span>
                        <div
                          className="w-full rounded-t-md bg-[#2F68E5]/80 transition-all"
                          style={{ height: `${Math.max(6, (v / maxTrend) * 130)}px` }}
                        />
                        <span className="font-manrope text-[11px] text-[#6F6F8D]">{TREND_DAYS[i]}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {coMarketerOpen && (
        <div className="flex h-full w-[474px] shrink-0 flex-col gap-3 overflow-hidden py-1">
          <ChatInterface
            key="report-co-marketer"
            initialExpanded={false}
            docked
            conversationVariant="campaigns"
            followUpTopic={followUpTopic}
            followUpSeq={followUpSeq}
            enabledAgents={chatEnabledAgents}
            setEnabledAgents={setChatEnabledAgents}
            starterChipSet={REPORT_STARTER_CHIPS}
            onRespondNodeInsight={handleRespondNodeInsight}
            onCreateTest={handleCreateTestBranch}
            onCloseInterface={() => setCoMarketerOpen(false)}
          />
        </div>
      )}
    </div>
  );
}
