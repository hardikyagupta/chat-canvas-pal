import { forwardRef, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Info, ListFilter, RefreshCw, Search, Settings, X } from "lucide-react";
import { toast } from "sonner";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import ActiveBadge from "./ActiveBadge";
import AttributeMappingSheet from "./AttributeMappingSheet";
import { catalogs } from "./catalogs.data";
import LocationsSheet from "./LocationsSheet";
import { locationsFor, type LocationStock } from "./productLocations";
import {
  DSScope,
  Dropdown,
  ListingPagination,
  PROD_DETAILS,
  PROD_LISTING,
  ProductDetailsPage,
  dairyImg,
  type ProdListingRow,
} from "./replenishment/ReplenishmentListing";

/**
 * Content → Products → All products. The synced catalogue itself, one row per
 * product with the feed attributes the catalogue carries — the same products
 * the Replenishment tab lists, but showing what each product *is* rather than
 * how often it repurchases.
 *
 * Toolbar (right of the tab strip, via `actionSlot`): search, attribute
 * mapping, re-sync, column settings and filters. The catalog picker sits in a
 * card above the table.
 */

type ColumnKey =
  | "groupId"
  | "retail"
  | "sales"
  | "quantity"
  | "locations"
  | "availability"
  | "brand"
  | "condition"
  | "currency"
  | "description"
  | "link"
  | "productId";

interface Column {
  key: ColumnKey;
  label: string;
  width: number;
  numeric?: boolean;
  /** Catalog field the attribute is read from until it's re-mapped. */
  field: string;
}

// Title is a frozen column of its own; these scroll sideways behind it, and
// the long Description / Link columns have fixed widths so they truncate
// rather than squeezing the numbers.
const COLUMNS: Column[] = [
  { key: "groupId", label: "Group ID", width: 200, field: "item_group_id" },
  { key: "retail", label: "Retail price", width: 160, numeric: true, field: "price" },
  { key: "sales", label: "Sales price", width: 160, numeric: true, field: "sale_price" },
  { key: "quantity", label: "Quantity", width: 130, numeric: true, field: "inventory" },
  { key: "locations", label: "Available locations", width: 170, numeric: true, field: "locations" },
  { key: "availability", label: "Availability", width: 130, field: "availability" },
  { key: "brand", label: "Brand", width: 130, field: "brand" },
  { key: "condition", label: "Condition", width: 110, field: "condition" },
  { key: "currency", label: "Currency", width: 100, field: "currency" },
  { key: "description", label: "Description", width: 320, field: "description" },
  { key: "link", label: "Link", width: 280, field: "link" },
  { key: "productId", label: "Product ID", width: 130, field: "id" },
];

const TITLE_WIDTH = 300;

/** The catalogs the picker offers. Only the first has products in this demo. */
const CATALOGS = catalogs.map((c) => ({ value: String(c.id), label: c.name }));

const nf = new Intl.NumberFormat("en-US");
/** "INR 285.00" — currency code, then the amount to two decimals. */
const money = (currency: string, n: number) => `${currency} ${n.toFixed(2)}`;
const slug = (s: string) => s.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const cell = "px-5 font-manrope text-sm text-[#17173A]";

interface ProductRow {
  source: ProdListingRow;
  title: string;
  groupId: string;
  retail: number;
  sales: number;
  quantity: number;
  locations: LocationStock[];
  active: boolean;
  brand: string;
  condition: string;
  currency: string;
  description: string;
  link: string;
  productId: string;
}

const rows: ProductRow[] = PROD_LISTING.map((p) => {
  const d = PROD_DETAILS[p.id];
  return {
    source: p,
    title: p.name,
    groupId: `GRP-${slug(p.group).toUpperCase()}`,
    retail: d.retail,
    sales: d.sales,
    quantity: d.quantity,
    locations: locationsFor(p.id, d.quantity),
    active: d.availability === "active",
    brand: d.brand,
    condition: d.condition,
    currency: d.currency,
    description: d.description,
    link: `https://shop.example.com/p/${p.id}/${slug(p.name)}`,
    productId: p.id,
  };
});

const BRANDS = Array.from(new Set(rows.map((r) => r.brand))).sort();

/** Columns that can be sorted, and the row field each one sorts on. */
const SORTABLE = { retail: "retail", sales: "sales", quantity: "quantity" } as const;
type SortKey = keyof typeof SORTABLE;
type SortDir = "asc" | "desc";

/** Circled stacked lines — the sort control beside a sortable header. Lines
 *  shorten downward for highest-first (the default) and the glyph is inverted
 *  for lowest-first. */
