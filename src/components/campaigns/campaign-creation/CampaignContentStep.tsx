import { useMemo, useState, type ReactNode } from "react";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Code2,
  Info,
  LayoutGrid,
  Plus,
  Search,
  SlidersHorizontal,
  Type,
  X,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import StepCard from "./StepCard";
import TemplateCard from "./TemplateCard";
import { emailTemplates, templateStarters } from "./emailTemplates.data";

export type TemplateTab = "my" | "new";

export interface ContentValues {
  senderName: string;
  senderEmail: string;
  domain: string;
  subject: string;
  preHeader: string;
  /** Optional sender fields, each opened from its own "+" button. */
  replyEnabled: boolean;
  replyEmail: string;
  copyEnabled: boolean;
  copyEmails: string;
  attachmentsEnabled: boolean;
  attachments: string[];
  tab: TemplateTab;
  /** Saved template picked for this campaign, if any. */
  templateId: number | null;
  starterId: string;
}

export const EMPTY_CONTENT: ContentValues = {
  senderName: "",
  senderEmail: "",
  domain: "m3m.in",
  subject: "",
  preHeader: "",
  replyEnabled: false,
  replyEmail: "",
  copyEnabled: false,
  copyEmails: "",
  attachmentsEnabled: false,
  attachments: [],
  tab: "my",
  templateId: null,
  starterId: "",
};

/** Verified sending domains on the account. */
const DOMAINS = ["m3m.in", "mailer.m3m.in", "news.m3m.in", "offers.m3m.in"];

const PER_PAGE_OPTIONS = [10, 20, 30];

const STARTER_ICONS: Record<string, LucideIcon> = {
  "drag-drop": LayoutGrid,
  "rich-text": Type,
  html: Code2,
};

const TABS: { id: TemplateTab; label: string }[] = [
  { id: "my", label: "My template" },
  { id: "new", label: "Create new" },
];

const fieldClass =
  "h-10 w-full rounded-md border border-[#DDE2EE] bg-[#F7F9FC] px-3 font-manrope text-sm text-[#17173A] outline-none transition-colors placeholder:text-[#A0A0A0] focus:border-[#2F68E5] focus:bg-white";

function InfoDot({ label }: { label: string }) {
  return (
    <span title={label} className="inline-grid place-items-center text-[#8A8AA3]">
      <Info className="size-4" strokeWidth={2} />
    </span>
  );
}

function Field({
  label,
  required,
  info,
  className,
  children,
}: {
  label: string;
  required?: boolean;
  info?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={className}>
      <div className="mb-1.5 flex items-center gap-1.5">
        <label className="font-manrope text-sm font-semibold text-[#17173A]">
          {label}
          {required && <span className="ml-0.5 text-[#FC5E02]">*</span>}
        </label>
        {info && <InfoDot label={info} />}
      </div>
      {children}
    </div>
  );
}

/** The "+ REPLY EMAIL ID" row under the sender fields — each opens one field. */
function AddButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  const Icon = active ? X : Plus;
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex h-9 items-center gap-1.5 rounded-md border px-3 font-manrope text-[12px] font-bold uppercase tracking-[0.4px] transition-colors",
        active
          ? "border-[#2F68E5] bg-[#F4F8FF] text-[#2F68E5]"
          : "border-[#DDE2EE] bg-white text-[#17173A] hover:bg-[#F7F9FC]"
      )}
    >
      <Icon className="size-4" strokeWidth={2.4} />
      {label}
    </button>
  );
}

/** Collapsible wrapper, same accordion the setup and audience steps use. */
function Reveal({ open, children }: { open: boolean; children: ReactNode }) {
  return (
    <div className="t-acc" data-open={open ? "true" : "false"}>
      <div className="t-acc-panel">
        <div className="t-acc-panel-inner">
          <div className="pt-5">{children}</div>
        </div>
      </div>
    </div>
  );
}

