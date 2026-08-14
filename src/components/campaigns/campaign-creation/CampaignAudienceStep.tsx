import { useState, type ReactNode } from "react";
import { Info, Plus, RefreshCw, UserCheck, X } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import SegmentSelect, { type SegmentRef } from "./SegmentSelect";
import StepCard from "./StepCard";

export type AudienceMode = "all" | "segments" | "adhoc" | "table";

export interface AdhocCondition {
  attribute: string;
  operator: string;
  value: string;
}

export interface AudienceValues {
  mode: AudienceMode;
  segments: SegmentRef[];
  conditions: AdhocCondition[];
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
  conditions: [{ attribute: "Last opened", operator: "in the last", value: "30 days" }],
  table: "",
  excludeEnabled: false,
  excludeSegments: [],
  domainEnabled: false,
  domains: [],
  cohortId: "",
};

/** Reachable base for "All contacts" — everyone with a valid email address. */
const ALL_CONTACTS_REACH = 412_640;

const MODES: { id: AudienceMode; label: string }[] = [
  { id: "all", label: "All contacts" },
  { id: "segments", label: "Segments/Lists" },
  { id: "adhoc", label: "Ad-hoc segment" },
  { id: "table", label: "User data table" },
];

const ATTRIBUTES = ["Last opened", "Last clicked", "Last purchase", "Lifetime orders", "City"];
const OPERATORS = ["in the last", "not in the last", "is", "is not", "is greater than"];
const DATA_TABLES = ["orders_master", "loyalty_tier", "app_events_daily", "product_catalogue"];
const EMAIL_DOMAINS = ["gmail.com", "yahoo.com", "outlook.com", "hotmail.com", "icloud.com"];

const nf = new Intl.NumberFormat("en-US");

const fieldClass =
  "h-10 w-full rounded-md border border-[#DDE2EE] bg-[#F7F9FC] px-3 font-manrope text-sm text-[#17173A] outline-none transition-colors focus:border-[#2F68E5] focus:bg-white";

const chipSelectClass =
  "h-8 rounded-md border border-[#DDE2EE] bg-white px-2 font-manrope text-[13px] text-[#17173A] outline-none focus:border-[#2F68E5]";

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
    <span title={label} className="inline-grid place-items-center text-[#8A8AA3]">
      <Info className="size-4" strokeWidth={2} />
    </span>
  );
}

