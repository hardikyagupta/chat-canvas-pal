/**
 * Shared footer for the discovery-nudge sequence (Decisioning → AI Dashboard →
 * Co-marketer). Back is omitted on the first step; the last step swaps "Next"
 * for "Got it". A "1/3"-style step counter sits on the left, with Back/Next
 * grouped together on the right.
 */
export default function NudgeFooter({
  onBack,
  onNext,
  nextLabel = "Next",
  step,
  total = 3,
}: {
  onBack?: () => void;
  onNext: () => void;
  nextLabel?: string;
  /** 1-based position in the sequence — renders as "step/total" on the left. */
  step?: number;
  total?: number;
}) {
  return (
    <div className="flex items-center justify-between gap-2 px-4 pb-3">
      {step ? (
        <span className="font-manrope text-[12px] font-semibold text-[#6F6F8D]">
          {step}/{total}
        </span>
      ) : (
        <span />
      )}
      <div className="flex items-center gap-2">
        {onBack && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onBack();
            }}
            className="rounded-[6px] border border-[#DDE2EE] px-3 py-1.5 font-manrope text-[12px] font-semibold text-[#17173A] transition-colors hover:bg-[#F4F8FF]"
          >
            Back
          </button>
        )}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onNext();
          }}
          className="rounded-[6px] bg-[#2F68E5] px-3 py-1.5 font-manrope text-[12px] font-semibold text-white transition-colors hover:bg-[#255ad2]"
        >
          {nextLabel}
        </button>
      </div>
    </div>
  );
}
