import { useCallback, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  Bell,
  Clock,
  Flag,
  Hand,
  Mail,
  MessageCircle,
  MessageSquare,
  Pencil,
  SlidersHorizontal,
  Users,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import "./journey-canvas.css";

/**
 * Journey Builder canvas — the RHS flow surface of the journey creation page.
 * Nodes reuse the card + curved-connector design from the objective/new
 * "Journey Preview" tab (ObjectiveJourneyPreview): each parent node is stacked
 * above the row of its children, and connectors are curved SVG paths measured
 * from the laid-out cards so they never break or gap. The canvas pans with a
 * hand tool and zoom scales the whole graph. Scoped under .jc-canvas.
 */

type LucideIcon = typeof Mail;

type JourneyNode = {
  key: string;
  kind: "trigger" | "action" | "condition" | "exit";
  icon: LucideIcon;
  tone: string;
  kicker: string;
  title: string;
  value?: string;
  /** Small label chip on the connector coming into this node (e.g. "Yes"). */
  edgeLabel?: string;
  children?: JourneyNode[];
};

// A representative journey. In a real builder these come from the graph model;
// here they stand in so the canvas reads as a real flow.
const JOURNEY: JourneyNode = {
  key: "entry",
  kind: "trigger",
  icon: Users,
  tone: "blue",
  kicker: "Trigger",
  title: "Segment entry",
  value: "Cart abandoners · 24,180",
  children: [
    {
      key: "email",
      kind: "action",
      icon: Mail,
      tone: "purple",
      kicker: "Action · Email",
      title: "Festive reminder",
      value: "Template · Abandoned cart",
      children: [
        {
          key: "wait",
          kind: "condition",
          icon: Clock,
          tone: "teal",
          kicker: "Flow control",
          title: "Wait 1 day",
          value: "Then continue",
          children: [
            {
              key: "check",
              kind: "condition",
              icon: SlidersHorizontal,
              tone: "green",
              kicker: "Condition",
              title: "Opened email?",
              value: "Check attribute",
              children: [
                {
                  key: "sms",
                  kind: "action",
                  icon: MessageSquare,
                  tone: "pink",
                  kicker: "Action · SMS",
                  title: "Discount nudge",
                  value: "10% off code",
                  edgeLabel: "No",
                  children: [
                    {
                      key: "exit-sms",
                      kind: "exit",
                      icon: Flag,
                      tone: "grey",
                      kicker: "Exit",
                      title: "End journey",
                    },
                  ],
                },
                {
                  key: "whatsapp",
                  kind: "action",
                  icon: MessageCircle,
                  tone: "teal",
                  kicker: "Action · WhatsApp",
                  title: "Order assistance",
                  value: "Rich card",
                  edgeLabel: "Yes",
                  children: [
                    {
                      key: "push",
                      kind: "action",
                      icon: Bell,
                      tone: "orange",
                      kicker: "Action · App Push",
                      title: "Complete checkout",
                      value: "Deep link",
                      children: [
                        {
                          key: "exit-wa",
                          kind: "exit",
                          icon: Flag,
                          tone: "grey",
                          kicker: "Exit",
                          title: "End journey",
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  ],
};

function NodeCard({
  node,
  innerRef,
}: {
  node: JourneyNode;
  innerRef: (el: HTMLElement | null) => void;
}) {
  const Icon = node.icon;
  const isExit = node.kind === "exit";
  return (
    <button
      ref={innerRef as (el: HTMLButtonElement | null) => void}
      type="button"
      className={`jc-card kind-${node.kind} tone-${node.tone}`}
      aria-label={`Edit ${node.title}`}
    >
      <span className="jc-icon">
        <Icon strokeWidth={1.9} />
      </span>
      <span className="jc-card-text">
        <em className="jc-card-kicker">{node.kicker}</em>
        <strong>{node.title}</strong>
        {node.value ? <span>{node.value}</span> : null}
      </span>
      {!isExit ? (
        <span className="jc-edit" aria-hidden>
          <Pencil strokeWidth={1.9} />
        </span>
      ) : null}
    </button>
  );
}

function TreeBranch({
  node,
  register,
}: {
  node: JourneyNode;
  register: (key: string) => (el: HTMLElement | null) => void;
}) {
  const children = node.children ?? [];
  return (
    <div className="jc-subtree">
      {node.edgeLabel ? <span className="jc-branch-label">{node.edgeLabel}</span> : null}
      <NodeCard node={node} innerRef={register(node.key)} />
      {children.length > 0 && (
        <div className="jc-children">
          {children.map((child) => (
            <div key={child.key} className="jc-branch">
              <TreeBranch node={child} register={register} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

type Edge = { from: string; to: string };

function collectEdges(node: JourneyNode, acc: Edge[] = []) {
  for (const child of node.children ?? []) {
    acc.push({ from: node.key, to: child.key });
    collectEdges(child, acc);
  }
  return acc;
}

export default function JourneyCanvas({ hasJourney = true }: { hasJourney?: boolean }) {
  const ZOOM_MIN = 0.35;
  const ZOOM_MAX = 1;
  const ZOOM_STEP = 0.15;
  const [zoom, setZoom] = useState(0.75);
  const clampZoom = (z: number) =>
    Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, Math.round(z * 100) / 100));
  const zoomRef = useRef(zoom);
  zoomRef.current = zoom;

  const [panMode, setPanMode] = useState(true);

  const tree = useMemo(() => JOURNEY, []);
  const edges = useMemo(() => collectEdges(tree), [tree]);

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
    if (!inner || !hasJourney) return;

    const measure = () => {
      const w = inner.scrollWidth;
      const h = inner.scrollHeight;
      // Measure on-screen px relative to the inner box, then divide by the
      // current zoom to recover the unscaled layout coords the SVG draws in.
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
        const dy = Math.max((cy - py) * 0.4, 60);
        return `M ${px} ${py} C ${px} ${py + dy}, ${cx} ${cy - dy}, ${cx} ${cy}`;
      });
      setLayout({ w, h });
      setPaths(next);

      if (!centeredRef.current && scrollRef.current) {
        const el = scrollRef.current;
        el.scrollLeft = (w * zoomRef.current - el.clientWidth) / 2;
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
  }, [edges, hasJourney]);

  // ---- Hand tool: drag to pan ----
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
    <div className="jc-canvas">
      <div className="jc-tools">
        <button
          type="button"
          className={`jc-tool-btn${panMode ? " active" : ""}`}
          onClick={() => setPanMode((v) => !v)}
          aria-pressed={panMode}
          aria-label="Hand tool — drag to pan"
          title="Hand tool — drag to pan"
        >
          <Hand strokeWidth={1.9} />
        </button>
        <div className="jc-zoom" role="group" aria-label="Zoom controls">
          <button
            type="button"
            className="jc-zoom-btn"
            onClick={() => setZoom((z) => clampZoom(z - ZOOM_STEP))}
            disabled={zoom <= ZOOM_MIN}
            aria-label="Zoom out"
          >
            <ZoomOut strokeWidth={1.9} />
          </button>
          <span className="jc-zoom-value">{Math.round(zoom * 100)}%</span>
          <button
            type="button"
            className="jc-zoom-btn"
            onClick={() => setZoom((z) => clampZoom(z + ZOOM_STEP))}
            disabled={zoom >= ZOOM_MAX}
            aria-label="Zoom in"
          >
            <ZoomIn strokeWidth={1.9} />
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className={`jc-scroll${panMode ? " pan" : ""}${panning ? " panning" : ""}`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onClickCapture={onClickCapture}
      >
        {hasJourney ? (
          <div className="jc-sizer" style={{ width: layout.w * zoom, height: layout.h * zoom }}>
            <div
              ref={innerRef}
              className="jc-inner"
              style={{ transform: `scale(${zoom})`, transformOrigin: "top left" }}
            >
              <svg
                className="jc-edges"
                width={layout.w}
                height={layout.h}
                viewBox={`0 0 ${layout.w} ${layout.h}`}
                style={{ width: layout.w, height: layout.h }}
                fill="none"
                aria-hidden
              >
                {paths.map((d, i) => (
                  <path key={i} d={d} className="jc-edge" />
                ))}
              </svg>
              <TreeBranch node={tree} register={register} />
            </div>
          </div>
        ) : (
          <div className="jc-empty">
            <button type="button" className="jc-start-node">
              Start with Trigger!
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
