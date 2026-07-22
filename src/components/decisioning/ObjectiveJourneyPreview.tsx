import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  Bell,
  Eye,
  FileText,
  Globe,
  Hand,
  Layers,
  Mail,
  Maximize2,
  MessageSquare,
  Minimize2,
  Pencil,
  Target,
  Users,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import TemplatePreviewSheet from "./TemplatePreviewSheet";
import { templateSrc } from "./emailTemplates";
import { resolveAssignedOrRecommended, type Audience } from "./contentMappingRules";
import "./objective-journey-preview.css";

/**
 * Objective Journey Preview — the Preview step of the objective/new flow only.
 * Unlike the shared JourneyPreview, this one mirrors the audience-first
 * ContentMapping model as a top-down flow:
 *
 *   Goal → Audience → Sub-cohort → Channel → Template
 *
 * Mirrors ContentMapping's own nav exactly: the audience row itself IS the
 * "parent" scope (its channel/template mapping hangs directly off the
 * audience node, same as clicking the audience header in Content), and each
 * real sub-cohort gets its own nested branch alongside it. There's no
 * separate "All contacts" node — ContentMapping doesn't have one either.
 * Connectors are curved SVG paths measured from the laid-out nodes (so they
 * never break or gap), the canvas pans with a hand tool, and zoom scales the
 * whole graph. Scoped so the other flows and the performance page are untouched.
 */

export type EditableStep = "goal" | "audience" | "content";

