import { Download, Settings, ListFilter } from "lucide-react";

/** Right-hand toolbar above the table: export, #/% unit toggle, settings, filter. */
export default function TableToolbar({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`flex items-center ${compact ? "gap-1.5" : "gap-2.5"}`}>
      <button
        aria-label="Export"
        className="grid h-[29px] w-[29px] place-items-center rounded-[2px] border border-[#DDE2EE] bg-white text-[#6F6F8D] transition-colors hover:bg-[#F4F8FF]"
      >
        <Download className="h-4 w-4" strokeWidth={1.8} />
      </button>

      {/* Unit toggle — # active */}
      <div className="flex overflow-hidden rounded-[2px] border border-[#DDE2EE]">
        <button className="grid h-[29px] w-10 place-items-center bg-[#2F68E5] font-manrope text-sm font-semibold text-white">
          #
        </button>
        <button className="grid h-[29px] w-10 place-items-center border-l border-[#DDE2EE] bg-white font-manrope text-sm font-semibold text-[#6F6F8D] transition-colors hover:bg-[#F4F8FF]">
          %
        </button>
      </div>

      <button
        aria-label="Settings"
        className="grid h-[29px] w-[29px] place-items-center rounded-[2px] border border-[#DDE2EE] bg-white text-[#6F6F8D] transition-colors hover:bg-[#F4F8FF]"
      >
        <Settings className="h-4 w-4" strokeWidth={1.8} />
      </button>

      <button
        aria-label="Filter"
        className="grid h-[29px] w-[29px] place-items-center rounded-[2px] border border-[#DDE2EE] bg-white text-[#6F6F8D] transition-colors hover:bg-[#F4F8FF]"
      >
        <ListFilter className="h-4 w-4" strokeWidth={1.8} />
      </button>
    </div>
  );
}
