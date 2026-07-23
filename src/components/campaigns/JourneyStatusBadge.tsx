import type { JourneyStatus } from "./journeys.data";

const STYLES: Record<JourneyStatus, string> = {
  DRAFT: "bg-[#E7EAFF] border-[#6F6F8D] text-[#6F6F8D]",
  SCHEDULED: "bg-[#FBEADC] border-[#FFA26B] text-[#FFA26B]",
  STOPPED: "bg-[#F7E8FD] border-[#BE52F2] text-[#BE52F2]",
  COMPLETED: "bg-[#E7EFE7] border-[#00C48C] text-[#00C48C]",
};

export default function JourneyStatusBadge({ status }: { status: JourneyStatus }) {
  return (
    <span
      className={`inline-flex h-[18px] items-center rounded-[2px] border px-2 font-manrope text-[10px] font-bold uppercase leading-none tracking-[0.6px] ${STYLES[status]}`}
    >
      {status}
    </span>
  );
}
