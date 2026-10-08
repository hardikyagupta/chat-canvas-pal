import { createContext, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import illustrationImg from "./assets/empty-illustration.png";
import svgPaths from "./assets/svg-paths";
import {
  categories,
  subs,
  groups,
  products,
  catById,
  CATALOG,
  type Level,
} from "./catalog";
import {
  CheckIcon,
  ChevronDown,
  CloseIcon,
  DashIcon,
  EmptyIllustration,
  FilterIcon,
  InfoIcon,
  AiStarIconDS,
  CaretDownDS,
  CloseIconDS,
  DashIconDS,
  DeleteIconDS,
  EmptyIllustrationDS,
  FilterIconDS,
  InfoIconDS,
  SearchIcon,
  SearchIconDS,
  PlusIconDS,
  AnnounceIconDS,
  NotificationImportantIconDS,
  NoReminderIconDS,
  ExternalLinkIcon,
  WarningCircleIconDS,
  SandIconDS,
  EditIconDS,
  TickIconDS,
  SparkIcon,
  TrashIcon,
} from "./icons";
import VariantLocationsSheet from "../VariantLocationsSheet";
import { locationsFor, startingPrice, variantLocationsFor } from "../productLocations";

/* ─── Design-system scope ──────────────────────────────────────────────────────
   Opt-in flag for Netcore / Infinity DS 3.0 styling inside shared components.
   Defaults to false, so every surface that does not provide it renders exactly
   as before. Enabled by the DS 3.0 screens and overlays via
   DSScope.Provider.
────────────────────────────────────────────────────────────────────────────── */

export const DSScope = createContext(false);
const useDS = () => useContext(DSScope);

/* ─── Level badge metadata ─────────────────────────────────────────────────── */

const LEVEL_META: Record<
  Exclude<Level, "catalog">,
  { label: string; color: string; bg: string }
> = {
  category: { label: "Category", color: "#059669", bg: "#ecfdf5" },
  sub: { label: "Sub-category", color: "#d97706", bg: "#fffbeb" },
  group: { label: "Group", color: "#7c3aed", bg: "#f5f3ff" },
  product: { label: "Product", color: "#2f4be5", bg: "#eff2fd" },
};

/* DS 3.0 badge variants (§6.3). The DS ships no confirmed purple Color Tag, so
   Group maps to the authoritative Neutral treatment rather than an invented hue. */
const LEVEL_META_DS: Record<
  Exclude<Level, "catalog">,
  { label: string; color: string; bg: string }
> = {
  category: { label: "Category", color: "#00C48C", bg: "#ECFDF3" },
  sub: { label: "Sub-category", color: "#E7B231", bg: "#FFF8E7" },
  group: { label: "Group", color: "#383845", bg: "#EBEBF5" },
  product: { label: "Product", color: "#0251BA", bg: "#EDF1FF" },
};

/* ─── Helpers ───────────────────────────────────────────────────────────────── */

const subsOf = (catId: string) => subs.filter((s) => s.catId === catId);
const groupsOf = (subId: string) => groups.filter((g) => g.subId === subId);
const catGroupsOf = (catId: string) => groups.filter((g) => g.catId === catId);
const prodsOfCat = (catId: string) => products.filter((p) => p.catId === catId);
const prodsOfSub = (subId: string) => products.filter((p) => p.subId === subId);
const prodsOfGroup = (groupId: string) => products.filter((p) => p.groupId === groupId);

function num(n: number) {
  return n.toLocaleString("en-US");
}

/* ─── Checkbox ──────────────────────────────────────────────────────────────── */

function Checkbox({
  checked,
  indeterminate,
  disabled,
  onChange,
  title,
}: {
  checked: boolean;
  indeterminate?: boolean;
  disabled?: boolean;
  onChange?: () => void;
  title?: string;
}) {
  const ds = useDS();
  const active = checked || indeterminate;
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={indeterminate ? "mixed" : checked}
      disabled={disabled}
      title={title}
      onClick={(e) => {
        e.stopPropagation();
        if (!disabled) onChange?.();
      }}
      className={
        ds
          ? [
              // DS §6.9 checkbox: 16px, 1.5px border/default, radius 4px
              "grid size-4 shrink-0 place-items-center rounded-sm border-[1.5px] transition-colors duration-150 ease-out",
              "focus-visible:outline-none focus-visible:shadow-[0_0_0_4px_rgba(47,104,229,0.15)]",
              active
                ? "border-[#2F68E5] bg-[#2F68E5] text-white"
                : "border-[#D9D9E8] bg-white hover:border-[#9898B0]",
              disabled
                ? "cursor-not-allowed border-[#D4D4D4] bg-[#FAFAFA]"
                : "cursor-pointer",
            ].join(" ")
          : [
              "grid size-[15px] shrink-0 place-items-center rounded-[3px] border transition-all",
              active
                ? "border-[#2F68E5] bg-[#2F68E5] text-white shadow-[0_0_0_3px_rgba(47,75,229,0.1)]"
                : "border-[#d1d5e8] bg-white hover:border-[#2F68E5]",
              disabled ? "cursor-not-allowed opacity-40" : "cursor-pointer",
            ].join(" ")
      }
    >
      {indeterminate ? (
        ds ? <DashIconDS className="size-3" /> : <DashIcon className="size-2" />
      ) : checked ? (
        ds ? <TickIconDS className="size-3.5" /> : <CheckIcon className="size-[8px]" />
      ) : null}
    </button>
  );
}

/* ─── Level badge ───────────────────────────────────────────────────────────── */

function LevelTag({ level }: { level: Exclude<Level, "catalog"> }) {
  const ds = useDS();
  const m = (ds ? LEVEL_META_DS : LEVEL_META)[level];
  return (
    <span
      className={
        ds
          ? // DS §6.3 status badge: 10px/700 uppercase, ls 0.6px, radius 2px
            "inline-flex items-center rounded-[2px] border px-2 py-[3px] text-[10px] font-bold uppercase leading-[14px] tracking-[0.6px]"
          : "inline-flex items-center rounded px-1.5 py-[1px] text-[10px] font-semibold uppercase tracking-[0.4px]"
      }
      style={
        ds
          ? { color: m.color, backgroundColor: m.bg, borderColor: m.color }
          : { color: m.color, backgroundColor: m.bg }
      }
    >
      {m.label}
    </span>
  );
}

/* ─── Shared field skins (Infinity DS 3.0) ─────────────────────────────────────
   One source for the search field so every migrated screen renders the same
   control. DS §6.1: white, 1px border/default, radius 4px, 13/21, hover
   border/hover + bg/subtle-blue, focus 1.5px border/focus + ring/brand.
────────────────────────────────────────────────────────────────────────────── */

const DS_SEARCH_INPUT =
  "h-8 w-full rounded-sm border border-[#D9D9E8] bg-white pl-9 pr-9 text-[13px] font-medium leading-[21px] tracking-[-0.01em] text-[#17173A] outline-none transition-[border-color,background-color,box-shadow] duration-150 ease-out placeholder:text-[#9494AE] placeholder:transition-colors placeholder:duration-150 placeholder:ease-out hover:border-[#9898B0] hover:bg-[#F6F8FF] hover:shadow-[0_1px_2px_rgba(23,23,58,0.08)] focus:border-[1.5px] focus:border-[#2F68E5] focus:bg-white focus:shadow-[0_0_0_4px_rgba(47,104,229,0.15)] focus:placeholder:text-[#BBBBC8]";

const DS_SEARCH_CLEAR =
  "absolute right-2.5 top-1/2 grid size-5 -translate-y-1/2 place-items-center rounded-full text-[#9494AE] transition-colors hover:bg-[#EBEBF5] hover:text-[#17173A]";

/* ─── Dropdown ──────────────────────────────────────────────────────────────── */

