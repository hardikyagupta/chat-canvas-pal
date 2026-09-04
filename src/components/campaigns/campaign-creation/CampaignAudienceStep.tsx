import { useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronDown, Info, UserCheck, X } from "lucide-react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import * as SwitchPrimitives from "@radix-ui/react-switch";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import SegmentSelect, { type SegmentRef } from "./SegmentSelect";
import StepCard from "./StepCard";
import ConditionAttributePicker, {
  COUNTABLE_ATTRIBUTES,
  DEFAULT_VALUE_BY_TYPE,
  OPERATORS_BY_TYPE,
  type AttributeType,
  type ConditionAttribute,
} from "./ConditionAttributePicker";

export type AudienceMode = "all" | "segments" | "adhoc" | "table";

export interface AdhocCondition {
  attribute: string;
  /** Kept alongside the attribute so the row knows its operator set. */
  type: AttributeType;
  operator: string;
  value: string;
  /** "At least N times" — only meaningful for a countable behaviour on
   *  "in the last"; undefined means no threshold, i.e. any number of times. */
  count?: number;
}

export interface AudienceValues {
  mode: AudienceMode;
  segments: SegmentRef[];
  conditions: AdhocCondition[];
  /** Reach for conditions plotted from an agent-built segment — the count that
   *  segment was sized at, kept until the user edits the conditions. */
  conditionsReach?: number;
  table: string;
  excludeEnabled: boolean;
  excludeSegments: SegmentRef[];
  domainEnabled: boolean;
  domains: string[];
  /** Cohort currently plotted from the co-marketer, if any. */
  cohortId: string;
}

export const EMPTY_AUDIENCE: AudienceValues = {
  mode: "all",
  segments: [],
  // No condition by default — the user picks the first attribute from the picker.
  conditions: [],
  table: "",
  excludeEnabled: false,
  excludeSegments: [],
  domainEnabled: false,
  domains: [],
  cohortId: "",
};

/** Reachable base for "All contacts" — everyone with a valid email address. */
const ALL_CONTACTS_REACH = 412_640;

/** The three ways "Filter by" can be narrowed further. */
const FILTER_MODES: { id: AudienceMode; label: string }[] = [
  { id: "segments", label: "Segments/Lists" },
  { id: "adhoc", label: "Conditions" },
  { id: "table", label: "User data table" },
];

const DATA_TABLES = ["orders_master", "loyalty_tier", "app_events_daily", "product_catalogue"];
const EMAIL_DOMAINS = ["gmail.com", "yahoo.com", "outlook.com", "hotmail.com", "icloud.com"];

const nf = new Intl.NumberFormat("en-US");

const chipSelectClass =
  "h-8 rounded-md border border-[#DDE2EE] bg-white px-2 font-manrope text-[13px] text-[#17173A] outline-none focus:border-[#2F68E5]";

/** A smaller toggle than the shared Switch — used for the Exclude/Domain
 *  filter rows, which sit next to compact label text. */
function MiniSwitch({
  checked,
  onCheckedChange,
}: {
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
}) {
  return (
    <SwitchPrimitives.Root
      checked={checked}
      onCheckedChange={onCheckedChange}
      className="peer inline-flex h-4 w-7 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background data-[state=checked]:bg-[#00C48C] data-[state=unchecked]:bg-input"
    >
      <SwitchPrimitives.Thumb className="pointer-events-none block h-3 w-3 rounded-full bg-background shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-3 data-[state=unchecked]:translate-x-0" />
    </SwitchPrimitives.Root>
  );
}

function Radio({ checked }: { checked: boolean }) {
  return (
    <span
      className={cn(
        "grid size-[18px] shrink-0 place-items-center rounded-full border-2 transition-colors",
        checked ? "border-[#2F68E5]" : "border-[#C3CAD9]"
      )}
    >
      {checked && <span className="size-2 rounded-full bg-[#2F68E5]" />}
    </span>
  );
}

