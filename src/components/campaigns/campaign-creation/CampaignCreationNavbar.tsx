import { useEffect, useRef, useState } from "react";
import { X, type LucideIcon } from "lucide-react";
import sparkle from "/campaign-assets/ic-sparkle.gif";

/**
 * Top bar of the campaign creation overlay — channel icon + campaign name on
 * the left, ASK CO-MARKETER / SAVE / NEXT STEP / close on the right. Structure
 * follows the shared campaign-creation reference; styling is this app's
 * language (Manrope, #2F68E5 primary, #DDE2EE lines).
 */
export default function CampaignCreationNavbar({
  campaignName,
  icon: Icon,
  nextLabel = "Next step",
  onRenameCampaign,
  onAskCoMarketer,
  onSave,
  onNextStep,
  onClose,
}: {
  campaignName: string;
  icon: LucideIcon;
  /** Last step swaps this for the terminal action. */
  nextLabel?: string;
  onRenameCampaign?: (name: string) => void;
  onAskCoMarketer?: () => void;
  onSave?: () => void;
  onNextStep?: () => void;
  onClose?: () => void;
}) {
  // Inline rename, same interaction as the co-marketer chat header: click the
  // name to edit, Enter/blur commits, Escape reverts, blank keeps the old name.
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState("");
  const renameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isRenaming) renameInputRef.current?.select();
  }, [isRenaming]);

  const startRename = () => {
    setRenameValue(campaignName);
    setIsRenaming(true);
  };
  const commitRename = () => {
    const next = renameValue.trim();
    if (next && next !== campaignName) onRenameCampaign?.(next);
    setIsRenaming(false);
  };
  const cancelRename = () => setIsRenaming(false);

  return (
    <header className="flex h-14 shrink-0 items-center border-b border-[#DDE2EE] bg-white px-14">
      <div className="flex min-w-0 items-center gap-3">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded bg-[#E7EDFF]">
          <Icon className="h-4 w-4 text-[#2F68E5]" strokeWidth={2} />
        </span>
        {isRenaming ? (
          <div className="flex min-w-0 items-center rounded-lg bg-white px-2.5 py-1 ring-2 ring-[#2F68E5]">
            <input
              ref={renameInputRef}
              autoFocus
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitRename();
                else if (e.key === "Escape") cancelRename();
              }}
              onBlur={commitRename}
              aria-label="Campaign name"
              className="w-[320px] max-w-full min-w-0 border-0 bg-transparent p-0 font-manrope text-base font-bold leading-[22px] text-[#17173A] focus:outline-none"
            />
          </div>
        ) : (
          <button
            type="button"
            onClick={startRename}
            aria-label="Rename campaign"
            className="max-w-full truncate rounded-md px-2 py-1 font-manrope text-base font-bold leading-[22px] text-[#17173A] transition-colors hover:bg-[#F0F3F9]"
          >
            {campaignName}
          </button>
        )}
      </div>

      <div className="ml-auto flex items-center gap-3">
        {/* Ask co-marketer — the top-nav CTA verbatim: rotating conic-gradient
            ring (.snake-border), sparkle GIF, h-8 to match Save/Next step. */}
        <button
          type="button"
          onClick={onAskCoMarketer}
          className="relative z-[1] flex h-8 items-center gap-1.5 overflow-hidden rounded-lg bg-white px-2.5 transition-shadow hover:shadow-sm"
        >
          <span aria-hidden="true" className="snake-border" />
          <img src={sparkle} alt="" className="relative z-[1] h-5 w-5" />
          <span className="relative z-[1] font-manrope text-xs font-semibold tracking-[0.42px] text-ash">
            Ask co-marketer
          </span>
        </button>
        <button
          type="button"
          onClick={onSave}
          className="dc-btn dc-btn-secondary uppercase"
        >
          {/* Was "Save", then "Save as draft". */}
          SAVE FOR LATER
        </button>
        <button
          type="button"
          onClick={onNextStep}
          className="dc-btn dc-btn-primary uppercase"
        >
          {nextLabel}
        </button>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close campaign creation"
          className="grid h-8 w-8 place-items-center rounded border border-[#DDE2EE] text-[#6F6F8D] transition-colors hover:bg-[#F7F9FC] hover:text-[#17173A]"
        >
          <X className="h-4 w-4" strokeWidth={2} />
        </button>
      </div>
    </header>
  );
}