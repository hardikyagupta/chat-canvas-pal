import React from 'react';
import { Switch } from "@/components/ui/switch";
import { X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { marketingAgents, MarketingAgent } from '@/data/agents';
import { cn } from '@/lib/utils';
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface Props {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  enabledAgents: Set<string>;
  onToggleAgent: (agentId: string, agentName: string) => void;
}

const MarketingAgentsOverlay: React.FC<Props> = ({ 
  isOpen, 
  onOpenChange, 
  enabledAgents, 
  onToggleAgent 
}) => {
  const { toast } = useToast();

  if (!isOpen) return null;

  const renderAgentCard = (agent: MarketingAgent) => {
    const Icon = agent.icon;
    return (
      <div className="group flex items-start gap-4 p-4 rounded-lg border border-[#E7E7E8] transition-colors transition-shadow duration-200 hover:shadow-md bg-white">
        {/* Priority: avatarSrc (SVG) > Icon (Lucide) > GIF fallback */}
        {agent.avatarSrc ? (
          <div className="flex items-center justify-center w-10 h-10">
            <Avatar className="h-full w-full rounded-lg">
              <AvatarImage src={agent.avatarSrc} alt={agent.name} className="object-cover" />
              <AvatarFallback>{agent.initials}</AvatarFallback>
            </Avatar>
          </div>
        ) : Icon ? (
          <div className={cn(
            "p-2 rounded-lg flex items-center justify-center w-10 h-10",
            agent.colorClass
            )}
          >
            <Icon className="w-5 h-5 transition-transform duration-200 group-hover:scale-110" />
          </div>
        ) : (
          <div className="flex items-center justify-center w-10 h-10">
            <Avatar className="h-full w-full rounded-lg">
              <AvatarImage src="/avatarGIF.gif" alt={agent.name} className="object-cover" />
              <AvatarFallback>{agent.initials}</AvatarFallback>
            </Avatar>
          </div>
        )}
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-[#051C2C] cursor-default select-none">{agent.name}</h3>
            {agent.id === "co-marketer" ? (
              <>
                {/* Switch for Co-marketer intentionally removed as per request */}
              </>
            ) : (
              <Switch
                checked={enabledAgents.has(agent.id)}
                onCheckedChange={() => onToggleAgent(agent.id, agent.name)}
                aria-label={`Toggle ${agent.name}`}
              />
            )}
          </div>
          <p className="text-sm text-[#6B7280] mt-1 cursor-default select-none">{agent.description}</p>
        </div>
      </div>
    );
  };

  return (
    <div className="w-[400px] bg-white rounded-lg shadow-lg overflow-hidden h-[776px] border border-[#E7E7E8]">
      <div className="p-4 border-b border-[#E7E7E8]">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold text-[#051C2C]">Marketing agents</h2>
          <button 
            onClick={() => onOpenChange(false)}
            className="p-1.5 hover:bg-[#F6F7F9] rounded-md"
          >
            <X className="w-4 h-4 text-[#6B7280]" />
          </button>
        </div>
      </div>
      <div className="p-4 space-y-4 overflow-y-auto max-h-[calc(100vh-80px)]">
        {marketingAgents.map((agent) => (
          <div key={agent.id}>
            {renderAgentCard(agent)}
          </div>
        ))}
      </div>
    </div>
  );
};

export default MarketingAgentsOverlay;
