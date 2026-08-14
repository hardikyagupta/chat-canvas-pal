import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Search, Sparkles, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { segments } from "../segments.data";

/** A list or segment as it sits in the audience form's chips. */
export interface SegmentRef {
  id: string;
  name: string;
  /** Contacts reachable on this channel. */
  reach: number;
  /** Built by the co-marketer rather than picked from saved segments. */
  ai?: boolean;
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
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
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
            value.map((v) => (
              <span
                key={v.id}
                className="inline-flex max-w-[260px] items-center gap-1 rounded-full border border-[#DDE2EE] bg-white py-1 pl-2.5 pr-1 font-manrope text-[12px] font-medium text-[#17173A]"
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
            ))
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

      {open && (
        <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-md border border-[#DDE2EE] bg-white shadow-[0_8px_24px_rgba(23,23,58,0.12)]">
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
        </div>
      )}
    </div>
  );
}
