import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BookOpen,
  GitMerge,
  HelpCircle,
  Plus,
  Settings,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import ReadyObjectiveIllustration from "@/components/decisioning/ReadyObjectiveIllustration";
import ObjectiveCard from "@/components/decisioning/ObjectiveCard";
import OpportunityCard, { type Opportunity } from "@/components/decisioning/OpportunityCard";
import {
  STANDARD_EVENTS,
  useDecisioningSetup,
} from "@/contexts/DecisioningSetupContext";

/** Ranked opportunities the engine surfaced during preparation — each seeds
    an objective via its own "Create objective" CTA. */
const OPPORTUNITIES: Opportunity[] = [
  {
    title: "Recover second purchases from high-value dormant buyers",
    audience: "High-AOV dormant buyers",
    reach: "~664K people",
    value: "₹400 / conversion",
    channels: "WhatsApp + Email",
    confidence: "high",
    recommendedObjective: "Win the second purchase",
    detail:
      'These buyers historically spent at a high per-order value (~₹83 AOV vs ~₹12 population) across ~26 orders, then went quiet. The second-purchase objective (1→2) carries your highest value-per-conversion at ₹400. Reachable on WhatsApp + Email; app push converts them at zero.',
  },
  {
    title: "Convert first-time buyers with evergreen product messaging",
    audience: "Mainstream first-time buyers",
    reach: "~3.3M people",
    value: "₹250 / conversion",
    channels: "Email + WhatsApp",
    confidence: "high",
    recommendedObjective: "Drive first-to-second purchase",
    detail:
      "Non-fandom / evergreen content is significantly over-represented in first-purchase winners. This large mainstream audience shows no single-fandom signal, so lead with product-led, socially-proofed creative rather than IP collabs.",
  },
];

/**
 * Post-processing state — the engine is ready. A single page header ("Decisioning
 * Engine" title + Edit configuration / Create objective actions) sits above two
 * tabs: "Objectives" (the launched objective cards, or the empty-state card
 * when none exist yet) and "Insights" (the ranked opportunities the engine
 * surfaced during preparation, each able to seed an objective on its own).
 */
