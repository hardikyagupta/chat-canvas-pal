import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

const pages = ["01", "02", "03", "04", "05"];

export default function Pagination({ unitLabel = "campaigns" }: { unitLabel?: string }) {
  const active = "01";
  return (
    <div className="flex items-center justify-between">
      {/* Rows per page */}
      <button className="flex h-10 w-[215px] items-center justify-between rounded-[5px] border border-[#DDE2EE] bg-white px-2.5 font-manrope text-sm text-[#17173A]">
        10 {unitLabel} per page
        <ChevronDown className="h-5 w-5 text-[#6F6F8D]" strokeWidth={1.8} />
      </button>

      {/* Pager */}
      <div className="flex h-10 items-center gap-1 rounded-[5px] border border-[#DDE2EE] bg-white px-2.5">
        <button aria-label="First" className="grid h-full w-5 place-items-center text-[#6F6F8D]">
          <ChevronsLeft className="h-[15px] w-[15px]" strokeWidth={2} />
        </button>
        <button aria-label="Previous" className="grid h-full w-5 place-items-center text-[#6F6F8D]">
          <ChevronLeft className="h-[15px] w-[15px]" strokeWidth={2} />
        </button>
        {pages.map((p) => {
          const isActive = p === active;
          return (
            <button
              key={p}
              className="relative grid h-full w-8 place-items-center font-manrope text-sm tracking-[0.29px]"
            >
              <span className={isActive ? "text-[#2F68E5]" : "text-[#6F6F8D]"}>{p}</span>
              {isActive && (
                <span className="absolute bottom-1 h-[3px] w-[22px] rounded-[1.5px] bg-[#2F68E5]" />
              )}
            </button>
          );
        })}
        <button aria-label="Next" className="grid h-full w-5 place-items-center text-[#6F6F8D]">
          <ChevronRight className="h-[15px] w-[15px]" strokeWidth={2} />
        </button>
        <button aria-label="Last" className="grid h-full w-5 place-items-center text-[#6F6F8D]">
          <ChevronsRight className="h-[15px] w-[15px]" strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}
