import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import * as SwitchPrimitives from "@radix-ui/react-switch";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Archive,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Code2,
  Copy,
  FolderInput,
  Info,
  LayoutGrid,
  Mail,
  Monitor,
  MoreVertical,
  Paperclip,
  Pencil,
  Plus,
  Replace,
  RotateCcw,
  Search,
  Send,
  SlidersHorizontal,
  Smartphone,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
  Trash2,
  Trophy,
  Upload,
  X,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import sparkle from "/campaign-assets/ic-sparkle-ai.gif";
import folderIcon from "/campaign-assets/ic-template-folder.svg";
import { ActionMenu, ActionMenuContent, ActionMenuTrigger } from "@/components/ui/action-menu";
import StepCard from "./StepCard";
import TemplateCard, { CardMenuItem, TemplateThumbnail } from "./TemplateCard";
import {
  emailTemplates,
  savedTemplateFolders,
  templateLibrary,
  type EmailTemplate,
  type TemplateFolder,
} from "./emailTemplates.data";

export interface ContentValues {
  senderName: string;
  senderEmail: string;
  domain: string;
  subject: string;
  preHeader: string;
  /** Optional sender fields, each opened from its own "+" button. Kept for the
   *  v1 layout (see CONTENT_LAYOUT_V2) even while it's hidden. */
  replyEnabled: boolean;
  replyEmail: string;
  copyEnabled: boolean;
  copyEmails: string;
  /** Cc/Bcc — the v2 layout's own fields, separate from the v1 ones above. */
  ccEnabled: boolean;
  ccEmails: string;
  bccEnabled: boolean;
  bccEmails: string;
  attachmentsEnabled: boolean;
  attachments: string[];
  /** Saved template picked for this campaign, if any. */
  templateId: number | null;
  starterId: string;
  /** A/B variants — "A" only until the "+" tab adds more. */
  variants: string[];
  activeVariant: string;
  /** % of reach each variant gets. Whatever's left over is the winner send. */
  variantSplit: Record<string, number>;
  /** On = the sentence below picks a winner automatically. */
  decideWinner: boolean;
  winningMetric: "Open" | "Clicks" | "Conversion";
  /** How long the test runs before a winner is picked. */
  testDurationValue: string;
  testDurationUnit: "Hours" | "Days";
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
  ccEnabled: false,
  ccEmails: "",
  bccEnabled: false,
  bccEmails: "",
  attachmentsEnabled: false,
  attachments: [],
  templateId: null,
  starterId: "",
  variants: ["A"],
  activeVariant: "A",
  variantSplit: { A: 100 },
  decideWinner: false,
  winningMetric: "Open",
  testDurationValue: "01",
  testDurationUnit: "Hours",
};

/** Verified sending domains on the account. */
const DOMAINS = ["m3m.in", "mailer.m3m.in", "news.m3m.in", "offers.m3m.in"];

/** A/B variants cap out at five (A–E). */
const MAX_VARIANTS = 5;

/** One color per variant letter, for the small badges in User distribution. */
const VARIANT_COLORS: Record<string, { bg: string; text: string }> = {
  A: { bg: "#2F68E5", text: "#fff" },
  B: { bg: "#7B5CFA", text: "#fff" },
  C: { bg: "#00C48C", text: "#fff" },
  D: { bg: "#FC5E02", text: "#fff" },
  E: { bg: "#F5C542", text: "#17173A" },
};

/** Share held back for the winning variant's send, once that's switched on. */
const WINNER_RESERVE = 20;

/** Splits `total` across `variants`, giving the remainder to the first one so
 *  the pills always add up to a round 100. */
function evenSplit(variants: string[], total: number): Record<string, number> {
  const each = Math.floor(total / variants.length);
  const split: Record<string, number> = {};
  variants.forEach((v, i) => {
    split[v] = i === 0 ? total - each * (variants.length - 1) : each;
  });
  return split;
}

/** Rescales an existing split to a new total, keeping each variant's share of
 *  the test relative to the others. Used when the winner's cut is edited. */
function rescaleSplit(
  variants: string[],
  split: Record<string, number>,
  total: number
): Record<string, number> {
  const current = variants.reduce((sum, v) => sum + (split[v] ?? 0), 0);
  if (current <= 0) return evenSplit(variants, total);
  const next: Record<string, number> = {};
  let assigned = 0;
  variants.forEach((v, i) => {
    if (i === variants.length - 1) {
      next[v] = total - assigned;
      return;
    }
    next[v] = Math.round(((split[v] ?? 0) * total) / current);
    assigned += next[v];
  });
  return next;
}

const DURATION_UNITS = ["Hours", "Days"] as const;
const durationOptionsFor = (unit: string) => {
  const max = unit === "Days" ? 30 : 23;
  return Array.from({ length: max }, (_, i) => String(i + 1).padStart(2, "0"));
};

/** Formats a saved attachment can be, and the size cap on it. */
const ATTACHMENT_ACCEPT = ".csv,.xls,.xlsx,.htm,.html,.pdf,.docx,.jpg,.jpeg,.gif,.png,.ics";

/**
 * Exploring a new take on the Content step's header (From/Cc/Bcc/attachments,
 * then Subject/Pre-header) — the old sender-fields block stays in place below,
 * just not rendered, so flipping this back to false brings it right back.
 */
const CONTENT_LAYOUT_V2 = true;

const PER_PAGE_OPTIONS = [5, 10, 50, 100, 150];
/** Only these page sizes are wired up; the rest are shown but not selectable. */
const PER_PAGE_ENABLED = [5, 10];

/** The three editors either email format leads to, from the "Create new"
 *  menu — same destinations regardless of HTML or AMP. */
const EDITOR_OPTIONS: { id: string; label: string; icon: LucideIcon }[] = [
  { id: "ai", label: "Create with AI", icon: Sparkles },
  { id: "drag-drop", label: "Drag and drop editor", icon: LayoutGrid },
  { id: "html", label: "Code editor", icon: Code2 },
];

const EMAIL_FORMATS: { id: "html" | "amp"; label: string; icon: LucideIcon }[] = [
  { id: "html", label: "HTML email", icon: Mail },
  { id: "amp", label: "AMP email", icon: Zap },
];

type TemplateSourceTab = "library" | "saved";

const TEMPLATE_SOURCE_TABS: { id: TemplateSourceTab; label: string }[] = [
  { id: "library", label: "Template library" },
  { id: "saved", label: "Saved templates" },
];

