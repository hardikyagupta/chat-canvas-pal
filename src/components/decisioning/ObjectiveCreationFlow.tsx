import {
  BadgeCheck,
  Check,
  ChevronDown,
  ChevronUp,
  Library,
  LoaderCircle,
  Mail,
  MessageCircle,
  MoreHorizontal,
  ShieldCheck,
  Sparkles,
  Target,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import "./objective-flow.css";

/**
 * Four-step objective creation flow (Goal → Guardrails → Content pool →
 * Validation), ported from the netcore-decisioning prototype. Styling lives in
 * objective-flow.css (objective-* classes); state is local to the component.
 */

type StepId = "goal" | "guardrails" | "content" | "validation";

const steps: { id: StepId; label: string; icon: typeof Target }[] = [
  { id: "goal", label: "Goal", icon: Target },
  { id: "guardrails", label: "Guardrails", icon: ShieldCheck },
  { id: "content", label: "Content pool", icon: Library },
  { id: "validation", label: "Validation", icon: BadgeCheck },
];

const contentAssets = [
  { id: "second-purchase", title: "Second-purchase offer", channel: "Email", icon: Mail },
  { id: "complete-set", title: "Complete-the-set recommendation", channel: "App push", icon: Sparkles },
  { id: "free-express", title: "Free-express unlock", channel: "WhatsApp", icon: MessageCircle },
];

const validationCohorts = [
  { name: "Recent one-time buyers", size: "182K", lift: "3.4×", driver: "recency + category affinity", when: "within 14 days" },
  { name: "Considered browsers", size: "121K", lift: "2.1×", driver: "high email engagement", when: "next known occasion" },
  { name: "Lapsing repeaters", size: "94K", lift: "1.6×", driver: "declining order frequency", when: "before day 30" },
  { name: "Cold / no purchase history", size: "143K", lift: "1.2×", driver: "grounded occasion prior", when: "on next occasion" },
];

export default function ObjectiveCreationFlow() {
  const navigate = useNavigate();
  const [step, setStep] = useState<StepId>("goal");
  const [name, setName] = useState("Win the second purchase");
  const [intent, setIntent] = useState("Repeat purchase");
  const [horizon, setHorizon] = useState("90 days");
  const [value, setValue] = useState("40");
  const [arbitration, setArbitration] = useState(true);
  const [consent, setConsent] = useState(true);
  const [selectedAssets, setSelectedAssets] = useState<string[]>(contentAssets.map((asset) => asset.id));
  const [saved, setSaved] = useState("just now");
  const [validating, setValidating] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState<Record<string, boolean>>({ goal: true, guardrails: false, content: false, validation: false, engine: false });

  const activeIndex = steps.findIndex((item) => item.id === step);
  const isLast = activeIndex === steps.length - 1;
  const selectedAssetNames = useMemo(
    () => contentAssets.filter((asset) => selectedAssets.includes(asset.id)).map((asset) => asset.title),
    [selectedAssets],
  );

  useEffect(() => {
    setSummaryOpen({ goal: step === "goal", guardrails: step === "guardrails", content: step === "content", validation: step === "validation", engine: false });
  }, [step]);

  const exitFlow = () => navigate("/decisioning-engine");

  const moveNext = () => {
    if (validating) return;
    if (step === "content") {
      setValidating(true);
      window.setTimeout(() => {
        setSaved("validated just now");
        setStep("validation");
        setValidating(false);
      }, 1400);
      return;
    }
    if (!isLast) setStep(steps[activeIndex + 1].id);
    else exitFlow();
  };

  const primaryActionLabel = validating ? "Validating plan" : step === "content" ? "Validate plan" : isLast ? "Finish" : "Next step";

  const toggleAsset = (id: string) => {
    setSelectedAssets((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  };

  const save = () => setSaved("just now");

  return (
    <div className="objective-flow">
      <header className="objective-navbar">
        <div className="objective-title-lockup">
          <span className="objective-thumbnail"><Target /></span>
          <strong>{name || "Untitled objective"}</strong>
        </div>
        <div className="objective-navbar-actions">
          <Button variant="outline" onClick={save}>Finish later</Button>
          <Button onClick={moveNext} disabled={validating}>{validating ? <LoaderCircle className="objective-spinner" /> : null}{primaryActionLabel}</Button>
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

      <main className="objective-canvas">
        <section className="objective-work-column">
          <div className="objective-form-card">
            {step === "goal" && (
              <div className="objective-form-section">
                <SectionHeading title="Define the goal" description="The engine turns business value into a calibrated decision." />
                <Field label="Objective name" required>
                  <div className="counted-input">
                    <Input value={name} onChange={(event) => setName(event.target.value.slice(0, 100))} />
                    <span>{name.length}/100</span>
                  </div>
                </Field>
                <Field label="Intent" required>
                  <div className="objective-choice-row">
                    {["Repeat purchase", "Acquisition", "Reactivation", "Premium grow"].map((item) => (
                      <button key={item} className={intent === item ? "selected" : ""} onClick={() => setIntent(item)}>{item}{intent === item && <Check />}</button>
                    ))}
                  </div>
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

            {step === "guardrails" && (
              <div className="objective-form-section">
                <SectionHeading title="Guardrails & control" description="These policies are evaluated before every score becomes an action." />
                <ToggleRow checked={consent} onCheckedChange={setConsent} title="Require marketing consent" description="Exclude customers without active marketing consent before scoring." />
                <SettingRow title="Frequency cap" description="Maximum communication pressure across routed channels" value="Max 3 / week" />
                <SettingRow title="Quiet hours" description="Customer-local delivery suppression window" value="9:00pm – 8:00am" />
                <SettingRow title="Governance hold-out" description="Do-nothing control used to measure true incremental lift" value="10%" />
                <div className="objective-note"><ShieldCheck /><p><strong>Inherited policy floor.</strong> Objective controls can be stricter than workspace defaults, never looser.</p></div>
              </div>
            )}

            {step === "content" && (
              <div className="objective-form-section">
                <SectionHeading title="Approved content pool" description="Make actions available. Assignment happens after cohort discovery." />
                <div className="objective-assets">
                  {contentAssets.map((asset) => {
                    const Icon = asset.icon;
                    const selected = selectedAssets.includes(asset.id);
                    return (
                      <button key={asset.id} className={selected ? "selected" : ""} onClick={() => toggleAsset(asset.id)}>
                        <span><Icon /></span>
                        <div><strong>{asset.title}</strong><small>{asset.channel} · approved creative</small></div>
                        <em>{selected ? <Check /> : null}</em>
                        <MoreHorizontal />
                      </button>
                    );
                  })}
                </div>
                <Button variant="outline" className="objective-library-button"><Library /> Pull from Content library</Button>
                <div className="objective-note"><Sparkles /><p><strong>No manual targeting here.</strong> The engine discovers cohorts first, then optimizes offer × channel × timing for each person.</p></div>
              </div>
            )}

            {step === "validation" && (
              <div className="objective-validation-view">
                <div className="objective-validation-banner">
                  <span><Check /></span>
                  <div>
                    <strong>Validation complete — before you spend</strong>
                    <p>Trained and leakage-checked on a hold-out. Nothing has been sent yet.</p>
                  </div>
                </div>
                <div className="objective-validation-metrics">
                  <ValidationMetric label="Predicted lift" value="2.7×" positive />
                  <ValidationMetric label="Model quality (AUC)" value="0.71" />
                  <ValidationMetric label="Eligible audience" value="540K" />
                  <ValidationMetric label="In hold-out (control)" value="54K" />
                </div>
                <div className="objective-validation-table-wrap">
                  <table className="objective-validation-table">
                    <thead><tr><th>Auto-discovered cohort</th><th>Size</th><th>Lift</th><th>Top "why" driver</th><th>Best "when"</th></tr></thead>
                    <tbody>{validationCohorts.map((cohort) => <tr key={cohort.name}><td>{cohort.name}</td><td>{cohort.size}</td><td>{cohort.lift}</td><td>{cohort.driver}</td><td>{cohort.when}</td></tr>)}</tbody>
                  </table>
                </div>
              </div>
            )}

            {validating && (
              <div className="objective-validating-overlay" role="status" aria-live="polite">
                <div className="objective-validating-card">
                  <LoaderCircle className="objective-spinner" />
                  <strong>Validating plan</strong>
                  <p>Training the model, checking leakage, and evaluating the hold-out.</p>
                  <div><span /></div>
                </div>
              </div>
            )}

          </div>
        </section>

        <aside className="objective-summary">
          <div className="objective-summary-heading">
            <h2>Summary</h2>
            <p>An overview of this objective</p>
          </div>
          <SummarySection id="goal" label="Goal" open={summaryOpen.goal} onToggle={() => setSummaryOpen({ ...summaryOpen, goal: !summaryOpen.goal })}>
            <SummaryField label="Objective name" value={name || "Not set"} />
            <SummaryField label="Intent" value={intent} />
            <SummaryField label="Horizon" value={horizon} />
            <SummaryField label="Conversion value" value={value} />
            <SummaryField label="Arbitration" value={arbitration ? "Across all running objectives" : "Objective only"} />
          </SummarySection>
          <SummarySection id="guardrails" label="Guardrails" open={summaryOpen.guardrails} onToggle={() => setSummaryOpen({ ...summaryOpen, guardrails: !summaryOpen.guardrails })}>
            <SummaryField label="Consent" value={consent ? "Required" : "Workspace default"} />
            <SummaryField label="Frequency cap" value="Max 3 / week" />
            <SummaryField label="Quiet hours" value="9:00pm – 8:00am" />
            <SummaryField label="Hold-out" value="10%" />
          </SummarySection>
          <SummarySection id="content" label="Content pool" open={summaryOpen.content} onToggle={() => setSummaryOpen({ ...summaryOpen, content: !summaryOpen.content })}>
            {selectedAssetNames.length ? selectedAssetNames.map((asset) => <SummaryField key={asset} label="Approved action" value={asset} />) : <p className="objective-empty">No approved actions selected.</p>}
          </SummarySection>
          <SummarySection id="validation" label="Validation" open={summaryOpen.validation} onToggle={() => setSummaryOpen({ ...summaryOpen, validation: !summaryOpen.validation })}>
            <SummaryField label="Status" value="Complete" />
            <SummaryField label="Predicted lift" value="2.7×" />
            <SummaryField label="Model quality" value="0.71 AUC" />
            <SummaryField label="Eligible audience" value="540K" />
            <SummaryField label="Hold-out control" value="54K" />
          </SummarySection>
          <SummarySection id="engine" label="Automated by the engine" open={summaryOpen.engine} onToggle={() => setSummaryOpen({ ...summaryOpen, engine: !summaryOpen.engine })}>
            <ul className="objective-engine-list">
              <li>Derives point-in-time eligible customers</li>
              <li>Builds cohorts and sub-cohorts</li>
              <li>Calibrates propensity, why, and when</li>
              <li>Validates lift on the hold-out</li>
              <li>Picks one best action per person</li>
            </ul>
          </SummarySection>
          <div className="objective-audience-estimate">
            <span>ESTIMATED ELIGIBLE AUDIENCE</span>
            <strong>≈ 540K one-time buyers</strong>
            <small>Derived from grounded context v3</small>
          </div>
        </aside>
      </main>
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

function SettingRow({ title, description, value }: { title: string; description: string; value: string }) {
  return <div className="objective-setting-row"><div><strong>{title}</strong><p>{description}</p></div><button>{value}<ChevronDown /></button></div>;
}

function SummarySection({ label, open, onToggle, children }: { id: string; label: string; open: boolean; onToggle: () => void; children: React.ReactNode }) {
  return <section className="objective-summary-section"><button onClick={onToggle}><strong>{label}</strong>{open ? <ChevronUp /> : <ChevronDown />}</button>{open && <div className="objective-summary-body">{children}</div>}</section>;
}

function SummaryField({ label, value }: { label: string; value: string }) {
  return <div className="objective-summary-field"><span>{label}</span><strong>{value}</strong></div>;
}

function ValidationMetric({ label, value, positive }: { label: string; value: string; positive?: boolean }) {
  return <div className="objective-validation-metric"><span>{label}</span><strong className={positive ? "positive" : ""}>{value}</strong></div>;
}
