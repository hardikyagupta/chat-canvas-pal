import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import sparkle from "/campaign-assets/ic-sparkle-ai.gif";
import { groupFindings, type Finding } from "./previewFindings.data";

/**
 * One co-marketer finding. Deliberately a single call to action: the fix, the
 * alternatives and the step it lives on are all things to talk about, so the
 * card states the problem and hands the whole conversation to the thread.
 *
 * Shared between the preview screen's review rail and the co-marketer chat —
 * an audit asked for from inside the wizard renders the same cards.
 */
export function FindingCard({ finding, onAsk }: { finding: Finding; onAsk: () => void }) {
  const severe = finding.verdict === "WILL UNDERPERFORM";
  return (
    <div className="rounded-lg border border-[#DDE2EE] bg-white p-4">
      <div className="flex gap-2.5">
        <AlertTriangle
          className={cn("mt-0.5 size-[18px] shrink-0", severe ? "text-[#E2542C]" : "text-[#E9A400]")}
          strokeWidth={2}
        />
        <p className="font-manrope text-[15px] font-bold leading-6 text-[#17173A]">
          {finding.title}
        </p>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2 pl-7">
        <span
          className={cn(
            "rounded-md px-2 py-1 font-manrope text-[11px] font-bold uppercase tracking-[0.3px]",
            severe ? "bg-[#FDF0E9] text-[#B23F14]" : "bg-[#FFF8E5] text-[#8A6100]"
          )}
        >
          {finding.verdict}
        </span>
        <span className="rounded-md bg-[#F0F3F9] px-2 py-1 font-manrope text-[12px] font-medium text-[#17173A]">
          {finding.impact}
        </span>
      </div>

      <p className="mt-2 pl-7 font-manrope text-sm leading-6 text-[#17173A]">{finding.detail}</p>
      <p className="mt-1 pl-7 font-manrope text-sm leading-6 text-[#8A8AA3]">
        Evidence · {finding.evidence}
      </p>

      <div className="mt-3 pl-7">
        <button
          type="button"
          onClick={onAsk}
          className="inline-flex h-9 items-center gap-1.5 rounded-md bg-[#EAF1FE] px-3 font-manrope text-sm font-semibold text-[#2F68E5] transition-colors hover:bg-[#DCE8FD]"
        >
          <img src={sparkle} alt="" className="size-4" />
          {finding.askLabel}
        </button>
        <p className="mt-2 font-manrope text-xs text-[#8A8AA3]">
          {finding.link.stepLabel} → {finding.link.field}
        </p>
      </div>
    </div>
  );
}

/** Every finding from an audit, grouped by category — the same layout as the
 *  preview screen's review rail, dropped straight into a chat bubble. */
export function FindingsReviewList({
  findings,
  onAsk,
}: {
  findings: Finding[];
  onAsk: (finding: Finding) => void;
}) {
  const groups = groupFindings(findings);
  return (
    <div className="w-full space-y-4">
      {groups.map((group) => (
        <div key={group.category}>
          <p className="mb-2 font-manrope text-xs font-bold uppercase tracking-[0.6px] text-[#8A8AA3]">
            {group.category} · {group.items.length} finding
            {group.items.length === 1 ? "" : "s"}
          </p>
          <div className="space-y-3">
            {group.items.map((f) => (
              <FindingCard key={f.id} finding={f} onAsk={() => onAsk(f)} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