function SortGlyph({ ascending, className }: { ascending?: boolean; className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" className={className} aria-hidden="true">
      <circle cx="8" cy="8" r="6.6" stroke="currentColor" strokeWidth="1.2" />
      <path
        d={ascending ? "M6.9 6h2.2M5.8 8h4.4M4.8 10h6.4" : "M4.8 6h6.4M5.8 8h4.4M6.9 10h2.2"}
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

type AvailabilityFilter = "all" | "active" | "inactive";

const IconButton = forwardRef<
  HTMLButtonElement,
  {
    label: string;
    /** Marks a control with something applied (e.g. filters on). */
    active?: boolean;
    children: React.ReactNode;
  } & React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ label, active, children, className, ...rest }, ref) => (
  // Spreads `rest` last-but-one so a Radix trigger's own props and ref land
  // on the button.
  <button
    ref={ref}
    type="button"
    aria-label={label}
    title={label}
    {...rest}
    className={cn(
      "relative grid h-8 w-8 shrink-0 place-items-center rounded-[8px] border bg-white text-[#6F6F8D] transition-colors hover:bg-[#F4F8FF] hover:text-[#17173A]",
      active ? "border-[#2F68E5] text-[#2F68E5]" : "border-[#DDE2EE]",
      className
    )}
  >
    {children}
    {active && <span className="absolute -right-1 -top-1 size-2 rounded-full bg-[#2F68E5]" />}
  </button>
));
IconButton.displayName = "IconButton";

