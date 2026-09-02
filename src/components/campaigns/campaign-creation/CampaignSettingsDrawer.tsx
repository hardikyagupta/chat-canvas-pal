import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { parseTags } from "./CampaignSetupStep";

const fieldClass =
  "h-10 w-full rounded-md border border-[#DDE2EE] bg-[#F7F9FC] px-3 font-manrope text-sm text-[#17173A] outline-none transition-colors placeholder:text-[#A0A0A0] focus:border-[#2F68E5] focus:bg-white";

/** Settings icon in the navbar opens this — a right-side drawer over the
 *  wizard, for campaign-level settings that don't belong to any one step. */
export default function CampaignSettingsDrawer({
  open,
  tags,
  onChangeTags,
  onClose,
}: {
  open: boolean;
  tags: string;
  onChangeTags: (tags: string) => void;
  onClose: () => void;
}) {
  const [shown, setShown] = useState(false);

  useEffect(() => {
    if (!open) {
      setShown(false);
      return;
    }
    const id = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(id);
  }, [open]);

  if (!open) return null;

  const tagList = parseTags(tags);

  return createPortal(
    <div className="fixed inset-0 z-[100] flex justify-end">
      <div
        className={cn(
          "absolute inset-0 bg-black/40 transition-opacity duration-300",
          shown ? "opacity-100" : "opacity-0"
        )}
        onClick={onClose}
      />
      <div
        className={cn(
          "relative flex h-full w-full max-w-[420px] flex-col bg-white shadow-[-20px_0_60px_rgba(23,23,58,0.15)] transition-transform duration-300 ease-out",
          shown ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="flex items-center justify-between border-b border-[#DDE2EE] px-6 py-5">
          <h2 className="font-manrope text-lg font-bold text-[#17173A]">Campaign settings</h2>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="grid size-8 place-items-center rounded-full text-[#8A8AA3] transition-colors hover:bg-[#F0F3F9] hover:text-[#17173A]"
          >
            <X className="size-5" strokeWidth={2} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          <label className="mb-1.5 block font-manrope text-sm font-semibold text-[#17173A]">
            Add tags
          </label>
          <input
            type="text"
            value={tags}
            onChange={(e) => onChangeTags(e.target.value)}
            placeholder="Ex: Festive, Q3"
            className={fieldClass}
          />
          {tagList.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {tagList.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 rounded-full border border-[#DDE2EE] bg-[#F7F9FC] py-0.5 pl-2.5 pr-1 font-manrope text-[11px] font-medium text-[#17173A]"
                >
                  {tag}
                  <button
                    type="button"
                    aria-label={`Remove ${tag}`}
                    onClick={() => onChangeTags(tagList.filter((t) => t !== tag).join(", "))}
                    className="grid size-4 place-items-center rounded-full text-[#8A8AA3] hover:bg-[#E8ECF4] hover:text-[#17173A]"
                  >
                    <X className="size-3" strokeWidth={2.5} />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
