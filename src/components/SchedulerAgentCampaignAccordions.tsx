import React, { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface CampaignData {
  id: string;
  name: string;
  segment: string;
  reachableCount: number;
  schedule: {
    stoEnabled: boolean;
    schedule: string;
    pushTTL: string;
  };
}

const campaignData: CampaignData[] = [
  {
    id: "affinity-based",
    name: "Affinity-Based Targeting Campaign",
    segment: "Affinity_based_segment",
    reachableCount: 52678,
    schedule: {
      stoEnabled: true,
      schedule: "Feb 7–14, focusing on 7–10 PM (19:00–22:00), with extra emphasis on weekends",
      pushTTL: "24 hours"
    }
  },
  {
    id: "high-value-customers",
    name: "High Value Customer Campaign",
    segment: "High_AOV_segment",
    reachableCount: 12345,
    schedule: {
      stoEnabled: true,
      schedule: "Feb 7–14, targeting 12–3 PM (12:00–15:00) and 7–10 PM (19:00–22:00)",
      pushTTL: "24 hours"
    }
  },
  {
    id: "seasonal-shoppers",
    name: "Seasonal Shoppers Campaign",
    segment: "Seasonal_buyers",
    reachableCount: 34567,
    schedule: {
      stoEnabled: true,
      schedule: "Feb 7–14, evenly distributed across all engagement windows with Valentine's focus",
      pushTTL: "24 hours"
    }
  },
  {
    id: "loyalty-members",
    name: "Loyalty Members Campaign",
    segment: "Loyalty_program_members",
    reachableCount: 8910,
    schedule: {
      stoEnabled: false,
      schedule: "Fixed schedule at 3 PM daily and 7 PM on weekends with exclusive offers",
      pushTTL: "12 hours"
    }
  }
];

export function SchedulerAgentCampaignAccordions() {
  const [openCampaigns, setOpenCampaigns] = useState<Set<string>>(new Set(["affinity-based"]));
  const [hoveredCampaign, setHoveredCampaign] = useState<string | null>(null);

  const toggleCampaign = (campaignId: string) => {
    const newOpenCampaigns = new Set(openCampaigns);
    if (newOpenCampaigns.has(campaignId)) {
      newOpenCampaigns.delete(campaignId);
    } else {
      newOpenCampaigns.add(campaignId);
    }
    setOpenCampaigns(newOpenCampaigns);
  };

  const formatNumber = (num: number) => {
    return num.toLocaleString();
  };

  return (
    <div className="w-full space-y-4">
      <p className="text-sm text-[#17173A] dark:text-white">Based on the campaign parameters and segments, I've created an optimal schedule considering the 7-day duration and established engagement patterns:</p>
      
      <div className="space-y-3">
        {campaignData.map((campaign, index) => {
          const isOpen = openCampaigns.has(campaign.id);
          const isHovered = hoveredCampaign === campaign.id;
          
          return (
            <div key={campaign.id} className="space-y-2">
              {/* Accordion Trigger - Exactly matching Figma specs */}
              <button
                onClick={() => toggleCampaign(campaign.id)}
                onMouseEnter={() => setHoveredCampaign(campaign.id)}
                onMouseLeave={() => setHoveredCampaign(null)}
                className={cn(
                  // Auto layout: flex, flex-direction: row, align-items: center
                  "flex flex-row items-center",
                  // Padding: 5px, gap: 2px
                  "px-[5px] py-[5px] gap-[2px]",
                  // Width: auto (flexible for text), height: 26px
                  "h-[26px] w-auto",
                  // Border radius: 5px
                  "rounded-[5px]",
                  // Transition for smooth hover
                  "transition-all duration-200",
                  // Background based on state - exactly matching Figma
                  isHovered ? "bg-[#F3F4F6]" : "bg-white",
                  // Focus styles
                  "focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                )}
              >
                {/* Chevron Icon - 16x16px */}
                <div className="w-4 h-4 flex items-center justify-center flex-none">
                  {isOpen ? (
                    <ChevronDown 
                      className={cn(
                        "w-4 h-4 transition-all duration-200",
                        // Color based on hover state
                        isHovered ? "text-[#394150]" : "text-[#6C717F]"
                      )} 
                    />
                  ) : (
                    <ChevronRight 
                      className={cn(
                        "w-4 h-4 transition-all duration-200",
                        // Color based on hover state  
                        isHovered ? "text-[#394150]" : "text-[#6C717F]"
                      )} 
                    />
                  )}
                </div>
                
                {/* Campaign Text - Manrope, 500 weight, 12px, 16px line height */}
                <span 
                  className={cn(
                    // Font specifications from Figma
                    "font-['Manrope'] font-medium text-xs leading-4",
                    // Height: 16px, flex: none, order: 1, flex-grow: 0
                    "h-4 flex-none",
                    // Color based on hover state
                    isHovered ? "text-[#394150]" : "text-[#6C717F]",
                    "transition-colors duration-200"
                  )}
                >
                  Campaign {index + 1}: {campaign.name}
                </span>
              </button>

              {/* Accordion Content */}
              {isOpen && (
                <div className="ml-6 space-y-3 transition-all duration-300 ease-in-out">
                  {/* Segment Section */}
                  <div>
                    <h4 className="font-semibold text-sm mb-1 text-[#17173A] dark:text-white">Segment of campaign</h4>
                    <p className="text-sm text-[#17173A] dark:text-white">{campaign.segment} | Reachable count: {formatNumber(campaign.reachableCount)} users</p>
                  </div>

                  {/* Schedule Section */}
                  <div>
                    <h4 className="font-semibold text-sm mb-1 text-[#17173A] dark:text-white">Schedule of campaign</h4>
                    <div className="text-sm text-[#17173A] dark:text-white space-y-1">
                      <p><span className="font-medium">Send Time Optimization (STO):</span> {campaign.schedule.stoEnabled ? 'Enabled' : 'Not used'}</p>
                      <p><span className="font-medium">Schedule:</span> {campaign.schedule.schedule}</p>
                      <p><span className="font-medium">Push TTL:</span> {campaign.schedule.pushTTL}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
