import {
  Check,
  ChevronDown,
  Eye,
  Info,
  Library,
  Lightbulb,
  Loader2,
  Rocket,
  Target,
  Users,
  X,
} from "lucide-react";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import ContentMapping from "@/components/decisioning/ContentMapping";
import ObjectiveJourneyPreview, {
  type EditableStep,
} from "@/components/decisioning/ObjectiveJourneyPreview";
import { useDecisioningSetup } from "@/contexts/DecisioningSetupContext";
import "./objective-flow-v2.css";

/**
 * v2 experiment of the objective creation flow. Same four steps
 * (Goal → Audience → Content → Preview) and same shared state/context as
 * ObjectiveCreationFlow, but rendered as a single-page accordion instead of a
 * stepper + right-hand summary. Guided/gated: a step opens only once the prior
 * ones are done; the collapsed cards carry the summary inline. This lives at a
 * separate route and touches none of the original flow.
 */

type StepId = "goal" | "audience" | "content" | "preview";

const steps: { id: StepId; label: string; description: string; icon: typeof Target }[] = [
  { id: "goal", label: "Goal", description: "The engine turns business value into a calibrated decision.", icon: Target },
  { id: "audience", label: "Audience", description: "Choose who the engine should act on.", icon: Users },
  { id: "content", label: "Content", description: "Review the content the engine mapped per channel.", icon: Library },
  { id: "preview", label: "Preview", description: "A quick recap of the objective before you launch.", icon: Eye },
];

// Each persona is a top-level audience; its sub-cohorts are slices of that same
// audience. The card's "Selected audience" is the sum of its sub-cohorts, and
// "Reachable contacts" is the subset of that selected audience the engine can
// actually message (valid channel + consent) — so reachable <= selected. Each
// persona carries a deliverability rate and reachable is derived from it, so the
// two numbers always reconcile.
const audiencePersonaDefs = [
  {
    id: "high-intent",
    name: "High-intent buyers",
    description: "Recent first purchasers showing strong repeat-buy signals.",
    reachableRate: 0.92,
    subCohorts: [
      { label: "New contacts", count: 9240, color: "#2F68E5" },
      { label: "Past buyers", count: 6130, color: "#7C5CFC" },
    ],
  },
  {
    id: "price-sensitive",
    name: "Price sensitive",
    description: "Buyers who convert primarily on discounts and offers.",
    reachableRate: 0.88,
    subCohorts: [
      { label: "Discount seekers", count: 5820, color: "#F59E0B" },
      { label: "Cart abandoners", count: 3410, color: "#EC4899" },
    ],
  },
  {
    id: "loyal-repeat",
    name: "Loyal repeat customers",
    description: "Proven multi-order customers with high lifetime value.",
    reachableRate: 0.95,
    subCohorts: [
      { label: "Frequent buyers", count: 4150, color: "#16A34A" },
      { label: "Subscription members", count: 2600, color: "#14B8A6" },
    ],
  },
  {
    id: "at-risk",
    name: "At-risk / dormant",
    description: "Lapsed one-time buyers worth winning back.",
    reachableRate: 0.83,
    subCohorts: [
      { label: "Lapsed 30–60 days", count: 7480, color: "#F97316" },
      { label: "Lapsed 60–90 days", count: 4220, color: "#EF4444" },
    ],
  },
];

// Derive the selected audience (sum of sub-cohorts) and the reachable subset
// (selected x deliverability rate) so every number on the card reconciles.
const audiencePersonas = audiencePersonaDefs.map((persona) => {
  const selected = persona.subCohorts.reduce((sum, cohort) => sum + cohort.count, 0);
  return {
    ...persona,
    selected,
    reachable: Math.round((selected * persona.reachableRate) / 10) * 10,
  };
});

// The audience step is "AI generated": when the user advances into it we hold on
// a 2-minute generating state (Lottie + rotating status copy) before revealing
// the audience cards.
const AUDIENCE_GENERATING_MS = 5_000;
const AUDIENCE_GENERATING_PHASES = [
  "Analyzing your goal and horizon",
  "Scanning customer signals and purchase history",
  "Clustering contacts into high-value audiences",
  "Finalizing sub-cohorts and reachability",
];

const contentAssets = [
  { id: "second-purchase", title: "Second-purchase offer", channel: "Email" },
  { id: "complete-set", title: "Complete-the-set recommendation", channel: "App push" },
  { id: "free-express", title: "Free-express unlock", channel: "WhatsApp" },
];