export function Dropdown({
  label,
  value,
  options,
  onChange,
  minWidth = 160,
  disabled = false,
  fullWidth = false,
  overlay = false,
  searchable = false,
  searchPlaceholder = "Search",
  placeholder = "",
  bare = false,
}: {
  label?: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
  minWidth?: number;
  disabled?: boolean;
  /** Stretch the field to its container so stacked fields align. */
  fullWidth?: boolean;
  /** Render the menu as a portalled popover anchored to the field, so no
      ancestor's overflow can clip it. Opt-in — without it the menu stays an
      absolutely-positioned child exactly as before. */
  overlay?: boolean;
  /** Infinity DS "Search Dropdown": search header above a filterable list. */
  searchable?: boolean;
  searchPlaceholder?: string;
  /** Shown in the field when no option is selected yet. */
  placeholder?: string;
  /** DS only: render the trigger as a plain filter control (no field box) —
      label, value and caret on a white ground, bordered only while open. */
  bare?: boolean;
}) {
  const ds = useDS();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [menuBox, setMenuBox] = useState<React.CSSProperties | null>(null);
  const lastBoxRef = useRef("");
  const selectedOption = options.find((o) => o.value === value);
  const current = selectedOption?.label ?? value;
  const showingPlaceholder = !selectedOption && !value && placeholder !== "";
  const bounded = overlay;

  const q = query.trim().toLowerCase();
  const shown = searchable && q ? options.filter((o) => o.label.toLowerCase().includes(q)) : options;

  // Search is per-opening, not sticky.
  useEffect(() => {
    if (!open) {
      setQuery("");
      lastBoxRef.current = "";
    }
  }, [open]);

  useLayoutEffect(() => {
    if (!open || !overlay) return;
    const place = () => {
      const el = triggerRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const GAP = 4; // offset between field and menu
      const EDGE = 8; // stay clear of the viewport edge
      const MIN = 120; // ~3 rows — below this the menu is not worth opening down
      const MAX = 218; // ~5 plain rows, or search header + ~4 rows
      const vh = window.innerHeight;
      const vw = window.innerWidth;
      const below = vh - r.bottom - GAP - EDGE;
      const above = r.top - GAP - EDGE;
      // Always open downward unless the viewport genuinely cannot host it.
      const up = below < MIN && above > below;
      const width = Math.max(minWidth, r.width);
      const maxHeight = Math.max(MIN, Math.min(MAX, vh - 2 * EDGE, up ? above : below));
      const next: React.CSSProperties = {
        position: "fixed",
        left: Math.max(EDGE, Math.min(r.left, vw - width - EDGE)),
        ...(up
          ? { bottom: Math.max(EDGE, vh - r.top + GAP) }
          : { top: Math.min(Math.max(EDGE, r.bottom + GAP), vh - EDGE - maxHeight) }),
        maxHeight,
        minWidth: width,
      };
      // Only commit real changes: the capture-phase scroll listener also fires
      // for the menu's own list, and setting a fresh object each time would
      // loop (scroll -> setState -> layout -> scroll).
      const key = JSON.stringify(next);
      if (key === lastBoxRef.current) return;
      lastBoxRef.current = key;
      setMenuBox(next);
    };
    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open, overlay, minWidth, ds, shown.length, searchable]);

  return (
    <div className={fullWidth ? "relative w-full" : "relative"}>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className={
          ds && bare
            ? [
                // Filter-strip control: same type as the field, no box.
                "flex h-8 items-center gap-1.5 rounded-sm px-2.5 text-[13px] leading-[21px] tracking-[-0.01em] transition-[background-color,box-shadow] duration-150 ease-out focus-visible:outline-none",
                fullWidth ? "w-full justify-between" : "",
                disabled
                  ? "cursor-not-allowed bg-transparent"
                  : open
                    ? "bg-[#EDF1FF] shadow-[0_0_0_4px_rgba(47,104,229,0.15)]"
                    : "bg-white hover:bg-[#F6F8FF]",
              ].join(" ")
            : ds
            ? [
                // DS §6.1 field: white, 1px border/default, radius 4px, 13/21
                "flex h-8 items-center gap-1.5 rounded-sm border px-3 text-[13px] leading-[21px] tracking-[-0.01em] transition-[border-color,background-color,box-shadow] duration-150 ease-out",
                fullWidth ? "w-full justify-between" : "",
                disabled
                  ? // DS §2.3 disabled: bg/disabled-subtle + txt/disabled
                    "cursor-not-allowed border-[#D9D9E8] bg-[#F5F5F5]"
                  : open
                    ? "border-[1.5px] border-[#2F68E5] bg-white shadow-[0_0_0_4px_rgba(47,104,229,0.15)]"
                    : "border-[#D9D9E8] bg-white hover:border-[#9898B0] hover:bg-[#F6F8FF]",
              ].join(" ")
            : [
                "flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-[12.5px] transition-all",
                fullWidth ? "w-full justify-between" : "",
                open
                  ? "border-[#2F68E5] bg-white text-[#17173A] shadow-[0_0_0_3px_rgba(47,75,229,0.1)]"
                  : "border-[#DDE2EE] bg-white text-[#17173A] hover:border-[#c5cce8]",
              ].join(" ")
        }
      >
        {label && (
          <span className={ds && disabled ? "font-medium text-[#A0A0A0]" : ds ? "font-medium text-[#6F6F8D]" : "text-[#6F6F8D]"}>{label}</span>
        )}
        <span
          className={
            showingPlaceholder
              ? "font-medium text-[#6F6F8D]"
              : ds && disabled ? "font-semibold text-[#A0A0A0]" : ds ? "font-semibold text-[#17173A]" : "font-semibold"
          }
        >
          {showingPlaceholder ? placeholder : current}
        </span>
        {ds ? (
          <CaretDownDS
            className={`size-3 transition-transform ${disabled ? "text-[#A0A0A0]" : bare && open ? "text-[#2F68E5]" : "text-[#6F6F8D]"} ${open ? "rotate-180" : ""}`}
          />
        ) : (
          <ChevronDown className={`size-3 text-[#6F6F8D] transition-transform ${open ? "rotate-180" : ""}`} />
        )}
      </button>
      {open && ((m) => (overlay ? createPortal(m, document.body) : m))(
        <>
          <button
            type="button"
            aria-hidden
            className={overlay ? "fixed inset-0 z-[110] cursor-default" : "fixed inset-0 z-20 cursor-default"}
            onClick={() => setOpen(false)}
          />
          {/* Infinity DS Search Dropdown (Figma oDRsl3d51yyJW7u3rOPn2F 683:3886):
              white panel, 1px #DDE2EE, radius 4, 4px block padding, light drop
              shadow; 42px rows; selected = #F4F8FF fill + 3px #2F68E5 left bar. */}
          <div
            className={[
              "flex flex-col overflow-hidden",
              bounded ? "z-[111]" : "absolute left-0 top-[calc(100%+4px)] z-30 max-h-64",
              ds
                ? "rounded-sm border border-[#DDE2EE] bg-white py-1 shadow-[0_5px_12px_rgba(23,23,58,0.07)]"
                : "rounded-lg border border-[#DDE2EE] bg-white py-1 shadow-[0_8px_24px_rgba(47,75,229,0.12)]",
            ].join(" ")}
            style={bounded ? (menuBox ?? { visibility: "hidden" }) : { minWidth }}
          >
            {searchable && (
              <div className="shrink-0">
                <div className="flex h-[42px] items-center gap-3 px-3">
                  <input
                    autoFocus
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={searchPlaceholder}
                    className="min-w-0 flex-1 bg-transparent text-[14px] font-normal leading-[1.5] tracking-[0.29px] text-[#17173A] outline-none placeholder:text-[#6F6F8D]"
                  />
                  <SearchIconDS className="size-[18px] shrink-0 text-[#6F6F8D]" />
                </div>
                <div className={ds ? "h-px bg-[#DDE2EE]" : "h-px bg-[#DDE2EE]"} />
              </div>
            )}
            <div className="nc-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain">
              {shown.length === 0 ? (
                <div
                  className={
                    ds
                      ? "flex h-[42px] items-center px-3 text-[14px] font-medium leading-[1.5] text-[#9494AE]"
                      : "flex h-9 items-center px-3 text-[12.5px] text-[#9494AE]"
                  }
                >
                  No results found
                </div>
              ) : (
                shown.map((o) => (
                  <button
                    key={o.value}
                    type="button"
                    onClick={() => {
                      onChange(o.value);
                      setOpen(false);
                    }}
                    className={
                      ds
                        ? [
                            "relative flex h-[42px] w-full items-center gap-4 pr-3 text-left text-[14px] font-medium leading-[1.5] tracking-[-0.01em] text-[#17173A] transition-colors",
                            // selected row is inset by the 3px indicator bar
                            o.value === value ? "bg-[#F4F8FF] pl-[15px]" : "pl-3 hover:bg-[#F6F8FF]",
                          ].join(" ")
                        : [
                            "flex w-full items-center justify-between gap-4 px-3 py-[7px] text-left text-[12.5px] transition-colors hover:bg-[#F4F8FF]",
                            o.value === value
                              ? "font-semibold text-[#2F68E5] bg-[#EDF1FF]"
                              : "text-[#17173A]",
                          ].join(" ")
                    }
                  >
                    {ds && o.value === value && (
                      <span aria-hidden className="absolute left-0 top-0 h-full w-[3px] rounded-full bg-[#2F68E5]" />
                    )}
                    <span className="truncate">{o.label}</span>
                    {!ds && o.value === value && <CheckIcon className="size-3 text-[#2F68E5]" />}
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/* ─── Main ──────────────────────────────────────────────────────────────────── */

type ViewBy = "category" | "sub" | "group" | "product";
type PreviewView = "products" | "subs" | "groups" | "categories";

/* ─── Value-prop icons (from MacBookPro278 import) ─────────────────────────── */

function EngageIcon() {
  return (
    <div className="relative shrink-0 size-[52px]">
      <svg className="absolute block inset-0 size-full" fill="none" viewBox="0 0 52 52">
        <g clipPath="url(#ei-clip)">
          <path d={svgPaths.pd18ca00} fill="#FFF0EA" />
          <path d={svgPaths.p101d3f00} stroke="#D95A2B" strokeWidth="1.857" />
          <path d={svgPaths.pa085900} stroke="#D95A2B" strokeWidth="1.857" />
          <path d={svgPaths.p3aa52380} fill="#D95A2B" />
          <path d={svgPaths.p206e5d00} fill="#D95A2B" />
          <path d={svgPaths.pfd86100} fill="#FFF0EA" />
        </g>
        <defs><clipPath id="ei-clip"><rect width="52" height="52" fill="white" /></clipPath></defs>
      </svg>
    </div>
  );
}

function GrowthIcon() {
  return (
    <div className="relative shrink-0 size-[52px]">
      <svg className="absolute block inset-0 size-full" fill="none" viewBox="0 0 52 52">
        <g clipPath="url(#gi-clip)">
          <path d={svgPaths.pd18ca00} fill="#E8F7EE" />
          <path d={svgPaths.p109bc000} fill="#2E9E5B" opacity="0.45" />
          <path d={svgPaths.pa13db00} fill="#2E9E5B" opacity="0.7" />
          <path d={svgPaths.p1259e580} fill="#2E9E5B" />
          <path d={svgPaths.pe4aa270} stroke="#2E9E5B" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.857" />
          <path d="M32.5 13V18.5714" stroke="#2E9E5B" strokeLinecap="round" strokeWidth="1.857" />
          <path d={svgPaths.p14240f40} opacity="0.55" stroke="#2E9E5B" strokeLinecap="round" strokeWidth="1.671" />
          <path d={svgPaths.p1e8bbc80} opacity="0.55" stroke="#2E9E5B" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.671" />
        </g>
        <defs><clipPath id="gi-clip"><rect width="52" height="52" fill="white" /></clipPath></defs>
      </svg>
    </div>
  );
}

function PersonalisedIcon() {
  return (
    <div className="relative shrink-0 size-[52px]">
      <svg className="absolute block inset-0 size-full" fill="none" viewBox="0 0 52 52">
        <g clipPath="url(#pi-clip)">
          <path d={svgPaths.pd18ca00} fill="#F0EDFB" />
          <path d={svgPaths.p3dd0ef00} opacity="0.5" stroke="#7B5EA7" strokeWidth="1.671" />
          <path d={svgPaths.p25d84bc0} opacity="0.5" stroke="#7B5EA7" strokeLinecap="round" strokeWidth="1.671" />
          <path d={svgPaths.p13d44e80} opacity="0.5" stroke="#7B5EA7" strokeWidth="1.671" />
          <path d={svgPaths.p23a176c0} opacity="0.5" stroke="#7B5EA7" strokeLinecap="round" strokeWidth="1.671" />
          <path d={svgPaths.p319bd600} stroke="#7B5EA7" strokeWidth="1.857" />
          <path d={svgPaths.p1aa08000} stroke="#7B5EA7" strokeLinecap="round" strokeWidth="1.857" />
          <path d={svgPaths.p227f5080} fill="#F0EDFB" stroke="#7B5EA7" strokeWidth="1.393" />
          <path d="M32.5 12.5357V17.1786" stroke="#7B5EA7" strokeLinecap="round" strokeWidth="1.114" />
          <path d="M30.1786 14.8571H34.8214" stroke="#7B5EA7" strokeLinecap="round" strokeWidth="1.114" />
          <path d={svgPaths.p38417600} stroke="#7B5EA7" strokeLinecap="round" strokeWidth="1.114" />
          <path d={svgPaths.p3da90930} stroke="#7B5EA7" strokeLinecap="round" strokeWidth="1.114" />
        </g>
        <defs><clipPath id="pi-clip"><rect width="52" height="52" fill="white" /></clipPath></defs>
      </svg>
    </div>
  );
}

/* ─── Replenishment empty state ─────────────────────────────────────────────── */

/* Which state-dependent banner the empty screen shows between the value props
   and the setup CTA. "none" is the untouched first-run screen. */
type EmptyStateBanner = "none" | "context-mapping" | "in-progress";

function ReplenishmentEmptyState({
  onCtaClick,
  banner = "none",
  onConnectPurchaseData,
  showHeading = true,
  ctaLabel = "Enable replenishment",
  ctaExternal = false,
}: {
  onCtaClick: () => void;
  banner?: EmptyStateBanner;
  onConnectPurchaseData?: () => void;
  /* The catalog-specific state sits under the page's own header, so it drops
     the heading pair and closes the gap they leave. */
  showHeading?: boolean;
  /* The Journey's Replenishment event panel reuses this screen with its own
     setup wording; the listing page keeps the default. */
  ctaLabel?: string;
  /* Trailing redirect glyph on the CTA, for when setup happens elsewhere. */
  ctaExternal?: boolean;
}) {
  return (
    <div className="flex flex-col items-center py-10 px-0">
      {/* Illustration */}
      <div className="mb-6 h-[220px] w-[413px] max-w-full">
        <img src={illustrationImg} alt="Replenishment illustration" className="h-full w-full object-contain" />
      </div>

      {/* Heading + description */}
      {showHeading && (
      <div className="mb-6 text-center">
        <h2 className="text-[20px] font-bold text-[#17173a] tracking-[0.42px]">Bring customers back when they're ready to replenish</h2>
        <p className="mt-1 max-w-[636px] text-[14px] leading-[20px] text-[#6f6f8d] tracking-[0.42px]">
          Select the products you want to replenish. AI predicts when customers are likely to need them again, so you can send timely reminders that drive repeat purchases.
        </p>
      </div>
      )}

      {/* State-dependent banner — sits above the value props */}
      {banner === "context-mapping" && (
        <div className="mb-5 flex w-full max-w-[1280px] flex-wrap items-center justify-center gap-x-2 gap-y-1 rounded-lg bg-[#fdf5e3] px-6 py-4 text-center">
          <p className="text-[14px] leading-[20px] tracking-[0.42px] text-[#17173a]">
            Your catalog is ready. Connect your purchase data to complete context mapping and start using Replenishment.
          </p>
          <button
            type="button"
            onClick={onConnectPurchaseData}
            className="flex items-center gap-1.5 text-[14px] font-semibold text-[#0c6aed] tracking-[0.42px] hover:underline"
          >
            Connect purchase data
            <svg viewBox="0 0 16 16" fill="none" className="size-4 shrink-0">
              <path d="M9.5 2.5H13.5V6.5" stroke="#0c6aed" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M13.5 2.5L7.5 8.5" stroke="#0c6aed" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M12.5 9.5V13H3V3.5H6.5" stroke="#0c6aed" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      )}
      {banner === "in-progress" && (
        <div className="mb-5 flex w-full max-w-[1280px] items-center justify-center rounded-lg bg-[#e7f4ea] px-6 py-4 text-center">
          <p className="text-[14px] leading-[20px] tracking-[0.42px] text-[#17173a]">
            <span className="font-bold">Setting up replenishment.</span>
            {"  "}
            We&rsquo;re analyzing your purchase data to recommend a replenishment cycle for each product. This takes{" "}
            <span className="font-bold">6&ndash;8 hours</span>. We&rsquo;ll email you when it&rsquo;s ready
          </p>
        </div>
      )}

      {/* Value prop cards */}
      <div className="mb-8 flex w-full max-w-[1280px] gap-6 bg-[#f4f8ff] px-8 py-5 rounded-lg">
        <div className="flex flex-1 items-start gap-3">
          <EngageIcon />
          <div>
            <p className="text-[14px] font-semibold text-[#17173a] leading-[22px] tracking-[0.42px]">Reach customers at the right time</p>
            <p className="text-[14px] font-medium text-[#6f6f8d] leading-[20px] tracking-[0.42px]">Remind customers when a product is likely to run out or need replenishing.</p>
          </div>
        </div>
        <div className="flex flex-1 items-start gap-3">
          <GrowthIcon />
          <div>
            <p className="text-[14px] font-semibold text-[#17173a] leading-[22px] tracking-[0.42px]">Drive repeat purchases</p>
            <p className="text-[14px] font-medium text-[#6f6f8d] leading-[20px] tracking-[0.42px]">Turn timely replenishment reminders into opportunities to bring customers back.</p>
          </div>
        </div>
        <div className="flex flex-1 items-start gap-3">
          <PersonalisedIcon />
          <div>
            <p className="text-[14px] font-semibold text-[#17173a] leading-[22px] tracking-[0.42px]">Personalise every reminder</p>
            <p className="text-[14px] font-medium text-[#6f6f8d] leading-[20px] tracking-[0.42px]">Use product and customer behaviour to send more relevant replenishment journeys.</p>
          </div>
        </div>
      </div>

      {/* Secondary link + primary CTA */}
      <div className="flex flex-col items-center gap-4">
        <a href="#" className="flex items-center gap-1.5 text-[14px] font-semibold text-[#0c6aed] underline tracking-[0.333px]">
          <svg viewBox="0 0 20 20" fill="none" className="size-4 shrink-0">
            <circle cx="10" cy="8" r="4" stroke="#0c6aed" strokeWidth="1.5" />
            <path d="M3 17c0-3 3-5 7-5s7 2 7 5" stroke="#0c6aed" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          See how replenishment works
        </a>
        {/* Once the setup request is in, the CTA is gone — the same action
            cannot be fired twice. */}
        {banner !== "in-progress" && (
          <button
            type="button"
            onClick={onCtaClick}
            className="flex items-center gap-2 rounded-[4px] bg-[#0c6aed] px-[18px] py-[8px] text-[14px] font-semibold uppercase text-white tracking-[0.42px] hover:bg-[#0a5fd4] transition-colors"
          >
            {ctaLabel}
            {ctaExternal && <ExternalLinkIcon className="size-4 shrink-0" />}
          </button>
        )}
      </div>
    </div>
  );
}

/* ─── Error toast ───────────────────────────────────────────────────────────── */

const CATALOG_TOAST = "A product catalog is required to start Replenishment. Set one up to continue.";
const CONTEXT_MAPPING_TOAST =
  "Context mapping is not set up for your catalog. Connect your purchase data to continue.";
const SETUP_REQUESTED_TOAST =
  "Your request to set up Replenishment for 2 catalogs was successfully created.";

function CatalogErrorToast({
  visible,
  message = CATALOG_TOAST,
  zClass = "z-[60]",
}: {
  visible: boolean;
  message?: string;
  /* Stacking override for callers that sit above the page (the drawers). */
  zClass?: string;
}) {
  return (
    <div
      className={[
        `fixed bottom-7 left-1/2 ${zClass} -translate-x-1/2 transition-all duration-300`,
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none",
      ].join(" ")}
    >
      <div className="flex items-center gap-2.5 rounded-[4px] bg-[#f05c5c] px-4 py-3.5">
        {/* Warning triangle */}
        <svg viewBox="0 0 18 16" fill="none" className="size-[18px] shrink-0">
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d={svgPaths.p245fd900 ?? "M9 1L1 15h16L9 1zm0 3l6 10H3L9 4zm-.75 3.75h1.5v3h-1.5v-3zm0 4h1.5v1.5h-1.5v-1.5z"}
            fill="white"
          />
        </svg>
        <p className="text-[14px] font-bold text-white leading-[20px] tracking-[0.42px] whitespace-nowrap">
          {message}
        </p>
      </div>
    </div>
  );
}

/* ─── Netcore app shell + Products/Replenishment page ───────────────────────── */

type Confidence = "high" | "med" | "low";
type EffSource = "ai" | "manual" | "fallback" | "none" | "global";

/* A configuration saved at one level of the hierarchy — category, product group
   or product. The union records what the user chose, never a copy of a value
   owned by a level above: "global" means "follow the global setting", so a later
   change to global settings still reaches everything inheriting it. */
type LevelOverride = {
  repl?:
    | { mode: "custom"; days: number }  // a value set at this level
    | { mode: "global" }                // pinned to the global fallback
    | { mode: "category" };             // pinned to the category, skipping AI
  /* Absent = inherit from the level above. */
  buffer?:
    | { mode: "custom"; days: number }
    | { mode: "off" };                  // no reminder buffer at all
};

const CONF_META: Record<Confidence, { label: string; color: string }> = {
  high: { label: "High confidence", color: "#12b76a" },
  med: { label: "Med confidence", color: "#d97706" },
  low: { label: "Low confidence", color: "#ef4444" },
};

/* DS §2.2 semantic text colours for the same confidence caption. Additive —
   the original CONF_META still backs the un-migrated config panels. */
const CONF_META_DS: Record<Confidence, { label: string; color: string }> = {
  high: { label: "High confidence", color: "#00C48C" }, // txt/success
  med: { label: "Med confidence", color: "#E7B231" },   // txt/warning
  low: { label: "Low confidence", color: "#F05C5C" },   // txt/error
};

/* Source glyph for the Effective row in the config panels */
function AiSourceGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" className={className} aria-hidden="true">
      <rect x="6" y="1.5" width="4" height="3" rx="0.6" stroke="currentColor" strokeWidth="1.2" />
      <rect x="1.5" y="11.5" width="4" height="3" rx="0.6" stroke="currentColor" strokeWidth="1.2" />
      <rect x="10.5" y="11.5" width="4" height="3" rx="0.6" stroke="currentColor" strokeWidth="1.2" />
      <path d="M8 4.5v3M3.5 11.5V9h9v2.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
export const dairyImg = products.find((p) => p.catName === "Dairy")?.image ?? "";
/* Listing rows carry only a display name; look the catalog thumbnail up by it. */
const catImageByName = (name: string) =>
  categories.find((c) => c.name.toLowerCase() === name.toLowerCase())?.image ?? "";

type CatListingRow = {
  name: string;
  products: number;
  usingRule: number;
  /* Category-level AI recommendation (null = none for this category yet). */
  ai: number | null;
  conf: Confidence;
};

/* Day-1 post-setup state: AI recommendations only. Nothing is overridden by
   hand — manual values live in the override maps the panels write to. A few
   categories have no AI suggestion yet (ai: null) and fall through to global. */
const CAT_LISTING: CatListingRow[] = [
  { name: "Dairy", products: 58, usingRule: 23, ai: 13, conf: "high" },
  { name: "Bakery", products: 39, usingRule: 19, ai: 14, conf: "med" },
  { name: "Beverages", products: 12, usingRule: 5, ai: null, conf: "high" },
  { name: "Personal care", products: 85, usingRule: 24, ai: 14, conf: "low" },
  { name: "Frozen foods", products: 198, usingRule: 89, ai: 9, conf: "high" },
  { name: "Snacks", products: 44, usingRule: 12, ai: null, conf: "med" },
  { name: "Staples & grocery", products: 132, usingRule: 40, ai: 21, conf: "high" },
  { name: "Home care", products: 76, usingRule: 18, ai: null, conf: "med" },
  { name: "Fruits & vegetables", products: 63, usingRule: 20, ai: 5, conf: "low" },
  { name: "Baby care", products: 51, usingRule: 14, ai: 12, conf: "high" },
];

export type ProdListingRow = {
  name: string;
  id: string;
  group: string;
  category: string;
  /* The product's own AI recommendation. null where the model has no signal for
     it yet — the row then inherits from the levels above. Category-level values
     are NOT copied here; they are resolved from CAT_LISTING on read. */
  aiProd: number | null;
  aiProdConf: Confidence;
};

/* Day-1 catalogue state. AI recommendations only: nothing has been configured
   by hand yet, so there are no manual overrides at any level. Everything a row
   displays beyond these two fields is resolved, not stored. */
export const PROD_LISTING: ProdListingRow[] = [
  { name: "Amul milk 500ml",          id: "1234567", group: "Amul milk",     category: "Dairy",             aiProd: 3,    aiProdConf: "high" },
  { name: "Amul butter 250gm",        id: "1234568", group: "Amul butter",   category: "Dairy",             aiProd: 4,    aiProdConf: "med"  },
  { name: "Amul ghee 500ml",          id: "1245987", group: "Amul ghee",     category: "Dairy",             aiProd: 4,    aiProdConf: "high" },
  { name: "Amul milk 1L",             id: "1234271", group: "Amul milk",     category: "Dairy",             aiProd: 2,    aiProdConf: "med"  },
  { name: "Tata Salt 1kg",            id: "2341100", group: "Salt",          category: "Staples & grocery", aiProd: null, aiProdConf: "low"  },
  { name: "Fortune Sunflower Oil 1L", id: "2341102", group: "Edible oils",   category: "Staples & grocery", aiProd: null, aiProdConf: "low"  },
  { name: "Dettol Handwash 200ml",    id: "3390012", group: "Hand wash",     category: "Home care",         aiProd: null, aiProdConf: "low"  },
];

/* Catalogue attributes behind each listed product — what the product details
   page ("View product") shows. Keyed by PROD_LISTING id; name, group and
   category are read from the listing row itself. */
type ProdDetail = {
  retail: number;
  sales: number;
  quantity: number;
  availability: "active" | "inactive";
  color: string;
  brand: string;
  condition: string;
  currency: string;
  description: string;
  size: string;
  store: string;
  tag: string;
};

export const PROD_DETAILS: Record<string, ProdDetail> = {
  "1234567": { retail: 34,  sales: 32,  quantity: 240, availability: "active", color: "", brand: "Amul",    condition: "new", currency: "INR", size: "500ml", store: "", tag: "", description: "Pasteurised toned milk from Amul, packed fresh for everyday use in tea, coffee and cooking." },
  "1234568": { retail: 285, sales: 275, quantity: 96,  availability: "active", color: "", brand: "Amul",    condition: "new", currency: "INR", size: "250gm", store: "", tag: "", description: "Pasteurised table butter made from fresh cream, with the classic Amul taste." },
  "1245987": { retail: 365, sales: 349, quantity: 64,  availability: "active", color: "", brand: "Amul",    condition: "new", currency: "INR", size: "500ml", store: "", tag: "", description: "Pure cow ghee with a rich aroma and granular texture, for cooking and sweets." },
  "1234271": { retail: 68,  sales: 66,  quantity: 180, availability: "active", color: "", brand: "Amul",    condition: "new", currency: "INR", size: "1L",    store: "", tag: "", description: "Pasteurised toned milk from Amul in a family-size pack." },
  "2341100": { retail: 28,  sales: 27,  quantity: 320, availability: "active", color: "", brand: "Tata",    condition: "new", currency: "INR", size: "1kg",   store: "", tag: "", description: "Vacuum-evaporated iodised salt for everyday cooking." },
  "2341102": { retail: 185, sales: 169, quantity: 140, availability: "active", color: "", brand: "Fortune", condition: "new", currency: "INR", size: "1L",    store: "", tag: "", description: "Refined sunflower oil, light and healthy for daily frying and cooking." },
  "3390012": { retail: 99,  sales: 89,  quantity: 75,  availability: "active", color: "", brand: "Dettol",  condition: "new", currency: "INR", size: "200ml", store: "", tag: "", description: "Germ-protection liquid handwash with a pump dispenser." },
};

type SubListingRow = {
  name: string;
  category: string;
  /* Sub-category-level AI recommendation (null = none yet). */
  aiSub: number | null;
  aiSubConf: Confidence;
};

/* Day-1 sub-category state: AI recommendations only. Names match the `sub`
   field of GROUP_LISTING so a rule saved here reaches those groups and their
   products. Subs whose groups/products carry no AI of their own (Cooking oils,
   Salt & sugar, Cleaning) have none either, so those rows keep resolving to
   their category. */
const SUB_LISTING: SubListingRow[] = [
  { name: "Milk",            category: "Dairy",             aiSub: 3,    aiSubConf: "high" },
  { name: "Curd & yogurt",   category: "Dairy",             aiSub: 4,    aiSubConf: "high" },
  { name: "Cheese",          category: "Dairy",             aiSub: 10,   aiSubConf: "med"  },
  { name: "Butter & ghee",   category: "Dairy",             aiSub: 18,   aiSubConf: "med"  },
  { name: "Bread",           category: "Bakery",            aiSub: 4,    aiSubConf: "high" },
  { name: "Cooking oils",    category: "Staples & grocery", aiSub: null, aiSubConf: "low"  },
  { name: "Salt & sugar",    category: "Staples & grocery", aiSub: null, aiSubConf: "low"  },
  { name: "Cleaning",        category: "Home care",         aiSub: null, aiSubConf: "low"  },
  { name: "Frozen snacks",   category: "Frozen foods",      aiSub: 9,    aiSubConf: "high" },
  { name: "Chips & namkeen", category: "Snacks",            aiSub: 7,    aiSubConf: "med"  },
];

type GroupListingRow = {
  name: string;
  sub: string;
  category: string;
  /* Group-level AI recommendation (null = none for this group yet). */
  aiGroup: number | null;
  aiGroupConf: Confidence;
};

/* Day-1 group state: AI recommendations only. Group names match the `group`
   field of PROD_LISTING so a rule saved here reaches those product rows.
   Groups whose products carry no AI of their own (Salt, Edible oils, Hand wash)
   have no group AI either, so those products keep resolving to their category. */
const GROUP_LISTING: GroupListingRow[] = [
  { name: "Amul milk",         sub: "Milk",            category: "Dairy",             aiGroup: 3,    aiGroupConf: "high" },
  { name: "Mother Dairy milk", sub: "Milk",            category: "Dairy",             aiGroup: 3,    aiGroupConf: "med"  },
  { name: "Amul curd",         sub: "Curd & yogurt",   category: "Dairy",             aiGroup: 4,    aiGroupConf: "high" },
  { name: "Amul butter",       sub: "Butter & ghee",   category: "Dairy",             aiGroup: 12,   aiGroupConf: "med"  },
  { name: "Amul ghee",         sub: "Butter & ghee",   category: "Dairy",             aiGroup: 28,   aiGroupConf: "high" },
  { name: "Britannia bread",   sub: "Bread",           category: "Bakery",            aiGroup: 4,    aiGroupConf: "high" },
  { name: "Edible oils",       sub: "Cooking oils",    category: "Staples & grocery", aiGroup: null, aiGroupConf: "low"  },
  { name: "Salt",              sub: "Salt & sugar",    category: "Staples & grocery", aiGroup: null, aiGroupConf: "low"  },
  { name: "Hand wash",         sub: "Cleaning",        category: "Home care",         aiGroup: null, aiGroupConf: "low"  },
  { name: "Lays chips",        sub: "Chips & namkeen", category: "Snacks",            aiGroup: 7,    aiGroupConf: "med"  },
];

/* ── Replenishment resolution ───────────────────────────────────────────────
   The single place the hierarchy is expressed. Every surface that shows an
   effective value — listing rows, category panel, product panel — reads it from
   here, so a change at one level reaches the levels below instead of being
   copied into them.

     product manual → product AI → group manual → group AI
       → sub-category manual → sub-category AI
       → category manual → category AI → global fallback

   Product groups resolve like categories: a saved group rule first, then the
   group's own AI recommendation (GROUP_LISTING), then the category. A group
   the listing does not know about contributes nothing and the chain passes
   straight through it.
─────────────────────────────────────────────────────────────────────────── */

type ResolveLevel = "product" | "group" | "sub" | "category" | "global";

type ReplConfig = {
  global: { fbOn: boolean; fbVal: number; bufOn: boolean; bufVal: number; minVal: number };
  /** Saved overrides, keyed by category name / group name / product id. */
  category: Record<string, LevelOverride>;
  sub: Record<string, LevelOverride>;
  group: Record<string, LevelOverride>;
  product: Record<string, LevelOverride>;
};

type Resolved = {
  days: number | null;
  source: EffSource;
  /** Which level supplied the value; null when nothing did. */
  level: ResolveLevel | null;
};

const NO_VALUE: Resolved = { days: null, source: "none", level: null };

const LEVEL_NOUN: Record<ResolveLevel, string> = {
  product: "product",
  group: "product group",
  sub: "sub-category",
  category: "category",
  global: "global",
};

/* "Manual (product group)" / "AI (category)" / "Global fallback" — listing caption. */
function sourceLabel(r: Resolved): string {
  if (r.source === "fallback") return "Global fallback";
  if (r.level == null || r.source === "none") return "";
  return `${r.source === "manual" ? "Manual" : "AI"} (${LEVEL_NOUN[r.level]})`;
}

/* "Manual | Category" — the side panels' badge for the same resolution. */
function sourcePanelLabel(r: Resolved): string {
  if (r.source === "fallback") return "Fallback";
  if (r.level == null || r.source === "none") return "";
  const noun = LEVEL_NOUN[r.level];
  return `${r.source === "manual" ? "Manual" : "AI"} | ${noun.charAt(0).toUpperCase()}${noun.slice(1)}`;
}

/* Level 7 — the global fallback, or nothing when none is configured. */
function resolveGlobal(cfg: ReplConfig): Resolved {
  return cfg.global.fbOn
    ? { days: cfg.global.fbVal, source: "fallback", level: "global" }
    : NO_VALUE;
}

/* Applies whatever is saved at one level, or hands on to the level below. */
function applyLevel(
  ov: LevelOverride | undefined,
  level: ResolveLevel,
  category: string,
  cfg: ReplConfig,
  next: () => Resolved,
): Resolved {
  const r = ov?.repl;
  if (r?.mode === "custom") return { days: r.days, source: "manual", level };
  /* Pinned to a level above. If that level has nothing to give — no global
     fallback configured — the pin cannot resolve, so the chain continues
     rather than dead-ending on a value that does not exist. */
  if (r?.mode === "global") return cfg.global.fbOn ? resolveGlobal(cfg) : next();
  if (r?.mode === "category" && level !== "category") return resolveCategory(category, cfg);
  return next();
}

/* Levels 5-7. */
function resolveCategory(name: string, cfg: ReplConfig): Resolved {
  return applyLevel(cfg.category[name], "category", name, cfg, () => {
    const ai = CAT_LISTING.find((c) => c.name === name)?.ai ?? null;
    return ai != null ? { days: ai, source: "ai", level: "category" } : resolveGlobal(cfg);
  });
}

/* Sub-category: saved rule → its own AI → the category. */
function resolveSub(sub: string, category: string, cfg: ReplConfig): Resolved {
  return applyLevel(cfg.sub[sub], "sub", category, cfg, () => {
    const ai = SUB_LISTING.find((s) => s.name === sub)?.aiSub ?? null;
    return ai != null ? { days: ai, source: "ai", level: "sub" } : resolveCategory(category, cfg);
  });
}

/* Levels 3-4. A group the listing knows about hands on to its sub-category;
   an unknown one passes straight to the category. */
function resolveGroup(group: string, category: string, cfg: ReplConfig): Resolved {
  return applyLevel(cfg.group[group], "group", category, cfg, () => {
    const g = GROUP_LISTING.find((x) => x.name === group);
    if (g?.aiGroup != null) return { days: g.aiGroup, source: "ai", level: "group" };
    return g ? resolveSub(g.sub, category, cfg) : resolveCategory(category, cfg);
  });
}

/* Levels 1-2 — the whole chain, for one product row. */
function resolveReplenishment(row: ProdListingRow, cfg: ReplConfig): Resolved {
  return applyLevel(cfg.product[row.id], "product", row.category, cfg, () =>
    row.aiProd != null
      ? { days: row.aiProd, source: "ai", level: "product" }
      : resolveGroup(row.group, row.category, cfg),
  );
}

/* ── Trigger buffer ───────────────────────────────────────────────────────── */

type ResolvedBuffer = {
  days: number | null;
  level: ResolveLevel | null;
};

const NO_BUFFER: ResolvedBuffer = { days: null, level: null };

/* The furthest ahead a reminder can be scheduled without preceding the global
   minimum. This bounds what a panel lets you SET at a level; it deliberately
   does not rewrite a value inherited from a level above, so an inheriting row
   always shows the same number as the level it inherits from. */
function bufferCap(eff: Resolved, cfg: ReplConfig): number {
  return Math.max(1, (eff.days ?? cfg.global.minVal) - cfg.global.minVal);
}

function resolveBufferChain(
  chain: [LevelOverride | undefined, ResolveLevel][],
  cfg: ReplConfig,
): ResolvedBuffer {
  for (const [ov, level] of chain) {
    const b = ov?.buffer;
    if (b?.mode === "custom") return { days: b.days, level };
    if (b?.mode === "off") return NO_BUFFER;
  }
  /* Nothing set below it — inherit the global buffer if one exists. With none
     configured there is no buffer, and none is invented. */
  return cfg.global.bufOn ? { days: cfg.global.bufVal, level: "global" } : NO_BUFFER;
}

/* The sub-category a group belongs to, when the listing knows it. */
const subOfGroup = (group: string) => GROUP_LISTING.find((g) => g.name === group)?.sub;

/* Buffer priority: product → product group → sub-category → category → global. */
function resolveBuffer(row: ProdListingRow, cfg: ReplConfig): ResolvedBuffer {
  const sub = subOfGroup(row.group);
  return resolveBufferChain(
    [
      [cfg.product[row.id], "product"],
      [cfg.group[row.group], "group"],
      [sub ? cfg.sub[sub] : undefined, "sub"],
      [cfg.category[row.category], "category"],
    ],
    cfg,
  );
}

function resolveCategoryBuffer(name: string, cfg: ReplConfig): ResolvedBuffer {
  return resolveBufferChain([[cfg.category[name], "category"]], cfg);
}

/* Buffer priority for a sub-category row: sub-category → category → global. */
function resolveSubBuffer(sub: string, category: string, cfg: ReplConfig): ResolvedBuffer {
  return resolveBufferChain(
    [
      [cfg.sub[sub], "sub"],
      [cfg.category[category], "category"],
    ],
    cfg,
  );
}

/* Buffer priority for a group row: product group → sub-category → category → global. */
function resolveGroupBuffer(group: string, category: string, cfg: ReplConfig): ResolvedBuffer {
  const sub = subOfGroup(group);
  return resolveBufferChain(
    [
      [cfg.group[group], "group"],
      [sub ? cfg.sub[sub] : undefined, "sub"],
      [cfg.category[category], "category"],
    ],
    cfg,
  );
}

function bufferLabel(b: ResolvedBuffer): string {
  if (b.level == null) return "";
  return b.level === "global" ? "Global fallback" : `Manual (${LEVEL_NOUN[b.level]})`;
}

/* "Show :" dropdown — the shared <Dropdown> field skin (DS §6.1) plus a
   count / percent column the plain option list cannot carry. Local to the
   Replenishment listing screen; Catalogue and View by use <Dropdown> itself.
   The old borderless ListingSelect is gone — both of its call sites now use
   the same control as the Select products toolbar. */
function ShowSelect({
  value,
  onChange,
  rows,
}: {
  value: string;
  onChange: (v: string) => void;
  rows: { value: string; label: string; count: string; note?: string }[];
}) {
  const [open, setOpen] = useState(false);
  const current = rows.find((o) => o.value === value)?.label ?? value;
  return (
    /* While open, the popover root is lifted above the table's sticky header
       (z-10) so the panel covers it instead of the header painting through. */
    <div className={open ? "relative z-40" : "relative"}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={[
          // Filter-strip control: same type as <Dropdown bare>, no field box.
          "flex h-8 items-center gap-1.5 rounded-sm px-2.5 text-[13px] leading-[21px] tracking-[-0.01em] transition-[background-color,box-shadow] duration-150 ease-out",
          "focus-visible:outline-none",
          open
            ? "bg-[#EDF1FF] shadow-[0_0_0_4px_rgba(47,104,229,0.15)]"
            : "bg-white hover:bg-[#F6F8FF]",
        ].join(" ")}
      >
        <span className="font-medium text-[#6F6F8D]">Show:</span>
        <span className="font-semibold text-[#17173A]">{current}</span>
        <CaretDownDS className={`size-3 transition-transform ${open ? "rotate-180 text-[#2F68E5]" : "text-[#6F6F8D]"}`} />
      </button>
      {open && (
        <>
          <button type="button" aria-hidden className="fixed inset-0 z-20 cursor-default" onClick={() => setOpen(false)} />
          {/* Same panel as <Dropdown>: 1px #DDE2EE, radius 4, 42px rows,
              selected = #F4F8FF fill + 3px #2F68E5 left bar.
              Anchored directly below the Show field. */}
          {/* Sized from the longest label ("With manual override", 136px) plus
              its count and padding, with a comfortable gap left between them —
              the flex-1 label and shrink-0 count mean the reduction comes off
              the slack in the middle, not off either value. */}
          <div className="absolute left-0 top-[calc(100%+4px)] z-30 w-[224px] overflow-hidden rounded-sm border border-[#DDE2EE] bg-white py-1 shadow-[0_5px_12px_rgba(23,23,58,0.07)]">
            {rows.map((o) => {
              const sel = o.value === value;
              return (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => { onChange(o.value); setOpen(false); }}
                  className={[
                    "relative flex h-[42px] w-full items-center gap-3 pr-3 text-left transition-colors",
                    sel ? "bg-[#F4F8FF] pl-[15px]" : "pl-3 hover:bg-[#F6F8FF]",
                  ].join(" ")}
                >
                  {sel && <span aria-hidden className="absolute left-0 top-0 h-full w-[3px] rounded-full bg-[#2F68E5]" />}
                  <span className="min-w-0 flex-1 truncate text-[14px] font-medium leading-[1.5] tracking-[-0.01em] text-[#17173A]">
                    {o.label}
                  </span>
                  <span className="shrink-0 text-[14px] font-semibold leading-[1.5] tracking-[-0.01em] text-[#17173A] tabular-nums">
                    {o.count}
                  </span>
                  {o.note && (
                    <span className="shrink-0 text-[12px] font-medium leading-[20px] tracking-[-0.01em] text-[#6F6F8D]">
                      {o.note}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

/* The Caption-M/M line naming where a value came from, with the DS icon atom
   for its kind (ai-star / edit). One implementation, so every column that
   attributes a value — Effective and Remind before trigger, in both the
   category and product views — is identical in icon, size, colour, gap,
   alignment and type. */
function SourceCaption({ icon, label }: { icon: "ai" | "edit" | "none"; label: string }) {
  if (!label) return null;
  return (
    <div className="mt-0.5 flex min-w-0 items-center gap-1 text-[12px] font-medium leading-[20px] tracking-[-0.01em] text-[#6F6F8D]">
      {icon === "ai" && <AiStarIconDS className="size-3 shrink-0 text-[#2F68E5]" />}
      {icon === "edit" && <EditIconDS className="size-3 shrink-0 text-[#6F6F8D]" />}
      <span className="truncate">{label}</span>
    </div>
  );
}

/* Effective value + its source, DS §1.2 body-mid-M/SB over the caption line. */
function EffectiveCell({ res }: { res: Resolved }) {
  return (
    <div className="min-w-0">
      <p className="text-[14px] font-semibold leading-[22px] tracking-[-0.01em] text-[#17173A]">{res.days} days</p>
      <SourceCaption icon={res.source === "ai" ? "ai" : "edit"} label={sourceLabel(res)} />
    </div>
  );
}

/* Same anatomy for the resolved trigger buffer, but with no source glyph: the
   Effective column uses icons to separate AI from configured values, and a
   buffer is never AI-derived, so the icon would carry no information here. */
function BufferCell({ buf }: { buf: ResolvedBuffer }) {
  return (
    <div className="min-w-0">
      <p className="text-[14px] font-semibold leading-[22px] tracking-[-0.01em] text-[#17173A]">{buf.days} days</p>
      <SourceCaption icon="none" label={bufferLabel(buf)} />
    </div>
  );
}

/* An AI suggestion that has not been computed yet. Same type scale as the
   value it will be replaced by, in the table's secondary colour. */
function ComputingCell() {
  return (
    <p className="flex items-center gap-1.5 text-[14px] font-semibold leading-[22px] tracking-[-0.01em] text-[#6F6F8D]">
      <SandIconDS className="size-3.5 shrink-0" />
      Computing
    </p>
  );
}

/* ─── Onboarding Nudge ───────────────────────────────────────────────────── */

type NudgeStep = 1 | 2 | 3;

const NUDGE_STEPS: Record<NudgeStep, { title: string; body: string }> = {
  1: {
    title: "Set your global defaults",
    body: "Define the default replenishment behaviour for your catalog. You can override these settings for specific categories or products.",
  },
  2: {
    title: "Customize by category",
    body: "Set replenishment rules for a specific category. Category settings can override your global defaults.",
  },
  3: {
    title: "Switch to product view",
    body: "View and manage replenishment settings at the individual product level.",
  },
};

function NudgeOverlay({
  step,
  targetRect,
  onNext,
  onDismiss,
}: {
  step: NudgeStep;
  targetRect: DOMRect;
  onNext: () => void;
  onDismiss: () => void;
}) {
  const PAD = 6;
  const spotlight = {
    left: targetRect.left - PAD,
    top: targetRect.top - PAD,
    width: targetRect.width + PAD * 2,
    height: targetRect.height + PAD * 2,
  };

  // Tooltip placement per step
  const TOOLTIP_W = 280;
  type Placement = { left: number; top: number; arrowSide: "top" | "left"; arrowOffset: number };
  const placement: Placement = (() => {
    if (step === 1) {
      // Below the spotlight, aligned to its right edge
      return {
        left: Math.min(spotlight.left + spotlight.width - TOOLTIP_W, window.innerWidth - TOOLTIP_W - 16),
        top: spotlight.top + spotlight.height + 14,
        arrowSide: "top" as const,
        arrowOffset: TOOLTIP_W - 48,
      };
    }
    if (step === 2) {
      // To the right of the category name
      return {
        left: spotlight.left + spotlight.width + 14,
        top: spotlight.top + spotlight.height / 2 - 60,
        arrowSide: "left" as const,
        arrowOffset: 56,
      };
    }
    // Step 3: below the View by control, aligned to its left
    return {
      left: Math.max(16, spotlight.left - 8),
      top: spotlight.top + spotlight.height + 14,
      arrowSide: "top" as const,
      arrowOffset: 32,
    };
  })();

  const { title, body } = NUDGE_STEPS[step];
  const isLast = step === 3;

  return (
    <>
      {/* Backdrop — blocks all clicks */}
      <div
        className="fixed inset-0 z-[55]"
        style={{ background: "rgba(23,23,58,0.38)" }}
        onClick={onDismiss}
      />

      {/* Spotlight ring — sits above backdrop, clips backdrop around target */}
      <div
        className="pointer-events-none fixed z-[56] rounded-[8px]"
        style={{
          left: spotlight.left,
          top: spotlight.top,
          width: spotlight.width,
          height: spotlight.height,
          boxShadow: "0 0 0 9999px rgba(23,23,58,0.38), 0 0 0 2px #0c6aed",
          borderRadius: step === 2 ? 4 : 8,
        }}
      />

      {/* Tooltip card */}
      <div
        className="fixed z-[57] w-[280px] rounded-[10px] border border-[#dde2ee] bg-white p-5 shadow-[0_8px_32px_rgba(23,23,58,0.15)]"
        style={{ left: placement.left, top: placement.top }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Arrow */}
        {placement.arrowSide === "top" && (
          <div
            className="absolute -top-[7px] size-[13px] rotate-45 border-l border-t border-[#dde2ee] bg-white"
            style={{ left: placement.arrowOffset }}
          />
        )}
        {placement.arrowSide === "left" && (
          <div
            className="absolute -left-[7px] size-[13px] rotate-[-135deg] border-l border-t border-[#dde2ee] bg-white"
            style={{ top: placement.arrowOffset }}
          />
        )}

        {/* Header row */}
        <div className="mb-2 flex items-start justify-between gap-2">
          <p className="text-[14px] font-bold leading-[20px] tracking-[0.42px] text-[#17173a]">{title}</p>
          <button
            type="button"
            onClick={onDismiss}
            className="shrink-0 rounded p-0.5 text-[#6f6f8d] hover:text-[#17173a] transition-colors"
          >
            <svg viewBox="0 0 14 14" fill="none" className="size-[14px]">
              <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <p className="mb-4 text-[13px] font-normal leading-[19px] tracking-[0.3px] text-[#6f6f8d]">{body}</p>

        {/* Footer: dots + button */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            {([1, 2, 3] as NudgeStep[]).map((s) => (
              <div
                key={s}
                className="rounded-full transition-all"
                style={{
                  width: s === step ? 16 : 6,
                  height: 6,
                  background: s === step ? "#0c6aed" : "#dde2ee",
                }}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={onNext}
            className="rounded-[4px] bg-[#0c6aed] px-4 py-1.5 text-[13px] font-bold tracking-[0.42px] text-white hover:bg-[#0b5ed7] transition-colors"
          >
            {isLast ? "Got it" : "Next →"}
          </button>
        </div>
      </div>
    </>
  );
}

/* ─── Listing pagination ─────────────────────────────────────────────────────
   Prototype-only controls under the table: rows-per-page field on the left,
   pager on the right. Page and page-size are held locally for the visual
   state; they do not slice the table's rows. */
const PER_PAGE_OPTIONS = [10, 25, 50].map((n) => ({ value: String(n), label: `${n} per page` }));
const PAGE_COUNT = 5;

export function ListingPagination() {
  const [perPage, setPerPage] = useState("10");
  const [page, setPage] = useState(1);
  const first = page === 1;
  const last = page === PAGE_COUNT;

  const navCls = (disabled: boolean) =>
    [
      "grid h-full w-8 place-items-center text-[14px] leading-none transition-colors duration-150 ease-out focus-visible:outline-none",
      disabled ? "cursor-default text-[#C5C5D3]" : "text-[#6F6F8D] hover:text-[#17173A]",
    ].join(" ");

  return (
    <div className="mt-3 flex items-center justify-between">
      <Dropdown value={perPage} options={PER_PAGE_OPTIONS} onChange={setPerPage} minWidth={150} overlay />

      <nav aria-label="Pagination" className="flex h-9 items-stretch rounded-lg border border-[#D9D9E8] bg-white px-1">
        <button type="button" aria-label="First page" disabled={first} onClick={() => setPage(1)} className={navCls(first)}>
          &laquo;
        </button>
        <button type="button" aria-label="Previous page" disabled={first} onClick={() => setPage((p) => p - 1)} className={navCls(first)}>
          &lsaquo;
        </button>
        {Array.from({ length: PAGE_COUNT }, (_, i) => i + 1).map((n) => {
          const active = n === page;
          return (
            <button
              key={n}
              type="button"
              aria-current={active ? "page" : undefined}
              onClick={() => setPage(n)}
              className={[
                "relative grid h-full w-8 place-items-center text-[13px] leading-[21px] tracking-[-0.01em] transition-colors duration-150 ease-out focus-visible:outline-none",
                active ? "font-semibold text-[#17173A]" : "font-medium text-[#6F6F8D] hover:text-[#17173A]",
              ].join(" ")}
            >
              {n}
              {active && <span aria-hidden className="absolute bottom-0 left-2 right-2 h-[2px] rounded-full bg-[#2F68E5]" />}
            </button>
          );
        })}
        <button type="button" aria-label="Next page" disabled={last} onClick={() => setPage((p) => p + 1)} className={navCls(last)}>
          &rsaquo;
        </button>
        <button type="button" aria-label="Last page" disabled={last} onClick={() => setPage(PAGE_COUNT)} className={navCls(last)}>
          &raquo;
        </button>
      </nav>
    </div>
  );
}

function ReplenishmentListingScreen({
  catalogName,
  computingCats,
  actionSlot,
}: {
  catalogName: string;
  /** Categories whose AI suggestion has not been computed yet. */
  computingCats?: Set<string>;
  firstVisit?: boolean;
  onNudgeSeen?: () => void;
  /** Page-header slot (right of the tab bar) the search field and CTAs are
      portalled into, so the screen keeps owning their state. */
  actionSlot?: HTMLElement | null;
}) {
  const [view, setView] = useState<ViewBy>("category");
  const [show, setShow] = useState("all");
  const [query, setQuery] = useState("");
  const [settingsOpen, setSettingsOpen] = useState(false);
  /* Demo catalog switch. BigBazaar is hardcoded as a catalog that exists but
     has no context mapping yet, so it shows the empty-screen experience in
     place of the table. D-Mart is untouched. */
  const [catalog, setCatalog] = useState("dmart");
  const bigBazaar = catalog === "bigbazaar";
  const [bbSetupRequested, setBbSetupRequested] = useState(false);
  const [bbToast, setBbToast] = useState(false);
  const bbToastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (bbToastTimer.current) clearTimeout(bbToastTimer.current); }, []);

  /* Setup for this catalog is hardcoded as ready to go: the request lands and
     the banner turns green, with no mapping detour. */
  const handleBigBazaarSetup = () => {
    setBbSetupRequested(true);
    setBbToast(true);
    if (bbToastTimer.current) clearTimeout(bbToastTimer.current);
    bbToastTimer.current = setTimeout(() => setBbToast(false), 3000);
  };
  // Global settings that flow into the listing table
  const [fbOn, setFbOn] = useState(false);
  const [fbVal, setFbVal] = useState(15);
  const [bufOn, setBufOn] = useState(false);
  const [bufVal, setBufVal] = useState(2);
  /* The minimum reminder is a global baseline the category preview also needs,
     so it lives here beside the other global values rather than inside the
     settings panel. */
  const [minVal, setMinVal] = useState(MIN_REMINDER_DAYS);
  // Category-level configuration panel + saved overrides
  const [catPanel, setCatPanel] = useState<CatListingRow | null>(null);
  const [catOverrides, setCatOverrides] = useState<Record<string, LevelOverride>>({});
  // Product-level configuration panel + saved overrides, keyed by product id
  const [prodPanel, setProdPanel] = useState<ProdListingRow | null>(null);
  const [prodOverrides, setProdOverrides] = useState<Record<string, LevelOverride>>({});
  // Sub-category configuration panel + saved overrides, keyed by sub-category name
  const [subPanel, setSubPanel] = useState<SubListingRow | null>(null);
  const [subOverrides, setSubOverrides] = useState<Record<string, LevelOverride>>({});
  // Group-level configuration panel + saved overrides, keyed by group name
  const [groupPanel, setGroupPanel] = useState<GroupListingRow | null>(null);
  const [groupOverrides, setGroupOverrides] = useState<Record<string, LevelOverride>>({});

  /* Everything the resolver needs, in one object. Both config panels take it and
     layer their unsaved edits on top, so a panel preview and the listing row
     behind it are always produced by the same code path. */
  const cfg: ReplConfig = useMemo(
    () => ({
      global: { fbOn, fbVal, bufOn, bufVal, minVal },
      category: catOverrides,
      sub: subOverrides,
      group: groupOverrides,
      product: prodOverrides,
    }),
    [fbOn, fbVal, bufOn, bufVal, minVal, catOverrides, subOverrides, groupOverrides, prodOverrides],
  );

  /* ─── TEMPORARILY DISABLED — first-time onboarding nudge ────────────────────
     The nudge is being redesigned, so it is switched off rather than removed:
     NudgeOverlay / NUDGE_STEPS above and the state machine below are all kept
     intact. To restore, un-comment this block, the `gsRef` / `catRowRef` /
     `viewByRef` attributes on the Global settings button, the first category
     row and the View by control, the `firstVisit` / `onNudgeSeen` props in the
     signature above, and the <NudgeOverlay> render at the bottom of this
     component.

  const [nudgeStep, setNudgeStep] = useState<NudgeStep | null>(firstVisit ? 1 : null);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const gsRef = useRef<HTMLButtonElement>(null);
  const catRowRef = useRef<HTMLButtonElement>(null);
  const viewByRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (nudgeStep === null) return;
    const el = nudgeStep === 1 ? gsRef.current : nudgeStep === 2 ? catRowRef.current : viewByRef.current;
    if (el) setTargetRect(el.getBoundingClientRect());
  }, [nudgeStep]);

  useEffect(() => {
    if (nudgeStep === null) return;
    function update() {
      const el = nudgeStep === 1 ? gsRef.current : nudgeStep === 2 ? catRowRef.current : viewByRef.current;
      if (el) setTargetRect(el.getBoundingClientRect());
    }
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [nudgeStep]);

  function advanceNudge() {
    if (nudgeStep === 3) { setNudgeStep(null); onNudgeSeen?.(); }
    else if (nudgeStep !== null) setNudgeStep((nudgeStep + 1) as NudgeStep);
  }
  function dismissNudge() { setNudgeStep(null); onNudgeSeen?.(); }

  ─────────────────────────────────────────────────────────────────────────── */

  const entity =
    view === "category" ? "categories" :
    view === "sub" ? "sub-categories" :
    view === "group" ? "groups" : "products";

  const viewOptions = [
    { value: "category", label: "Categories" },
    { value: "sub", label: "Sub-category" },
    { value: "group", label: "Group" },
    { value: "product", label: "Products" },
  ];

  /* Counts describe how the catalogue actually resolves under the current
     configuration, so they move when a setting at any level moves. */
  const showRows = useMemo(() => {
    const isProduct = view === "product";
    const resolved = isProduct
      ? PROD_LISTING.map((r) => resolveReplenishment(r, cfg))
      : view === "group"
      ? GROUP_LISTING.map((r) => resolveGroup(r.name, r.category, cfg))
      : view === "sub"
      ? SUB_LISTING.map((r) => resolveSub(r.name, r.category, cfg))
      : CAT_LISTING.map((r) => resolveCategory(r.name, cfg));
    const total = resolved.length;
    const tally = (src: EffSource) => resolved.filter((r) => r.source === src).length;
    const row = (value: string, label: string, n: number) => ({ value, label, count: num(n) });
    return [
      row("all", isProduct ? "All products" : `All ${entity}`, total),
      row("manual", "With manual override", tally("manual")),
      row("ai", "Using AI", tally("ai")),
      row("fallback", "Using fallback", tally("fallback")),
    ];
  }, [view, entity, cfg]);

  const q = query.trim().toLowerCase();

  /* Both filters ask the resolver the same question the Effective column shows,
     so what a filter selects can never disagree with what the row displays. */
  const bySource = (src: EffSource) => show === "all" || show === src;

  const catRows = CAT_LISTING.filter((r) => {
    if (q && !r.name.toLowerCase().includes(q)) return false;
    return bySource(resolveCategory(r.name, cfg).source);
  });

  const prodRows = PROD_LISTING.filter((r) => {
    if (q && !r.name.toLowerCase().includes(q)) return false;
    return bySource(resolveReplenishment(r, cfg).source);
  });

  const subRows = SUB_LISTING.filter((r) => {
    if (q && !r.name.toLowerCase().includes(q)) return false;
    return bySource(resolveSub(r.name, r.category, cfg).source);
  });

  const groupRows = GROUP_LISTING.filter((r) => {
    if (q && !r.name.toLowerCase().includes(q)) return false;
    return bySource(resolveGroup(r.name, r.category, cfg).source);
  });

  /* ── Table skin ────────────────────────────────────────────────────────────
     Same tokens as the Select products table: tableStyles() for the row rule,
     name/secondary/tertiary type and thumbnail, <ColHead> for the header cells.
     Columns are fractional (`minmax(0,Nfr)`) instead of the old fixed 1000/1060px
     minimum, so every column stays inside the content area and the table never
     scrolls sideways — long values truncate or wrap instead.
  ─────────────────────────────────────────────────────────────────────────── */
  const skin = tableStyles(true);
  // tableStyles().headCls without its sticky positioning — this table scrolls
  // with the page rather than inside its own box.
  const headBand = "rounded-t-lg border-b border-[#EBEBF5] bg-[#FAFBFF] px-5 py-2.5";
  const cap = "text-[12px] font-medium leading-[20px] tracking-[-0.01em] text-[#6F6F8D]";
  const CAT_COLS =
    "grid-cols-[minmax(0,1.78fr)_minmax(0,1.05fr)_minmax(0,1.05fr)_minmax(0,1.05fr)_minmax(0,1.15fr)]";
  /* Sub-category view: the category tracks with one more fractional column for
     the parent category, so it too fits the card without scrolling. */
  const SUB_COLS =
    "grid-cols-[minmax(0,1.5fr)_minmax(0,1.05fr)_minmax(0,1.05fr)_minmax(0,1.05fr)_minmax(0,1.05fr)_minmax(0,1.15fr)]";
  /* Product view has more data points than the category view, so its tracks are
     fixed widths: the row outgrows the card and scrolls horizontally with the
     Product name column pinned, matching the campaign listing table. */
  const PROD_COLS =
    "grid-cols-[300px_170px_170px_170px_180px_180px_220px]";
  /* Pinned first column: covers the row's px-5/py-3 (band py-2.5) padding so
     scrolled cells cannot show through beside or above it. */
  const PROD_STICKY_HEAD =
    "sticky left-0 z-[2] -ml-5 -my-2.5 self-stretch flex items-center border-r border-[#EBEBF5] bg-[#FAFBFF] px-5 py-2.5";
  const PROD_STICKY_CELL =
    "relative sticky left-0 z-[1] -ml-5 -my-3 self-stretch border-r border-[#EBEBF5] bg-white px-5 py-3 transition-colors group-hover:bg-[#F6F8FF]";
  /* Category view: same right-hand divider as the pinned Product name column,
     without the sticky positioning (this table does not scroll sideways). */
  const CAT_DIVIDER_HEAD =
    "-ml-5 -my-2.5 self-stretch flex items-center border-r border-[#EBEBF5] px-5 py-2.5";
  const CAT_DIVIDER_CELL =
    "-ml-5 -my-3 self-stretch flex min-w-0 items-center gap-2.5 border-r border-[#EBEBF5] px-5 py-3";

  const Dash = () => <span className="text-[14px] font-medium leading-[22px] text-[#9494AE]">—</span>;

  /* Column header. The tooltip wrapper carries the z-index (not the bubble):
     a transform on the wrapper would trap the bubble in a lower stacking
     context and the rows below would paint over it, so the 2px optical
     nudge uses `top`, not `translate`. */
  const HeadCell = ({
    children,
    tip,
    tipAlign = "center",
  }: {
    children: React.ReactNode;
    tip?: string;
    /** Right-anchor the bubble on the last column so it cannot run off-screen. */
    tipAlign?: "center" | "right";
  }) => (
    <ColHead>
      {/* Label and info icon share one wrapping run, so on a narrow column the
          icon follows the last word instead of being pushed to the far edge. */}
      <span className="min-w-0">
        {children}
        {tip && (
        <span className="group/tip relative top-[2px] z-30 ml-1 inline-flex cursor-help items-center align-baseline">
          <InfoIconDS className="size-3 shrink-0 text-[#9494AE]" />
          {/* DS §12.4 tooltip: #17173A, 12/500, 6px 10px, radius 6 */}
          <span
            role="tooltip"
            className={[
              "pointer-events-none absolute top-full z-30 mt-2 w-[230px] rounded-md bg-[#17173A] px-2.5 py-1.5 text-center text-[12px] font-medium normal-case leading-[18px] tracking-[-0.01em] text-white opacity-0 shadow-[0_1px_3px_rgba(23,23,58,0.10)] transition-opacity duration-150 group-hover/tip:opacity-100",
              tipAlign === "right" ? "right-0" : "left-1/2 -translate-x-1/2",
            ].join(" ")}
          >
            <span
              aria-hidden
              className={
                tipAlign === "right"
                  ? "absolute -top-1 right-1.5 size-2 rotate-45 bg-[#17173A]"
                  : "absolute -top-1 left-1/2 size-2 -translate-x-1/2 rotate-45 bg-[#17173A]"
              }
            />
            {tip}
          </span>
        </span>
        )}
      </span>
    </ColHead>
  );

  const TIP_AI = "Replenishment period recommended by AI based on customer purchase patterns.";
  const TIP_MANUAL =
    "A value manually set for this category, group or product. Manual overrides take priority over AI suggestions.";
  const TIP_EFFECTIVE =
    "The replenishment cycle currently being applied. From a manual rule if one is set, otherwise the AI recommendation.";
  const TIP_REMIND =
    "Number of days before the expected replenishment date when the reminder journey will be triggered.";

  return (
    <div className="flex min-h-0 flex-1 flex-col pb-6">
      {/* ─── TEMPORARILY REMOVED — "Recommended" global-defaults strip ──────────
          Preserved here rather than deleted; the controls below now start
          directly under the Replenishment tab bar. Global settings itself is
          untouched and still reachable from the toolbar button.

      {showBanner && (
        <div className="mt-5 flex items-center justify-between gap-4 rounded-lg bg-[#EDF1FF] px-5 py-3">
          <p className="text-[13.5px] text-[#17173A]">
            <span className="font-bold">Recommended:</span> Set global replenishment defaults for your catalog. You can override them for specific categories, groups or products.
          </p>
          <div className="flex shrink-0 items-center gap-6">
            <button type="button" onClick={() => setShowBanner(false)} className="text-[13.5px] font-medium text-[#6F6F8D] hover:text-[#17173A]">Maybe later</button>
            <button type="button" className="text-[13.5px] font-bold text-[#0c6aed] hover:text-[#1F54C7]">
              Set global settings →
            </button>
          </div>
        </div>
      )}
      ──────────────────────────────────────────────────────────────────────── */}

      {/* Infinity DS 3.0 is scoped to this screen's toolbar and table only. The
          side panels below stay outside the provider so Global settings and the
          category / product config panels render exactly as before. */}
      <DSScope.Provider value={true}>
        {/* Top-right action area (beside the tab bar): search, then the
            secondary Set fallback. Rendered through a portal so the field
            state stays here. */}
        {actionSlot &&
          createPortal(
            <>
              <div className="relative w-[280px]">
                <SearchIconDS className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#9494AE]" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search"
                  className={DS_SEARCH_INPUT}
                />
                {query && (
                  <button type="button" onClick={() => setQuery("")} className={DS_SEARCH_CLEAR} aria-label="Clear">
                    <CloseIconDS className="size-3" />
                  </button>
                )}
              </div>
              {/* DS §6.2 secondary (outlined) button — opens Global settings.
                  Not applicable to the catalog-specific state. */}
              {!bigBazaar && (
                <button
                  type="button"
                  onClick={() => setSettingsOpen(true)}
                  className="dc-btn dc-btn-primary"
                >
                  Configuration
                </button>
              )}
            </>,
            actionSlot,
          )}

        {/* Filter strip — a plain white band holding the three filters. */}
        <div className="mt-4 flex items-center gap-1 rounded-lg border border-[#EBEBF5] bg-white px-3 py-2.5">
          <Dropdown
            label="Catalog:"
            value={catalog}
            options={[
              { value: "dmart", label: catalogName },
              { value: "bigbazaar", label: "BigBazaar" },
            ]}
            onChange={setCatalog}
            minWidth={160}
            overlay
            bare
          />
          <Dropdown
            label="View by:"
            value={view}
            options={viewOptions}
            onChange={(v) => { setView(v as ViewBy); setShow("all"); setQuery(""); }}
            minWidth={170}
            overlay
            bare
          />
          <ShowSelect value={show} onChange={setShow} rows={showRows} />
        </div>

        {/* Table — sits directly below the filter strip in its own hairline
            frame. It does not clip, so a column-header tooltip can escape it;
            only the row block is clipped, to keep row fills inside the
            bottom corners. */}
        <div className="mt-3 rounded-lg border border-[#EBEBF5] bg-white">
          {bigBazaar ? (
            <ReplenishmentEmptyState
              showHeading={false}
              onCtaClick={handleBigBazaarSetup}
              banner={bbSetupRequested ? "in-progress" : "context-mapping"}
              onConnectPurchaseData={() => undefined}
            />
          ) : view === "category" ? (
            <div>
              {/* Header */}
              <div className={`grid items-center gap-4 ${CAT_COLS} ${headBand}`}>
                <div className={CAT_DIVIDER_HEAD}><HeadCell>Category name</HeadCell></div>
                <HeadCell tip={TIP_AI}>AI suggested</HeadCell>
                <HeadCell tip={TIP_MANUAL}>Manual override</HeadCell>
                <HeadCell tip={TIP_EFFECTIVE}>Effective due</HeadCell>
                <HeadCell tip={TIP_REMIND} tipAlign="right">Remind before due</HeadCell>
              </div>
              {/* Rows */}
              <div className="overflow-hidden rounded-b-lg">
              {catRows.map((r) => {
                const ov = catOverrides[r.name];
                const manual = ov?.repl?.mode === "custom" ? ov.repl.days : null;
                const eff = resolveCategory(r.name, cfg);
                const buf = resolveCategoryBuffer(r.name, cfg);
                return (
                  <div
                    key={r.name}
                    className={[
                      "group relative grid items-center gap-4",
                      CAT_COLS,
                      skin.rowCls,
                      /* Fixed row height: the two-line (value + caption) row's
                         height, so rows showing only dashes stay the same. */
                      "min-h-[67px]",
                      "last:border-0",
                    ].join(" ")}
                  >
                    {/* Left accent is part of the hover treatment, not a persistent selection. */}
                    <span
                      aria-hidden
                      className="absolute left-0 top-0 h-full w-[3px] bg-[#2F68E5] opacity-0 transition-opacity duration-150 ease-out group-hover:opacity-100"
                    />
                    <div className={CAT_DIVIDER_CELL}>
                      <button
                        type="button"
                        onClick={() => setCatPanel(r)}
                        className={`min-w-0 flex-1 truncate text-left transition-colors hover:text-[#2F68E5] hover:underline ${skin.tName}`}
                      >
                        {r.name}
                      </button>
                    </div>
                    <div className="min-w-0">
                      {computingCats?.has(r.name.toLowerCase()) ? (
                        <ComputingCell />
                      ) : r.ai == null ? (
                        <Dash />
                      ) : (
                        <>
                          <p className={skin.tName}>{r.ai} days</p>
                          <p
                            className="truncate text-[12px] font-semibold leading-[20px] tracking-[-0.01em]"
                            style={{ color: CONF_META_DS[r.conf].color }}
                          >
                            {CONF_META_DS[r.conf].label}
                          </p>
                        </>
                      )}
                    </div>
                    {/* Manual override — what is set at this level, nothing inherited */}
                    <div className="min-w-0">
                      {manual != null ? (
                        <>
                          <p className={skin.tName}>{manual} days</p>
                          <p className={`truncate ${cap}`}>Category</p>
                        </>
                      ) : (
                        <Dash />
                      )}
                    </div>
                    {/* Effective — category manual → category AI → global fallback */}
                    <div className="min-w-0">
                      {eff.days != null ? <EffectiveCell res={eff} /> : <Dash />}
                    </div>
                    <div className="min-w-0">
                      {buf.days != null ? <BufferCell buf={buf} /> : <Dash />}
                    </div>
                  </div>
                );
              })}
              {catRows.length === 0 && <EmptyListing entity={entity} />}
              </div>
            </div>
          ) : view === "sub" ? (
            <div>
              {/* Header */}
              <div className={`grid items-center gap-4 ${SUB_COLS} ${headBand}`}>
                <div className={CAT_DIVIDER_HEAD}><HeadCell>Sub-category</HeadCell></div>
                <HeadCell>Category</HeadCell>
                <HeadCell tip={TIP_AI}>AI suggested</HeadCell>
                <HeadCell tip={TIP_MANUAL}>Manual override</HeadCell>
                <HeadCell tip={TIP_EFFECTIVE}>Effective due</HeadCell>
                <HeadCell tip={TIP_REMIND} tipAlign="right">Remind before due</HeadCell>
              </div>
              {/* Rows */}
              <div className="overflow-hidden rounded-b-lg">
              {subRows.map((r) => {
                const ov = subOverrides[r.name];
                const manual = ov?.repl?.mode === "custom" ? ov.repl.days : null;
                const eff = resolveSub(r.name, r.category, cfg);
                const buf = resolveSubBuffer(r.name, r.category, cfg);
                return (
                  <div
                    key={r.name}
                    className={[
                      "group relative grid items-center gap-4",
                      SUB_COLS,
                      skin.rowCls,
                      "min-h-[67px]",
                      "last:border-0",
                    ].join(" ")}
                  >
                    <span
                      aria-hidden
                      className="absolute left-0 top-0 h-full w-[3px] bg-[#2F68E5] opacity-0 transition-opacity duration-150 ease-out group-hover:opacity-100"
                    />
                    <div className={CAT_DIVIDER_CELL}>
                      <button
                        type="button"
                        onClick={() => setSubPanel(r)}
                        className={`min-w-0 flex-1 truncate text-left transition-colors hover:text-[#2F68E5] hover:underline ${skin.tName}`}
                      >
                        {r.name}
                      </button>
                    </div>
                    <div className={`min-w-0 truncate ${skin.tSec}`}>{r.category}</div>
                    {/* AI suggested — sub-category level only */}
                    <div className="min-w-0">
                      {computingCats?.has(r.category.toLowerCase()) ? (
                        <ComputingCell />
                      ) : r.aiSub == null ? (
                        <Dash />
                      ) : (
                        <>
                          <p className={skin.tName}>{r.aiSub} days</p>
                          <p
                            className="truncate text-[12px] font-semibold leading-[20px] tracking-[-0.01em]"
                            style={{ color: CONF_META_DS[r.aiSubConf].color }}
                          >
                            {CONF_META_DS[r.aiSubConf].label}
                          </p>
                        </>
                      )}
                    </div>
                    {/* Manual override — what is set at this level, nothing inherited */}
                    <div className="min-w-0">
                      {manual != null ? (
                        <>
                          <p className={skin.tName}>{manual} days</p>
                          <p className={`truncate ${cap}`}>Sub-category</p>
                        </>
                      ) : (
                        <Dash />
                      )}
                    </div>
                    {/* Effective — sub manual → sub AI → category → global */}
                    <div className="min-w-0">
                      {eff.days != null ? <EffectiveCell res={eff} /> : <Dash />}
                    </div>
                    <div className="min-w-0">
                      {buf.days != null ? <BufferCell buf={buf} /> : <Dash />}
                    </div>
                  </div>
                );
              })}
              {subRows.length === 0 && <EmptyListing entity={entity} />}
              </div>
            </div>
          ) : view === "product" ? (
            /* Horizontal scroll container; min-w-max lets the fixed tracks set
               the width so the header and every row stay in step. */
            <div className="overflow-x-auto rounded-b-lg">
              <div className="min-w-max">
              {/* Header */}
              <div className={`grid items-center gap-4 ${PROD_COLS} ${headBand}`}>
                <div className={PROD_STICKY_HEAD}><HeadCell>Product name</HeadCell></div>
                <HeadCell>Product group</HeadCell>
                <HeadCell>Category</HeadCell>
                <HeadCell tip={TIP_AI}>AI suggested</HeadCell>
                <HeadCell tip={TIP_MANUAL}>Manual override</HeadCell>
                <HeadCell tip={TIP_EFFECTIVE}>Effective due</HeadCell>
                <HeadCell tip={TIP_REMIND} tipAlign="right">Remind before due</HeadCell>
              </div>
              {/* Rows */}
              <div>
              {prodRows.map((r) => {
                const ov = prodOverrides[r.id];
                const manual = ov?.repl?.mode === "custom" ? ov.repl.days : null;
                const eff = resolveReplenishment(r, cfg);
                const buf = resolveBuffer(r, cfg);
                return (
                  <div
                    key={r.name + r.id}
                    className={[
                      "group relative grid items-center gap-4",
                      PROD_COLS,
                      skin.rowCls,
                      "last:border-0",
                    ].join(" ")}
                  >
                    <div className={PROD_STICKY_CELL}>
                      {/* Left accent is part of the hover treatment, not a persistent selection. */}
                      <span
                        aria-hidden
                        className="absolute left-0 top-0 h-full w-[3px] bg-[#2F68E5] opacity-0 transition-opacity duration-150 ease-out group-hover:opacity-100"
                      />
                      <div className="flex h-full min-w-0 items-center gap-2.5">
                      <img src={dairyImg} alt="" className={skin.thumbCls} />
                      <div className="min-w-0 flex-1">
                        <button
                          type="button"
                          onClick={() => setProdPanel(r)}
                          className={`block w-full truncate text-left transition-colors hover:text-[#2F68E5] hover:underline ${skin.tName}`}
                        >
                          {r.name}
                        </button>
                        <p className={`truncate ${cap}`}>ID : {r.id}</p>
                      </div>
                      </div>
                    </div>
                    <div className={`min-w-0 truncate ${skin.tSec}`}>{r.group}</div>
                    <div className={`min-w-0 truncate ${skin.tSec}`}>{r.category}</div>
                    {/* AI suggested — product level only */}
                    <div className="min-w-0">
                      {computingCats?.has(r.category.toLowerCase()) ? (
                        <ComputingCell />
                      ) : r.aiProd != null ? (
                        <>
                          <p className={skin.tName}>{r.aiProd} days</p>
                          <p
                            className="truncate text-[12px] font-semibold leading-[20px] tracking-[-0.01em]"
                            style={{ color: CONF_META_DS[r.aiProdConf].color }}
                          >
                            {CONF_META_DS[r.aiProdConf].label}
                          </p>
                        </>
                      ) : (
                        <Dash />
                      )}
                    </div>
                    {/* Manual override — what is set on the product itself */}
                    <div className="min-w-0">
                      {manual != null ? (
                        <>
                          <p className={skin.tName}>{manual} days</p>
                          <p className={`truncate ${cap}`}>Product</p>
                        </>
                      ) : (
                        <Dash />
                      )}
                    </div>
                    {/* Effective — the full priority hierarchy, via the resolver */}
                    <div className="min-w-0">
                      {eff.days != null ? <EffectiveCell res={eff} /> : <Dash />}
                    </div>
                    {/* Remind before trigger — same hierarchy, same treatment */}
                    <div className="min-w-0">
                      {buf.days != null ? <BufferCell buf={buf} /> : <Dash />}
                    </div>
                  </div>
                );
              })}
              {prodRows.length === 0 && <EmptyListing entity={entity} />}
              </div>
              </div>
            </div>
          ) : view === "group" ? (
            /* Same scroll container, tracks and pinned first column as the
               Product view; the Group name cell is text-only (no thumbnail). */
            <div className="overflow-x-auto rounded-b-lg">
              <div className="min-w-max">
              {/* Header */}
              <div className={`grid items-center gap-4 ${PROD_COLS} ${headBand}`}>
                <div className={PROD_STICKY_HEAD}><HeadCell>Group name</HeadCell></div>
                <HeadCell>Sub-category</HeadCell>
                <HeadCell>Category</HeadCell>
                <HeadCell tip={TIP_AI}>AI suggested</HeadCell>
                <HeadCell tip={TIP_MANUAL}>Manual override</HeadCell>
                <HeadCell tip={TIP_EFFECTIVE}>Effective due</HeadCell>
                <HeadCell tip={TIP_REMIND} tipAlign="right">Remind before due</HeadCell>
              </div>
              {/* Rows */}
              <div>
              {groupRows.map((r) => {
                const ov = groupOverrides[r.name];
                const manual = ov?.repl?.mode === "custom" ? ov.repl.days : null;
                const eff = resolveGroup(r.name, r.category, cfg);
                const buf = resolveGroupBuffer(r.name, r.category, cfg);
                return (
                  <div
                    key={r.name}
                    className={[
                      "group relative grid items-center gap-4",
                      PROD_COLS,
                      skin.rowCls,
                      /* Fixed row height: the two-line (value + caption) row's
                         height, so rows showing only dashes stay the same. */
                      "min-h-[67px]",
                      "last:border-0",
                    ].join(" ")}
                  >
                    <div className={PROD_STICKY_CELL}>
                      {/* Left accent is part of the hover treatment, not a persistent selection. */}
                      <span
                        aria-hidden
                        className="absolute left-0 top-0 h-full w-[3px] bg-[#2F68E5] opacity-0 transition-opacity duration-150 ease-out group-hover:opacity-100"
                      />
                      <div className="flex h-full min-w-0 items-center">
                        <button
                          type="button"
                          onClick={() => setGroupPanel(r)}
                          className={`block w-full truncate text-left transition-colors hover:text-[#2F68E5] hover:underline ${skin.tName}`}
                        >
                          {r.name}
                        </button>
                      </div>
                    </div>
                    <div className={`min-w-0 truncate ${skin.tSec}`}>{r.sub}</div>
                    <div className={`min-w-0 truncate ${skin.tSec}`}>{r.category}</div>
                    {/* AI suggested — group level only */}
                    <div className="min-w-0">
                      {computingCats?.has(r.category.toLowerCase()) ? (
                        <ComputingCell />
                      ) : r.aiGroup != null ? (
                        <>
                          <p className={skin.tName}>{r.aiGroup} days</p>
                          <p
                            className="truncate text-[12px] font-semibold leading-[20px] tracking-[-0.01em]"
                            style={{ color: CONF_META_DS[r.aiGroupConf].color }}
                          >
                            {CONF_META_DS[r.aiGroupConf].label}
                          </p>
                        </>
                      ) : (
                        <Dash />
                      )}
                    </div>
                    {/* Manual override — what is set on the group itself */}
                    <div className="min-w-0">
                      {manual != null ? (
                        <>
                          <p className={skin.tName}>{manual} days</p>
                          <p className={`truncate ${cap}`}>Group</p>
                        </>
                      ) : (
                        <Dash />
                      )}
                    </div>
                    {/* Effective — group manual → group AI → category → global */}
                    <div className="min-w-0">
                      {eff.days != null ? <EffectiveCell res={eff} /> : <Dash />}
                    </div>
                    <div className="min-w-0">
                      {buf.days != null ? <BufferCell buf={buf} /> : <Dash />}
                    </div>
                  </div>
                );
              })}
              {groupRows.length === 0 && <EmptyListing entity={entity} />}
              </div>
              </div>
            </div>
          ) : (
            <EmptyListing entity={entity} placeholder />
          )}
        </div>

        {!bigBazaar && <ListingPagination />}
      </DSScope.Provider>

      <SuccessToast visible={bbToast} message={SETUP_REQUESTED_TOAST} z="z-[60]" />

      <GlobalSettingsPanel
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        minVal={minVal}
        setMinVal={setMinVal}
        catalogName={catalogName}
        fbOn={fbOn}
        setFbOn={setFbOn}
        fbVal={fbVal}
        setFbVal={setFbVal}
        bufOn={bufOn}
        setBufOn={setBufOn}
        bufVal={bufVal}
        setBufVal={setBufVal}
      />

      {catPanel && (
        <CategoryConfigPanel
          row={catPanel}
          cfg={cfg}
          initial={catOverrides[catPanel.name]}
          onClose={() => setCatPanel(null)}
          onSave={(name, ov) => {
            setCatOverrides((prev) => ({ ...prev, [name]: ov }));
            setCatPanel(null);
          }}
        />
      )}

      {/* Product config panel */}
      {prodPanel && (
        <ProductConfigPanel
          row={prodPanel}
          cfg={cfg}
          initial={prodOverrides[prodPanel.id]}
          onClose={() => setProdPanel(null)}
          onSave={(id, ov) => {
            setProdOverrides((prev) => ({ ...prev, [id]: ov }));
            setProdPanel(null);
          }}
        />
      )}

      {/* Sub-category config panel — the Category panel with a sub-category as its subject */}
      {subPanel && (
        <SubCategoryConfigPanel
          row={subPanel}
          cfg={cfg}
          initial={subOverrides[subPanel.name]}
          onClose={() => setSubPanel(null)}
          onSave={(name, ov) => {
            setSubOverrides((prev) => ({ ...prev, [name]: ov }));
            setSubPanel(null);
          }}
        />
      )}

      {/* Group config panel — the Product panel with a group as its subject */}
      {groupPanel && (
        <GroupConfigPanel
          row={groupPanel}
          cfg={cfg}
          initial={groupOverrides[groupPanel.name]}
          onClose={() => setGroupPanel(null)}
          onSave={(name, ov) => {
            setGroupOverrides((prev) => ({ ...prev, [name]: ov }));
            setGroupPanel(null);
          }}
        />
      )}

      {/* ─── TEMPORARILY DISABLED — onboarding nudge render ─────────────────────
      {nudgeStep !== null && targetRect && (
        <NudgeOverlay
          step={nudgeStep}
          targetRect={targetRect}
          onNext={advanceNudge}
          onDismiss={dismissNudge}
        />
      )}
      ──────────────────────────────────────────────────────────────────────── */}
    </div>
  );
}

/* ----------------------------- Global settings side panel ----------------------------- */

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
      className={`relative h-[18px] w-[32px] shrink-0 rounded-full transition-colors duration-200 ${on ? "bg-[#00c48c]" : "bg-[#8a8aa1]"}`}
    >
      <span
        className={`absolute top-1/2 size-[13px] -translate-y-1/2 rounded-full bg-white shadow-sm transition-all duration-200 ${on ? "left-[16px]" : "left-[2.5px]"}`}
      />
    </button>
  );
}

function StepperInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="relative w-[150px]">
      <input
        type="text"
        inputMode="numeric"
        value={value}
        onChange={(e) => {
          const n = parseInt(e.target.value.replace(/\D/g, ""), 10);
          onChange(Number.isNaN(n) ? 0 : n);
        }}
        className="h-[44px] w-full rounded-lg border border-[#DDE2EE] bg-[#f4f5f8] pl-4 pr-9 text-[14px] font-medium text-[#17173A] outline-none transition-all focus:border-[#2F68E5] focus:bg-white focus:shadow-[0_0_0_3px_rgba(47,75,229,0.08)]"
      />
      <div className="absolute right-2 top-1/2 flex -translate-y-1/2 flex-col gap-[3px]">
        <button type="button" onClick={() => onChange(value + 1)} aria-label="Increase" className="text-[#9494AE] hover:text-[#17173A]">
          <svg viewBox="0 0 12 8" className="size-3" fill="none"><path d="m2 6 4-4 4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>
        <button type="button" onClick={() => onChange(Math.max(0, value - 1))} aria-label="Decrease" className="text-[#9494AE] hover:text-[#17173A]">
          <svg viewBox="0 0 12 8" className="size-3" fill="none"><path d="m2 2 4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>
      </div>
    </div>
  );
}

function UnitSelect() {
  return (
    <div className="relative w-[150px]">
      <select
        defaultValue="days"
        className="h-[44px] w-full appearance-none rounded-lg border border-[#DDE2EE] bg-[#f4f5f8] pl-4 pr-9 text-[14px] font-medium text-[#17173A] outline-none transition-all focus:border-[#2F68E5] focus:bg-white focus:shadow-[0_0_0_3px_rgba(47,75,229,0.08)]"
      >
        <option value="days">days</option>
        <option value="weeks">weeks</option>
        <option value="months">months</option>
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-[#6F6F8D]" />
    </div>
  );
}

function HelperStrip({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-4 rounded-md bg-[#f4f7ff] px-4 py-3 text-[13px] leading-relaxed text-[#4a4a68]">
      {children}
    </div>
  );
}

function SettingCard({
  title,
  description,
  on,
  onToggle,
  children,
}: {
  title: string;
  description: React.ReactNode;
  on: boolean;
  onToggle: (v: boolean) => void;
  children?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-[#DDE2EE] bg-white px-6 py-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="text-[14px] font-bold text-[#17173A]">{title}</h3>
          <p className="mt-1.5 max-w-[560px] text-[13px] leading-relaxed text-[#6F6F8D]">{description}</p>
        </div>
        <Toggle on={on} onChange={onToggle} />
      </div>
      {on && children && <div className="mt-5">{children}</div>}
    </div>
  );
}

/* ─── Replenishment timing (Global settings, tab 1) ─────────────────────────
   Structure: one live preview of the resulting timeline, then the three
   settings that drive it. Controls reuse the shared StepperInput / UnitSelect /
   Toggle / HelperStrip so this tab stays on the same components as the others.
──────────────────────────────────────────────────────────────────────────── */

/* Infinity §6.1 input and §6.10 select, at the documented metrics: white fill,
   1px #D9D9E8, radius 4, 13px/500, hover #9898B0 on #F6F8FF, focus 1.5px
   #2F68E5 + brand ring. The legacy StepperInput / UnitSelect above are still
   used by the category and product panels, so they are left untouched. */
const DS_FIELD =
  "h-8 w-[132px] rounded-sm border border-[#D9D9E8] bg-white text-[13px] font-semibold leading-[21px] tracking-[-0.01em] text-[#17173A] outline-none transition-[border-color,background-color,box-shadow] duration-150 ease-out hover:border-[#9898B0] hover:bg-[#F6F8FF] focus:border-[1.5px] focus:border-[#2F68E5] focus:bg-white focus:shadow-[0_0_0_4px_rgba(47,104,229,0.15)]";

function DSNumberField({
  value, onChange, min = 1, max = 365,
}: {
  value: number;
  onChange: (v: number) => void;
  /** Hard floor — the control cannot be typed or stepped below this. */
  min?: number;
  /** Hard ceiling — used where a larger value would be logically invalid. */
  max?: number;
}) {
  const clamp = (n: number) => Math.max(min, Math.min(max, n));
  return (
    <div className="relative">
      <input
        type="text"
        inputMode="numeric"
        aria-label="Value"
        value={value}
        onChange={(e) => {
          const n = parseInt(e.target.value.replace(/\D/g, ""), 10);
          onChange(Number.isNaN(n) ? min : clamp(n));
        }}
        className={`${DS_FIELD} pl-3 pr-8`}
      />
      <div className="pointer-events-none absolute right-2.5 top-1/2 flex -translate-y-1/2 flex-col gap-[2px]">
        <button
          type="button"
          aria-label="Increase"
          disabled={value >= max}
          onClick={() => onChange(clamp(value + 1))}
          className="pointer-events-auto text-[#9494AE] transition-colors hover:text-[#17173A] disabled:cursor-not-allowed disabled:text-[#D9D9E8] disabled:hover:text-[#D9D9E8]"
        >
          <svg viewBox="0 0 12 8" className="size-[11px]" fill="none"><path d="m2 6 4-4 4 4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>
        <button
          type="button"
          aria-label="Decrease"
          disabled={value <= min}
          onClick={() => onChange(clamp(value - 1))}
          className="pointer-events-auto text-[#9494AE] transition-colors hover:text-[#17173A] disabled:cursor-not-allowed disabled:text-[#D9D9E8] disabled:hover:text-[#D9D9E8]"
        >
          <svg viewBox="0 0 12 8" className="size-[11px]" fill="none"><path d="m2 2 4 4 4-4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>
      </div>
    </div>
  );
}

/* Unit picker — the project's Infinity DS <Dropdown> (DS §6.1 field, Figma
   menu 683:3886). `overlay` portals the menu so the scrolling panel can't clip
   it. Not a native <select>. */
function DSUnitSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <Dropdown
      value={value}
      onChange={onChange}
      options={[
        { value: "days", label: "days" },
        { value: "weeks", label: "weeks" },
        { value: "months", label: "months" },
      ]}
      minWidth={132}
      overlay
    />
  );
}

/* ─── Shared preview timeline ────────────────────────────────────────────────
   The presentational half of the fallback / category / product previews: a
   thin rail on the pale #F9FBFF band, an announce marker sitting on the rail
   at each reminder point with its day + caption above, and the Day 0 / due
   date endpoints hanging below on thin neutral ticks. All three previews
   render through this, so there is exactly one implementation of the visual
   language.

   Markers carry a raw percentage; this component owns the de-collision so the
   labels can never overlap or leave the band at any configured value. */
/* `at` is the marker's position along the rail, 0-100. The first marker is
   anchored by the timeline itself and ignores it. `accent` paints the day in
   the brand blue (the reminder that will actually be sent). */
type TimelineMarker = {
  /* "important" — earliest reminder possible (tooltip only, no caption);
     "announce" — the reminder that will be sent (captioned);
     "none" — no reminder, shown at the due-date end when nothing is set. */
  icon: "important" | "announce" | "none";
  /* Caption above the marker (announce only). */
  day?: string;
  label?: string;
  accent?: boolean;
  /* Hover tooltip lines (important only). */
  tip?: [string, string];
  /* Position along the rail, 0-100. The first marker ignores it. */
  at?: number;
};

/* The send marker reads relative to the due date: "3 days before". */
const daysBefore = (n: number) => `${n} ${n === 1 ? "day" : "days"} before`;
/* The earliest-reminder tooltip reads from purchase: "3 days after purchase". */
const daysAfterPurchase = (n: number) => `${n} ${n === 1 ? "day" : "days"} after purchase`;

function PreviewTimeline({
  title, markers, endRight, endRightSub = "Replenishment due",
}: {
  title: string;
  markers: TimelineMarker[];
  endRight: string;
  endRightSub?: string;
}) {
  /* The first marker is a fixed point, not a data-positioned marker. It marks
     the floor every reminder respects, so it stays put as that value changes
     and the rail stays visually stable — only its tooltip value updates. */
  const FIRST_AT = 20;
  const MIN_GAP = 30;   // ≥ the width of the send caption at any panel size

  const a = FIRST_AT;
  /* Clamped at both ends: it never reaches past the rail, and never closes to
     within MIN_GAP of the earliest-reminder marker however large the value gets. */
  const b = markers.length > 1
    ? Math.min(Math.max(markers[1]!.at ?? 100, a + MIN_GAP), 100)
    : a;
  const at = markers.length > 1 ? [a, b] : [a];
  /* Blue spans the reminder-to-due interval — earliest possible reminder →
     replenishment due — and only when a reminder will actually be sent. With
     no due date the second marker is "none" and the rail stays neutral. */
  const hasSend = markers.length > 1 && markers[1]!.icon === "announce";
  const blueFrom = at[0];
  const blueTo = hasSend ? 100 : at[0];

  const anchor = (p: number): React.CSSProperties => ({ left: `${p}%` });

  const Icon = ({ kind }: { kind: TimelineMarker["icon"] }) =>
    kind === "important" ? <NotificationImportantIconDS className="size-4 text-[#17173A]" />
    : kind === "none" ? <NoReminderIconDS className="size-4 text-[#17173A]" />
    : <AnnounceIconDS className="size-4 text-[#17173A]" />;

  return (
    <div className="rounded-lg border border-[#EBEBF5] bg-[#F9FBFF] px-6 py-5">
      <h3 className="text-[14px] font-bold leading-[22px] tracking-[-0.01em] text-[#17173A]">{title}</h3>

      {/* Rail band. Inset so the centred endpoint labels have room either
          side; the space above holds the send-marker caption. */}
      <div className="relative mx-[72px] mt-[92px] h-9">
        {/* Neutral baseline runs a little past both endpoint ticks, out to
            roughly the edges of the centred endpoint labels below. */}
        <div className="absolute -left-14 -right-14 top-1/2 h-[2px] -translate-y-1/2 rounded-full bg-[#DDE2EE]" />
        <div
          className="absolute top-1/2 h-[2px] -translate-y-1/2 bg-[#2F68E5]"
          style={{ left: `${blueFrom}%`, width: `${Math.max(0, blueTo - blueFrom)}%` }}
        />

        {/* Endpoint ticks: thin neutral verticals from the rail down to the
            Day 0 / due-date labels. */}
        <span aria-hidden className="absolute left-0 top-1/2 h-[30px] w-px bg-[#C9D2E6]" />
        <span aria-hidden className="absolute right-0 top-1/2 h-[30px] w-px bg-[#C9D2E6]" />

        {/* Markers: icon on a pale square sitting on the rail. The earliest
            marker explains itself on hover; the send marker carries its day +
            caption above, joined by a short connector. */}
        {markers.map((m, i) => (
          <span key={m.icon} className="group/tip absolute top-1/2 -translate-x-1/2 -translate-y-1/2" style={anchor(at[i])}>
            <span className={`grid size-9 place-items-center rounded-lg bg-[#E6EDFB] ${m.tip ? "cursor-help" : ""}`}>
              <Icon kind={m.icon} />
            </span>

            {m.day && (
              <span className="absolute bottom-full left-1/2 flex -translate-x-1/2 flex-col items-center whitespace-nowrap text-center">
                <span className={`text-[14px] font-semibold leading-[22px] ${m.accent ? "text-[#2F68E5]" : "text-[#17173A]"}`}>
                  {m.day}
                </span>
                <span className="text-[13px] leading-[20px] text-[#6F6F8D]">{m.label}</span>
                <span aria-hidden className="mt-1 block h-[10px] w-px bg-[#C9D2E6]" />
              </span>
            )}

            {m.tip && (
              /* DS §12.4 tooltip: #17173A, 12/500, radius 6 — below the marker,
                 caret pointing up at it. */
              <span
                role="tooltip"
                className="pointer-events-none absolute left-1/2 top-full z-20 mt-2 -translate-x-1/2 whitespace-nowrap rounded-md bg-[#17173A] px-3 py-2 text-left text-[12px] leading-[18px] tracking-[-0.01em] text-white opacity-0 shadow-[0_1px_3px_rgba(23,23,58,0.10)] transition-opacity duration-150 group-hover/tip:opacity-100"
              >
                <span aria-hidden className="absolute -top-1 left-1/2 size-2 -translate-x-1/2 rotate-45 bg-[#17173A]" />
                <span className="block font-semibold">{m.tip[0]}</span>
                <span className="block font-medium">{m.tip[1]}</span>
              </span>
            )}
          </span>
        ))}
      </div>

      {/* Endpoints, centred under their ticks */}
      <div className="relative mx-[72px] mt-[18px] h-[42px]">
        <div className="absolute left-0 -translate-x-1/2 whitespace-nowrap text-center">
          <p className="text-[14px] font-semibold leading-[22px] text-[#17173A]">Day 0</p>
          <p className="text-[13px] leading-[20px] text-[#6F6F8D]">Product purchase</p>
        </div>
        <div className="absolute right-0 translate-x-1/2 whitespace-nowrap text-center">
          <p className="text-[14px] font-semibold leading-[22px] text-[#17173A]">{endRight}</p>
          <p className="text-[13px] leading-[20px] text-[#6F6F8D]">{endRightSub}</p>
        </div>
      </div>
    </div>
  );
}

/* Global Settings preview: a product with no predicted period of its own, so
   the fallback decides when it is due. Purely derived from the live (unsaved)
   configuration — every marker moves as the values change. */
function TimingPreview({
  minVal, fbOn, fbVal, bufOn, bufVal,
}: {
  minVal: number;
  fbOn: boolean; fbVal: number;
  bufOn: boolean; bufVal: number;
}) {
  /* The minimum reminder is a fixed baseline — it always applies. */
  const minDay = Math.max(0, minVal);
  /* The minimum is a floor on the whole period, so it can push the due date out. */
  const dueDay = fbOn ? Math.max(fbVal, minDay) : null;
  /* A reminder can never be scheduled before the minimum. */
  const reminderDay =
    dueDay == null ? null : Math.max(minDay, bufOn ? dueDay - bufVal : dueDay);

  /* With no fallback there is no end date, so the rail runs on a nominal scale
     that still places the minimum marker sensibly. */
  const scale = dueDay ?? Math.max(minDay * 5, 15);
  const pct = (d: number) => Math.max(0, Math.min(100, (d / scale) * 100));

  /* A reminder exists as soon as there is a due date to work back from; the
     buffer only decides how far ahead of it the reminder is sent. Without a
     due date there is no send marker at all. */
  return (
    <PreviewTimeline
      title="Preview for products relying on fallback"
      endRight={dueDay == null ? "No Reminder" : `Day ${dueDay}`}
      endRightSub={dueDay == null ? "Fallback is not set" : "Replenishment due"}
      markers={[
        { icon: "important", tip: [daysAfterPurchase(minDay), "Earliest reminder possible"] },
        dueDay == null || reminderDay == null
          ? { icon: "none", at: 100 }
          : { icon: "announce", day: daysBefore(dueDay - reminderDay), label: "Send reminder", at: pct(reminderDay), accent: true },
      ]}
    />
  );
}

/* Shown when the configured reminder has been pushed as early as the global
   minimum wait allows. The ceiling is derived, never a constant: it is the gap
   between the effective replenishment period and that minimum. */
function MinWaitNotice({ minVal }: { minVal: number }) {
  return (
    <p className="mt-3 rounded-md bg-[#FFF3F3] px-4 py-2.5 text-[13px] leading-[20px] text-[#17173A]">
      {"You can't remind earlier than this because of the "}
      {minVal} {minVal === 1 ? "day" : "days"} minimum wait defined in your global settings.
    </p>
  );
}

/* One timing setting. Collapsed it is title + one line + toggle; enabling it
   reveals the controls and the rule that applies. */
function TimingCard({
  title, description, on, onToggle, locked, children, note,
}: {
  title: string;
  description: string;
  on: boolean;
  onToggle?: (v: boolean) => void;
  /** Always-on setting: the switch still shows the state, but is inert. */
  locked?: boolean;
  children?: React.ReactNode;
  note?: string;
}) {
  return (
    <div className="rounded-lg border border-[#EBEBF5] bg-white px-6 py-5">
      <div className="flex items-start justify-between gap-5">
        <div className="min-w-0">
          <h3 className="text-[14px] font-bold leading-[22px] tracking-[-0.01em] text-[#17173A]">{title}</h3>
          <p className="mt-1 max-w-[560px] text-[13px] leading-[20px] text-[#6F6F8D]">{description}</p>
        </div>
        {locked ? (
          <span className="shrink-0 cursor-not-allowed" title="Always applied">
            <span aria-disabled className="pointer-events-none block opacity-50">
              <Toggle on onChange={() => {}} />
            </span>
          </span>
        ) : (
          <Toggle on={on} onChange={onToggle!} />
        )}
      </div>
      {on && (
        <>
          <div className="mt-4 flex flex-wrap items-center gap-3">{children}</div>
          {note && <HelperStrip>{note}</HelperStrip>}
        </>
      )}
    </div>
  );
}

/* The replenishment reminder can never be scheduled sooner than this. */
const MIN_REMINDER_DAYS = 3;

const SETTINGS_TABS = [
  "Set reminder",
  "Communication",
] as const;

/* ─── Manage Items Overlay ──────────────────────────────────────────────────── */

/* How many products a selection covers within one group — the same accounting
   the overlay's own counters use (a selected parent contributes the group's
   full declared size; otherwise only the individually ticked products count).
   The catalogue carries representative product rows plus declared counts, so
   counting rows instead would under-report a group by an order of magnitude. */
function groupCovered(sel: Set<string>, g: (typeof groups)[number]): number {
  if (sel.has(`cat:${g.catId}`) || sel.has(`sub:${g.subId}`) || sel.has(`group:${g.id}`)) {
    return g.productCount;
  }
  return products.filter((p) => p.groupId === g.id && sel.has(`prod:${p.id}`)).length;
}

type SelectionDiff = { added: number; removed: number };

/* What changed between the saved configuration and the pending one, resolved
   group by group so a category or group toggle reports the products it
   actually brought in or took out rather than a single item. */
function diffSelection(before: Set<string>, after: Set<string>): SelectionDiff {
  let added = 0;
  let removed = 0;
  for (const g of groups) {
    const b = groupCovered(before, g);
    const a = groupCovered(after, g);
    if (a > b) added += a - b;
    else if (b > a) removed += b - a;
  }
  return { added, removed };
}

/* Categories whose covered product count went up between two selections — the
   ones whose AI suggestions have yet to be computed. Same groupCovered
   accounting as the diff, so it agrees with the counts the modal reports. */
function newlyCoveredCategories(before: Set<string>, after: Set<string>): Set<string> {
  const out = new Set<string>();
  for (const c of categories) {
    const gs = groups.filter((g) => g.catId === c.id);
    const total = (sel: Set<string>) => gs.reduce((a, g) => a + groupCovered(sel, g), 0);
    if (total(after) > total(before)) out.add(c.name.toLowerCase());
  }
  return out;
}

/* Of the products being removed, how many a live journey is triggering on.
   Measured per group as the shrinkage of the overlap between the included
   selection and the journey's own scope. */
function removedFromJourney(before: Set<string>, after: Set<string>, journey: Set<string>): number {
  if (journey.size === 0) return 0;
  let n = 0;
  for (const g of groups) {
    const j = groupCovered(journey, g);
    if (j === 0) continue;
    const b = Math.min(groupCovered(before, g), j);
    const a = Math.min(groupCovered(after, g), j);
    if (b > a) n += b - a;
  }
  return n;
}

/* ─── Change confirmation ────────────────────────────────────────────────────
   Shown only when the pending selection differs from the saved one. Structure
   mirrors the former setup confirm modal — same shell, type scale and button
   hierarchy — but it confirms a modification to a live configuration rather
   than starting one, so the copy, the summary rows and the CTA all differ.
─────────────────────────────────────────────────────────────────────────── */
function ManageChangesModal({
  diff,
  removedInJourney,
  catCount,
  groupCount,
  totalSelected,
  onCancel,
  onConfirm,
}: {
  diff: SelectionDiff;
  /** Removed products that a published journey is currently triggering on. */
  removedInJourney: number;
  catCount: number;
  groupCount: number;
  totalSelected: number;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const { added, removed } = diff;

  return (
    <div className="fixed inset-0 z-[98] grid place-items-center bg-[rgba(17,17,40,0.45)] p-6 animate-fade-in-up">
      <div className="w-full max-w-[720px] overflow-hidden rounded-2xl bg-white shadow-[0_20px_56px_rgba(17,17,40,0.2)]">

        {/* Header */}
        <div className="px-7 pt-7 pb-4">
          <h3 className="text-[20px] font-bold text-[#17173A] leading-snug">
            Apply these changes to Replenishment?
          </h3>
          <p className="mt-1.5 text-[13.5px] text-[#6F6F8D]">
            {"You're changing which items are included in your live Replenishment setup."}
          </p>
        </div>

        <div className="border-t border-[#DDE2EE]" />

        {/* Updated selection + what changed, per catalog */}
        <div className="px-7 pt-5 pb-4">
          <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.5px] text-[#9494AE]">
            Updated selection
          </p>
          <p className="text-[14px] text-[#17173A]"><span className="font-normal">Catalog : </span><span className="font-bold">{CATALOG.name}</span></p>
          <p className="mt-0.5 text-[13px] text-[#6F6F8D]">
            {catCount} {catCount === 1 ? "category" : "categories"}
            {" · "}
            {groupCount} {groupCount === 1 ? "group" : "groups"}
            {" · "}
            {num(totalSelected)} {totalSelected === 1 ? "product" : "products"}
          </p>

          {/* Only the deltas that actually happened; never a zero row. */}
          <div className="mt-3 flex flex-col gap-2">
            {added > 0 && (
              <div className="flex items-center gap-2">
                <PlusIconDS className="size-3.5 shrink-0 text-[#00A97A]" />
                <p className="text-[13px] font-semibold text-[#00A97A]">
                  {num(added)} new {added === 1 ? "product" : "products"} added
                </p>
              </div>
            )}
            {removed > 0 && (
              <div className="flex items-center gap-2">
                <DashIconDS className="size-3.5 shrink-0 text-[#D64545]" />
                <p className="text-[13px] font-semibold text-[#D64545]">
                  {num(removed)} {removed === 1 ? "product" : "products"} removed
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Journey impact — only when a live journey actually triggers on
            products being removed. */}
        {removedInJourney > 0 && (
          <div className="mx-7 mt-5 mb-1 flex items-start gap-2.5 rounded-lg border border-[#F3D9A6] bg-[#FDF8EC] px-4 py-3.5">
            <WarningCircleIconDS className="mt-[1px] size-4 shrink-0 text-[#C88A1E]" />
            <p className="text-[13px] leading-relaxed text-[#17173A]">
              <span className="font-semibold">
                {num(removedInJourney)} of the {removed === 1 ? "product" : "products"} {"you're"} removing {removedInJourney === 1 ? "is" : "are"} in an active replenishment journey.
              </span>
              <span className="text-[#6F6F8D]">
                {" "}{removedInJourney === 1 ? "It will" : "They will"} stop triggering reminders from that journey once you apply these changes.
              </span>
            </p>
          </div>
        )}

        {/* What applying this will mean — one strip per kind of change, shown
            only for the kinds actually present. */}
        {(added > 0 || removed > 0) && (
          <>
            <div className="border-t border-[#DDE2EE]" />
            <div className="mx-7 mt-5 flex flex-col gap-2">
              {added > 0 && (
                <ConsequenceStrip tone="added">
                  It will take 24–48 hours to compute the AI suggestions for the newly added products
                </ConsequenceStrip>
              )}
              {removed > 0 && (
                <ConsequenceStrip tone="removed">
                  If the removed products were part of an ongoing journey, they will be removed from future communication
                </ConsequenceStrip>
              )}
            </div>
          </>
        )}

        {/* Footer CTAs */}
        <div className="flex items-center justify-end gap-2.5 px-7 py-5">
          <button
            type="button"
            onClick={onCancel}
            className="h-9 rounded-lg border border-[#DDE2EE] bg-white px-5 text-[13px] font-semibold text-[#17173A] transition-colors hover:bg-[#F4F8FF]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="h-9 rounded-lg bg-[#2F68E5] px-5 text-[13px] font-semibold text-white transition-colors hover:bg-[#1F54C7]"
          >
            Apply changes
          </button>
        </div>
      </div>
    </div>
  );
}

/* A one-line consequence of the pending change, in the same accented-strip
   treatment the product count and eligibility notes already use. */
function ConsequenceStrip({ tone, children }: { tone: "added" | "removed"; children: React.ReactNode }) {
  const skin =
    tone === "added"
      ? "border-[#00C48C] bg-[#EAF8F2]"
      : "border-[#F05C5C] bg-[#FDEDED]";
  return (
    <div className={`rounded-[4px] border-l-2 px-4 py-2.5 ${skin}`}>
      <p className="text-[13px] leading-[21px] tracking-[-0.01em] text-[#17173A]">{children}</p>
    </div>
  );
}

/* Success toast — the app's existing green confirmation, lifted out of the
   page so the Manage items overlay can show it above itself. */
function SuccessToast({ visible, message, z = "z-[100]" }: { visible: boolean; message: string; z?: string }) {
  return (
    <div
      className={[
        "fixed bottom-7 left-1/2 -translate-x-1/2 transition-all duration-300",
        z,
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none",
      ].join(" ")}
    >
      <div className="flex items-center gap-2.5 rounded-[4px] bg-[#12b76a] px-4 py-3.5">
        <svg viewBox="0 0 18 18" fill="none" className="size-[18px] shrink-0">
          <circle cx="9" cy="9" r="7.5" stroke="white" strokeWidth="1.5" />
          <path d="M5.5 9l2.5 2.5 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <p className="text-[14px] font-bold text-white leading-[20px] tracking-[0.42px] whitespace-nowrap">
          {message}
        </p>
      </div>
    </div>
  );
}

function ManageItemsOverlay({
  initialSel,
  journeySel,
  onClose,
  onApply,
}: {
  initialSel: Set<string>;
  /** What a published journey currently triggers on; empty when none is live. */
  journeySel: Set<string>;
  onClose: () => void;
  onApply: (sel: Set<string>, newlyAddedCategories: Set<string>) => void;
}) {
  /* Two selections: what is saved (the baseline the diff is measured against)
     and what the user is editing. Nothing reaches the real configuration until
     the change is confirmed, and closing the overlay simply drops the pending
     one. After a successful apply the baseline moves up, so re-confirming
     without further edits is correctly a no-op. */
  const [baseSel, setBaseSel] = useState<Set<string>>(new Set(initialSel));
  const [sel, setSel] = useState<Set<string>>(new Set(initialSel));
  const [confirming, setConfirming] = useState(false);
  const [applied, setApplied] = useState(false);
  const appliedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (appliedTimer.current) clearTimeout(appliedTimer.current); }, []);
  const [view, setView] = useState<ViewBy>("category");
  const [query, setQuery] = useState("");
  const [catFilter, setCatFilter] = useState("all");
  const [subFilter, setSubFilter] = useState("all");
  const [groupFilter, setGroupFilter] = useState("all");
  const [previewView, setPreviewView] = useState<PreviewView>("products");

  const has = (k: string) => sel.has(k);

  const isProductCovered = (p: (typeof products)[number]) =>
    has(`cat:${p.catId}`) || has(`sub:${p.subId}`) || has(`group:${p.groupId}`);

  const coverageLabel = (p: (typeof products)[number]): string | null => {
    if (has(`cat:${p.catId}`)) return `via ${p.catName}`;
    if (has(`sub:${p.subId}`)) return `via ${p.subName}`;
    if (has(`group:${p.groupId}`)) return `via ${p.groupName}`;
    return null;
  };

  const catContribution = (catId: string): number => {
    if (has(`cat:${catId}`)) return catById(catId)!.productCount;
    let total = 0;
    for (const s of subsOf(catId)) {
      if (has(`sub:${s.id}`)) {
        total += s.productCount;
      } else {
        for (const g of groupsOf(s.id)) if (has(`group:${g.id}`)) total += g.productCount;
        total += products.filter((p) => p.subId === s.id && has(`prod:${p.id}`) && !has(`group:${p.groupId}`)).length;
      }
    }
    return total;
  };

  const subContribution = (subId: string): number => {
    const s = subs.find((x) => x.id === subId)!;
    if (has(`cat:${s.catId}`) || has(`sub:${subId}`)) return s.productCount;
    let total = 0;
    for (const g of groupsOf(subId)) if (has(`group:${g.id}`)) total += g.productCount;
    total += products.filter((p) => p.subId === subId && has(`prod:${p.id}`) && !has(`group:${p.groupId}`)).length;
    return total;
  };

  const groupContribution = (groupId: string): number => {
    const g = groups.find((x) => x.id === groupId)!;
    if (has(`cat:${g.catId}`) || has(`sub:${g.subId}`) || has(`group:${groupId}`)) return g.productCount;
    return products.filter((p) => p.groupId === groupId && has(`prod:${p.id}`)).length;
  };

  const totalSelected = useMemo(() => categories.reduce((a, c) => a + catContribution(c.id), 0), [sel]);
  const selectedCatIds = useMemo(() => categories.filter((c) => catContribution(c.id) > 0).map((c) => c.id), [sel]);
  const selectedSubIds = useMemo(() => subs.filter((s) => subContribution(s.id) > 0).map((s) => s.id), [sel]);
  const selectedGroupIds = useMemo(() => groups.filter((g) => groupContribution(g.id) > 0).map((g) => g.id), [sel]);

  /* Pending change, resolved to products. Recomputed as the user edits so the
     Continue action always knows whether there is anything to confirm. */
  const diff = useMemo(() => diffSelection(baseSel, sel), [baseSel, sel]);
  const hasChanges = diff.added > 0 || diff.removed > 0;
  /* Of the products being removed, those a live journey triggers on today. */
  const removedInJourney = useMemo(
    () => removedFromJourney(baseSel, sel, journeySel),
    [baseSel, sel, journeySel],
  );

  /* Nothing changed → there is nothing to confirm, so Continue just leaves. */
  const handleContinue = () => (hasChanges ? setConfirming(true) : onClose());

  const applyChanges = () => {
    const next = new Set(sel);
    onApply(next, newlyCoveredCategories(baseSel, next));
    setBaseSel(next);
    setConfirming(false);
    setApplied(true);
    if (appliedTimer.current) clearTimeout(appliedTimer.current);
    appliedTimer.current = setTimeout(() => setApplied(false), 3500);
  };

  function mutate(fn: (next: Set<string>) => void) {
    setSel((prev) => { const next = new Set(prev); fn(next); return next; });
  }

  function removeDescendants(next: Set<string>, opts: { catId?: string; subId?: string; groupId?: string }) {
    for (const k of Array.from(next)) {
      const [lvl, id] = k.split(":");
      if (opts.catId) {
        if (lvl === "sub" && subs.find((s) => s.id === id)?.catId === opts.catId) next.delete(k);
        if (lvl === "group" && groups.find((g) => g.id === id)?.catId === opts.catId) next.delete(k);
        if (lvl === "prod" && products.find((p) => p.id === id)?.catId === opts.catId) next.delete(k);
      }
      if (opts.subId) {
        if (lvl === "group" && groups.find((g) => g.id === id)?.subId === opts.subId) next.delete(k);
        if (lvl === "prod" && products.find((p) => p.id === id)?.subId === opts.subId) next.delete(k);
      }
      if (opts.groupId) {
        if (lvl === "prod" && products.find((p) => p.id === id)?.groupId === opts.groupId) next.delete(k);
      }
    }
  }

  const toggleCat = (catId: string) => mutate((next) => {
    if (next.has(`cat:${catId}`)) { next.delete(`cat:${catId}`); removeDescendants(next, { catId }); }
    else { next.add(`cat:${catId}`); removeDescendants(next, { catId }); }
  });

  const toggleSub = (subId: string) => mutate((next) => {
    const s = subs.find((x) => x.id === subId)!;
    if (next.has(`cat:${s.catId}`)) {
      next.delete(`cat:${s.catId}`);
      subsOf(s.catId).filter((x) => x.id !== subId).forEach((x) => next.add(`sub:${x.id}`));
      removeDescendants(next, { subId });
    } else if (next.has(`sub:${subId}`)) {
      next.delete(`sub:${subId}`); removeDescendants(next, { subId });
    } else { next.add(`sub:${subId}`); removeDescendants(next, { subId }); }
  });

  const toggleGroup = (groupId: string) => mutate((next) => {
    const g = groups.find((x) => x.id === groupId)!;
    if (next.has(`cat:${g.catId}`)) {
      next.delete(`cat:${g.catId}`);
      subsOf(g.catId).forEach((s) => {
        if (s.id === g.subId) { groupsOf(s.id).filter((x) => x.id !== groupId).forEach((x) => next.add(`group:${x.id}`)); }
        else { next.add(`sub:${s.id}`); }
      });
    } else if (next.has(`sub:${g.subId}`)) {
      next.delete(`sub:${g.subId}`);
      groupsOf(g.subId).filter((x) => x.id !== groupId).forEach((x) => next.add(`group:${x.id}`));
      removeDescendants(next, { groupId });
    } else if (next.has(`group:${groupId}`)) {
      next.delete(`group:${groupId}`); removeDescendants(next, { groupId });
    } else { next.add(`group:${groupId}`); removeDescendants(next, { groupId }); }
  });

  const toggleProduct = (prodId: string) => mutate((next) => {
    if (next.has(`prod:${prodId}`)) next.delete(`prod:${prodId}`);
    else next.add(`prod:${prodId}`);
  });

  const clearCategory = (catId: string) => mutate((next) => { next.delete(`cat:${catId}`); removeDescendants(next, { catId }); });
  const clearAll = () => setSel(new Set());

  const removeProduct = (prodId: string) => {
    const p = products.find((x) => x.id === prodId)!;
    if (has(`prod:${prodId}`)) { toggleProduct(prodId); return; }
    mutate((next) => {
      if (next.has(`group:${p.groupId}`)) {
        next.delete(`group:${p.groupId}`);
        prodsOfGroup(p.groupId).filter((x) => x.id !== prodId).forEach((x) => next.add(`prod:${x.id}`));
      } else if (next.has(`sub:${p.subId}`)) {
        next.delete(`sub:${p.subId}`);
        groupsOf(p.subId).forEach((g) => {
          if (g.id === p.groupId) { prodsOfGroup(g.id).filter((x) => x.id !== prodId).forEach((x) => next.add(`prod:${x.id}`)); }
          else { next.add(`group:${g.id}`); }
        });
      } else if (next.has(`cat:${p.catId}`)) {
        next.delete(`cat:${p.catId}`);
        subsOf(p.catId).forEach((s) => {
          if (s.id === p.subId) {
            groupsOf(s.id).forEach((g) => {
              if (g.id === p.groupId) { prodsOfGroup(g.id).filter((x) => x.id !== prodId).forEach((x) => next.add(`prod:${x.id}`)); }
              else { next.add(`group:${g.id}`); }
            });
          } else { next.add(`sub:${s.id}`); }
        });
      }
    });
  };

  const q = query.trim().toLowerCase();
  const searching = q.length > 0;
  const catFilterFn = (catId: string) => catFilter === "all" || catId === catFilter;
  const subFilterFn = (subId: string) => subFilter === "all" || subId === subFilter;
  const groupFilterFn = (groupId: string) => groupFilter === "all" || groupId === groupFilter;

  const searchResults = useMemo(() => {
    if (!searching) return [];
    const out: { key: string; level: Exclude<Level, "catalog">; name: string; path: string; count: number }[] = [];
    categories.forEach((c) => { if (c.name.toLowerCase().includes(q)) out.push({ key: `cat:${c.id}`, level: "category", name: c.name, path: "D-Mart Catalog", count: c.productCount }); });
    subs.forEach((s) => { if (s.name.toLowerCase().includes(q)) out.push({ key: `sub:${s.id}`, level: "sub", name: s.name, path: catById(s.catId)!.name, count: s.productCount }); });
    groups.forEach((g) => { if (g.name.toLowerCase().includes(q)) out.push({ key: `group:${g.id}`, level: "group", name: g.name, path: `${catById(g.catId)!.name} › ${subs.find((s) => s.id === g.subId)!.name}`, count: g.productCount }); });
    products.forEach((p) => { if (p.name.toLowerCase().includes(q)) out.push({ key: `prod:${p.id}`, level: "product", name: p.name, path: `${p.catName} › ${p.subName}`, count: 1 }); });
    return out.slice(0, 50);
  }, [q, searching]);

  const catState = (catId: string) => { const checked = has(`cat:${catId}`); return { checked, indeterminate: !checked && catContribution(catId) > 0 }; };
  const subState = (subId: string) => {
    const s = subs.find((x) => x.id === subId)!;
    const checked = has(`cat:${s.catId}`) || has(`sub:${subId}`);
    const partial = !checked && (groupsOf(subId).some((g) => has(`group:${g.id}`)) || products.some((p) => p.subId === subId && has(`prod:${p.id}`)));
    return { checked, indeterminate: partial };
  };
  const groupState = (groupId: string) => {
    const g = groups.find((x) => x.id === groupId)!;
    const checked = has(`cat:${g.catId}`) || has(`sub:${g.subId}`) || has(`group:${groupId}`);
    const partial = !checked && products.some((p) => p.groupId === groupId && has(`prod:${p.id}`));
    return { checked, indeterminate: partial };
  };

  const viewOptions = [
    { value: "category", label: "Category" },
    { value: "sub", label: "Sub-category" },
    { value: "group", label: "Group" },
    { value: "product", label: "Product" },
  ];

  /* Selected-items caption for the selection panel — same derivation as the
     Select products step. */
  const previewNoun: Record<PreviewView, [string, string]> = {
    products: ["", ""],
    subs: ["sub-category", "sub-categories"],
    groups: ["group", "groups"],
    categories: ["category", "categories"],
  };
  const previewRowCount = useMemo(() => {
    if (previewView === "products") {
      return products.filter((p) => isProductCovered(p) || has(`prod:${p.id}`)).length;
    }
    if (previewView === "subs") return selectedSubIds.length;
    if (previewView === "groups") return selectedGroupIds.length;
    return selectedCatIds.length;
  }, [sel, previewView, selectedSubIds, selectedGroupIds, selectedCatIds]);
  const previewSelectedLabel = [
    num(previewRowCount),
    previewNoun[previewView][previewRowCount === 1 ? 0 : 1],
    "selected",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    /* Infinity DS scope, as on the Select products step, so the catalog table,
       search results and panel views render in their updated styling. */
    <DSScope.Provider value={true}>
    <div className="fixed inset-0 z-[90] flex flex-col bg-[#F4F8FF] font-sans text-[#17173A] animate-slide-up">
      {/* Header */}
      <header className="shrink-0 border-b border-[#DDE2EE] bg-white px-6 py-4 flex items-center justify-between gap-4">
        <div>
          <p className="text-[18px] font-bold text-[#17173A] leading-tight">Manage included items</p>
          <p className="text-[12.5px] text-[#6F6F8D] mt-0.5">Update which products, groups and categories are included in Replenishment.</p>
        </div>
        <button type="button" onClick={onClose} className="grid size-8 place-items-center rounded-lg border border-[#DDE2EE] text-[#6F6F8D] hover:border-[#c5cce8] hover:text-[#17173A] transition-colors">
          <CloseIcon className="size-4" />
        </button>
      </header>

      {/* ── Body — same two-column workspace as the Select products step ───
          The two columns are one 2-row grid and each card is
          `grid-rows-subgrid row-span-2`, so both header bands and both card
          bottoms land on the same rules at every width. */}
      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-3 lg:grid lg:grid-cols-[minmax(0,70fr)_minmax(0,30fr)] lg:grid-rows-[auto_minmax(0,1fr)] lg:gap-y-0 lg:overflow-hidden lg:p-4">

        {/* ── Workspace ──────────────────────────────────────────────────── */}
        <section className="flex min-h-0 min-w-0 flex-col overflow-hidden rounded-lg border border-[#D9D9E8] bg-white lg:row-span-2 lg:grid lg:grid-rows-subgrid">

          {/* Workspace header — shared band, row 1 */}
          <div className="flex shrink-0 flex-col justify-between gap-3 border-b border-[#D9D9E8] px-5 pt-5 pb-4">
            <div>
              <h2 className="text-[14px] font-semibold leading-[22px] tracking-[-0.01em] text-[#17173A]">Select what you want to replenish</h2>
              <p className="mt-1 text-[13px] font-medium leading-[21px] tracking-[-0.01em] text-[#6F6F8D]">
                Pick from categories, sub-categories, product groups, or individual products.
                Selecting a parent automatically includes all its children.
              </p>
            </div>

            {/* Catalog | View by | Filters (left) + Search (right) — single row */}
            <div className="flex h-8 items-center gap-2">
              {!searching && (
                <>
                  <Dropdown
                    label="Catalog:"
                    value="dmart"
                    options={[
                      { value: "dmart", label: "D-Mart" },
                      { value: "bigbazaar", label: "BigBazaar" },
                    ]}
                    onChange={() => {}}
                  />

                  <Dropdown
                    label="View by:"
                    value={view}
                    options={viewOptions}
                    onChange={(v) => {
                      setView(v as ViewBy);
                      setCatFilter("all");
                      setSubFilter("all");
                      setGroupFilter("all");
                    }}
                    minWidth={160}
                  />

                  {view !== "category" && (
                    <FiltersPopup
                      view={view}
                      catFilter={catFilter}
                      subFilter={subFilter}
                      groupFilter={groupFilter}
                      catOptions={[{ value: "all", label: "All categories" }, ...categories.map((c) => ({ value: c.id, label: c.name }))]}
                      subOptions={[{ value: "all", label: "All sub-categories" }, ...subs.map((s) => ({ value: s.id, label: s.name }))]}
                      groupOptions={[{ value: "all", label: "All groups" }, ...groups.map((g) => ({ value: g.id, label: g.name }))]}
                      onCatChange={(v) => { setCatFilter(v); setSubFilter("all"); setGroupFilter("all"); }}
                      onSubChange={(v) => { setSubFilter(v); setGroupFilter("all"); }}
                      onGroupChange={setGroupFilter}
                    />
                  )}
                </>
              )}

              <div className="relative ml-auto w-[405px]">
                <SearchIconDS className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#9494AE]" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search products, groups, sub-categories, categories…"
                  className={DS_SEARCH_INPUT}
                />
                {searching && (
                  <button
                    type="button"
                    onClick={() => setQuery("")}
                    className={DS_SEARCH_CLEAR}
                    aria-label="Clear"
                  >
                    <CloseIconDS className="size-3" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="nc-scroll min-h-0 flex-1 overflow-auto">
            {searching ? (
              <SearchResults
                results={searchResults}
                query={query}
                has={has}
                onToggle={(key) => {
                  const [lvl, id] = key.split(":");
                  if (lvl === "cat") toggleCat(id);
                  else if (lvl === "sub") toggleSub(id);
                  else if (lvl === "group") toggleGroup(id);
                  else toggleProduct(id);
                }}
                coverage={(key) => {
                  const [lvl, id] = key.split(":");
                  if (lvl === "cat") return catState(id);
                  if (lvl === "sub") return subState(id);
                  if (lvl === "group") return groupState(id);
                  const p = products.find((x) => x.id === id)!;
                  return {
                    checked: isProductCovered(p) || has(`prod:${id}`),
                    indeterminate: false,
                    locked: isProductCovered(p),
                  };
                }}
                coverageLabel={(key) => {
                  const [lvl, id] = key.split(":");
                  if (lvl !== "prod") return null;
                  const p = products.find((x) => x.id === id);
                  return p ? coverageLabel(p) : null;
                }}
              />
            ) : (
              <CatalogTable
                view={view}
                catFilterFn={catFilterFn}
                subFilterFn={subFilterFn}
                groupFilterFn={groupFilterFn}
                catState={catState}
                subState={subState}
                groupState={groupState}
                isProductCovered={isProductCovered}
                coverageLabel={coverageLabel}
                has={has}
                toggleCat={toggleCat}
                toggleSub={toggleSub}
                toggleGroup={toggleGroup}
                toggleProduct={toggleProduct}
                setSel={setSel}
              />
            )}
          </div>
        </section>

        {/* ── Selection panel ─────────────────────────────────────────────── */}
        <aside className="flex min-w-0 shrink-0 flex-col overflow-hidden rounded-lg border border-[#D9D9E8] bg-white lg:row-span-2 lg:grid lg:grid-rows-subgrid">

          {/* Header band — shares row 1 with the workspace header */}
          <div className="flex shrink-0 flex-col justify-between gap-3 border-b border-[#D9D9E8] px-5 pt-5 pb-4">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-[28px] font-bold leading-[38px] tracking-[-0.015em] text-[#17173A]">
                  {num(totalSelected)}
                </p>
                <p className="text-[13px] font-medium leading-[21px] tracking-[-0.01em] text-[#6F6F8D]">
                  products selected for replenishment
                </p>
              </div>
              <button
                type="button"
                disabled={totalSelected === 0}
                onClick={handleContinue}
                className={[
                  // DS §6.2 primary button, md: 40px tall, 16px/600, radius 8
                  "h-10 shrink-0 rounded-lg px-5 text-[16px] font-semibold leading-none transition-colors duration-150 ease-out",
                  "focus-visible:outline-none focus-visible:shadow-[0_0_0_4px_rgba(47,104,229,0.15)]",
                  totalSelected === 0
                    ? "cursor-not-allowed bg-[#F5F5F5] text-[#A0A0A0]"
                    : "bg-[#2F68E5] text-white hover:bg-[#2152BF] active:bg-[#0251BA]",
                ].join(" ")}
              >
                Continue
              </button>
            </div>

            {/* Control row — sits on the same baseline as the workspace toolbar */}
            <div className="flex h-8 items-center justify-between gap-2">
              <Dropdown
                label="View by:"
                value={previewView}
                options={[
                  { value: "products", label: "Products" },
                  { value: "subs", label: "Sub-categories" },
                  { value: "groups", label: "Groups" },
                  { value: "categories", label: "Categories" },
                ]}
                onChange={(v) => setPreviewView(v as PreviewView)}
                minWidth={180}
                disabled={totalSelected === 0}
              />
            </div>
          </div>

          {/* Body — caption band + list (row 2) */}
          <div className="flex min-h-0 flex-col">

            {/* Caption band — same 41px rule as the catalog table header */}
            <div className="flex shrink-0 items-center justify-between gap-3.5 border-b border-[#EBEBF5] bg-[#FAFBFF] px-5 py-2.5">
              <ColHead>{previewSelectedLabel}</ColHead>
              {totalSelected > 0 && (
                <button
                  type="button"
                  onClick={clearAll}
                  className="-my-1 shrink-0 rounded px-1.5 py-1 text-[13px] font-semibold leading-[20px] tracking-[-0.01em] text-[#6F6F8D] transition-colors hover:text-[#F05C5C]"
                >
                  Clear all
                </button>
              )}
            </div>

            {/* Scrollable list */}
            <div className="nc-scroll min-h-0 flex-1 overflow-auto px-5 py-4">
              {totalSelected === 0 ? (
                <div className="flex h-full flex-col items-center justify-center py-8 text-center">
                  <EmptyIllustrationDS className="size-20" />
                  <p className="mt-3 text-[14px] font-semibold leading-[22px] tracking-[-0.01em] text-[#17173A]">Nothing selected yet</p>
                  <p className="mt-1.5 text-[13px] font-medium leading-[21px] tracking-[-0.01em] text-[#6F6F8D]">
                    Select products, groups, sub-categories or categories to see them here.
                  </p>
                </div>
              ) : previewView === "products" ? (
                <ProductsPanelView
                  has={has}
                  isProductCovered={isProductCovered}
                  coverageLabel={coverageLabel}
                  removeProduct={removeProduct}
                />
              ) : previewView === "subs" ? (
                <SubsPanelView
                  selectedSubIds={selectedSubIds}
                  subContribution={subContribution}
                  toggleSub={toggleSub}
                />
              ) : previewView === "groups" ? (
                <GroupsPanelView
                  selectedGroupIds={selectedGroupIds}
                  groupContribution={groupContribution}
                  toggleGroup={toggleGroup}
                />
              ) : (
                <CategoriesPanelView
                  selectedCatIds={selectedCatIds}
                  catContribution={catContribution}
                  has={has}
                  clearCategory={clearCategory}
                />
              )}
            </div>
          </div>
        </aside>
      </div>

      {confirming && (
        <ManageChangesModal
          diff={diff}
          removedInJourney={removedInJourney}
          catCount={selectedCatIds.length}
          groupCount={selectedGroupIds.length}
          totalSelected={totalSelected}
          onCancel={() => setConfirming(false)}
          onConfirm={applyChanges}
        />
      )}

      {/* Above the overlay, not behind it on the listing page. */}
      <SuccessToast visible={applied} message="Replenishment items updated" z="z-[99]" />
    </div>
    </DSScope.Provider>
  );
}

function GlobalSettingsPanel({
  open,
  onClose,
  catalogName,
  minVal,
  setMinVal,
  fbOn,
  setFbOn,
  fbVal,
  setFbVal,
  bufOn,
  setBufOn,
  bufVal,
  setBufVal,
}: {
  open: boolean;
  onClose: () => void;
  catalogName: string;
  minVal: number;
  setMinVal: (v: number) => void;
  fbOn: boolean;
  setFbOn: (v: boolean) => void;
  fbVal: number;
  setFbVal: (v: number) => void;
  bufOn: boolean;
  setBufOn: (v: boolean) => void;
  bufVal: number;
  setBufVal: (v: number) => void;
}) {
  const [tab, setTab] = useState(0);
  // Tab 1 — the minimum reminder is a baseline, so it has a value but no on/off.
  const [minUnit, setMinUnit] = useState("days");
  const [fbUnit, setFbUnit] = useState("days");
  const [bufUnit, setBufUnit] = useState("days");
  // Tab 2 — when communication goes out. Same defaults as the Journey's
  // Replenishment event panel: a whole hour, never empty.
  const [commHour, setCommHour] = useState("10");
  const [commMinute, setCommMinute] = useState("00");
  const [commMeridiem, setCommMeridiem] = useState("AM");
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
    <div className="fixed inset-0 z-[80] flex justify-end">
      <button type="button" aria-label="Close" onClick={onClose} className="absolute inset-0 cursor-default bg-[rgba(17,17,40,0.4)] animate-drawer-scrim" />

      <div className="relative flex h-full w-[52%] min-w-[720px] max-w-[860px] flex-col bg-white shadow-[-16px_0_48px_rgba(17,17,40,0.14)] animate-drawer-in">
        {/* Header */}
        <div className="shrink-0 px-8 pt-7">
          <div className="flex items-start justify-between gap-6">
            <div className="min-w-0">
              <h2 className="text-[22px] font-bold leading-[32px] tracking-[-0.01em] text-[#17173A]">Configuration</h2>
              <p className="mt-0.5 max-w-[760px] text-[13px] leading-[20px] text-[#6F6F8D]">
                Set fallback rules for the selected catalog. Any item-level rule will take priority over the fallback set.
              </p>
            </div>
            <button type="button" onClick={onClose} aria-label="Close panel" className="-mt-1 grid size-8 shrink-0 place-items-center rounded-lg text-[#6F6F8D] transition-colors hover:bg-[#F4F8FF] hover:text-[#17173A]">
              <CloseIcon className="size-5" />
            </button>
          </div>
        </div>

        {/* Tabs — sit directly under the header text; the active tab carries the
            only underline, so there is no second full-width band. */}
        <div className="shrink-0 border-b border-[#DDE2EE] bg-white px-8 pt-5">
          <div className="flex flex-nowrap gap-6">
            {SETTINGS_TABS.map((t, i) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(i)}
                className={`relative whitespace-nowrap pb-2.5 text-[13.5px] transition-colors ${tab === i ? "font-bold text-[#2F68E5]" : "font-semibold text-[#6F6F8D] hover:text-[#17173A]"}`}
              >
                {t}
                {tab === i && <span className="absolute inset-x-0 bottom-0 h-[2.5px] rounded-full bg-[#2F68E5]" />}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="nc-scroll min-h-0 flex-1 overflow-y-auto bg-white px-8 pt-5 pb-6">
          {tab === 0 && (
            /* DS scope so the unit pickers render as the Infinity dropdown. */
            <DSScope.Provider value={true}>
            <div className="flex flex-col gap-4">
              {/* Outcome first: what the current, unsaved configuration produces. */}
              <TimingPreview
                minVal={minVal}
                fbOn={fbOn} fbVal={fbVal}
                bufOn={bufOn} bufVal={bufVal}
              />

              <TimingCard
                title="Set fallback for reminder"
                description="Set a fallback for replenishment as a backup to trigger reminders when product or user data is missing."
                on={fbOn}
                onToggle={setFbOn}
              >
                <DSNumberField value={fbVal} onChange={setFbVal} />
                <DSUnitSelect value={fbUnit} onChange={setFbUnit} />
              </TimingCard>

              <TimingCard
                title="Remind before replenishment is due"
                description="Send reminders a few days before replenishment is due so messages arrive on time."
                on={bufOn}
                onToggle={setBufOn}
              >
                <DSNumberField value={bufVal} onChange={setBufVal} />
                <DSUnitSelect value={bufUnit} onChange={setBufUnit} />
                <span className="text-[13px] leading-[20px] text-[#17173A]">before replenishment</span>
              </TimingCard>

              {/* Always applied, and never lower than MIN_REMINDER_DAYS. */}
              <TimingCard
                title="Minimum wait before sending the earliest reminder"
                description="Set a minimum wait period after product is purchased so reminders aren't sent too soon."
                on
                locked
                note="This acts as the minimum wait time before triggering journey."
              >
                <DSNumberField value={minVal} onChange={setMinVal} min={MIN_REMINDER_DAYS} />
                <DSUnitSelect value={minUnit} onChange={setMinUnit} />
              </TimingCard>
            </div>
            </DSScope.Provider>
          )}

          {tab === 1 && (
            /* The Journey's communication-time card, addressed to this catalog. */
            <DSScope.Provider value={true}>
              <CommunicationTimeCard
                title={`Set time when communication goes out for ${catalogName} products`}
                description="When the Journey is published, communication is sent to the qualified users at the time you choose."
                hour={commHour}
                minute={commMinute}
                meridiem={commMeridiem}
                onHourChange={setCommHour}
                onMinuteChange={setCommMinute}
                onMeridiemChange={setCommMeridiem}
                divider={false}
              />
            </DSScope.Provider>
          )}

        </div>

        {/* Bottom action bar */}
        <div className="flex shrink-0 items-center gap-4 border-t border-[#DDE2EE] bg-white px-8 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-[#2F68E5] px-5 py-2.5 text-[13px] font-bold uppercase tracking-wide text-white transition-colors duration-150 ease-out hover:bg-[#2152BF] active:bg-[#0251BA] focus-visible:outline-none focus-visible:shadow-[0_0_0_4px_rgba(47,104,229,0.15)]"
          >
            Save
          </button>
        </div>
      </div>
    </div>

    </>
  );
}

function RadioCard({ selected, onSelect, title, description }: { selected: boolean; onSelect: () => void; title: string; description: string }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex items-start gap-3 rounded-xl border px-5 py-4 text-left transition-colors ${selected ? "border-[#2F68E5] bg-white shadow-[0_0_0_1px_var(--color-[#2F68E5])]" : "border-[#DDE2EE] bg-white hover:border-[#EDF0F7]"}`}
    >
      <span className={`mt-0.5 grid size-[18px] shrink-0 place-items-center rounded-full border-2 transition-colors ${selected ? "border-[#2F68E5]" : "border-[#9494AE]"}`}>
        {selected && <span className="size-[9px] rounded-full bg-[#2F68E5]" />}
      </span>
      <div className="min-w-0">
        <p className="text-[14px] font-semibold text-[#17173A]">{title}</p>
        <p className="mt-0.5 text-[12.5px] leading-relaxed text-[#6F6F8D]">{description}</p>
      </div>
    </button>
  );
}

/* ----------------------------- Category configuration side panel ----------------------------- */

const CATEGORY_TABS = ["Replenishment", "Remind before due"] as const;

/* Priority of the manually configured rule over the user's own purchase
   behaviour. Rendered identically at the bottom of the product and category
   "Set replenishment manually" cards. */
function RulePriorityRow({
  checked,
  onChange,
  level,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  level: "product";
}) {
  const winner = "font-semibold text-[#17173A]";
  const loser = "text-[#6F6F8D]";
  return (
    <div>
      <div className="flex items-center gap-2.5">
        <Checkbox checked={checked} onChange={() => onChange(!checked)} />
        <button type="button" onClick={() => onChange(!checked)} className="text-left text-[14px] text-[#17173A]">
          Give this rule priority over user behaviour
        </button>
        <span className="group/tip relative z-30 inline-flex cursor-help items-center">
          <InfoIconDS className="size-3 shrink-0 text-[#9494AE]" />
          {/* DS §12.4 tooltip: #17173A, 12/500, 6px 10px, radius 6 */}
          <span
            role="tooltip"
            className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-2 w-[230px] -translate-x-1/2 rounded-md bg-[#17173A] px-2.5 py-1.5 text-center text-[12px] font-medium leading-[18px] tracking-[-0.01em] text-white opacity-0 shadow-[0_1px_3px_rgba(23,23,58,0.10)] transition-opacity duration-150 group-hover/tip:opacity-100"
          >
            <span aria-hidden className="absolute -bottom-1 left-1/2 size-2 -translate-x-1/2 rotate-45 bg-[#17173A]" />
            When enabled, this {level} rule takes priority over the user’s past purchase behaviour.
          </span>
        </span>
      </div>
      {/* Priority order, winner first. Swaps with the checkbox. */}
      <div className="mt-2 flex items-center gap-1.5 pl-[26px] text-[12px] leading-[18px]">
        <span className={checked ? winner : loser}>{checked ? "Current rule" : "User behaviour"}</span>
        <svg viewBox="0 0 12 12" fill="none" className="size-3 shrink-0 text-[#9494AE]" aria-label="takes priority over">
          <path d="M4.5 2.5L8 6l-3.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span className={checked ? loser : winner}>{checked ? "User behaviour" : "Current rule"}</span>
      </div>
    </div>
  );
}

function RadioRow({ selected, onSelect, children }: { selected: boolean; onSelect: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onSelect} className="flex items-center gap-2.5 text-left">
      <span className={`grid size-[18px] shrink-0 place-items-center rounded-full border-2 transition-colors ${selected ? "border-[#2F68E5]" : "border-[#9494AE]"}`}>
        {selected && <span className="size-[9px] rounded-full bg-[#2F68E5]" />}
      </span>
      <span className="text-[14px] text-[#17173A]">{children}</span>
    </button>
  );
}

function RepurchaseChart({
  aiDay,
  manualDay = null,
  manualLabel = "Manual override",
}: {
  aiDay: number;
  /** The value currently in force, highlighted alongside the AI recommendation. */
  manualDay?: number | null;
  /** What that value is, for the legend — it is not always a local override. */
  manualLabel?: string;
}) {
  const [hovered, setHovered] = useState<number | null>(null);

  const maxDay = Math.max(aiDay + 14, 28, manualDay ?? 0);
  const days = Array.from({ length: maxDay }, (_, i) => i + 1);

  // Generate a right-skewed distribution that peaks at aiDay
  const raw = days.map((d) => {
    const diff = (d - aiDay) / (aiDay * 0.4);
    return Math.exp(-0.5 * diff * diff) * (d <= aiDay ? 1 : 0.72);
  });
  const totalRaw = raw.reduce((s, v) => s + v, 0);
  const data = days.map((d, i) => ({
    day: d,
    pct: Math.round((raw[i] / totalRaw) * 1000) / 10,
  }));
  const maxPct = Math.max(...data.map((d) => d.pct));

  const W = 520, H = 130;
  const padL = 32, padR = 10, padT = 14, padB = 30;
  const chartW = W - padL - padR;
  const chartH = H - padT - padB;
  const barW = chartW / data.length;

  const labelDays = new Set([1, aiDay, ...(manualDay != null ? [manualDay] : []), ...([5, 10, 15, 20, 25, 30].filter((d) => d <= maxDay))]);

  return (
    <div className="mt-5">
      <p className="mb-1 text-[11.5px] font-semibold uppercase tracking-[0.5px] text-[#6F6F8D]">Repurchase distribution — % of users by day</p>
      <div className="relative select-none rounded-xl border border-[#DDE2EE] bg-[#f8f9ff] px-3 pt-3 pb-2">
        <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ overflow: "visible" }}>
          {/* Y-axis gridlines */}
          {[0.25, 0.5, 0.75, 1].map((f) => (
            <line
              key={f}
              x1={padL} y1={padT + chartH * (1 - f)}
              x2={W - padR} y2={padT + chartH * (1 - f)}
              stroke="#e5e7f5" strokeWidth={1}
            />
          ))}

          {/* Bars */}
          {data.map((d) => {
            const x = padL + (d.day - 1) * barW;
            const bh = (d.pct / maxPct) * chartH;
            const isAi = d.day === aiDay;
            const isManual = manualDay != null && d.day === manualDay;
            const isHov = hovered === d.day;
            return (
              <rect
                key={d.day}
                x={x + 1.5}
                y={padT + chartH - bh}
                width={Math.max(barW - 3, 1)}
                height={bh}
                rx={2}
                fill={isManual ? "#00C48C" : isAi ? "#2F4BE5" : isHov ? "#7b8fe8" : "#c7d0f5"}
                onMouseEnter={() => setHovered(d.day)}
                onMouseLeave={() => setHovered(null)}
                style={{ cursor: "crosshair", transition: "fill 0.1s" }}
              />
            );
          })}

          {/* AI day dashed marker */}
          <line
            x1={padL + (aiDay - 1) * barW + barW / 2}
            y1={padT}
            x2={padL + (aiDay - 1) * barW + barW / 2}
            y2={padT + chartH}
            stroke="#2F4BE5" strokeWidth={1.5} strokeDasharray="3 3" opacity={0.5}
          />

          {/* Manual override marker — same treatment, category's own value */}
          {manualDay != null && manualDay !== aiDay && (
            <line
              x1={padL + (manualDay - 1) * barW + barW / 2}
              y1={padT}
              x2={padL + (manualDay - 1) * barW + barW / 2}
              y2={padT + chartH}
              stroke="#00C48C" strokeWidth={1.5} strokeDasharray="3 3" opacity={0.6}
            />
          )}

          {/* X-axis labels */}
          {data.filter((d) => labelDays.has(d.day)).map((d) => (
            <text
              key={d.day}
              x={padL + (d.day - 1) * barW + barW / 2}
              y={H - 6}
              textAnchor="middle"
              fontSize={9.5}
              fontFamily="Manrope, sans-serif"
              fontWeight={d.day === aiDay || d.day === manualDay ? 700 : 400}
              fill={d.day === manualDay ? "#00A97A" : d.day === aiDay ? "#2F4BE5" : "#9394b0"}
            >
              {d.day}d
            </text>
          ))}
        </svg>

        {/* Hover tooltip */}
        {hovered != null && (() => {
          const d = data.find((n) => n.day === hovered)!;
          const xPx = ((padL + (hovered - 1) * barW + barW / 2) / W) * 100;
          return (
            <div
              className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-lg bg-[#17173a] px-2.5 py-1.5 shadow-lg"
              style={{ left: `${xPx}%`, top: `${padT + 6}px` }}
            >
              <p className="whitespace-nowrap text-[11px] font-semibold text-white">{d.pct}% of users</p>
              <p className="whitespace-nowrap text-[10px] text-[#9394b0]">repurchased on day {hovered}</p>
            </div>
          );
        })()}
      </div>
      <div className="mt-3.5 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-[#6F6F8D]">
        <div className="flex items-center gap-1.5">
          <div className="h-2.5 w-2.5 rounded-sm bg-[#2F4BE5]" />
          <span className="font-semibold text-[#2F68E5]">AI recommended · day {aiDay}</span>
        </div>
        {manualDay != null && (
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-sm bg-[#00C48C]" />
            <span className="font-semibold text-[#00A97A]">{manualLabel} · day {manualDay}</span>
          </div>
        )}
        <div className="flex items-center gap-1.5">
          <div className="h-2.5 w-2.5 rounded-sm bg-[#c7d0f5]" />
          <span>Other days</span>
        </div>
      </div>
    </div>
  );
}

const PRODUCT_TABS = ["Replenishment", "Remind before due"] as const;

/* What the item-level config panel needs to know about its subject. The panel
   itself is entity-agnostic: a product and a product group share the same
   surface, and only the header meta, the copy noun and how the hierarchy is
   resolved differ. */
type PanelEntity = {
  kind: "product" | "group";
  /** Key in the override map this panel's save writes to. */
  key: string;
  name: string;
  category: string;
  /** The entity's own AI recommendation, if any. */
  ai: number | null;
  aiConf: Confidence;
  /** Header meta line — the spans between the title and the "View …" link. */
  meta: React.ReactNode;
  viewLabel: string;
  /** Opens the entity's details page, where one exists. */
  onView?: () => void;
  /** Full-chain resolution for this entity, exactly as the listing row does it. */
  resolve: (cfg: ReplConfig) => Resolved;
  resolveBuf: (cfg: ReplConfig) => ResolvedBuffer;
  /** cfg with this entity's override replaced — how the panel previews its draft. */
  withOverride: (cfg: ReplConfig, ov: LevelOverride) => ReplConfig;
};

/* Product panel — the shared item panel with a product row as its subject. */
function ProductConfigPanel({
  row,
  cfg,
  initial,
  onClose,
  onSave,
}: {
  row: ProdListingRow;
  /** The whole hierarchy, so the panel resolves exactly as the listing does. */
  cfg: ReplConfig;
  /** What is already saved against this product, if anything. */
  initial?: LevelOverride;
  onClose: () => void;
  onSave: (id: string, ov: LevelOverride) => void;
}) {
  const [viewing, setViewing] = useState(false);
  const entity: PanelEntity = {
    kind: "product",
    key: row.id,
    name: row.name,
    category: row.category,
    ai: row.aiProd,
    aiConf: row.aiProdConf,
    meta: (
      <>
        <span>ID : {row.id}</span>
        <span className="text-[#DDE2EE]">|</span>
        <span>Product group : <span className="font-semibold text-[#17173A]">{row.group}</span></span>
        <span className="text-[#DDE2EE]">|</span>
        <span>Category : <span className="font-semibold text-[#17173A]">{row.category}</span></span>
      </>
    ),
    viewLabel: "View product",
    onView: () => setViewing(true),
    resolve: (c) => resolveReplenishment(row, c),
    resolveBuf: (c) => resolveBuffer(row, c),
    withOverride: (c, ov) => ({ ...c, product: { ...c.product, [row.id]: ov } }),
  };
  /* The details page opens over the panel, which stays mounted beneath it so
     any unsaved edits are still there on the way back. */
  return (
    <>
      <ItemConfigPanel entity={entity} cfg={cfg} initial={initial} onClose={onClose} onSave={onSave} />
      {viewing && <ProductDetailsPage row={row} onBack={() => setViewing(false)} />}
    </>
  );
}

/* ── Product details page ───────────────────────────────────────────────────
   Full-screen overlay opened by "View product" in the product panel — the
   catalogue's product details page (Product info + Variant list), populated
   from the selected row. Variants are the listed products in the same group. */
const toSlug = (s: string) => s.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const sizedImage = (url: string, w: number, h: number) =>
  url ? `${url.split("?")[0]}?w=${w}&h=${h}&fit=crop&auto=format` : "";

export function ProductDetailsPage({ row, onBack }: { row: ProdListingRow; onBack: () => void }) {
  const d = PROD_DETAILS[row.id];
  const sub = GROUP_LISTING.find((g) => g.name === row.group)?.sub ?? "";
  const image = sizedImage(catImageByName(row.category), 480, 640);
  const price = (n: number | undefined) => (n == null || !d ? "" : `${d.currency} ${n.toFixed(2)}`);
  const collection = sub ? `${row.category} › ${sub}` : row.category;
  const imageLink = image.split("?")[0];
  const link = `https://www.dmart.in/product/${toSlug(row.name)}${row.id ? `-${row.id}` : ""}`;
  const variants = PROD_LISTING.filter((p) => p.group === row.group);
  /* The variant whose per-location drawer is open. */
  const [locationsOf, setLocationsOf] = useState<ProdListingRow | null>(null);

  /* Leaves the way it arrived — slides back down, then unmounts. */
  const [closing, setClosing] = useState(false);
  const close = () => setClosing(true);
  /* Timed to .animate-slide-down-out (0.4s) rather than onAnimationEnd, which
     never fires in a backgrounded tab and would leave the page stuck open. */
  const onBackRef = useRef(onBack);
  onBackRef.current = onBack;
  useEffect(() => {
    if (!closing) return;
    const t = setTimeout(() => onBackRef.current(), 400);
    return () => clearTimeout(t);
  }, [closing]);

  /* Escape steps back to the panel only — captured ahead of the panel's own
     Escape handler, which would otherwise close the panel as well. */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.stopImmediatePropagation();
      setClosing(true);
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, []);

  const chip = (text: string) => (
    <span className="inline-flex h-[23px] max-w-[230px] items-center rounded-full bg-[#6C6B8C] px-[9px] text-[13px] font-semibold text-white">
      <span className="truncate">{text}</span>
    </span>
  );
  const copyable = (text: string) => (
    <span className="flex min-w-0 items-center gap-2">
      <span className="max-w-[210px] truncate">{text}</span>
      <button type="button" aria-label="Copy" onClick={() => navigator.clipboard?.writeText(text)} className="shrink-0 text-[#6E7191] hover:text-[#1F2044]">
        <svg viewBox="0 0 16 16" fill="none" className="size-[13px]"><rect x="5" y="5" width="9" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.3" /><path d="M11 2.5H3.5a1 1 0 0 0-1 1V11" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /></svg>
      </button>
    </span>
  );

  const fields: { label: string; value: React.ReactNode; pill?: boolean }[] = [
    { label: "Title", value: row.name },
    { label: "Group ID", value: toSlug(row.group) },
    { label: "Retail price", value: price(d?.retail) },
    { label: "Sales price", value: price(d?.sales) },
    { label: "Quantity", value: d?.quantity ?? "" },
    { label: "Availability", value: d?.availability ?? "" },
    { label: "Color", value: d?.color ?? "" },
    { label: "Collection", value: chip(collection), pill: true },
    { label: "Brand", value: d?.brand ? chip(d.brand) : "", pill: !!d?.brand },
    { label: "Condition", value: d?.condition ?? "" },
    { label: "Currency", value: d?.currency ?? "" },
    { label: "Description", value: d?.description ?? "" },
    { label: "Subcategory", value: sub ? chip(sub) : "", pill: !!sub },
    { label: "Image Link", value: copyable(imageLink) },
    { label: "Link", value: copyable(link) },
    { label: "Product ID", value: row.id },
    { label: "Categories", value: chip(collection), pill: true },
    { label: "Size", value: d?.size ?? "" },
    { label: "Location", value: d ? locationsFor(row.id, d.quantity).map((l) => l.city).join(", ") : "" },
    { label: "Store", value: d?.store ?? "" },
    { label: "Tag", value: d?.tag ?? "" },
  ];

  return createPortal(
    <div
      className={`fixed inset-0 z-[90] flex flex-col bg-[#F3F6FC] ${closing ? "animate-slide-down-out" : "animate-slide-up"}`}
      role="dialog"
      aria-modal="true"
      aria-label={row.name}
    >
      {/* Header — product name, close on the far right. */}
      <div className="flex shrink-0 items-center justify-between gap-4 border-b border-[#E3E7F0] bg-white px-[34px] py-2">
        <h1 className="truncate text-[19px] font-bold leading-[26px] text-[#1F2044]">{row.name}</h1>
        <button type="button" onClick={close} aria-label="Close" className="grid size-8 shrink-0 place-items-center rounded-lg border border-[#DDE2EE] text-[#6F6F8D] transition-colors hover:border-[#c5cce8] hover:text-[#17173A]">
          <CloseIcon className="size-4" />
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-[34px] pt-[34px]">
        <div className="grid grid-cols-[minmax(0,475fr)_minmax(0,675fr)] items-start gap-[26px]">
          {/* Product info */}
          <div className="flex h-[calc(100vh-82px)] min-h-[520px] flex-col border border-[#E3E7F0] bg-white">
            <div className="flex h-[63px] shrink-0 items-center gap-[6px] border-b border-[#E3E7F0] px-[19px]">
              <svg viewBox="0 0 16 16" fill="currentColor" className="size-[12px] text-[#5A5E7B]"><path fillRule="evenodd" d="M6.9.5h2.2l.35 1.9c.43.14.84.31 1.22.53l1.6-1.1 1.55 1.55-1.1 1.6c.22.38.4.79.53 1.22l1.9.35v2.2l-1.9.35c-.14.43-.31.84-.53 1.22l1.1 1.6-1.55 1.55-1.6-1.1c-.38.22-.79.4-1.22.53l-.35 1.9H6.9l-.35-1.9a5.4 5.4 0 0 1-1.22-.53l-1.6 1.1-1.55-1.55 1.1-1.6a5.4 5.4 0 0 1-.53-1.22L.5 9.1V6.9l1.9-.35c.14-.43.31-.84.53-1.22l-1.1-1.6 1.55-1.55 1.6 1.1c.38-.22.79-.4 1.22-.53L6.9.5zM8 10.6a2.6 2.6 0 1 0 0-5.2 2.6 2.6 0 0 0 0 5.2z" /></svg>
              <span className="text-[16px] font-semibold text-[#5A5E7B]">Product info</span>
            </div>
            <div className="flex h-[255px] shrink-0 justify-center pt-[24px]">
              {image && <img src={image} alt={row.name} className="h-full w-auto max-w-full object-contain" />}
            </div>
            <div className="pd-vscroll mr-[23px] mt-[18px] min-h-0 flex-1 overflow-y-auto pb-4 pl-[29px] pr-[8px] pt-[9px]">
              <div className="flex flex-col gap-[12px]">
                {fields.map((f) => (
                  <div key={f.label} className={`flex text-[13px] leading-[18px] ${f.pill ? "items-center" : "items-start"}`}>
                    <span className="w-[141px] shrink-0 text-[#6E7191]">{f.label}:</span>
                    <span className="min-w-0 flex-1 break-words font-medium text-[#1F2044]">{f.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Variant list */}
          <div className="border border-[#E3E7F0] bg-white">
            <div className="flex h-[62px] items-center justify-between border-b border-[#E3E7F0] pl-[17px] pr-[31px]">
              <div className="flex items-center gap-[6px] text-[#5A5E7B]">
                <svg viewBox="0 0 16 16" fill="none" className="size-[12px]"><rect x="1.5" y="1.5" width="13" height="13" rx="1" stroke="currentColor" strokeWidth="1.4" /><path d="M1.5 6.5h13M6.5 6.5v8" stroke="currentColor" strokeWidth="1.4" /></svg>
                <span className="text-[16px] font-semibold">Variant list ({variants.length})</span>
              </div>
              <button type="button" aria-label="Search variants" className="grid size-[25px] place-items-center rounded-[2px] border border-[#D5D8E2] text-[#5A5E7B]">
                <svg viewBox="0 0 16 16" fill="none" className="size-[15px]"><circle cx="7.5" cy="7.5" r="5.5" stroke="currentColor" strokeWidth="1.2" /><path d="M11.5 11.5l3 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" /></svg>
              </button>
            </div>
            <div className="pd-hscroll overflow-x-auto">
              <table className="w-full min-w-[770px] table-fixed border-collapse">
                <colgroup>
                  <col className="w-[276px]" />
                  <col className="w-[190px]" />
                  <col className="w-[127px]" />
                  <col className="w-[110px]" />
                  <col className="w-[118px]" />
                </colgroup>
                <thead>
                  <tr className="h-[53px] border-b-2 border-[#E6E9F0] text-[16px] font-semibold text-[#5F6380]">
                    <th className="sticky left-0 z-[1] bg-white shadow-[inset_-1px_0_0_#EEF0F5] pl-[22px] text-left font-semibold">Product ID</th>
                    <th className="pr-[14px] text-right font-semibold">Price</th>
                    <th className="pr-[14px] text-right font-semibold">Quantity</th>
                    <th className="pr-[14px] text-right font-semibold">Location</th>
                    <th className="pl-[14px] text-left font-semibold">Availability</th>
                  </tr>
                </thead>
                <tbody>
                  {variants.map((v, i) => {
                    const vd = PROD_DETAILS[v.id];
                    const vPrice = (n: number | undefined) => (n == null || !vd ? "" : `${vd.currency} ${n.toFixed(2)}`);
                    const active = vd?.availability === "active";
                    return (
                      <tr key={v.id} className={`h-[50px] text-[14px] font-medium text-[#1F2044] ${i < variants.length - 1 ? "border-b border-[#EEF0F5]" : ""}`}>
                        <td className="sticky left-0 z-[1] bg-white shadow-[inset_-1px_0_0_#EEF0F5] pl-[28px] pr-[8px]">
                          <div className="flex min-w-0 items-center gap-[8px]">
                            {image && <img src={sizedImage(catImageByName(v.category), 40, 40)} alt="" className="size-[19px] shrink-0 object-cover" />}
                            <span className="truncate font-semibold">{v.id}</span>
                          </div>
                        </td>
                        <td className="pr-[14px] text-right">
                          {vd && `From ${vPrice(startingPrice(variantLocationsFor(v.id, vd.quantity, vd.retail, vd.sales)))}`}
                        </td>
                        <td className="pr-[14px] text-right">{vd?.quantity ?? ""}</td>
                        <td className="pr-[14px] text-right">
                          {vd && (
                            <button
                              type="button"
                              onClick={() => setLocationsOf(v)}
                              className="font-semibold text-[#2F68E5] hover:underline"
                            >
                              {variantLocationsFor(v.id, vd.quantity, vd.retail, vd.sales).length}
                            </button>
                          )}
                        </td>
                        <td className="pl-[14px]">
                          {vd && (
                            <span className={`inline-flex h-[15px] w-[72px] items-center justify-center rounded-[2px] border text-[9px] font-bold uppercase leading-none tracking-[0.4px] ${active ? "border-[#00C48C] bg-[#EFFBF6] text-[#00C48C]" : "border-[#C9CCD7] bg-[#F4F5F8] text-[#6E7191]"}`}>
                              {vd.availability}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      {locationsOf && PROD_DETAILS[locationsOf.id] && (
        <VariantLocationsSheet
          open
          productName={locationsOf.name}
          currency={PROD_DETAILS[locationsOf.id].currency}
          locations={variantLocationsFor(
            locationsOf.id,
            PROD_DETAILS[locationsOf.id].quantity,
            PROD_DETAILS[locationsOf.id].retail,
            PROD_DETAILS[locationsOf.id].sales,
          )}
          onClose={() => setLocationsOf(null)}
        />
      )}
    </div>,
    document.body,
  );
}

/* Group panel — the same item panel, with a product group as its subject. */
function GroupConfigPanel({
  row,
  cfg,
  initial,
  onClose,
  onSave,
}: {
  row: GroupListingRow;
  cfg: ReplConfig;
  /** What is already saved against this group, if anything. */
  initial?: LevelOverride;
  onClose: () => void;
  onSave: (name: string, ov: LevelOverride) => void;
}) {
  const [viewing, setViewing] = useState(false);
  /* The details page is per product: open the group's first listed product —
     its Variant list then shows the whole group. A group with no listed
     products opens on the group itself, with an empty Variant list. */
  const viewRow: ProdListingRow = PROD_LISTING.find((p) => p.group === row.name) ?? {
    name: row.name,
    id: "",
    group: row.name,
    category: row.category,
    aiProd: row.aiGroup,
    aiProdConf: row.aiGroupConf,
  };
  const entity: PanelEntity = {
    kind: "group",
    key: row.name,
    name: row.name,
    category: row.category,
    ai: row.aiGroup,
    aiConf: row.aiGroupConf,
    meta: (
      <>
        <span>Sub-category : <span className="font-semibold text-[#17173A]">{row.sub}</span></span>
        <span className="text-[#DDE2EE]">|</span>
        <span>Category : <span className="font-semibold text-[#17173A]">{row.category}</span></span>
      </>
    ),
    viewLabel: "View products",
    onView: () => setViewing(true),
    resolve: (c) => resolveGroup(row.name, row.category, c),
    resolveBuf: (c) => resolveGroupBuffer(row.name, row.category, c),
    withOverride: (c, ov) => ({ ...c, group: { ...c.group, [row.name]: ov } }),
  };
  return (
    <>
      <ItemConfigPanel entity={entity} cfg={cfg} initial={initial} onClose={onClose} onSave={onSave} />
      {viewing && <ProductDetailsPage row={viewRow} onBack={() => setViewing(false)} />}
    </>
  );
}

function ItemConfigPanel({
  entity,
  cfg,
  initial,
  onClose,
  onSave,
}: {
  entity: PanelEntity;
  cfg: ReplConfig;
  initial?: LevelOverride;
  onClose: () => void;
  onSave: (key: string, ov: LevelOverride) => void;
}) {
  const { fbOn, fbVal, minVal } = cfg.global;
  const [tab, setTab] = useState(0);
  /* "product" / "group" — the noun the panel copy refers to its subject by. */
  const noun = entity.kind;
  const Noun = noun === "product" ? "This product" : "This group";

  /* What the category resolves to on its own. The "use the category setting"
     option is only offered when the category actually supplies the value —
     when it is itself falling through to global, that is the global option. */
  const catRes = resolveCategory(entity.category, cfg);
  const hasCat = catRes.level === "category" && catRes.days != null;
  const catDays = catRes.days;

  // Tab 1 — Replenishment
  const [manualOn, setManualOn] = useState(initial?.repl != null);
  const [replMode, setReplMode] = useState<"category" | "fallback" | "custom">(
    initial?.repl?.mode === "category" ? "category" :
    initial?.repl?.mode === "global" ? "fallback" : "custom",
  );
  const [customVal, setCustomVal] = useState(
    initial?.repl?.mode === "custom" ? initial.repl.days : (entity.ai ?? MIN_REMINDER_DAYS),
  );
  const [customUnit, setCustomUnit] = useState("days");
  const [rulePriority, setRulePriority] = useState(false);

  /* What this item inherits when it sets no buffer of its own. Not always the
     global value — a group or category buffer outranks it. */
  const inheritedBuf = entity.resolveBuf(entity.withOverride(cfg, {}));
  const [tbOn, setTbOn] = useState(
    initial?.buffer ? initial.buffer.mode !== "off" : inheritedBuf.days != null,
  );
  const [tbMode, setTbMode] = useState<"global" | "custom">(
    initial?.buffer?.mode === "custom" ? "custom" : inheritedBuf.days != null ? "global" : "custom",
  );
  const [tbVal, setTbVal] = useState(
    initial?.buffer?.mode === "custom"
      ? initial.buffer.days
      : (inheritedBuf.days ?? MIN_REMINDER_DAYS),
  );
  const [tbUnit, setTbUnit] = useState("days");

  /* A mode that depends on state elsewhere can never be left stranded. */
  const effReplMode: "category" | "fallback" | "custom" =
    replMode === "category" && !hasCat ? "custom"
    : replMode === "fallback" && !fbOn ? "custom"
    : replMode;
  const effTbMode = inheritedBuf.days != null ? tbMode : "custom";

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  /* The edits in this panel, in the shape they will be saved in. */
  const draft: LevelOverride = {};
  if (manualOn) {
    draft.repl =
      effReplMode === "custom" ? { mode: "custom", days: customVal } :
      effReplMode === "fallback" ? { mode: "global" } : { mode: "category" };
  }
  /* Left unset when the product follows the level above, so it keeps following
     it if that level later changes. "Off" is recorded only when there is
     actually a buffer to decline — otherwise saving a panel with nothing to
     inherit would silently opt the product out of a buffer configured later. */
  if (!tbOn && inheritedBuf.days != null) draft.buffer = { mode: "off" };
  else if (tbOn && effTbMode === "custom") draft.buffer = { mode: "custom", days: tbVal };

  /* Resolved through the same functions the listing uses, with the unsaved
     edits layered on — so the panel can never drift from the row behind it. */
  const draftCfg = entity.withOverride(cfg, draft);
  const eff = entity.resolve(draftCfg);
  const effDays = eff.days;
  const effLabel = sourcePanelLabel(eff);

  /* The chart highlights whatever value is actually in force, wherever the
     selected radio resolves it from — the product's own value, the category's,
     or the global fallback — so graph and selection can never disagree. */
  const manualDay = manualOn ? effDays : null;
  const manualLabel = eff.level === entity.kind ? "Manual override" : sourceLabel(eff);
  const maxBuffer = bufferCap(eff, cfg);
  const tbEffective = entity.resolveBuf(draftCfg).days ?? 0;

  return (
    <div className="fixed inset-0 z-[80] flex justify-end">
      <button type="button" aria-label="Close" onClick={onClose} className="absolute inset-0 cursor-default bg-[rgba(17,17,40,0.4)] animate-drawer-scrim" />

      <div className="relative flex h-full w-[52%] min-w-[720px] max-w-[860px] flex-col bg-white shadow-[-16px_0_48px_rgba(17,17,40,0.14)] animate-drawer-in">
        {/* Header — same rhythm as the Category panel. */}
        <div className="shrink-0 px-8 pt-7">
          <div className="flex items-start justify-between gap-6">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2.5">
                <h2 className="text-[22px] font-bold leading-[32px] tracking-[-0.01em] text-[#17173A]">{entity.name}</h2>
                <span className="rounded-[4px] border border-[#2F68E5] px-1.5 py-[3px] text-[10px] font-bold uppercase leading-[14px] tracking-[0.6px] text-[#2F68E5]">{noun}</span>
              </div>
              <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] leading-[20px] text-[#6F6F8D]">
                {entity.meta}
                <span className="text-[#DDE2EE]">|</span>
                <button type="button" onClick={entity.onView} className="flex items-center gap-1 font-semibold text-[#2F68E5] hover:underline">
                  {entity.viewLabel}
                  <svg viewBox="0 0 16 16" fill="none" className="size-3.5"><path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </button>
              </div>
            </div>
            <button type="button" onClick={onClose} aria-label="Close panel" className="-mt-1 grid size-8 shrink-0 place-items-center rounded-lg text-[#6F6F8D] transition-colors hover:bg-[#F4F8FF] hover:text-[#17173A]">
              <CloseIcon className="size-5" />
            </button>
          </div>
        </div>

        {/* Tabs — sit directly under the header meta, no separate rule above. */}
        <div className="shrink-0 border-b border-[#DDE2EE] bg-white px-8 pt-5">
          <div className="flex flex-nowrap gap-6">
            {PRODUCT_TABS.map((t, i) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(i)}
                className={`relative whitespace-nowrap pb-2.5 text-[13.5px] transition-colors ${tab === i ? "font-bold text-[#2F68E5]" : "font-semibold text-[#6F6F8D] hover:text-[#17173A]"}`}
              >
                {t}
                {tab === i && <span className="absolute inset-x-0 bottom-0 h-[2.5px] rounded-full bg-[#2F68E5]" />}
              </button>
            ))}
          </div>
        </div>

        {/* Tab content */}
        <div className="nc-scroll min-h-0 flex-1 overflow-y-auto bg-white px-8 pt-5 pb-6">

          {/* ── Tab 0: Replenishment ── */}
          {tab === 0 && (
            <DSScope.Provider value={true}>
            <div className="flex flex-col gap-4">
              {/* Effective period card */}
              <div className="rounded-lg border border-[#EBEBF5] bg-white px-6 py-5">
                <h3 className="text-[14px] font-bold leading-[22px] tracking-[-0.01em] text-[#17173A]">Effective replenishment period</h3>
                <div className="mt-3 flex items-center gap-2.5">
                  {effDays != null ? (
                    <>
                      <span className="text-[26px] font-bold leading-none text-[#17173A]">{effDays}</span>
                      <span className="text-[14px] font-medium text-[#17173A]">days</span>
                      <span className="ml-1 rounded-[4px] border border-[#2F68E5] px-1.5 py-[3px] text-[10px] font-bold uppercase leading-[14px] tracking-[0.6px] text-[#2F68E5]">{effLabel}</span>
                    </>
                  ) : (
                    <span className="text-[14px] text-[#9494AE]">Not set yet</span>
                  )}
                </div>
                <div className="mt-4 flex items-start gap-2.5 rounded-md bg-[#fdf8ec] px-4 py-3">
                  <InfoIcon className="mt-0.5 size-4 shrink-0 text-[#c88a1e]" />
                  <p className="text-[13px] leading-[20px] text-[#17173A]">
                    {effDays == null
                      ? <>{Noun} has <span className="font-bold">no replenishment period</span> set yet. Set one manually or configure a global fallback.</>
                      : eff.source === "fallback"
                      ? <>{Noun} is currently using the <span className="font-bold">global fallback</span> for replenishment period</>
                      : eff.source === "manual"
                      ? (eff.level === entity.kind
                          ? <>{Noun} is currently using your <span className="font-bold">manually set value</span> as the replenishment due period</>
                          : <>{Noun} is currently using the <span className="font-bold">{LEVEL_NOUN[eff.level!]} setting</span> for replenishment period</>)
                      : <>{Noun} is currently using the <span className="font-bold">{eff.level === entity.kind ? "AI recommendation" : `${LEVEL_NOUN[eff.level!]} AI recommendation`}</span> for the replenishment period.</>
                    }
                  </p>
                </div>
              </div>

              {/* Set replenishment manually card */}
              <div className="rounded-lg border border-[#EBEBF5] bg-white px-6 py-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h3 className="text-[14px] font-bold leading-[22px] tracking-[-0.01em] text-[#17173A]">Set replenishment manually</h3>
                    <p className="mt-1 text-[13px] leading-[20px] text-[#6F6F8D]">Manually configure replenishment time for this {noun} after purchase</p>
                  </div>
                  <Toggle on={manualOn} onChange={setManualOn} />
                </div>

                {manualOn && (
                  <div className="mt-5">
                    {entity.ai != null && (
                      <div className="flex items-center gap-2 text-[13.5px]">
                        <AiSourceGlyph className="size-4 text-[#2F68E5]" />
                        <span className="text-[#17173A]">AI recommendation : <span className="font-bold">{entity.ai} days</span></span>
                        <span className="text-[#DDE2EE]">|</span>
                        <span className="flex items-center gap-1 font-medium" style={{ color: CONF_META[entity.aiConf].color }}>
                          {CONF_META[entity.aiConf].label}
                          <InfoIcon className="size-3.5 text-[#9494AE]" />
                        </span>
                      </div>
                    )}

                    <div className="my-5 border-t border-[#EDF0F7]" />

                    {entity.ai != null && <RepurchaseChart aiDay={entity.ai} manualDay={manualDay} manualLabel={manualLabel} />}

                    <div className="my-5 border-t border-[#EDF0F7]" />

                    {/* Only the levels that actually exist in configuration. */}
                    <div className="flex flex-col gap-3.5">
                      {hasCat && (
                        <div className="flex flex-wrap items-center gap-3">
                          <RadioRow selected={effReplMode === "category"} onSelect={() => setReplMode("category")}>
                            Use same settings set for the category
                          </RadioRow>
                          <span className="text-[#DDE2EE]">|</span>
                          <span className="whitespace-nowrap text-[14px] font-semibold text-[#17173A]">{entity.category} : {catDays} days</span>
                        </div>
                      )}
                      {fbOn && (
                        <div className="flex flex-wrap items-center gap-3">
                          <RadioRow selected={effReplMode === "fallback"} onSelect={() => setReplMode("fallback")}>
                            Use fallback period set at global level for this catalog
                          </RadioRow>
                          <span className="text-[#DDE2EE]">|</span>
                          <span className="whitespace-nowrap text-[14px] font-semibold text-[#17173A]">{fbVal} days</span>
                        </div>
                      )}
                      <RadioRow selected={effReplMode === "custom"} onSelect={() => setReplMode("custom")}>
                        Add custom settings for this {noun}
                      </RadioRow>
                    </div>

                    {effReplMode === "custom" && (
                      <div className="mt-4">
                        <p className="text-[13px] font-semibold leading-[20px] text-[#17173A]">Replenishment after</p>
                        <div className="mt-2.5 flex flex-wrap items-center gap-3">
                          <DSNumberField value={customVal} onChange={setCustomVal} />
                          <DSUnitSelect value={customUnit} onChange={setCustomUnit} />
                        </div>
                      </div>
                    )}

                    {/* Rule priority exists only at product level. */}
                    {entity.kind === "product" && (
                      <>
                        <div className="my-5 border-t border-[#EDF0F7]" />
                        <RulePriorityRow checked={rulePriority} onChange={setRulePriority} level="product" />
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
            </DSScope.Provider>
          )}

          {/* ── Tab 1: Remind before replenishment — preview first ── */}
          {tab === 1 && (
            <DSScope.Provider value={true}>
            <div className="flex flex-col gap-4">
              <PreviewTimeline
                title={`Preview for this ${noun}`}
                endRight={effDays != null ? `Day ${effDays}` : "No Reminder"}
                endRightSub={effDays != null ? "Replenishment due" : "Fallback is not set"}
                markers={[
                  { icon: "important", tip: [daysAfterPurchase(minVal), "Earliest reminder possible"] },
                  /* A reminder is sent as soon as the product has a period to
                     work back from; the buffer only shifts it earlier. */
                  effDays == null
                    ? { icon: "none", at: 100 }
                    : {
                        icon: "announce",
                        day: daysBefore(effDays - Math.max(minVal, effDays - tbEffective)),
                        label: "Send reminder",
                        at: effDays ? (Math.max(minVal, effDays - tbEffective) / effDays) * 100 : 100,
                        accent: true,
                      },
                ]}
              />

              <div className="rounded-lg border border-[#EBEBF5] bg-white px-6 py-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h3 className="text-[14px] font-bold leading-[22px] tracking-[-0.01em] text-[#17173A]">Remind before replenishment</h3>
                    <p className="mt-1 max-w-[520px] text-[13px] leading-[20px] text-[#6F6F8D]">Start the replenishment journey a few days before the expected replenishment date, so the reminder arrives in time.</p>
                  </div>
                  <Toggle on={tbOn} onChange={setTbOn} />
                </div>

                {tbOn && (
                  <div className="mt-5 flex flex-col gap-3.5">
                    {inheritedBuf.days != null && (
                      <div className="flex flex-wrap items-center gap-3">
                        <RadioRow selected={effTbMode === "global"} onSelect={() => setTbMode("global")}>
                          {inheritedBuf.level === "global"
                            ? "Use same settings as set at global level for this catalog"
                            : `Use same settings as set for the ${LEVEL_NOUN[inheritedBuf.level!]}`}
                        </RadioRow>
                        <span className="text-[#DDE2EE]">|</span>
                        <span className="text-[14px] text-[#17173A]">Remind {inheritedBuf.days} days before replenishment</span>
                      </div>
                    )}
                    <RadioRow selected={effTbMode === "custom"} onSelect={() => setTbMode("custom")}>
                      Add custom settings for this {noun}
                    </RadioRow>
                    {effTbMode === "custom" && (
                      <div className="mt-1">
                        <div className="flex flex-wrap items-center gap-3">
                          <DSNumberField value={tbVal} onChange={setTbVal} max={maxBuffer} />
                          <DSUnitSelect value={tbUnit} onChange={setTbUnit} />
                          <span className="text-[13px] leading-[20px] text-[#17173A]">before replenishment</span>
                        </div>
                        {tbVal >= maxBuffer && <MinWaitNotice minVal={minVal} />}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            </DSScope.Provider>
          )}
        </div>

        {/* Footer */}
        <div className="shrink-0 border-t border-[#DDE2EE] bg-white px-8 py-4">
          <button
            type="button"
            onClick={() => onSave(entity.key, draft)}
            className="rounded-lg bg-[#2F68E5] px-5 py-2.5 text-[13px] font-bold uppercase tracking-wide text-white transition-colors duration-150 ease-out hover:bg-[#2152BF] active:bg-[#0251BA] focus-visible:outline-none focus-visible:shadow-[0_0_0_4px_rgba(47,104,229,0.15)]"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

/* What the level config panel needs to know about its subject. Category and
   sub-category share one surface; only the header meta, the copy noun, the
   level above and how the hierarchy is resolved differ. */
type LevelPanelEntity = {
  kind: "category" | "sub";
  name: string;
  /** Own AI recommendation, if any. */
  ai: number | null;
  aiConf: Confidence;
  /** Header meta line — the spans under the title. */
  meta: React.ReactNode;
  /** The category this level sits under; the category itself has none. */
  parentCategory?: string;
  resolve: (cfg: ReplConfig) => Resolved;
  resolveBuf: (cfg: ReplConfig) => ResolvedBuffer;
  withOverride: (cfg: ReplConfig, ov: LevelOverride) => ReplConfig;
};

/* Category panel — the shared level panel with a category as its subject. */
function CategoryConfigPanel({
  row,
  cfg,
  initial,
  onClose,
  onSave,
}: {
  row: CatListingRow;
  /** The whole hierarchy, so the panel resolves exactly as the listing does. */
  cfg: ReplConfig;
  initial?: LevelOverride;
  onClose: () => void;
  onSave: (name: string, ov: LevelOverride) => void;
}) {
  const entity: LevelPanelEntity = {
    kind: "category",
    name: row.name,
    ai: row.ai,
    aiConf: row.conf,
    meta: (
      <>
        <span>ID : 1234567</span>
        <span className="text-[#DDE2EE]">|</span>
        <span>Catalog : <span className="font-semibold text-[#17173A]">Food &amp; grocery</span></span>
      </>
    ),
    resolve: (c) => resolveCategory(row.name, c),
    resolveBuf: (c) => resolveCategoryBuffer(row.name, c),
    withOverride: (c, ov) => ({ ...c, category: { ...c.category, [row.name]: ov } }),
  };
  return <LevelConfigPanel entity={entity} cfg={cfg} initial={initial} onClose={onClose} onSave={onSave} />;
}

/* Sub-category panel — the same level panel, with a sub-category as its subject. */
function SubCategoryConfigPanel({
  row,
  cfg,
  initial,
  onClose,
  onSave,
}: {
  row: SubListingRow;
  cfg: ReplConfig;
  initial?: LevelOverride;
  onClose: () => void;
  onSave: (name: string, ov: LevelOverride) => void;
}) {
  const entity: LevelPanelEntity = {
    kind: "sub",
    name: row.name,
    ai: row.aiSub,
    aiConf: row.aiSubConf,
    meta: (
      <>
        <span>Category : <span className="font-semibold text-[#17173A]">{row.category}</span></span>
      </>
    ),
    parentCategory: row.category,
    resolve: (c) => resolveSub(row.name, row.category, c),
    resolveBuf: (c) => resolveSubBuffer(row.name, row.category, c),
    withOverride: (c, ov) => ({ ...c, sub: { ...c.sub, [row.name]: ov } }),
  };
  return <LevelConfigPanel entity={entity} cfg={cfg} initial={initial} onClose={onClose} onSave={onSave} />;
}

function LevelConfigPanel({
  entity,
  cfg,
  initial,
  onClose,
  onSave,
}: {
  entity: LevelPanelEntity;
  cfg: ReplConfig;
  initial?: LevelOverride;
  onClose: () => void;
  onSave: (name: string, ov: LevelOverride) => void;
}) {
  const { fbOn, fbVal, minVal } = cfg.global;
  const [tab, setTab] = useState(0);
  /* "category" / "sub-category" — the noun the panel copy refers to its subject by. */
  const noun = entity.kind === "category" ? "category" : "sub-category";
  const Noun = entity.kind === "category" ? "This category" : "This sub-category";
  const badge = entity.kind === "category" ? "Category" : "Sub-category";

  /* What the parent category resolves to on its own — only a sub-category has
     one, and the "use the category setting" option is offered only when the
     category actually supplies the value. */
  const catRes = entity.parentCategory ? resolveCategory(entity.parentCategory, cfg) : NO_VALUE;
  const hasCat = catRes.level === "category" && catRes.days != null;
  const catDays = catRes.days;

  /* What this level inherits when it sets no buffer of its own: the global
     buffer for a category, the category's (or global) for a sub-category. */
  const inheritedBuf = entity.resolveBuf(entity.withOverride(cfg, {}));
  const bufOn = inheritedBuf.days != null;
  const bufVal = inheritedBuf.days ?? MIN_REMINDER_DAYS;

  // Replenishment tab state. The fallback option only exists when a global
  // fallback is actually configured, so custom is the only mode without one.
  const [manualOn, setManualOn] = useState(initial?.repl != null);
  const [manualMode, setManualMode] = useState<"category" | "fallback" | "custom">(
    initial?.repl?.mode === "category" ? "category" :
    fbOn && initial?.repl?.mode === "global" ? "fallback" : "custom",
  );
  const [manualVal, setManualVal] = useState(
    initial?.repl?.mode === "custom" ? initial.repl.days : (entity.ai ?? MIN_REMINDER_DAYS),
  );
  const [manualUnit, setManualUnit] = useState("days");

  // Remind-before-replenishment tab state. With a global buffer configured the category
  // inherits it and starts on; with none there is nothing to inherit, so it
  // starts off and only a custom value can be set.
  const [tbOn, setTbOn] = useState(initial?.buffer ? initial.buffer.mode !== "off" : bufOn);
  const [tbMode, setTbMode] = useState<"global" | "custom">(
    initial?.buffer?.mode === "custom" ? "custom" : bufOn ? "global" : "custom",
  );
  const [tbVal, setTbVal] = useState(
    initial?.buffer?.mode === "custom" ? initial.buffer.days : (bufOn ? bufVal : MIN_REMINDER_DAYS),
  );
  const [tbUnit, setTbUnit] = useState("days");

  /* A mode that depends on state elsewhere can never be left stranded. */
  const effManualMode: "category" | "fallback" | "custom" =
    manualMode === "category" && !hasCat ? "custom"
    : manualMode === "fallback" && !fbOn ? "custom"
    : manualMode;
  const effTbMode = bufOn ? tbMode : "custom";

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const hasAi = entity.ai != null;

  /* The edits in this panel, in the shape they will be saved in. */
  const draft: LevelOverride = {};
  if (manualOn) {
    draft.repl =
      effManualMode === "custom" ? { mode: "custom", days: manualVal } :
      effManualMode === "fallback" ? { mode: "global" } : { mode: "category" };
  }
  /* Left unset when this level follows the one above, so a later change there
     still reaches it. "Off" is recorded only when there is a buffer to decline. */
  if (!tbOn && bufOn) draft.buffer = { mode: "off" };
  else if (tbOn && effTbMode === "custom") draft.buffer = { mode: "custom", days: tbVal };

  /* Resolved through the same functions the listing uses, with the unsaved
     edits layered on — so the panel can never drift from the row behind it. */
  const draftCfg = entity.withOverride(cfg, draft);
  const eff = entity.resolve(draftCfg);
  const effSource = eff.source;
  const curEffDays = eff.days;
  const curEffLabel = sourcePanelLabel(eff);
  /* The chart highlights whatever value is in force, wherever the selected
     radio resolves it from — the category's own value or the global fallback. */
  const manualDay = manualOn ? curEffDays : null;
  const manualLabel = eff.level === entity.kind ? "Manual override" : sourceLabel(eff);
  const maxBuffer = bufferCap(eff, cfg);
  /* Buffer actually in force for this level, from real inherited or local state. */
  const tbEffective = entity.resolveBuf(draftCfg).days ?? 0;

  const handleSave = () => onSave(entity.name, draft);

  return (
    <div className="fixed inset-0 z-[80] flex justify-end">
      <button type="button" aria-label="Close" onClick={onClose} className="absolute inset-0 cursor-default bg-[rgba(17,17,40,0.4)] animate-drawer-scrim" />

      <div className="relative flex h-full w-[52%] min-w-[720px] max-w-[860px] flex-col bg-white shadow-[-16px_0_48px_rgba(17,17,40,0.14)] animate-drawer-in">
        {/* Header — same rhythm as Global Settings: title, metadata, rule. */}
        <div className="shrink-0 px-8 pt-7">
          <div className="flex items-start justify-between gap-6">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2.5">
                <h2 className="text-[22px] font-bold leading-[32px] tracking-[-0.01em] text-[#17173A]">{entity.name}</h2>
                <span className="rounded-[4px] border border-[#2F68E5] px-1.5 py-[3px] text-[10px] font-bold uppercase leading-[14px] tracking-[0.6px] text-[#2F68E5]">{badge}</span>
              </div>
              <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] leading-[20px] text-[#6F6F8D]">
                {entity.meta}
              </div>
            </div>
            <button type="button" onClick={onClose} aria-label="Close panel" className="-mt-1 grid size-8 shrink-0 place-items-center rounded-lg text-[#6F6F8D] transition-colors hover:bg-[#F4F8FF] hover:text-[#17173A]">
              <CloseIcon className="size-5" />
            </button>
          </div>
        </div>

        {/* Tabs — sit directly under the header meta, active tab underlined. */}
        <div className="shrink-0 border-b border-[#DDE2EE] bg-white px-8 pt-5">
          <div className="flex flex-nowrap gap-6">
            {CATEGORY_TABS.map((t, i) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(i)}
                className={`relative whitespace-nowrap pb-2.5 text-[13.5px] transition-colors ${tab === i ? "font-bold text-[#2F68E5]" : "font-semibold text-[#6F6F8D] hover:text-[#17173A]"}`}
              >
                {t}
                {tab === i && <span className="absolute inset-x-0 bottom-0 h-[2.5px] rounded-full bg-[#2F68E5]" />}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="nc-scroll min-h-0 flex-1 overflow-y-auto bg-white px-8 pt-5 pb-6">
          {tab === 0 && (
            <DSScope.Provider value={true}>
            <div className="flex flex-col gap-4">
              {/* Effective replenishment period */}
              <div className="rounded-lg border border-[#EBEBF5] bg-white px-6 py-5">
                <h3 className="text-[14px] font-bold leading-[22px] tracking-[-0.01em] text-[#17173A]">Effective replenishment period</h3>
                <div className="mt-3 flex items-center gap-2.5">
                  {curEffDays != null ? (
                    <>
                      <span className="text-[26px] font-bold leading-none text-[#17173A]">{curEffDays}</span>
                      <span className="text-[14px] font-medium text-[#17173A]">days</span>
                      <span className={`ml-1 rounded border px-2 py-0.5 text-[11px] font-bold ${effSource === "ai" ? "border-[#00c48c] text-[#00c48c]" : effSource === "manual" ? "border-[#2F68E5] text-[#2F68E5]" : "border-[#9494AE] text-[#6F6F8D]"}`}>{curEffLabel}</span>
                    </>
                  ) : (
                    <span className="text-[14px] text-[#9494AE]">Not set yet</span>
                  )}
                </div>
                <div className="mt-4 flex items-start gap-2.5 rounded-md bg-[#fdf8ec] px-4 py-3">
                  <InfoIcon className="mt-0.5 size-4 shrink-0 text-[#c88a1e]" />
                  <p className="text-[13px] leading-relaxed text-[#17173A]">
                    {effSource === "manual" ? (
                      eff.level === entity.kind
                        ? <>{Noun} is currently using your <span className="font-bold">manually set value</span> as the replenishment due period</>
                        : <>{Noun} is currently using the <span className="font-bold">{LEVEL_NOUN[eff.level!]} setting</span> for replenishment period</>
                    ) : effSource === "ai" ? (
                      eff.level === entity.kind
                        ? <>{Noun} is currently using <span className="font-bold">AI recommendation</span> for replenishment period</>
                        : <>{Noun} is currently using the <span className="font-bold">{LEVEL_NOUN[eff.level!]} AI recommendation</span> for replenishment period</>
                    ) : effSource === "fallback" ? (
                      <>{Noun} is currently using the <span className="font-bold">global fallback</span> for replenishment period</>
                    ) : (
                      <>{Noun} has <span className="font-bold">no replenishment period</span> set yet. Set one manually or configure a global fallback.</>
                    )}
                  </p>
                </div>
              </div>

              {/* Set replenishment manually */}
              <div className="rounded-lg border border-[#EBEBF5] bg-white px-6 py-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h3 className="text-[14px] font-bold leading-[22px] tracking-[-0.01em] text-[#17173A]">Set replenishment manually</h3>
                    <p className="mt-1 text-[13px] leading-[20px] text-[#6F6F8D]">Manually configure replenishment time for this {noun} after purchase</p>
                  </div>
                  <Toggle on={manualOn} onChange={setManualOn} />
                </div>
                {manualOn && (
                  <div className="mt-5">
                    {hasAi && (
                      <div className="flex items-center gap-2 text-[13.5px]">
                        <AiSourceGlyph className="size-4 text-[#2F68E5]" />
                        <span className="text-[#17173A]">AI recommendation : <span className="font-bold">{entity.ai} days</span></span>
                        <span className="text-[#DDE2EE]">|</span>
                        <span className="flex items-center gap-1 font-medium" style={{ color: CONF_META[entity.aiConf].color }}>
                          {CONF_META[entity.aiConf].label}
                          <InfoIcon className="size-3.5 text-[#9494AE]" />
                        </span>
                      </div>
                    )}
                    {/* Divider 1: AI rec → chart */}
                    <div className="my-5 border-t border-[#EDF0F7]" />
                    {hasAi && <RepurchaseChart aiDay={entity.ai!} manualDay={manualDay} manualLabel={manualLabel} />}
                    {/* Divider 2: chart → radio options */}
                    <div className="my-5 border-t border-[#EDF0F7]" />
                    <div className="flex flex-col gap-3.5">
                      {/* Only the levels that actually exist in configuration. */}
                      {hasCat && (
                        <div className="flex flex-wrap items-center gap-3">
                          <RadioRow selected={effManualMode === "category"} onSelect={() => setManualMode("category")}>
                            Use same settings set for the category
                          </RadioRow>
                          <span className="text-[#DDE2EE]">|</span>
                          <span className="whitespace-nowrap text-[14px] font-semibold text-[#17173A]">{entity.parentCategory} : {catDays} days</span>
                        </div>
                      )}
                      {/* Only offered when the catalog actually has a fallback to inherit. */}
                      {fbOn && (
                        <div className="flex flex-wrap items-center gap-3">
                          <RadioRow selected={effManualMode === "fallback"} onSelect={() => setManualMode("fallback")}>
                            Use fallback period set at global level for this catalog
                          </RadioRow>
                          <span className="text-[#DDE2EE]">|</span>
                          <span className="text-[14px] font-semibold text-[#17173A]">{fbVal} days</span>
                        </div>
                      )}
                      <RadioRow selected={effManualMode === "custom"} onSelect={() => setManualMode("custom")}>
                        Add custom settings for this {noun}
                      </RadioRow>
                    </div>
                    {effManualMode === "custom" && (
                      <div className="mt-4">
                        <p className="text-[13px] font-semibold leading-[20px] text-[#17173A]">Replenishment after</p>
                        <div className="mt-2.5 flex flex-wrap items-center gap-3">
                          <DSNumberField value={manualVal} onChange={setManualVal} />
                          <DSUnitSelect value={manualUnit} onChange={setManualUnit} />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            </DSScope.Provider>
          )}

          {tab === 1 && (
            <DSScope.Provider value={true}>
            <div className="flex flex-col gap-4">
              {/* Same timeline component as Global Settings, driven by this
                  category's effective period, the global minimum reminder and
                  the buffer actually in force. */}
              <PreviewTimeline
                title={`Preview for this ${noun}`}
                endRight={curEffDays != null ? `Day ${curEffDays}` : "No Reminder"}
                endRightSub={curEffDays != null ? "Replenishment due" : "Fallback is not set"}
                markers={[
                  { icon: "important", tip: [daysAfterPurchase(minVal), "Earliest reminder possible"] },
                  /* A reminder is sent as soon as the category has a period
                     to work back from; the buffer only shifts it earlier. */
                  curEffDays == null
                    ? { icon: "none", at: 100 }
                    : {
                        icon: "announce",
                        day: daysBefore(curEffDays - Math.max(minVal, curEffDays - tbEffective)),
                        label: "Send reminder",
                        at: curEffDays ? (Math.max(minVal, curEffDays - tbEffective) / curEffDays) * 100 : 100,
                        accent: true,
                      },
                ]}
              />

              <div className="rounded-lg border border-[#EBEBF5] bg-white px-6 py-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h3 className="text-[14px] font-bold leading-[22px] tracking-[-0.01em] text-[#17173A]">Remind before replenishment</h3>
                    <p className="mt-1 max-w-[520px] text-[13px] leading-[20px] text-[#6F6F8D]">Start the replenishment journey a few days before the expected replenishment date, so the reminder arrives in time.</p>
                  </div>
                  <Toggle on={tbOn} onChange={setTbOn} />
                </div>
                {tbOn && (
                  <div className="mt-5 flex flex-col gap-3.5">
                    {/* Nothing to inherit unless a level above has a buffer. */}
                    {bufOn && (
                      <div className="flex flex-wrap items-center gap-3">
                        <RadioRow selected={effTbMode === "global"} onSelect={() => setTbMode("global")}>
                          {inheritedBuf.level === "global"
                            ? "Use same settings as set at global level for this catalog"
                            : `Use same settings as set for the ${LEVEL_NOUN[inheritedBuf.level!]}`}
                        </RadioRow>
                        <span className="text-[#DDE2EE]">|</span>
                        <span className="text-[14px] text-[#17173A]">Remind {bufVal} days before replenishment</span>
                      </div>
                    )}
                    <RadioRow selected={effTbMode === "custom"} onSelect={() => setTbMode("custom")}>
                      Add custom settings for this {noun}
                    </RadioRow>
                    {effTbMode === "custom" && (
                      <div className="mt-1">
                        <div className="flex flex-wrap items-center gap-3">
                          <DSNumberField value={tbVal} onChange={setTbVal} max={maxBuffer} />
                          <DSUnitSelect value={tbUnit} onChange={setTbUnit} />
                          <span className="text-[13px] leading-[20px] text-[#17173A]">before replenishment</span>
                        </div>
                        {tbVal >= maxBuffer && <MinWaitNotice minVal={minVal} />}
                      </div>
                    )}
                  </div>
                )}
              </div>

            </div>
            </DSScope.Provider>
          )}

        </div>

        {/* Bottom action bar */}
        <div className="shrink-0 border-t border-[#DDE2EE] bg-white px-8 py-4">
          <button
            type="button"
            onClick={handleSave}
            className="rounded-lg bg-[#2F68E5] px-5 py-2.5 text-[13px] font-bold uppercase tracking-wide text-white transition-colors duration-150 ease-out hover:bg-[#2152BF] active:bg-[#0251BA] focus-visible:outline-none focus-visible:shadow-[0_0_0_4px_rgba(47,104,229,0.15)]"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

/* Empty / placeholder table body. Used only by the Replenishment listing
   table, so it carries the DS §12.11 empty-row treatment directly. */
function EmptyListing({ entity, placeholder }: { entity: string; placeholder?: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
      <SearchIconDS className="size-7 text-[#D9D9E8]" />
      <p className="mt-3 text-[14px] font-semibold leading-[22px] tracking-[-0.01em] text-[#17173A]">
        {placeholder ? `${entity[0].toUpperCase() + entity.slice(1)} view coming soon` : `No ${entity} found`}
      </p>
      <p className="mt-1 text-[13px] font-medium leading-[21px] tracking-[-0.01em] text-[#6F6F8D]">
        {placeholder
          ? `Switch View by to Categories, Group or Products to see the listing.`
          : `Try a different search or filter.`}
      </p>
    </div>
  );
}

/* ─── Replenishment Event Panel ──────────────────────────────────────────── */

const CATALOGS = [
  { id: "dmart", label: "D-mart" },
  { id: "bigbazaar", label: "Bigbazaar" },
];
const ITEM_TYPES = [
  { id: "category", label: "Category" },
  { id: "subcategory", label: "Sub-category" },
  { id: "group", label: "Group" },
  { id: "product", label: "Product" },
] as const;
/* The Journey's run window, owned by Journey settings. The builder header and
   the Replenishment event panel both read it, so the panel surfaces the real
   values instead of keeping a second copy. `end: null` = never ending. */
const JOURNEY_SCHEDULE: { start: string; end: string | null } = {
  start: "May 4, 2026, 10:30 AM",
  end: null,
};

/* Entry-time options. Minutes step in fives, as the rest of the product does. */
const HOURS = Array.from({ length: 12 }, (_, i) => String(i + 1));
const MINUTES = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, "0"));
const MERIDIEM = ["AM", "PM"];

type ItemType = (typeof ITEM_TYPES)[number]["id"];

/* "All" is a real option, not a label: it resolves to every item at that level
   when the selection is counted. */
const ALL_ITEM = { id: "all", label: "All" };

function getItemsForType(type: ItemType): { id: string; label: string }[] {
  if (type === "category") return [ALL_ITEM, ...categories.map((c) => ({ id: c.id, label: c.name }))];
  if (type === "subcategory") return [ALL_ITEM, ...subs.map((s) => ({ id: s.id, label: s.name }))];
  if (type === "group") return [ALL_ITEM, ...groups.map((g) => ({ id: g.id, label: g.name }))];
  return [ALL_ITEM, ...products.slice(0, 60).map((p) => ({ id: p.id, label: p.name }))];
}

type FilterRow = { id: number; itemType: ItemType; item: string };

/* The configured rows expressed as the same selection keys the Manage items
   overlay uses, so the summary is counted by the same helper — overlapping
   rows are de-duplicated rather than added together. */
function rowsToSelection(rows: FilterRow[]): Set<string> {
  const sel = new Set<string>();
  for (const r of rows) {
    if (!r.item) continue;
    if (r.item === "all") {
      /* Every item at that level. "All products" is the whole catalogue, so it
         is expressed at category level where the declared counts live. */
      if (r.itemType === "subcategory") subs.forEach((x) => sel.add(`sub:${x.id}`));
      else if (r.itemType === "group") groups.forEach((x) => sel.add(`group:${x.id}`));
      else categories.forEach((x) => sel.add(`cat:${x.id}`));
      continue;
    }
    if (r.itemType === "category") sel.add(`cat:${r.item}`);
    else if (r.itemType === "subcategory") sel.add(`sub:${r.item}`);
    else if (r.itemType === "group") sel.add(`group:${r.item}`);
    else sel.add(`prod:${r.item}`);
  }
  return sel;
}

/* Products the current trigger configuration resolves to. The Journey is scoped
   to a single catalog, chosen above, so the count is the only thing left to
   report here. */
function triggerProductCount(mode: "all" | "specific", rows: FilterRow[]): number {
  if (mode === "all") return categories.reduce((a, c) => a + c.productCount, 0);
  const sel = rowsToSelection(rows.filter((r) => r.item !== ""));
  return groups.reduce((a, g) => a + groupCovered(sel, g), 0);
}

/* The yellow trigger summary, shared by both radio states. */
function TriggerSummary({ products: count }: { products: number }) {
  return (
    <div className="rounded-[4px] border-l-2 border-[#FFCF5C] bg-[#FFF8E7] px-4 py-2.5">
      <p className="text-[13px] font-semibold leading-[21px] tracking-[-0.01em] text-[#17173A]">
        {num(count)} {count === 1 ? "Product" : "Products"} found
      </p>
    </div>
  );
}

/* "Set time when communication goes out" — one card shared by the
   Replenishment event panel in the Journey builder and the Communication tab
   of Replenishment settings. Title and description default to the Journey
   copy; the time pickers and their options are the same in both places. */
/* ─── Panel: empty state (kept for reference, now inlined) ────────────────── */

function EmptyPanel() {
  return (
    <div className="pt-2 text-center">
      <p className="text-[12.5px] font-semibold text-[#17173A]">Nothing selected yet</p>
      <p className="mt-1 text-[11.5px] leading-relaxed text-[#6F6F8D]">
        Select products, groups, sub-categories or categories to see them here.
      </p>
    </div>
  );
}

/* ─── Panel: Products view ─────────────────────────────────────────────────── */

function ProductsPanelView({
  has,
  isProductCovered,
  coverageLabel,
  removeProduct,
}: {
  has: (k: string) => boolean;
  isProductCovered: (p: (typeof products)[number]) => boolean;
  coverageLabel: (p: (typeof products)[number]) => string | null;
  removeProduct: (id: string) => void;
}) {
  const ds = useDS();
  const visible = products.filter((p) => isProductCovered(p) || has(`prod:${p.id}`));
  if (visible.length === 0) {
    return (
      <p className={ds ? "text-[13px] font-medium leading-[21px] tracking-[-0.01em] text-[#6F6F8D]" : "text-[11.5px] text-[#6F6F8D]"}>
        No individual products in the sample are covered by your selection. Try the Categories view.
      </p>
    );
  }
  return (
    <div className="flex flex-col gap-3">
      {visible.map((p) => {
        const label = coverageLabel(p);
        return (
          <div key={p.id} className={ds ? "group flex items-center gap-2.5 rounded-lg border border-[#D9D9E8] p-2.5 transition-colors hover:border-[#9898B0] hover:bg-[#F6F8FF]" : "group flex items-center gap-2.5 rounded-lg border border-[#DDE2EE] p-2.5 transition-colors hover:border-[#c5cce8]"}>
            <img src={p.image} alt="" className={ds ? "size-8 shrink-0 rounded-md border border-[#D9D9E8] bg-[#F4F8FF] object-cover" : "size-8 shrink-0 rounded-md border border-[#DDE2EE] bg-[#F4F8FF] object-cover"} />
            <div className="min-w-0 flex-1">
              <p className={ds ? "truncate text-[14px] font-semibold leading-[22px] tracking-[-0.01em] text-[#17173A]" : "truncate text-[14px] font-semibold text-[#17173A]"}>{p.name}</p>
              <p className={ds ? "mt-0.5 text-[12px] font-medium leading-[20px] text-[#6F6F8D]" : "mt-0.5 text-[12px] leading-relaxed text-[#6F6F8D]"}>
                <span>Cat: {p.catName}</span>
                <span className={ds ? "mx-1 text-[#D9D9E8]" : "mx-1 text-[#DDE2EE]"}>|</span>
                <span>Sub-cat: {p.subName}</span>
              </p>
            </div>
            <button
              type="button"
              onClick={() => removeProduct(p.id)}
              className={ds ? "grid size-6 shrink-0 place-items-center rounded text-[#6F6F8D] opacity-0 transition-all hover:bg-[#FFE7E7] hover:text-[#F05C5C] group-hover:opacity-100" : "grid size-6 shrink-0 place-items-center rounded text-[#6F6F8D] opacity-0 transition-all hover:bg-red-50 hover:text-[#F05C5C] group-hover:opacity-100"}
              aria-label={`Remove ${p.name}`}
            >
              {ds ? <DeleteIconDS className="size-3.5" /> : <TrashIcon className="size-3.5" />}
            </button>
          </div>
        );
      })}
    </div>
  );
}

/* ─── Panel: Sub-categories view ───────────────────────────────────────────── */

function SubsPanelView({
  selectedSubIds,
  subContribution,
  toggleSub,
}: {
  selectedSubIds: string[];
  subContribution: (id: string) => number;
  toggleSub: (id: string) => void;
}) {
  const ds = useDS();
  return (
    <div className="flex flex-col gap-3">
      {selectedSubIds.map((sid) => {
        const s = subs.find((x) => x.id === sid)!;
        const count = subContribution(sid);
        return (
          <div key={sid} className={ds ? "group flex items-center gap-2.5 rounded-lg border border-[#D9D9E8] p-2.5 transition-colors hover:border-[#9898B0] hover:bg-[#F6F8FF]" : "group flex items-center gap-2.5 rounded-lg border border-[#DDE2EE] p-2.5 transition-colors hover:border-[#c5cce8]"}>
            <div className="min-w-0 flex-1">
              <p className={ds ? "truncate text-[14px] font-semibold leading-[22px] tracking-[-0.01em] text-[#17173A]" : "truncate text-[14px] font-semibold text-[#17173A]"}>{s.name}</p>
              <p className="text-[12.5px] text-[#6F6F8D]">{num(count)} products included</p>
            </div>
            <button
              type="button"
              onClick={() => toggleSub(sid)}
              className={ds ? "grid size-6 shrink-0 place-items-center rounded text-[#6F6F8D] opacity-0 transition-all hover:bg-[#FFE7E7] hover:text-[#F05C5C] group-hover:opacity-100" : "grid size-6 shrink-0 place-items-center rounded text-[#6F6F8D] opacity-0 transition-all hover:bg-red-50 hover:text-[#F05C5C] group-hover:opacity-100"}
              aria-label={`Remove ${s.name}`}
            >
              {ds ? <DeleteIconDS className="size-3.5" /> : <TrashIcon className="size-3.5" />}
            </button>
          </div>
        );
      })}
    </div>
  );
}

/* ─── Panel: Groups view ───────────────────────────────────────────────────── */

function GroupsPanelView({
  selectedGroupIds,
  groupContribution,
  toggleGroup,
}: {
  selectedGroupIds: string[];
  groupContribution: (id: string) => number;
  toggleGroup: (id: string) => void;
}) {
  const ds = useDS();
  return (
    <div className="flex flex-col gap-3">
      {selectedGroupIds.map((gid) => {
        const g = groups.find((x) => x.id === gid)!;
        const count = groupContribution(gid);
        return (
          <div key={gid} className={ds ? "group flex items-center gap-2.5 rounded-lg border border-[#D9D9E8] p-2.5 transition-colors hover:border-[#9898B0] hover:bg-[#F6F8FF]" : "group flex items-center gap-2.5 rounded-lg border border-[#DDE2EE] p-2.5 transition-colors hover:border-[#c5cce8]"}>
            <div className="min-w-0 flex-1">
              <p className={ds ? "truncate text-[14px] font-semibold leading-[22px] tracking-[-0.01em] text-[#17173A]" : "truncate text-[14px] font-semibold text-[#17173A]"}>{g.name}</p>
              <p className="text-[12.5px] text-[#6F6F8D]">{num(count)} products included</p>
            </div>
            <button
              type="button"
              onClick={() => toggleGroup(gid)}
              className={ds ? "grid size-6 shrink-0 place-items-center rounded text-[#6F6F8D] opacity-0 transition-all hover:bg-[#FFE7E7] hover:text-[#F05C5C] group-hover:opacity-100" : "grid size-6 shrink-0 place-items-center rounded text-[#6F6F8D] opacity-0 transition-all hover:bg-red-50 hover:text-[#F05C5C] group-hover:opacity-100"}
              aria-label={`Remove ${g.name}`}
            >
              {ds ? <DeleteIconDS className="size-3.5" /> : <TrashIcon className="size-3.5" />}
            </button>
          </div>
        );
      })}
    </div>
  );
}

/* ─── Panel: Categories view ───────────────────────────────────────────────── */

function CategoriesPanelView({
  selectedCatIds,
  catContribution,
  has,
  clearCategory,
}: {
  selectedCatIds: string[];
  catContribution: (id: string) => number;
  has: (k: string) => boolean;
  clearCategory: (id: string) => void;
}) {
  const ds = useDS();
  return (
    <div className="flex flex-col gap-3">
      {selectedCatIds.map((catId) => {
        const c = catById(catId)!;
        const count = catContribution(catId);
        const full = has(`cat:${catId}`);
        return (
          <div key={catId} className={ds ? "group flex items-center gap-2.5 rounded-lg border border-[#D9D9E8] p-2.5 transition-colors hover:border-[#9898B0] hover:bg-[#F6F8FF]" : "group flex items-center gap-2.5 rounded-lg border border-[#DDE2EE] p-2.5 transition-colors hover:border-[#c5cce8]"}>
            <img
              src={c.image}
              alt=""
              className={ds ? "size-8 shrink-0 rounded-md border border-[#D9D9E8] bg-[#F4F8FF] object-cover" : "size-8 shrink-0 rounded-md border border-[#DDE2EE] bg-[#F4F8FF] object-cover"}
            />
            <div className="min-w-0 flex-1">
              <p className={ds ? "truncate text-[14px] font-semibold leading-[22px] tracking-[-0.01em] text-[#17173A]" : "truncate text-[14px] font-semibold text-[#17173A]"}>{c.name}</p>
              <p className="text-[12.5px] text-[#6F6F8D]">
                {full ? "Entire category · " : ""}{num(count)} products included
              </p>
            </div>
            <button
              type="button"
              onClick={() => clearCategory(catId)}
              className={ds ? "grid size-6 shrink-0 place-items-center rounded text-[#6F6F8D] opacity-0 transition-all hover:bg-[#FFE7E7] hover:text-[#F05C5C] group-hover:opacity-100" : "grid size-6 shrink-0 place-items-center rounded text-[#6F6F8D] opacity-0 transition-all hover:bg-red-50 hover:text-[#F05C5C] group-hover:opacity-100"}
              aria-label={`Remove ${c.name}`}
            >
              {ds ? <DeleteIconDS className="size-3.5" /> : <TrashIcon className="size-3.5" />}
            </button>
          </div>
        );
      })}
    </div>
  );
}

/* ─── Filters popup ────────────────────────────────────────────────────────── */

function FiltersPopup({
  view,
  catFilter,
  subFilter,
  groupFilter,
  catOptions,
  subOptions,
  groupOptions,
  onCatChange,
  onSubChange,
  onGroupChange,
}: {
  view: ViewBy;
  catFilter: string;
  subFilter: string;
  groupFilter: string;
  catOptions: { value: string; label: string }[];
  subOptions: { value: string; label: string }[];
  groupOptions: { value: string; label: string }[];
  onCatChange: (v: string) => void;
  onSubChange: (v: string) => void;
  onGroupChange: (v: string) => void;
}) {
  const ds = useDS();
  const [open, setOpen] = useState(false);

  const activeCount =
    (catFilter !== "all" ? 1 : 0) +
    (subFilter !== "all" ? 1 : 0) +
    (groupFilter !== "all" ? 1 : 0);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={[
          ds
            ? "flex h-8 items-center gap-1.5 rounded-sm border px-3 text-[13px] leading-[21px] tracking-[-0.01em] transition-[border-color,background-color,box-shadow] duration-150 ease-out"
            : "flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-[12.5px] transition-all",
          open || activeCount > 0
            ? ds
              ? "border-[1.5px] border-[#2F68E5] bg-white text-[#2F68E5] shadow-[0_0_0_4px_rgba(47,104,229,0.15)]"
              : "border-[#2F68E5] bg-white text-[#2F68E5] shadow-[0_0_0_3px_rgba(47,75,229,0.1)]"
            : ds
              ? "border-[#D9D9E8] bg-white text-[#17173A] hover:border-[#9898B0] hover:bg-[#F6F8FF]"
              : "border-[#DDE2EE] bg-white text-[#17173A] hover:border-[#c5cce8]",
        ].join(" ")}
      >
        {ds ? <FilterIconDS className="size-3.5" /> : <FilterIcon className="size-3.5" />}
        <span className="font-semibold">Filters</span>
        {activeCount > 0 && (
          <span className={ds ? "grid size-4 place-items-center rounded-full bg-[#2F68E5] text-[10px] font-bold text-white" : "grid size-4 place-items-center rounded-full bg-[#2F68E5] text-[10px] font-bold text-white"}>
            {activeCount}
          </span>
        )}
        {ds ? (
          <CaretDownDS className={`size-3 text-[#6F6F8D] transition-transform ${open ? "rotate-180" : ""}`} />
        ) : (
          <ChevronDown className={`size-3 text-[#6F6F8D] transition-transform ${open ? "rotate-180" : ""}`} />
        )}
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-hidden
            className="fixed inset-0 z-20 cursor-default"
            onClick={() => setOpen(false)}
          />
          {/* The popup only holds the fields; each field menu is a portalled
              popover (overlay) anchored under its own input, so the card's
              overflow-hidden cannot clip it and it may extend past the popup. */}
          <div className={ds ? "absolute left-0 top-[calc(100%+6px)] z-30 w-[320px] rounded-lg border border-[#D9D9E8] bg-white shadow-[0_8px_24px_rgba(23,23,58,0.14)]" : "absolute left-0 top-[calc(100%+6px)] z-30 w-[320px] rounded-xl border border-[#DDE2EE] bg-white shadow-[0_8px_28px_rgba(47,75,229,0.13)]"}>
            {/* Heading + Clear all */}
            <div className="flex items-center justify-between gap-3 px-4 py-3">
              <p className={ds ? "text-[13px] font-semibold leading-[21px] tracking-[-0.01em] text-[#17173A]" : "text-[13px] font-semibold text-[#17173A]"}>
                {view === "product" ? "Filter products by" :
                 view === "sub" ? "Filter sub-categories by" :
                 view === "group" ? "Filter groups by" :
                 "Filter categories by"}
              </p>
              {/* Resetting the category cascades sub-category and group back to
                  "all" through the existing handler, so no new state is needed. */}
              <button
                type="button"
                disabled={activeCount === 0}
                onClick={() => onCatChange("all")}
                className={[
                  "-my-1 shrink-0 rounded px-1.5 py-1 text-[13px] font-semibold leading-[21px] tracking-[-0.01em] transition-colors",
                  activeCount === 0
                    ? "cursor-not-allowed text-[#A0A0A0]"
                    : "text-[#6F6F8D] hover:text-[#F05C5C]",
                ].join(" ")}
              >
                Clear all
              </button>
            </div>
            <div className={ds ? "border-t border-[#D9D9E8]" : "border-t border-[#DDE2EE]"} />
            {/* Filter fields — also the boundary for the field menus. The
                min-height reserves space below the fields so a menu opens
                under its own field instead of being squeezed; it is capped
                against the viewport so a short window never clips the popup. */}
            <div className="flex flex-col gap-5 p-4">
              <div>
                <p className={ds ? "mb-1.5 text-[12px] font-semibold uppercase leading-[20px] tracking-[0.07em] text-[#9494AE]" : "mb-1.5 text-[11.5px] font-semibold text-[#6F6F8D] uppercase tracking-[0.3px]"}>Category</p>
                <Dropdown value={catFilter} options={catOptions} onChange={onCatChange} minWidth={256} fullWidth overlay />
              </div>
              {(view === "group" || view === "product") && (
                <div>
                  <p className={ds ? "mb-1.5 text-[12px] font-semibold uppercase leading-[20px] tracking-[0.07em] text-[#9494AE]" : "mb-1.5 text-[11.5px] font-semibold text-[#6F6F8D] uppercase tracking-[0.3px]"}>Sub-category</p>
                  <Dropdown value={subFilter} options={subOptions} onChange={onSubChange} minWidth={256} fullWidth overlay searchable searchPlaceholder="Search sub-categories" />
                </div>
              )}
              {view === "product" && (
                <div>
                  <p className={ds ? "mb-1.5 text-[12px] font-semibold uppercase leading-[20px] tracking-[0.07em] text-[#9494AE]" : "mb-1.5 text-[11.5px] font-semibold text-[#6F6F8D] uppercase tracking-[0.3px]"}>Group</p>
                  <Dropdown value={groupFilter} options={groupOptions} onChange={onGroupChange} minWidth={256} fullWidth overlay searchable searchPlaceholder="Search groups" />
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/* ─── Table ────────────────────────────────────────────────────────────────── */

/* One table skin for every migrated screen — DS §6.8 (th caption-M/SB on
   bg/subtle, td border #EBEBF5, row hover #F6F8FF) plus the §1.2 type scale.
   `rowCls`/`headCls` carry the band treatment only; each table adds its own
   layout classes, so a flex row and a grid row share the same rhythm.

   A plain function rather than a hook: DS 3.0 overlays provide DSScope
   itself and so cannot read the flag from its own body. */
function tableStyles(ds: boolean) {
  return {
    headCls: ds
      ? "sticky top-0 z-10 border-b border-[#EBEBF5] bg-[#FAFBFF] px-5 py-2.5"
      : "sticky top-0 z-10 border-b border-[#DDE2EE] bg-white px-5 py-2.5",
    rowCls: ds
      ? "border-b border-[#EBEBF5] px-5 py-3 transition-colors hover:bg-[#F6F8FF]"
      : "border-b border-[#EDF0F7] px-5 py-3 transition-colors hover:bg-[#fafbff]",
    tName: ds
      ? "text-[14px] font-semibold leading-[22px] tracking-[-0.01em] text-[#17173A]"
      : "text-[14px] font-semibold text-[#17173A]",
    tSec: ds
      ? "text-[13px] font-medium leading-[21px] tracking-[-0.01em] text-[#6F6F8D]"
      : "text-[13px] text-[#6F6F8D]",
    tTer: ds
      ? "text-[12px] font-medium leading-[20px] text-[#9494AE]"
      : "text-[12.5px] text-[#9494AE]",
    thumbCls: ds
      ? "size-9 shrink-0 rounded-md border border-[#D9D9E8] bg-[#F4F8FF] object-cover"
      : "size-9 shrink-0 rounded-md border border-[#DDE2EE] bg-[#F4F8FF] object-cover",
  };
}


function ColHead({ children, info }: { children: React.ReactNode; info?: boolean }) {
  const ds = useDS();
  return (
    <div
      className={
        ds
          ? // DS §6.8 table th: 12px/600 uppercase, ls .07em, txt/tertiary
            "flex items-center gap-1 text-[12px] font-semibold uppercase leading-[20px] tracking-[0.07em] text-[#9494AE]"
          : "flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.4px] text-[#6F6F8D]"
      }
    >
      {children}
      {info &&
        (ds ? (
          <InfoIconDS className="size-3 text-[#9494AE]" />
        ) : (
          <InfoIcon className="size-3 text-[#9494AE]" />
        ))}
    </div>
  );
}

function CountCell({ n, label }: { n: number; label: string }) {
  const ds = useDS();
  if (ds) {
    // DS: numeric = body-mid-m 14/22 SB; unit label = caption-m 12/20 M secondary
    return (
      <div className="text-[14px] leading-[22px] tracking-[-0.01em]">
        <span className="font-semibold text-[#17173A]">{num(n)}</span>{" "}
        <span className="text-[12px] font-medium leading-[20px] text-[#6F6F8D]">{label}</span>
      </div>
    );
  }
  return (
    <div className="text-[13px]">
      <span className="font-bold text-[#17173A]">{num(n)}</span>{" "}
      <span className="text-[12px] text-[#6F6F8D]">{label}</span>
    </div>
  );
}

function CatalogTable(props: {
  view: ViewBy;
  catFilterFn: (id: string) => boolean;
  subFilterFn: (id: string) => boolean;
  groupFilterFn: (id: string) => boolean;
  catState: (id: string) => { checked: boolean; indeterminate: boolean };
  subState: (id: string) => { checked: boolean; indeterminate: boolean };
  groupState: (id: string) => { checked: boolean; indeterminate: boolean };
  isProductCovered: (p: (typeof products)[number]) => boolean;
  coverageLabel: (p: (typeof products)[number]) => string | null;
  has: (k: string) => boolean;
  toggleCat: (id: string) => void;
  toggleSub: (id: string) => void;
  toggleGroup: (id: string) => void;
  toggleProduct: (id: string) => void;
  setSel: React.Dispatch<React.SetStateAction<Set<string>>>;
}) {
  const {
    view,
    catFilterFn,
    subFilterFn,
    groupFilterFn,
    catState,
    subState,
    groupState,
    isProductCovered,
    coverageLabel,
    has,
    toggleCat,
    toggleSub,
    toggleGroup,
    toggleProduct,
    setSel,
  } = props;

  const ds = useDS();
  const skin = tableStyles(ds);
  const { tName, tSec, tTer, thumbCls } = skin;
  // The rows lay a checkbox beside the column grid, so they add flex layout to
  // the shared band treatment.
  const rowCls = `flex items-center gap-3.5 ${skin.rowCls}`;

  const gridCols: Record<ViewBy, string> = {
    category: "grid-cols-[1.8fr_0.7fr_0.7fr_0.7fr]",
    sub: "grid-cols-[1.5fr_0.9fr_0.6fr_0.6fr]",
    group: "grid-cols-[1.5fr_1fr_0.8fr_0.6fr]",
    product: "grid-cols-[2fr_0.8fr_1fr_1fr_0.8fr]",
  };

  const visibleCats = categories.filter((c) => catFilterFn(c.id));
  const visibleSubs = subs.filter((s) => catFilterFn(s.catId));
  const visibleGroups = groups.filter((g) => catFilterFn(g.catId) && subFilterFn(g.subId));
  const visibleProds = products.filter(
    (p) =>
      catFilterFn(p.catId) &&
      subFilterFn(p.subId) &&
      groupFilterFn(p.groupId),
  );

  let allChecked = false;
  let someChecked = false;

  const selectAll = () => {
    setSel((prev) => {
      const next = new Set(prev);
      if (view === "category") {
        const all = visibleCats.every((c) => next.has(`cat:${c.id}`));
        visibleCats.forEach((c) => {
          if (all) next.delete(`cat:${c.id}`);
          else {
            next.add(`cat:${c.id}`);
            for (const k of Array.from(next)) {
              const [lvl, id] = k.split(":");
              if (lvl !== "cat") {
                const p = products.find((x) => x.id === id);
                const g = groups.find((x) => x.id === id);
                const s = subs.find((x) => x.id === id);
                const cid = p?.catId ?? g?.catId ?? s?.catId;
                if (cid === c.id) next.delete(k);
              }
            }
          }
        });
      } else if (view === "sub") {
        const all = visibleSubs.every((s) => next.has(`cat:${s.catId}`) || next.has(`sub:${s.id}`));
        visibleSubs.forEach((s) => {
          if (all) next.delete(`sub:${s.id}`);
          else if (!next.has(`cat:${s.catId}`)) next.add(`sub:${s.id}`);
        });
      } else if (view === "group") {
        const all = visibleGroups.every(
          (g) => next.has(`cat:${g.catId}`) || next.has(`sub:${g.subId}`) || next.has(`group:${g.id}`),
        );
        visibleGroups.forEach((g) => {
          if (all) next.delete(`group:${g.id}`);
          else if (!next.has(`cat:${g.catId}`) && !next.has(`sub:${g.subId}`)) next.add(`group:${g.id}`);
        });
      } else {
        const selectable = visibleProds.filter((p) => !isProductCovered(p));
        const all = selectable.length > 0 && selectable.every((p) => next.has(`prod:${p.id}`));
        selectable.forEach((p) => {
          if (all) next.delete(`prod:${p.id}`);
          else next.add(`prod:${p.id}`);
        });
      }
      return next;
    });
  };

  if (view === "category") {
    allChecked = visibleCats.length > 0 && visibleCats.every((c) => catState(c.id).checked);
    someChecked = visibleCats.some((c) => catState(c.id).checked || catState(c.id).indeterminate);
  } else if (view === "sub") {
    allChecked = visibleSubs.length > 0 && visibleSubs.every((s) => subState(s.id).checked);
    someChecked = visibleSubs.some((s) => subState(s.id).checked || subState(s.id).indeterminate);
  } else if (view === "group") {
    allChecked = visibleGroups.length > 0 && visibleGroups.every((g) => groupState(g.id).checked);
    someChecked = visibleGroups.some((g) => groupState(g.id).checked || groupState(g.id).indeterminate);
  } else {
    const selectable = visibleProds.filter((p) => !isProductCovered(p));
    allChecked = selectable.length > 0 && selectable.every((p) => has(`prod:${p.id}`));
    someChecked = visibleProds.some((p) => isProductCovered(p) || has(`prod:${p.id}`));
  }

  const headLabels: Record<ViewBy, React.ReactNode> = {
    category: (
      <>
        <ColHead>Category</ColHead>
        <ColHead>Sub-categories</ColHead>
        <ColHead>Groups</ColHead>
        <ColHead>Products</ColHead>
      </>
    ),
    sub: (
      <>
        <ColHead>Sub-category</ColHead>
        <ColHead>Category</ColHead>
        <ColHead>Groups</ColHead>
        <ColHead>Products</ColHead>
      </>
    ),
    group: (
      <>
        <ColHead>Group</ColHead>
        <ColHead>Sub-category</ColHead>
        <ColHead>Category</ColHead>
        <ColHead>Products</ColHead>
      </>
    ),
    product: (
      <>
        <ColHead>Product</ColHead>
        <ColHead>SKU</ColHead>
        <ColHead>Group</ColHead>
        <ColHead>Category</ColHead>
        <ColHead>Sub-category</ColHead>
      </>
    ),
  };

  return (
    <div>
      {/* Sticky header — shared band treatment (DS §6.8 th) */}
      <div className={`flex items-center gap-3.5 ${skin.headCls}`}>
        <Checkbox checked={allChecked} indeterminate={!allChecked && someChecked} onChange={selectAll} />
        <div className={`grid flex-1 items-center gap-4 ${gridCols[view]}`}>{headLabels[view]}</div>
      </div>

      {/* ── Category rows ── */}
      {view === "category" &&
        visibleCats.map((c) => {
          const st = catState(c.id);
          return (
            <label key={c.id} className={`${rowCls} cursor-pointer`}>
              <Checkbox checked={st.checked} indeterminate={st.indeterminate} onChange={() => toggleCat(c.id)} />
              <div className={`grid flex-1 items-center gap-4 ${gridCols.category}`}>
                <div className="flex items-center gap-2.5">
                  <img src={c.image} alt="" className={thumbCls} />
                  <div>
                    <p className={tName}>{c.name}</p>
                  </div>
                </div>
                <CountCell n={c.subCount} label="sub-cats" />
                <CountCell n={c.groupCount} label="groups" />
                <CountCell n={c.productCount} label="products" />
              </div>
            </label>
          );
        })}

      {/* ── Sub-category rows ── */}
      {view === "sub" &&
        visibleSubs.map((s) => {
          const st = subState(s.id);
          const cat = catById(s.catId)!;
          return (
            <label key={s.id} className={`${rowCls} cursor-pointer`}>
              <Checkbox checked={st.checked} indeterminate={st.indeterminate} onChange={() => toggleSub(s.id)} />
              <div className={`grid flex-1 items-center gap-4 ${gridCols.sub}`}>
                <div className="flex items-center gap-2.5">
                  <img src={cat.image} alt="" className={thumbCls} />
                  <div>
                    <p className={tName}>{s.name}</p>
                  </div>
                </div>
                <div className={tSec}>{cat.name}</div>
                <CountCell n={s.groupCount} label="groups" />
                <CountCell n={s.productCount} label="products" />
              </div>
            </label>
          );
        })}

      {/* ── Group rows ── */}
      {view === "group" &&
        visibleGroups.map((g) => {
          const st = groupState(g.id);
          const sub = subs.find((s) => s.id === g.subId)!;
          const cat = catById(g.catId)!;
          return (
            <label key={g.id} className={`${rowCls} cursor-pointer`}>
              <Checkbox checked={st.checked} indeterminate={st.indeterminate} onChange={() => toggleGroup(g.id)} />
              <div className={`grid flex-1 items-center gap-4 ${gridCols.group}`}>
                <div className="flex items-center gap-2.5">
                  <img src={cat.image} alt="" className={thumbCls} />
                  <div>
                    <p className={tName}>{g.name}</p>
                  </div>
                </div>
                <div className={tSec}>{sub.name}</div>
                <div className={tTer}>{cat.name}</div>
                <CountCell n={g.productCount} label="products" />
              </div>
            </label>
          );
        })}

      {/* ── Product rows ── */}
      {view === "product" &&
        visibleProds.map((p) => {
          const covered = isProductCovered(p);
          const checked = covered || has(`prod:${p.id}`);
          const label = covered ? coverageLabel(p) : null;
          return (
            <label key={p.id} className={`${rowCls} ${covered ? "cursor-default" : "cursor-pointer"}`}>
              <Checkbox
                checked={checked}
                disabled={covered}
                title={label ?? undefined}
                onChange={() => toggleProduct(p.id)}
              />
              <div className={`grid flex-1 items-center gap-4 ${gridCols.product}`}>
                <div className="flex items-center gap-2.5">
                  <img src={p.image} alt="" className={thumbCls} />
                  <div className="min-w-0">
                    <p className={`truncate ${tName}`}>{p.name}</p>
                    {label && <p className={ds ? "text-[12px] font-medium leading-[20px] text-[#2F68E5]" : "text-[12px] text-[#2F68E5]"}>{label}</p>}
                  </div>
                </div>
                <div className={`font-mono ${tSec}`}>{p.sku}</div>
                <div className={`truncate ${tSec}`}>{p.groupName}</div>
                <div className={`truncate ${tSec}`}>{p.catName}</div>
                <div className={`truncate ${tTer}`}>{p.subName}</div>
              </div>
            </label>
          );
        })}

      <div className={ds ? "px-5 py-3 text-center text-[12px] font-medium leading-[20px] text-[#9494AE]" : "px-5 py-3 text-center text-[11px] text-[#9494AE]"}>
        {view === "product"
          ? "Showing a sample of products · use search to find any SKU or name"
          : "Selecting a parent automatically includes all products beneath it"}
      </div>
    </div>
  );
}

/* ─── Search results ───────────────────────────────────────────────────────── */

function SearchResults({
  results,
  query,
  onToggle,
  coverage,
  coverageLabel,
}: {
  results: {
    key: string;
    level: Exclude<Level, "catalog">;
    name: string;
    path: string;
    count: number;
  }[];
  query: string;
  has: (k: string) => boolean;
  onToggle: (key: string) => void;
  coverage: (key: string) => { checked: boolean; indeterminate: boolean; locked?: boolean };
  coverageLabel: (key: string) => string | null;
}) {
  const ds = useDS();
  const tName = ds
    ? "text-[14px] font-semibold leading-[22px] tracking-[-0.01em] text-[#17173A]"
    : "text-[14px] font-semibold text-[#17173A]";
  const tMeta = ds ? "text-[12px] font-medium leading-[20px] text-[#6F6F8D]" : "text-[12px] text-[#6F6F8D]";
  if (results.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
        {ds ? <SearchIconDS className="size-8 text-[#D9D9E8]" /> : <SearchIcon className="size-8 text-[#DDE2EE]" />}
        <p className={`mt-3 ${tName}`}>No matches found</p>
        <p className={`mt-1 ${tMeta}`}>
          Nothing matches "{query}". Try a different name or SKU.
        </p>
      </div>
    );
  }
  return (
    <div>
      <div className={ds ? "sticky top-0 z-10 border-b border-[#EBEBF5] bg-[#FAFBFF] px-5 py-2.5 text-[12px] font-semibold uppercase leading-[20px] tracking-[0.07em] text-[#9494AE]" : "sticky top-0 z-10 border-b border-[#DDE2EE] bg-white px-5 py-2 text-[11px] font-semibold uppercase tracking-[0.4px] text-[#6F6F8D]"}>
        {results.length} result{results.length === 1 ? "" : "s"} across all levels
      </div>
      {results.map((r) => {
        const st = coverage(r.key);
        const label = coverageLabel(r.key);
        return (
          <label
            key={r.key}
            className={`flex items-center gap-3.5 border-b px-5 py-3 transition-colors ${ds ? "border-[#EBEBF5] hover:bg-[#F6F8FF]" : "border-[#EDF0F7] hover:bg-[#fafbff]"} ${st.locked ? "cursor-default" : "cursor-pointer"}`}
          >
            <Checkbox
              checked={st.checked}
              indeterminate={st.indeterminate}
              disabled={st.locked}
              onChange={() => onToggle(r.key)}
            />
            <div className="flex min-w-0 flex-1 items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className={`truncate ${tName}`}>{r.name}</p>
                  <LevelTag level={r.level} />
                </div>
                <p className={`mt-0.5 truncate ${tMeta}`}>
                  {r.path}
                  {label && <span className={ds ? "ml-1.5 font-medium text-[#2F68E5]" : "ml-1.5 font-medium text-[#2F68E5]"}>{label}</span>}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <span className={ds ? "text-[14px] font-semibold leading-[22px] text-[#17173A]" : "text-[14px] font-bold text-[#17173A]"}>{num(r.count)}</span>{" "}
                <span className={ds ? "text-[12px] font-medium leading-[20px] text-[#9494AE]" : "text-[12px] text-[#9494AE]"}>{r.level === "product" ? "item" : "products"}</span>
              </div>
            </div>
          </label>
        );
      })}
    </div>
  );
}

/* ─── Setup loading state ───────────────────────────────────────────────────── */


function CommunicationTimeCard({
  title = "Set time when communication goes out",
  description = "When the Journey is published, replenishment eligibility is checked every day and communication is sent to the qualified users at the time you choose.",
  hour,
  minute,
  meridiem,
  onHourChange,
  onMinuteChange,
  onMeridiemChange,
  divider = true,
}: {
  title?: string;
  description?: string;
  /* Rule between the description and the time pickers. Off in Replenishment
     settings, where the pickers sit 16px below the description. */
  divider?: boolean;
  hour: string;
  minute: string;
  meridiem: string;
  onHourChange: (v: string) => void;
  onMinuteChange: (v: string) => void;
  onMeridiemChange: (v: string) => void;
}) {
  return (
    <div className="rounded-lg border border-[#EBEBF5] bg-white px-6 py-5">
      <h3 className="text-[14px] font-bold leading-[22px] tracking-[-0.01em] text-[#17173A]">
        {title}
      </h3>
      <p className="mt-1 text-[13px] leading-[20px] text-[#6F6F8D]">
        {description}
      </p>

      {divider && <div className="my-5 border-t border-[#DDE2EE]" />}

      <div className={`flex flex-wrap items-end gap-3 ${divider ? "" : "mt-4"}`}>
        <div className="w-[112px]">
          <p className="mb-2 text-[13px] font-semibold leading-[20px] text-[#17173A]">Hours</p>
          <Dropdown
            value={hour}
            options={HOURS.map((h) => ({ value: h, label: h }))}
            onChange={onHourChange}
            fullWidth
            overlay
          />
        </div>
        <span className="flex h-8 items-center text-[13px] font-semibold text-[#9494AE]">:</span>
        <div className="w-[112px]">
          <p className="mb-2 text-[13px] font-semibold leading-[20px] text-[#17173A]">Minutes</p>
          <Dropdown
            value={minute}
            options={MINUTES.map((m) => ({ value: m, label: m }))}
            onChange={onMinuteChange}
            fullWidth
            overlay
          />
        </div>
        <span className="flex h-8 items-center text-[13px] font-semibold text-[#9494AE]">:</span>
        <div className="w-[112px]">
          <Dropdown
            value={meridiem}
            options={MERIDIEM.map((m) => ({ value: m, label: m }))}
            onChange={onMeridiemChange}
            fullWidth
            overlay
          />
        </div>
      </div>
    </div>
  );
}


/* ─── Entry ─────────────────────────────────────────────────────────────────── */

/** Replenishment tab of Content → Products, entered at the post-setup listing.
    `actionSlot` is the node beside the page's tab strip that the screen
    portals its search field and Configuration CTA into. */
export default function ReplenishmentListing({ actionSlot }: { actionSlot: HTMLElement | null }) {
  return (
    <DSScope.Provider value={true}>
      <ReplenishmentListingScreen catalogName="D-Mart" actionSlot={actionSlot} />
    </DSScope.Provider>
  );
}
