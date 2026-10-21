import { useRef, useState } from "react";
import { ChevronDown, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
  CASE_OPTIONS,
  CONTENT_FETCHES,
  LIQUID_FILTERS,
  PAYLOAD_EVENTS,
  USER_ATTRIBUTE_FIELDS,
  VARIABLE_SOURCES,
  buildLiquid,
  type CaseId,
  type LiquidFilterId,
  type VariableField,
  type VariableGroup,
  type VariableSource,
} from "./smsVariables.data";

/** Person-in-frame glyph for the personalize button. */
function PersonalizeIcon({ className }: { className?: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
      <path
        d="M3 6.5V5a2 2 0 0 1 2-2h1.5M13.5 3H15a2 2 0 0 1 2 2v1.5M17 13.5V15a2 2 0 0 1-2 2h-1.5M6.5 17H5a2 2 0 0 1-2-2v-1.5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <circle cx="10" cy="8.3" r="2.1" stroke="currentColor" strokeWidth="1.4" />
      <path d="M6.2 14.2c.6-1.9 2-2.8 3.8-2.8s3.2.9 3.8 2.8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

/** Where the picker is: the three sources, one source's list, a group's fields, or a field's settings. */
type View =
  | { step: "root" }
  | { step: "list"; source: VariableSource }
  | { step: "fields"; source: VariableSource; group: VariableGroup }
  | { step: "configure"; source: VariableSource; group: VariableGroup | null; field: VariableField };

const SOURCE_TITLE: Record<VariableSource, string> = {
  attribute: "User attribute",
  payload: "User activity payload",
  fetch: "Content fetch",
};

const rowClass =
  "flex w-full items-center justify-between px-5 py-3.5 text-left font-manrope text-[15px] font-semibold text-[#1E3A8A] transition-colors hover:bg-[#F5F9FF]";

function BackHeader({ title, onBack, blue = true }: { title: string; onBack: () => void; blue?: boolean }) {
  return (
    <button
      type="button"
      onClick={onBack}
      className={cn(
        "flex w-full items-center gap-2.5 border-b border-[#E4E7F0] px-4 py-3.5 text-left font-manrope text-[15px] font-semibold",
        blue ? "text-[#1E3A8A]" : "text-[#17173A]"
      )}
    >
      <ChevronLeft className="size-4 text-[#6F6F8D]" strokeWidth={2.6} />
      <span className="truncate">{title}</span>
    </button>
  );
}

function SearchRow({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="mx-4 flex items-center border-b border-[#E4E7F0]">
      <input
        autoFocus
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search"
        className="h-11 min-w-0 flex-1 bg-transparent font-manrope text-[15px] text-[#17173A] outline-none placeholder:text-[#A0A0B0]"
      />
      <Search className="size-4 text-[#6F6F8D]" strokeWidth={2} />
    </div>
  );
}

function ConfigureView({
  title,
  onBack,
  onAdd,
}: {
  title: string;
  onBack: () => void;
  onAdd: (opts: { defaultValue: string; caseId: CaseId; filterId: LiquidFilterId }) => void;
}) {
  const [defaultValue, setDefaultValue] = useState("");
  const [caseId, setCaseId] = useState<CaseId>("default");
  const [filterId, setFilterId] = useState<LiquidFilterId>("none");

  return (
    <div>
      <BackHeader title={`Configure ${title}`} onBack={onBack} />
      <div className="space-y-5 p-5 font-manrope">
        <div>
          <p className="mb-2 text-[15px] font-semibold text-[#17173A]">Default value</p>
          <input
            value={defaultValue}
            onChange={(e) => setDefaultValue(e.target.value)}
            placeholder="Enter default value"
            className="h-11 w-full rounded-[4px] border border-transparent bg-[#F7F7F9] px-4 text-[14px] text-[#17173A] outline-none placeholder:text-[#A0A0B0] focus:border-[#2F68E5] focus:bg-white"
          />
        </div>

        <div>
          <p className="mb-2 text-[15px] font-semibold text-[#17173A]">Case</p>
          <div className="flex overflow-hidden rounded-[4px] border border-[#DDE2EE]">
            {CASE_OPTIONS.map((c, i) => (
              <button
                key={c.id}
                type="button"
                aria-pressed={caseId === c.id}
                onClick={() => setCaseId(c.id)}
                className={cn(
                  "h-11 flex-1 text-[15px] font-bold transition-colors",
                  i > 0 && "border-l border-[#DDE2EE]",
                  caseId === c.id ? "bg-[#1E3A8A] text-white" : "bg-white text-[#6F6F8D] hover:bg-[#F7F9FC]"
                )}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-[15px] font-semibold text-[#17173A]">Filter</p>
          <div className="relative">
            <select
              value={filterId}
              onChange={(e) => setFilterId(e.target.value as LiquidFilterId)}
              className="h-11 w-full appearance-none rounded-[4px] border border-transparent bg-[#F7F7F9] px-4 pr-10 text-[15px] text-[#17173A] outline-none focus:border-[#2F68E5] focus:bg-white"
            >
              {LIQUID_FILTERS.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.label}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-[#6F6F8D]" />
          </div>
        </div>

        <button
          type="button"
          onClick={() => onAdd({ defaultValue, caseId, filterId })}
          className="dc-btn dc-btn-primary w-full uppercase"
        >
          Add attribute
        </button>
      </div>
    </div>
  );
}

/**
 * One mapped template variable: a text field taking a liquid expression, with a
 * personalize button that opens the picker — pick a source (user attribute,
 * activity payload, content fetch), drill to a field, set its default / case /
 * filter, and ADD ATTRIBUTE drops the resulting `{{ … }}` into the field.
 */
export default function SmsVariableField({
  value,
  onChange,
  invalid,
  ariaLabel,
}: {
  value: string;
  onChange: (value: string) => void;
  invalid?: boolean;
  ariaLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<View>({ step: "root" });
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const go = (next: View) => {
    setQuery("");
    setView(next);
  };

  const close = () => {
    setOpen(false);
    go({ step: "root" });
  };

  const insert = (token: string) => {
    const el = inputRef.current;
    const start = el?.selectionStart ?? value.length;
    const end = el?.selectionEnd ?? value.length;
    onChange(value.slice(0, start) + token + value.slice(end));
    requestAnimationFrame(() => {
      el?.focus();
      el?.setSelectionRange(start + token.length, start + token.length);
    });
    close();
  };

  const q = query.trim().toLowerCase();
  const matches = <T extends { label: string }>(items: T[]) => items.filter((i) => !q || i.label.toLowerCase().includes(q));
  const groupsFor = (source: VariableSource) => (source === "payload" ? PAYLOAD_EVENTS : CONTENT_FETCHES);

  return (
    <div
      className={cn(
        "flex h-[46px] items-center rounded-[4px] border bg-[#F7F7F9] pr-1.5 transition-colors focus-within:bg-white",
        invalid ? "border-[#E5484D]" : "border-transparent focus-within:border-[#2F68E5]"
      )}
    >
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Select attribute or enter liquid code"
        aria-label={ariaLabel}
        aria-invalid={invalid}
        className="h-full min-w-0 flex-1 bg-transparent px-4 font-manrope text-[14px] text-[#17173A] outline-none placeholder:text-[#A0A0B0]"
      />

      <Popover open={open} onOpenChange={(o) => (o ? setOpen(true) : close())}>
        <Tooltip>
          <TooltipTrigger asChild>
            <PopoverTrigger asChild>
              <button
                type="button"
                aria-label="Personalize with an attribute or payload"
                className={cn(
                  "grid size-8 shrink-0 place-items-center rounded-[6px] bg-white text-[#17173A] shadow-[0_1px_4px_rgba(23,23,58,0.14)] transition-colors hover:bg-[#F3F6FF]",
                  open && "bg-[#F3F6FF]"
                )}
              >
                <PersonalizeIcon />
              </button>
            </PopoverTrigger>
          </TooltipTrigger>
          {!open && (
            <TooltipContent side="top" align="end" className="max-w-[240px] rounded-lg border-0 bg-black px-3 py-2 text-center text-white">
              <p className="font-manrope text-xs leading-[18px]">
                Select attribute/payload for personalization. Click <span className="underline">here</span> to know more.
              </p>
            </TooltipContent>
          )}
        </Tooltip>

        <PopoverContent
          align="end"
          className="z-[120] w-[300px] overflow-hidden rounded-[8px] border-[#DDE2EE] p-0 font-manrope shadow-[0_8px_24px_rgba(23,23,58,0.14)]"
        >
          {view.step === "root" && (
            <div className="py-1">
              {VARIABLE_SOURCES.map((s) => (
                <button key={s.id} type="button" onClick={() => go({ step: "list", source: s.id })} className={rowClass}>
                  {s.label}
                  <ChevronRight className="size-4 text-[#6F6F8D]" strokeWidth={2.4} />
                </button>
              ))}
            </div>
          )}

          {view.step === "list" && (
            <div>
              <BackHeader title={SOURCE_TITLE[view.source]} onBack={() => go({ step: "root" })} />
              <SearchRow value={query} onChange={setQuery} />
              <div className="scroll-slim max-h-[300px] overflow-y-auto py-1">
                {view.source === "attribute"
                  ? matches(USER_ATTRIBUTE_FIELDS).map((f) => (
                      <button
                        key={f.key}
                        type="button"
                        onClick={() => go({ step: "configure", source: "attribute", group: null, field: f })}
                        className={rowClass}
                      >
                        {f.label}
                      </button>
                    ))
                  : matches(groupsFor(view.source)).map((g) => (
                      <button
                        key={g.key}
                        type="button"
                        onClick={() => go({ step: "fields", source: view.source, group: g })}
                        className={rowClass}
                      >
                        {g.label}
                        <ChevronRight className="size-4 text-[#6F6F8D]" strokeWidth={2.4} />
                      </button>
                    ))}
              </div>
            </div>
          )}

          {view.step === "fields" && (
            <div>
              <BackHeader
                title={view.group.label}
                onBack={() => go({ step: "list", source: view.source })}
              />
              <SearchRow value={query} onChange={setQuery} />
              <div className="scroll-slim max-h-[300px] overflow-y-auto py-1">
                {matches(view.group.fields).map((f) => (
                  <button
                    key={f.key}
                    type="button"
                    onClick={() => go({ step: "configure", source: view.source, group: view.group, field: f })}
                    className="block w-full px-5 py-3.5 text-left font-manrope text-[15px] font-semibold text-[#6F6F8D] transition-colors hover:bg-[#F5F9FF] hover:text-[#17173A]"
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {view.step === "configure" && (
            <ConfigureView
              title={view.field.label}
              onBack={() =>
                go(
                  view.group
                    ? { step: "fields", source: view.source, group: view.group }
                    : { step: "list", source: view.source }
                )
              }
              onAdd={(opts) => insert(buildLiquid(view.source, view.group, view.field.key, opts))}
            />
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
}
