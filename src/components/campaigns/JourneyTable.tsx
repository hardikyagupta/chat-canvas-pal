import { MoreVertical } from "lucide-react";
import { journeys as defaultJourneys, type Journey } from "./journeys.data";
import JourneyStatusBadge from "./JourneyStatusBadge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import sparkle from "/campaign-assets/ic-sparkle-ai.gif";

// Frozen "Journeys" column (name + status) + 6 scrollable metric columns,
// widths traced from Figma node 16785:22944.
const GRID = "grid-cols-[274px_386px_75px_80px_116px_141px_141px]";

const METRIC_HEADERS = ["Start - End date", "ID", "Sent", "Delivered", "Opened/Read", "Opened/Read"];

// Rows don't have a uniform height (the date column wraps to two lines), so
// cells rely on the grid's default `align-items: stretch` to fill the row —
// any `items-center` on the row itself would let cells shrink to their own
// content height and break the sticky column's border-r partway down.
function MetricCell({ value, first }: { value: string; first?: boolean }) {
  const isEmpty = value === "--";
  return (
    <div
      className={`flex items-center px-6 font-manrope text-sm ${first ? "justify-start" : "justify-end"} ${
        isEmpty ? "text-[#6F6F8D]" : "text-[#17173A]"
      }`}
    >
      {value}
    </div>
  );
}

function JourneyRow({ j }: { j: Journey }) {
  const metrics = [j.sent, j.delivered, j.openedRead, j.openedRead2];

  return (
    <div className={`group grid ${GRID} min-h-[70px] border-b border-[#EDF0F7] bg-white transition-colors hover:bg-[#F5F8FF]`}>
      {/* Journey Info (frozen column) */}
      <div className="sticky left-0 z-10 flex items-center justify-between gap-2 border-r border-[#EDF0F7] bg-white px-6 py-3 group-hover:bg-[#F5F8FF]">
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center gap-1.5">
            <p className="truncate font-manrope text-sm font-semibold tracking-[0.29px] text-[#17173A]">
              {j.name}
            </p>
            {j.generatedByAI && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <img src={sparkle} alt="Created by AI" className="h-4 w-4 shrink-0" />
                </TooltipTrigger>
                <TooltipContent
                  side="top"
                  className="border-0 bg-foreground px-[8px] py-[4px] text-[12px] leading-[16px] text-background"
                  style={{ fontFamily: "Manrope, sans-serif", fontWeight: 500 }}
                >
                  Created by AI
                </TooltipContent>
              </Tooltip>
            )}
          </div>
          <div className="mt-2">
            <JourneyStatusBadge status={j.status} />
          </div>
        </div>
        <button
          aria-label="More actions"
          className="shrink-0 text-[#6F6F8D] opacity-0 transition-opacity group-hover:opacity-100"
        >
          <MoreVertical className="h-5 w-5" strokeWidth={1.8} />
        </button>
      </div>

      {/* Start - End date + last edited */}
      <div className="flex flex-col justify-center px-6 py-3">
        <p className="font-manrope text-sm text-[#17173A]">{j.startEnd}</p>
        <p className="mt-1 font-manrope text-xs text-[#6F6F8D]">Last edited: {j.lastEdited}</p>
      </div>

      <MetricCell value={j.journeyId} first />
      {metrics.map((m, i) => (
        <MetricCell key={i} value={m} />
      ))}
    </div>
  );
}

export default function JourneyTable({ journeys = defaultJourneys }: { journeys?: Journey[] }) {
  return (
    <div className="scroll-slim overflow-x-auto rounded-lg border border-[#DDE2EE] bg-white shadow-[0px_5px_10px_0px_rgba(23,23,58,0.05)]">
      <div className="min-w-[1213px]">
        {/* Header row */}
        <div className={`grid ${GRID} h-[52px] border-b border-[#DDE2EE]`}>
          <div className="sticky left-0 z-10 flex items-center border-r border-[#EDF0F7] bg-white px-6">
            <span className="font-manrope text-sm font-bold text-[#6F6F8D]">Journeys</span>
          </div>
          {METRIC_HEADERS.map((h, i) => (
            <div
              key={h + i}
              className={`flex items-center px-6 font-manrope text-sm font-bold text-[#6F6F8D] ${
                i <= 1 ? "justify-start" : "justify-end"
              }`}
            >
              {h}
            </div>
          ))}
        </div>

        {/* Body */}
        <div>
          {journeys.map((j) => (
            <JourneyRow key={j.id} j={j} />
          ))}
        </div>
      </div>
    </div>
  );
}
