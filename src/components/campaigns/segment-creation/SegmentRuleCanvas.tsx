import { useEffect, useState } from "react";
import { ChevronDown, Copy, Filter, Plus, Trash2, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import type { RuleBlock, RuleField, SegmentDefinition } from "./segmentRules.data";

/**
 * The segment builder canvas (Figma node 5649:44769) — contact type, then the
 * condition blocks the co-marketer generated, then ADD BLOCK / GET COUNT.
 *
 * Rules don't just appear: `plotted` counts up as the caller finishes its
 * thinking pass, and each row fades/slides in on its own beat with a brief
 * highlight so the user can see the agent writing the rule set out.
 */

/** Chip geometry is shared by every dropdown so rows stay on one baseline. */
const chipBase =
  "flex h-8 shrink-0 items-center gap-1.5 rounded-md border border-[#DDE2EE] bg-[#F7F9FC] px-3 font-manrope text-[13px] font-semibold leading-none text-[#17173A] transition-colors";

function SelectChip({ label }: { label: string }) {
  return (
    <button type="button" className={cn(chipBase, "hover:border-[#2F68E5] hover:bg-white")}>
      <span className="truncate">{label}</span>
      <ChevronDown className="h-3.5 w-3.5 shrink-0 text-[#6F6F8D]" strokeWidth={2.5} />
    </button>
  );
}

function ValueChip({ value, width }: { value: string; width?: number }) {
  return (
    <input
      readOnly
      value={value}
      style={width ? { width } : undefined}
      className={cn(
        chipBase,
        "cursor-default font-normal outline-none focus:border-[#2F68E5]",
        !width && "w-[120px]"
      )}
    />
  );
}

function RowActions() {
  const actions = [
    { icon: Filter, label: "Add nested filter" },
    { icon: Copy, label: "Duplicate condition" },
    { icon: Trash2, label: "Delete condition" },
  ];
  return (
    <div className="ml-1 flex shrink-0 items-center gap-1.5 border-l border-[#DDE2EE] pl-2.5">
      {actions.map(({ icon: Icon, label }) => (
        <button
          key={label}
          type="button"
          aria-label={label}
          className="grid h-8 w-8 place-items-center rounded-md border border-[#DDE2EE] bg-white text-[#6F6F8D] transition-colors hover:border-[#2F68E5] hover:text-[#2F68E5]"
        >
          <Icon className="h-3.5 w-3.5" strokeWidth={2} />
        </button>
      ))}
    </div>
  );
}

function Field({ field }: { field: RuleField }) {
  if (field.kind === "text") {
    return (
      <span className="shrink-0 font-manrope text-[13px] text-[#6F6F8D]">{field.value}</span>
    );
  }
  if (field.kind === "input") {
    return <ValueChip value={field.value} width={field.width} />;
  }
  return <SelectChip label={field.value} />;
}

/** Faint outline placeholder standing in for a rule that hasn't landed yet. */
function GhostRow() {
  return (
    <div className="flex items-center gap-2" aria-hidden="true">
      {[132, 148, 108, 88].map((w, i) => (
        <span
          key={i}
          className="seg-ghost-chip h-8 rounded-md"
          style={{ width: w, animationDelay: `${i * 140}ms` }}
        />
      ))}
    </div>
  );
}

function ConditionBlock({
  block,
  /** Index of the first row in this block, in canvas order. */
  offset,
  plotted,
}: {
  block: RuleBlock;
  offset: number;
  plotted: number;
}) {
  // Nothing from this block has landed yet — hold the space with ghosts so the
  // canvas doesn't jump as rows arrive.
  const anyVisible = block.rows.some((_, i) => offset + i < plotted);

  return (
    <div className="rounded-lg border border-[#DDE2EE] bg-white p-4">
      {block.rows.length === 0 ? (
        <>
          <button
            type="button"
            className="dc-btn dc-btn-secondary-blue"
          >
            <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
            Add
          </button>
          <p className="mt-3 font-manrope text-[13px] text-[#6F6F8D]">
            Get started by adding conditions
          </p>
        </>
      ) : (
        <>
          <div className="flex flex-col gap-3">
            {block.rows.map((row, i) => {
              const index = offset + i;
              const visible = index < plotted;
              if (!visible) return <GhostRow key={i} />;
              return (
                <div
                  key={i}
                  className="seg-rule-row flex items-center gap-2"
                  style={{ animationDelay: "0ms" }}
                >
                  {/* Chips wrap among themselves; the actions stay pinned to the
                      row so a long condition can't strand them on their own line. */}
                  <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
                    {row.join && <SelectChip label={row.join} />}
                    {row.fields.map((field, fi) => (
                      <Field key={fi} field={field} />
                    ))}
                  </div>
                  <RowActions />
                </div>
              );
            })}
          </div>

          {anyVisible && (
            <button
              type="button"
              className="mt-3 flex h-8 items-center gap-1.5 rounded-md border border-[#DDE2EE] px-3 font-manrope text-xs font-semibold uppercase tracking-[0.42px] text-[#6F6F8D] transition-colors hover:border-[#2F68E5] hover:text-[#2F68E5]"
            >
              <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
              Add
            </button>
          )}
        </>
      )}
    </div>
  );
}

export default function SegmentRuleCanvas({
  definition,
  plotted,
  /** True once every rule has landed — unlocks the count. */
  settled,
}: {
  definition: SegmentDefinition;
  /** How many rule rows (in canvas order) have been written out so far. */
  plotted: number;
  settled: boolean;
}) {
  const [count, setCount] = useState<string | null>(null);
  const [counting, setCounting] = useState(false);

  // A fresh segment starts over — otherwise reopening the overlay on a
  // different card would show the previous segment's count.
  useEffect(() => {
    setCount(null);
    setCounting(false);
  }, [definition.name]);

  const runCount = () => {
    if (counting) return;
    setCounting(true);
    setCount(null);
    setTimeout(() => {
      setCounting(false);
      setCount(definition.count);
    }, 900);
  };

  // Blocks are numbered continuously so the plot order runs top-to-bottom
  // across include → exclude rather than restarting per block.
  let cursor = 0;
  const totalIncludeRows = definition.include.reduce((n, b) => n + b.rows.length, 0);
  const includeBlocks = definition.include.map((block) => {
    const offset = cursor;
    cursor += block.rows.length;
    return { block, offset };
  });
  const excludeBlocks = (definition.exclude ?? []).map((block) => {
    const offset = cursor;
    cursor += block.rows.length;
    return { block, offset };
  });

  return (
    <div className="rounded-xl border border-[#DDE2EE] bg-white p-6">
      {/* Contact type */}
      <div className="flex items-center gap-4">
        <span className="font-manrope text-sm font-semibold text-[#17173A]">Contact type:</span>
        <button
          type="button"
          className="flex h-10 w-[288px] items-center justify-between rounded-md border border-[#DDE2EE] bg-white px-3 font-manrope text-sm text-[#17173A] transition-colors hover:border-[#2F68E5]"
        >
          {definition.contactType}
          <ChevronDown className="h-4 w-4 text-[#6F6F8D]" strokeWidth={2} />
        </button>
      </div>

      {/* Include */}
      <h2 className="mb-3 mt-6 font-manrope text-base font-bold text-[#17173A]">Include users</h2>
      <div className="flex flex-col gap-4">
        {includeBlocks.map(({ block, offset }, i) => (
          <ConditionBlock key={`inc-${i}`} block={block} offset={offset} plotted={plotted} />
        ))}
        {/* Empty trailing block, as designed — the next block the user fills in.
            Skipped on a blank canvas, where the first block is already empty. */}
        {totalIncludeRows > 0 && (
          <ConditionBlock block={{ rows: [] }} offset={cursor} plotted={plotted} />
        )}
      </div>

      {/* Exclude — only when the agent applied suppressions. */}
      {excludeBlocks.length > 0 && (
        <>
          <h2 className="mb-1 mt-6 font-manrope text-base font-bold text-[#17173A]">
            Exclude users
          </h2>
          <p className="mb-3 font-manrope text-xs text-[#6F6F8D]">
            Contacts matching these are held back even if they match above.
          </p>
          <div className="flex flex-col gap-4">
            {excludeBlocks.map(({ block, offset }, i) => (
              <ConditionBlock key={`exc-${i}`} block={block} offset={offset} plotted={plotted} />
            ))}
          </div>
        </>
      )}

      <div className="mt-5 flex justify-center">
        <button
          type="button"
          className="dc-btn dc-btn-secondary"
        >
          <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
          Add block
        </button>
      </div>

      {/* Count */}
      <div className="mt-6 flex items-center gap-4">
        <button
          type="button"
          onClick={runCount}
          disabled={!settled || counting}
          className={cn(
            "h-10 rounded-md px-6 font-manrope text-xs font-semibold uppercase tracking-[0.42px] text-white transition-colors",
            settled && !counting ? "bg-[#17173A] hover:bg-[#25254f]" : "cursor-not-allowed bg-[#A9B0C4]"
          )}
        >
          {counting ? "Counting…" : "Get count"}
        </button>

        {count && (
          <span className="seg-rule-row flex items-center gap-2 rounded-md border border-[#C9E9DC] bg-[#EDFBF5] px-3 py-2 font-manrope text-sm font-bold text-[#0B7A56]">
            <Users className="h-4 w-4" strokeWidth={2} />
            {count} contacts match
          </span>
        )}
      </div>
    </div>
  );
}
