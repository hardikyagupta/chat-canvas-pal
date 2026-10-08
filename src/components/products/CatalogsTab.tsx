import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import ActiveBadge from "./ActiveBadge";
import { catalogs } from "./catalogs.data";

/**
 * Content → Products → Catalogs. The product catalogs the account has synced,
 * with their volume and sync cadence. Same card shell and column rhythm as the
 * other listing tables (<SegmentTable/>), minus the frozen column — there are
 * only six columns and they all fit.
 */

const GRID = "grid-cols-[minmax(240px,1.6fr)_1fr_1fr_1.4fr_1.4fr_1fr]";
const COLUMNS = ["Products", "Variants", "Last sync date", "Next sync date", "Sync frequency"];
const nf = new Intl.NumberFormat("en-US");

export default function CatalogsTab({
  onImportLogs,
  onAddCatalog,
}: {
  onImportLogs?: () => void;
  onAddCatalog?: () => void;
}) {
  const [query, setQuery] = useState("");

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? catalogs.filter((c) => c.name.toLowerCase().includes(q)) : catalogs;
  }, [query]);

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <label className="flex h-9 w-[300px] items-center gap-2 rounded-[5px] border border-[#DDE2EE] bg-white px-3 focus-within:border-[#2F68E5]">
          <Search className="h-4 w-4 shrink-0 text-[#6F6F8D]" strokeWidth={1.8} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search catalogs..."
            className="min-w-0 flex-1 bg-transparent font-manrope text-[13px] text-[#17173A] outline-none placeholder:text-[#9494AE]"
          />
        </label>
        <div className="flex items-center gap-3">
          <button type="button" onClick={onImportLogs} className="dc-btn dc-btn-secondary">
            Import logs
          </button>
          <button
            type="button"
            onClick={onAddCatalog}
            className="dc-btn dc-btn-primary shadow-[0px_5px_5px_rgba(0,0,0,0.05)]"
          >
            Add catalog
          </button>
        </div>
      </div>

      <div className="mt-4 overflow-hidden rounded-lg border border-[#DDE2EE] bg-white shadow-[0px_5px_10px_0px_rgba(23,23,58,0.05)]">
        <div className={`grid ${GRID} h-[52px] items-center border-b border-[#DDE2EE]`}>
          <div className="px-5 font-manrope text-sm font-medium text-[#6F6F8D]">Catalog name</div>
          {COLUMNS.map((c) => (
            <div key={c} className="px-5 font-manrope text-sm font-medium text-[#6F6F8D]">
              {c}
            </div>
          ))}
        </div>

        {rows.length === 0 ? (
          <p className="px-5 py-10 text-center font-manrope text-sm text-[#6F6F8D]">
            No catalogs match “{query}”.
          </p>
        ) : (
          rows.map((c) => (
            <div
              key={c.id}
              className={`grid ${GRID} min-h-[88px] items-center border-b border-[#EDF0F7] bg-white transition-colors last:border-b-0 hover:bg-[#F5F8FF]`}
            >
              <div className="px-5">
                <p className="font-manrope text-[13px] font-semibold leading-[18px] tracking-[0.29px] text-[#17173A]">
                  {c.name}
                </p>
                <div className="mt-1.5 flex items-center gap-2">
                  <span className="font-manrope text-xs tracking-[0.25px] text-[#6F6F8D]">
                    ID - {c.id}
                  </span>
                  <ActiveBadge active={c.active} />
                </div>
              </div>
              <div className="px-5 font-manrope text-sm text-[#17173A]">{nf.format(c.products)}</div>
              <div className="px-5 font-manrope text-sm text-[#17173A]">{nf.format(c.variants)}</div>
              <div className="px-5 font-manrope text-sm text-[#17173A]">{c.lastSync}</div>
              <div className="px-5 font-manrope text-sm text-[#17173A]">{c.nextSync}</div>
              <div className="px-5 font-manrope text-sm text-[#17173A]">{c.frequency}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
