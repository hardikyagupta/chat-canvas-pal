import React, { useMemo, useRef, useState } from "react";
import {
  Check,
  ChevronDown,
  Download,
  FileText,
  Globe,
  Info,
  Link2,
  Loader2,
  Sparkles,
  Upload,
  UploadCloud,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DsButton } from "@/components/ui/ds-button";
import type { BrandWikiData } from "@/contexts/DecisioningSetupContext";
import {
  BRAND_WIKI_GROUPS,
  BRAND_WIKI_TOTAL_QUESTIONS,
} from "./brand-wiki-questions";

/**
 * The brand intake form: upload documents, import from a website, capture the
 * brand basics, then work through the detailed questionnaire.
 *
 * Fully controlled and with no save concept of its own, so the same form can be
 * hosted by the decisioning config sheet (which saves on its footer button) and
 * by co-marketer Settings (which saves on its own action bar). The data lives
 * with the caller; only transient view state — the website scan, which question
 * groups are open — is kept here.
 */
export function BrandWikiIntake({
  value,
  onChange,
  showWebsiteImport = true,
  showSampleTemplate = true,
  className,
}: {
  value: BrandWikiData;
  onChange: (next: BrandWikiData) => void;
  /** Hide the "import from your website" block (hosts that don't offer it). */
  showWebsiteImport?: boolean;
  /** Hide the sample-template / "not sure what to upload" row. */
  showSampleTemplate?: boolean;
  className?: string;
}) {
  const [fetching, setFetching] = useState(false);
  const [fetched, setFetched] = useState(() => !!value.website);
  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);

  const patch = (next: Partial<BrandWikiData>) => onChange({ ...value, ...next });

  const website = value.website ?? "";
  // Memoised so the answered-count below doesn't see a fresh object each render.
  const answers = useMemo(() => value.answers ?? {}, [value.answers]);

  const addFiles = (list: FileList | null) => {
    if (!list) return;
    const next = Array.from(list).map((f) => ({ name: f.name, size: f.size }));
    patch({
      files: [...value.files, ...next.filter((n) => !value.files.some((p) => p.name === n.name))],
    });
  };

  // Simulate scanning the website and pre-filling brand details from it.
  const fetchFromWebsite = () => {
    const url = website.trim();
    if (!url || fetching) return;
    setFetching(true);
    window.setTimeout(() => {
      setFetching(false);
      setFetched(true);
      onChange({
        ...value,
        website: url,
        brandName: value.brandName || "Northwind",
        brandVoice: value.brandVoice || "Warm, confident, never pushy",
        audience: value.audience || "Urban millennials shopping for home goods",
      });
    }, 1400);
  };

  const setAnswer = (id: string, answer: string) =>
    patch({ answers: { ...answers, [id]: answer } });

  const answeredCount = useMemo(
    () => Object.values(answers).filter((v) => v.trim() !== "").length,
    [answers],
  );
  const allExpanded = openGroups.size === BRAND_WIKI_GROUPS.length;
  const toggleAll = () =>
    setOpenGroups(allExpanded ? new Set() : new Set(BRAND_WIKI_GROUPS.map((g) => g.id)));
  const toggleGroup = (id: string) =>
    setOpenGroups((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    // font-manrope explicitly: hosted outside the decisioning sheet this would
    // otherwise inherit whatever the surrounding surface uses.
    <div className={cn("font-manrope", className)}>
      {/* Upload zone */}
      <div className="rounded-xl border-2 border-dashed border-[var(--color-line-input)] bg-[var(--color-royal-pale-soft)] px-4 py-6 text-center">
        <UploadCloud className="mx-auto h-6 w-6 text-[var(--color-royal)]" strokeWidth={1.8} />
        <p className="mt-2 text-[14px] font-semibold text-[var(--color-ink)]">
          Upload brand document
        </p>
        <p className="mt-0.5 text-[12px] text-[var(--color-grey)]">
          Brand guidelines, tone of voice, product catalogue…
        </p>
        <DsButton className="mt-3" onClick={() => fileInputRef.current?.click()}>
          <Upload strokeWidth={2} />
          Upload document
        </DsButton>
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

      {value.files.length > 0 && (
        <ul className="mt-3 flex flex-col gap-1.5">
          {value.files.map((file) => (
            <li
              key={file.name}
              className="flex items-center gap-2.5 rounded-lg border border-[var(--color-line-input)] px-3 py-2"
            >
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded bg-[var(--color-royal-pale)]">
                <FileText className="h-3.5 w-3.5 text-[var(--color-royal)]" strokeWidth={1.8} />
              </span>
              <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-[var(--color-ink)]">
                {file.name}
              </span>
              <span className="shrink-0 text-[12px] text-[var(--color-grey)]">
                {Math.max(1, Math.round(file.size / 1024))} KB
              </span>
              <button
                type="button"
                aria-label={`Remove ${file.name}`}
                onClick={() => patch({ files: value.files.filter((p) => p.name !== file.name) })}
                className="grid h-5 w-5 shrink-0 place-items-center rounded text-[var(--color-grey)] transition-colors hover:bg-[var(--color-royal-pale-soft)] hover:text-[var(--color-ink)]"
              >
                <X className="h-3.5 w-3.5" strokeWidth={2} />
              </button>
            </li>
          ))}
        </ul>
      )}

      {showSampleTemplate && (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <a
            href="#"
            onClick={(e) => e.preventDefault()}
            className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-[var(--color-royal)] hover:underline"
          >
            <Download className="h-4 w-4" strokeWidth={2} />
            Download sample template (Excel)
          </a>
          <span className="inline-flex items-center gap-1.5 text-[12.5px] text-[var(--color-grey)]">
            Not sure what to upload?
            <Info className="h-4 w-4 text-[var(--color-grey-soft)]" strokeWidth={2} />
          </span>
        </div>
      )}

      {showWebsiteImport && (
        <>
          {/* OR divider */}
          <div className="my-5 flex items-center gap-3">
            <span className="h-px flex-1 bg-[var(--color-line)]" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.5px] text-[var(--color-grey-soft)]">
              Or
            </span>
            <span className="h-px flex-1 bg-[var(--color-line)]" />
          </div>

          {/* Import from website */}
          <div className="mb-5">
            <div className="flex items-start gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[var(--color-royal-pale)]">
                <Globe className="h-5 w-5 text-[var(--color-royal)]" strokeWidth={1.8} />
              </span>
              <div className="min-w-0">
                <p className="text-[14px] font-bold text-[var(--color-ink)]">
                  Or import from your website
                </p>
                <p className="text-[12.5px] text-[var(--color-grey)]">
                  Enter your brand website and we'll fetch key information automatically.
                </p>
              </div>
            </div>

            <div className="mt-3 flex items-center gap-2">
              <div className="relative flex-1">
                <Link2
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-grey-soft)]"
                  strokeWidth={2}
                />
                <Input
                  value={website}
                  onChange={(e) => {
                    patch({ website: e.target.value });
                    setFetched(false);
                  }}
                  onKeyDown={(e) => e.key === "Enter" && fetchFromWebsite()}
                  placeholder="https://yourbrand.com"
                  className="ds-field h-9 pl-9 text-[13px]"
                />
              </div>
              <DsButton
                variant="secondary"
                onClick={fetchFromWebsite}
                disabled={!website.trim() || fetching}
              >
                {fetching ? (
                  <>
                    <Loader2 className="animate-spin" />
                    Scanning
                  </>
                ) : (
                  "Fetch details"
                )}
              </DsButton>
            </div>

            {fetched && !fetching ? (
              <p className="mt-2 inline-flex items-center gap-1.5 text-[12px] font-medium text-[var(--color-success)]">
                <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
                Imported brand details from {website.trim()} — review below.
              </p>
            ) : (
              <p className="mt-2 inline-flex items-center gap-1.5 text-[12px] text-[var(--color-grey)]">
                <Sparkles className="h-3.5 w-3.5 text-[var(--color-royal)]" strokeWidth={2} />
                We'll scan your website to identify your brand, products, audience and
                communication style.
              </p>
            )}
          </div>
        </>
      )}

      <div className="mb-5 h-px bg-[var(--color-line)]" />
      <IntakeField label="Brand name">
        <Input
          value={value.brandName}
          onChange={(e) => patch({ brandName: e.target.value })}
          placeholder="e.g. Northwind"
          className="ds-field h-9 text-[13px]"
        />
      </IntakeField>
      <IntakeField label="Brand voice">
        <Input
          value={value.brandVoice}
          onChange={(e) => patch({ brandVoice: e.target.value })}
          placeholder="e.g. Warm, confident, never pushy"
          className="ds-field h-9 text-[13px]"
        />
      </IntakeField>
      <IntakeField label="Who you sell to">
        <Input
          value={value.audience}
          onChange={(e) => patch({ audience: e.target.value })}
          placeholder="e.g. Urban millennials shopping for home goods"
          className="ds-field h-9 text-[13px]"
        />
      </IntakeField>

      <div className="mt-1 border-t border-[var(--color-line)] pt-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h4 className="text-[14px] font-bold text-[var(--color-ink)]">
              Tell us more about your brand
            </h4>
            <p className="text-[12.5px] text-[var(--color-grey)]">
              The more details you share, the better the engine can represent your brand.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <span className="rounded-md bg-[var(--color-surface-1)] px-2.5 py-1 text-[12px] font-medium text-[var(--color-grey)]">
              {answeredCount > 0
                ? `${answeredCount}/${BRAND_WIKI_TOTAL_QUESTIONS} answered`
                : `${BRAND_WIKI_TOTAL_QUESTIONS} questions`}
            </span>
            <button
              type="button"
              onClick={toggleAll}
              className="text-[12.5px] font-semibold text-[var(--color-royal)] hover:underline"
            >
              {allExpanded ? "Collapse all" : "Expand all"}
            </button>
          </div>
        </div>

        <div className="mt-3 flex flex-col gap-2.5">
          {BRAND_WIKI_GROUPS.map((group) => {
            const isOpen = openGroups.has(group.id);
            const answered = group.questions.filter(
              (q) => (answers[q.id] ?? "").trim() !== "",
            ).length;
            return (
              <div
                key={group.id}
                className="overflow-hidden rounded-xl border border-[var(--color-line)] bg-card"
              >
                <button
                  type="button"
                  onClick={() => toggleGroup(group.id)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-[var(--color-royal-pale-soft)]"
                >
                  <span
                    className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${group.tile}`}
                  >
                    <group.Icon className="h-5 w-5" strokeWidth={1.8} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5 text-[14px] font-semibold text-[var(--color-ink)]">
                      {group.title}
                      <span className="text-[13px] font-medium text-[var(--color-grey-soft)]">
                        {answered > 0
                          ? `(${answered}/${group.questions.length})`
                          : `(${group.questions.length})`}
                      </span>
                    </span>
                    <span className="block truncate text-[12.5px] text-[var(--color-grey)]">
                      {group.subtitle}
                    </span>
                  </span>
                  <ChevronDown
                    className={`h-5 w-5 shrink-0 text-[var(--color-grey-soft)] transition-transform duration-200 ${
                      isOpen ? "rotate-180" : ""
                    }`}
                    strokeWidth={2}
                  />
                </button>

                {isOpen && (
                  <div className="flex flex-col gap-4 border-t border-[var(--color-line)] px-4 py-4">
                    {group.questions.map((q) => (
                      <label key={q.id} className="block">
                        <span className="mb-1.5 block text-[13px] font-semibold text-[var(--color-ink)]">
                          {q.label}
                        </span>
                        {q.multiline ? (
                          <Textarea
                            value={answers[q.id] ?? ""}
                            onChange={(e) => setAnswer(q.id, e.target.value)}
                            placeholder={q.placeholder}
                            className="ds-field min-h-[64px] text-[13px]"
                          />
                        ) : (
                          <Input
                            value={answers[q.id] ?? ""}
                            onChange={(e) => setAnswer(q.id, e.target.value)}
                            placeholder={q.placeholder}
                            className="ds-field h-9 text-[13px]"
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
    </div>
  );
}

function IntakeField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="mb-4 block">
      <span className="mb-1.5 block text-[13px] font-semibold text-[var(--color-ink)]">
        {label}
      </span>
      {children}
    </label>
  );
}

export default BrandWikiIntake;