function Pager({
  page,
  pageCount,
  onPage,
}: {
  page: number;
  pageCount: number;
  onPage: (p: number) => void;
}) {
  // A window of five around the current page, so long lists don't spill.
  const start = Math.max(1, Math.min(page - 2, pageCount - 4));
  const pages = Array.from({ length: Math.min(5, pageCount) }, (_, i) => start + i);

  const arrow = (label: string, Icon: LucideIcon, to: number, disabled: boolean) => (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={() => onPage(to)}
      className={cn(
        "grid h-full w-5 place-items-center",
        disabled ? "text-[#C3CAD9]" : "text-[#6F6F8D] hover:text-[#17173A]"
      )}
    >
      <Icon className="h-[15px] w-[15px]" strokeWidth={2} />
    </button>
  );

  return (
    <div className="flex h-10 items-center gap-1 rounded-[5px] border border-[#DDE2EE] bg-white px-2.5">
      {arrow("First page", ChevronsLeft, 1, page === 1)}
      {arrow("Previous page", ChevronLeft, page - 1, page === 1)}
      {pages.map((p) => (
        <button
          key={p}
          type="button"
          onClick={() => onPage(p)}
          aria-current={p === page ? "page" : undefined}
          className="relative grid h-full w-8 place-items-center font-manrope text-sm tracking-[0.29px]"
        >
          <span className={p === page ? "text-[#2F68E5]" : "text-[#6F6F8D]"}>{p}</span>
          {p === page && (
            <span className="absolute bottom-1 h-[3px] w-[22px] rounded-[1.5px] bg-[#2F68E5]" />
          )}
        </button>
      ))}
      {arrow("Next page", ChevronRight, page + 1, page === pageCount)}
      {arrow("Last page", ChevronsRight, pageCount, page === pageCount)}
    </div>
  );
}

/**
 * Content step — who the email comes from, what it says on the tin, and which
 * template carries it. Sender details sit above the picker because the subject
 * line is what a template gets chosen against, not the other way round.
 */
