import { useEffect, useMemo, useRef, useState } from "react";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import {
  Bell,
  Check,
  ChevronRight,
  Eye,
  Globe,
  Info,
  Mail,
  MessageSquare,
  Plus,
  Users,
} from "lucide-react";

/* The template editor opens in a new tab (stand-in for the real builder). */
const TEMPLATE_EDITOR_URL = "https://uce-email.lovable.app/";
const openTemplateEditor = () =>
  window.open(TEMPLATE_EDITOR_URL, "_blank", "noopener,noreferrer");
import TemplatePreviewSheet from "./TemplatePreviewSheet";
import TemplateFrame from "./TemplateFrame";
import { templateSrc } from "./emailTemplates";
import {
  TEMPLATES,
  poolFor as sharedPoolFor,
  resolveAssignedOrRecommended,
  slotKey,
  type Audience,
  type Template,
} from "./contentMappingRules";
import "./content-mapping.css";

/**
 * Content mapping — the Content step of the objective creation flow, built
 * around an audience-first mental model:
 *
 *   Audience   -> Channel -> Template   (the main-audience mapping)
 *   Sub-cohort -> Template              (inherits the parent's channel,
 *                                        overrides only the template)
 *
 * Layout (two columns):
 *   Left  — Audience groups. Selecting a group reveals its sub-cohorts, so the
 *           scope being mapped (main audience or a sub-cohort) is chosen here.
 *   Right — Content mapping for the active scope: a channel tab strip, a
 *           horizontal gallery of template suggestions for the channel, and the
 *           selected template previewed with its email body.
 *
 * Self-contained demo data; the card spans the full canvas (no RHS summary).
 */

const CHANNELS: { id: string; name: string; icon: typeof Mail }[] = [
  { id: "email", name: "Email", icon: Mail },
  { id: "sms", name: "SMS", icon: MessageSquare },
  { id: "push", name: "Push notification", icon: Bell },
  { id: "webpush", name: "Web push", icon: Globe },
];

// Numbers mirror the reference mockup so the flow reads as a faithful iteration.
const AUDIENCES: Audience[] = [
  {
    id: "high-intent",
    name: "High-intent buyers",
    count: 78267,
    subCohorts: [
      { id: "male", label: "Male users", count: 41582 },
      { id: "repeat", label: "Repeat buyers", count: 36685 },
    ],
  },
  { id: "occasional", name: "Occasional buyers", count: 52314, subCohorts: [] },
  { id: "price-sensitive", name: "Price sensitive buyers", count: 63921, subCohorts: [] },
];

// Template metadata, defaults, and pools are sourced from ./contentMappingRules
// (the shared registry also consumed by ObjectiveJourneyPreview), so the
// editor and the read-only recap never drift apart.

// On entering the Content step the engine "generates" the template mapping:
// the RHS plays a Lottie loader for this long, then reveals the templates.
const GENERATING_MS = 4_000;
const GENERATING_PHASES = [
  "Reading your audiences and sub-cohorts",
  "Scoring templates by channel performance",
  "Matching the best template to each group",
  "Finalizing your content mapping",
];

function formatCount(n: number) {
  return n.toLocaleString();
}

