import { useNavigate } from "react-router-dom";
import {
  BookOpen,
  GitMerge,
  HelpCircle,
  Plus,
  Settings,
  ShieldCheck,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
    tags: ["High-AOV Dormant Buyers", "~664K people"],
    valueTag: "₹400 / conversion",
    channelTags: ["WhatsApp", "Email"],
    confidence: "high",
    description:
      'These buyers historically spent at a high per-order value (~₹83 AOV vs ~₹12 population) across ~26 orders, then went quiet. The second-purchase objective (1→2) carries your highest value-per-conversion at ₹400. Reachable on WhatsApp + Email; app push converts them at zero.',
    creativeTags: [
      'social proof (ratings / "X bought this")',
      "value framing over loyalty tone",
      "moderate urgency",
    ],
    evidence: "s1, s4",
  },
  {
    title: "Convert first-time buyers with evergreen creative",
    tags: ["IP-Agnostic Mainstream (No Fandom Signal)", "~3.3M people"],
    valueTag: "₹250 / conversion",
    channelTags: ["Email", "WhatsApp"],
    confidence: "high",
    description:
      "Non-fandom / evergreen content is significantly over-represented in first-purchase winners. This large mainstream audience shows no single-fandom signal, so lead with product-led, socially-proofed creative rather than IP collabs.",
    creativeTags: [
      "non-fandom / evergreen tone",
      "add social proof",
      "de-prioritise women-specific targeting",
    ],
    evidence: "s2, s5",
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
          <button
            onClick={() => navigate("/decisioning-engine/objective/new")}
            className="dc-btn dc-btn-secondary-blue"
          >
            <Plus strokeWidth={2.5} />
            Create objective
          </button>
        </div>
      </div>

      <Tabs defaultValue="objectives">
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
          <div className="flex flex-col gap-5">
            {OPPORTUNITIES.map((opportunity, i) => (
              <OpportunityCard key={opportunity.title} opportunity={opportunity} rank={i + 1} />
            ))}
          </div>
        </TabsContent>
      </Tabs>
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
        <h2 className="font-manrope text-[16px] font-bold leading-tight text-[#17173A]">
          Your decisioning engine is ready
        </h2>
        <p className="mt-3 max-w-[460px] font-manrope text-[14px] leading-[22px] text-[#6F6F8D]">
          Your brand context, event mappings and guardrails are configured.
          Create your first objective to define the business outcome the engine
          should optimise.
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

        <button
          onClick={() => navigate("/decisioning-engine/objective/new")}
          className="mt-9 flex w-fit items-center gap-2 font-manrope text-[13px] font-medium text-[#6F6F8D] transition-colors hover:text-[#17173A]"
        >
          <HelpCircle className="h-4 w-4" strokeWidth={1.8} />
          Learn how objectives work
        </button>
      </div>

      {/* RHS — animated "create an objective" illustration */}
      <ReadyObjectiveIllustration />
    </div>
  );
}