export default function CampaignContentStep({
  values,
  onChange,
  highlight,
}: {
  values: ContentValues;
  onChange: (patch: Partial<ContentValues>) => void;
  /** Field keys just written by a co-marketer apply — briefly flashed. */
  highlight?: Partial<Record<keyof ContentValues, boolean>>;
}) {
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [perPage, setPerPage] = useState(10);
  const [page, setPage] = useState(1);
  const [perPageOpen, setPerPageOpen] = useState(false);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return emailTemplates;
    return emailTemplates.filter(
      (t) => t.name.toLowerCase().includes(q) || String(t.id).includes(q)
    );
  }, [query]);

  const pageCount = Math.max(1, Math.ceil(matches.length / perPage));
  const current = Math.min(page, pageCount);
  const shown = matches.slice((current - 1) * perPage, current * perPage);
  const extrasOpen = values.replyEnabled || values.copyEnabled || values.attachmentsEnabled;

  return (
    <StepCard
      wide
      title="Sender details"
      description="Define sender details to be used for sending the email"
    >
      <div className="grid grid-cols-3 gap-x-6 gap-y-6">
        <Field label="Sender name" info="Shown as the from-name in the inbox.">
          <input
            type="text"
            value={values.senderName}
            onChange={(e) => onChange({ senderName: e.target.value })}
            placeholder="Sender name"
            className={cn(fieldClass, highlight?.senderName && "cmk-field-flash")}
          />
        </Field>

        <Field
          label="Sender email"
          required
          info="Local part of the address — the domain is picked alongside."
        >
          <input
            type="text"
            value={values.senderEmail}
            onChange={(e) => onChange({ senderEmail: e.target.value })}
            placeholder="Sender email"
            className={cn(fieldClass, highlight?.senderEmail && "cmk-field-flash")}
          />
        </Field>

        <Field label="Domain" required>
          <div className="relative">
            <select
              value={values.domain}
              onChange={(e) => onChange({ domain: e.target.value })}
              className={cn(fieldClass, "appearance-none pr-9")}
            >
              {DOMAINS.map((d) => (
                <option key={d}>{d}</option>
              ))}
            </select>
            <ChevronDown
              className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-[#8A8AA3]"
              strokeWidth={2}
            />
          </div>
        </Field>

        <Field
          label="Subject"
          required
          info="The line this campaign gets opened on — keep it under 60 characters."
          className="col-span-2"
        >
          <input
            type="text"
            value={values.subject}
            onChange={(e) => onChange({ subject: e.target.value })}
            placeholder="Subject line"
            className={cn(fieldClass, highlight?.subject && "cmk-field-flash")}
          />
        </Field>
        <div aria-hidden />

        <Field label="Pre-header" className="col-span-2">
          <input
            type="text"
            value={values.preHeader}
            onChange={(e) => onChange({ preHeader: e.target.value })}
            placeholder="Pre-header"
            className={cn(fieldClass, highlight?.preHeader && "cmk-field-flash")}
          />
        </Field>
        <div aria-hidden />
      </div>

      <div className="mt-7 flex flex-wrap gap-3">
        <AddButton
          label="Reply email id"
          active={values.replyEnabled}
          onClick={() => onChange({ replyEnabled: !values.replyEnabled })}
        />
        <AddButton
          label="Receive a copy"
          active={values.copyEnabled}
          onClick={() => onChange({ copyEnabled: !values.copyEnabled })}
        />
        <AddButton
          label="Attachments"
          active={values.attachmentsEnabled}
          onClick={() => onChange({ attachmentsEnabled: !values.attachmentsEnabled })}
        />
      </div>

      <Reveal open={extrasOpen}>
        <div className="grid grid-cols-3 gap-x-6 gap-y-5">
          {values.replyEnabled && (
            <Field label="Reply email id" info="Where replies to this campaign land.">
              <input
                type="text"
                value={values.replyEmail}
                onChange={(e) => onChange({ replyEmail: e.target.value })}
                placeholder="reply@m3m.in"
                className={fieldClass}
              />
            </Field>
          )}
          {values.copyEnabled && (
            <Field label="Receive a copy" info="Comma-separated internal recipients.">
              <input
                type="text"
                value={values.copyEmails}
                onChange={(e) => onChange({ copyEmails: e.target.value })}
                placeholder="marketing@m3m.in, ops@m3m.in"
                className={fieldClass}
              />
            </Field>
          )}
          {values.attachmentsEnabled && (
            <Field label="Attachments">
              <button
                type="button"
                className="flex h-10 w-full items-center gap-2 rounded-md border border-dashed border-[#C3CAD9] bg-[#F7F9FC] px-3 font-manrope text-sm text-[#6F6F8D] transition-colors hover:border-[#2F68E5] hover:text-[#2F68E5]"
              >
                <Plus className="size-4" strokeWidth={2.4} />
                Add a file (max 5 MB)
              </button>
            </Field>
          )}
        </div>
      </Reveal>

      {/* Template picker — same panel, its own heading, exactly as sender
          details and the template list sit together in the reference. */}
      <h2 className="mb-4 mt-10 font-manrope text-base font-bold text-[#17173A]">
        Select a template
      </h2>

      <div className="flex items-center justify-between gap-4 border-b border-[#E8ECF4]">
        <div className="flex items-center gap-6">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => onChange({ tab: t.id })}
              className={cn(
                "relative pb-2.5 font-manrope text-sm transition-colors",
                values.tab === t.id
                  ? "font-bold text-[#2F68E5]"
                  : "font-medium text-[#6F6F8D] hover:text-[#17173A]"
              )}
            >
              {t.label}
              {values.tab === t.id && (
                <span className="absolute -bottom-px left-0 h-[3px] w-full rounded-[1.5px] bg-[#2F68E5]" />
              )}
            </button>
          ))}
        </div>

        {values.tab === "my" && (
          <div className="flex items-center gap-2 pb-2">
            {searchOpen ? (
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#8A8AA3]" />
                <input
                  autoFocus
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setPage(1);
                  }}
                  onBlur={() => !query && setSearchOpen(false)}
                  placeholder="Search templates"
                  className="h-10 w-[240px] rounded-md border border-[#2F68E5] bg-white pl-9 pr-8 font-manrope text-sm text-[#17173A] outline-none placeholder:text-[#A0A0A0]"
                />
                {query && (
                  <button
                    type="button"
                    aria-label="Clear search"
                    onClick={() => {
                      setQuery("");
                      setSearchOpen(false);
                      setPage(1);
                    }}
                    className="absolute right-2 top-1/2 grid size-5 -translate-y-1/2 place-items-center rounded-full text-[#8A8AA3] hover:bg-[#F0F3F9]"
                  >
                    <X className="size-3.5" strokeWidth={2.4} />
                  </button>
                )}
              </div>
            ) : (
              <button
                type="button"
                aria-label="Search templates"
                onClick={() => setSearchOpen(true)}
                className="grid size-10 place-items-center rounded-md border border-[#DDE2EE] bg-white text-[#6F6F8D] transition-colors hover:bg-[#F7F9FC] hover:text-[#17173A]"
              >
                <Search className="size-[18px]" strokeWidth={2} />
              </button>
            )}
            <button
              type="button"
              className="dc-btn dc-btn-secondary h-10"
            >
              <SlidersHorizontal className="size-4" strokeWidth={2} />
              Filters
            </button>
          </div>
        )}
      </div>

      {values.tab === "my" ? (
        <>
          {shown.length === 0 ? (
            <p className="py-16 text-center font-manrope text-sm text-[#6F6F8D]">
              No template matches “{query}”.
            </p>
          ) : (
            <div className="mt-6 grid grid-cols-5 gap-4">
              {shown.map((t) => (
                <TemplateCard
                  key={t.id}
                  template={t}
                  selected={values.templateId === t.id}
                  onSelect={() =>
                    onChange({ templateId: values.templateId === t.id ? null : t.id })
                  }
                />
              ))}
            </div>
          )}

          <div className="mt-6 flex items-center justify-between">
            <div className="relative">
              <button
                type="button"
                onClick={() => setPerPageOpen((o) => !o)}
                className="flex h-10 w-[215px] items-center justify-between rounded-[5px] border border-[#DDE2EE] bg-white px-2.5 font-manrope text-sm text-[#17173A]"
              >
                {perPage} per page
                <ChevronDown
                  className={cn(
                    "h-5 w-5 text-[#6F6F8D] transition-transform",
                    perPageOpen && "rotate-180"
                  )}
                  strokeWidth={1.8}
                />
              </button>
              {perPageOpen && (
                <div className="absolute bottom-11 left-0 z-20 w-[215px] overflow-hidden rounded-md border border-[#DDE2EE] bg-white py-1 shadow-[0_8px_24px_rgba(23,23,58,0.12)]">
                  {PER_PAGE_OPTIONS.map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => {
                        setPerPage(n);
                        setPage(1);
                        setPerPageOpen(false);
                      }}
                      className={cn(
                        "block w-full px-3 py-2 text-left font-manrope text-sm transition-colors",
                        n === perPage
                          ? "bg-[#F4F8FF] font-semibold text-[#2F68E5]"
                          : "text-[#17173A] hover:bg-[#F7F9FC]"
                      )}
                    >
                      {n} per page
                    </button>
                  ))}
                </div>
              )}
            </div>

            <Pager page={current} pageCount={pageCount} onPage={setPage} />
          </div>
        </>
      ) : (
        <div className="mt-6 grid grid-cols-3 gap-4">
          {templateStarters.map((s) => {
            const Icon = STARTER_ICONS[s.id];
            const on = values.starterId === s.id;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => onChange({ starterId: on ? "" : s.id })}
                className={cn(
                  "flex flex-col items-start gap-3 rounded-lg border bg-white p-5 text-left transition-colors",
                  on
                    ? "border-[#2F68E5] bg-[#F4F8FF]"
                    : "border-[#DDE2EE] hover:border-[#B9C6E4] hover:bg-[#F7F9FC]"
                )}
              >
                <span
                  className={cn(
                    "grid size-10 place-items-center rounded-md",
                    on ? "bg-[#2F68E5] text-white" : "bg-[#F0F3F9] text-[#6F6F8D]"
                  )}
                >
                  <Icon className="size-5" strokeWidth={2} />
                </span>
                <div>
                  <p className="font-manrope text-sm font-bold text-[#17173A]">{s.name}</p>
                  <p className="mt-1 font-manrope text-xs leading-[18px] text-[#6F6F8D]">
                    {s.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </StepCard>
  );
}
