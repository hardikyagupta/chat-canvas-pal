import type { CampaignStatus } from "./campaigns.data";

const STYLES: Record<CampaignStatus, string> = {
  SENT: "bg-[#FFF8E7] border-[#FFCF5C] text-[#E7B231]",
  "IN-PROCESS": "bg-[#E7EFE7] border-[#00C48C] text-[#00C48C]",
  SCHEDULED: "bg-[#E7EDFF] border-[#0A8FFD] text-[#0084F4]",
  DRAFT: "bg-[#E7EAFF] border-[#6F6F8D] text-[#6F6F8D]",
  SUSPENDED: "bg-[#FFF0E7] border-[#FC5E02] text-[#FC5E02]",
  FAILED: "bg-[#FFE7E7] border-[#F05C5C] text-[#F05C5C]",
};

export default function StatusBadge({ status }: { status: CampaignStatus }) {
  return (
    <span
      className={`inline-flex h-[18px] items-center rounded-[2px] border px-2 font-manrope text-[10px] font-bold uppercase leading-none tracking-[0.6px] ${STYLES[status]}`}
    >
      {status}
    </span>
  );
}
