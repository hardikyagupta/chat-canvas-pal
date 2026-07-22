import { useCallback, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  Bell,
  Eye,
  FileText,
  Globe,
  Hand,
  Layers,
  Mail,
  MessageSquare,
  Pencil,
  Target,
  Users,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import TemplatePreviewSheet from "./TemplatePreviewSheet";
import { EMAIL_TEMPLATES, templateSrc } from "./emailTemplates";
import "./objective-journey-preview.css";

/**
 * Objective Journey Preview — the Preview step of the objective/new flow only.
 * Unlike the shared JourneyPreview, this one mirrors the audience-first
 * ContentMapping model as a top-down flow:
 *
 *   Goal → Audience → Sub-cohort → Channel → Template
 *
 * Audiences with no sub-cohorts collapse to a single "All contacts" branch.
 * Connectors are curved SVG paths measured from the laid-out nodes (so they
 * never break or gap), the canvas pans with a hand tool, and zoom scales the
 * whole graph. Scoped so the other flows and the performance page are untouched.
 */

export type EditableStep = "goal" | "audience" | "content";

type SubCohort = { id: string; label: string; count: number };
type Audience = { id: string; name: string; count: number; subCohorts: SubCohort[] };

// Mirrors the ContentMapping data so the recap is faithful to what was mapped.
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
  { id: "price-sensitive", name: "Price sensitive", count: 63921, subCohorts: [] },
];

const CHANNELS: { id: string; name: string; icon: typeof Mail; tone: string }[] = [
  { id: "email", name: "Email", icon: Mail, tone: "purple" },
  { id: "sms", name: "SMS", icon: MessageSquare, tone: "pink" },
  { id: "push", name: "Push notification", icon: Bell, tone: "blue" },
  { id: "webpush", name: "Web push", icon: Globe, tone: "orange" },
];

// Template names/IDs come from the shared registry so node labels match the
// real templates previewed in the side panel.
const TEMPLATES = EMAIL_TEMPLATES;

const CHANNEL_DEFAULT: Record<string, string> = {
  email: "868",
  sms: "742",
  push: "915",
  webpush: "603",
};

// Sub-cohort template overrides, keyed audience::cohort::channel — matches the
// one seeded override in ContentMapping (High-intent · Repeat buyers · Email).
const OVERRIDES: Record<string, string> = {
  "high-intent::repeat::email": "912",
};

function formatCount(n: number) {
  return n.toLocaleString();
}

/** Resolve the template for an audience/cohort/channel, flagging overrides. */
function resolveTemplate(audienceId: string, cohortId: string, channelId: string) {
  const overrideId = OVERRIDES[`${audienceId}::${cohortId}::${channelId}`];
  const id = overrideId ?? CHANNEL_DEFAULT[channelId];
  return { ...TEMPLATES[id], override: Boolean(overrideId) };
}

/** Cohorts to fan out for an audience; audiences with none get one "All" branch. */
function cohortsOf(audience: Audience): SubCohort[] {
  return audience.subCohorts.length > 0
    ? audience.subCohorts
    : [{ id: "all", label: "All contacts", count: audience.count }];
}

type TreeNode = {
  key: string;
  kind: "goal" | "audience" | "cohort" | "channel" | "template";
  icon: typeof Target;
  tone: string;
  title: string;
  value?: string;
  badge?: string;
  onOpen?: () => void;
  editable?: boolean;
  children?: TreeNode[];
};

