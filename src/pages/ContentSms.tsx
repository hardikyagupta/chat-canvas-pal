import { useMemo, useState } from "react";
import { Check, ChevronDown, Copy, Minus, Pencil, Search, Send, SquarePen, X } from "lucide-react";
import { toast } from "sonner";
import L1Nav from "@/components/campaigns/L1Nav";
import TopNav from "@/components/campaigns/TopNav";
import { ActionMenu, ActionMenuContent, ActionMenuTrigger } from "@/components/ui/action-menu";
import { CardMenuItem } from "@/components/campaigns/campaign-creation/TemplateCard";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import CreateSmsTemplateOverlay from "@/components/content/CreateSmsTemplateOverlay";
import {
  SMS_CATEGORIES,
  smsLength,
  smsParts,
  smsTemplates,
  type SmsCategory,
  type SmsTemplate,
} from "@/components/content/smsTemplates.data";

function Checkbox({ state }: { state: "checked" | "unchecked" | "mixed" }) {
  const on = state !== "unchecked";
  return (
    <span
      aria-hidden="true"
      className={cn(
        "grid size-[18px] shrink-0 place-items-center rounded-[3px] border transition-colors",
        on ? "border-[#2F68E5] bg-[#2F68E5] text-white" : "border-[#C7CEE0] bg-white"
      )}
    >
      {state === "checked" && <Check className="size-3.5" strokeWidth={3} />}
      {state === "mixed" && <Minus className="size-3.5" strokeWidth={3} />}
    </span>
  );
}


/** Three small rings — the card's "more actions" glyph. */
function RingsIcon({ className }: { className?: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className={className} aria-hidden="true">
      {[3, 8, 13].map((cx) => (
        <circle key={cx} cx={cx} cy="8" r="1.6" stroke="currentColor" strokeWidth="1.2" />
      ))}
    </svg>
  );
}

function SmsTemplateCard({
  template,
  showActions = false,
  onEdit,
}: {
  template: SmsTemplate;
  showActions?: boolean;
  onEdit: () => void;
}) {
  const characters = smsLength(template.body);
  const act = (action: string) => toast(`${action} “${template.name}” isn't wired up yet.`);
  return (
    <article className="group relative flex flex-col overflow-hidden rounded-md border border-[#DDE2EE] bg-white transition-shadow hover:shadow-[0_4px_14px_rgba(23,23,58,0.08)]">
      {showActions && (
        <ActionMenu>
          <ActionMenuTrigger asChild>
            <button
              type="button"
              aria-label={`Actions for ${template.name}`}
              className="absolute right-3 top-3 grid size-8 place-items-center rounded-[6px] bg-[#F4F5F9] text-[#6F6F8D] opacity-0 transition-colors hover:bg-[#E9ECF4] focus-visible:opacity-100 group-hover:opacity-100 data-[state=open]:bg-[#3B66DB] data-[state=open]:text-white data-[state=open]:opacity-100"
            >
              <RingsIcon />
            </button>
          </ActionMenuTrigger>
          <ActionMenuContent
            align="end"
            side="bottom"
            sideOffset={4}
            className="z-[120] w-[168px] gap-0 overflow-hidden rounded-lg border-[#DDE2EE] p-0 shadow-[0_8px_24px_rgba(23,23,58,0.12)]"
          >
            <CardMenuItem icon={Send} onSelect={() => act("Using")}>
              Use
            </CardMenuItem>
            <CardMenuItem icon={Pencil} onSelect={onEdit}>
              Edit
            </CardMenuItem>
            <CardMenuItem icon={SquarePen} onSelect={() => act("Renaming")}>
              Rename
            </CardMenuItem>
            <CardMenuItem icon={Copy} onSelect={() => act("Duplicating")}>
              Duplicate
            </CardMenuItem>
          </ActionMenuContent>
        </ActionMenu>
      )}
      <p className="min-h-[190px] flex-1 px-5 pb-6 pt-5 font-manrope text-[14px] leading-[21px] text-[#17173A]">
        {template.body}
      </p>
      <div className="border-t border-[#EEF1F7] bg-[#FBFCFE] px-5 py-4">
        <p className="truncate font-manrope text-[14px] font-semibold text-[#17173A]">{template.name}</p>
        <div className="mt-1.5 flex items-center gap-3 font-manrope text-[12px] text-[#6F6F8D]">
          <span>
            ID: <span className="text-[#17173A]">{template.id}</span>
          </span>
          <span className="h-3 w-px bg-[#DDE2EE]" />
          <span className="truncate">
            DLT ID: <span className="text-[#17173A]">{template.dltId}</span>
          </span>
        </div>
        <div className="mt-1.5 flex items-center gap-3 font-manrope text-[12px] text-[#6F6F8D]">
          <span>
            Characters: <span className="font-bold text-[#17173A]">{characters}</span>
          </span>
          <span className="h-3 w-px bg-[#DDE2EE]" />
          <span>
            SMS Parts: <span className="font-bold text-[#17173A]">{smsParts(characters)}</span>
          </span>
        </div>
      </div>
    </article>
  );
}