export default function AllProductsTab({ actionSlot }: { actionSlot: HTMLElement | null }) {
  const [catalog, setCatalog] = useState(CATALOGS[0].value);
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [availability, setAvailability] = useState<AvailabilityFilter>("all");
  const [brand, setBrand] = useState("all");
  const [sort, setSort] = useState<{ key: SortKey; dir: SortDir } | null>(null);
  const [hidden, setHidden] = useState<Set<ColumnKey>>(new Set());
  const [mappingOpen, setMappingOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);
  // The product whose details page is open, if any.
  const [viewing, setViewing] = useState<ProdListingRow | null>(null);
  // The product whose stock-by-location drawer is open, if any.
  const [locationsRow, setLocationsRow] = useState<ProductRow | null>(null);

  const catalogName = CATALOGS.find((c) => c.value === catalog)?.label ?? "";
  const columns = COLUMNS.filter((c) => !hidden.has(c.key));
  const grid = `${TITLE_WIDTH}px ${columns.map((c) => `${c.width}px`).join(" ")}`;
  const filtersOn = availability !== "all" || brand !== "all";

  const shown = useMemo(() => {
    // Only the first catalog is populated in this prototype.
    if (catalog !== CATALOGS[0].value) return [];
    const q = query.trim().toLowerCase();
    const filtered = rows.filter(
      (r) =>
        (availability === "all" || (availability === "active") === r.active) &&
        (brand === "all" || r.brand === brand) &&
        (!q ||
          r.title.toLowerCase().includes(q) ||
          r.productId.includes(q) ||
          r.brand.toLowerCase().includes(q))
    );
    if (!sort) return filtered;
    const field = SORTABLE[sort.key];
    return [...filtered].sort((a, b) => (sort.dir === "asc" ? a[field] - b[field] : b[field] - a[field]));
  }, [catalog, query, availability, brand, sort]);

  // First click sorts highest-first (the glyph's default); each click after
  // on the same column flips the direction.
  const toggleSort = (key: SortKey) =>
    setSort((prev) =>
      prev?.key === key ? { key, dir: prev.dir === "desc" ? "asc" : "desc" } : { key, dir: "desc" }
    );

  const resync = () => {
    if (syncing) return;
    setSyncing(true);
    window.setTimeout(() => {
      setSyncing(false);
      toast.success(`${catalogName} synced`);
    }, 1200);
  };

  const toggleColumn = (key: ColumnKey) =>
    setHidden((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const renderCell = (r: ProductRow, key: ColumnKey) => {
    switch (key) {
      case "groupId":
        return <div className={`${cell} truncate`}>{r.groupId}</div>;
      case "retail":
        return <div className={`${cell} text-right`}>{money(r.currency, r.retail)}</div>;
      case "sales":
        return <div className={`${cell} text-right`}>{money(r.currency, r.sales)}</div>;
      case "quantity":
        return <div className={`${cell} text-right`}>{nf.format(r.quantity)}</div>;
      case "locations":
        return (
          <div className="px-5 text-right">
            <button
              type="button"
              onClick={() => setLocationsRow(r)}
              className="font-manrope text-sm font-semibold text-[#2F68E5] hover:underline"
            >
              {r.locations.length}
            </button>
          </div>
        );
      case "availability":
        return (
          <div className="px-5">
            <ActiveBadge active={r.active} />
          </div>
        );
      case "brand":
        return <div className={cell}>{r.brand}</div>;
      case "condition":
        return <div className={`${cell} capitalize`}>{r.condition}</div>;
      case "currency":
        return <div className={cell}>{r.currency}</div>;
      case "description":
        return (
          <div className={`${cell} truncate`} title={r.description}>
            {r.description}
          </div>
        );
      case "link":
        return (
          <div className="min-w-0 px-5">
            <a
              href={r.link}
              target="_blank"
              rel="noreferrer"
              title={r.link}
              className="block truncate font-manrope text-sm text-[#2F68E5] hover:underline"
            >
              {r.link}
            </a>
          </div>
        );
      case "productId":
        return <div className={cell}>{r.productId}</div>;
    }
  };

  return (
    <div>
      {actionSlot &&
        createPortal(
          <>
            {searchOpen ? (
              <label className="flex h-8 w-[260px] items-center gap-2 rounded-[5px] border border-[#2F68E5] bg-white px-2.5">
                <Search className="h-4 w-4 shrink-0 text-[#6F6F8D]" strokeWidth={1.8} />
                <input
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Escape") {
                      setQuery("");
                      setSearchOpen(false);
                    }
                  }}
                  placeholder="Search products..."
                  className="min-w-0 flex-1 bg-transparent font-manrope text-[13px] text-[#17173A] outline-none placeholder:text-[#9494AE]"
                />
                <button
                  type="button"
                  aria-label="Close search"
                  onClick={() => {
                    setQuery("");
                    setSearchOpen(false);
                  }}
                  className="text-[#6F6F8D] hover:text-[#17173A]"
                >
                  <X className="h-4 w-4" strokeWidth={1.8} />
                </button>
              </label>
            ) : (
              <IconButton label="Search products" onClick={() => setSearchOpen(true)} active={!!query}>
                <Search className="h-4 w-4" strokeWidth={1.8} />
              </IconButton>
            )}

            <button
              type="button"
              onClick={() => setMappingOpen(true)}
              className="dc-btn dc-btn-primary"
            >
              Attribute mapping
            </button>

            <IconButton label="Re-sync catalog" onClick={resync}>
              <RefreshCw className={cn("h-4 w-4", syncing && "animate-spin")} strokeWidth={1.8} />
            </IconButton>

            <Popover>
              <PopoverTrigger asChild>
                <IconButton label="Column settings">
                  <Settings className="h-4 w-4" strokeWidth={1.8} />
                </IconButton>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-[220px] p-3">
                <p className="font-manrope text-xs font-semibold text-[#17173A]">Columns</p>
                <div className="mt-2 flex flex-col gap-2">
                  <label className="flex items-center gap-2 font-manrope text-[13px] text-[#9494AE]">
                    <input type="checkbox" checked disabled className="accent-[#2F68E5]" />
                    Title
                  </label>
                  {COLUMNS.map((c) => (
                    <label
                      key={c.key}
                      className="flex cursor-pointer items-center gap-2 font-manrope text-[13px] text-[#17173A]"
                    >
                      <input
                        type="checkbox"
                        checked={!hidden.has(c.key)}
                        onChange={() => toggleColumn(c.key)}
                        className="accent-[#2F68E5]"
                      />
                      {c.label}
                    </label>
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            <Popover>
              <PopoverTrigger asChild>
                <IconButton label="Filters" active={filtersOn}>
                  <ListFilter className="h-4 w-4" strokeWidth={1.8} />
                </IconButton>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-[240px] p-3">
                <p className="font-manrope text-xs font-semibold text-[#17173A]">Availability</p>
                <div className="mt-2 flex gap-1.5">
                  {(["all", "active", "inactive"] as const).map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setAvailability(v)}
                      className={cn(
                        "h-7 flex-1 rounded-[4px] border font-manrope text-xs font-medium capitalize transition-colors",
                        availability === v
                          ? "border-[#2F68E5] bg-[#EDF1FF] text-[#2F68E5]"
                          : "border-[#DDE2EE] text-[#6F6F8D] hover:bg-[#F4F8FF]"
                      )}
                    >
                      {v === "inactive" ? "In-active" : v}
                    </button>
                  ))}
                </div>
                <p className="mt-3 font-manrope text-xs font-semibold text-[#17173A]">Brand</p>
                <select
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  className="mt-2 h-8 w-full rounded-[4px] border border-[#DDE2EE] bg-white px-2 font-manrope text-[13px] text-[#17173A] outline-none focus:border-[#2F68E5]"
                >
                  <option value="all">All brands</option>
                  {BRANDS.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
                {filtersOn && (
                  <button
                    type="button"
                    onClick={() => {
                      setAvailability("all");
                      setBrand("all");
                    }}
                    className="mt-3 font-manrope text-xs font-semibold text-[#2F68E5] hover:underline"
                  >
                    Clear filters
                  </button>
                )}
              </PopoverContent>
            </Popover>
          </>,
          actionSlot
        )}

      {/* Catalog picker card */}
      <DSScope.Provider value={true}>
        <div className="flex items-center gap-2 rounded-lg border border-[#EBEBF5] bg-white px-3 py-2.5">
          <span title="Products shown are the ones synced from the selected catalog.">
            <Info className="h-4 w-4 text-[#6F6F8D]" strokeWidth={1.8} />
          </span>
          <Dropdown
            label="Catalog:"
            value={catalog}
            options={CATALOGS}
            onChange={setCatalog}
            minWidth={200}
            overlay
            bare
          />
        </div>
      </DSScope.Provider>

      <div className="scroll-slim mt-4 overflow-x-auto rounded-lg border border-[#DDE2EE] bg-white shadow-[0px_5px_10px_0px_rgba(23,23,58,0.05)]">
        <div className="min-w-max">
          <div className="grid h-[52px] items-center border-b border-[#DDE2EE]" style={{ gridTemplateColumns: grid }}>
            <div className="sticky left-0 z-10 flex h-full items-center border-r border-[#EDF0F7] bg-white px-5 font-manrope text-sm font-medium text-[#6F6F8D]">
              Title
            </div>
            {columns.map((c) => (
              <div
                key={c.key}
                className={`px-5 font-manrope text-sm font-medium text-[#6F6F8D] ${c.numeric ? "text-right" : ""}`}
              >
                {c.key in SORTABLE ? (
                  <div className="flex items-center justify-end gap-2">
                    <span>{c.label}</span>
                    <button
                      type="button"
                      onClick={() => toggleSort(c.key as SortKey)}
                      aria-label={`Sort by ${c.label}`}
                      title={
                        sort?.key === c.key && sort.dir === "desc"
                          ? "Highest to lowest — click for lowest to highest"
                          : sort?.key === c.key
                            ? "Lowest to highest — click for highest to lowest"
                            : "Sort highest to lowest"
                      }
                      className={cn(
                        "grid size-5 place-items-center rounded-full transition-colors hover:text-[#17173A]",
                        sort?.key === c.key ? "text-[#2F68E5]" : "text-[#6F6F8D]"
                      )}
                    >
                      <SortGlyph ascending={sort?.key === c.key && sort.dir === "asc"} className="size-4" />
                    </button>
                  </div>
                ) : (
                  c.label
                )}
              </div>
            ))}
          </div>

          {shown.length === 0 ? (
            <p className="sticky left-0 w-full px-5 py-10 text-center font-manrope text-sm text-[#6F6F8D]">
              {catalog !== CATALOGS[0].value
                ? `No products to show for ${catalogName}.`
                : "No products match your search or filters."}
            </p>
          ) : (
            shown.map((r) => (
              <div
                key={r.productId}
                className="group grid min-h-[72px] items-center border-b border-[#EDF0F7] bg-white transition-colors last:border-b-0 hover:bg-[#F5F8FF]"
                style={{ gridTemplateColumns: grid }}
              >
                <div className="sticky left-0 z-10 flex h-full items-center gap-3 border-r border-[#EDF0F7] bg-white px-5 group-hover:bg-[#F5F8FF]">
                  <img src={dairyImg} alt="" className="size-10 shrink-0 rounded-[4px] border border-[#EDF0F7] object-cover" />
                  <button
                    type="button"
                    onClick={() => setViewing(r.source)}
                    className="min-w-0 truncate text-left font-manrope text-[13px] font-semibold leading-[18px] tracking-[0.29px] text-[#17173A] transition-colors hover:text-[#2F68E5] hover:underline"
                  >
                    {r.title}
                  </button>
                </div>
                {columns.map((c) => (
                  <div key={c.key} className="min-w-0">
                    {renderCell(r, c.key)}
                  </div>
                ))}
              </div>
            ))
          )}
        </div>
      </div>

      <DSScope.Provider value={true}>
        <ListingPagination />
        {viewing && <ProductDetailsPage row={viewing} onBack={() => setViewing(null)} />}
      </DSScope.Provider>

      <LocationsSheet
        productTitle={locationsRow?.title ?? null}
        locations={locationsRow?.locations ?? []}
        onClose={() => setLocationsRow(null)}
      />

      <AttributeMappingSheet
        key={catalog}
        open={mappingOpen}
        onOpenChange={setMappingOpen}
        catalogName={catalogName}
        attributes={[
          { key: "title", label: "Title", field: "title" },
          ...COLUMNS.map((c) => ({ key: c.key, label: c.label, field: c.field })),
        ]}
      />
    </div>
  );
}