function NodeCard({
  node,
  innerRef,
}: {
  node: TreeNode;
  innerRef: (el: HTMLElement | null) => void;
}) {
  const Icon = node.icon;
  const isTemplate = node.kind === "template";
  const interactive = Boolean(node.onOpen);

  const body = (
    <>
      <span className="oj-icon">
        <Icon strokeWidth={1.9} />
      </span>
      <span className="oj-card-text">
        <strong>{node.title}</strong>
        {node.value ? <span>{node.value}</span> : null}
      </span>
      {node.badge ? <span className="oj-badge">{node.badge}</span> : null}
      {isTemplate ? (
        <span className="oj-eye" aria-hidden>
          <Eye strokeWidth={1.9} />
        </span>
      ) : node.editable ? (
        <span className="oj-edit" aria-hidden>
          <Pencil strokeWidth={1.9} />
        </span>
      ) : null}
    </>
  );

  if (!interactive) {
    return (
      <div ref={innerRef} className={`oj-card kind-${node.kind} tone-${node.tone}`}>
        {body}
      </div>
    );
  }

  return (
    <button
      ref={innerRef as (el: HTMLButtonElement | null) => void}
      type="button"
      className={`oj-card kind-${node.kind} tone-${node.tone} interactive`}
      onClick={node.onOpen}
      aria-label={isTemplate ? `Preview ${node.title} template` : `Edit ${node.title}`}
    >
      {body}
    </button>
  );
}