export default function ObjectiveCreationFlowV2() {
  const navigate = useNavigate();
  const location = useLocation();
  const { launchObjective, saveDraftObjective } = useDecisioningSetup();
  // Null means every card is collapsed (the accordion header toggles the open one shut).
  const [activeStep, setActiveStep] = useState<StepId | null>("goal");
  // Tracks the furthest step the user has advanced to, so completed cards
  // stay unlocked/clickable even after re-opening an earlier one.
  const [furthestIndex, setFurthestIndex] = useState(0);
  // Steps the user has explicitly finished (tapped "Done" on). Only these show
  // the green check — default data alone doesn't count as "done".
  const [completedSteps, setCompletedSteps] = useState<Set<StepId>>(new Set());
  const [name] = useState(
    (location.state as { objectiveName?: string } | null)?.objectiveName ??
      "Win the second purchase"
  );
  const [intent, setIntent] = useState("");
  const [horizon, setHorizon] = useState("");
  const [value, setValue] = useState("");
  const [arbitration, setArbitration] = useState(true);
  const [personaEnabled, setPersonaEnabled] = useState<Record<string, boolean>>(
    Object.fromEntries(audiencePersonas.map((persona) => [persona.id, true])),
  );
  const [excludeList, setExcludeList] = useState(false);
  const [selectedAssets] = useState<string[]>(contentAssets.map((asset) => asset.id));
  const [launching, setLaunching] = useState(false);
  const [advancing, setAdvancing] = useState(false);
  // While advancing to a step, its body shows a skeleton before the real
  // content swaps in, so the reveal reads as "loading" rather than a hard pop.
  const [loadingStep, setLoadingStep] = useState<StepId | null>(null);
  const rootRef = useRef<HTMLElement>(null);
  const cardRefs = useRef<Record<string, HTMLElement | null>>({});

  const totalAudience = audiencePersonas.reduce(
    (sum, p) => sum + (personaEnabled[p.id] ? p.selected : 0),
    0,
  );
  const activeAudienceCount = audiencePersonas.filter((p) => personaEnabled[p.id]).length;

  // The Content step maps templates against exactly the audiences chosen here, so
  // it consumes the enabled personas (and their sub-cohorts) rather than its own
  // hardcoded list. Kept in sync automatically as personas are toggled.
  const contentAudiences = useMemo(
    () =>
      audiencePersonas
        .filter((p) => personaEnabled[p.id])
        .map((p) => ({
          id: p.id,
          name: p.name,
          count: p.selected,
          subCohorts: p.subCohorts.map((c) => ({
            id: c.label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
            label: c.label,
            count: c.count,
          })),
        })),
    [personaEnabled],
  );

  // Live template assignments lifted from ContentMapping (keyed by
  // `${audienceId}::${channelId}::${scope}` -> templateId), so the Preview
  // step can recap the real per-audience/sub-cohort/channel mapping.
  const [contentAssignments, setContentAssignments] = useState<Record<string, string>>({});

  const openIndex = activeStep ? steps.findIndex((item) => item.id === activeStep) : -1;
  // What "Next step" acts on: the open card, or the furthest reached if all are collapsed.
  const nextFrom = openIndex === -1 ? furthestIndex : openIndex;
  const nextIsLaunch = nextFrom === steps.length - 1;

  // Only the footer *label* follows the step the user is viewing; expanding or
  // collapsing a card updates the word, not the bar. Tracked separately from
  // activeStep so collapsing (which clears activeStep) doesn't blank the label.
  const [progressStep, setProgressStep] = useState<StepId>("goal");
  useEffect(() => {
    if (activeStep) setProgressStep(activeStep);
  }, [activeStep]);
  const progressIndex = steps.findIndex((item) => item.id === progressStep);
  // The bar width tracks the furthest step reached (1-indexed) so it lines up
  // with the "Step N of 4" text and never changes when you just expand/collapse
  // a card — only advancing to a new step moves it.
  const reachedStep = furthestIndex + 1;
  const progressPct = Math.round((reachedStep / steps.length) * 100);
  const selectedAssetNames = useMemo(
    () => contentAssets.filter((asset) => selectedAssets.includes(asset.id)).map((asset) => asset.title),
    [selectedAssets],
  );

  const exitFlow = () => navigate("/decisioning-engine");

  const launch = () => {
    // Show the "engine is creating your objective" loader. The completion
    // (board navigation + success toast) is driven by LaunchOverlay once the
    // GIF has finished playing — see finishLaunch.
    setLaunching(true);
  };

  // Land the user on the objectives board with the new card and confirm the
  // launch. Called by LaunchOverlay after the GIF has played through, so the
  // success toast never appears before the animation finishes.
  const finishLaunch = () => {
    launchObjective({
      title: name,
      description:
        "Monitoring one-time buyers and triggering re-engagement across selected channels.",
      goal: intent,
      channels: selectedAssetNames.length
        ? "Email, App push, SMS, Web Push"
        : "Email",
    });
    exitFlow();
    toast.success("Your objective has been successfully launched", {
      icon: <Rocket className="h-4 w-4 text-[#2F68E5]" strokeWidth={2.5} />,
    });
  };

  const goToStep = (index: number) => {
    setActiveStep(steps[index].id);
    setFurthestIndex((current) => Math.max(current, index));
  };

  // Smooth-scroll a card's header just below the sticky navbar.
  const scrollToStep = (id: StepId) => {
    const container = rootRef.current;
    const el = cardRefs.current[id];
    if (!container || !el) return;
    const offset = 24; // breathing room above the card header
    const top = container.scrollTop + (el.getBoundingClientRect().top - container.getBoundingClientRect().top) - offset;
    container.scrollTo({ top, behavior: "smooth" });
  };

  // Scroll to `id` once the previously-active card's collapse animation
  // (.ov2-card-bodywrap's grid-template-rows transition) actually finishes,
  // rather than guessing a fixed delay. A heavy previous step (Content, with
  // its template-preview iframes) can take noticeably longer than the
  // nominal 340ms to actually settle, so a fixed timeout that works for a
  // light step (a form) can still fire mid-collapse for a heavy one — the
  // still-shrinking previous card then keeps shifting the target upward
  // after we've already scrolled, cropping its header above the viewport.
  // Falls back to a timeout in case the transition never fires (e.g. the
  // user has reduced-motion, which disables it) so the scroll always happens.
  const scrollToStepWhenSettled = (id: StepId, collapsingId: StepId) => {
    const bodywrap = cardRefs.current[collapsingId]?.querySelector<HTMLElement>(".ov2-card-bodywrap");
    const fallback = window.setTimeout(() => scrollToStep(id), 420);
    if (!bodywrap) return;
    const onEnd = (e: TransitionEvent) => {
      if (e.propertyName !== "grid-template-rows") return;
      window.clearTimeout(fallback);
      bodywrap.removeEventListener("transitionend", onEnd);
      scrollToStep(id);
    };
    bodywrap.addEventListener("transitionend", onEnd);
  };

  // Accordion header: open any card, or collapse it if it's already open.
  // No gating — the user can fill the steps in whatever order they like.
  const toggleStep = (index: number) => {
    setActiveStep((current) => (current === steps[index].id ? null : steps[index].id));
  };

  const moveNext = () => {
    if (nextIsLaunch) {
      launch();
      return;
    }
    if (advancing) return;
    // The card the user just tapped "Done" on is now finished.
    setCompletedSteps((prev) => new Set(prev).add(steps[nextFrom].id));
    // Open the next card right away (so its expand animation runs) but show a
    // skeleton in its body, then swap in the real content after a brief beat.
    const target = nextFrom + 1;
    const targetId = steps[target].id;
    // The audience step is AI-generated: hold on the generating state for 2 min
    // before the cards appear. The content step mounts immediately and runs its
    // own RHS "generating" loader. Other steps just get a brief skeleton beat.
    const usesSkeleton = targetId !== "content";
    const loadMs = targetId === "audience" ? AUDIENCE_GENERATING_MS : usesSkeleton ? 850 : 450;
    setAdvancing(true);
    if (usesSkeleton) setLoadingStep(targetId);
    goToStep(target);
    // Every step scrolls its card's header to the top, once the previous
    // card's own collapse has actually finished settling (see
    // scrollToStepWhenSettled) rather than after a guessed delay.
    scrollToStepWhenSettled(targetId, steps[nextFrom].id);
    window.setTimeout(() => {
      setLoadingStep(null);
      setAdvancing(false);
    }, loadMs);
  };

  // "Finish later" saves the current progress as a draft objective and returns
  // the user to the objectives board, where it shows up as a Draft card.
  const finishLater = () => {
    saveDraftObjective({
      title: name || "Untitled objective",
      description: `Draft — ${intent} objective, setup in progress.`,
    });
    exitFlow();
  };

  // A step reads as "complete" (green check + summary) only once it actually
  // has data — not merely because the user advanced past it.
  const isStepComplete = (id: StepId): boolean => {
    switch (id) {
      case "goal":
        return Boolean(intent && horizon && value);
      case "audience":
        return totalAudience > 0;
      case "content":
        return selectedAssetNames.length > 0;
      case "preview":
        return false;
    }
  };

  const summaryFor = (id: StepId): string => {
    switch (id) {
      case "goal":
        return [intent, horizon, value ? `value ${value}` : ""].filter(Boolean).join(" · ");
      case "audience":
        return `${activeAudienceCount} ${activeAudienceCount === 1 ? "audience" : "audiences"} · ${totalAudience.toLocaleString()} contacts selected`;
      case "content":
        return selectedAssetNames.length
          ? `${selectedAssetNames.length} channels mapped`
          : "No content mapped";
      case "preview":
        return "Ready to launch";
    }
  };

  return (
    <div className="objective-flow-v2">
      <header className="ov2-navbar">
        <div className="ov2-title-lockup">
          <span className="ov2-thumbnail"><Target /></span>
          <strong>Create objective</strong>
        </div>
        <div className="ov2-navbar-actions">
          <Button variant="outline" size="icon" aria-label="Close objective" onClick={exitFlow}><X /></Button>
        </div>
      </header>

      <main className="ov2-canvas" ref={rootRef}>
        <div className="ov2-heading">
          <h1>Set up your objective</h1>
          <p>Complete each step below. We'll open the next one as you go.</p>
        </div>

        <div className="ov2-accordion">
          {steps.map((item, index) => {
            const Icon = item.icon;
            const active = item.id === activeStep;
            // No locking: every card is openable. A collapsed card the user has
            // already advanced past reads as "visited" (check + summary line).
            // A collapsed card shows the green check + summary only once the
            // user has finished it (tapped Done) and it still holds valid data;
            // otherwise it keeps its icon + description.
            const complete = !active && completedSteps.has(item.id) && isStepComplete(item.id);
            const state = active ? "active" : complete ? "complete" : "idle";
            const summary = complete ? summaryFor(item.id) : "";

            return (
              <section
                key={item.id}
                ref={(el) => (cardRefs.current[item.id] = el)}
                className={`ov2-card ${state}`}
              >
                <button
                  type="button"
                  className="ov2-card-header"
                  aria-expanded={active}
                  onClick={() => toggleStep(index)}
                >
                  <span className="ov2-badge">
                    {complete ? <Check /> : <Icon />}
                  </span>
                  <span className="ov2-card-label">
                    <strong>{item.label}</strong>
                    {summary ? (
                      <span className="ov2-card-summary">{summary}</span>
                    ) : (
                      <span className="ov2-card-desc">{item.description}</span>
                    )}
                  </span>
                  <ChevronDown className="ov2-chevron" />
                </button>

                <div className={`ov2-card-bodywrap${active ? " open" : ""}`}>
                  <div className="ov2-card-bodywrap-inner">
                    {(loadingStep === item.id ? (
                        <div className="ov2-card-body">
                          {item.id === "audience" ? (
                            <AudienceGeneratingState />
                          ) : item.id === "preview" ? (
                            <PreviewLoadingState />
                          ) : (
                            <StepSkeleton stepId={item.id} />
                          )}
                        </div>
                      ) : (
                        <div className="ov2-card-body">
                    {item.id === "goal" && (
                      <div className="ov2-form-section">
                        <Field label="Goal" required>
                          <select value={intent} onChange={(event) => setIntent(event.target.value)}>
                            <option value="" disabled>Select a goal</option>
                            <option>Repeat purchase</option>
                            <option>Acquisition</option>
                            <option>Reactivation</option>
                            <option>Premium grow</option>
                          </select>
                        </Field>
                        <div className="ov2-two-fields">
                          <Field label="Horizon" required>
                            <select value={horizon} onChange={(event) => setHorizon(event.target.value)}>
                              <option value="" disabled>Select a horizon</option>
                              <option>45 days</option><option>60 days</option><option>90 days</option><option>120 days</option>
                            </select>
                          </Field>
                          <Field label="Value per conversion · relative" required>
                            <Input value={value} inputMode="numeric" placeholder="e.g. 40" onChange={(event) => setValue(event.target.value)} />
                          </Field>
                        </div>
                        <ToggleRow checked={arbitration} onCheckedChange={setArbitration} title="Arbitrate against my other objectives" description="Pick one best action per person across running goals." />
                      </div>
                    )}

                    {item.id === "audience" && (
                      <div className="ov2-form-section">
                        <div className="objective-personas">
                          {audiencePersonas.map((persona) => {
                            const enabled = personaEnabled[persona.id] ?? true;
                            return (
                              <div key={persona.id} className="objective-persona-card">
                                <div className="objective-persona-head">
                                  <div className="objective-persona-title">
                                    <Switch
                                      checked={enabled}
                                      onCheckedChange={(checked) =>
                                        setPersonaEnabled((current) => ({ ...current, [persona.id]: checked }))
                                      }
                                      aria-label={`Include ${persona.name}`}
                                    />
                                    <strong>{persona.name}</strong>
                                    <Info className="objective-persona-info" />
                                  </div>
                                  <div className="objective-reachable">
                                    <Users />
                                    <span>Reachable contacts</span>
                                    <b>{persona.reachable.toLocaleString()}</b>
                                  </div>
                                </div>
                                <div className="objective-persona-body">
                                  <div className="objective-persona-count">
                                    <span className="objective-persona-iconbox"><Users /></span>
                                    <div className="objective-persona-count-text">
                                      <strong>{persona.selected.toLocaleString()}</strong>
                                      <span>Selected audience</span>
                                    </div>
                                  </div>
                                </div>
                                <div className="objective-persona-cohorts">
                                  <p className="objective-persona-cohorts-title">
                                    Sub-cohorts ({persona.subCohorts.length})
                                  </p>
                                  {persona.subCohorts.map((cohort) => (
                                    <div key={cohort.label} className="objective-cohort-row">
                                      <span
                                        className="objective-cohort-dot"
                                        style={{ background: cohort.color }}
                                      />
                                      <span className="objective-cohort-label">{cohort.label}</span>
                                      <b className="objective-cohort-count">{cohort.count.toLocaleString()}</b>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        <div className="objective-audience-hint">
                          <Lightbulb />
                          <p>
                            {activeAudienceCount > 0 ? (
                              <>
                                You've selected <b>{totalAudience.toLocaleString()}</b> contacts across{" "}
                                <b>{activeAudienceCount}</b> {activeAudienceCount === 1 ? "audience" : "audiences"}.
                                Each audience total is the sum of its sub-cohorts. Turn an audience off to
                                exclude it and its sub-cohorts from this objective.
                              </>
                            ) : (
                              <>Turn on at least one audience to let the engine act on it.</>
                            )}
                          </p>
                        </div>

                        <div className="objective-exclude">
                          <strong>Exclude contacts</strong>
                          <div className="objective-exclude-row">
                            <div>
                              Exclude list/segment
                              <Info />
                            </div>
                            <Switch checked={excludeList} onCheckedChange={setExcludeList} aria-label="Exclude list/segment" />
                          </div>
                        </div>
                      </div>
                    )}

                    {item.id === "content" && (
                      <ContentMapping
                        active={activeStep === "content"}
                        audiences={contentAudiences}
                        onAssignmentsChange={setContentAssignments}
                      />
                    )}

                    {item.id === "preview" && (
                      <ObjectiveJourneyPreview
                        onEdit={(s: EditableStep) => goToStep(steps.findIndex((step) => step.id === s))}
                        audiences={contentAudiences}
                        assignments={contentAssignments}
                      />
                    )}

                    {item.id !== "preview" && (
                      <div className="ov2-card-actions">
                        <Button onClick={moveNext} disabled={advancing}>
                          {advancing && <Loader2 className="ov2-spinner" aria-hidden />}
                          Done
                        </Button>
                      </div>
                    )}
                        </div>
                      ))}
                  </div>
                </div>
              </section>
            );
          })}
        </div>
      </main>

      <footer className="ov2-footer">
        <div className="ov2-footer-progress">
          <div className="ov2-progress-track">
            <span className="ov2-progress-fill" style={{ width: `${progressPct}%` }} />
          </div>
          <strong className="ov2-progress-title">
            {steps[progressIndex].label} <span className="ov2-progress-dot">•</span> Step {progressIndex + 1} of {steps.length}
          </strong>
        </div>
        <div className="ov2-footer-actions">
          <span className="ov2-footer-hint">You can review everything before publishing.</span>
          <Button variant="outline" className="ov2-btn-secondary" onClick={finishLater} disabled={advancing}>Finish later</Button>
          {nextIsLaunch && (
            <Button className="ov2-btn-primary" onClick={moveNext} disabled={advancing}>
              {advancing && <Loader2 className="ov2-spinner" aria-hidden />}
              Launch objective
            </Button>
          )}
        </div>
      </footer>

      {launching && <LaunchOverlay onComplete={finishLaunch} />}
    </div>
  );
}

/**
 * Full-screen confirmation shown after "Launch objective": a 50% black overlay
 * with the engine loader GIF centered. Mirrors the original flow's overlay.
 */
function LaunchOverlay({ onComplete }: { onComplete: () => void }) {
  // Actual play length of objective-loader.gif (352 frames ≈ 11.76s, per
  // `gifsicle --info`). The GIF loops forever, so matching this lets one full
  // pass play before the overlay navigates away. No cache-buster on the src,
  // so the GIF is served from cache after the first launch and starts instantly.
  const GIF_DURATION_MS = 11760;
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    const timer = window.setTimeout(() => onCompleteRef.current(), GIF_DURATION_MS);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/50 animate-in fade-in duration-200">
      <img
        src="/objective-loader.gif"
        alt="Creating your objective"
        width={691}
        height={360}
        className="h-auto max-h-[80vh] w-[691px] max-w-[80vw] object-contain"
      />
    </div>
  );
}

/**
 * Placeholder shown in a step's body while it's "loading" after the user
 * advances. Full-bleed steps (Content/Preview) get a taller panel so the swap
 * to real content is a smaller jump; form steps get field-shaped rows.
 */
function StepSkeleton({ stepId }: { stepId: StepId }) {
  const panel = stepId === "content" || stepId === "preview";
  return (
    <div className={`ov2-skeleton${panel ? " panel" : ""}`} aria-hidden>
      {panel ? (
        <>
          <div className="ov2-sk-line ov2-sk-line-lg" />
          <div className="ov2-sk-block ov2-sk-panel" />
        </>
      ) : (
        <>
          <div className="ov2-sk-line ov2-sk-line-sm" />
          <div className="ov2-sk-block ov2-sk-input" />
          <div className="ov2-sk-line ov2-sk-line-sm" />
          <div className="ov2-sk-block ov2-sk-input" />
          <div className="ov2-sk-line ov2-sk-line-md" />
          <div className="ov2-sk-block ov2-sk-row" />
        </>
      )}
    </div>
  );
}

/** Shown while the Preview step is loading — a plain blue spinner, since the
    journey tree needs a layout pass and a shimmer skeleton can't approximate
    its shape the way it can for a form or a card grid. */
function PreviewLoadingState() {
  return (
    <div className="ov2-preview-loading" aria-hidden>
      <Loader2 className="ov2-spinner ov2-preview-spinner" />
    </div>
  );
}

/**
 * Shown while the audience step is "generating". Plays the Lottie loader and
 * steps through status copy so the 2-minute wait reads as active AI work.
 */
function AudienceGeneratingState() {
  const [phase, setPhase] = useState(0);
  useEffect(() => {
    // Cycle the status copy every few seconds so the 2-minute wait always reads
    // as active work, looping through the phases until the cards are revealed.
    const interval = window.setInterval(() => {
      setPhase((current) => (current + 1) % AUDIENCE_GENERATING_PHASES.length);
    }, 2000);
    return () => window.clearInterval(interval);
  }, []);
  return (
    <div className="ov2-generating">
      <DotLottieReact
        src="https://lottie.host/ca72f8ab-de1d-4726-abde-28daa4777c71/gap4SvooBh.lottie"
        autoplay
        loop
        className="ov2-generating-lottie"
      />
      <h3 className="ov2-generating-title">Generating your audience</h3>
      <p key={phase} className="ov2-generating-phase">
        {AUDIENCE_GENERATING_PHASES[phase]}…
      </p>
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return <label className="objective-field"><span>{label}{required && <b> *</b>}</span>{children}</label>;
}

function ToggleRow({ checked, onCheckedChange, title, description }: { checked: boolean; onCheckedChange: (value: boolean) => void; title: string; description: string }) {
  return <div className="objective-setting-row"><div><strong>{title}</strong><p>{description}</p></div><Switch checked={checked} onCheckedChange={onCheckedChange} aria-label={title} /></div>;
}
