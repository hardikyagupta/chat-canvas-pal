import type { LucideIcon } from "lucide-react";
import StepCard from "./StepCard";

/**
 * Stub body for the steps that aren't built yet (Content / Audience /
 * Schedule). Same card as a real step so the shell reads as complete while the
 * step content is still to come.
 */
export default function StepPlaceholder({
  title,
  description,
  icon: Icon,
  note,
}: {
  title: string;
  description: string;
  icon: LucideIcon;
  note: string;
}) {
  return (
    <StepCard title={title} description={description}>
      <div className="flex flex-col items-center gap-3 rounded-md border border-dashed border-[#DDE2EE] bg-[#F7F9FC] px-6 py-12 text-center">
        <span className="grid h-10 w-10 place-items-center rounded-lg bg-[#E7EDFF]">
          <Icon className="h-5 w-5 text-[#2F68E5]" strokeWidth={1.8} />
        </span>
        <p className="max-w-[360px] font-manrope text-[13px] leading-5 text-[#6F6F8D]">{note}</p>
      </div>
    </StepCard>
  );
}