/** Heading, a bordered toggle row, and whatever the toggle reveals. */
function FilterSection({
  heading,
  title,
  description,
  info,
  checked,
  onChange,
  children,
}: {
  heading: string;
  title: string;
  description?: string;
  info?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  children: ReactNode;
}) {
  return (
    <div className="mt-8">
      <h3 className="font-manrope text-sm font-bold text-[#17173A]">{heading}</h3>
      <div className="mt-2 rounded-md border border-[#DDE2EE] p-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-1.5">
              <p className="font-manrope text-sm font-semibold text-[#17173A]">{title}</p>
              {info && <InfoDot label={info} />}
            </div>
            {description && (
              <p className="mt-1 font-manrope text-xs leading-[18px] text-[#6F6F8D]">
                {description}
              </p>
            )}
          </div>
          <Switch
            checked={checked}
            onCheckedChange={onChange}
            className="shrink-0 data-[state=checked]:bg-[#00C48C]"
          />
        </div>

        <div className="t-acc" data-open={checked ? "true" : "false"}>
          <div className="t-acc-panel">
            <div className="t-acc-panel-inner">
              <div className="pt-4">{children}</div>
            </div>
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
  if (v.mode === "adhoc") base = Math.round(ALL_CONTACTS_REACH * Math.pow(0.42, v.conditions.length));
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
  const [refreshing, setRefreshing] = useState(false);
  const reach = reachFor(values);

  const setCondition = (index: number, patch: Partial<AdhocCondition>) =>
    onChange({
      conditions: values.conditions.map((c, i) => (i === index ? { ...c, ...patch } : c)),
    });

  return (
    <StepCard
      wide
      title="Target audience"
      description="Create a target audience for your campaign."
      action={
        <div className="flex items-center gap-2">
          <div className="flex h-8 items-center gap-2 rounded-full border border-[#DDE2EE] bg-white pl-2 pr-3">
            <UserCheck className="size-4 text-[#8A8AA3]" strokeWidth={2} />
            <span className="font-manrope text-[13px] text-[#6F6F8D]">Reachable contacts</span>
            <span className="font-manrope text-[13px] font-bold text-[#17173A]">
              {nf.format(reach)}
            </span>
            <button
              type="button"
              aria-label="Refresh reachable contacts"
              onClick={() => {
                setRefreshing(true);
                window.setTimeout(() => setRefreshing(false), 900);
              }}
              className="grid size-5 place-items-center rounded-full text-[#8A8AA3] hover:bg-[#F0F3F9] hover:text-[#17173A]"
            >
              <RefreshCw className={cn("size-3.5", refreshing && "animate-spin")} strokeWidth={2.2} />
            </button>
          </div>
          <InfoDot label="Contacts who can receive this channel after consent and suppression checks." />
        </div>
      }
    >
      <div
        className={cn(
          "rounded-md border border-[#DDE2EE] p-4",
          highlight && "cmk-field-flash"
        )}
      >
        <div className="flex flex-wrap items-center gap-x-10 gap-y-3">
          {MODES.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => onChange({ mode: m.id })}
              className="flex items-center gap-2.5 text-left"
            >
              <Radio checked={values.mode === m.id} />
              <span
                className={cn(
                  "font-manrope text-sm text-[#17173A]",
                  values.mode === m.id ? "font-semibold" : "font-medium"
                )}
              >
                {m.label}
              </span>
            </button>
          ))}
        </div>

        {values.mode === "segments" && (
          <div className="mt-4">
            <SegmentSelect
              value={values.segments}
              onChange={(segments) => onChange({ segments })}
            />
            <p className="mt-1.5 font-manrope text-xs text-[#6F6F8D]">
              Select upto 15 list / segment
            </p>
          </div>
        )}

        {values.mode === "adhoc" && (
          <div className="mt-4">
            <div className="space-y-2">
              {values.conditions.map((c, i) => (
                <div key={i} className="flex flex-wrap items-center gap-2">
                  <span className="w-10 font-manrope text-[13px] font-semibold text-[#6F6F8D]">
                    {i === 0 ? "Where" : "And"}
                  </span>
                  <select
                    value={c.attribute}
                    onChange={(e) => setCondition(i, { attribute: e.target.value })}
                    className={chipSelectClass}
                  >
                    {ATTRIBUTES.map((a) => (
                      <option key={a}>{a}</option>
                    ))}
                  </select>
                  <select
                    value={c.operator}
                    onChange={(e) => setCondition(i, { operator: e.target.value })}
                    className={chipSelectClass}
                  >
                    {OPERATORS.map((o) => (
                      <option key={o}>{o}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={c.value}
                    onChange={(e) => setCondition(i, { value: e.target.value })}
                    className={cn(chipSelectClass, "w-[160px]")}
                  />
                  {values.conditions.length > 1 && (
                    <button
                      type="button"
                      aria-label="Remove condition"
                      onClick={() =>
                        onChange({ conditions: values.conditions.filter((_, x) => x !== i) })
                      }
                      className="grid size-7 place-items-center rounded-md text-[#8A8AA3] hover:bg-[#F0F3F9] hover:text-[#17173A]"
                    >
                      <X className="size-4" strokeWidth={2.2} />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() =>
                onChange({
                  conditions: [
                    ...values.conditions,
                    { attribute: "Lifetime orders", operator: "is greater than", value: "0" },
                  ],
                })
              }
              className="mt-3 inline-flex items-center gap-1.5 font-manrope text-[13px] font-semibold text-[#2F68E5] hover:underline"
            >
              <Plus className="size-4" strokeWidth={2.4} />
              Add condition
            </button>
          </div>
        )}

        {values.mode === "table" && (
          <div className="mt-4">
            <select
              value={values.table}
              onChange={(e) => onChange({ table: e.target.value })}
              className={cn(fieldClass, "max-w-[360px]")}
            >
              <option value="">Select a table</option>
              {DATA_TABLES.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      <FilterSection
        heading="Exclude contacts"
        title="Exclude list/segment"
        info="Contacts in these segments are held back even if they match your targeting."
        checked={values.excludeEnabled}
        onChange={(v) => onChange({ excludeEnabled: v })}
      >
        <label className="mb-1.5 block font-manrope text-sm font-semibold text-[#17173A]">
          List / Segment <span className="text-[#FC5E02]">*</span>
        </label>
        <SegmentSelect
          value={values.excludeSegments}
          onChange={(excludeSegments) => onChange({ excludeSegments })}
        />
        <p className="mt-1.5 font-manrope text-xs text-[#6F6F8D]">Select upto 15 list / segment</p>
      </FilterSection>

      <FilterSection
        heading="Domain filters"
        title="Domain"
        description="Include specific Email-domain from your selected set of audience."
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
