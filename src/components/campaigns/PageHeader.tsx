import { Search, ChevronDown } from "lucide-react";

/** "Campaigns" title block with the search affordance + New campaign CTA. */
export default function PageHeader() {
  return (
    <div className="flex items-start justify-between">
      <div>
        <h1 className="font-manrope text-[20px] font-bold leading-tight text-[#17173A]">
          Campaigns
        </h1>
        <p className="mt-1 font-manrope text-[13px] text-[#6F6F8D]">
          View and manage campaigns
        </p>
      </div>

      <div className="flex items-center gap-4">
        <button
          aria-label="Search campaigns"
          className="grid h-[29px] w-[29px] place-items-center rounded-[2px] border border-[#DDE2EE] bg-white text-[#6F6F8D] transition-colors hover:bg-[#F4F8FF]"
        >
          <Search className="h-4 w-4" strokeWidth={1.8} />
        </button>
        <button className="flex items-center gap-2 rounded bg-[#2F68E5] px-3 py-[5px] font-manrope text-sm font-semibold tracking-[0.42px] text-white shadow-[0px_5px_5px_rgba(0,0,0,0.05)] transition-colors hover:bg-[#255ad2]">
          New campaign
          <ChevronDown className="h-4 w-4" strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}
