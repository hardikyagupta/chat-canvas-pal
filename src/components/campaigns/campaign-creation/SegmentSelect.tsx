import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Search, Sparkles, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { segments } from "../segments.data";

/** Why the co-marketer plotted a cut — shown on hover over its chip. */
export interface SegmentRationale {
  /** Save state of the cut itself, e.g. "Draft". */
  status?: string;
  /** Contacts matching the rules, before reachability is applied. */
  members?: number;
  /** The rules behind the cut, ANDed together. */
  conditions?: string[];
  /** One paragraph on why this cut, in the agent's voice. */
  why: string;
}

/** A list or segment as it sits in the audience form's chips. */
export interface SegmentRef {
  id: string;
  name: string;
  /** Contacts reachable on this channel. */
  reach: number;
  /** Built by the co-marketer rather than picked from saved segments. */
  ai?: boolean;
  /** Present on co-marketer cuts — the reasoning behind this one. */
  rationale?: SegmentRationale;
}

const nf = new Intl.NumberFormat("en-US");

/** Saved segments, in the shape the audience form works in. */
const SAVED: SegmentRef[] = segments.map((s) => ({
  id: String(s.id),
  name: s.name,
  reach: s.email,
  ai: s.aiGenerated,
}));

/**
 * The reasoning behind a co-marketer cut — what it is, the rules it was built
 * from, and why it was picked. Shown on hover so the chip stays a chip: the
 * user can sanity-check a segment they didn't write without leaving the form.
 */
function RationalePanel({ segment }: { segment: SegmentRef }) {
  const [expanded, setExpanded] = useState(false);
  const r = segment.rationale;
  if (!r) return null;

  const conditions = r.conditions ?? [];
  const shown = expanded ? conditions : conditions.slice(0, 3);
  const rowLabel = "w-[74px] shrink-0 font-manrope text-[11px] text-[#8A8AA3]";

  return (
    <div className="font-manrope">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[13px] font-bold leading-[18px] text-[#17173A]">{segment.name}</p>
        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#F3F0FF] px-2 py-0.5 text-[11px] font-semibold text-[#7B5CFA]">
          <Sparkles className="size-3" strokeWidth={2.2} />
          Drafted for you
        </span>
      </div>
      <p className="mt-1 text-[11px] text-[#8A8AA3]">
        {nf.format(r.members ?? segment.reach)} members
      </p>

      <div className="mt-3 space-y-2.5">
        {r.status && (
          <div className="flex gap-2">
            <span className={rowLabel}>Created</span>
            <span className="text-[12px] font-medium text-[#17173A]">{r.status}</span>
          </div>
        )}

        {conditions.length > 0 && (
          <div className="flex gap-2">
            <span className={rowLabel}>Conditions</span>
            <div className="min-w-0 flex-1">
              {shown.map((c, i) => (
                <div key={c}>
                  {i > 0 && (
                    <span className="my-1 inline-block rounded border border-[#DDE2EE] bg-[#F7F9FC] px-1.5 py-px text-[10px] font-semibold text-[#6F6F8D]">
                      AND
                    </span>
                  )}
                  <p className="text-[12px] leading-[17px] text-[#17173A]">{c}</p>
                </div>
              ))}
              {conditions.length > 3 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setExpanded((v) => !v);
                  }}
                  className="mt-1 text-[12px] font-semibold text-[#2F68E5] hover:underline"
                >
                  {expanded ? "Show less" : "Show more"}
                </button>
              )}
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <span className={rowLabel}>Rationale</span>
          <p className="min-w-0 flex-1 text-[12px] leading-[17px] text-[#6F6F8D]">{r.why}</p>
        </div>
      </div>
    </div>
  );
}

/**
 * Multi-select for lists and segments — chips inside the field, options in a
 * dropdown. Anything the co-marketer plotted comes through in `value` and is
 * offered in the list alongside the saved segments.
 */