/** Recursive branch: a node stacked above the row of its children. */
function TreeBranch({
  node,
  register,
}: {
  node: TreeNode;
  register: (key: string) => (el: HTMLElement | null) => void;
}) {
  const children = node.children ?? [];
  return (
    <div className="oj-subtree">
      <NodeCard node={node} innerRef={register(node.key)} />
      {children.length > 0 && (
        <div className="oj-children">
          {children.map((child) => (
            <div key={child.key} className="oj-branch">
              <TreeBranch node={child} register={register} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/** Flatten parent→child links so the SVG layer can draw a curve per edge. */
function collectEdges(node: TreeNode, acc: { from: string; to: string }[] = []) {
  for (const child of node.children ?? []) {
    acc.push({ from: node.key, to: child.key });
    collectEdges(child, acc);
  }
  return acc;
}

export default function ObjectiveJourneyPreview({
  onEdit,
  editable = true,
}: {
  onEdit: (step: EditableStep) => void;
  editable?: boolean;
}) {
  const [preview, setPreview] = useState<
    { name: string; id: string; channel: string } | null
  >(null);

  const ZOOM_MIN = 0.25;
  const ZOOM_MAX = 1;
  const ZOOM_STEP = 0.15;
  const [zoom, setZoom] = useState(0.45);
  const clampZoom = (z: number) =>
    Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, Math.round(z * 100) / 100));
  // Live zoom for the measurement pass (which reads on-screen, scaled rects and
  // divides them back into the unscaled layout space the SVG draws in).
  const zoomRef = useRef(zoom);
  zoomRef.current = zoom;

  const [panMode, setPanMode] = useState(true);

  const goEdit = (step: EditableStep) => (editable ? () => onEdit(step) : undefined);

  const tree = useMemo<TreeNode>(
    () => ({
      key: "goal",
      kind: "goal",
      icon: Target,
      tone: "blue",
      title: "Goal",
      value: "Win the second purchase",
      editable,
      onOpen: goEdit("goal"),
      children: AUDIENCES.map((audience) => ({
        key: `aud-${audience.id}`,
        kind: "audience",
        icon: Users,
        tone: "purple",
        title: audience.name,
        value: `${formatCount(audience.count)} contacts`,
        editable,
        onOpen: goEdit("audience"),
        children: cohortsOf(audience).map((cohort) => ({
          key: `coh-${audience.id}-${cohort.id}`,
          kind: "cohort",
          icon: Layers,
          tone: "teal",
          title: cohort.label,
          value: `${formatCount(cohort.count)} contacts`,
          editable,
          onOpen: goEdit("audience"),
          children: CHANNELS.map((channel) => {
            const template = resolveTemplate(audience.id, cohort.id, channel.id);
            return {
              // Channels are context only — no click/edit affordance.
              key: `ch-${audience.id}-${cohort.id}-${channel.id}`,
              kind: "channel",
              icon: channel.icon,
              tone: channel.tone,
              title: channel.name,
              children: [
                {
                  key: `tpl-${audience.id}-${cohort.id}-${channel.id}`,
                  kind: "template",
                  icon: FileText,
                  tone: "green",
                  title: template.name,
                  value: `ID: ${template.id} · ${template.type}`,
                  badge: template.override ? "Override" : undefined,
                  onOpen: () =>
                    setPreview({ name: template.name, id: template.id, channel: channel.name }),
                },
              ],
            };
          }),
        })),
      })),
    }),
    // Data is static; onEdit/editable only gate the click handlers.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [editable],
  );

  const edges = useMemo(() => collectEdges(tree), [tree]);

  // ---- Node measurement → curved connector paths ----
  const scrollRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const nodeRefs = useRef<Map<string, HTMLElement>>(new Map());
  const centeredRef = useRef(false);
  const [layout, setLayout] = useState({ w: 0, h: 0 });
  const [paths, setPaths] = useState<string[]>([]);

  const register = useCallback(
    (key: string) => (el: HTMLElement | null) => {
      if (el) nodeRefs.current.set(key, el);
      else nodeRefs.current.delete(key);
    },
    [],
  );

  useLayoutEffect(() => {
    const inner = innerRef.current;
    if (!inner) return;

    const measure = () => {
      const w = inner.scrollWidth;
      const h = inner.scrollHeight;
      // Measure in on-screen px relative to the inner box, then divide by the
      // current zoom to get the unscaled layout coords the SVG is drawn in. This
      // is robust to positioned ancestors (unlike offsetLeft/offsetParent).
      const z = zoomRef.current || 1;
      const base = inner.getBoundingClientRect();
      const local = (el: HTMLElement) => {
        const r = el.getBoundingClientRect();
        return {
          x: (r.left - base.left) / z,
          y: (r.top - base.top) / z,
          w: r.width / z,
          h: r.height / z,
        };
      };
      const next = edges.map(({ from, to }) => {
        const p = nodeRefs.current.get(from);
        const c = nodeRefs.current.get(to);
        if (!p || !c) return "";
        const P = local(p);
        const C = local(c);
        const px = P.x + P.w / 2;
        const py = P.y + P.h;
        const cx = C.x + C.w / 2;
        const cy = C.y;
        // Longer vertical control arms → the curve leaves the parent and enters
        // the child straight down/up, sweeping across between — the journey-flow S.
        const dy = Math.max((cy - py) * 0.62, 40);
        return `M ${px} ${py} C ${px} ${py + dy}, ${cx} ${cy - dy}, ${cx} ${cy}`;
      });
      setLayout({ w, h });
      setPaths(next);

      // Center the graph horizontally on first measure (Goal sits at the top-center).
      if (!centeredRef.current && scrollRef.current) {
        const el = scrollRef.current;
        el.scrollLeft = (w * zoom - el.clientWidth) / 2;
        centeredRef.current = true;
      }
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(inner);
    window.addEventListener("resize", measure);
    if (document.fonts?.ready) document.fonts.ready.then(measure).catch(() => {});
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [edges]);

  // ---- Hand tool: drag to pan the canvas ----
  const drag = useRef<
    { x: number; y: number; sl: number; st: number; moved: boolean } | null
  >(null);
  const [panning, setPanning] = useState(false);

  const onPointerDown = (e: React.PointerEvent) => {
    if (!panMode || e.button !== 0) return;
    const el = scrollRef.current;
    if (!el) return;
    drag.current = { x: e.clientX, y: e.clientY, sl: el.scrollLeft, st: el.scrollTop, moved: false };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    const el = scrollRef.current;
    if (!d || !el) return;
    const dx = e.clientX - d.x;
    const dy = e.clientY - d.y;
    if (!d.moved && Math.hypot(dx, dy) < 4) return;
    if (!d.moved) {
      d.moved = true;
      setPanning(true);
      el.setPointerCapture?.(e.pointerId);
    }
    el.scrollLeft = d.sl - dx;
    el.scrollTop = d.st - dy;
  };
  const endDrag = (e: React.PointerEvent) => {
    setPanning(false);
    scrollRef.current?.releasePointerCapture?.(e.pointerId);
    if (!drag.current?.moved) drag.current = null;
    // If we actually dragged, keep the flag so the click that follows is
    // suppressed (a drag over a node shouldn't open it), then clear it.
    else window.setTimeout(() => (drag.current = null), 0);
  };
  const onClickCapture = (e: React.MouseEvent) => {
    if (drag.current?.moved) {
      e.stopPropagation();
      e.preventDefault();
      drag.current = null;
    }
  };

  return (
    <div className="objective-journey">
      <div className="oj-header">
        <div>
          <h1>Journey Preview</h1>
          <p>
            {editable
              ? "How the engine maps each audience and sub-cohort to a channel and template. Drag to pan, click any node to edit."
              : "How the engine maps each audience and sub-cohort to a channel and template."}
          </p>
        </div>
        <div className="oj-tools">
          <button
            type="button"
            className={`oj-tool-btn${panMode ? " active" : ""}`}
            onClick={() => setPanMode((v) => !v)}
            aria-pressed={panMode}
            aria-label="Hand tool — drag to pan"
            title="Hand tool — drag to pan"
          >
            <Hand strokeWidth={1.9} />
          </button>
          <div className="oj-zoom" role="group" aria-label="Zoom controls">
            <button
              type="button"
              className="oj-zoom-btn"
              onClick={() => setZoom((z) => clampZoom(z - ZOOM_STEP))}
              disabled={zoom <= ZOOM_MIN}
              aria-label="Zoom out"
            >
              <ZoomOut strokeWidth={1.9} />
            </button>
            <span className="oj-zoom-value">{Math.round(zoom * 100)}%</span>
            <button
              type="button"
              className="oj-zoom-btn"
              onClick={() => setZoom((z) => clampZoom(z + ZOOM_STEP))}
              disabled={zoom >= ZOOM_MAX}
              aria-label="Zoom in"
            >
              <ZoomIn strokeWidth={1.9} />
            </button>
          </div>
        </div>
      </div>

      <div className="oj-legend">
        <span><i className="oj-dot tone-blue" /> Goal</span>
        <span><i className="oj-dot tone-purple" /> Audience</span>
        <span><i className="oj-dot tone-teal" /> Sub-cohort</span>
        <span><i className="oj-dot oj-dot-multi" /> Channel</span>
        <span><i className="oj-dot tone-green" /> Template</span>
      </div>

      <div
        ref={scrollRef}
        className={`oj-scroll${panMode ? " pan" : ""}${panning ? " panning" : ""}`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onClickCapture={onClickCapture}
      >
        <div
          className="oj-sizer"
          style={{ width: layout.w * zoom, height: layout.h * zoom }}
        >
          <div
            ref={innerRef}
            className="oj-inner"
            style={{ transform: `scale(${zoom})`, transformOrigin: "top left" }}
          >
            <svg
              className="oj-edges"
              width={layout.w}
              height={layout.h}
              viewBox={`0 0 ${layout.w} ${layout.h}`}
              // Inline size wins over the flow's broad `.objective-flow svg { width:16px }`
              // reset, which would otherwise collapse this connector layer.
              style={{ width: layout.w, height: layout.h }}
              fill="none"
              aria-hidden
            >
              {paths.map((d, i) => (
                <path key={i} d={d} className="oj-edge" />
              ))}
            </svg>
            <TreeBranch node={tree} register={register} />
          </div>
        </div>
      </div>

      <TemplatePreviewSheet
        open={preview !== null}
        onOpenChange={(open) => {
          if (!open) setPreview(null);
        }}
        mappedName={preview?.name ?? ""}
        mappedId={preview?.id ?? ""}
        channelName={preview?.channel ?? ""}
        templateSrc={templateSrc(preview?.id)}
      />
    </div>
  );
}
