import { Search, Plus, Bell } from "lucide-react";
import sparkle from "/campaign-assets/ic-sparkle.svg";
import trending from "/campaign-assets/ic-trending.svg";

/** Top application bar — 56px, white, rounded, soft card shadow. */
export default function TopNav({ onOpenChat }: { onOpenChat?: () => void }) {
  return (
    <header className="flex h-14 items-center rounded-lg bg-white pl-4 pr-4 shadow-[0px_5px_10px_0px_rgba(23,23,58,0.05)]">
      {/* Left: workspace pill + search */}
      <div className="flex items-center gap-4">
        <span className="rounded bg-[#E7EDFF] px-2 py-1 font-manrope text-xs font-semibold text-[#2F68E5]">
          Customer Engagement
        </span>

        <button className="flex items-center gap-2 rounded py-1 opacity-80 transition-opacity hover:opacity-100">
          <Search className="h-3.5 w-3.5 text-[#6F6F8D]" strokeWidth={2} />
          <span className="font-manrope text-[13px] font-medium text-[#6F6F8D]">
            Search
          </span>
          <span className="flex h-[22px] items-center gap-1 rounded border border-[#DDE2EE] px-1.5 font-manrope text-[13px] font-medium text-[#6F6F8D]">
            ⌘ K
          </span>
        </button>
      </div>

      {/* Right cluster */}
      <div className="ml-auto flex items-center gap-4">
        {/* Ask co-marketer */}
        <button
          onClick={onOpenChat}
          className="flex items-center gap-1.5 rounded border border-[#FFB68C] bg-white px-2 py-1.5 transition-shadow hover:shadow-sm"
        >
          <img src={sparkle} alt="" className="h-4 w-4" />
          <span className="font-manrope text-xs font-semibold tracking-[0.42px] text-ash">
            Ask co-marketer
          </span>
        </button>

        {/* Create */}
        <button
          aria-label="Create"
          className="grid h-8 w-8 place-items-center rounded bg-[#2F68E5] text-white transition-colors hover:bg-[#255ad2]"
        >
          <Plus className="h-4 w-4" strokeWidth={2.5} />
        </button>

        <span className="h-8 w-px bg-[#DDE2EE]" />

        {/* Notifications */}
        <div className="flex items-center gap-3">
          <button aria-label="Notifications" className="grid place-items-center">
            <Bell className="h-[22px] w-[22px] text-[#17173A]" strokeWidth={1.6} />
          </button>
          <button aria-label="Trending" className="grid place-items-center">
            <img src={trending} alt="" className="h-[22px] w-[22px]" />
          </button>
          {/* Engagement score ring */}
          <div className="relative grid h-[22px] w-[22px] place-items-center">
            <svg viewBox="0 0 22 22" className="absolute inset-0 h-full w-full -rotate-90">
              <circle cx="11" cy="11" r="9.5" fill="none" stroke="#E7EFEA" strokeWidth="2" />
              <circle
                cx="11"
                cy="11"
                r="9.5"
                fill="none"
                stroke="#00C48C"
                strokeWidth="2"
                strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 9.5}
                strokeDashoffset={2 * Math.PI * 9.5 * (1 - 0.65)}
              />
            </svg>
            <span className="font-manrope text-[11px] font-extrabold text-[#00C48C]">65</span>
          </div>
        </div>

        <span className="h-8 w-px bg-[#DDE2EE]" />

        {/* Profile */}
        <div className="flex flex-col gap-[3px]">
          <div className="flex items-center gap-1.5">
            <span className="font-manrope text-sm font-semibold tracking-[0.42px] text-[#17173A]">
              Nicholas Carter
            </span>
            <svg className="h-3 w-3 text-[#17173A]" viewBox="0 0 12 12" fill="none">
              <path d="M3 4.5 6 7.5 9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-[5px] w-[5px] rounded-full bg-[#00C48C]" />
            <span className="font-manrope text-[10px] font-semibold tracking-[0.42px] text-[#00C48C]">
              Live
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
