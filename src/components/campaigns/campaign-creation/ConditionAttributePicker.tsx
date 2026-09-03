import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  Activity,
  ChevronDown,
  Contact,
  Info,
  Plus,
  RadioTower,
  Search,
  Smartphone,
  Sparkles,
  Target,
  Users,
  type LucideIcon,
} from "lucide-react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

/**
 * The attribute picker behind a condition row — search field, category tabs,
 * then the grouped attribute list. Opened by "Add" on a blank condition set
 * and by the attribute chip on a row that already exists.
 */

/** Wide enough for the whole tab row; narrowed to fit a small viewport. */
const PANEL_MAX_WIDTH = 960;

/** What a condition compares against — decides its operators and default value. */
export type AttributeType = "recency" | "number" | "text" | "boolean";

export interface ConditionAttribute {
  label: string;
  type: AttributeType;
  /** Rendered as an info dot beside the label, as in the reference picker. */
  info?: string;
}

interface AttributeCategory {
  label: string;
  icon: LucideIcon;
  attributes: ConditionAttribute[];
}

const CATEGORIES: AttributeCategory[] = [
  {
    label: "Engagement",
    icon: Users,
    attributes: [
      { label: "Email Opened/Read", type: "recency" },
      { label: "Email Clicked", type: "recency" },
      {
        label: "Email soft bounce",
        type: "recency",
        info: "A temporary delivery failure — full inbox, server timeout — that may clear on its own.",
      },
      {
        label: "Email hard bounce",
        type: "recency",
        info: "A permanent failure. The address is invalid and is suppressed from future sends.",
      },
      { label: "Email unsubscribed", type: "recency" },
      { label: "SMS Clicked", type: "recency" },
      { label: "Push Opened", type: "recency" },
    ],
  },
  {
    label: "User attributes",
    icon: Target,
    attributes: [
      { label: "Email", type: "text" },
      { label: "Phone number", type: "text" },
      { label: "City", type: "text" },
      { label: "Country", type: "text" },
      { label: "Lifetime orders", type: "number" },
      { label: "Lifetime revenue", type: "number" },
      { label: "Last purchase date", type: "recency" },
      { label: "Signup date", type: "recency" },
    ],
  },
  {
    label: "Behaviour",
    icon: Activity,
    attributes: [
      { label: "Purchase", type: "recency" },
      { label: "Added to cart", type: "recency" },
      { label: "Product viewed", type: "recency" },
      { label: "App opened", type: "recency" },
      { label: "Page visited", type: "recency" },
    ],
  },
  {
    label: "Technographic",
    icon: Smartphone,
    attributes: [
      { label: "Device type", type: "text" },
      { label: "Operating system", type: "text" },
      { label: "Browser", type: "text" },
      { label: "App version", type: "text" },
    ],
  },
  {
    label: "Reachable channel",
    icon: RadioTower,
    attributes: [
      { label: "Reachable on email", type: "boolean" },
      { label: "Reachable on SMS", type: "boolean" },
      { label: "Reachable on app push", type: "boolean" },
      { label: "Reachable on WhatsApp", type: "boolean" },
    ],
  },
  {
    label: "Contacts",
    icon: Contact,
    attributes: [
      { label: "In segment", type: "text" },
      { label: "In list", type: "text" },
      { label: "Subscription status", type: "text" },
      { label: "Contact source", type: "text" },
    ],
  },
  {
    label: "Predictive",
    icon: Sparkles,
    attributes: [
      {
        label: "Churn probability",
        type: "number",
        info: "Modelled likelihood this contact goes inactive in the next 30 days.",
      },
      { label: "Predicted lifetime value", type: "number" },
      { label: "Likelihood to purchase", type: "number" },
      { label: "Engagement score", type: "number" },
    ],
  },
];

export const OPERATORS_BY_TYPE: Record<AttributeType, string[]> = {
  recency: ["in the last", "not in the last", "before"],
  number: ["is greater than", "is less than", "equals"],
  text: ["is", "is not", "contains"],
  boolean: ["is", "is not"],
};

export const DEFAULT_VALUE_BY_TYPE: Record<AttributeType, string> = {
  recency: "30 days",
  number: "0",
  text: "",
  boolean: "True",
};