export default function SegmentSelect({
  value,
  onChange,
  placeholder = "Select list / segment",
  max = 15,
}: {
  value: SegmentRef[];
  onChange: (next: SegmentRef[]) => void;
  placeholder?: string;
  max?: number;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [rect, setRect] = useState<DOMRect | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (!wrapRef.current?.contains(t) && !panelRef.current?.contains(t)) setOpen(false);
    };
    // Escape closes this dropdown first, same as any combobox — and stopping
    // it here keeps it from also closing the wizard the field lives in, since
    // the portalled panel wouldn't unmount in sync with that close animation.
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey, true);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey, true);
    };
  }, [open]);

  // The trigger sits inside the audience form's accordion, which clips
  // overflow to animate its height — so the panel is portalled to <body>
  // and kept in sync with the trigger's live position instead of relying
  // on normal-flow absolute positioning.
  useLayoutEffect(() => {
    if (!open) return;
    const update = () => wrapRef.current && setRect(wrapRef.current.getBoundingClientRect());
    update();
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [open]);

  const options = useMemo(() => {
    // Co-marketer cuts sit at the top — they're why the user is here.
    const extra = value.filter((v) => !SAVED.some((s) => s.id === v.id));
    const all = [...extra, ...SAVED];
    const q = query.trim().toLowerCase();
    return q ? all.filter((o) => o.name.toLowerCase().includes(q)) : all;
  }, [query, value]);

  const toggle = (opt: SegmentRef) => {
    const on = value.some((v) => v.id === opt.id);
    if (on) onChange(value.filter((v) => v.id !== opt.id));
    else if (value.length < max) onChange([...value, opt]);
  };

  return (
    <div ref={wrapRef} className="relative">
      <div
        role="button"
        tabIndex={0}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setOpen((o) => !o);
          }
        }}
        className={cn(
          "flex min-h-10 w-full cursor-pointer items-center gap-2 rounded-md border bg-[#F7F9FC] px-3 py-1.5 transition-colors",
          open ? "border-[#2F68E5] bg-white" : "border-[#DDE2EE]"
        )}
      >
        <div className="flex min-h-7 flex-1 flex-wrap items-center gap-1.5">
          {value.length === 0 ? (
            <span className="font-manrope text-sm text-[#A0A0A0]">{placeholder}</span>
          ) : (
            value.map((v) => {
              const chip = (
                <span
                  className={cn(
                    "inline-flex max-w-[260px] items-center gap-1 rounded-full border bg-white py-1 pl-2.5 pr-1 font-manrope text-[12px] font-medium text-[#17173A]",
                    v.rationale
                      ? "border-[#DDD5FF] hover:border-[#7B5CFA]"
                      : "border-[#DDE2EE]"
                  )}
                >
                  {v.ai && <Sparkles className="size-3 shrink-0 text-[#7B5CFA]" strokeWidth={2.2} />}
                  <span className="truncate">{v.name}</span>
                  <button
                    type="button"
                    aria-label={`Remove ${v.name}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onChange(value.filter((x) => x.id !== v.id));
                    }}
                    className="grid size-4 shrink-0 place-items-center rounded-full text-[#8A8AA3] hover:bg-[#E8ECF4] hover:text-[#17173A]"
                  >
                    <X className="size-3" strokeWidth={2.5} />
                  </button>
                </span>
              );

              // Co-marketer cuts explain themselves on hover; saved segments the
              // user picked themselves need no explaining.
              if (!v.rationale) return <span key={v.id}>{chip}</span>;
              return (
                <HoverCard key={v.id} openDelay={140} closeDelay={120}>
                  <HoverCardTrigger asChild>{chip}</HoverCardTrigger>
                  <HoverCardContent
                    align="start"
                    side="bottom"
                    sideOffset={8}
                    onClick={(e) => e.stopPropagation()}
                    // Above the campaign creation overlay (z-60) it's plotted on.
                    className="z-[70] w-[340px] rounded-lg border-[#E6EAF2] p-3.5 shadow-[0_12px_32px_rgba(23,23,58,0.14)]"
                  >
                    <RationalePanel segment={v} />
                  </HoverCardContent>
                </HoverCard>
              );
            })
          )}
        </div>
        <ChevronDown
          className={cn(
            "size-4 shrink-0 text-[#8A8AA3] transition-transform",
            open && "rotate-180"
          )}
          strokeWidth={2}
        />
      </div>

      {open && rect &&
        createPortal(
          <div
            ref={panelRef}
            style={{ top: rect.bottom + 4, left: rect.left, width: rect.width }}
            className="fixed z-[80] overflow-hidden rounded-md border border-[#DDE2EE] bg-white shadow-[0_8px_24px_rgba(23,23,58,0.12)]"
          >
            <div className="relative border-b border-[#EEF1F7] p-2">
              <Search className="pointer-events-none absolute left-5 top-1/2 size-4 -translate-y-1/2 text-[#8A8AA3]" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search"
                className="h-9 w-full rounded-md bg-[#F7F9FC] pl-9 pr-3 font-manrope text-sm text-[#17173A] outline-none placeholder:text-[#A0A0A0]"
              />
            </div>
            <div className="scroll-slim max-h-[240px] overflow-y-auto py-1">
              {options.length === 0 ? (
                <p className="px-3 py-4 text-center font-manrope text-[13px] text-[#6F6F8D]">
                  No list or segment matches that.
                </p>
              ) : (
                options.map((o) => {
                  const on = value.some((v) => v.id === o.id);
                  return (
                    <button
                      key={o.id}
                      type="button"
                      onClick={() => toggle(o)}
                      className={cn(
                        "flex w-full items-center gap-2.5 px-3 py-2 text-left transition-colors",
                        on ? "bg-[#F4F8FF]" : "hover:bg-[#F7F9FC]"
                      )}
                    >
                      <span
                        className={cn(
                          "grid size-4 shrink-0 place-items-center rounded border-2",
                          on ? "border-[#2F68E5] bg-[#2F68E5]" : "border-[#C3CAD9] bg-white"
                        )}
                      >
                        {on && (
                          <svg viewBox="0 0 12 12" className="size-2.5 text-white" fill="none">
                            <path
                              d="M2.5 6.2 4.8 8.5 9.5 3.8"
                              stroke="currentColor"
                              strokeWidth="2.2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        )}
                      </span>
                      <span className="flex min-w-0 flex-1 items-center gap-1.5">
                        {o.ai && (
                          <Sparkles className="size-3 shrink-0 text-[#7B5CFA]" strokeWidth={2.2} />
                        )}
                        <span className="truncate font-manrope text-[13px] text-[#17173A]">
                          {o.name}
                        </span>
                      </span>
                      <span className="shrink-0 font-manrope text-xs text-[#6F6F8D]">
                        {nf.format(o.reach)}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
