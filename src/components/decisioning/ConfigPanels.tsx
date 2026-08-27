import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Loader2, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  DEFAULT_EVENT_MAPPINGS,
  DEFAULT_GUARDRAILS,
  DETECTED_EVENTS,
  EMPTY_BRAND_WIKI,
  STANDARD_EVENTS,
  type BrandWikiData,
  type CustomEventMapping,
  type EventMappingData,
  type GuardrailsData,
} from "@/contexts/DecisioningSetupContext";
import { BrandWikiIntake } from "./BrandWikiIntake";

/* ------------------------------------------------------------------ */
/* Shared RHS config panels — used by the board (initial config) and   */
/* the ready-state "Edit configuration" sheet.                         */
/* ------------------------------------------------------------------ */

function PanelShell({
  open,
  onOpenChange,
  title,
  description,
  onSave,
  saveLabel,
  successMessage,
  footerNote,
  children,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  title: string;
  description: string;
  onSave: () => void;
  saveLabel: string;
  /** Toast shown after a successful save (e.g. "Event mapping configured"). */
  successMessage?: string;
  /** Optional helper text pinned in the footer, always visible with the buttons. */
  footerNote?: React.ReactNode;
  children: React.ReactNode;
}) {
  const [saving, setSaving] = useState(false);

  const handleSave = () => {
    if (saving) return;
    setSaving(true);
    // Simulate persisting the config, then let the panel's own onSave
    // commit the data and close the sheet.
    window.setTimeout(() => {
      setSaving(false);
      onSave();
      if (successMessage)
        toast.success(successMessage, {
          icon: <Check className="h-4 w-4 text-[#00C48C]" strokeWidth={2.5} />,
        });
    }, 900);
  };

  return (
    <Sheet open={open} onOpenChange={(o) => !saving && onOpenChange(o)}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 p-0 font-manrope sm:max-w-[600px]"
      >
        <div className="border-b border-[#DDE2EE] px-6 py-5">
          <h3 className="text-[18px] font-bold text-[#17173A]">{title}</h3>
          <p className="mt-1 text-[13px] text-[#6F6F8D]">{description}</p>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">{children}</div>
        <div className="flex items-center gap-3 border-t border-[#DDE2EE] px-6 py-4">
          <div className="flex shrink-0 items-center gap-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="dc-btn dc-btn-primary min-w-[92px]"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {saveLabel}
          </button>
          <button
            onClick={() => onOpenChange(false)}
            disabled={saving}
            className="dc-btn dc-btn-secondary"
          >
            Cancel
          </button>
          </div>
          {footerNote && (
            <p className="min-w-0 flex-1 text-[12px] leading-snug text-[#6F6F8D]">
              {footerNote}
            </p>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="mb-4 block">
      <span className="mb-1.5 block text-[13px] font-semibold text-[#17173A]">
        {label}
      </span>
      {children}
    </label>
  );
}

/* ---- Brand wiki panel --------------------------------------------- */

export function BrandWikiPanel({
  open,
  onOpenChange,
  initialData,
  onSave,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  initialData: BrandWikiData | null;
  onSave: (d: BrandWikiData) => void;
}) {
  const [form, setForm] = useState<BrandWikiData>(EMPTY_BRAND_WIKI);
  // Bumped on every open so BrandWikiIntake remounts: its own view state (which
  // question groups are expanded, the website-scan result) resets with it,
  // which is how this sheet has always behaved on reopen.
  const [seedKey, setSeedKey] = useState(0);

  useEffect(() => {
    if (open) {
      setForm(initialData ?? EMPTY_BRAND_WIKI);
      setSeedKey((k) => k + 1);
    }
  }, [open, initialData]);

  return (
    <PanelShell
      open={open}
      onOpenChange={onOpenChange}
      title="Brand wiki"
      description="Brand story, voice and audience"
      saveLabel="Save"
      successMessage="Brand wiki configured"
      footerNote="Answers will be used to guide content generation and decisioning."
      onSave={() => {
        onSave(form);
        onOpenChange(false);
      }}
    >
      <BrandWikiIntake key={seedKey} value={form} onChange={setForm} />
    </PanelShell>
  );
}

/* ---- Event mapping panel ------------------------------------------ */

export function EventMappingPanel({
  open,
  onOpenChange,
  initialData,
  onSave,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  initialData: EventMappingData | null;
  onSave: (d: EventMappingData) => void;
}) {
  const [mappings, setMappings] = useState<Record<string, string>>(DEFAULT_EVENT_MAPPINGS);
  const [customEvents, setCustomEvents] = useState<CustomEventMapping[]>([]);
  const nextCustomId = useRef(0);
  useEffect(() => {
    if (!open) return;
    setMappings(initialData?.mappings ?? DEFAULT_EVENT_MAPPINGS);
    setCustomEvents(initialData?.customEvents ?? []);
  }, [open, initialData]);

  // Reusable RHS dropdown so standard and custom rows look identical.
  const detectedSelect = (value: string, onChange: (v: string) => void) => (
    <div className="relative w-[240px] shrink-0">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 w-full appearance-none rounded border border-[#DDE2EE] bg-white pl-3 pr-9 text-[13px] text-[#17173A] focus:border-[#2F68E5] focus:outline-none"
      >
        <option value="none">Not mapped</option>
        {DETECTED_EVENTS.map((d) => (
          <option key={d.id} value={d.id}>
            {d.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6F6F8D]" />
    </div>
  );

  const addCustomEvent = () =>
    setCustomEvents((rows) => [
      ...rows,
      { id: `custom-${nextCustomId.current++}`, label: "", mappedTo: "none" },
    ]);

  const updateCustomEvent = (id: string, patch: Partial<CustomEventMapping>) =>
    setCustomEvents((rows) =>
      rows.map((r) => (r.id === id ? { ...r, ...patch } : r)),
    );

  const removeCustomEvent = (id: string) =>
    setCustomEvents((rows) => rows.filter((r) => r.id !== id));

  return (
    <PanelShell
      open={open}
      onOpenChange={onOpenChange}
      title="Event definitions"
      description="Map your events to the engine's"
      saveLabel="Save"
      successMessage="Event definitions configured"
      onSave={() => {
        // Drop empty custom rows so blank names never persist.
        const cleaned = customEvents
          .map((r) => ({ ...r, label: r.label.trim() }))
          .filter((r) => r.label !== "");
        onSave({ mappings, customEvents: cleaned });
        onOpenChange(false);
      }}
    >
      <div className="flex flex-col">
        {STANDARD_EVENTS.map((ev) => (
          <div key={ev.id} className="flex items-center gap-3 py-3">
            <span className="min-w-0 flex-1 text-[13px] font-semibold text-[#17173A]">
              {ev.label}
            </span>
            {detectedSelect(mappings[ev.id] ?? "none", (v) =>
              setMappings((m) => ({ ...m, [ev.id]: v })),
            )}
            {/* Empty gutter keeps dropdowns aligned with the custom rows' ✕. */}
            <span className="w-7 shrink-0" aria-hidden />
          </div>
        ))}

        {customEvents.map((row) => (
          <div key={row.id} className="flex items-center gap-3 py-3">
            <input
              value={row.label}
              onChange={(e) => updateCustomEvent(row.id, { label: e.target.value })}
              placeholder="Custom event name"
              className="h-9 min-w-0 flex-1 rounded border border-[#DDE2EE] bg-white px-3 text-[13px] font-semibold text-[#17173A] placeholder:font-normal placeholder:text-[#9A9AB3] focus:border-[#2F68E5] focus:outline-none"
            />
            {detectedSelect(row.mappedTo, (v) =>
              updateCustomEvent(row.id, { mappedTo: v }),
            )}
            <button
              type="button"
              onClick={() => removeCustomEvent(row.id)}
              aria-label="Remove custom event"
              className="grid h-7 w-7 shrink-0 place-items-center rounded text-[#9A9AB3] transition-colors hover:bg-[#F4F8FF] hover:text-[#17173A]"
            >
              <X className="h-4 w-4" strokeWidth={2} />
            </button>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addCustomEvent}
        className="dc-btn dc-btn-link mt-3"
      >
        <Plus className="h-4 w-4" strokeWidth={2.5} />
        Add custom event
      </button>
    </PanelShell>
  );
}

/* ---- Guardrails panel --------------------------------------------- */

export function GuardrailsPanel({
  open,
  onOpenChange,
  initialData,
  onSave,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  initialData: GuardrailsData | null;
  onSave: (d: GuardrailsData) => void;
}) {
  const [form, setForm] = useState<GuardrailsData>(DEFAULT_GUARDRAILS);
  useEffect(() => {
    if (open) setForm(initialData ?? DEFAULT_GUARDRAILS);
  }, [open, initialData]);

  const row = (title: string, subtitle: string, control: React.ReactNode) => (
    <div className="flex items-center justify-between gap-4 py-4">
      <div className="min-w-0">
        <p className="text-[13px] font-semibold text-[#17173A]">{title}</p>
        <p className="mt-0.5 text-[12px] text-[#6F6F8D]">{subtitle}</p>
      </div>
      <div className="flex shrink-0 items-center gap-2">{control}</div>
    </div>
  );

  return (
    <PanelShell
      open={open}
      onOpenChange={onOpenChange}
      title="Guardrails"
      description="Limits the engine always respects"
      saveLabel="Save"
      successMessage="Guardrails configured"
      onSave={() => {
        onSave(form);
        onOpenChange(false);
      }}
    >
      <div className="flex flex-col divide-y divide-[#DDE2EE]">
        {row(
          "Require marketing consent",
          "Only message customers who've opted in",
          <Switch
            checked={form.requireConsent}
            onCheckedChange={(v) => setForm((f) => ({ ...f, requireConsent: v }))}
          />
        )}
        {row(
          "Frequency cap",
          "Most messages any one customer gets per week",
          <>
            <Input
              type="number"
              min={1}
              max={14}
              value={form.frequencyCapPerWeek}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  frequencyCapPerWeek: Math.max(1, Math.min(14, Number(e.target.value) || 1)),
                }))
              }
              className="h-9 w-16 text-center text-[13px]"
            />
            <span className="text-[12px] text-[#6F6F8D]">/week</span>
          </>
        )}
        {row(
          "Quiet hours",
          "No sends during these hours (local time)",
          <>
            <Input
              type="time"
              value={form.quietHoursStart}
              onChange={(e) => setForm((f) => ({ ...f, quietHoursStart: e.target.value }))}
              className="h-9 w-[128px] text-[13px]"
            />
            <span className="text-[12px] text-[#6F6F8D]">to</span>
            <Input
              type="time"
              value={form.quietHoursEnd}
              onChange={(e) => setForm((f) => ({ ...f, quietHoursEnd: e.target.value }))}
              className="h-9 w-[128px] text-[13px]"
            />
          </>
        )}
        {row(
          "Hold-out group",
          "Kept aside so you can measure true lift",
          <>
            <Input
              type="number"
              min={0}
              max={20}
              value={form.holdoutPercent}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  holdoutPercent: Math.max(0, Math.min(20, Number(e.target.value) || 0)),
                }))
              }
              className="h-9 w-16 text-center text-[13px]"
            />
            <span className="text-[12px] text-[#6F6F8D]">%</span>
          </>
        )}
      </div>
    </PanelShell>
  );
}
