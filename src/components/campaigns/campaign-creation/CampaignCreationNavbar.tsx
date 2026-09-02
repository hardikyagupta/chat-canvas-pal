import { useEffect, useRef, useState } from "react";
import { Settings, X, type LucideIcon } from "lucide-react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
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
  onRenameCampaign,
  onOpenSettings,
  onAskCoMarketer,
  askCoMarketerLabel = "Ask co-marketer",
  onClose,
  steps,
  activeStepId,
  onSelectStep,
}: {
  campaignName: string;
  icon: LucideIcon;
  onRenameCampaign?: (name: string) => void;
  onOpenSettings?: () => void;
  onAskCoMarketer?: () => void;
  /** Email reads as just "Co-marketer" here; every other channel keeps the verb. */
  askCoMarketerLabel?: string;
  onClose?: () => void;
  /** The accordion's own steps — drives the centered stepper below. */
  steps?: { id: string; label: string }[];
  activeStepId?: string | null;
  onSelectStep?: (id: string) => void;
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

  const activeLabel = steps?.find((s) => s.id === activeStepId)?.label;

  return (
    <header className="relative flex h-14 shrink-0 items-center border-b border-[#DDE2EE] bg-white px-14">
      {steps && steps.length > 0 && (
        <div className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1.5">
          {activeLabel && (
            <p className="font-manrope text-xs font-bold text-[#17173A]">{activeLabel}</p>
          )}
          <div className="flex items-center gap-1.5">
            {steps.map((step) => (
              <button
                key={step.id}
                type="button"
                onClick={() => onSelectStep?.(step.id)}
                aria-label={step.label}
                aria-current={step.id === activeStepId}
                className={cn(
                  "h-1.5 w-8 rounded-full transition-colors",
                  step.id === activeStepId
                    ? "bg-[#00C48C]"
                    : "bg-[#DDE2EE] hover:bg-[#C3CAD9]"
                )}
              />
            ))}
          </div>
        </div>
      )}

      <div className="flex min-w-0 items-center gap-3">
        <TooltipProvider delayDuration={150}>
          <Tooltip>
            <TooltipTrigger asChild>
              <span
                tabIndex={0}
                aria-label="Email"
                className="grid h-8 w-8 shrink-0 cursor-default place-items-center rounded bg-[#E7EDFF]"
              >
                <Icon className="h-4 w-4 text-[#2F68E5]" strokeWidth={2} />
              </span>
            </TooltipTrigger>
            <TooltipContent
              side="bottom"
              align="center"
              sideOffset={8}
              className="overflow-visible rounded-lg border-0 bg-black px-3 py-1.5 text-white shadow-none"
            >
              <p className="font-manrope text-xs leading-[18px]">Email</p>
              <TooltipPrimitive.Arrow className="fill-black" width={10} height={6} />
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
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
        <TooltipProvider delayDuration={150}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={onOpenSettings}
                aria-label="Settings"
                className="grid h-8 w-8 place-items-center rounded border border-[#DDE2EE] text-[#6F6F8D] transition-colors hover:bg-[#F7F9FC] hover:text-[#17173A]"
              >
                <Settings className="h-4 w-4" strokeWidth={2} />
              </button>
            </TooltipTrigger>
            <TooltipContent
              side="bottom"
              align="center"
              sideOffset={8}
              className="overflow-visible rounded-lg border-0 bg-black px-3 py-1.5 text-white shadow-none"
            >
              <p className="font-manrope text-xs leading-[18px]">Settings</p>
              <TooltipPrimitive.Arrow className="fill-black" width={10} height={6} />
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
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
            {askCoMarketerLabel}
          </span>
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