/** Folders collapse to one row until "View more" is tapped. */
const FOLDERS_COLLAPSED_COUNT = 3;

const fieldClass =
  "h-10 w-full rounded-md border border-[#DDE2EE] bg-[#F7F9FC] px-3 font-manrope text-sm text-[#17173A] outline-none transition-colors placeholder:text-[#A0A0A0] focus:border-[#2F68E5] focus:bg-white";

/** A smaller toggle than the shared Switch — matches the compact toggle+text
 *  rows used elsewhere in the wizard (e.g. Audience's "Don't include"). */
function MiniSwitch({
  checked,
  onCheckedChange,
}: {
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
}) {
  return (
    <SwitchPrimitives.Root
      checked={checked}
      onCheckedChange={onCheckedChange}
      className="peer inline-flex h-4 w-7 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background data-[state=checked]:bg-[#00C48C] data-[state=unchecked]:bg-input"
    >
      <SwitchPrimitives.Thumb className="pointer-events-none block h-3 w-3 rounded-full bg-background shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-3 data-[state=unchecked]:translate-x-0" />
    </SwitchPrimitives.Root>
  );
}

/** "Create new" — a menu button whose two rows (HTML/AMP email) each open a
 *  submenu of the same three editors on hover, flyout-style. Portalled to
 *  <body> and positioned by rect, same as this file's other dropdowns —
 *  the accordion's height-animation wrapper clips overflow, which would
 *  otherwise crop the flyout instead of letting it float free. */