/**
 * Content → SMS, reached from the SMS row of the Content L2 flyout. Same shell
 * as the other listing pages (L1 rail, top bar, scrolling content column) with
 * the saved SMS templates laid out as a four-up card grid.
 */
export default function ContentSms() {
  // Everything starts ticked, i.e. no filter. `draft` is the checklist as the
  // user edits it; only Apply commits it to `applied`.
  const [templates, setTemplates] = useState<SmsTemplate[]>(smsTemplates);
  const [allCategories, setAllCategories] = useState<SmsCategory[]>([...SMS_CATEGORIES]);
  const [applied, setApplied] = useState<SmsCategory[]>([...SMS_CATEGORIES]);
  const [draft, setDraft] = useState<SmsCategory[]>([...SMS_CATEGORIES]);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<SmsTemplate | null>(null);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return templates.filter(
      (t) =>
        (applied.length === 0 || applied.includes(t.category)) &&
        (!q || t.name.toLowerCase().includes(q) || t.body.toLowerCase().includes(q) || String(t.id).includes(q))
    );
  }, [templates, applied, query]);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#F4F8FF]">
      <L1Nav active="content" activeContentItem="sms" />

      <div className="flex min-w-0 flex-1 flex-col p-2">
        <TopNav showCoMarketerNudge={false} />

        <div className="scroll-slim mt-2 flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto px-2 pt-4">
          <div className="flex items-center justify-between gap-4">
            <h1 className="font-manrope text-[20px] font-bold leading-tight text-[#17173A]">SMS</h1>

            <div className="flex items-center gap-3">
              {searchOpen ? (
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#8A8AA3]" />
                  <input
                    autoFocus
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onBlur={() => !query && setSearchOpen(false)}
                    placeholder="Search templates"
                    className="h-[34px] w-[240px] rounded-[4px] border border-[#2F68E5] bg-white pl-9 pr-8 font-manrope text-[13px] text-[#17173A] outline-none placeholder:text-[#A0A0A0]"
                  />
                  {query && (
                    <button
                      type="button"
                      aria-label="Clear search"
                      onClick={() => {
                        setQuery("");
                        setSearchOpen(false);
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
                  aria-label="Search SMS templates"
                  onClick={() => setSearchOpen(true)}
                  className="grid size-[34px] place-items-center rounded-[4px] border border-[#DDE2EE] bg-white text-[#6F6F8D] transition-colors hover:bg-[#F4F8FF]"
                >
                  <Search className="size-4" strokeWidth={1.8} />
                </button>
              )}

              <Popover
                open={categoryOpen}
                onOpenChange={(o) => {
                  setCategoryOpen(o);
                  // Reopening starts from what's actually applied, not an abandoned edit.
                  if (o) setDraft(applied);
                }}
              >
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className={cn(
                      "flex h-[34px] min-w-[160px] items-center justify-between gap-3 rounded-[4px] border bg-white px-3 font-manrope text-[14px] text-[#17173A] transition-colors hover:bg-[#F7F9FC]",
                      categoryOpen ? "border-[#2F68E5]" : "border-[#DDE2EE]"
                    )}
                  >
                    <span>
                      Category <span className="text-[#6F6F8D]">({shown.length})</span>
                    </span>
                    <ChevronDown className="size-4 text-[#6F6F8D]" strokeWidth={2} />
                  </button>
                </PopoverTrigger>
                <PopoverContent align="end" className="z-[120] w-[272px] overflow-hidden rounded-[4px] border-[#DDE2EE] p-0 font-manrope shadow-[0_8px_24px_rgba(23,23,58,0.12)]">
                  <button
                    type="button"
                    onClick={() => setDraft(draft.length === allCategories.length ? [] : [...allCategories])}
                    className="flex w-full items-center gap-3 border-b border-[#DDE2EE] px-4 py-3 text-left"
                  >
                    <Checkbox
                      state={
                        draft.length === allCategories.length ? "checked" : draft.length === 0 ? "unchecked" : "mixed"
                      }
                    />
                    <span className="text-[14px] font-semibold text-[#6F6F8D]">Select all</span>
                  </button>

                  <div className="scroll-slim max-h-[216px] overflow-y-auto py-1">
                    {allCategories.map((c) => {
                      const on = draft.includes(c);
                      return (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setDraft(on ? draft.filter((x) => x !== c) : [...draft, c])}
                          className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-[#F7F9FC]"
                        >
                          <Checkbox state={on ? "checked" : "unchecked"} />
                          <span className="text-[14px] font-semibold text-[#6F6F8D]">{c}</span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex items-center gap-3 border-t border-[#DDE2EE] p-3">
                    <button
                      type="button"
                      onClick={() => setDraft([])}
                      className="flex h-9 items-center gap-1.5 rounded-[4px] border border-[#DDE2EE] bg-white px-4 text-[13px] font-semibold uppercase text-[#6F6F8D] transition-colors hover:bg-[#F7F9FC]"
                    >
                      <X className="size-4" strokeWidth={2.4} />
                      Clear
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setApplied(draft);
                        setCategoryOpen(false);
                      }}
                      className="flex h-9 items-center gap-1.5 rounded-[4px] bg-[#4CC08C] px-4 text-[13px] font-semibold uppercase text-white transition-colors hover:bg-[#3FAE7C]"
                    >
                      <Check className="size-4" strokeWidth={2.8} />
                      Apply
                    </button>
                  </div>
                </PopoverContent>
              </Popover>

              <button
                type="button"
                onClick={() => setCreating(true)}
                className="dc-btn dc-btn-primary uppercase"
              >
                Create new
              </button>
            </div>
          </div>

          {shown.length === 0 ? (
            <p className="py-20 text-center font-manrope text-sm text-[#6F6F8D]">
              No SMS template matches your filters.
            </p>
          ) : (
            <div className="mt-6 grid grid-cols-4 gap-5 pb-8">
              {shown.map((t) => (
                <SmsTemplateCard
                  key={t.id}
                  template={t}
                  showActions={t.name === "Flash sale — 30% off"}
                  onEdit={() => setEditing(t)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {(creating || editing) && (
        <CreateSmsTemplateOverlay
          // Remount per template so an edit never inherits the previous draft's state.
          key={editing?.id ?? "new"}
          initial={editing ?? undefined}
          onClose={() => {
            setCreating(false);
            setEditing(null);
          }}
          onSave={(t) => {
            if (editing) {
              setTemplates(templates.map((x) => (x.id === editing.id ? { ...x, ...t } : x)));
            } else {
              const id = Math.max(0, ...templates.map((x) => x.id)) + 1;
              setTemplates([{ id, ...t }, ...templates]);
            }
            // A category the page hasn't seen yet joins the filter, ticked, so the card isn't hidden.
            if (!allCategories.includes(t.category)) {
              setAllCategories([...allCategories, t.category]);
              setApplied((a) => [...a, t.category]);
            }
            setCreating(false);
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}
