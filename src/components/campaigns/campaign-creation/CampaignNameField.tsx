import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Inline campaign rename — click the name to edit, Enter/blur commits,
 * Escape reverts, blank keeps the old name. Shared by the navbar and the
 * intro screen so the name edits the same way everywhere it appears.
 */
export default function CampaignNameField({
  campaignName,
  onRenameCampaign,
  className,
}: {
  campaignName: string;
  onRenameCampaign?: (name: string) => void;
  className?: string;
}) {
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

  if (isRenaming) {
    return (
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
          className={cn(
            "w-[320px] max-w-full min-w-0 border-0 bg-transparent p-0 font-manrope text-base font-bold leading-[22px] text-[#17173A] focus:outline-none",
            className
          )}
        />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={startRename}
      aria-label="Rename campaign"
      className={cn(
        "max-w-full truncate rounded-md px-2 py-1 font-manrope text-base font-bold leading-[22px] text-[#17173A] transition-colors hover:bg-[#F0F3F9]",
        className
      )}
    >
      {campaignName}
    </button>
  );
}