function InfoDot({ label }: { label: string }) {
  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            role="img"
            aria-label={label}
            className="inline-grid shrink-0 place-items-center text-[#8A8AA3]"
          >
            <Info className="size-3.5" strokeWidth={2} />
          </span>
        </TooltipTrigger>
        <TooltipContent
          side="right"
          align="center"
          sideOffset={8}
          className="max-w-[260px] overflow-visible rounded-lg border-0 bg-black px-3 py-2.5 text-white shadow-none"
        >
          <p className="font-manrope text-xs leading-[18px]">{label}</p>
          <TooltipPrimitive.Arrow className="fill-black" width={10} height={6} />
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export default function ConditionAttributePicker({
  value,
  onSelect,
  variant = "add",
}: {
  /** Current attribute, shown on the chip variant. */
  value?: string;
  onSelect: (attribute: ConditionAttribute) => void;
  /** "add" is the blank-state trigger; "chip" edits an existing row. */
  variant?: "add" | "chip";
}) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState("All");
  const [query, setQuery] = useState("");
  const [rect, setRect] = useState<
    { left: number; top: number; width: number; maxHeight: number } | null
  >(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  /* The panel is portaled to the body: it lives inside the wizard accordion,
     whose card and body wrapper both clip overflow to animate their height, so
     an absolutely-positioned panel would be cropped at the card edge. */
  const place = useCallback(() => {
    const trigger = wrapRef.current?.getBoundingClientRect();
    if (!trigger) return;
    const margin = 12;
    const width = Math.min(PANEL_MAX_WIDTH, window.innerWidth - margin * 2);
    const below = window.innerHeight - trigger.bottom - margin - 8;
    const above = trigger.top - margin - 8;
    // Drop upwards when there isn't room under the trigger for a usable list.
    const flip = below < 280 && above > below;
    const height = Math.min(420, Math.max(flip ? above : below, 220));
    setRect({
      left: Math.min(Math.max(margin, trigger.left), window.innerWidth - width - margin),
      top: flip ? Math.max(margin, trigger.top - 8 - height) : trigger.bottom + 8,
      width,
      maxHeight: height,
    });
  }, []);

  useEffect(() => {
    if (!open) return;
    place();
    const onDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (!wrapRef.current?.contains(target) && !panelRef.current?.contains(target)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    // Capture picks up scrolling in the wizard canvas, not just the window.
    window.addEventListener("scroll", place, true);
    window.addEventListener("resize", place);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", place, true);
      window.removeEventListener("resize", place);
    };
  }, [open, place]);

  // Each open starts clean, so a stale search never hides the whole list.
  useEffect(() => {
    if (!open) {
      setQuery("");
      setTab("All");
    }
  }, [open]);

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    return CATEGORIES.filter((c) => tab === "All" || c.label === tab)
      .map((c) => ({
        ...c,
        attributes: q
          ? c.attributes.filter((a) => a.label.toLowerCase().includes(q))
          : c.attributes,
      }))
      .filter((c) => c.attributes.length > 0);
  }, [tab, query]);

  const pick = (attribute: ConditionAttribute) => {
    onSelect(attribute);
    setOpen(false);
  };

  return (
    <div ref={wrapRef} className={cn("relative", variant === "chip" ? "w-[180px] shrink-0" : "inline-block")}>
      {variant === "chip" ? (
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className={cn(
            "flex h-8 w-full items-center justify-between gap-2 rounded-md border bg-white px-2.5 font-manrope text-[13px] text-[#17173A] outline-none transition-colors",
            open ? "border-[#2F68E5]" : "border-[#DDE2EE]"
          )}
        >
          <span className="truncate">{value}</span>
          <ChevronDown
            className={cn("size-3.5 shrink-0 text-[#8A8AA3] transition-transform", open && "rotate-180")}
            strokeWidth={2}
          />
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="inline-flex items-center gap-1.5 font-manrope text-[13px] font-semibold text-[#2F68E5] hover:underline"
        >
          <Plus className="size-4" strokeWidth={2.4} />
          Add
        </button>
      )}

      {open && rect && createPortal(
        <div
          ref={panelRef}
          style={{
            left: rect.left,
            top: rect.top,
            width: rect.width,
            maxHeight: rect.maxHeight,
          }}
          className="fixed z-[120] flex flex-col overflow-hidden rounded-lg border border-[#DDE2EE] bg-white shadow-[0_12px_32px_rgba(23,23,58,0.16)]"
        >
          <div className="flex shrink-0 items-center gap-3 border-b border-[#DDE2EE] px-4 py-3">
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search"
              aria-label="Search attributes"
              className="min-w-0 flex-1 bg-transparent font-manrope text-sm text-[#17173A] outline-none placeholder:text-[#8A8AA3]"
            />
            <Search className="size-[18px] shrink-0 text-[#17173A]" strokeWidth={2} />
          </div>

          <div className="flex shrink-0 items-center overflow-x-auto border-b border-[#DDE2EE] px-2 scroll-slim">
            {["All", ...CATEGORIES.map((c) => c.label)].map((label) => {
              const Icon = CATEGORIES.find((c) => c.label === label)?.icon;
              const active = tab === label;
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => setTab(label)}
                  className={cn(
                    "relative flex shrink-0 items-center gap-1.5 whitespace-nowrap px-2.5 py-2.5 font-manrope text-[13px] transition-colors",
                    active ? "font-bold text-[#2F68E5]" : "font-medium text-[#6F6F8D] hover:text-[#17173A]"
                  )}
                >
                  {Icon && <Icon className="size-3.5 shrink-0" strokeWidth={2} />}
                  {label}
                  {active && <span className="absolute inset-x-2 -bottom-px h-0.5 bg-[#2F68E5]" />}
                </button>
              );
            })}
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto py-2">
            {groups.length === 0 ? (
              <p className="px-4 py-3 font-manrope text-[13px] text-[#6F6F8D]">
                No attributes match “{query}”.
              </p>
            ) : (
              groups.map((group) => (
                <div key={group.label}>
                  <p className="px-4 pb-1 pt-3 font-manrope text-[13px] font-bold text-[#17173A]">
                    {group.label}
                  </p>
                  {group.attributes.map((attribute) => (
                    <button
                      key={attribute.label}
                      type="button"
                      onClick={() => pick(attribute)}
                      className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left transition-colors hover:bg-[#F7F9FC]"
                    >
                      <group.icon className="size-4 shrink-0 text-[#6F6F8D]" strokeWidth={2} />
                      <span className="font-manrope text-[13px] font-semibold text-[#17173A]">
                        {attribute.label}
                      </span>
                      {attribute.info && <InfoDot label={attribute.info} />}
                    </button>
                  ))}
                </div>
              ))
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