function InfoDot({ label }: { label: string }) {
  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            aria-label="More information"
            className="inline-grid shrink-0 place-items-center text-[#8A8AA3] transition-colors hover:text-[#6F6F8D]"
          >
            <Info className="size-4" strokeWidth={2} />
          </button>
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

/** Our own styled dropdown — a trigger button plus a floating option list —
 *  in place of a native <select> wherever the browser's own menu looks out
 *  of place next to the rest of the form. */
function Dropdown({
  value,
  options,
  onChange,
  widthClass = "w-[180px]",
}: {
  value: string;
  options: string[];
  onChange: (v: string) => void;
  widthClass?: string;
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  return (
    <div ref={wrapRef} className={cn("relative shrink-0", widthClass)}>
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
          className={cn(
            "size-3.5 shrink-0 text-[#8A8AA3] transition-transform",
            open && "rotate-180"
          )}
          strokeWidth={2}
        />
      </button>
      {open && (
        <div className="absolute left-0 top-full z-20 mt-1 max-h-[240px] w-full min-w-max overflow-y-auto rounded-md border border-[#DDE2EE] bg-white py-1 shadow-[0_8px_24px_rgba(23,23,58,0.12)]">
          {options.map((o) => (
            <button
              key={o}
              type="button"
              onClick={() => {
                onChange(o);
                setOpen(false);
              }}
              className={cn(
                "block w-full whitespace-nowrap px-3 py-2 text-left font-manrope text-[13px] transition-colors",
                o === value
                  ? "bg-[#F4F8FF] font-semibold text-[#2F68E5]"
                  : "text-[#17173A] hover:bg-[#F7F9FC]"
              )}
            >
              {o}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/** The reachable-contacts count for the Audience step's own accordion
 *  header — shown only while the step is collapsed, since the expanded
 *  body shows the fuller AudienceReachStat instead. */
export function AudienceReachablePill({ reach }: { reach: number }) {
  return (
    <div className="flex h-8 items-center gap-2 rounded-full border border-[#DDE2EE] bg-white pl-2 pr-3">
      <UserCheck className="size-4 text-[#8A8AA3]" strokeWidth={2} />
      <span className="font-manrope text-[13px] text-[#6F6F8D]">
        Potential reach: <span className="font-bold text-[#17173A]">{nf.format(reach)}</span>
      </span>
    </div>
  );
}

/** The same reach count, laid out for the expanded card body — a big
 *  number over its caption. Rendered by the overlay as a sibling of this
 *  step's own StepCard (not inside it), so it sits at the accordion row's
 *  true right edge instead of being capped by the card's own max-width. */
export function AudienceReachStat({ reach }: { reach: number }) {
  return (
    <div className="flex flex-col items-end">
      <span className="font-manrope text-2xl font-bold leading-none text-[#17173A]">
        {nf.format(reach)}
      </span>
      <div className="mt-1 flex items-center gap-1">
        <span className="font-manrope text-[13px] text-[#6F6F8D]">Potential reach</span>
        <InfoDot label="Contacts who can receive this channel after consent and suppression checks." />
      </div>
    </div>
  );
}

/** A bordered toggle row — switch, label, optional info tooltip — and
 *  whatever the switch reveals underneath. */
function FilterSection({
  title,
  info,
  checked,
  onChange,
  children,
}: {
  title: string;
  info?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  children: ReactNode;
}) {
  return (
    <div className="mt-8">
      <div className="flex items-center gap-2">
        <MiniSwitch checked={checked} onCheckedChange={onChange} />
        <p className="font-manrope text-sm font-semibold text-[#17173A]">{title}</p>
        {info && <InfoDot label={info} />}
      </div>

      <div className="t-acc" data-open={checked ? "true" : "false"}>
        <div className="t-acc-panel">
          <div className="t-acc-panel-inner">
            <div className="pt-4">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Reach for the current selection. Overlapping segments are never a clean sum,
 * so we take the largest and add a share of the rest — honest about being an
 * estimate without pretending to a count only the backend can produce.
 */
export function reachFor(v: AudienceValues): number {
  const union = (refs: SegmentRef[]) => {
    const counts = refs.map((r) => r.reach).sort((a, b) => b - a);
    return counts.length
      ? counts[0] + Math.round(counts.slice(1).reduce((a, b) => a + b, 0) * 0.7)
      : 0;
  };

  let base = 0;
  if (v.mode === "all") base = ALL_CONTACTS_REACH;
  if (v.mode === "segments") base = union(v.segments);
  if (v.mode === "adhoc") {
    // An empty condition set matches nobody — 0.42^0 would otherwise
    // read as the full base, which is the opposite of a blank filter.
    base = v.conditions.length
      ? (v.conditionsReach ?? Math.round(ALL_CONTACTS_REACH * Math.pow(0.42, v.conditions.length)))
      : 0;
  }
  if (v.mode === "table") base = v.table ? 38_412 : 0;

  if (v.excludeEnabled) {
    // A suppression only removes people who are in the selection to begin with,
    // so it's capped against the base — a big exclusion list can't take the
    // count below a quarter of what was targeted.
    const overlap = Math.min(Math.round(union(v.excludeSegments) * 0.6), Math.round(base * 0.25));
    base = Math.max(0, base - overlap);
  }
  if (v.domainEnabled && v.domains.length > 0) {
    // Rough domain mix — gmail carries most of a typical base, the rest a tail.
    const share = v.domains.reduce((a, d) => a + (d === "gmail.com" ? 0.54 : 0.09), 0);
    base = Math.round(base * Math.min(1, share));
  }
  return base;
}

/**
 * Audience step — who this campaign goes to. The co-marketer opens alongside it
 * and proposes cohorts; picking one plots straight into these fields, which is
 * why everything here is editable afterwards rather than read-only.
 */
export default function CampaignAudienceStep({
  values,
  onChange,
  highlight,
}: {
  values: AudienceValues;
  onChange: (patch: Partial<AudienceValues>) => void;
  /** Briefly flashed after the co-marketer plots a cohort. */
  highlight?: boolean;
}) {
  /** Any hand edit invalidates a count that came from the co-marketer's segment. */
  const setConditions = (conditions: AdhocCondition[]) =>
    onChange({ conditions, conditionsReach: undefined });

  const setCondition = (index: number, patch: Partial<AdhocCondition>) =>
    setConditions(values.conditions.map((c, i) => (i === index ? { ...c, ...patch } : c)));

  /** A picked attribute carries its own operator set, so the row starts on that
   *  type's first operator and default value rather than an invalid pairing. */
  const conditionFor = (a: ConditionAttribute): AdhocCondition => ({
    attribute: a.label,
    type: a.type,
    operator: OPERATORS_BY_TYPE[a.type][0],
    value: DEFAULT_VALUE_BY_TYPE[a.type],
  });

  const addCondition = (a: ConditionAttribute) =>
    setConditions([...values.conditions, conditionFor(a)]);

  const replaceAttribute = (index: number, a: ConditionAttribute) => {
    const next = conditionFor(a);
    // Swapping within the same type keeps what the user already typed — but
    // never a count from the old attribute, which may not even be countable.
    const current = values.conditions[index];
    setCondition(index, current.type === a.type ? { attribute: a.label, count: undefined } : next);
  };

  return (
    <StepCard wide>
      <div>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
          <button
            type="button"
            onClick={() => onChange({ mode: "all" })}
            className="flex items-center gap-2.5 text-left"
          >
            <Radio checked={values.mode === "all"} />
            <span
              className={cn(
                "font-manrope text-sm text-[#17173A]",
                values.mode === "all" ? "font-semibold" : "font-medium"
              )}
            >
              All contacts
            </span>
          </button>
          <button
            type="button"
            onClick={() => onChange({ mode: values.mode === "all" ? "segments" : values.mode })}
            className="flex items-center gap-2.5 text-left"
          >
            <Radio checked={values.mode !== "all"} />
            <span
              className={cn(
                "font-manrope text-sm text-[#17173A]",
                values.mode !== "all" ? "font-semibold" : "font-medium"
              )}
            >
              Filter by
            </span>
          </button>
        </div>

        {values.mode !== "all" && (
          <div className="mt-4 flex items-center gap-2">
            <ChevronDown className="size-4 shrink-0 text-[#8A8AA3]" strokeWidth={2} />
            <div className="inline-flex">
              {FILTER_MODES.map((m, i) => {
                const active = values.mode === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => onChange({ mode: m.id })}
                    className={cn(
                      "border px-4 py-2 font-manrope text-sm font-medium transition-colors",
                      i > 0 && "-ml-px",
                      i === 0 && "rounded-l-md",
                      i === FILTER_MODES.length - 1 && "rounded-r-md",
                      active
                        ? "relative z-[1] border-[#2F68E5] bg-[#F4F8FF] text-[#2F68E5]"
                        : "border-[#DDE2EE] text-[#17173A] hover:bg-[#F7F9FC]"
                    )}
                  >
                    {m.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {values.mode === "segments" && (
          <div className="mt-4">
            <div className="mb-1.5 flex items-center gap-2">
              <span className="shrink-0 font-manrope text-[13px] font-semibold text-[#6F6F8D]">
                Contacts which are in
              </span>
            </div>
            <div className={cn(highlight && "cmk-plot-flash")}>
              <SegmentSelect
                value={values.segments}
                onChange={(segments) => onChange({ segments })}
              />
            </div>
            <p className="mt-1.5 font-manrope text-xs text-[#6F6F8D]">
              Select upto 15 list / segment
            </p>
          </div>
        )}

        {values.mode === "adhoc" && (
          <div className="mt-4">
            <div className={cn("space-y-2", highlight && "cmk-plot-flash")}>
              {values.conditions.map((c, i) => (
                <div key={i} className="flex flex-wrap items-center gap-1">
                  <span className="w-[90px] shrink-0 font-manrope text-[13px] font-semibold text-[#6F6F8D]">
                    {i === 0 ? "Contacts who" : "And"}
                  </span>
                  <ConditionAttributePicker
                    variant="chip"
                    value={c.attribute}
                    onSelect={(a) => replaceAttribute(i, a)}
                  />
                  {c.type === "recency" && COUNTABLE_ATTRIBUTES.has(c.attribute) && c.operator === "in the last" && (
                    <>
                      <span className="shrink-0 font-manrope text-[13px] font-semibold text-[#6F6F8D]">
                        at least
                      </span>
                      <input
                        type="number"
                        min={1}
                        value={c.count ?? ""}
                        onChange={(e) =>
                          setCondition(i, {
                            count: e.target.value ? Math.max(1, parseInt(e.target.value, 10)) : undefined,
                          })
                        }
                        placeholder="1"
                        className={cn(
                          chipSelectClass,
                          "w-[44px] px-1 text-center [-moz-appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                        )}
                      />
                      <span className="shrink-0 font-manrope text-[13px] font-semibold text-[#6F6F8D]">
                        times
                      </span>
                    </>
                  )}
                  <Dropdown
                    value={c.operator}
                    options={OPERATORS_BY_TYPE[c.type]}
                    onChange={(v) =>
                      setCondition(i, { operator: v, count: v === "in the last" ? c.count : undefined })
                    }
                    widthClass="w-[130px]"
                  />
                  {c.type === "boolean" ? (
                    <Dropdown
                      value={c.value}
                      options={["True", "False"]}
                      onChange={(v) => setCondition(i, { value: v })}
                      widthClass="w-[110px]"
                    />
                  ) : (
                    <input
                      type="text"
                      value={c.value}
                      onChange={(e) => setCondition(i, { value: e.target.value })}
                      className={cn(chipSelectClass, "w-[80px]")}
                    />
                  )}
                  <button
                    type="button"
                    aria-label="Remove condition"
                    onClick={() => setConditions(values.conditions.filter((_, x) => x !== i))}
                    className="grid size-7 place-items-center rounded-md text-[#8A8AA3] hover:bg-[#F0F3F9] hover:text-[#17173A]"
                  >
                    <X className="size-4" strokeWidth={2.2} />
                  </button>
                </div>
              ))}
            </div>
            <div className={cn(values.conditions.length > 0 && "mt-3")}>
              <ConditionAttributePicker onSelect={addCondition} />
              {values.conditions.length === 0 && (
                <p className="mt-1.5 font-manrope text-xs text-[#6F6F8D]">
                  Get started by adding a condition
                </p>
              )}
            </div>
          </div>
        )}

        {values.mode === "table" && (
          <div className="mt-4 flex items-center gap-2">
            <span className="shrink-0 font-manrope text-[13px] font-semibold text-[#6F6F8D]">
              Contacts which are in
            </span>
            <Dropdown
              value={values.table || "Select a table"}
              options={["Select a table", ...DATA_TABLES]}
              onChange={(v) => onChange({ table: v === "Select a table" ? "" : v })}
              widthClass="w-[240px]"
            />
          </div>
        )}
      </div>

      <FilterSection
        title="Don't include"
        info="Contacts in these segments are held back even if they match your targeting."
        checked={values.excludeEnabled}
        onChange={(v) => onChange({ excludeEnabled: v })}
      >
        <SegmentSelect
          value={values.excludeSegments}
          onChange={(excludeSegments) => onChange({ excludeSegments })}
        />
        <p className="mt-1.5 font-manrope text-xs text-[#6F6F8D]">Select upto 15 list / segment</p>
      </FilterSection>

      <FilterSection
        title="Domain"
        info="Include specific email domains from your audience."
        checked={values.domainEnabled}
        onChange={(v) => onChange({ domainEnabled: v })}
      >
        <div className="flex flex-wrap gap-2">
          {EMAIL_DOMAINS.map((d) => {
            const on = values.domains.includes(d);
            return (
              <button
                key={d}
                type="button"
                onClick={() =>
                  onChange({
                    domains: on ? values.domains.filter((x) => x !== d) : [...values.domains, d],
                  })
                }
                className={cn(
                  "rounded-full border px-3 py-1.5 font-manrope text-[13px] font-medium transition-colors",
                  on
                    ? "border-[#2F68E5] bg-[#F4F8FF] text-[#2F68E5]"
                    : "border-[#DDE2EE] bg-white text-[#17173A] hover:bg-[#F7F9FC]"
                )}
              >
                {d}
              </button>
            );
          })}
        </div>
      </FilterSection>
    </StepCard>
  );
}
