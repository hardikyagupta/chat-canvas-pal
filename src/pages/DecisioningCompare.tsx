/**
 * Compare tab for live objective performance — placeholder until comparison
 * views (hold-out, cohorts, objectives) are built out.
 */
export default function DecisioningCompare() {
  return (
    <div className="mx-auto flex w-full max-w-[1200px] flex-col items-center justify-center px-[54px] py-24">
      <div className="flex max-w-md flex-col items-center text-center">
        <span className="mb-4 grid h-12 w-12 place-items-center rounded-xl bg-[#EEF3FF] font-manrope text-[20px] font-bold text-[#2F68E5]">
          ⇄
        </span>
        <h2 className="font-manrope text-[20px] font-bold text-[#17173A]">
          Compare
        </h2>
        <p className="mt-2 font-manrope text-[14px] leading-relaxed text-[#6F6F8D]">
          Side-by-side performance comparisons will appear here — hold-out vs
          treatment, cohort splits, and objective benchmarks.
        </p>
      </div>
    </div>
  );
}