function CreateNewMenu({ onPick }: { onPick: (starterId: string) => void }) {
  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState<"html" | "amp" | null>(null);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (
        !wrapRef.current?.contains(e.target as Node) &&
        !panelRef.current?.contains(e.target as Node)
      ) {
        setOpen(false);
        setHovered(null);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

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

  const pick = (starterId: string) => {
    onPick(starterId);
    setOpen(false);
    setHovered(null);
  };

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="dc-btn dc-btn-secondary"
      >
        <Plus className="size-4" strokeWidth={2.4} />
        Create new
      </button>
      {open &&
        rect &&
        createPortal(
          <div
            ref={panelRef}
            style={{ position: "fixed", top: rect.bottom + 4, left: rect.right - 190, width: 190 }}
            className="z-[80] rounded-md border border-[#DDE2EE] bg-white py-1 shadow-[0_8px_24px_rgba(23,23,58,0.12)]"
          >
            {EMAIL_FORMATS.map((fmt) => (
              <div
                key={fmt.id}
                className="relative"
                onMouseEnter={() => setHovered(fmt.id)}
                onMouseLeave={() => setHovered((h) => (h === fmt.id ? null : h))}
              >
                <button
                  type="button"
                  className={cn(
                    "flex w-full items-center justify-between gap-2 px-3 py-2 text-left font-manrope text-sm transition-colors",
                    hovered === fmt.id
                      ? "bg-[#F4F8FF] text-[#2F68E5]"
                      : "text-[#17173A] hover:bg-[#F7F9FC]"
                  )}
                >
                  <span className="flex items-center gap-2">
                    <fmt.icon className="size-4" strokeWidth={2} />
                    {fmt.label}
                  </span>
                  <ChevronRight className="size-3.5 text-[#8A8AA3]" strokeWidth={2} />
                </button>
                {hovered === fmt.id && (
                  <div className="absolute left-full top-0 z-[80] -ml-px w-[190px] rounded-md border border-[#DDE2EE] bg-white py-1 shadow-[0_8px_24px_rgba(23,23,58,0.12)]">
                    {EDITOR_OPTIONS.map((o) => (
                      <button
                        key={o.id}
                        type="button"
                        onClick={() => pick(o.id)}
                        className="flex w-full items-center gap-2 px-3 py-2 text-left font-manrope text-sm text-[#17173A] transition-colors hover:bg-[#F7F9FC]"
                      >
                        <o.icon className="size-4 text-[#6F6F8D]" strokeWidth={2} />
                        {o.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>,
          document.body
        )}
    </div>
  );
}

/** One folder under "Saved templates" — icon, name, counts, and a kebab menu
 *  offering the two things you can do to a folder itself (not what's in it). */
function FolderCard({ folder }: { folder: TemplateFolder }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-[#DDE2EE] bg-white px-4 py-3 transition-colors hover:border-[#B9C6E4]">
      <img src={folderIcon} alt="" className="size-5 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="truncate font-manrope text-xs font-semibold text-[#17173A]">{folder.name}</p>
        <p className="mt-0.5 font-manrope text-[11px] text-[#6F6F8D]">
          {folder.templateCount} template{folder.templateCount === 1 ? "" : "s"}, {folder.folderCount}{" "}
          folder{folder.folderCount === 1 ? "" : "s"}
        </p>
      </div>
      <ActionMenu>
        <ActionMenuTrigger asChild>
          <button
            type="button"
            aria-label={`Actions for ${folder.name}`}
            className="grid size-7 shrink-0 place-items-center rounded-md text-[#8A8AA3] transition-colors hover:bg-[#F0F3F9] hover:text-[#17173A]"
          >
            <MoreVertical className="size-4" strokeWidth={2} />
          </button>
        </ActionMenuTrigger>
        <ActionMenuContent
          align="end"
          side="bottom"
          sideOffset={4}
          className="z-[120] w-[148px] gap-0 overflow-hidden rounded-lg border-[#DDE2EE] p-0 shadow-[0_8px_24px_rgba(23,23,58,0.12)]"
        >
          <CardMenuItem icon={FolderInput} onSelect={() => {}}>
            Move
          </CardMenuItem>
          <CardMenuItem icon={Archive} onSelect={() => {}}>
            Archive
          </CardMenuItem>
        </ActionMenuContent>
      </ActionMenu>
    </div>
  );
}

/** Replaces the whole "Select a template" picker once one's been picked —
 *  a laptop/mobile preview of the chosen template, plus the three things
 *  you can do with it from here. */
function TemplatePreviewPanel({
  template,
  device,
  onDeviceChange,
  onChangeTemplate,
}: {
  template: EmailTemplate | null;
  device: "desktop" | "mobile";
  onDeviceChange: (device: "desktop" | "mobile") => void;
  onChangeTemplate: () => void;
}) {
  return (
    <div className="mt-10">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-1 rounded-md border border-[#DDE2EE] bg-white p-1">
          <button
            type="button"
            aria-label="Desktop preview"
            aria-pressed={device === "desktop"}
            onClick={() => onDeviceChange("desktop")}
            className={cn(
              "grid size-8 place-items-center rounded-md transition-colors",
              device === "desktop"
                ? "bg-[#F0F3F9] text-[#17173A]"
                : "text-[#8A8AA3] hover:text-[#17173A]"
            )}
          >
            <Monitor className="size-4" strokeWidth={2} />
          </button>
          <button
            type="button"
            aria-label="Mobile preview"
            aria-pressed={device === "mobile"}
            onClick={() => onDeviceChange("mobile")}
            className={cn(
              "grid size-8 place-items-center rounded-md transition-colors",
              device === "mobile"
                ? "bg-[#F0F3F9] text-[#17173A]"
                : "text-[#8A8AA3] hover:text-[#17173A]"
            )}
          >
            <Smartphone className="size-4" strokeWidth={2} />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button type="button" className="dc-btn dc-btn-secondary">
            <Pencil className="size-4" strokeWidth={2} />
            Edit
          </button>
          <button type="button" className="dc-btn dc-btn-secondary">
            <Send className="size-4" strokeWidth={2} />
            Send a test email
          </button>
          <button type="button" onClick={onChangeTemplate} className="dc-btn dc-btn-secondary">
            <Replace className="size-4" strokeWidth={2} />
            Change template
          </button>
        </div>
      </div>

      <div className="flex justify-center rounded-xl border border-[#DDE2EE] bg-[#F7F9FC] p-8">
        <div
          className={cn(
            "overflow-hidden rounded-lg border border-[#DDE2EE] bg-white shadow-[0_8px_24px_rgba(23,23,58,0.08)] transition-all duration-300 ease-in-out",
            device === "desktop" ? "w-[900px]" : "w-[380px]"
          )}
        >
          <div className="h-9 border-b border-[#EEF1F7] bg-[#F7F9FC]" />
          {/* The frame is a fixed viewport, not the template's own height — this
              scrollbar (unlike the wizard canvas behind it) stays visible, so
              it's clear there's more of the template to see below the fold. */}
          <div
            className={cn(
              "overflow-y-auto bg-white transition-all duration-300 ease-in-out",
              device === "desktop" ? "h-[560px]" : "h-[640px]"
            )}
          >
            {!template ? (
              <div className="grid h-full place-items-center font-manrope text-sm text-[#6F6F8D]">
                Template not found.
              </div>
            ) : template.image ? (
              <img src={template.image} alt="" className="block h-auto w-full" />
            ) : (
              <TemplateThumbnail kind={template.preview} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/** Our own styled dropdown — a trigger button plus a floating option list —
 *  in place of a native <select>, for the variant test-settings fields. */
function Dropdown({
  value,
  options,
  onChange,
}: {
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (!wrapRef.current?.contains(t) && !panelRef.current?.contains(t)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  // Some triggers sit inside the accordion's height-animating panel, which
  // clips overflow — so the option list is portalled to <body> and kept in
  // sync with the trigger's live position instead of relying on normal-flow
  // absolute positioning (which that ancestor would crop).
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

  return (
    <div ref={wrapRef} className="relative w-full">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex h-10 w-full items-center justify-between gap-2 rounded-md border bg-white px-3 font-manrope text-sm text-[#17173A] outline-none transition-colors",
          open ? "border-[#2F68E5]" : "border-[#DDE2EE]"
        )}
      >
        <span className="truncate">{value}</span>
        <ChevronDown
          className={cn("size-4 shrink-0 text-[#8A8AA3] transition-transform", open && "rotate-180")}
          strokeWidth={2}
        />
      </button>
      {open &&
        rect &&
        createPortal(
          <div
            ref={panelRef}
            style={{ top: rect.bottom + 4, left: rect.left, width: rect.width }}
            className="scroll-slim fixed z-[80] max-h-[240px] overflow-y-auto rounded-md border border-[#DDE2EE] bg-white py-1 shadow-[0_8px_24px_rgba(23,23,58,0.12)]"
          >
            {options.map((o) => (
              <button
                key={o}
                type="button"
                onClick={() => {
                  onChange(o);
                  setOpen(false);
                }}
                className={cn(
                  "block w-full whitespace-nowrap px-3 py-2 text-left font-manrope text-sm transition-colors",
                  o === value ? "bg-[#F4F8FF] font-semibold text-[#2F68E5]" : "text-[#17173A] hover:bg-[#F7F9FC]"
                )}
              >
                {o}
              </button>
            ))}
          </div>,
          document.body
        )}
    </div>
  );
}

function InfoDot({ label }: { label: string }) {
  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            aria-label="More information"
            className="inline-grid shrink-0 place-items-center text-[#8A8AA3] transition-colors hover:text-[#6F6F8D]"
          >
            <Info className="size-4" strokeWidth={2} />
          </button>
        </TooltipTrigger>
        <TooltipContent
          side="right"
          align="center"
          sideOffset={8}
          className="max-w-[260px] overflow-visible rounded-lg border-0 bg-black px-3 py-2.5 text-white shadow-none"
        >
          <p className="font-manrope text-xs leading-[18px]">{label}</p>
          <TooltipPrimitive.Arrow className="fill-black" width={10} height={6} />
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
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

/** A borderless field styled as a single line — label, then the field, then
 *  whatever's trailing on that row. Full-width rows separated by hairlines,
 *  the way a mail composer lays out From/Cc/Bcc/Subject rather than a form. */
function FieldRow({
  label,
  required,
  info,
  trailing,
  children,
}: {
  label: string;
  required?: boolean;
  info?: string;
  trailing?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex items-center gap-4 border-b border-[#E8ECF4] py-3">
      <span className="w-20 shrink-0 font-manrope text-sm font-semibold text-[#17173A]">
        {label}
        {required && <span className="ml-0.5 text-[#FC5E02]">*</span>}
      </span>
      <div className="flex min-w-0 flex-1 items-center gap-2">{children}</div>
      {info && <InfoDot label={info} />}
      {trailing}
    </div>
  );
}

/** Plain text styling for a FieldRow's own input — no box, the row's own
 *  bottom hairline is the only separator. */
const lineInputClass =
  "min-w-0 flex-1 bg-transparent font-manrope text-sm text-[#17173A] outline-none placeholder:text-[#A0A0A0]";

/** One variant's tab — its own label to select it, plus (once a second
 *  variant exists) a kebab menu to copy or delete it. */
function VariantTab({
  letter,
  active,
  showMenu,
  onSelect,
  onCopy,
  onDelete,
}: {
  letter: string;
  active: boolean;
  showMenu: boolean;
  onSelect: () => void;
  onCopy: () => void;
  onDelete: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onDown = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [menuOpen]);

  return (
    <div
      ref={wrapRef}
      className={cn(
        "relative flex h-9 items-stretch rounded-md transition-colors",
        active ? "bg-[#2F68E5] text-white" : "border border-[#DDE2EE] bg-white text-[#17173A]"
      )}
    >
      <button
        type="button"
        onClick={onSelect}
        className={cn(
          "rounded-l-md px-4 font-manrope text-xs font-bold uppercase tracking-[0.4px] transition-colors",
          !showMenu && "rounded-r-md",
          !active && "hover:bg-[#F7F9FC]"
        )}
      >
        Variant {letter}
      </button>
      {showMenu && (
        <>
          <button
            type="button"
            aria-label={`Variant ${letter} options`}
            onClick={() => setMenuOpen((o) => !o)}
            className={cn(
              "grid w-7 shrink-0 place-items-center rounded-r-md transition-colors",
              active ? "hover:bg-white/15" : "hover:bg-[#F7F9FC]"
            )}
          >
            <MoreVertical className="size-4" strokeWidth={2.2} />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-full z-20 mt-1 w-36 overflow-hidden rounded-md border border-[#DDE2EE] bg-white py-1 shadow-[0_8px_24px_rgba(23,23,58,0.12)]">
              <button
                type="button"
                onClick={() => {
                  onCopy();
                  setMenuOpen(false);
                }}
                className="flex w-full items-center justify-between border-l-2 border-transparent px-3 py-2 text-left font-manrope text-sm text-[#17173A] transition-colors hover:border-[#2F68E5] hover:bg-[#F4F8FF]"
              >
                Copy
                <Copy className="size-4 text-[#8A8AA3]" strokeWidth={2} />
              </button>
              <button
                type="button"
                onClick={() => {
                  onDelete();
                  setMenuOpen(false);
                }}
                className="flex w-full items-center justify-between border-l-2 border-transparent px-3 py-2 text-left font-manrope text-sm text-[#17173A] transition-colors hover:border-[#2F68E5] hover:bg-[#F4F8FF]"
              >
                Delete
                <Trash2 className="size-4 text-[#8A8AA3]" strokeWidth={2} />
              </button>
            </div>
          )}
        </>
      )}
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

/** The attachment picker — a paperclip icon that opens this, and shows a green
 *  tick once something's saved. One file, per the reference. */
function AttachmentsModal({
  open,
  initial,
  onCancel,
  onSave,
}: {
  open: boolean;
  initial: string | null;
  onCancel: () => void;
  onSave: (fileName: string | null) => void;
}) {
  const [fileName, setFileName] = useState(initial);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // The component stays mounted (it just renders null) between opens, so the
  // draft has to be reset from the saved value on each open — otherwise a
  // cancelled draft would still be sitting there next time.
  useEffect(() => {
    if (open) setFileName(initial);
  }, [open, initial]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
      <div className="relative w-full max-w-[520px] rounded-lg bg-white p-6 shadow-[0_20px_60px_rgba(23,23,58,0.25)]">
        <div className="flex items-start justify-between">
          <h2 className="font-manrope text-xl font-bold text-[#17173A]">Attachments</h2>
          <button
            type="button"
            aria-label="Close"
            onClick={onCancel}
            className="grid size-8 place-items-center rounded-full text-[#8A8AA3] hover:bg-[#F0F3F9] hover:text-[#17173A]"
          >
            <X className="size-5" strokeWidth={2} />
          </button>
        </div>
        <p className="mt-1 font-manrope text-sm text-[#6F6F8D]">You can add upto 1 attachments</p>

        <div className="mt-5 rounded-lg border border-[#DDE2EE] p-4">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              const f = e.dataTransfer.files[0];
              if (f) setFileName(f.name);
            }}
            className={cn(
              "flex flex-col items-center justify-center gap-3 rounded-md border border-dashed px-6 py-10 text-center transition-colors sm:flex-row",
              dragOver ? "border-[#2F68E5] bg-[#F4F8FF]" : "border-[#C3CAD9] bg-white"
            )}
          >
            <span className="font-manrope text-sm font-bold uppercase tracking-[0.4px] text-[#6F6F8D]">
              Drag &amp; drop
            </span>
            <span className="font-manrope text-sm font-bold text-[#6F6F8D]">OR</span>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="inline-flex h-9 items-center gap-1.5 rounded-md border border-[#DDE2EE] bg-white px-3 font-manrope text-[12px] font-bold uppercase tracking-[0.4px] text-[#17173A] transition-colors hover:bg-[#F7F9FC]"
            >
              <Upload className="size-4" strokeWidth={2.2} />
              Click to upload
            </button>
            <input
              ref={inputRef}
              type="file"
              accept={ATTACHMENT_ACCEPT}
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) setFileName(f.name);
              }}
            />
          </div>
          {fileName && (
            <div className="mt-3 flex items-center justify-between rounded-md bg-[#F7F9FC] px-3 py-2">
              <span className="min-w-0 truncate font-manrope text-sm text-[#17173A]">
                {fileName}
              </span>
              <button
                type="button"
                aria-label="Remove file"
                onClick={() => setFileName(null)}
                className="grid size-5 shrink-0 place-items-center rounded-full text-[#8A8AA3] hover:bg-[#E8ECF4] hover:text-[#17173A]"
              >
                <X className="size-3.5" strokeWidth={2.4} />
              </button>
            </div>
          )}
          <p className="mt-3 font-manrope text-xs leading-[18px] text-[#8A8AA3]">
            Supported formats csv, xls, xlsx, htm, html, pdf, docx, jpg, jpeg, gif, png and ics
            with the maximum file size of 1024 KB
          </p>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex h-10 items-center rounded-md border border-[#2F68E5] px-5 font-manrope text-sm font-bold uppercase tracking-[0.4px] text-[#2F68E5] transition-colors hover:bg-[#F4F8FF]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onSave(fileName)}
            className="inline-flex h-10 items-center rounded-md bg-[#2F68E5] px-5 font-manrope text-sm font-bold uppercase tracking-[0.4px] text-white transition-colors hover:bg-[#255ad2]"
          >
            Save
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

/** The AI sparkle on Subject/Pre-header — a dark suggestion popover, three
 *  picks at a time, Retry cycling to the next three from the same pool. */
function AiSuggestPopover({ pool, onPick }: { pool: string[]; onPick: (text: string) => void }) {
  const [open, setOpen] = useState(false);
  const [offset, setOffset] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const shown = [0, 1, 2].map((i) => pool[(offset + i) % pool.length]);

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        aria-label="Suggest with AI"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "grid size-7 place-items-center rounded-md transition-colors",
          open ? "bg-[#F3F0FF]" : "hover:bg-[#F3F0FF]"
        )}
      >
        <img src={sparkle} alt="" className="size-4 shrink-0" />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-20 mt-2 w-[320px] rounded-lg border border-[#DDE2EE] bg-white p-3 shadow-[0_8px_24px_rgba(23,23,58,0.12)]">
          <div className="flex items-center justify-between gap-2 px-1">
            <span className="font-manrope text-[13px] font-bold text-[#17173A]">
              Here are some options for you
            </span>
            <button
              type="button"
              aria-label="Close"
              onClick={() => setOpen(false)}
              className="grid size-5 shrink-0 place-items-center rounded-full text-[#8A8AA3] transition-colors hover:bg-[#F0F3F9] hover:text-[#17173A]"
            >
              <X className="size-3.5" strokeWidth={2.2} />
            </button>
          </div>

          <div className="mt-2 flex flex-col gap-2">
            {shown.map((text, i) => (
              <button
                key={text}
                type="button"
                style={{ animationDelay: `${i * 50}ms` }}
                onClick={() => {
                  onPick(text);
                  setOpen(false);
                }}
                className="cmk-reveal group flex items-center gap-2.5 rounded-lg border border-[#DDE2EE] bg-white p-2.5 text-left transition-colors hover:border-[#2F68E5] hover:bg-[#F7F9FF]"
              >
                <span className="min-w-0 flex-1 font-manrope text-[13px] font-medium leading-[18px] text-[#17173A]">
                  {text}
                </span>
                <ChevronRight
                  className="size-4 shrink-0 text-[#A0A0B8] transition-colors group-hover:text-[#2F68E5]"
                  strokeWidth={2}
                />
              </button>
            ))}
          </div>

          <div className="mt-2 flex items-center justify-between border-t border-[#EEF1F7] px-1 pt-2.5">
            <button
              type="button"
              onClick={() => setOffset((o) => o + 3)}
              className="flex items-center gap-1.5 font-manrope text-[12px] font-semibold text-[#2F68E5] transition-colors hover:text-[#1F51BE]"
            >
              <RotateCcw className="size-3.5" strokeWidth={2.2} />
              Retry
            </button>
            <div className="flex items-center gap-1 text-[#8A8AA3]">
              <button
                type="button"
                aria-label="Good suggestion"
                className="grid size-6 place-items-center rounded-full transition-colors hover:bg-[#F0F3F9] hover:text-[#17173A]"
              >
                <ThumbsUp className="size-3.5" strokeWidth={2} />
              </button>
              <button
                type="button"
                aria-label="Bad suggestion"
                className="grid size-6 place-items-center rounded-full transition-colors hover:bg-[#F0F3F9] hover:text-[#17173A]"
              >
                <ThumbsDown className="size-3.5" strokeWidth={2} />
              </button>
            </div>
          </div>
          <p className="mt-1.5 flex items-start gap-1.5 px-1 font-manrope text-[11px] leading-[16px] text-[#8A8AA3]">
            <Info className="mt-px size-3.5 shrink-0" strokeWidth={2} />
            Review generated results for accuracy.
          </p>
        </div>
      )}
    </div>
  );
}

/** Pools the Subject/Pre-header sparkle draws from — three shown at a time. */
const SUBJECT_SUGGESTIONS = [
  "Your exclusive invite is here!",
  "Check out what's in your cart",
  "Shop the latest styles today",
  "Don't miss this weekend's drop",
  "A little something just for you",
  "Your favourites are back in stock",
];
const PREHEADER_SUGGESTIONS = [
  "Open now for early access",
  "Free shipping on orders over ₹999",
  "Limited stock — shop before it's gone",
  "Handpicked picks, just for you",
  "Exclusive deals inside",
  "Offer ends soon — don't wait",
];

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
  reach = 0,
}: {
  values: ContentValues;
  onChange: (patch: Partial<ContentValues>) => void;
  /** Field keys just written by a co-marketer apply — briefly flashed. */
  highlight?: Partial<Record<keyof ContentValues, boolean>>;
  /** Audience reach — the base the variant test's "Est. profiles" is drawn from. */
  reach?: number;
}) {
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [perPage, setPerPage] = useState(10);
  const [page, setPage] = useState(1);
  const [perPageOpen, setPerPageOpen] = useState(false);
  const [attachModalOpen, setAttachModalOpen] = useState(false);
  const [sourceTab, setSourceTab] = useState<TemplateSourceTab>("saved");
  const [foldersExpanded, setFoldersExpanded] = useState(false);
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "mobile">("desktop");

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
  const selectedTemplate =
    [...emailTemplates, ...templateLibrary].find((t) => t.id === values.templateId) ?? null;

  const nextUnusedLetter = (variants: string[]) => {
    for (let i = 0; i < MAX_VARIANTS; i++) {
      const letter = String.fromCharCode(65 + i);
      if (!variants.includes(letter)) return letter;
    }
    return null;
  };

  const variantTotal = values.variants.reduce((sum, v) => sum + (values.variantSplit[v] ?? 0), 0);
  const winnerShare = Math.max(0, 100 - variantTotal);
  // What the variants have to share between them. Once a winner send is in
  // play that's whatever it isn't holding, so re-splitting keeps its cut.
  const testPot = values.decideWinner ? Math.min(100, variantTotal) : 100;

  const splitEvenly = () => onChange({ variantSplit: evenSplit(values.variants, testPot) });

  const setVariantShare = (letter: string, next: number) =>
    onChange({
      variantSplit: {
        ...values.variantSplit,
        [letter]: Math.min(100, Math.max(0, next)),
      },
    });

  // The winner's cut is whatever the variants leave behind, so editing it
  // rescales them — their shares of the test stay in the same proportion.
  const setWinnerShare = (next: number) =>
    onChange({
      variantSplit: rescaleSplit(
        values.variants,
        values.variantSplit,
        100 - Math.min(100, Math.max(0, next))
      ),
    });

  const addVariant = () => {
    if (values.variants.length >= MAX_VARIANTS) return;
    const nextLetter = nextUnusedLetter(values.variants);
    if (!nextLetter) return;
    const nextVariants = [...values.variants, nextLetter];
    onChange({
      variants: nextVariants,
      activeVariant: nextLetter,
      variantSplit: evenSplit(nextVariants, testPot),
    });
  };

  const copyVariant = addVariant;

  const deleteVariant = (letter: string) => {
    if (values.variants.length <= 1) return;
    const nextVariants = values.variants.filter((v) => v !== letter);
    onChange({
      variants: nextVariants,
      activeVariant: values.activeVariant === letter ? nextVariants[0] : values.activeVariant,
      variantSplit: evenSplit(nextVariants, testPot),
    });
  };

  const toggleDecideWinner = (on: boolean) =>
    onChange({
      decideWinner: on,
      variantSplit: evenSplit(values.variants, on ? 100 - WINNER_RESERVE : 100),
    });

  return (
    <StepCard
      wide
      {...(CONTENT_LAYOUT_V2
        ? {}
        : {
            title: "Sender details",
            description: "Define sender details to be used for sending the email",
          })}
    >
      {CONTENT_LAYOUT_V2 ? (
        <>
          {(() => {
            // Bcc and the attachment icon stay pinned to the From row no
            // matter what — only the Cc toggle itself leaves it, once Cc has
            // opened its own row underneath.
            const ccToggle = !values.ccEnabled && (
              <button
                type="button"
                onClick={() => onChange({ ccEnabled: true })}
                className="font-manrope text-sm font-medium text-[#6F6F8D] transition-colors hover:text-[#17173A]"
              >
                Cc
              </button>
            );
            const bccToggle = !values.bccEnabled && (
              <button
                type="button"
                onClick={() => onChange({ bccEnabled: true })}
                className="font-manrope text-sm font-medium text-[#6F6F8D] transition-colors hover:text-[#17173A]"
              >
                Bcc
              </button>
            );
            const attachmentButton = (
              <button
                type="button"
                aria-label="Add attachments"
                onClick={() => setAttachModalOpen(true)}
                className="relative grid size-7 place-items-center rounded-md text-[#6F6F8D] transition-colors hover:bg-[#F0F3F9] hover:text-[#17173A]"
              >
                <Paperclip className="size-4" strokeWidth={2} />
                {values.attachments.length > 0 && (
                  <span className="absolute -right-1 -top-1 grid size-3.5 place-items-center rounded-full bg-[#00C48C] text-white">
                    <Check className="size-2" strokeWidth={3} />
                  </span>
                )}
              </button>
            );
            const removeButton = (label: string, onRemove: () => void) => (
              <button
                type="button"
                aria-label={`Remove ${label}`}
                onClick={onRemove}
                className="grid size-5 place-items-center rounded-full text-[#8A8AA3] hover:bg-[#F0F3F9] hover:text-[#17173A]"
              >
                <X className="size-3.5" strokeWidth={2.4} />
              </button>
            );

            const fromTrailing = (
              <div className="ml-auto flex shrink-0 items-center gap-4">
                {ccToggle}
                {bccToggle}
                {attachmentButton}
              </div>
            );
            const ccTrailing = removeButton("Cc", () => onChange({ ccEnabled: false }));
            const bccTrailing = removeButton("Bcc", () => onChange({ bccEnabled: false }));

            return (
              <div>
                <div className="mb-5 flex items-center gap-2">
                  {values.variants.map((v) => (
                    <VariantTab
                      key={v}
                      letter={v}
                      active={values.activeVariant === v}
                      showMenu={values.variants.length > 1}
                      onSelect={() => onChange({ activeVariant: v })}
                      onCopy={() => copyVariant()}
                      onDelete={() => deleteVariant(v)}
                    />
                  ))}
                  {values.variants.length < MAX_VARIANTS && (
                    <TooltipProvider delayDuration={150}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            aria-label="Add variant"
                            onClick={addVariant}
                            className="grid size-9 shrink-0 place-items-center rounded border border-[#DDE2EE] text-[#6F6F8D] transition-colors hover:bg-[#F7F9FC] hover:text-[#17173A]"
                          >
                            <Plus className="size-4" strokeWidth={2.4} />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent
                          side="top"
                          sideOffset={8}
                          className="overflow-visible rounded-lg border-0 bg-black px-3 py-2.5 text-white shadow-none"
                        >
                          <p className="font-manrope text-xs leading-[18px]">Add variant</p>
                          <TooltipPrimitive.Arrow className="fill-black" width={10} height={6} />
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>

                <FieldRow label="From" trailing={fromTrailing}>
                  <input
                    type="text"
                    value={values.senderName}
                    onChange={(e) => onChange({ senderName: e.target.value })}
                    placeholder="Sender name"
                    className={cn(lineInputClass, highlight?.senderName && "cmk-field-flash")}
                  />
                  <div className="relative flex shrink-0 items-center">
                    <select
                      value={values.domain}
                      onChange={(e) => onChange({ domain: e.target.value })}
                      className="appearance-none bg-transparent pr-6 font-manrope text-sm font-semibold text-[#17173A] outline-none"
                    >
                      {DOMAINS.map((d) => (
                        <option key={d} value={d}>{`@${d}`}</option>
                      ))}
                    </select>
                    <ChevronDown
                      className="pointer-events-none absolute right-0 size-4 text-[#8A8AA3]"
                      strokeWidth={2}
                    />
                  </div>
                </FieldRow>

                {values.ccEnabled && (
                  <FieldRow label="Cc" trailing={ccTrailing}>
                    <input
                      type="text"
                      autoFocus
                      value={values.ccEmails}
                      onChange={(e) => onChange({ ccEmails: e.target.value })}
                      placeholder="Cc email"
                      className={lineInputClass}
                    />
                  </FieldRow>
                )}

                {values.bccEnabled && (
                  <FieldRow label="Bcc" trailing={bccTrailing}>
                    <input
                      type="text"
                      autoFocus
                      value={values.bccEmails}
                      onChange={(e) => onChange({ bccEmails: e.target.value })}
                      placeholder="Bcc email"
                      className={lineInputClass}
                    />
                  </FieldRow>
                )}

                <FieldRow
                  label="Subject"
                  required
                  info="The line this campaign gets opened on — keep it under 60 characters."
                  trailing={
                    <AiSuggestPopover
                      pool={SUBJECT_SUGGESTIONS}
                      onPick={(text) => onChange({ subject: text })}
                    />
                  }
                >
                  <input
                    type="text"
                    value={values.subject}
                    onChange={(e) => onChange({ subject: e.target.value })}
                    placeholder="Subject line"
                    className={cn(lineInputClass, highlight?.subject && "cmk-field-flash")}
                  />
                </FieldRow>

                <FieldRow
                  label="Pre-header"
                  trailing={
                    <AiSuggestPopover
                      pool={PREHEADER_SUGGESTIONS}
                      onPick={(text) => onChange({ preHeader: text })}
                    />
                  }
                >
                  <input
                    type="text"
                    value={values.preHeader}
                    onChange={(e) => onChange({ preHeader: e.target.value })}
                    placeholder="Pre-header"
                    className={cn(lineInputClass, highlight?.preHeader && "cmk-field-flash")}
                  />
                </FieldRow>
              </div>
            );
          })()}

          <AttachmentsModal
            open={attachModalOpen}
            initial={values.attachments[0] ?? null}
            onCancel={() => setAttachModalOpen(false)}
            onSave={(fileName) => {
              onChange({
                attachments: fileName ? [fileName] : [],
                attachmentsEnabled: Boolean(fileName),
              });
              setAttachModalOpen(false);
            }}
          />
        </>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-x-6 gap-y-6">
            <Field label="Sender name" info="Shown as the from-name in the inbox.">
              <input
                type="text"
                value={values.senderName}
                onChange={(e) => onChange({ senderName: e.target.value })}
                placeholder="Sender name"
                className={cn(fieldClass, highlight?.senderName && "cmk-field-flash")}
              />
            </Field>

            <Field label="Sender email" required>
              <div
                className={cn(
                  "flex h-10 w-full items-stretch overflow-hidden rounded-md border border-[#DDE2EE] bg-[#F7F9FC] transition-colors focus-within:border-[#2F68E5] focus-within:bg-white",
                  highlight?.senderEmail && "cmk-field-flash"
                )}
              >
                <input
                  type="text"
                  value={values.senderEmail}
                  onChange={(e) => onChange({ senderEmail: e.target.value })}
                  placeholder="noreply"
                  className="min-w-0 flex-1 bg-transparent px-3 font-manrope text-sm text-[#17173A] outline-none placeholder:text-[#A0A0A0]"
                />
                <span className="flex items-center font-manrope text-sm text-[#6F6F8D]">@</span>
                <div className="relative flex items-center">
                  <select
                    value={values.domain}
                    onChange={(e) => onChange({ domain: e.target.value })}
                    className="h-full appearance-none bg-transparent pl-1.5 pr-8 font-manrope text-sm font-semibold text-[#17173A] outline-none"
                  >
                    {DOMAINS.map((d) => (
                      <option key={d}>{d}</option>
                    ))}
                  </select>
                  <ChevronDown
                    className="pointer-events-none absolute right-3 size-4 text-[#8A8AA3]"
                    strokeWidth={2}
                  />
                </div>
              </div>
              <p className="mt-1.5 font-manrope text-xs text-[#6F6F8D]">
                Only verified domains appear here.
              </p>
            </Field>

            <Field
              label="Subject"
              required
              info="The line this campaign gets opened on — keep it under 60 characters."
            >
              <input
                type="text"
                value={values.subject}
                onChange={(e) => onChange({ subject: e.target.value })}
                placeholder="Subject line"
                className={cn(fieldClass, highlight?.subject && "cmk-field-flash")}
              />
            </Field>

            <Field label="Pre-header">
              <input
                type="text"
                value={values.preHeader}
                onChange={(e) => onChange({ preHeader: e.target.value })}
                placeholder="Pre-header"
                className={cn(fieldClass, highlight?.preHeader && "cmk-field-flash")}
              />
            </Field>
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
        </>
      )}

      {values.templateId !== null ? (
        <TemplatePreviewPanel
          template={selectedTemplate}
          device={previewDevice}
          onDeviceChange={setPreviewDevice}
          onChangeTemplate={() => onChange({ templateId: null })}
        />
      ) : (
        <>
      {/* Template picker — same panel, its own heading, exactly as sender
          details and the template list sit together in the reference. */}
      <div className="mb-4 mt-10 flex items-center justify-between gap-4">
        <h2 className="font-manrope text-base font-bold text-[#17173A]">Select a template</h2>

        <div className="flex items-center gap-2">
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
                className="h-8 w-[240px] rounded-md border border-[#2F68E5] bg-white pl-9 pr-8 font-manrope text-sm text-[#17173A] outline-none placeholder:text-[#A0A0A0]"
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
              className="grid size-8 place-items-center rounded-md border border-[#DDE2EE] bg-white text-[#6F6F8D] transition-colors hover:bg-[#F7F9FC] hover:text-[#17173A]"
            >
              <Search className="size-4" strokeWidth={2} />
            </button>
          )}
          <button type="button" className="dc-btn dc-btn-secondary">
            <SlidersHorizontal className="size-4" strokeWidth={2} />
            Filters
          </button>
          <CreateNewMenu onPick={(starterId) => onChange({ starterId, templateId: null })} />
        </div>
      </div>

      <div className="mb-6 flex items-center gap-6 border-b border-[#E8ECF4]">
        {TEMPLATE_SOURCE_TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setSourceTab(t.id)}
            className={cn(
              "relative pb-2.5 font-manrope text-sm transition-colors",
              sourceTab === t.id
                ? "font-bold text-[#2F68E5]"
                : "font-medium text-[#6F6F8D] hover:text-[#17173A]"
            )}
          >
            {t.label}
            {sourceTab === t.id && (
              <span className="absolute -bottom-px left-0 h-[3px] w-full rounded-[1.5px] bg-[#2F68E5]" />
            )}
          </button>
        ))}
      </div>

      {sourceTab === "library" ? (
        <div className="grid grid-cols-5 gap-4">
          {templateLibrary.map((t) => (
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
      ) : (
        <>
          <div className="mb-8">
            <h3 className="mb-4 font-manrope text-sm font-bold text-[#17173A]">Folders</h3>
            <div className="grid grid-cols-3 gap-4">
              {(foldersExpanded
                ? savedTemplateFolders
                : savedTemplateFolders.slice(0, FOLDERS_COLLAPSED_COUNT)
              ).map((f) => (
                <FolderCard key={f.id} folder={f} />
              ))}
            </div>
            {savedTemplateFolders.length > FOLDERS_COLLAPSED_COUNT && (
              <button
                type="button"
                onClick={() => setFoldersExpanded((o) => !o)}
                className="mt-3 flex items-center gap-1.5 font-manrope text-sm font-semibold text-[#2F68E5] transition-colors hover:text-[#255ad2]"
              >
                {foldersExpanded ? "View less" : "View more"}
                <ChevronDown
                  className={cn("size-4 transition-transform", foldersExpanded && "rotate-180")}
                  strokeWidth={2}
                />
              </button>
            )}
          </div>

          <h3 className="mb-4 font-manrope text-sm font-bold text-[#17173A]">
            Unorganized templates
          </h3>

          {shown.length === 0 ? (
            <p className="py-16 text-center font-manrope text-sm text-[#6F6F8D]">
              No template matches “{query}”.
            </p>
          ) : (
            <div className="grid grid-cols-5 gap-4">
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
                  {PER_PAGE_OPTIONS.map((n) => {
                    const enabled = PER_PAGE_ENABLED.includes(n);
                    return (
                      <button
                        key={n}
                        type="button"
                        disabled={!enabled}
                        onClick={() => {
                          if (!enabled) return;
                          setPerPage(n);
                          setPage(1);
                          setPerPageOpen(false);
                        }}
                        className={cn(
                          "block w-full px-3 py-2 text-left font-manrope text-sm transition-colors",
                          !enabled
                            ? "cursor-not-allowed text-[#B9BAC7]"
                            : n === perPage
                              ? "bg-[#F4F8FF] font-semibold text-[#2F68E5]"
                              : "text-[#17173A] hover:bg-[#F7F9FC]"
                        )}
                      >
                        {n} per page
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <Pager page={current} pageCount={pageCount} onPage={setPage} />
          </div>
        </>
      )}
        </>
      )}

      {values.variants.length > 1 && (
        <>
          <div className="my-8 h-px bg-[#E8ECF4]" />
          <h3 className="mb-5 font-manrope text-base font-bold text-[#17173A]">Test settings</h3>

          <div>
            <p className="font-manrope text-sm font-semibold text-[#17173A]">User distribution</p>
            <p className="mt-0.5 font-manrope text-xs text-[#6F6F8D]">
              Set the percentage of users for each variant.
            </p>

            <div className="mt-4 flex flex-col items-start gap-3">
              <div className="flex flex-wrap items-center gap-3">
                {values.variants.map((v) => {
                  const color = VARIANT_COLORS[v] ?? VARIANT_COLORS.A;
                  return (
                    <label
                      key={v}
                      className="flex h-11 cursor-text items-center gap-2 rounded-full border border-[#DDE2EE] bg-white py-1 pl-1 pr-4 transition-colors focus-within:border-[#2F68E5]"
                    >
                      <span
                        className="grid size-8 shrink-0 place-items-center rounded-full font-manrope text-xs font-bold"
                        style={{ background: color.bg, color: color.text }}
                      >
                        {v}
                      </span>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        aria-label={`Percentage for variant ${v}`}
                        value={values.variantSplit[v] ?? 0}
                        onChange={(e) => setVariantShare(v, Number(e.target.value))}
                        className="cc-plain-number w-9 bg-transparent text-right font-manrope text-sm font-bold text-[#17173A] outline-none"
                      />
                      <span className="font-manrope text-sm text-[#8A8AA3]">%</span>
                    </label>
                  );
                })}

                {values.decideWinner && (
                  <label className="flex h-11 cursor-text items-center gap-2 rounded-full border border-[#DDE2EE] bg-white py-1 pl-1 pr-4 transition-colors focus-within:border-[#2F68E5]">
                    <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[#F5C542]">
                      <Trophy className="size-4 text-[#8A6100]" strokeWidth={2} />
                    </span>
                    <span className="font-manrope text-sm font-bold text-[#17173A]">Winner</span>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      aria-label="Percentage for the winning variant"
                      value={winnerShare}
                      onChange={(e) => setWinnerShare(Number(e.target.value))}
                      className="cc-plain-number w-9 bg-transparent text-right font-manrope text-sm font-bold text-[#17173A] outline-none"
                    />
                    <span className="font-manrope text-sm text-[#8A8AA3]">%</span>
                  </label>
                )}
              </div>

              <button
                type="button"
                onClick={splitEvenly}
                className="font-manrope text-sm font-bold text-[#2F68E5] transition-colors hover:text-[#2455C0]"
              >
                Split evenly
              </button>
            </div>
          </div>

          <div className="mt-6 flex items-center gap-2">
            <MiniSwitch checked={values.decideWinner} onCheckedChange={toggleDecideWinner} />
            <p className="font-manrope text-sm font-semibold text-[#17173A]">
              Decide a winner variant
            </p>
          </div>

          {values.decideWinner && (
            <div className="mt-3 flex flex-wrap items-center gap-2 font-manrope text-sm text-[#17173A]">
              <span>Decide winner on basis of</span>
              <div className="w-[130px]">
                <Dropdown
                  value={values.winningMetric}
                  options={["Open", "Clicks", "Conversion"]}
                  onChange={(v) => onChange({ winningMetric: v as ContentValues["winningMetric"] })}
                />
              </div>
              <span>after</span>
              <div className="w-[90px]">
                <Dropdown
                  value={values.testDurationValue}
                  options={durationOptionsFor(values.testDurationUnit)}
                  onChange={(v) => onChange({ testDurationValue: v })}
                />
              </div>
              <div className="w-[100px]">
                <Dropdown
                  value={values.testDurationUnit}
                  options={[...DURATION_UNITS]}
                  onChange={(v) => {
                    const unit = v as ContentValues["testDurationUnit"];
                    const options = durationOptionsFor(unit);
                    onChange({
                      testDurationUnit: unit,
                      testDurationValue: options.includes(values.testDurationValue)
                        ? values.testDurationValue
                        : options[0],
                    });
                  }}
                />
              </div>
              <span>.</span>
            </div>
          )}
        </>
      )}
    </StepCard>
  );
}
