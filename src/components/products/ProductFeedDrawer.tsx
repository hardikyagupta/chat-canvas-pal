import { useMemo, useState } from "react";
import { ArrowDownWideNarrow, ArrowUpNarrowWide, Check, Info, Plus, X } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import FeedSelect, { type FeedSelectOption } from "./FeedSelect";
import { catalogs } from "./catalogs.data";

/**
 * "Create product feed" — a two-step drawer: Setup (name, description, the
 * catalog it reads from and how its products are picked) then Review.
 */

const MAX_CONDITIONS = 10;
const NAME_LIMIT = 100;

const CATALOG_OPTIONS: FeedSelectOption[] = catalogs.map((c) => ({
  value: String(c.id),
  label: c.active ? c.name : `${c.name} (in-active)`,
}));

const SELECTION_OPTIONS: FeedSelectOption[] = [
  { value: "best-selling", label: "Best selling products" },
  { value: "most-viewed", label: "Most viewed products" },
  { value: "trending", label: "Trending products" },
  { value: "new-arrival", label: "New arrival" },
  { value: "custom", label: "Custom", hint: "Custom allows manual or rule-based product selection" },
];

// "Location" is the product's stock locations (the same ones the product
// pages list), so a feed can be scoped to where a product is available.
const PAYLOAD_FIELDS = [
  "None",
  "Title",
  "Group ID",
  "Retail price",
  "Sales price",
  "Quantity",
  "Availability",
  "Brand",
  "Collection",
  "Condition",
  "Currency",
  "Description",
  "Link",
  "Product ID",
  "Subcategory",
  "Image Link",
  "Categories",
  "Store",
  "Tag",
  "Added on",
  "Last sync",
  "Location",
];
const PAYLOAD_OPTIONS: FeedSelectOption[] = PAYLOAD_FIELDS.map((f) => ({ value: f, label: f }));

const OPERATOR_OPTIONS: FeedSelectOption[] = [
  "Equals",
  "Does not equal",
  "Contains",
  "Does not contain",
  "Greater than",
  "Less than",
].map((o) => ({ value: o, label: o }));

// What a custom feed can be ordered by — the sortable attributes.
const SORT_OPTIONS: FeedSelectOption[] = [
  "Title",
  "Retail price",
  "Sales price",
  "Quantity",
  "Added on",
  "Last sync",
  "Location",
].map((o) => ({ value: o, label: o }));

type Order = "asc" | "desc";
interface Condition {
  id: number;
  payload: string;
  operator: string;
  value: string;
}

const STEPS = [
  { id: "setup", label: "Setup" },
  { id: "review", label: "Review products" },
] as const;

function Label({ children, info }: { children: React.ReactNode; info?: string }) {
  return (
    <div className="mb-2 flex items-center gap-1.5 font-manrope text-[13px] font-semibold text-[#17173A]">
      <span>
        {children} <span className="text-[#F05C5C]">*</span>
      </span>
      {info && (
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="grid place-items-center text-[#6F6F8D]">
              <Info className="h-3.5 w-3.5" strokeWidth={1.8} />
            </span>
          </TooltipTrigger>
          <TooltipContent
            side="top"
            className="z-[200] max-w-[240px] rounded-md border-0 bg-black px-3 py-2 font-manrope text-xs font-normal text-white"
          >
            {info}
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  );
}

function CountedInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <div>
      <input
        value={value}
        maxLength={NAME_LIMIT}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-10 w-full rounded-[5px] border border-[#DDE2EE] bg-white px-3 font-manrope text-sm text-[#17173A] outline-none transition-colors placeholder:text-[#9494AE] hover:border-[#9898B0] focus:border-[#2F68E5] focus:shadow-[0_0_0_3px_rgba(47,104,229,0.12)]"
      />
      <p className="mt-1.5 text-right font-manrope text-[11px] font-semibold text-[#6F6F8D]">
        {value.length}/{NAME_LIMIT}
      </p>
    </div>
  );
}

function OrderButton({
  order,
  selected,
  onSelect,
}: {
  order: Order;
  selected: boolean;
  onSelect: () => void;
}) {
  const Icon = order === "asc" ? ArrowUpNarrowWide : ArrowDownWideNarrow;
  const label = order === "asc" ? "Ascending" : "Descending";
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label={label}
          aria-pressed={selected}
          onClick={onSelect}
          className={cn(
            "grid h-10 w-12 place-items-center rounded-[5px] border bg-white transition-colors",
            selected
              ? "border-[#2F68E5] bg-[#EDF1FF] text-[#2F68E5]"
              : "border-[#DDE2EE] text-[#6F6F8D] hover:border-[#9898B0] hover:text-[#17173A]"
          )}
        >
          <Icon className="h-4 w-4" strokeWidth={1.8} />
        </button>
      </TooltipTrigger>
      <TooltipContent
        side="bottom"
        className="z-[200] rounded-md border-0 bg-black px-3 py-1.5 font-manrope text-xs text-white"
      >
        {label}
      </TooltipContent>
    </Tooltip>
  );
}

