import React, { useState, useEffect } from 'react';
import { Check, AlertTriangle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CampaignStep {
  id: string;
  initialText: string;
  completedText: string;
  status: 'pending' | 'loading' | 'success' | 'warning' | 'error';
  warningText?: string;
  errorText?: string;
}

interface Campaign {
  id: string;
  name: string;
  steps: CampaignStep[];
  status: 'pending' | 'active' | 'completed';
}

interface FlowExecutionProgressProps {
  onComplete?: () => void;
}

export function FlowExecutionProgress({ onComplete }: FlowExecutionProgressProps) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([
    {
      id: 'campaign1',
      name: 'Affinity-Based Targeting Campaign',
      status: 'pending',
      steps: [
        {
          id: 'segment1',
          initialText: 'Setting up segment',
          completedText: 'Segment has been created',
          status: 'pending'
        },
        {
          id: 'template1',
          initialText: 'Reviewing template',
          completedText: 'Template has been approved',
          status: 'pending',
          errorText: 'Meta has rejected the template. Learn more about possible rejection reasons.'
        },
        {
          id: 'schedule1',
          initialText: 'Creating campaign schedule',
          completedText: 'Campaign schedule has been created',
          status: 'pending',
          errorText: 'Campaign schedule could not be created'
        }
      ]
    },
    {
      id: 'campaign2',
      name: 'High Value Customer Campaign',
      status: 'pending',
      steps: [
        {
          id: 'segment2',
          initialText: 'Setting up segment',
          completedText: 'Segment has been created',
          status: 'pending'
        },
        {
          id: 'template2',
          initialText: 'Reviewing template',
          completedText: 'Template has been approved',
          status: 'pending',
          warningText: 'Meta has approved the template in different category. Do you want to create the campaign anyway?'
        },
        {
          id: 'schedule2',
          initialText: 'Creating campaign schedule',
          completedText: 'Campaign schedule has been created',
          status: 'pending'
        },
        {
          id: 'draft2',
          initialText: 'Creating campaign draft',
          completedText: 'Campaign draft has been created',
          status: 'pending'
        }
      ]
    },
    {
      id: 'campaign3',
      name: 'Seasonal Shoppers Campaign',
      status: 'pending',
      steps: [
        {
          id: 'segment3',
          initialText: 'Setting up segment',
          completedText: 'Segment has been created',
          status: 'pending'
        },
        {
          id: 'template3',
          initialText: 'Reviewing template',
          completedText: 'Template has been approved and saved in the Template gallery',
          status: 'pending'
        },
        {
          id: 'schedule3',
          initialText: 'Creating campaign schedule',
          completedText: 'Campaign schedule has been created',
          status: 'pending'
        },
        {
          id: 'draft3',
          initialText: 'Creating campaign draft',
          completedText: 'Campaign draft has been created',
          status: 'pending'
        }
      ]
    },
    {
      id: 'campaign4',
      name: 'Loyalty Members Campaign',
      status: 'pending',
      steps: [
        {
          id: 'segment4',
          initialText: 'Setting up segment',
          completedText: 'Segment has been created',
          status: 'pending'
        },
        {
          id: 'template4',
          initialText: 'Reviewing template',
          completedText: 'Template has been approved',
          status: 'pending'
        },
        {
          id: 'schedule4',
          initialText: 'Creating campaign schedule',
          completedText: 'Campaign schedule has been created',
          status: 'pending'
        },
        {
          id: 'draft4',
          initialText: 'Creating campaign draft',
          completedText: 'Campaign draft has been created',
          status: 'pending'
        }
      ]
    }
  ]);

  const [currentCampaignIndex, setCurrentCampaignIndex] = useState(0);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  useEffect(() => {
    // Check if all campaigns are completed
    if (currentCampaignIndex >= campaigns.length) {
      onComplete?.();
      return;
    }

    const currentCampaign = campaigns[currentCampaignIndex];
    
    // Check if current campaign is completed
    if (currentStepIndex >= currentCampaign.steps.length) {
      // Mark campaign as completed and move to next campaign
      setCampaigns(prev => prev.map((campaign, index) => 
        index === currentCampaignIndex 
          ? { ...campaign, status: 'completed' }
          : campaign
      ));
      
      setTimeout(() => {
        setCurrentCampaignIndex(prev => prev + 1);
        setCurrentStepIndex(0);
      }, 500);
      return;
    }

    // Mark current campaign as active
    setCampaigns(prev => prev.map((campaign, index) => 
      index === currentCampaignIndex 
        ? { ...campaign, status: 'active' }
        : campaign
    ));

    // Start loading the current step
    setCampaigns(prev => prev.map((campaign, campaignIndex) => 
      campaignIndex === currentCampaignIndex 
        ? {
            ...campaign,
            steps: campaign.steps.map((step, stepIndex) => 
              stepIndex === currentStepIndex 
                ? { ...step, status: 'loading' }
                : step
            )
          }
        : campaign
    ));

    // After 2-3 seconds, mark step as complete/warning/error and move to next
    const timer = setTimeout(() => {
      setCampaigns(prev => prev.map((campaign, campaignIndex) => 
        campaignIndex === currentCampaignIndex 
          ? {
              ...campaign,
              steps: campaign.steps.map((step, stepIndex) => {
                if (stepIndex === currentStepIndex) {
                  // Define specific outcomes for each step
                  if (step.id === 'template1') {
                    return { ...step, status: 'error' };
                  }
                  if (step.id === 'schedule1') {
                    return { ...step, status: 'error' };
                  }
                  if (step.id === 'template2') {
                    return { ...step, status: 'warning' };
                  }
                  return { ...step, status: 'success' };
                }
                return step;
              })
            }
          : campaign
      ));

      // Move to next step after a brief delay
      setTimeout(() => {
        setCurrentStepIndex(prev => prev + 1);
      }, 300);
    }, 2500); // 2.5 seconds

    return () => clearTimeout(timer);
  }, [currentCampaignIndex, currentStepIndex, campaigns.length, onComplete]);

  const getIcon = (step: CampaignStep) => {
    switch (step.status) {
      case 'loading':
        return <Loader2 className="w-4 h-4 animate-spin text-blue-600" />;
      case 'success':
        return <Check className="w-4 h-4 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-amber-600" />;
      case 'error':
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      default:
        return <div className="w-4 h-4 rounded-full border-2 border-gray-300" />;
    }
  };

  const getText = (step: CampaignStep) => {
    if (step.status === 'error' && step.errorText) {
      return (
        <div>
          <div className="text-red-600 font-medium">Action needed!</div>
          <div dangerouslySetInnerHTML={{ 
            __html: step.errorText.replace(
              'Learn more', 
              '<a href="#" class="text-blue-600 hover:text-blue-800 underline">Learn more</a>'
            ) 
          }} />
        </div>
      );
    }
    if (step.status === 'warning' && step.warningText) {
      return (
        <div>
          <div className="text-amber-600 font-medium">Action needed!</div>
          <div>{step.warningText}</div>
        </div>
      );
    }
    if (step.status === 'success') {
      return step.completedText;
    }
    return step.initialText;
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-[#17173A] dark:text-white leading-normal font-['Manrope'] mb-4">
        Great! I'm setting up the respective campaigns, which will be visible on the product within the next 30 minutes. Feel free to take a stroll while I get things ready!
      </p>
      
      <div className="space-y-6">
        {campaigns.map((campaign, campaignIndex) => (
          <div key={campaign.id} className="space-y-3">
            {/* Campaign Header - Always show */}
            <div className="text-sm font-medium text-[#17173A] dark:text-white leading-normal font-['Manrope']">
              Creating campaign {campaignIndex + 1} ({campaign.name})
            </div>
            
            {/* Campaign Steps - Always show */}
            <div className="space-y-2 ml-4">
              {campaign.steps.map((step, stepIndex) => (
                <div key={step.id} className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    {getIcon(step)}
                  </div>
                  <div className="flex-1">
                    <div className={cn(
                      "text-sm leading-normal font-['Manrope']",
                      "text-[#17173A] dark:text-white"
                    )}>
                      {getText(step)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 