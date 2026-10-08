import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import {
  Bell,
  Clock,
  Copy,
  Flag,
  Hand,
  Loader2,
  Mail,
  MessageCircle,
  MessageSquare,
  Move,
  Pencil,
  Plus,
  Search,
  SlidersHorizontal,
  Trash2,
  Users,
  X,
  Zap,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import "./journey-canvas.css";
import sparkle from "/campaign-assets/ic-sparkle.gif";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { FlowPath, FlowStep } from "./journeyFlowTree";
import { getNodeTooltipInfo } from "./journeyNodeTooltip";
import {
  ACTION_NODES,
  AGENT_NODES,
  CONDITION_NODES,
  FLOW_CONTROL_NODES,
  findPaletteNode,
  type PaletteNode,
} from "./journeyNodePalette.data";

/** The dataTransfer type an already-placed node's own drag carries its id
 *  as — distinct from the palette drawer's rows (plain "text/plain", a
 *  paletteNodeId) so InsertionGap's onDrop can tell "insert a new step"
 *  and "move this existing one here" apart. */
const STEP_DRAG_MIME = "application/x-journey-step-id";

/** Where a gap sits: which chain (root, or nested in some step's yes/no
 *  branch), and the index within it. */
export interface GapAddress {
  path: FlowPath;
  index: number;
}

function sameGap(a: GapAddress | null, path: FlowPath, index: number): boolean {
  if (!a || a.index !== index || a.path.length !== path.length) return false;
  return a.path.every((seg, i) => seg.stepId === path[i].stepId && seg.branch === path[i].branch);
}

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

/** A node dragged in from JourneyNodeDrawer, rendered in the scratch-flow
 *  chain below the trigger. Same tone language as the palette rows. Every
 *  node is clickable to select it (arms the bottom action toolbar); nodes
 *  whose palette entry has `requiresConfig` also open their settings panel
 *  on the same click. Hovering shows everything worth knowing about it —
 *  its type, its full task sentence (the card's own can truncate), and
 *  whatever its saved settings add beyond that (see journeyNodeTooltip) —
 *  without having to open it. */
function AddedNodeCard({
  step,
  editable,
  selected,
  onClick,
}: {
  step: FlowStep;
  editable: boolean;
  selected: boolean;
  onClick?: () => void;
}) {
  // The Journey Optimization Agent's own progressive "building the test
  // journey" reveal (JourneyBuilder's beginTestBuildAnimation) drops one of
  // these in place of the next real node while it "loads", then swaps it
  // for the real step — same card shell/animation, just pulsing placeholder
  // content instead of a real icon/label, so the entrance animation below
  // replays on the swap. Not a real node type; never interactive.
  if (step.paletteNodeId === "__skeleton__") {
    return (
      <div className="jc-added-node duration-200 animate-in fade-in zoom-in-95" aria-hidden="true">
        <span className="jc-added-icon animate-pulse !bg-[#E9E9F0]" />
        <span className="flex min-w-0 flex-1 flex-col gap-1.5 py-0.5">
          <span className="h-3 w-28 animate-pulse rounded bg-[#E9E9F0]" />
          <span className="h-2.5 w-20 animate-pulse rounded bg-[#EFEFF4]" />
        </span>
      </div>
    );
  }
  const Icon = step.icon;
  const info = getNodeTooltipInfo(step);
  const [dragging, setDragging] = useState(false);
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          draggable
          onDragStart={(e) => {
            e.dataTransfer.setData(STEP_DRAG_MIME, step.id);
            e.dataTransfer.effectAllowed = "move";
            setDragging(true);
          }}
          onDragEnd={() => setDragging(false)}
          className={`group jc-added-node tone-${step.tone}${editable ? " editable" : ""}${
            selected ? " selected" : ""
          }${dragging ? " dragging" : ""} duration-200 animate-in fade-in zoom-in-95`}
        >
          {step.tone === "agent" && <span aria-hidden="true" className="snake-border snake-border--purple" />}
          <button
            type="button"
            onClick={onClick}
            aria-label={editable ? `Edit ${step.label}` : `Select ${step.label}`}
            aria-pressed={selected}
            className="jc-added-node-main"
          >
            <span className="jc-added-icon">
              <Icon strokeWidth={1.9} />
            </span>
            <span className="flex min-w-0 flex-col items-start">
              {step.kindLabel && (
                <span className="font-manrope text-[11px] font-semibold uppercase tracking-[0.04em] text-[#6F6F8D]">
                  {step.kindLabel}
                </span>
              )}
              <span className="font-manrope text-[14px] font-bold text-[#17173A]">{step.nodeLabel}</span>
            </span>
          </button>
        </div>
      </TooltipTrigger>
      <TooltipContent
        side="right"
        align="start"
        className="max-w-[260px] border-0 bg-foreground text-background"
      >
        <p className="font-manrope text-[10.5px] font-bold uppercase tracking-[0.05em] opacity-70">{info.title}</p>
        <div className="mt-1 flex flex-col gap-1">
          {info.lines.map((line, i) => (
            <p key={i} className="font-manrope text-[12.5px] leading-snug">
              {line}
            </p>
          ))}
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

export const POPUP_TONE_STYLES: Record<PaletteNode["tone"], { box: string; icon: string }> = {
  action: { box: "bg-[#EBD2FF]", icon: "text-[#9449DF]" },
  condition: { box: "bg-[#D5F2D6]", icon: "text-[#00B27E]" },
  flow: { box: "bg-[#FCEBD2]", icon: "text-[#B8791F]" },
  // Not actually used to render Agent Node's icon (it gets a gradient box
  // instead, matching AgentRow in the drawer) — present so this stays a
  // total map over every NodeTone.
  agent: { box: "bg-[#EAF1FF]", icon: "text-[#2F68E5]" },
};

// Agent sits last — every other section is a plain step type, so the one
// section that opens onto a whole separate configuration flow (picking and
// setting up an AI agent) reads as the outlier it is, rather than the
// user's very first option.
const POPUP_SECTIONS: { title: string; nodes: PaletteNode[] }[] = [
  { title: "Actions", nodes: ACTION_NODES },
  { title: "Conditions", nodes: CONDITION_NODES },
  { title: "Flow Control", nodes: FLOW_CONTROL_NODES },
  { title: "Agent", nodes: AGENT_NODES },
];

/** Each column's own width, sized to what its longest label actually
 *  needs (measured against this catalog) rather than an equal flex split —
 *  Flow Control and Agent have short, few labels and don't need anywhere
 *  near Actions' or Conditions' share, so giving every column the same
 *  width left the popup far wider than its content ever used. Revisit
 *  these if a section's longest label changes meaningfully. */
const POPUP_COLUMN_WIDTH: Record<string, number> = {
  Actions: 360, // two sub-columns — see popupColumns()
  Conditions: 188,
  "Flow Control": 152,
  Agent: 92,
};

/** Splits a long section's rows into two side-by-side sub-columns (instead
 *  of one tall one) so the popup's tallest section — Actions, with more
 *  than double any other — no longer forces the whole popup to scroll. */
const POPUP_SUBCOLUMN_THRESHOLD = 8;
function popupColumns(nodes: PaletteNode[]): PaletteNode[][] {
  if (nodes.length <= POPUP_SUBCOLUMN_THRESHOLD) return [nodes];
  const half = Math.ceil(nodes.length / 2);
  return [nodes.slice(0, half), nodes.slice(half)];
}

/** A node-picker row label — each column is sized to fit its own longest
 *  label (see POPUP_COLUMN_WIDTH), so every name renders in full on one
 *  line without truncating or wrapping. */
function NodePopupLabel({ label }: { label: string }) {
  return <span className="jc-node-popup-label">{label}</span>;
}

/**
 * The small contextual picker a "+" opens — three compact columns
 * (Actions / Conditions / Flow Control), anchored right under the button
 * that opened it. Picking a row inserts immediately at that exact gap; no
 * separate confirm step. Closes on outside click, Escape, or a selection.
 * Portaled to `document.body` so it isn't clipped by the canvas's own
 * scroll/overflow container.
 */
function NodePickerPopup({
  anchorRect,
  onSelect,
  onClose,
}: {
  anchorRect: DOMRect;
  onSelect: (paletteNodeId: string) => void;
  onClose: () => void;
}) {
  const popupRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const onDocPointerDown = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) onClose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    // Defer attaching a beat so the same click that opened this popup
    // doesn't immediately bubble into the outside-click listener and close it.
    const t = window.setTimeout(() => {
      document.addEventListener("mousedown", onDocPointerDown);
      document.addEventListener("keydown", onKey);
      searchRef.current?.focus();
    }, 0);
    return () => {
      window.clearTimeout(t);
      document.removeEventListener("mousedown", onDocPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  // Filters every section's rows against the query (case-insensitive,
  // matched anywhere in the label) rather than just jumping to a step —
  // this stays a picker, so a match still has to be clicked like any other
  // row. Sections with nothing left to show drop out entirely instead of
  // rendering an empty heading.
  const sections = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return POPUP_SECTIONS;
    return POPUP_SECTIONS.map((section) => ({
      ...section,
      nodes: section.nodes.filter((node) => node.label.toLowerCase().includes(q)),
    })).filter((section) => section.nodes.length > 0);
  }, [query]);

  // Every visible row, flattened in the exact order it's drawn (section by
  // section, sub-column by sub-column, top to bottom) — what ArrowDown/Up
  // step through and what Enter adds.
  const flatMatches = useMemo(
    () => sections.flatMap((section) => popupColumns(section.nodes).flat()),
    [sections],
  );

  // The row the keyboard currently points at. Reset to the first match
  // whenever the search text itself changes, so a fresh search always
  // starts from the top rather than keeping a cursor position that no
  // longer lines up with anything on screen; arrow keys then move it from
  // there independently of typing.
  const [activeId, setActiveId] = useState<string | null>(null);
  useEffect(() => {
    setActiveId(query.trim() ? (flatMatches[0]?.id ?? null) : null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const moveActive = (delta: 1 | -1) => {
    if (flatMatches.length === 0) return;
    const idx = flatMatches.findIndex((n) => n.id === activeId);
    const next = Math.max(0, Math.min(flatMatches.length - 1, idx + delta));
    setActiveId(flatMatches[next].id);
  };

  // Sum of each visible section's own width (see POPUP_COLUMN_WIDTH — each
  // already includes that column's own padding) plus the chrome around
  // them: .jc-node-popup-sections's own 28px horizontal padding and a 1px
  // rule between each pair of columns. Recomputed from the *visible*
  // sections, so a search that narrows things down to one or two columns
  // shrinks the popup instead of leaving it stretched over what's no
  // longer there.
  const n = sections.length;
  const columnsWidth = sections.reduce((sum, s) => sum + (POPUP_COLUMN_WIDTH[s.title] ?? 0), 0);
  const width = n === 0 ? 320 : columnsWidth + (n - 1) + 28;
  const maxHeight = 388;
  const margin = 12;
  let left = anchorRect.left + anchorRect.width / 2 - width / 2;
  left = Math.max(margin, Math.min(left, window.innerWidth - width - margin));
  let top = anchorRect.bottom + 10;
  if (top + maxHeight > window.innerHeight - margin) {
    top = Math.max(margin, anchorRect.top - maxHeight - 10);
  }

  return createPortal(
    <div
      ref={popupRef}
      role="menu"
      aria-label="Add a step"
      className="jc-node-popup duration-150 animate-in fade-in zoom-in-95"
      style={{ left, top, maxHeight, transformOrigin: "top" }}
    >
      <div className="jc-node-popup-search">
        <Search className="h-3.5 w-3.5 shrink-0 text-[#6F6F8D]" strokeWidth={2} />
        <input
          ref={searchRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              moveActive(1);
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              moveActive(-1);
            } else if (e.key === "Enter" && activeId) {
              e.preventDefault();
              onSelect(activeId);
            }
          }}
          placeholder="Search steps…"
          aria-label="Search steps"
        />
      </div>
      <div className="jc-node-popup-sections" style={{ width }}>
        {sections.length === 0 ? (
          <p className="jc-node-popup-empty">No steps match "{query.trim()}"</p>
        ) : (
          sections.map((section) => {
            const columns = popupColumns(section.nodes);
            return (
              <div
                key={section.title}
                className="jc-node-popup-col"
                style={{ flex: `0 0 ${POPUP_COLUMN_WIDTH[section.title] ?? 140}px` }}
              >
                <p className="jc-node-popup-heading">{section.title}</p>
                <div className="jc-node-popup-subcols">
                  {columns.map((column, ci) => (
                    <div key={ci} className="jc-node-popup-list">
                      {column.map((node) => {
                        const Icon = node.icon;
                        const isAgent = node.tone === "agent";
                        const s = POPUP_TONE_STYLES[node.tone];
                        return (
                          <button
                            key={node.id}
                            type="button"
                            onClick={() => onSelect(node.id)}
                            onMouseEnter={() => setActiveId(node.id)}
                            className={`jc-node-popup-row${node.id === activeId ? " jc-node-popup-row--active" : ""}`}
                          >
                            <span
                              className={isAgent ? "jc-node-popup-icon" : `jc-node-popup-icon ${s.box}`}
                              style={
                                isAgent
                                  ? { background: "linear-gradient(135deg, #9449DF 0%, #2F68E5 100%)" }
                                  : undefined
                              }
                            >
                              <Icon className={`h-3.5 w-3.5 ${isAgent ? "text-white" : s.icon}`} strokeWidth={1.9} />
                            </span>
                            <NodePopupLabel label={node.label} />
                          </button>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>,
    document.body,
  );
}

/**
 * The connector between two nodes in a from-scratch chain — also the
 * insertion point for a new step there, via either affordance:
 *  - a "+" button, always visible, that opens NodePickerPopup anchored to
 *    it, or
 *  - a native drag-and-drop target, highlighted while a drawer row is
 *    dragged over it.
 * Both land on the same `onInsert(paletteNodeId, path, index)` call, so a
 * step added by click or by drag is spliced into the flow the same way —
 * `path` identifies which chain (root, or nested inside a branch) this gap
 * belongs to. A third affordance, dragging an *already-placed* node
 * straight from the canvas (see AddedNodeCard's own draggable), lands on
 * `onDropStep(stepId, path, index)` instead — told apart from a palette
 * drag by STEP_DRAG_MIME, since a real step id would otherwise be
 * misread as a paletteNodeId by onInsert.
 */
function InsertionGap({
  path,
  index,
  open,
  moveArmed,
  pasteArmed,
  onToggle,
  onInsert,
  onDropStep,
  onMoveHere,
  onGapHover,
}: {
  path: FlowPath;
  index: number;
  open: boolean;
  /** While true (the toolbar's Move is armed for the selected node), this
   *  gap becomes a drop target instead of an insertion point. */
  moveArmed: boolean;
  /** While true (⌘C has copied a node), this gap becomes a paste target —
   *  hovering it and pressing ⌘V lands the copy exactly here. See
   *  JourneyBuilder's clipboardStep/onGapHover. */
  pasteArmed: boolean;
  onToggle: (path: FlowPath, index: number, rect: DOMRect) => void;
  onInsert: (paletteNodeId: string, path: FlowPath, index: number) => void;
  /** Dragging an existing canvas node onto this gap — relocates it here
   *  (see JourneyCanvas's onMoveNode). */
  onDropStep: (stepId: string, path: FlowPath, index: number) => void;
  onMoveHere: (path: FlowPath, index: number) => void;
  /** Reports whenever the mouse enters/leaves this exact gap — how
   *  JourneyBuilder knows which gap a ⌘V should land on, since the actual
   *  keypress is caught by its own window-level listener, not this button. */
  onGapHover?: (target: { path: FlowPath; index: number } | null) => void;
}) {
  const [dragOver, setDragOver] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);

  return (
    <div
      className={`jc-gap${dragOver ? " drag-over" : ""}${moveArmed ? " move-target" : ""}${
        pasteArmed ? " paste-target" : ""
      }`}
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = e.dataTransfer.types.includes(STEP_DRAG_MIME) ? "move" : "copy";
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        const stepId = e.dataTransfer.getData(STEP_DRAG_MIME);
        if (stepId) {
          onDropStep(stepId, path, index);
          return;
        }
        const id = e.dataTransfer.getData("text/plain");
        if (id) onInsert(id, path, index);
      }}
      onMouseEnter={() => pasteArmed && onGapHover?.({ path, index })}
      onMouseLeave={() => pasteArmed && onGapHover?.(null)}
    >
      <span className="jc-gap-line" aria-hidden />
      {/* The drop slot a drag (new node from the panel, or an existing one
          being repositioned — both set .drag-over the same way) opens up
          between the two nodes it's hovering between. */}
      <span className="jc-gap-frame" aria-hidden />
      <button
        ref={btnRef}
        type="button"
        aria-label={moveArmed ? "Move here" : pasteArmed ? "Paste here" : "Add a step here"}
        title={moveArmed ? "Move here" : pasteArmed ? "Paste here" : "Add a step here"}
        className={`jc-gap-add${open ? " armed" : ""}`}
        onClick={() => {
          if (moveArmed) {
            onMoveHere(path, index);
            return;
          }
          const rect = btnRef.current?.getBoundingClientRect();
          if (rect) onToggle(path, index, rect);
        }}
      >
        <Plus strokeWidth={2.5} />
      </button>
    </div>
  );
}

/** Wraps a toolbar/tool button with the shared shortcut-hint tooltip — same
 *  Tooltip component and dark styling used throughout the app (e.g. L1Nav). */
function ShortcutTooltip({ shortcut, children }: { shortcut: string; children: ReactNode }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent
        side="top"
        className="border-0 bg-foreground text-background text-[12px] leading-[16px] px-[8px] py-[4px]"
      >
        {shortcut}
      </TooltipContent>
    </Tooltip>
  );
}

/** A bottom-bar suggestion pill (Audit flow / Show analytics) — plain by
 *  default, revealing the same purple-to-blue "AI is doing something here"
 *  ring the Agent Node uses (.snake-border, see journey-canvas.css) on
 *  hover only, via a pure CSS opacity toggle rather than a second style. */
function AIPillButton({ label, onClick }: { label: string; onClick?: () => void }) {
  return (
    <button type="button" onClick={onClick} className="jc-ai-pill">
      <span aria-hidden="true" className="snake-border snake-border--purple" />
      <span className="relative z-[1]">{label}</span>
    </button>
  );
}

/**
 * Floating bottom action toolbar — collapsed to just "Add" with nothing
 * selected, expanding to Add / Copy / Move / Delete the moment a node is
 * selected. Same visual language as the top-right hand/zoom cluster
 * (`.jc-tools`): white pill, `--jc-border`, the same hover/active tones used
 * throughout this canvas.
 */
function CanvasToolbar({
  expanded,
  moveArmed,
  onAdd,
  onCopy,
  onToggleMove,
  onDelete,
}: {
  expanded: boolean;
  moveArmed: boolean;
  /** Opens the persistent right-side "Add to journey" drawer — Add no
   *  longer opens its own contextual popup, in either toolbar state. */
  onAdd: () => void;
  onCopy: () => void;
  onToggleMove: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="jc-canvas-toolbar" role="toolbar" aria-label="Node actions">
      <ShortcutTooltip shortcut="A">
        <button type="button" className="dc-btn dc-btn-primary" onClick={onAdd}>
          <Plus strokeWidth={2.2} />
          <span>Add</span>
        </button>
      </ShortcutTooltip>
      {expanded && (
        <>
          <span className="jc-toolbar-divider" aria-hidden />
          <ShortcutTooltip shortcut="⌘C">
            <button type="button" className="jc-toolbar-btn" onClick={onCopy}>
              <Copy strokeWidth={1.9} />
              <span>Copy</span>
            </button>
          </ShortcutTooltip>
          <span className="jc-toolbar-divider" aria-hidden />
          <button
            type="button"
            aria-pressed={moveArmed}
            className={`jc-toolbar-btn${moveArmed ? " active" : ""}`}
            onClick={onToggleMove}
          >
            <Move strokeWidth={1.9} />
            <span>{moveArmed ? "Choose a spot…" : "Move"}</span>
          </button>
          <span className="jc-toolbar-divider" aria-hidden />
          <ShortcutTooltip shortcut="⌫">
            <button type="button" className="jc-toolbar-btn danger" onClick={onDelete}>
              <Trash2 strokeWidth={1.9} />
              <span>Delete</span>
            </button>
          </ShortcutTooltip>
        </>
      )}
    </div>
  );
}

/**
 * What the Optimizer's Test Journey actually changed, for the tag's own
 * tooltip — walks the Main and Test branches in lockstep (they're clones of
 * the same source flow with exactly one anchor step swapped, so they stay
 * structurally identical everywhere except at that one node) and reports
 * the first step whose label differs. No access to the original insight
 * text here (this is the generic canvas, not the co-marketer conversation
 * that built this split), so this is derived straight from the flow data
 * actually on screen rather than duplicating that copy.
 */
function describeTestBranchChange(mainSteps: FlowStep[], testSteps: FlowStep[]): { from: string; to: string } | null {
  for (let i = 0; i < Math.min(mainSteps.length, testSteps.length); i++) {
    const a = mainSteps[i];
    const b = testSteps[i];
    if (a.nodeLabel !== b.nodeLabel) return { from: a.nodeLabel, to: b.nodeLabel };
    if (a.branches && b.branches) {
      if ("paths" in a.branches && "paths" in b.branches) {
        for (let j = 0; j < a.branches.paths.length; j++) {
          const found = describeTestBranchChange(a.branches.paths[j]?.steps ?? [], b.branches.paths[j]?.steps ?? []);
          if (found) return found;
        }
      } else if (!("paths" in a.branches) && !("paths" in b.branches)) {
        const foundNo = describeTestBranchChange(a.branches.no, b.branches.no);
        if (foundNo) return foundNo;
        const foundYes = describeTestBranchChange(a.branches.yes, b.branches.yes);
        if (foundYes) return foundYes;
      }
    }
  }
  return null;
}

/**
 * Renders one chain of steps (the trunk, or a branch's own chain) with a
 * gap before each step and a trailing gap + End — unless the chain hits a
 * Condition/Flow Control step, which has no "next": it splits into its own
 * "yes"/"no" branch columns instead, each recursing back into this same
 * component, and nothing renders after it in this chain.
 */
function FlowChain({
  steps,
  path,
  popoverGap,
  onTogglePopover,
  onInsert,
  onDropStep,
  onRemove,
  onClickNode,
  selectedStepId,
  moveArmed,
  onMoveHere,
  pasteArmed,
  onGapHover,
}: {
  steps: FlowStep[];
  path: FlowPath;
  popoverGap: GapAddress | null;
  onTogglePopover: (path: FlowPath, index: number, rect: DOMRect) => void;
  onInsert: (paletteNodeId: string, path: FlowPath, index: number) => void;
  onDropStep: (stepId: string, path: FlowPath, index: number) => void;
  onRemove: (id: string) => void;
  onClickNode: (step: FlowStep) => void;
  selectedStepId: string | null;
  moveArmed: boolean;
  onMoveHere: (path: FlowPath, index: number) => void;
  pasteArmed: boolean;
  onGapHover?: (target: { path: FlowPath; index: number } | null) => void;
}) {
  const branchStep = steps.find((s) => s.branches);
  const trunk = branchStep ? steps.slice(0, steps.indexOf(branchStep) + 1) : steps;

  return (
    <>
      {trunk.map((step, i) => (
        <div key={step.id} className="flex flex-col items-center">
          <InsertionGap
            path={path}
            index={i}
            open={sameGap(popoverGap, path, i)}
            moveArmed={moveArmed}
            pasteArmed={pasteArmed}
            onToggle={onTogglePopover}
            onInsert={onInsert}
            onDropStep={onDropStep}
            onMoveHere={onMoveHere}
            onGapHover={onGapHover}
          />
          <AddedNodeCard
            step={step}
            editable={!!findPaletteNode(step.paletteNodeId)?.requiresConfig}
            selected={step.id === selectedStepId}
            onClick={() => onClickNode(step)}
          />
        </div>
      ))}

      {branchStep?.branches && "paths" in branchStep.branches ? (
        <>
          <span className="jc-pending-line" aria-hidden />
          <div className="jc-branch-split duration-200 animate-in fade-in">
            {(() => {
              const paths = branchStep.branches.paths;
              // The Optimizer's own two-way split (see findOptimizerStep) —
              // its Test Journey column gets a visibly different, AI-made
              // treatment; every other multi-way split (e.g. Audience
              // Split's 4 even paths) keeps the plain tag/column.
              const isOptimizerSplit =
                paths.some((p) => p.key === "existing") && paths.some((p) => p.key === "test");
              const mainSteps = paths.find((p) => p.key === "existing")?.steps ?? [];
              return paths.map((splitPath) => {
                const isAiTestPath = isOptimizerSplit && splitPath.key === "test";
                const change = isAiTestPath ? describeTestBranchChange(mainSteps, splitPath.steps) : null;
                const tag = (
                  <span className={`jc-branch-tag${isAiTestPath ? " jc-branch-tag--ai" : ""}`}>
                    {isAiTestPath && (
                      <>
                        <span aria-hidden="true" className="snake-border snake-border--purple" />
                        <img src={sparkle} alt="" className="relative z-[1] h-4 w-4" />
                      </>
                    )}
                    <span className={isAiTestPath ? "relative z-[1]" : undefined}>
                      {splitPath.label} · {splitPath.percentage}%{isAiTestPath ? " · AI" : ""}
                    </span>
                  </span>
                );
                return (
              <div key={splitPath.key} className="jc-branch-col-multi">
                {isAiTestPath ? (
                  <Tooltip>
                    <TooltipTrigger asChild>{tag}</TooltipTrigger>
                    <TooltipContent
                      side="top"
                      className="w-[260px] max-w-[260px] rounded-xl border border-[#EBEBF5] bg-white p-3.5 text-[#17173A] shadow-[0_12px_28px_rgba(23,23,58,0.12)]"
                    >
                      <div className="flex items-start gap-2">
                        <img src={sparkle} alt="" className="mt-0.5 h-4 w-4 shrink-0" />
                        <p className="flex-1 font-manrope text-[13px] font-bold leading-snug text-[#17173A]">
                          Co-Marketer optimization
                        </p>
                        <span className="mt-0.5 shrink-0 rounded-full bg-[#EAF1FF] px-1.5 py-0.5 font-manrope text-[9px] font-bold uppercase tracking-[0.04em] text-[#2F68E5]">
                          AI
                        </span>
                        <X className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#6F6F8D]" strokeWidth={2} />
                      </div>
                      <p className="mt-1.5 font-manrope text-[12px] leading-snug text-[#6F6F8D]">
                        {change
                          ? `This test journey was generated by Co-Marketer — replacing "${change.from}" with "${change.to}" for ${splitPath.percentage}% of your audience, based on the performance of your existing journey.`
                          : `This test journey was generated by Co-Marketer based on the performance of your existing journey.`}
                      </p>
                      <p className="mt-1.5 font-manrope text-[12px] font-semibold text-[#2F68E5]">Learn more →</p>
                    </TooltipContent>
                  </Tooltip>
                ) : (
                  tag
                )}
                <FlowChain
                  steps={splitPath.steps}
                  path={[...path, { stepId: branchStep.id, branch: splitPath.key }]}
                  popoverGap={popoverGap}
                  onTogglePopover={onTogglePopover}
                  onInsert={onInsert}
                  onDropStep={onDropStep}
                  onRemove={onRemove}
                  onClickNode={onClickNode}
                  selectedStepId={selectedStepId}
                  moveArmed={moveArmed}
                  onMoveHere={onMoveHere}
                  pasteArmed={pasteArmed}
                  onGapHover={onGapHover}
                />
              </div>
                );
              });
            })()}
          </div>
        </>
      ) : branchStep?.branches && !("paths" in branchStep.branches) ? (
        <>
          <span className="jc-pending-line" aria-hidden />
          <div className="jc-branch-split duration-200 animate-in fade-in">
            <div className="jc-branch-col yes">
              <span className="jc-branch-tag">Yes</span>
              <FlowChain
                steps={branchStep.branches.yes}
                path={[...path, { stepId: branchStep.id, branch: "yes" }]}
                popoverGap={popoverGap}
                onTogglePopover={onTogglePopover}
                onInsert={onInsert}
                onDropStep={onDropStep}
                onRemove={onRemove}
                onClickNode={onClickNode}
                selectedStepId={selectedStepId}
                moveArmed={moveArmed}
                onMoveHere={onMoveHere}
                pasteArmed={pasteArmed}
                onGapHover={onGapHover}
              />
            </div>
            <div className="jc-branch-col no">
              <span className="jc-branch-tag">{branchStep.paletteNodeId === "wait-for-event" ? "Timeout" : "No"}</span>
              <FlowChain
                steps={branchStep.branches.no}
                path={[...path, { stepId: branchStep.id, branch: "no" }]}
                popoverGap={popoverGap}
                onTogglePopover={onTogglePopover}
                onInsert={onInsert}
                onDropStep={onDropStep}
                onRemove={onRemove}
                onClickNode={onClickNode}
                selectedStepId={selectedStepId}
                moveArmed={moveArmed}
                onMoveHere={onMoveHere}
                pasteArmed={pasteArmed}
                onGapHover={onGapHover}
              />
            </div>
          </div>
        </>
      ) : (
        <>
          <InsertionGap
            path={path}
            index={trunk.length}
            open={sameGap(popoverGap, path, trunk.length)}
            moveArmed={moveArmed}
            pasteArmed={pasteArmed}
            onToggle={onTogglePopover}
            onInsert={onInsert}
            onDropStep={onDropStep}
            onMoveHere={onMoveHere}
            onGapHover={onGapHover}
          />
          <span className="jc-pending-end">End</span>
        </>
      )}
    </>
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

export default function JourneyCanvas({
  hasJourney = true,
  triggerOnly = false,
  triggerLabel = null,
  triggerActive = false,
  aiGenerating = false,
  onChooseTrigger,
  onClickTrigger,
  onCanvasClick,
  flow = [],
  onInsertNode,
  onRemoveNode,
  onClickNode,
  selectedStepId = null,
  onCopyNode,
  onDeleteNode,
  onMoveNode,
  pasteArmed = false,
  onGapHover,
  onOpenDrawer,
  onAuditFlow,
  onShowAnalytics,
  onExperiment,
  onOptimizeJourney,
  showActions = true,
}: {
  hasJourney?: boolean;
  /**
   * Scratch-flow canvas: show just the single Trigger node (+ End) instead
   * of the full sample tree, since nothing beyond the trigger exists yet.
   */
  triggerOnly?: boolean;
  /** The chosen trigger's name, once picked; null while still unset. */
  triggerLabel?: string | null;
  /** Highlights the trigger node while its picker drawer is open. */
  triggerActive?: boolean;
  /** True while the co-marketer chat is still working out an AI-prompt
   *  journey's trigger/steps (JourneyBuilder's aiChatOpen, before the
   *  scripted conversation finishes) — shows a waiting placeholder instead
   *  of the normal "Choose trigger" CTA, since there's nothing to pick yet. */
  aiGenerating?: boolean;
  /** Called when "Choose trigger" is tapped, before anything is picked. */
  onChooseTrigger?: () => void;
  /** Called when the already-resolved trigger node is clicked, to reopen the trigger drawer. */
  onClickTrigger?: () => void;
  /** Called on a plain click on empty canvas — closes a reopened trigger drawer. */
  onCanvasClick?: () => void;
  /** The scratch-flow body after the trigger, as a branching tree. */
  flow?: FlowStep[];
  /**
   * Called with the dragged/picked palette node's id and exactly where to
   * insert it (which chain + index) — from either a drawer row dropped on
   * a specific gap, or one chosen from that gap's own NodePickerPopup.
   */
  onInsertNode?: (paletteNodeId: string, path: FlowPath, index: number) => void;
  onRemoveNode?: (id: string) => void;
  /** Called when any placed node is clicked, to select it — see selectedStepId. */
  onClickNode?: (step: FlowStep) => void;
  /** The currently-selected node, if any — drives the bottom action toolbar
   *  and the selected node's highlight. Owned by the parent (JourneyBuilder)
   *  since selecting a configurable node also opens its settings panel. */
  selectedStepId?: string | null;
  /** Called to duplicate the selected node in place. */
  onCopyNode?: (id: string) => void;
  /** Called to delete the selected node (same effect as its own "x"). */
  onDeleteNode?: (id: string) => void;
  /** Called once a target gap is chosen while "Move" is armed. */
  onMoveNode?: (id: string, path: FlowPath, index: number) => void;
  /** True once ⌘C has copied a node (JourneyBuilder's clipboardStep) —
   *  every gap becomes a paste target until ⌘V, Escape, or a new copy. */
  pasteArmed?: boolean;
  /** True for the duration of a drag from the "Add to journey" panel — every
   *  gap grows a generous, elevated hit-test overlay so the user doesn't have
   *  to land precisely on the small "+" to insert between two nodes. */
  /** Reports the exact gap the mouse is currently over, so JourneyBuilder's
   *  own window-level ⌘V handler knows where to paste. */
  onGapHover?: (target: { path: FlowPath; index: number } | null) => void;
  /** Called by the toolbar's "Add" to reveal the persistent right-side
   *  drawer (it no longer opens its own contextual popup). */
  onOpenDrawer?: () => void;
  /** Called by the bottom bar's "Audit flow" pill. */
  onAuditFlow?: () => void;
  /** Called by the bottom bar's "Show analytics" pill. */
  onShowAnalytics?: () => void;
  /** Called by the bottom bar's "Experiment" pill — hands off to the
   *  Journey Experiment Agent. */
  onExperiment?: () => void;
  /** Called by the bottom bar's "Optimize journey" pill — opens co-marketer
   *  and sends "Optimize journey" as though the marketer typed it, so the
   *  goal-first Journey Optimization Agent conversation plays out exactly
   *  as it would from a typed message. */
  onOptimizeJourney?: () => void;
  /** Hides the bottom node-action toolbar ("+Add"/Copy/Move/Delete) and the
   *  Audit/Optimize/Simulate pill bar — both assume a builder session behind
   *  them (a node drawer, a docked co-marketer wired to this exact canvas),
   *  which a read-only embedding (e.g. the report page's Node wise tab)
   *  doesn't have. Defaults true so every existing caller keeps both. */
  showActions?: boolean;
}) {
  const ZOOM_MIN = 0.35;
  const ZOOM_MAX = 1;
  const ZOOM_STEP = 0.15;
  const [zoom, setZoom] = useState(0.75);
  const clampZoom = (z: number) =>
    Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, Math.round(z * 100) / 100));
  const zoomRef = useRef(zoom);
  zoomRef.current = zoom;

  const [panMode, setPanMode] = useState(true);

  // The one gap whose NodePickerPopup is open, plus that "+" button's own
  // screen position so the popup can anchor right under it.
  const [popover, setPopover] = useState<{ path: FlowPath; index: number; rect: DOMRect } | null>(null);
  const togglePopover = (path: FlowPath, index: number, rect: DOMRect) => {
    setPopover((prev) => (prev && sameGap(prev, path, index) ? null : { path, index, rect }));
  };

  // "Move" armed state — purely a canvas interaction concern (which gap the
  // next click targets), so it lives here rather than in the parent; the
  // actual tree surgery once a gap is picked goes back up via onMoveNode.
  const [moveArmed, setMoveArmed] = useState(false);
  useEffect(() => {
    if (!moveArmed) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMoveArmed(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [moveArmed]);
  // Disarm whenever the selection changes (including deselecting) so "Move"
  // never stays armed for a node that's no longer selected.
  useEffect(() => setMoveArmed(false), [selectedStepId]);

  const tree = useMemo(() => JOURNEY, []);
  const edges = useMemo(() => collectEdges(tree), [tree]);

  const scrollRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const nodeRefs = useRef<Map<string, HTMLElement>>(new Map());
  const centeredRef = useRef(false);
  const [layout, setLayout] = useState({ w: 0, h: 0 });

  // Trackpad pinch (and ctrl/cmd + mouse wheel) zoom — browsers report a
  // pinch gesture as a wheel event with ctrlKey set, regardless of whether a
  // real Ctrl key is held. A plain two-finger scroll (no ctrlKey) is left
  // alone so it keeps panning the canvas natively. Attached as a real DOM
  // listener (not React's onWheel) with { passive: false } so
  // preventDefault actually stops the browser's own page-zoom.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const handleWheel = (e: WheelEvent) => {
      if (!e.ctrlKey) return;
      e.preventDefault();
      setZoom((z) => clampZoom(z - e.deltaY * 0.01));
    };
    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Zoom keyboard shortcuts — ⌘/Ctrl "=" and "-" step the same amount as the
  // +/- buttons, ⌘/Ctrl "0" resets to 100% ("zoom to fit" in the shortcuts
  // reference; this canvas has no separate content-fit calculation, so reset
  // to the default 100% zoom is the closest real equivalent).
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey)) return;
      const target = e.target;
      if (target instanceof HTMLElement && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) return;
      if (e.key === "=" || e.key === "+") {
        e.preventDefault();
        setZoom((z) => clampZoom(z + ZOOM_STEP));
      } else if (e.key === "-") {
        e.preventDefault();
        setZoom((z) => clampZoom(z - ZOOM_STEP));
      } else if (e.key === "0") {
        e.preventDefault();
        setZoom(ZOOM_MAX);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    if (!inner || !hasJourney || triggerOnly) return;

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
        // A plain straight line — no bezier curve — matching the rest of the
        // canvas's connectors (the scratch-flow chain and branch splits are
        // already straight; this keeps the template-tree view consistent).
        return `M ${px} ${py} L ${cx} ${cy}`;
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
  }, [edges, hasJourney, triggerOnly]);

  // The scratch/AI-built flow (triggerOnly — see .jc-empty in
  // journey-canvas.css) is deliberately given more scrollable room than it
  // needs, so a trackpad can always pan around it. Center the scroll
  // position on that room once, the moment it's measurable, so the flow
  // starts in the same visual spot it always has — a later add/remove of
  // steps never re-centers and fights whatever the user has scrolled to.
  const triggerOnlyCenteredRef = useRef(false);
  useEffect(() => {
    if (!triggerOnly) return;
    const el = scrollRef.current;
    if (!el) return;
    const center = () => {
      if (triggerOnlyCenteredRef.current) return;
      if (el.scrollWidth <= el.clientWidth && el.scrollHeight <= el.clientHeight) return;
      el.scrollLeft = (el.scrollWidth - el.clientWidth) / 2;
      el.scrollTop = (el.scrollHeight - el.clientHeight) / 2;
      triggerOnlyCenteredRef.current = true;
    };
    center();
    const ro = new ResizeObserver(center);
    ro.observe(el);
    return () => ro.disconnect();
  }, [triggerOnly]);

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
  // A plain click that lands on empty canvas (not on a node, gap, or any
  // button) closes the trigger drawer if clicking the trigger node just
  // reopened it — pan-drags are already screened out above.
  const onCanvasBackgroundClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest("button, .jc-pending-node, .jc-pending-cta, .jc-added-node, .jc-branch-tag")) return;
    onCanvasClick?.();
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
          <ShortcutTooltip shortcut="⌘-">
            <button
              type="button"
              className="jc-zoom-btn"
              onClick={() => setZoom((z) => clampZoom(z - ZOOM_STEP))}
              disabled={zoom <= ZOOM_MIN}
              aria-label="Zoom out"
            >
              <ZoomOut strokeWidth={1.9} />
            </button>
          </ShortcutTooltip>
          <span className="jc-zoom-value">{Math.round(zoom * 100)}%</span>
          <ShortcutTooltip shortcut="⌘=">
            <button
              type="button"
              className="jc-zoom-btn"
              onClick={() => setZoom((z) => clampZoom(z + ZOOM_STEP))}
              disabled={zoom >= ZOOM_MAX}
              aria-label="Zoom in"
            >
              <ZoomIn strokeWidth={1.9} />
            </button>
          </ShortcutTooltip>
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
        onClick={onCanvasBackgroundClick}
      >
        {triggerOnly ? (
          <div className="jc-empty">
            <div className="jc-pending" style={{ transform: `scale(${zoom})`, transformOrigin: "center" }}>
              {triggerLabel === null && aiGenerating ? (
                <div className="jc-pending-cta jc-pending-waiting">
                  <span className="jc-pending-cta-header">
                    <span className="jc-pending-icon">
                      <Loader2 strokeWidth={2} className="animate-spin" />
                    </span>
                    <strong>Co-marketer is building your journey…</strong>
                  </span>
                  <span className="jc-pending-waiting-sub">
                    Answer its questions in the panel on the right.
                  </span>
                </div>
              ) : triggerLabel === null && !triggerActive ? (
                <div className="jc-pending-cta">
                  <span className="jc-pending-cta-header">
                    <span className="jc-pending-icon">
                      <Zap strokeWidth={2} />
                    </span>
                    <strong>Trigger</strong>
                  </span>
                  <span className="jc-choose-trigger-ring">
                    <button type="button" className="dc-btn dc-btn-primary" onClick={onChooseTrigger}>
                      Choose trigger
                    </button>
                  </span>
                </div>
              ) : (
                <div
                  role={triggerLabel !== null ? "button" : undefined}
                  tabIndex={triggerLabel !== null ? 0 : undefined}
                  onClick={triggerLabel !== null ? onClickTrigger : undefined}
                  className={`jc-pending-node${triggerActive ? " active" : ""}${
                    triggerLabel !== null ? " clickable" : ""
                  }`}
                >
                  <span className="jc-pending-icon">
                    <Zap strokeWidth={2} />
                  </span>
                  <span className="jc-pending-text">
                    <strong>Trigger</strong>
                    <span>{triggerLabel ?? "Select a trigger"}</span>
                  </span>
                </div>
              )}

              {triggerLabel === null ? (
                // Nothing to insert into yet — a plain connector + End.
                <>
                  <span className="jc-pending-line" aria-hidden />
                  <span className="jc-pending-end">End</span>
                </>
              ) : (
                <FlowChain
                  steps={flow}
                  path={[]}
                  popoverGap={popover}
                  onTogglePopover={togglePopover}
                  onInsert={onInsertNode ?? (() => {})}
                  onDropStep={(stepId, targetPath, targetIndex) => onMoveNode?.(stepId, targetPath, targetIndex)}
                  onRemove={onRemoveNode ?? (() => {})}
                  onClickNode={onClickNode ?? (() => {})}
                  selectedStepId={selectedStepId}
                  moveArmed={moveArmed}
                  onMoveHere={(targetPath, targetIndex) => {
                    if (selectedStepId) onMoveNode?.(selectedStepId, targetPath, targetIndex);
                    setMoveArmed(false);
                  }}
                  pasteArmed={pasteArmed}
                  onGapHover={onGapHover}
                />
              )}
            </div>
          </div>
        ) : hasJourney ? (
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

      {/* Bottom node-action toolbar — only once there's an actual flow to
          act on (a trigger is resolved); collapsed to "Add" until a node is
          selected, per selectedStepId from the parent. */}
      {triggerOnly && triggerLabel !== null && showActions && (
        <CanvasToolbar
          expanded={selectedStepId !== null}
          moveArmed={moveArmed}
          onAdd={() => onOpenDrawer?.()}
          onCopy={() => selectedStepId && onCopyNode?.(selectedStepId)}
          onToggleMove={() => setMoveArmed((v) => !v)}
          onDelete={() => selectedStepId && onDeleteNode?.(selectedStepId)}
        />
      )}

      {/* Bottom bar — stuck to the very bottom edge of the canvas panel
          (a real flex row, not a floating overlay like the toolbar above),
          same shape as the reference automation builder's suggestion strip.
          All three pills open the co-marketer panel with a genuine read of
          this journey's current flow. */}
      {triggerOnly && triggerLabel !== null && showActions && (
        <div className="jc-bottom-bar">
          <AIPillButton label="Audit journey" onClick={onAuditFlow} />
          <AIPillButton label="Path Advisor" onClick={onExperiment} />
          <AIPillButton label="Simulate journey" onClick={onShowAnalytics} />
          <AIPillButton label="Optimize journey" onClick={onOptimizeJourney} />
        </div>
      )}

      {popover && (
        <NodePickerPopup
          anchorRect={popover.rect}
          onSelect={(paletteNodeId) => {
            onInsertNode?.(paletteNodeId, popover.path, popover.index);
            setPopover(null);
          }}
          onClose={() => setPopover(null)}
        />
      )}
    </div>
  );
}