// Default demo audiences, used only when no live `audiences` prop is supplied
// (e.g. the legacy v1 flow, which renders this component standalone).
const DEFAULT_AUDIENCES: Audience[] = [
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

// Stable empty-assignments default. Must be a module const, not an inline `{}`
// in the prop default — a fresh `{}` each render would change the `tree`/`edges`
// memo identity every render, re-firing the measurement layout effect in an
// infinite setState loop (hit by callers that omit `assignments`, e.g. the
// live-performance Preview tab).
const EMPTY_ASSIGNMENTS: Record<string, string> = {};

const CHANNELS: { id: string; name: string; icon: typeof Mail; tone: string }[] = [
  { id: "email", name: "Email", icon: Mail, tone: "purple" },
  { id: "sms", name: "SMS", icon: MessageSquare, tone: "pink" },
  { id: "push", name: "Push notification", icon: Bell, tone: "blue" },
  { id: "webpush", name: "Web push", icon: Globe, tone: "orange" },
];

function formatCount(n: number) {
  return n.toLocaleString();
}

/**
 * Resolve the template for an audience/scope/channel from the live
 * assignments map, flagging explicit picks as overrides. `scope` is either
 * "parent" (the audience's own mapping) or a real sub-cohort's id, matching
 * ContentMapping's own slot keys exactly.
 */
function resolveTemplate(
  audiences: Audience[],
  assignments: Record<string, string>,
  audienceId: string,
  scope: string,
  channelId: string,
) {
  const { template, isOverride } = resolveAssignedOrRecommended(
    audiences,
    assignments,
    audienceId,
    channelId,
    scope,
  );
  return { ...template, override: isOverride };
}

type TreeNode = {
  key: string;
  kind: "goal" | "audience" | "cohort" | "channel" | "template";
  icon: typeof Target;
  tone: string;
  title: string;
  value?: string;
  badge?: string;
  /** Small uppercase tag above the title, e.g. "Subcohort" — a label on the
      card itself, as opposed to a section heading floating on the canvas. */
  kicker?: string;
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
        {node.kicker ? <em className="oj-card-kicker">{node.kicker}</em> : null}
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

  // An audience's own channel mapping and its sub-cohorts are visually
  // distinct tiers (matching Content's own audience-row vs sub-cohort-row
  // split), so they render as two separate, separately-labeled rows rather
  // than flat siblings — even though both are still direct edges from the
  // audience node underneath.
  if (node.kind === "audience") {
    const channelChildren = children.filter((c) => c.kind === "channel");
    const cohortChildren = children.filter((c) => c.kind === "cohort");
    return (
      <div className="oj-subtree">
        <NodeCard node={node} innerRef={register(node.key)} />
        {channelChildren.length > 0 && (
          <div className="oj-children">
            {channelChildren.map((child) => (
              <div key={child.key} className="oj-branch">
                <TreeBranch node={child} register={register} />
              </div>
            ))}
          </div>
        )}
        {cohortChildren.length > 0 && (
          <div className="oj-cohort-group" ref={register(`${node.key}-cohort-group`)}>
            <div className="oj-children">
              {cohortChildren.map((child) => (
                <div key={child.key} className="oj-branch">
                  <TreeBranch node={child} register={register} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

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

type Edge = { from: string; to: string; viaWaist?: string };

/**
 * Flatten parent→child links so the SVG layer can draw a curve per edge.
 * An audience→cohort edge skips a whole tier (the audience's own channel
 * row sits in between), so it's tagged with the registered cohort-group
 * wrapper's key — the renderer uses that to route the wire straight down
 * past the cards first, bending only in the empty gap above "Subcohorts",
 * instead of a diagonal sweep that cuts across the channel/template row.
 */
function collectEdges(node: TreeNode, acc: Edge[] = []) {
  for (const child of node.children ?? []) {
    acc.push(
      node.kind === "audience" && child.kind === "cohort"
        ? { from: node.key, to: child.key, viaWaist: `${node.key}-cohort-group` }
        : { from: node.key, to: child.key },
    );
    collectEdges(child, acc);
  }
  return acc;
}

export default function ObjectiveJourneyPreview({
  onEdit,
  editable = true,
  audiences = DEFAULT_AUDIENCES,
  assignments = EMPTY_ASSIGNMENTS,
}: {
  onEdit: (step: EditableStep) => void;
  editable?: boolean;
  /** Real audience data from the flow (same shape ContentMapping accepts).
      Defaults to demo data so the legacy v1 flow, which renders this
      standalone, keeps working unchanged. */
  audiences?: Audience[];
  /** Live assignments map lifted from ContentMapping, keyed by
      `${audienceId}::${channelId}::${scope}` -> templateId. Defaults to `{}`
      (no explicit picks — every slot falls back to its recommended template). */
  assignments?: Record<string, string>;
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

  // Full screen: the card is repositioned to a fixed, viewport-covering
  // overlay via CSS (see .oj-fullscreen) rather than unmounting into a
  // separate modal — the canvas DOM node never moves, so pan/zoom state and
  // the measured connector paths keep working without a re-registration.
  //
  // Three-flag open/close so it animates like a real modal instead of
  // snapping: `fullscreen` is the logical toggle (drives the button/aria);
  // `overlayActive` keeps the fixed-position layout mounted for the whole
  // open + closing-transition window; `entered` drives the opacity/scale
  // transition itself, flipped a frame after mount on open (so the browser
  // has a chance to paint the "before" state first) and immediately on close
  // (so the fade-out has something to animate from).
  const [fullscreen, setFullscreen] = useState(false);
  const [overlayActive, setOverlayActive] = useState(false);
  const [entered, setEntered] = useState(false);
  const closeTimerRef = useRef<number>();

  const openFullscreen = () => {
    window.clearTimeout(closeTimerRef.current);
    setFullscreen(true);
    setOverlayActive(true);
    requestAnimationFrame(() => requestAnimationFrame(() => setEntered(true)));
  };
  const closeFullscreen = () => {
    setFullscreen(false);
    setEntered(false);
    closeTimerRef.current = window.setTimeout(() => setOverlayActive(false), 240);
  };

  useEffect(() => () => window.clearTimeout(closeTimerRef.current), []);

  const goEdit = (step: EditableStep) => (editable ? () => onEdit(step) : undefined);

  // Channel/template branch for a single scope (the audience's own "parent"
  // scope, or one of its sub-cohorts) — the same shape ContentMapping's
  // channel tab strip resolves against for whichever scope is selected.
  const channelNodesFor = (audienceId: string, scope: string, keyPrefix: string): TreeNode[] =>
    CHANNELS.map((channel) => {
      const template = resolveTemplate(audiences, assignments, audienceId, scope, channel.id);
      return {
        // Channels are context only — no click/edit affordance.
        key: `${keyPrefix}-ch-${channel.id}`,
        kind: "channel",
        icon: channel.icon,
        tone: channel.tone,
        title: channel.name,
        children: [
          {
            key: `${keyPrefix}-tpl-${channel.id}`,
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
    });

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
      children: audiences.map((audience) => ({
        key: `aud-${audience.id}`,
        kind: "audience",
        icon: Users,
        tone: "purple",
        title: audience.name,
        value: `${formatCount(audience.count)} contacts`,
        editable,
        onOpen: goEdit("audience"),
        // The audience's own parent-scope channel mapping hangs directly off
        // it, exactly like selecting the audience row itself in Content; each
        // real sub-cohort is an additional sibling branch with its own
        // independent channel mapping.
        children: [
          ...channelNodesFor(audience.id, "parent", `aud-${audience.id}`),
          ...audience.subCohorts.map((cohort) => ({
            key: `coh-${audience.id}-${cohort.id}`,
            kind: "cohort" as const,
            icon: Layers,
            tone: "teal",
            title: cohort.label,
            value: `${formatCount(cohort.count)} contacts`,
            kicker: "Subcohort",
            editable,
            onOpen: goEdit("audience"),
            children: channelNodesFor(audience.id, cohort.id, `coh-${audience.id}-${cohort.id}`),
          })),
        ],
      })),
    }),
    // goEdit/onEdit intentionally excluded — they're recreated each render
    // from the same editable/onEdit values already in this dep list.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [editable, audiences, assignments],
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
      const next = edges.map(({ from, to, viaWaist }) => {
        const p = nodeRefs.current.get(from);
        const c = nodeRefs.current.get(to);
        if (!p || !c) return "";
        const P = local(p);
        const C = local(c);
        const px = P.x + P.w / 2;
        const py = P.y + P.h;
        const cx = C.x + C.w / 2;
        const cy = C.y;

        // Edges that skip a whole tier (audience -> cohort, jumping over the
        // audience's own channel/template row) route as a rounded elbow: down
        // past the cards, bend only in the empty gap just above the waist
        // marker, then down into the child — never a diagonal sweep across
        // the row in between.
        const waistEl = viaWaist ? nodeRefs.current.get(viaWaist) : undefined;
        if (waistEl) {
          const wy = local(waistEl).y - 36;
          const r = Math.min(28, Math.abs(cx - px) / 2, Math.max(0, wy - py) / 2, Math.max(0, cy - wy) / 2);
          if (r < 1 || Math.abs(cx - px) < 1) {
            return `M ${px} ${py} L ${px} ${wy} L ${cx} ${wy} L ${cx} ${cy}`;
          }
          const sign = cx > px ? 1 : -1;
          return [
            `M ${px} ${py}`,
            `L ${px} ${wy - r}`,
            `Q ${px} ${wy}, ${px + sign * r} ${wy}`,
            `L ${cx - sign * r} ${wy}`,
            `Q ${cx} ${wy}, ${cx} ${wy + r}`,
            `L ${cx} ${cy}`,
          ].join(" ");
        }

        // A lower control-arm ratio (relative to the now-larger row spacing)
        // keeps the bend gentle and near the ends instead of a tight S
        // pinched in the middle, giving the wires more visual breathing room.
        const dy = Math.max((cy - py) * 0.4, 64);
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

  // The canvas element itself never unmounts when toggling full screen (only
  // its CSS position/size changes), so the ResizeObserver above already
  // re-measures automatically. This just re-centers the horizontal scroll for
  // the new viewport size, since the old pan position won't make sense in it.
  // Keyed on `overlayActive` (not `fullscreen`) since that's what actually
  // flips the layout to/from fixed-fullscreen sizing.
  useEffect(() => {
    centeredRef.current = false;
    const el = scrollRef.current;
    if (!el) return;
    el.scrollLeft = (layout.w * zoom - el.clientWidth) / 2;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [overlayActive]);

  // Full screen: Escape closes it, and background scroll is locked for the
  // whole open + closing-transition window so the page behind the overlay
  // doesn't scroll along with it or jump once the close animation finishes.
  useEffect(() => {
    if (!overlayActive) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeFullscreen();
    };
    window.addEventListener("keydown", onKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [overlayActive]);

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
    <>
      {overlayActive && (
        <div
          className={`oj-fullscreen-backdrop${entered ? " entered" : ""}`}
          onClick={closeFullscreen}
          aria-hidden
        />
      )}
      <div
        className={`objective-journey${overlayActive ? " oj-fullscreen" : ""}${entered ? " entered" : ""}`}
      >
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
            <button
              type="button"
              className="oj-tool-btn"
              onClick={() => (fullscreen ? closeFullscreen() : openFullscreen())}
              aria-pressed={fullscreen}
              aria-label={fullscreen ? "Exit full screen" : "Full screen"}
              title={fullscreen ? "Exit full screen" : "Full screen"}
            >
              {fullscreen ? <Minimize2 strokeWidth={1.9} /> : <Maximize2 strokeWidth={1.9} />}
            </button>
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
    </>
  );
}
