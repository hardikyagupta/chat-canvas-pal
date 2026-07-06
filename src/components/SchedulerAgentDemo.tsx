import React from "react";
import { SchedulerAgentCampaignAccordions } from "./SchedulerAgentCampaignAccordions";

export function SchedulerAgentDemo() {
  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      <div className="bg-card rounded-lg border border-line p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 bg-royal rounded flex items-center justify-center">
            <span className="text-white text-sm font-semibold">📅</span>
          </div>
          <h2 className="text-lg font-semibold text-foreground">Scheduler Agent</h2>
        </div>
        
        <SchedulerAgentCampaignAccordions />
      </div>
    </div>
  );
}
