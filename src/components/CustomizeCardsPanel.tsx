import { useEffect, useRef, useState } from "react";
import { GripVertical, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Checkbox } from "@/components/ui/checkbox";

/** One dashboard metric card's on/off + position preference. The array order
 *  is the card order (left → right on the dashboard); `enabled` cards are the
 *  ones actually rendered, capped at `maxEnabled`. */
export type CardPref = { id: string; enabled: boolean };

interface CustomizeCardsPanelProps {
  open: boolean;
  onClose: () => void;
  /** Ordered current preferences (the panel edits a local draft of these). */
  prefs: CardPref[];
  /** id → display label, used for the numbered rows and search. */
  labels: Record<string, string>;
  /** Max cards that can be enabled at once (rest are disabled). */
  maxEnabled?: number;
  /** Min cards that must stay enabled (can't uncheck below this). */
  minEnabled?: number;
  onSave: (prefs: CardPref[]) => void;
}

export default function CustomizeCardsPanel({
  open,
  onClose,
  prefs,
  labels,
  maxEnabled = 5,
  minEnabled = 4,
  onSave,
}: CustomizeCardsPanelProps) {
  // Local draft — only committed to the dashboard on Save.
  const [draft, setDraft] = useState<CardPref[]>(prefs);
  const [query, setQuery] = useState("");
  const dragIndex = useRef<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  // Re-seed the draft each time the panel opens so a cancelled edit is discarded.
  useEffect(() => {
    if (open) {
      setDraft(prefs);
      setQuery("");
      setError(null);
      dragIndex.current = null;
      setOverIndex(null);
    }
  }, [open, prefs]);

  const [error, setError] = useState<string | null>(null);

  const enabledCount = draft.filter((d) => d.enabled).length;
  const atMax = enabledCount >= maxEnabled;
  const isSearching = query.trim().length > 0;

  const toggle = (id: string) => {
    setError(null);
    setDraft((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        // Only the max cap is a hard block — unchecking is always allowed and
        // the minimum is enforced at Save time instead.
        if (!p.enabled && atMax) return p;
        return { ...p, enabled: !p.enabled };
      })
    );
  };

  const handleSave = () => {
    if (enabledCount < minEnabled) {
      setError(`Select at least ${minEnabled} cards to continue.`);
      return;
    }
    onSave(draft);
    onClose();
  };

  // Native HTML5 drag reorder — reordering is disabled while searching (the
  // filtered view hides rows, so indices wouldn't line up).
  const handleDrop = (to: number) => {
    const from = dragIndex.current;
    dragIndex.current = null;
    setOverIndex(null);
    if (from === null || from === to) return;
    setDraft((prev) => {
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  };

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 p-0 sm:max-w-[480px]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pb-4 pt-6">
          <h2 className="font-manrope text-[22px] font-bold text-[#17173A]">Customize metrics</h2>
        </div>

        {/* Search */}
        <div className="px-6 pb-2">
          <div className="relative">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name"
              className="w-full rounded-[8px] border border-transparent bg-[#F5F5F8] px-4 py-3 pr-10 font-manrope text-[14px] text-[#17173A] placeholder:text-[#9A9AB2] focus:border-[#DDE2EE] focus:outline-none"
            />
            <Search className="pointer-events-none absolute right-4 top-1/2 size-[18px] -translate-y-1/2 text-[#6F6F8D]" />
          </div>
          <p className="mt-2 font-manrope text-[12px] text-[#6F6F8D]">
            {enabledCount} of {maxEnabled} selected · choose {minEnabled}–{maxEnabled} cards · drag to reorder
          </p>
        </div>

        {/* Card list */}
        <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-6 py-4">
          {draft.map((item, idx) => {
            const label = labels[item.id] ?? item.id;
            if (isSearching && !label.toLowerCase().includes(query.trim().toLowerCase())) {
              return null;
            }
            // A row only reads as "inactive" when it can't be selected — i.e.
            // it's off AND the 5-card cap is already reached. An off row that's
            // still selectable stays fully active-looking. The 4-card minimum
            // is not blocked here — it's validated on Save.
            const lockedOff = !item.enabled && atMax;
            return (
              <div
                key={item.id}
                role="button"
                tabIndex={lockedOff ? -1 : 0}
                aria-pressed={item.enabled}
                onClick={() => !lockedOff && toggle(item.id)}
                onKeyDown={(e) => {
                  if (lockedOff) return;
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    toggle(item.id);
                  }
                }}
                draggable={!isSearching}
                onDragStart={() => {
                  if (isSearching) return;
                  dragIndex.current = idx;
                }}
                onDragOver={(e) => {
                  if (isSearching) return;
                  e.preventDefault();
                  setOverIndex(idx);
                }}
                onDrop={(e) => {
                  if (isSearching) return;
                  e.preventDefault();
                  handleDrop(idx);
                }}
                onDragEnd={() => {
                  dragIndex.current = null;
                  setOverIndex(null);
                }}
                className={cn(
                  "flex select-none items-center gap-3 rounded-[10px] border bg-white px-4 py-4 transition-colors focus:outline-none focus-visible:border-[#2F68E5]",
                  overIndex === idx && !isSearching ? "border-[#2F68E5]" : "border-[#E5E7F0]",
                  lockedOff ? "cursor-not-allowed" : "cursor-pointer hover:border-[#DDE2EE]"
                )}
              >
                <span
                  className={cn(
                    "shrink-0 text-[#C4C4D4]",
                    isSearching ? "cursor-default opacity-50" : "cursor-grab active:cursor-grabbing"
                  )}
                  aria-hidden="true"
                >
                  <GripVertical className="size-[18px]" />
                </span>
                {/* Presentational — the whole row drives the toggle. */}
                <Checkbox
                  checked={item.enabled}
                  disabled={lockedOff}
                  tabIndex={-1}
                  className="pointer-events-none size-[20px] rounded-[4px] border-[#C4C4D4] disabled:opacity-100 data-[state=checked]:border-[#2F68E5] data-[state=checked]:bg-[#2F68E5]"
                />
                <span
                  className={cn(
                    "font-manrope text-[15px] font-semibold",
                    lockedOff ? "text-[#9A9AB2]" : "text-[#17173A]"
                  )}
                >
                  {idx + 1}. {label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="border-t border-[#EDEFF4] px-6 py-4">
          {error && (
            <p className="mb-3 font-manrope text-[13px] font-medium text-[#F05C5C]">{error}</p>
          )}
          <button
            type="button"
            onClick={handleSave}
            className="dc-btn dc-btn-primary px-8"
          >
            Save
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
