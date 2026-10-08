import { useState } from "react";
import { ArrowUp } from "lucide-react";
import CoMarketerQuestionCard, { type CoMarketerQuestion } from "@/components/campaigns/CoMarketerQuestionCard";

export interface AudienceTestCardData {
  totalAudience: number;
}

const QUESTION: CoMarketerQuestion = {
  title: "What percentage of your audience should be included in this test?",
  options: ["5%", "10%", "20%", "Custom"],
};

/** A free-text answer — same inline composer shape (rounded field + small
 *  round submit button) used elsewhere in this conversation for a
 *  "Custom" pick CoMarketerQuestionCard's fixed choices don't cover. */
function CustomPercentField({ onSubmit }: { onSubmit: (percent: number) => void }) {
  const [value, setValue] = useState("");
  const submit = () => {
    const pct = Math.min(99, Math.max(1, Number(value.replace(/[^\d.]/g, "")) || 0));
    if (pct > 0) onSubmit(pct);
  };
  return (
    <div className="flex items-center gap-1.5">
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && submit()}
        placeholder="Custom % (e.g. 25)"
        className="h-8 flex-1 rounded-full border border-[#DDE2EE] bg-white px-3 font-manrope text-[12.5px] text-[#17173A] outline-none focus:border-[#2F68E5]"
      />
      <button
        type="button"
        onClick={submit}
        disabled={!value.trim()}
        aria-label="Submit"
        className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#2F68E5] text-white transition-opacity disabled:opacity-40"
      >
        <ArrowUp className="h-4 w-4" strokeWidth={2.2} />
      </button>
    </div>
  );
}

/**
 * The goal-first conversation's own audience-split question — reuses
 * CoMarketerQuestionCard exactly as every other co-marketer question in
 * this app does, rather than a new form. "Custom" drops into the same
 * free-text follow-up shape ExperimentCard's own split question uses.
 */
export default function AudienceTestQuestionCard({
  onSubmit,
}: {
  data: AudienceTestCardData;
  onSubmit?: (percent: number) => void;
}) {
  const [awaitingCustom, setAwaitingCustom] = useState(false);

  if (awaitingCustom) {
    return (
      <div className="w-full rounded-lg border border-[#DDE2EE] bg-white p-4">
        <p className="font-manrope text-[13px] font-semibold text-[#17173A]">{QUESTION.title}</p>
        <div className="mt-2">
          <CustomPercentField onSubmit={(pct) => onSubmit?.(pct)} />
        </div>
      </div>
    );
  }

  return (
    <CoMarketerQuestionCard
      questions={[QUESTION]}
      onComplete={(answers) => {
        const picked = answers[0];
        if (!picked) return;
        if (picked === "Custom") {
          setAwaitingCustom(true);
          return;
        }
        onSubmit?.(parseInt(picked, 10));
      }}
      onClose={() => {}}
    />
  );
}
