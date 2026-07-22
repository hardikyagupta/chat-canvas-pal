import {
  Check,
  ChevronDown,
  ChevronUp,
  Eye,
  Info,
  Library,
  Lightbulb,
  Mail,
  MessageCircle,
  Sparkles,
  Target,
  Users,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import ContentMapping from "@/components/decisioning/ContentMapping";
import ObjectiveJourneyPreview, { type EditableStep } from "@/components/decisioning/ObjectiveJourneyPreview";
import { useDecisioningSetup } from "@/contexts/DecisioningSetupContext";
import "./objective-flow.css";

/**
 * Four-step objective creation flow (Goal → Audience → Content → Preview),
 * ported from the netcore-decisioning prototype. Styling lives in
 * objective-flow.css (objective-* classes); state is local to the component.
 */

type StepId = "goal" | "audience" | "content" | "preview";

const steps: { id: StepId; label: string; icon: typeof Target }[] = [
  { id: "goal", label: "Goal", icon: Target },
  { id: "audience", label: "Audience", icon: Users },
  { id: "content", label: "Content", icon: Library },
  { id: "preview", label: "Preview", icon: Eye },
];

const audienceType = "All contacts";

const audiencePersonas = [
  { id: "high-intent", name: "High-intent buyers", tag: "Primary", tone: "primary", reachable: 260889 },
  { id: "occasional", name: "Occasional buyers", tag: "Secondary", tone: "secondary", reachable: 9503 },
  { id: "price-sensitive", name: "Price Sensitive", tag: "Tertiary", tone: "tertiary", reachable: 260889 },
];

const contentAssets = [
  { id: "second-purchase", title: "Second-purchase offer", channel: "Email", icon: Mail },
  { id: "complete-set", title: "Complete-the-set recommendation", channel: "App push", icon: Sparkles },
  { id: "free-express", title: "Free-express unlock", channel: "WhatsApp", icon: MessageCircle },
];

export default function ObjectiveCreationFlow() {
  const navigate = useNavigate();
  const location = useLocation();
  const { launchObjective, saveDraftObjective } = useDecisioningSetup();
  const [step, setStep] = useState<StepId>("goal");
  // Arriving from an opportunity's "Create objective" CTA seeds the name with
  // that opportunity's title (see OpportunityCard).
  const [name] = useState(
    (location.state as { objectiveName?: string } | null)?.objectiveName ??
      "Win the second purchase"
  );
  const [intent, setIntent] = useState("Repeat purchase");
  const [horizon, setHorizon] = useState("90 days");
  const [value, setValue] = useState("40");
  const [arbitration, setArbitration] = useState(true);
  const [personaPct, setPersonaPct] = useState<Record<string, number>>({
    "high-intent": 30,
    occasional: 20,
    "price-sensitive": 8,
  });
  const [excludeList, setExcludeList] = useState(false);
  const [selectedAssets, setSelectedAssets] = useState<string[]>(contentAssets.map((asset) => asset.id));
  const [saved, setSaved] = useState("just now");
  const [summaryOpen, setSummaryOpen] = useState<Record<string, boolean>>({ goal: true, audience: false, content: false });
  const [launching, setLaunching] = useState(false);

  const personaCount = (id: string, reachable: number) => Math.round((reachable * (personaPct[id] ?? 0)) / 100);
  const totalAudience = audiencePersonas.reduce((sum, p) => sum + personaCount(p.id, p.reachable), 0);

  const activeIndex = steps.findIndex((item) => item.id === step);
  const isLast = activeIndex === steps.length - 1;
  const selectedAssetNames = useMemo(
    () => contentAssets.filter((asset) => selectedAssets.includes(asset.id)).map((asset) => asset.title),
    [selectedAssets],
  );

  useEffect(() => {
    setSummaryOpen({ goal: step === "goal", audience: step === "audience", content: step === "content" });
  }, [step]);

  const exitFlow = () => navigate("/decisioning-engine");

  const launch = () => {
    // Show the "engine is creating your objective" loader, then land the user
    // on the objectives board with the new card.
    setLaunching(true);
    window.setTimeout(() => {
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
    }, 11000);
  };

  const moveNext = () => {
    if (!isLast) setStep(steps[activeIndex + 1].id);
    else launch();
  };

  const primaryActionLabel = isLast ? "Launch objective" : "Next step";

  // "Finish later" saves the current progress as a draft objective and returns
  // the user to the objectives board, where it shows up as a Draft card.
  const finishLater = () => {
    saveDraftObjective({
      title: name || "Untitled objective",
      description: `Draft — ${intent} objective, setup in progress.`,
    });
    exitFlow();
  };

  return (
    <div className="objective-flow">
      <header className="objective-navbar">
        <div className="objective-title-lockup">
          <span className="objective-thumbnail"><Target /></span>
          <strong>Create objective</strong>
        </div>
        <div className="objective-navbar-actions">
          <Button variant="outline" onClick={finishLater}>Finish later</Button>
          <Button onClick={moveNext}>{primaryActionLabel}</Button>
          <Button variant="outline" size="icon" aria-label="Close objective" onClick={exitFlow}><X /></Button>
        </div>
      </header>

      <div className="objective-stepbar">
        <div className="objective-steps" role="tablist" aria-label="Objective creation steps">
          {steps.map((item, index) => {
            const Icon = item.icon;
            const complete = index < activeIndex;
            const active = item.id === step;
            return (
              <button
                key={item.id}
                role="tab"
                aria-selected={active}
                className={active ? "active" : complete ? "complete" : ""}
                onClick={() => setStep(item.id)}
              >
                <span>{complete || active ? <Check /> : <Icon />}</span>
                {item.label}
                {index < steps.length - 1 && <i />}
              </button>
            );
          })}
        </div>
        <div className="objective-save-state">
          <span>ID: OBJ-1042</span>
          <span><Check /> Last saved: {saved}</span>
        </div>
      </div>

      <main className="objective-canvas" data-step={step}>
        <section className="objective-work-column">
          {step === "content" ? (
            <ContentMapping />
          ) : step === "preview" ? (
            <ObjectiveJourneyPreview onEdit={(s: EditableStep) => setStep(s)} />
          ) : (
          <div className="objective-form-card">
            {step === "goal" && (
              <div className="objective-form-section">
                <SectionHeading title="Define the goal" description="The engine turns business value into a calibrated decision." />
                <Field label="Goal" required>
                  <select value={intent} onChange={(event) => setIntent(event.target.value)}>
                    <option>Repeat purchase</option>
                    <option>Acquisition</option>
                    <option>Reactivation</option>
                    <option>Premium grow</option>
                  </select>
                </Field>
                <div className="objective-two-fields">
                  <Field label="Horizon" required>
                    <select value={horizon} onChange={(event) => setHorizon(event.target.value)}>
                      <option>45 days</option><option>60 days</option><option>90 days</option><option>120 days</option>
                    </select>
                  </Field>
                  <Field label="Value per conversion · relative" required>
                    <Input value={value} inputMode="numeric" onChange={(event) => setValue(event.target.value)} />
                  </Field>
                </div>
                <ToggleRow checked={arbitration} onCheckedChange={setArbitration} title="Arbitrate against my other objectives" description="Pick one best action per person across running goals." />
              </div>
            )}

            {step === "audience" && (
              <div className="objective-form-section">
                <SectionHeading title="Audience personas" description="Adjust the audience for each persona using the slider." />

                <div className="objective-personas">
                  {audiencePersonas.map((persona) => {
                    const pct = personaPct[persona.id] ?? 0;
                    const count = personaCount(persona.id, persona.reachable);
                    return (
                      <div key={persona.id} className="objective-persona-card">
                        <div className="objective-persona-head">
                          <div className="objective-persona-title">
                            <strong>{persona.name}</strong>
                            <Info className="objective-persona-info" />
                            <span className={`objective-persona-tag ${persona.tone}`}>{persona.tag}</span>
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
                            <strong>{count.toLocaleString()}</strong>
                          </div>
                          <input
                            type="range"
                            min={0}
                            max={100}
                            value={pct}
                            onChange={(event) =>
                              setPersonaPct((current) => ({ ...current, [persona.id]: Number(event.target.value) }))
                            }
                            className="objective-slider"
                            style={{ ["--val" as string]: pct }}
                            aria-label={`${persona.name} audience size`}
                          />
                          <div className="objective-slider-labels">
                            <span>Focused audience</span>
                            <span>Maximum reach</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="objective-audience-hint">
                  <Lightbulb />
                  <p>
                    You're prioritizing high-intent buyers while keeping lower-intent personas
                    limited. This can improve conversion chances while controlling campaign cost.
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

          </div>
          )}
        </section>

        {step !== "content" && step !== "preview" && (
        <aside className="objective-summary">
          <div className="objective-summary-heading">
            <h2>Summary</h2>
            <p>An overview of this objective</p>
          </div>
          <SummarySection id="goal" label="Goal" open={summaryOpen.goal} onToggle={() => setSummaryOpen({ ...summaryOpen, goal: !summaryOpen.goal })}>
            <SummaryField label="Objective name" value={name || "Not set"} />
            <SummaryField label="Goal" value={intent} />
            <SummaryField label="Horizon" value={horizon} />
            <SummaryField label="Conversion value" value={value} />
            <SummaryField label="Arbitration" value={arbitration ? "Across all running objectives" : "Objective only"} />
          </SummarySection>
          <SummarySection id="audience" label="Audience" open={summaryOpen.audience} onToggle={() => setSummaryOpen({ ...summaryOpen, audience: !summaryOpen.audience })}>
            <SummaryField label="Source" value={audienceType} />
            {audiencePersonas.map((persona) => (
              <SummaryField key={persona.id} label={persona.name} value={personaCount(persona.id, persona.reachable).toLocaleString()} />
            ))}
            <SummaryField label="Total selected" value={totalAudience.toLocaleString()} />
            <SummaryField label="Exclusions" value={excludeList ? "List/segment excluded" : "None"} />
          </SummarySection>
          <SummarySection id="content" label="Content" open={summaryOpen.content} onToggle={() => setSummaryOpen({ ...summaryOpen, content: !summaryOpen.content })}>
            {selectedAssetNames.length ? selectedAssetNames.map((asset) => <SummaryField key={asset} label="Approved action" value={asset} />) : <p className="objective-empty">No approved actions selected.</p>}
          </SummarySection>
        </aside>
        )}
      </main>

      {launching && <LaunchOverlay />}
    </div>
  );
}

/**
 * Full-screen confirmation shown after "Launch objective": a 50% black overlay
 * with the engine loader GIF centered at its exact dimensions (1382×720). The
 * GIF carries its own messaging, so no extra copy is layered on top. Save the
 * loader to public/objective-loader.gif.
 */
function LaunchOverlay() {
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

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return <label className="objective-field"><span>{label}{required && <b> *</b>}</span>{children}</label>;
}

function SectionHeading({ title, description }: { title: string; description: string }) {
  return <div className="objective-section-heading"><div><h2>{title}</h2><p>{description}</p></div></div>;
}

function ToggleRow({ checked, onCheckedChange, title, description }: { checked: boolean; onCheckedChange: (value: boolean) => void; title: string; description: string }) {
  return <div className="objective-setting-row"><div><strong>{title}</strong><p>{description}</p></div><Switch checked={checked} onCheckedChange={onCheckedChange} aria-label={title} /></div>;
}

function SummarySection({ label, open, onToggle, children }: { id: string; label: string; open: boolean; onToggle: () => void; children: React.ReactNode }) {
  return <section className="objective-summary-section"><button onClick={onToggle}><strong>{label}</strong>{open ? <ChevronUp /> : <ChevronDown />}</button>{open && <div className="objective-summary-body">{children}</div>}</section>;
}

function SummaryField({ label, value }: { label: string; value: string }) {
  return <div className="objective-summary-field"><span>{label}</span><strong>{value}</strong></div>;
}
