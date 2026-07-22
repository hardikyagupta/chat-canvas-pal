import { useEffect, useMemo, useRef, useState } from "react";
import {
  Check,
  ChevronDown,
  Download,
  FileText,
  Globe,
  Info,
  Link2,
  Loader2,
  Plus,
  Sparkles,
  Upload,
  UploadCloud,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  DEFAULT_EVENT_MAPPINGS,
  DEFAULT_GUARDRAILS,
  DETECTED_EVENTS,
  STANDARD_EVENTS,
  type BrandWikiData,
  type CustomEventMapping,
  type EventMappingData,
  type GuardrailsData,
} from "@/contexts/DecisioningSetupContext";
import {
  BRAND_WIKI_GROUPS,
  BRAND_WIKI_TOTAL_QUESTIONS,
} from "./brand-wiki-questions";

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
  const empty: BrandWikiData = { files: [], brandName: "", brandVoice: "", audience: "", website: "", answers: {} };
  const [form, setForm] = useState<BrandWikiData>(empty);
  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set());
  const [website, setWebsite] = useState("");
  const [fetching, setFetching] = useState(false);
  const [fetched, setFetched] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (open) {
      setForm(initialData ?? empty);
      setOpenGroups(new Set());
      setWebsite(initialData?.website ?? "");
      setFetched(!!initialData?.website);
      setFetching(false);
    }
  }, [open, initialData]); // eslint-disable-line react-hooks/exhaustive-deps

  const addFiles = (list: FileList | null) => {
    if (!list) return;
    const next = Array.from(list).map((f) => ({ name: f.name, size: f.size }));
    setForm((f) => ({
      ...f,
      files: [...f.files, ...next.filter((n) => !f.files.some((p) => p.name === n.name))],
    }));
  };

  // Simulate scanning the website and pre-filling brand details from it.
  const fetchFromWebsite = () => {
    const url = website.trim();
    if (!url || fetching) return;
    setFetching(true);
    window.setTimeout(() => {
      setFetching(false);
      setFetched(true);
      setForm((f) => ({
        ...f,
        website: url,
        brandName: f.brandName || "Northwind",
        brandVoice: f.brandVoice || "Warm, confident, never pushy",
        audience: f.audience || "Urban millennials shopping for home goods",
      }));
    }, 1400);
  };

  const answers = form.answers ?? {};
  const setAnswer = (id: string, value: string) =>
    setForm((f) => ({ ...f, answers: { ...(f.answers ?? {}), [id]: value } }));

  const answeredCount = useMemo(
    () => Object.values(answers).filter((v) => v.trim() !== "").length,
    [answers]
  );
  const allExpanded = openGroups.size === BRAND_WIKI_GROUPS.length;
  const toggleAll = () =>
    setOpenGroups(allExpanded ? new Set() : new Set(BRAND_WIKI_GROUPS.map((g) => g.id)));
  const toggleGroup = (id: string) =>
    setOpenGroups((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

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
      {/* Upload zone */}
      <div className="rounded-xl border-2 border-dashed border-[#C9D5F5] bg-[#F6F9FF] px-4 py-6 text-center">
        <UploadCloud className="mx-auto h-6 w-6 text-[#2F68E5]" strokeWidth={1.8} />
        <p className="mt-2 text-[14px] font-semibold text-[#17173A]">
          Upload brand document
        </p>
        <p className="mt-0.5 text-[12px] text-[#6F6F8D]">
          Brand guidelines, tone of voice, product catalogue…
        </p>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="dc-btn dc-btn-primary mt-3"
        >
          <Upload strokeWidth={2} />
          Upload document
        </button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.doc,.docx,.csv,.txt,.md,.xlsx"
          className="hidden"
          onChange={(e) => {
            addFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {form.files.length > 0 && (
        <ul className="mt-3 flex flex-col gap-1.5">
          {form.files.map((file) => (
            <li
              key={file.name}
              className="flex items-center gap-2.5 rounded-lg border border-[#DDE2EE] px-3 py-2"
            >
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded bg-[#E7EDFF]">
                <FileText className="h-3.5 w-3.5 text-[#2F68E5]" strokeWidth={1.8} />
              </span>
              <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-[#17173A]">
                {file.name}
              </span>
              <span className="shrink-0 text-[12px] text-[#6F6F8D]">
                {Math.max(1, Math.round(file.size / 1024))} KB
              </span>
              <button
                aria-label={`Remove ${file.name}`}
                onClick={() =>
                  setForm((f) => ({ ...f, files: f.files.filter((p) => p.name !== file.name) }))
                }
                className="grid h-5 w-5 shrink-0 place-items-center rounded text-[#6F6F8D] transition-colors hover:bg-[#F4F8FF] hover:text-[#17173A]"
              >
                <X className="h-3.5 w-3.5" strokeWidth={2} />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <a
          href="#"
          onClick={(e) => e.preventDefault()}
          className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-[#2F68E5] hover:underline"
        >
          <Download className="h-4 w-4" strokeWidth={2} />
          Download sample template (Excel)
        </a>
        <span className="inline-flex items-center gap-1.5 text-[12.5px] text-[#6F6F8D]">
          Not sure what to upload?
          <Info className="h-4 w-4 text-[#9A9AB2]" strokeWidth={2} />
        </span>
      </div>

      {/* OR divider */}
      <div className="my-5 flex items-center gap-3">
        <span className="h-px flex-1 bg-[#E4E8F1]" />
        <span className="text-[11px] font-semibold uppercase tracking-[0.5px] text-[#9A9AB2]">
          Or
        </span>
        <span className="h-px flex-1 bg-[#E4E8F1]" />
      </div>

      {/* Import from website */}
      <div className="mb-5">
        <div className="flex items-start gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[#EEF3FF]">
            <Globe className="h-5 w-5 text-[#2F68E5]" strokeWidth={1.8} />
          </span>
          <div className="min-w-0">
            <p className="text-[14px] font-bold text-[#17173A]">Or import from your website</p>
            <p className="text-[12.5px] text-[#6F6F8D]">
              Enter your brand website and we'll fetch key information automatically.
            </p>
          </div>
        </div>

        <div className="mt-3 flex items-center gap-2">
          <div className="relative flex-1">
            <Link2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9A9AB2]" strokeWidth={2} />
            <Input
              value={website}
              onChange={(e) => {
                setWebsite(e.target.value);
                setFetched(false);
              }}
              onKeyDown={(e) => e.key === "Enter" && fetchFromWebsite()}
              placeholder="https://yourbrand.com"
              className="h-9 pl-9 text-[13px]"
            />
          </div>
          <button
            onClick={fetchFromWebsite}
            disabled={!website.trim() || fetching}
            className="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded border border-[#2F68E5] bg-white px-4 text-[12px] font-semibold uppercase tracking-[0.5px] text-[#2F68E5] transition-colors hover:bg-[#EEF3FF] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {fetching ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Scanning
              </>
            ) : (
              "Fetch details"
            )}
          </button>
        </div>

        {fetched && !fetching ? (
          <p className="mt-2 inline-flex items-center gap-1.5 text-[12px] font-medium text-[#00A576]">
            <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
            Imported brand details from {website.trim()} — review below.
          </p>
        ) : (
          <p className="mt-2 inline-flex items-center gap-1.5 text-[12px] text-[#6F6F8D]">
            <Sparkles className="h-3.5 w-3.5 text-[#2F68E5]" strokeWidth={2} />
            We'll scan your website to identify your brand, products, audience and communication style.
          </p>
        )}
      </div>

      <div id="brand-wiki-manual-fields" />
      <div className="mb-5 h-px bg-[#E4E8F1]" />
      <Field label="Brand name">
        <Input
          value={form.brandName}
          onChange={(e) => setForm((f) => ({ ...f, brandName: e.target.value }))}
          placeholder="e.g. Northwind"
          className="h-9 text-[13px]"
        />
      </Field>
      <Field label="Brand voice">
        <Input
          value={form.brandVoice}
          onChange={(e) => setForm((f) => ({ ...f, brandVoice: e.target.value }))}
          placeholder="e.g. Warm, confident, never pushy"
          className="h-9 text-[13px]"
        />
      </Field>
      <Field label="Who you sell to">
        <Input
          value={form.audience}
          onChange={(e) => setForm((f) => ({ ...f, audience: e.target.value }))}
          placeholder="e.g. Urban millennials shopping for home goods"
          className="h-9 text-[13px]"
        />
      </Field>

      <div className="mt-1 border-t border-[#EDEFF5] pt-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h4 className="text-[14px] font-bold text-[#17173A]">
              Tell us more about your brand
            </h4>
            <p className="text-[12.5px] text-[#6F6F8D]">
              The more details you share, the better the engine can represent your brand.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <span className="rounded-md bg-[#F1F3F9] px-2.5 py-1 text-[12px] font-medium text-[#6F6F8D]">
              {answeredCount > 0
                ? `${answeredCount}/${BRAND_WIKI_TOTAL_QUESTIONS} answered`
                : `${BRAND_WIKI_TOTAL_QUESTIONS} questions`}
            </span>
            <button
              onClick={toggleAll}
              className="text-[12.5px] font-semibold text-[#2F68E5] hover:underline"
            >
              {allExpanded ? "Collapse all" : "Expand all"}
            </button>
          </div>
        </div>

        <div className="mt-3 flex flex-col gap-2.5">
          {BRAND_WIKI_GROUPS.map((group) => {
            const isOpen = openGroups.has(group.id);
            const answered = group.questions.filter(
              (q) => (answers[q.id] ?? "").trim() !== ""
            ).length;
            return (
              <div
                key={group.id}
                className="overflow-hidden rounded-xl border border-[#E4E8F1] bg-white"
              >
                <button
                  onClick={() => toggleGroup(group.id)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-[#FAFBFE]"
                >
                  <span
                    className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${group.tile}`}
                  >
                    <group.Icon className="h-5 w-5" strokeWidth={1.8} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5 text-[14px] font-semibold text-[#17173A]">
                      {group.title}
                      <span className="text-[13px] font-medium text-[#9A9AB2]">
                        {answered > 0
                          ? `(${answered}/${group.questions.length})`
                          : `(${group.questions.length})`}
                      </span>
                    </span>
                    <span className="block truncate text-[12.5px] text-[#6F6F8D]">
                      {group.subtitle}
                    </span>
                  </span>
                  <ChevronDown
                    className={`h-5 w-5 shrink-0 text-[#9A9AB2] transition-transform duration-200 ${
                      isOpen ? "rotate-180" : ""
                    }`}
                    strokeWidth={2}
                  />
                </button>

                {isOpen && (
                  <div className="flex flex-col gap-4 border-t border-[#EDEFF5] px-4 py-4">
                    {group.questions.map((q) => (
                      <label key={q.id} className="block">
                        <span className="mb-1.5 block text-[13px] font-semibold text-[#17173A]">
                          {q.label}
                        </span>
                        {q.multiline ? (
                          <Textarea
                            value={answers[q.id] ?? ""}
                            onChange={(e) => setAnswer(q.id, e.target.value)}
                            placeholder={q.placeholder}
                            className="min-h-[64px] text-[13px]"
                          />
                        ) : (
                          <Input
                            value={answers[q.id] ?? ""}
                            onChange={(e) => setAnswer(q.id, e.target.value)}
                            placeholder={q.placeholder}
                            className="h-9 text-[13px]"
                          />
                        )}
                      </label>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
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
        className="mt-3 inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#2F68E5] transition-colors hover:text-[#255ad2]"
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
