import { useLayoutEffect, useState, type RefObject } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle } from "lucide-react";
import NudgeFooter from "./NudgeFooter";

const nf = new Intl.NumberFormat("en-US");

/**
 * One-time warning nudge — surfaces once the "Send to" step is completed
 * with "All contacts" still selected, so a blanket send doesn't happen by
 * accident. Same card treatment as the discovery-nudge family (border,
 * radius, shadow, pointer arrow), but a single "Okay, got it" dismissal
 * instead of a Back/Next sequence. Whether it's been seen for this campaign
 * draft is tracked by the caller, not this component.
 *
 * Portalled to <body> and positioned from the anchor's live rect — the
 * accordion card it hangs off has `overflow: hidden` for its collapse
 * animation, which would otherwise clip anything that pokes out past it.
 */
export default function AllContactsNudge({
  reach,
  anchorRef,
  onClose,
}: {
  reach: number;
  anchorRef: RefObject<HTMLElement>;
  onClose: () => void;
}) {
  const [rect, setRect] = useState<DOMRect | null>(null);

  useLayoutEffect(() => {
    const update = () => anchorRef.current && setRect(anchorRef.current.getBoundingClientRect());
    update();
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);

    // The pill this hangs off mounts in the same commit as the "Send to"
    // card collapsing and the next card expanding — neither a scroll nor a
    // resize event fires as that settles, so a single synchronous rect can
    // land stale (e.g. captured before the bold reach count reflows once its
    // font weight finishes loading). Re-measure across the next few frames
    // and once webfonts are ready to catch that settle without waiting on
    // an event that never comes.
    const raf1 = requestAnimationFrame(() => {
      update();
      requestAnimationFrame(update);
    });
    const settleTimer = window.setTimeout(update, 400);
    document.fonts?.ready?.then(update);

    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
      cancelAnimationFrame(raf1);
      window.clearTimeout(settleTimer);
    };
  }, [anchorRef]);

  if (!rect) return null;

  return createPortal(
    <div
      style={{ position: "fixed", top: rect.bottom + 12, left: rect.right - 300 }}
      className="z-[150] w-[300px] animate-in fade-in slide-in-from-top-2 duration-300"
      role="dialog"
      aria-label="All contacts selected"
    >
      {/* Pointer arrow — points up at the reach pill this nudge hangs off. */}
      <span
        aria-hidden="true"
        className="absolute -top-[6px] right-[26px] z-10 h-3 w-3 rotate-45 border-l border-t border-[#DDE2EE] bg-white"
      />

      <div className="overflow-hidden rounded-[8px] border border-solid border-[#DDE2EE] bg-white shadow-[5px_5px_10px_0px_#E5E9F2]">
        <div className="flex items-start gap-2.5 p-4 pb-3">
          <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[#FFF3D6]">
            <AlertTriangle className="size-4 text-[#E9A400]" strokeWidth={2} />
          </span>
          <div className="flex flex-col gap-1 pt-0.5">
            <span className="font-manrope text-[14px] font-semibold leading-[20px] text-[#17173A]">
              All contacts selected
            </span>
            <p className="font-manrope text-[13px] font-medium leading-[20px] text-[#6F6F8D]">
              This campaign will send to your entire list — {nf.format(reach)} contacts. Make
              sure that's what you want.
            </p>
          </div>
        </div>
        <NudgeFooter onNext={onClose} nextLabel="Okay, got it" />
      </div>
    </div>,
    document.body
  );
}