export default function DecisioningReadyState() {
  const navigate = useNavigate();
  const { objectives } = useDecisioningSetup();
  const hasObjectives = objectives.length > 0;

  // Brief skeleton while the engine "surfaces" its opportunities. Held in the
  // parent so switching tabs and coming back doesn't replay the load.
  const [insightsReady, setInsightsReady] = useState(false);
  useEffect(() => {
    const timer = window.setTimeout(() => setInsightsReady(true), 1500);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div className="w-full">
      {/* Page header — identical title, subtitle and button pair whether or
          not any objectives have been launched yet. */}
      <div className="mb-8 flex items-start justify-between gap-4">
        <div className="max-w-[700px]">
          <h1 className="font-manrope text-[28px] font-bold leading-tight text-[#17173A]">
            Decisioning Engine
          </h1>
          <p className="mt-2 font-manrope text-[15px] leading-[24px] text-[#6F6F8D]">
            Each engine autonomously evaluates your customers and decides the
            best next action — channel, content, timing, and incentive —
            toward the outcome you choose.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <button
            onClick={() => navigate("/decisioning-engine/preview")}
            className="dc-btn dc-btn-secondary"
          >
            <Settings strokeWidth={1.8} />
            Edit configuration
          </button>
          {/* The empty state carries its own "Create objective" CTA inside the
              card, so the header only shows this action once objectives exist. */}
          {hasObjectives && (
            <button
              onClick={() => navigate("/decisioning-engine/objective/v2")}
              className="dc-btn dc-btn-primary"
            >
              <Plus strokeWidth={2.5} />
              Create objective
            </button>
          )}
        </div>
      </div>

      {/* Landing tab: once an objective is live, drop the user on Objectives so
          they see their running objective. Only when no objective exists after
          activation (~4 hrs) do we surface Insights to nudge them to start one. */}
      <Tabs defaultValue={hasObjectives ? "objectives" : "insights"}>
        <TabsList className="h-auto w-fit gap-1 rounded-lg bg-[#EEF1F7] p-1">
          <TabsTrigger
            value="objectives"
            className="rounded-md px-4 py-2 font-manrope text-[13px] font-semibold text-[#6F6F8D] data-[state=active]:bg-white data-[state=active]:text-[#17173A] data-[state=active]:shadow-[0px_1px_3px_rgba(23,23,58,0.1)]"
          >
            Objectives
          </TabsTrigger>
          <TabsTrigger
            value="insights"
            className="rounded-md px-4 py-2 font-manrope text-[13px] font-semibold text-[#6F6F8D] data-[state=active]:bg-white data-[state=active]:text-[#17173A] data-[state=active]:shadow-[0px_1px_3px_rgba(23,23,58,0.1)]"
          >
            Insights
          </TabsTrigger>
        </TabsList>

        <TabsContent value="objectives" className="mt-6">
          {hasObjectives ? (
            <div className="flex flex-wrap gap-6">
              {objectives.map((objective) => (
                <ObjectiveCard key={objective.id} objective={objective} />
              ))}
            </div>
          ) : (
            <EmptyObjectivesBody />
          )}
        </TabsContent>

        <TabsContent value="insights" className="mt-6">
          {/* Intro — tells the user these are ready-to-launch starting points. */}
          <div className="mb-6 max-w-[760px]">
            <div className="flex items-center gap-2">
              <Sparkles className="h-[18px] w-[18px] text-[#2F68E5]" strokeWidth={1.8} />
              <h2 className="font-manrope text-[18px] font-bold leading-tight text-[#17173A]">
                Start with these opportunities
              </h2>
            </div>
            <p className="mt-2 font-manrope text-[14px] leading-[22px] text-[#6F6F8D]">
              Your engine analysed your customers and surfaced the highest-impact
              opportunities to act on. Launch an objective from any one below — the
              recommended setup is pre-filled so you can get going in a click.
            </p>
          </div>

          {insightsReady ? (
            <div className="flex flex-col gap-5 animate-in fade-in duration-500">
              {OPPORTUNITIES.map((opportunity, i) => (
                <OpportunityCard key={opportunity.title} opportunity={opportunity} rank={i + 1} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-5" aria-hidden>
              <OpportunitySkeleton />
              <OpportunitySkeleton />
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

/** Loading placeholder mirroring OpportunityCard's layout — shown briefly while
    the engine surfaces its opportunities. */
function OpportunitySkeleton() {
  return (
    <div className="rounded-2xl border border-[#E6EAF4] bg-white p-6">
      {/* Header — rank, title, confidence pill */}
      <div className="flex items-start gap-4">
        <Skeleton className="h-9 w-10 shrink-0 rounded-lg" />
        <Skeleton className="mt-1 h-5 w-[52%] max-w-[420px]" />
        <Skeleton className="ml-auto h-7 w-[130px] shrink-0 rounded-full" />
      </div>

      {/* Four-up metric summary */}
      <div className="mt-5 grid grid-cols-2 gap-x-6 gap-y-4 border-t border-[#EEF1F7] pt-5 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="min-w-0">
            <Skeleton className="h-3 w-[55%]" />
            <Skeleton className="mt-2 h-4 w-[80%]" />
          </div>
        ))}
      </div>

      {/* Recommended objective row */}
      <div className="mt-5 flex items-center gap-2 border-t border-[#EEF1F7] pt-5">
        <Skeleton className="h-4 w-4 rounded-full" />
        <Skeleton className="h-4 w-[180px]" />
      </div>

      {/* Actions */}
      <div className="mt-5 flex items-center gap-3">
        <Skeleton className="h-9 w-[150px] rounded-lg" />
        <Skeleton className="h-9 w-[110px] rounded-lg" />
      </div>
    </div>
  );
}

/** Full-width card — text left, illustration right. Shown once the engine is
    ready but no objective has been launched yet. */
function EmptyObjectivesBody() {
  const navigate = useNavigate();
  const { eventMapping, guardrails } = useDecisioningSetup();

  const mappedCount = eventMapping
    ? STANDARD_EVENTS.filter(
        (e) => eventMapping.mappings[e.id] && eventMapping.mappings[e.id] !== "none"
      ).length
    : 0;
  const guardrailCount = guardrails ? 4 : 0;

  return (
    <div className="flex w-full items-start gap-10 rounded-2xl border border-[#E6EAF4] bg-white px-10 py-12">
      {/* LHS content */}
      <div className="flex min-w-0 flex-1 flex-col">
        <h2 className="font-manrope text-[18px] font-bold leading-tight text-[#17173A]">
          Create your first objective
        </h2>
        <p className="mt-3 max-w-[460px] font-manrope text-[14px] leading-[22px] text-[#6F6F8D]">
          Your brand context, event mappings and guardrails are all set. Tell the
          engine the business outcome you want — it decides the channel, content,
          timing and incentive for every customer to get you there.
        </p>

        {/* Stat row */}
        <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2">
          <span className="flex items-center gap-2 font-manrope text-[14px] font-medium text-[#17173A]">
            <BookOpen className="h-4 w-4 text-[#2F68E5]" strokeWidth={1.8} />
            Brand wiki ready
          </span>
          <span className="h-1 w-1 rounded-full bg-[#C9D0E0]" />
          <span className="flex items-center gap-2 font-manrope text-[14px] font-medium text-[#17173A]">
            <GitMerge className="h-4 w-4 text-[#2F68E5]" strokeWidth={1.8} />
            {mappedCount} events mapped
          </span>
          <span className="h-1 w-1 rounded-full bg-[#C9D0E0]" />
          <span className="flex items-center gap-2 font-manrope text-[14px] font-medium text-[#17173A]">
            <ShieldCheck className="h-4 w-4 text-[#00A576]" strokeWidth={1.8} />
            {guardrailCount} guardrails active
          </span>
        </div>

        <div className="mt-9 flex flex-wrap items-center gap-5">
          <button
            onClick={() => navigate("/decisioning-engine/objective/v2")}
            className="dc-btn dc-btn-primary"
          >
            <Plus strokeWidth={2.5} />
            Create objective
          </button>
          <button
            onClick={() => navigate("/decisioning-engine/objective/new")}
            className="flex w-fit items-center gap-2 font-manrope text-[13px] font-medium text-[#6F6F8D] transition-colors hover:text-[#17173A]"
          >
            <HelpCircle className="h-4 w-4" strokeWidth={1.8} />
            Learn how objectives work
          </button>
        </div>
      </div>

      {/* RHS — animated "create an objective" illustration */}
      <ReadyObjectiveIllustration />
    </div>
  );
}
