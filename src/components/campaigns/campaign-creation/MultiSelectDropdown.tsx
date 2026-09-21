import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { PlatformIcon } from "./PlatformIcons";
import type { AppOption } from "./appOptions.data";

/**
 * Chip-input multi-select — selected apps show as removable pills in the
 * closed field, a search + checklist panel opens below it. Portalled to
 * <body> and positioned by rect, same as the audience step's own Dropdown,
 * so it isn't clipped by the accordion card's overflow:hidden.
 */
export default function MultiSelectDropdown({
  label,
  required,
  placeholder = "Search",
  options,
  value,
  onChange,
  error,
}: {
  label: string;
  required?: boolean;
  placeholder?: string;
  options: AppOption[];
  value: string[];
  onChange: (ids: string[]) => void;
  /** Shown under the field in red, which also turns its border red. */
  error?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [rect, setRect] = useState<DOMRect | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (!wrapRef.current?.contains(target) && !panelRef.current?.contains(target)) {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  // Portalled for the same reason every other dropdown here is — the
  // accordion card's height-animation wrapper clips overflow.
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

  const toggleOption = (id: string) => {
    onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id]);
  };

  const selected = options.filter((o) => value.includes(o.id));
  const filtered = query.trim()
    ? options.filter((o) => o.name.toLowerCase().includes(query.trim().toLowerCase()))
    : options;

  return (
    <div>
      <label className="mb-1.5 flex items-center gap-1 font-manrope text-sm font-semibold text-[#17173A]">
        {label}
        {required && <span className="text-[#FC5E02]">*</span>}
      </label>

      <div ref={wrapRef} className="relative">
        <div
          role="button"
          tabIndex={0}
          aria-label={label}
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
          onKeyDown={(e) => {
            if (e.target === e.currentTarget && (e.key === "Enter" || e.key === " ")) {
              e.preventDefault();
              setOpen((o) => !o);
            }
          }}
          className={cn(
            "flex min-h-10 w-full cursor-pointer flex-wrap items-center gap-1.5 rounded-md border bg-white px-2.5 py-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2F68E5] focus-visible:ring-offset-2",
            open ? "border-[#2F68E5]" : error ? "border-[#E5484D]" : "border-[#DDE2EE]"
          )}
        >
          {selected.map((o) => (
            <span
              key={o.id}
              className="inline-flex items-center gap-1.5 rounded-full border border-[#DDE2EE] bg-white py-1 pl-2.5 pr-1.5 font-manrope text-[13px] text-[#17173A]"
            >
              <PlatformIcon
                platform={o.platform}
                className={cn(
                  "size-3 shrink-0",
                  o.platform === "android" ? "text-[#78C257]" : "text-[#6F6F8D]"
                )}
              />
              {o.name}
              <button
                type="button"
                aria-label={`Remove ${o.name}`}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleOption(o.id);
                }}
                className="grid size-4 shrink-0 place-items-center rounded-full text-[#8A8AA3] transition-colors hover:bg-[#F0F3F9] hover:text-[#17173A]"
              >
                <X className="size-3" strokeWidth={2.4} />
              </button>
            </span>
          ))}
          <span
            aria-hidden="true"
            className="ml-auto grid size-6 shrink-0 place-items-center rounded text-[#8A8AA3] transition-colors hover:text-[#17173A]"
          >
            <ChevronDown
              className={cn("size-4 transition-transform", open && "rotate-180")}
              strokeWidth={2}
            />
          </span>
        </div>

        {error && (
          <p role="alert" className="mt-1 font-manrope text-xs font-medium text-[#E5484D]">
            {error}
          </p>
        )}

        {open &&
          rect &&
          createPortal(
            <div
              ref={panelRef}
              style={{ position: "fixed", top: rect.bottom + 4, left: rect.left, width: rect.width }}
              className="z-[120] overflow-hidden rounded-md border border-[#DDE2EE] bg-white shadow-[0_8px_24px_rgba(23,23,58,0.12)]"
            >
              <div className="relative border-b border-[#EEF1F7] p-2">
                <input
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={placeholder}
                  className="h-9 w-full rounded-md border border-[#DDE2EE] bg-white pl-3 pr-9 font-manrope text-sm text-[#17173A] outline-none transition-colors focus:border-[#2F68E5]"
                />
                <Search className="pointer-events-none absolute right-5 top-1/2 size-4 -translate-y-1/2 text-[#8A8AA3]" />
              </div>
              <div className="scroll-slim max-h-[220px] overflow-y-auto py-1">
                {filtered.length === 0 ? (
                  <p className="px-3 py-3 text-center font-manrope text-sm text-[#8A8AA3]">
                    No matches
                  </p>
                ) : (
                  filtered.map((o) => {
                    const checked = value.includes(o.id);
                    return (
                      <button
                        key={o.id}
                        type="button"
                        onClick={() => toggleOption(o.id)}
                        className="group relative flex w-full items-center gap-2.5 px-3 py-2 text-left transition-colors hover:bg-[#F4F8FF]"
                      >
                        <span
                          aria-hidden="true"
                          className="absolute inset-y-0 left-0 w-[3px] origin-center scale-y-0 bg-[#2F68E5] transition-transform group-hover:scale-y-100"
                        />
                        <span
                          className={cn(
                            "grid size-4 shrink-0 place-items-center rounded border transition-colors",
                            checked ? "border-[#2F68E5] bg-[#2F68E5]" : "border-[#C3CAD9] bg-white"
                          )}
                        >
                          {checked && <Check className="size-3 text-white" strokeWidth={3} />}
                        </span>
                        <span className="font-manrope text-sm text-[#17173A]">{o.name}</span>
                      </button>
                    );
                  })
                )}
              </div>
            </div>,
            document.body
          )}
      </div>
    </div>
  );
}
