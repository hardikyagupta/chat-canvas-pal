import L1Nav from "@/components/campaigns/L1Nav";
import TopNav from "@/components/campaigns/TopNav";
import DecisioningBoard from "@/components/decisioning/DecisioningBoard";

/**
 * PREVIEW of the "everything on the homepage" direction for the Decisioning
 * engine. Same chrome as the real page, but the landing is the config board
 * (DecisioningBoard) instead of the linear 3-step teaser. Reachable at
 * /decisioning-engine/preview so it can be compared side-by-side with the
 * current /decisioning-engine. Not wired into nav.
 */
export default function DecisioningEnginePreview() {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#F4F8FF]">
      <L1Nav active="decisioning" />
      <div className="flex min-w-0 flex-1 flex-col p-2">
        <TopNav label="Customer Engagement" showCoMarketerNudge={false} />
        <div className="mt-2 flex min-h-0 flex-1 gap-2">
          <div className="min-w-0 flex-1 overflow-y-auto px-4 pt-4">
            <DecisioningBoard />
          </div>
        </div>
      </div>
    </div>
  );
}