export default function ProductFeedDrawer({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [catalog, setCatalog] = useState(CATALOG_OPTIONS[0].value);
  const [selection, setSelection] = useState("");
  const [sortBy, setSortBy] = useState("");
  const [order, setOrder] = useState<Order | null>(null);
  const [conditions, setConditions] = useState<Condition[]>([
    { id: 1, payload: "", operator: "", value: "" },
  ]);
  const [nextId, setNextId] = useState(2);

  const custom = selection === "custom";
  const setupValid =
    name.trim() !== "" &&
    description.trim() !== "" &&
    catalog !== "" &&
    selection !== "" &&
    (!custom || (sortBy !== "" && order !== null));

  const catalogName = useMemo(() => catalogs.find((c) => String(c.id) === catalog)?.name ?? "", [catalog]);
  const selectionLabel = SELECTION_OPTIONS.find((o) => o.value === selection)?.label ?? "";

  const activeConditions = conditions.filter((c) => c.payload && c.payload !== "None" && c.operator);

  const updateCondition = (id: number, patch: Partial<Condition>) =>
    setConditions((cs) => cs.map((c) => (c.id === id ? { ...c, ...patch } : c)));

  const addCondition = () => {
    setConditions((cs) => [...cs, { id: nextId, payload: "", operator: "", value: "" }]);
    setNextId((n) => n + 1);
  };

  const create = () => {
    onClose();
    toast.success(`Product feed “${name.trim()}” created`);
  };

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent
        side="right"
        className="flex w-[63vw] min-w-[760px] flex-col gap-0 border-l-0 p-0 sm:max-w-none [&>button:last-child]:hidden"
      >
        <SheetDescription className="sr-only">Create a product feed</SheetDescription>

        {/* Header */}
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-[#DDE2EE] px-10">
          <SheetTitle className="font-manrope text-lg font-bold text-[#17173A]">Product feed</SheetTitle>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid h-8 w-8 place-items-center rounded text-[#6F6F8D] transition-colors hover:bg-[#F7F9FC] hover:text-[#17173A]"
          >
            <X className="h-5 w-5" strokeWidth={2} />
          </button>
        </div>

        <div className="flex min-h-0 flex-1">
          {/* Steps */}
          <aside className="w-[315px] shrink-0 border-r border-[#DDE2EE] px-10 pt-6">
            <p className="font-manrope text-xs font-semibold text-[#17173A]">
              <span className="text-[15px] text-[#2F68E5]">{step}</span> / {STEPS.length} Steps completed
            </p>
            <div className="mt-2 h-1 overflow-hidden rounded-full bg-[#E8EBF3]">
              <div
                className="h-full rounded-full bg-[#00C48C] transition-[width] duration-300"
                style={{ width: `${(step / STEPS.length) * 100}%` }}
              />
            </div>

            <ol className="mt-6">
              {STEPS.map((s, i) => {
                const done = i < step;
                const current = i === step;
                return (
                  <li key={s.id} className="relative flex items-center gap-3 pb-8 last:pb-0">
                    {i < STEPS.length - 1 && (
                      <span aria-hidden className="absolute left-[11px] top-6 h-[calc(100%-12px)] w-px bg-[#DDE2EE]" />
                    )}
                    <span
                      className={cn(
                        "relative grid size-6 shrink-0 place-items-center rounded-full border",
                        done
                          ? "border-[#00C48C] bg-[#00C48C] text-white"
                          : current
                            ? "border-[#00C48C] bg-[#ECFDF3]"
                            : "border-[#DDE2EE] bg-white"
                      )}
                    >
                      {done ? (
                        <Check className="h-3.5 w-3.5" strokeWidth={3} />
                      ) : (
                        current && <span className="size-2 rounded-full bg-[#00C48C]" />
                      )}
                    </span>
                    <span
                      className={cn(
                        "font-manrope text-[15px]",
                        current ? "font-bold text-[#17173A]" : done ? "font-semibold text-[#17173A]" : "text-[#6F6F8D]"
                      )}
                    >
                      {s.label}
                    </span>
                  </li>
                );
              })}
            </ol>
          </aside>

          {/* Step content */}
          <div className="scroll-slim min-w-0 flex-1 overflow-y-auto px-10 py-6">
            {step === 0 ? (
              <div className="max-w-[820px]">
                <h2 className="font-manrope text-lg font-bold text-[#17173A]">Setup</h2>

                <div className="mt-4">
                  <Label>Name</Label>
                  <CountedInput value={name} onChange={setName} placeholder="Ex: Demoblock" />
                </div>

                <div className="mt-3">
                  <Label>Description</Label>
                  <CountedInput value={description} onChange={setDescription} placeholder="Enter" />
                </div>

                <div className="mt-3">
                  <Label>Catalog</Label>
                  <FeedSelect value={catalog} onChange={setCatalog} options={CATALOG_OPTIONS} />
                </div>

                <div className="mt-6 grid grid-cols-2 gap-5">
                  <div>
                    <Label>How should products be selected?</Label>
                    <FeedSelect value={selection} onChange={setSelection} options={SELECTION_OPTIONS} />
                  </div>
                  {custom && (
                    <div>
                      <Label info="Products are ordered by this attribute.">Sort by</Label>
                      <FeedSelect value={sortBy} onChange={setSortBy} options={SORT_OPTIONS} />
                    </div>
                  )}
                </div>

                {custom && (
                  <>
                    <div className="mt-6">
                      <Label>Order by</Label>
                      <div className="flex gap-3">
                        <OrderButton order="asc" selected={order === "asc"} onSelect={() => setOrder("asc")} />
                        <OrderButton order="desc" selected={order === "desc"} onSelect={() => setOrder("desc")} />
                      </div>
                    </div>

                    <div className="mt-6 flex flex-col gap-3">
                      {conditions.map((c, i) => (
                        <div key={c.id} className="flex flex-wrap items-center gap-x-3 gap-y-3">
                          <span className="w-[150px] shrink-0 whitespace-nowrap font-manrope text-[13px] font-semibold text-[#17173A]">
                            {i === 0 ? "Show products where" : "and"}
                          </span>
                          <FeedSelect
                            className="w-[180px]"
                            value={c.payload}
                            onChange={(v) => updateCondition(c.id, { payload: v })}
                            options={PAYLOAD_OPTIONS}
                            placeholder="Payload"
                          />
                          <FeedSelect
                            className="w-[160px]"
                            value={c.operator}
                            onChange={(v) => updateCondition(c.id, { operator: v })}
                            options={OPERATOR_OPTIONS}
                            placeholder="Operator"
                          />
                          <input
                            value={c.value}
                            onChange={(e) => updateCondition(c.id, { value: e.target.value })}
                            placeholder="Enter Value"
                            className="h-10 w-[200px] rounded-[5px] border border-[#DDE2EE] bg-white px-3 font-manrope text-sm text-[#17173A] outline-none transition-colors placeholder:text-[#9494AE] hover:border-[#9898B0] focus:border-[#2F68E5]"
                          />
                          {conditions.length > 1 && (
                            <button
                              type="button"
                              aria-label="Remove condition"
                              onClick={() => setConditions((cs) => cs.filter((x) => x.id !== c.id))}
                              className="grid h-8 w-8 place-items-center rounded text-[#6F6F8D] hover:bg-[#F7F9FC] hover:text-[#17173A]"
                            >
                              <X className="h-4 w-4" strokeWidth={2} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={addCondition}
                      disabled={conditions.length >= MAX_CONDITIONS}
                      className="dc-btn dc-btn-secondary-blue mt-5"
                    >
                      <Plus />
                      Add ({MAX_CONDITIONS - conditions.length})
                    </button>
                  </>
                )}
              </div>
            ) : (
              <div className="max-w-[820px]">
                <h2 className="font-manrope text-lg font-bold text-[#17173A]">Review products</h2>
                <p className="mt-1 font-manrope text-[13px] text-[#6F6F8D]">
                  Check the feed's setup before creating it.
                </p>

                <dl className="mt-5 divide-y divide-[#EDF0F7] rounded-lg border border-[#DDE2EE] bg-white">
                  {(
                    [
                      ["Name", name.trim()],
                      ["Description", description.trim()],
                      ["Catalog", catalogName],
                      ["Products selected", selectionLabel],
                      ...(custom
                        ? ([
                            ["Sorted by", `${sortBy} · ${order === "asc" ? "Ascending" : "Descending"}`],
                            [
                              "Show products where",
                              activeConditions.length
                                ? activeConditions
                                    .map((c) => `${c.payload} ${c.operator.toLowerCase()} ${c.value}`.trim())
                                    .join("; ")
                                : "All products",
                            ],
                          ] as [string, string][])
                        : []),
                    ] as [string, string][]
                  ).map(([k, v]) => (
                    <div key={k} className="grid grid-cols-[200px_1fr] gap-4 px-5 py-3.5">
                      <dt className="font-manrope text-[13px] text-[#6F6F8D]">{k}</dt>
                      <dd className="min-w-0 break-words font-manrope text-sm font-medium text-[#17173A]">{v}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex h-[72px] shrink-0 items-center gap-3 border-t border-[#DDE2EE] px-10">
          {step === 0 ? (
            <button type="button" disabled={!setupValid} onClick={() => setStep(1)} className="dc-btn dc-btn-primary">
              Next
            </button>
          ) : (
            <>
              <button type="button" onClick={() => setStep(0)} className="dc-btn dc-btn-secondary">
                Back
              </button>
              <button type="button" onClick={create} className="dc-btn dc-btn-primary">
                Create product feed
              </button>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
