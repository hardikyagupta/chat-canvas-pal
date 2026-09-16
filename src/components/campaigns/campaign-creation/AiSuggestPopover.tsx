import { useEffect, useRef, useState } from "react";
import { ChevronRight, Info, RotateCcw, ThumbsDown, ThumbsUp, X } from "lucide-react";
import { cn } from "@/lib/utils";
import sparkle from "/campaign-assets/ic-sparkle-ai.gif";

/** Shared inline copy suggestions for email and push text fields. */
export default function AiSuggestPopover({ pool, onPick, ariaLabel = "Suggest with AI" }: { pool: string[]; onPick: (text: string) => void; ariaLabel?: string }) {
  const [open, setOpen] = useState(false);
  const [offset, setOffset] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const shown = [0, 1, 2].map((i) => pool[(offset + i) % pool.length]);

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        aria-label={ariaLabel}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "grid size-7 place-items-center rounded-md transition-colors",
          open ? "bg-[#F3F0FF]" : "hover:bg-[#F3F0FF]"
        )}
      >
        <img src={sparkle} alt="" className="size-4 shrink-0" />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-20 mt-2 w-[320px] rounded-lg border border-[#DDE2EE] bg-white p-3 shadow-[0_8px_24px_rgba(23,23,58,0.12)]">
          <div className="flex items-center justify-between gap-2 px-1">
            <span className="font-manrope text-[13px] font-bold text-[#17173A]">
              Here are some options for you
            </span>
            <button
              type="button"
              aria-label="Close"
              onClick={() => setOpen(false)}
              className="grid size-5 shrink-0 place-items-center rounded-full text-[#8A8AA3] transition-colors hover:bg-[#F0F3F9] hover:text-[#17173A]"
            >
              <X className="size-3.5" strokeWidth={2.2} />
            </button>
          </div>

          <div className="mt-2 flex flex-col gap-2">
            {shown.map((text, i) => (
              <button
                key={text}
                type="button"
                style={{ animationDelay: `${i * 50}ms` }}
                onClick={() => {
                  onPick(text);
                  setOpen(false);
                }}
                className="cmk-reveal group flex items-center gap-2.5 rounded-lg border border-[#DDE2EE] bg-white p-2.5 text-left transition-colors hover:border-[#2F68E5] hover:bg-[#F7F9FF]"
              >
                <span className="min-w-0 flex-1 font-manrope text-[13px] font-medium leading-[18px] text-[#17173A]">
                  {text}
                </span>
                <ChevronRight
                  className="size-4 shrink-0 text-[#A0A0B8] transition-colors group-hover:text-[#2F68E5]"
                  strokeWidth={2}
                />
              </button>
            ))}
          </div>

          <div className="mt-2 flex items-center justify-between border-t border-[#EEF1F7] px-1 pt-2.5">
            <button
              type="button"
              onClick={() => setOffset((o) => o + 3)}
              className="flex items-center gap-1.5 font-manrope text-[12px] font-semibold text-[#2F68E5] transition-colors hover:text-[#1F51BE]"
            >
              <RotateCcw className="size-3.5" strokeWidth={2.2} />
              Retry
            </button>
            <div className="flex items-center gap-1 text-[#8A8AA3]">
              <button
                type="button"
                aria-label="Good suggestion"
                className="grid size-6 place-items-center rounded-full transition-colors hover:bg-[#F0F3F9] hover:text-[#17173A]"
              >
                <ThumbsUp className="size-3.5" strokeWidth={2} />
              </button>
              <button
                type="button"
                aria-label="Bad suggestion"
                className="grid size-6 place-items-center rounded-full transition-colors hover:bg-[#F0F3F9] hover:text-[#17173A]"
              >
                <ThumbsDown className="size-3.5" strokeWidth={2} />
              </button>
            </div>
          </div>
          <p className="mt-1.5 flex items-start gap-1.5 px-1 font-manrope text-[11px] leading-[16px] text-[#8A8AA3]">
            <Info className="mt-px size-3.5 shrink-0" strokeWidth={2} />
            Review generated results for accuracy.
          </p>
        </div>
      )}
    </div>
  );
}