export default function ContentMapping({
  active,
  audiences,
  onAssignmentsChange,
}: {
  active?: boolean;
  /** Audience groups to map, sourced from the Audience step. Falls back to the
      built-in demo data when the component is rendered standalone. */
  audiences?: Audience[];
  /** Fired whenever the assignments map changes, with the full current map
      (keyed by slotKey(audienceId, channelId, scope) -> templateId), so a
      parent flow can recap the real mapping in a Preview step. */
  onAssignmentsChange?: (assignments: Record<string, string>) => void;
} = {}) {
  const groups = audiences && audiences.length > 0 ? audiences : AUDIENCES;
  const [activeAudienceId, setActiveAudienceId] = useState(groups[0].id);
  const [activeChannelId, setActiveChannelId] = useState("email");
  // Which scope within the active audience is being mapped/previewed:
  // "parent" (the main audience) or a sub-cohort id.
  const [selectedScope, setSelectedScope] = useState<string>("parent");
  // Explicit template assignments keyed by slot. Absent parent slot -> channel
  // default; absent cohort slot -> inherits the main-audience template.
  const [assignments, setAssignments] = useState<Record<string, string>>({});
  const [previewOpen, setPreviewOpen] = useState(false);
  // Which template the side panel is previewing (set when the eye is tapped).
  const [previewId, setPreviewId] = useState<string | null>(null);
  // The engine "generates" the mapping when the step is first opened: the RHS
  // shows a Lottie loader for GENERATING_MS, then the templates rise into view.
  // Gated on the step becoming active (the accordion keeps this mounted the
  // whole time), so the timer starts on arrival — not at flow load. When no
  // `active` prop is supplied, generation runs once on mount.
  const [generating, setGenerating] = useState(false);
  const [revealing, setRevealing] = useState(false);
  const [genPhase, setGenPhase] = useState(0);
  const startedRef = useRef(false);
  const timersRef = useRef<{ done?: number; cycle?: number }>({});
  const genRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const shouldStart = active === undefined ? true : active;
    if (!shouldStart || startedRef.current) return;
    startedRef.current = true;
    setGenerating(true);
    // Timers live in a ref and are cleared only on unmount, so collapsing the
    // card (which flips `active`) never interrupts an in-flight generation.
    timersRef.current.cycle = window.setInterval(() => {
      setGenPhase((p) => (p + 1) % GENERATING_PHASES.length);
    }, GENERATING_MS / GENERATING_PHASES.length);
    timersRef.current.done = window.setTimeout(() => {
      setGenerating(false);
      setRevealing(true);
      window.clearInterval(timersRef.current.cycle);
    }, GENERATING_MS);
  }, [active]);

  // Clear any pending timers if the flow unmounts mid-generation.
  useEffect(() => () => {
    window.clearTimeout(timersRef.current.done);
    window.clearInterval(timersRef.current.cycle);
  }, []);

  // Scroll the generating animation into view when it starts, so arriving from
  // the Audience step lands the user right on the loader (no manual scroll).
  // Aligned to the top ("start"), not centered — centering could scroll the
  // card's own header (and the left audience column) above the viewport,
  // cropping the step instead of landing cleanly at its top.
  useEffect(() => {
    if (!generating) return;
    const t = window.setTimeout(
      () => genRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }),
      100,
    );
    return () => window.clearTimeout(t);
  }, [generating]);

  // Clear the reveal flag once the staggered entrance has finished, so later
  // channel/scope changes don't replay the animation.
  useEffect(() => {
    if (!revealing) return;
    const t = window.setTimeout(() => setRevealing(false), 1600);
    return () => window.clearTimeout(t);
  }, [revealing]);

  // If the active audience is turned off in the Audience step (so it's no longer
  // in `groups`), fall back to the first remaining group.
  useEffect(() => {
    if (!groups.some((a) => a.id === activeAudienceId)) {
      setActiveAudienceId(groups[0].id);
      setSelectedScope("parent");
    }
  }, [groups, activeAudienceId]);

  // Notify the parent flow of the live mapping so a Preview step can recap it.
  // Depends only on `assignments` — a parent re-render that hands down a new
  // `onAssignmentsChange` identity must not re-arm this effect.
  useEffect(() => {
    onAssignmentsChange?.(assignments);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assignments]);

  const channel = useMemo(
    () => CHANNELS.find((c) => c.id === activeChannelId) ?? CHANNELS[0],
    [activeChannelId],
  );

  // The pool of template IDs offered for the active channel. Email rotates its
  // 4 suggestions by the active audience's position so all 8 templates surface;
  // other channels use their fixed pool.
  const poolFor = (channelId: string): string[] => sharedPoolFor(channelId, groups, activeAudienceId);

  const resolveTemplate = (scope: string): Template =>
    resolveAssignedOrRecommended(groups, assignments, activeAudienceId, activeChannelId, scope).template;

  const galleryTemplates = poolFor(activeChannelId).map((id) => TEMPLATES[id]);

  const changeAudience = (id: string) => {
    setActiveAudienceId(id);
    setSelectedScope("parent");
  };
  const changeChannel = (id: string) => {
    setActiveChannelId(id);
  };

  const assignTemplate = (templateId: string) => {
    setAssignments((prev) => ({
      ...prev,
      [slotKey(activeAudienceId, activeChannelId, selectedScope)]: templateId,
    }));
  };

  const selectedTemplate = resolveTemplate(selectedScope);
  const previewTemplate = previewId ? TEMPLATES[previewId] : selectedTemplate;

  const openPreview = (id: string) => {
    setPreviewId(id);
    setPreviewOpen(true);
  };

  return (
    <div className="content-mapping">
      {/* ---- Left: audience groups ---- */}
      <aside className="cm-audiences">
        <div className="cm-col-head">
          <h2 className="cm-col-title">
            Audience groups <Info className="cm-col-info" strokeWidth={2} />
          </h2>
          <p className="cm-col-desc">Select an audience group to map templates.</p>
        </div>

        <div className="cm-audience-list" role="tablist" aria-label="Audience groups" aria-orientation="vertical">
          {groups.map((a) => {
            const active = a.id === activeAudienceId;
            // The audience header is itself the "main audience" scope: when the
            // group is active, clicking it maps the parent, and sub-cohorts
            // branch below it in a tree. All three scopes are clickable.
            return (
              <div key={a.id} className={`cm-audience-block${active ? " active" : ""}`}>
                <button
                  role="tab"
                  aria-selected={active}
                  className={`cm-audience${active && selectedScope === "parent" ? " selected" : ""}`}
                  onClick={() => changeAudience(a.id)}
                >
                  <span className="cm-audience-icon"><Users strokeWidth={1.8} /></span>
                  <span className="cm-audience-text">
                    <span className="cm-audience-name">{a.name}</span>
                    <span className="cm-audience-count">{formatCount(a.count)} contacts</span>
                  </span>
                  <ChevronRight className="cm-audience-caret" strokeWidth={2.2} />
                </button>

                {/* Sub-cohorts branching from the parent, shown when active. */}
                {active && a.subCohorts.length > 0 && (
                  <div className="cm-scopes" role="group" aria-label={`${a.name} sub-cohorts`}>
                    {a.subCohorts.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        className={`cm-scope${selectedScope === c.id ? " selected" : ""}`}
                        onClick={() => setSelectedScope(c.id)}
                      >
                        <span className="cm-scope-icon"><Users strokeWidth={1.8} /></span>
                        <span className="cm-scope-text">
                          <span className="cm-scope-name">{c.label}</span>
                          <span className="cm-scope-count">{formatCount(c.count)} contacts</span>
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </aside>

      {/* ---- Right: content mapping ---- */}
      <section className="cm-mapping">
        <div className="cm-mapping-head">
          <h2 className="cm-col-title">Content mapping</h2>
          <p className="cm-col-desc">
            {generating
              ? "The engine is generating the best template mapping for your audiences…"
              : "Choose the best template for each audience and sub-cohort for the selected channel."}
          </p>
        </div>

        {generating ? (
          <div className="cm-generating" ref={genRef}>
            <div className="cm-generating-head">
              <DotLottieReact
                src="https://lottie.host/2ed9bd4a-4a11-4c6d-b4ce-edda1265efc7/YkJRtgMQvS.lottie"
                autoplay
                loop
                className="cm-generating-lottie"
              />
              <h3 className="cm-generating-title">Generating templates</h3>
              <p key={genPhase} className="cm-generating-phase">{GENERATING_PHASES[genPhase]}…</p>
            </div>
            <div className="cm-skeleton-grid" aria-hidden>
              {Array.from({ length: 3 }).map((_, i) => (
                <div className="cm-skel-card" key={i}>
                  <div className="cm-skel-thumb" />
                  <div className="cm-skel-foot">
                    <span className="cm-skel-line" />
                    <span className="cm-skel-line short" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <>
        {/* Channel tab strip */}
        <div className="cm-channels" role="tablist" aria-label="Channels">
          {CHANNELS.map((c) => {
            const Icon = c.icon;
            const active = c.id === activeChannelId;
            return (
              <button
                key={c.id}
                role="tab"
                aria-selected={active}
                className={`cm-channel${active ? " active" : ""}`}
                onClick={() => changeChannel(c.id)}
              >
                <Icon strokeWidth={1.8} />
                {c.name}
              </button>
            );
          })}
        </div>

        <div className="cm-note">
          <Info strokeWidth={1.8} />
          <p>Each audience group and sub-cohort can have its own template for this channel.</p>
        </div>

        {/* Template suggestion gallery for the active scope + channel. Each card
            shows a live preview of the email; hovering reveals an eye button
            that opens the full template in the side panel. */}
        <div className="cm-gallery">
          {galleryTemplates.map((t, i) => {
            const chosen = t.id === selectedTemplate.id;
            return (
              <div
                key={t.id}
                role="button"
                tabIndex={0}
                aria-pressed={chosen}
                className={`cm-card${chosen ? " chosen" : ""}${revealing ? " rise" : ""}`}
                style={revealing ? { animationDelay: `${i * 90}ms` } : undefined}
                onClick={() => assignTemplate(t.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") { e.preventDefault(); assignTemplate(t.id); }
                }}
              >
                <div className="cm-card-thumb">
                  <TemplateFrame mode="thumb" src={templateSrc(t.id) ?? ""} title={t.name} />
                  {chosen && <span className="cm-card-check"><Check strokeWidth={3} /></span>}
                  <span className="cm-card-overlay">
                    <span
                      className="cm-card-eye"
                      role="button"
                      tabIndex={0}
                      aria-label={`Preview ${t.name}`}
                      onClick={(e) => { e.stopPropagation(); openPreview(t.id); }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); e.stopPropagation(); openPreview(t.id); }
                      }}
                    >
                      <Eye strokeWidth={2} />
                    </span>
                  </span>
                </div>
                <div className="cm-card-foot">
                  <span className="cm-card-name">{t.name}</span>
                  <span className="cm-card-id">ID: {t.id}</span>
                </div>
              </div>
            );
          })}
          <button
            type="button"
            className={`cm-card cm-card-create${revealing ? " rise" : ""}`}
            style={revealing ? { animationDelay: `${galleryTemplates.length * 90}ms` } : undefined}
            onClick={openTemplateEditor}
          >
            <span className="cm-card-plus"><Plus strokeWidth={2} /></span>
            <span className="cm-card-name cm-card-create-name">Create template</span>
            <span className="cm-card-id">Build your own</span>
          </button>
        </div>
          </>
        )}
      </section>

      <TemplatePreviewSheet
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        mappedName={previewTemplate.name}
        mappedId={previewTemplate.id}
        channelName={channel.name}
        templateSrc={templateSrc(previewTemplate.id)}
      />
    </div>
  );
}
