import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from "@/components/ui/tooltip";
import { MarketingAgent } from '@/data/agents';
import { cn } from '@/lib/utils'; // Import cn for conditional classes

interface AvatarStackProps {
  agents: MarketingAgent[];
  maxVisible?: number;
}

const AvatarStack: React.FC<AvatarStackProps> = ({ agents, maxVisible = 3 }) => {
  if (agents.length === 0) {
    return null; // Don't render anything if no agents are active
  }

  const visibleAgents = agents.slice(0, maxVisible);
  const hiddenCount = agents.length - visibleAgents.length;
  const tooltipContent = agents.map(agent => agent.name).join(', ');

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center -space-x-2 cursor-pointer">
            {visibleAgents.map((agent, index) => {
              // Destructure icon for easier use
              const Icon = agent.icon;
              return (
                <Avatar 
                  key={agent.id} 
                  // Apply color class and base styles
                  className={cn(
                    "h-6 w-6 border-2 border-background flex items-center justify-center",
                    // Only apply agent.colorClass if Icon exists and no avatarSrc, otherwise transparent or default
                    (Icon && !agent.avatarSrc) ? agent.colorClass : 'bg-transparent' 
                  )}
                  style={{ zIndex: maxVisible - index }}
                >
                  {/* Priority: avatarSrc (SVG) > Icon (Lucide) > GIF fallback */}
                  {agent.avatarSrc ? (
                    <>
                      <AvatarImage src={agent.avatarSrc} alt={agent.name} className="h-full w-full object-cover" />
                      <AvatarFallback>{agent.initials}</AvatarFallback>
                    </>
                  ) : Icon ? (
                    <Icon className="h-3.5 w-3.5" /> 
                  ) : (
                    // Fallback for agents without avatarSrc or icon
                    <>
                      <AvatarImage src="/avatarGIF.gif" alt={agent.name} className="h-full w-full object-cover" />
                      <AvatarFallback>{agent.initials}</AvatarFallback>
                    </>
                  )}
                </Avatar>
              );
            })}
            {hiddenCount > 0 && (
              <Avatar 
                className="h-6 w-6 border-2 border-background"
                style={{ zIndex: 0 }} 
              >
                {/* Keep fallback for the +N count */}
                <AvatarFallback className="text-xs bg-surface-2 text-muted-foreground">
                  +{hiddenCount}
                </AvatarFallback>
              </Avatar>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent className="z-[100]">
          <p>{tooltipContent}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default AvatarStack; 