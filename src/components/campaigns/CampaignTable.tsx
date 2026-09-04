import { Mail, FileText, Sparkles, MoreVertical, ChevronDown, Check } from "lucide-react";
import { useState } from "react";
import { campaigns, type Campaign, type ChannelIcon } from "./campaigns.data";
import StatusBadge from "./StatusBadge";

// Shared column template so the header and every row line up perfectly.
// Campaign Info is a fixed 358px frozen-style column; the 7 metric columns
// flex to fill the remaining width.
const GRID =
  "grid-cols-[358px_1.55fr_1fr_1fr_1.35fr_1.15fr_1fr_1.1fr]";

const METRIC_HEADERS = [
  "Scheduled Time",
  "Published",
  "Sent",
  "Delivered/Opened",
  "Submission",
  "Clicked",
  "Conversions",
];

function Checkbox({ checked, onChange }: { checked: boolean; onChange?: () => void }) {
  return (
    <button
      onClick={onChange}
      aria-label="Select"
      className={`grid h-4 w-4 shrink-0 place-items-center rounded-[3px] border transition-colors ${
        checked ? "border-[#2F68E5] bg-[#2F68E5] text-white" : "border-[#C7CEE0] bg-white"
      }`}
    >
      {checked && <Check className="h-3 w-3" strokeWidth={3} />}
    </button>
  );
}

function ChannelGlyph({ channel }: { channel: ChannelIcon }) {
  if (channel === "doc") {
    return (
      <div className="grid h-7 w-7 place-items-center">
        <FileText className="h-[22px] w-[22px] text-[#6F6F8D]" strokeWidth={1.5} />
      </div>
    );
  }
  return (
    <div className="relative grid h-7 w-7 place-items-center">
      <Mail className="h-[22px] w-[22px] text-[#7B7B96]" strokeWidth={1.5} />
      {channel === "mail-ai" && (
        <span className="absolute -bottom-0.5 -left-0.5 grid h-[13px] w-[13px] place-items-center rounded-full bg-[#BE52F2] ring-2 ring-white">
          <Sparkles className="h-2 w-2 text-white" fill="white" strokeWidth={0} />
        </span>
      )}
    </div>
  );
}

function MetricCell({ value, first }: { value: string; first?: boolean }) {
  const isEmpty = value === "--";
  return (
    <div
      className={`px-5 font-manrope text-sm ${first ? "text-left" : "text-right"} ${
        isEmpty ? "text-[#6F6F8D]" : "text-[#17173A]"
      }`}
    >
      {value}
    </div>
  );
}

function CampaignRow({ c }: { c: Campaign }) {
  const [checked, setChecked] = useState(false);
  const metrics = [
    c.published,
    c.sent,
    c.deliveredOpened,
    c.submission,
    c.clicked,
    c.conversions,
  ];

  return (
    <div
      className={`group grid ${GRID} h-[85px] items-center border-b border-[#EDF0F7] transition-colors ${
        c.highlighted ? "bg-[#F5F8FF]" : "bg-white hover:bg-[#F5F8FF]"
      }`}
    >
      {/* Campaign Info (frozen column — stays pinned during horizontal scroll) */}
      <div
        className={`sticky left-0 z-10 flex h-full items-center gap-3.5 border-r border-[#EDF0F7] pl-4 pr-4 ${
          c.highlighted ? "bg-[#F5F8FF]" : "bg-white group-hover:bg-[#F5F8FF]"
        }`}
      >
        <Checkbox checked={checked} onChange={() => setChecked((v) => !v)} />
        <ChannelGlyph channel={c.channel} />
        <div className="min-w-0 flex-1">
          <p className="truncate font-manrope text-[13px] font-medium tracking-[0.29px] text-[#17173A]">
            {c.name}
          </p>
          <div className="mt-1.5 flex items-center gap-2.5">
            <span className="font-manrope text-xs tracking-[0.25px] text-[#6F6F8D]">
              {c.refId}
            </span>
            <span className="h-3 w-px bg-[#DDE2EE]" />
            <StatusBadge status={c.status} />
          </div>
        </div>
        <button
          aria-label={c.expandable ? "Expand" : "More actions"}
          className={`shrink-0 text-[#6F6F8D] transition-opacity ${
            c.highlighted ? "opacity-100" : "opacity-0 group-hover:opacity-100"
          }`}
        >
          {c.expandable ? (
            <ChevronDown className="h-5 w-5" strokeWidth={1.8} />
          ) : (
            <MoreVertical className="h-5 w-5" strokeWidth={1.8} />
          )}
        </button>
      </div>

      {/* Metrics */}
      <MetricCell value={c.scheduledTime} first />
      {metrics.map((m, i) => (
        <MetricCell key={i} value={m} />
      ))}
    </div>
  );
}

export default function CampaignTable({ rows = campaigns }: { rows?: Campaign[] }) {
  const [allChecked, setAllChecked] = useState(false);
  return (
    <div className="scroll-slim overflow-x-auto rounded-lg border border-[#DDE2EE] bg-white shadow-[0px_5px_10px_0px_rgba(23,23,58,0.05)]">
      <div className="min-w-[1180px]">
      {/* Header row */}
      <div className={`grid ${GRID} h-[52px] items-center border-b border-[#DDE2EE]`}>
        <div className="sticky left-0 z-10 flex h-full items-center gap-3.5 border-r border-[#EDF0F7] bg-white pl-4 pr-4">
          <Checkbox checked={allChecked} onChange={() => setAllChecked((v) => !v)} />
          <span className="font-manrope text-sm font-medium text-[#6F6F8D]">
            Campaign Info
          </span>
        </div>
        {METRIC_HEADERS.map((h, i) => (
          <div
            key={h}
            className={`px-5 font-manrope text-sm font-medium text-[#6F6F8D] ${
              i === 0 ? "text-left" : "text-right"
            }`}
          >
            {h}
          </div>
        ))}
      </div>

      {/* Body */}
      <div>
        {rows.map((c) => (
          <CampaignRow key={c.id} c={c} />
        ))}
      </div>
      </div>
    </div>
  );
}
