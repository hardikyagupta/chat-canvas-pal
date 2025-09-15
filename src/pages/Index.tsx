import React, { useState } from "react";
import ChatInterface from "@/components/ChatInterface";
import MarketingAgentsOverlay from "@/components/MarketingAgentsOverlay";
import { MarketingAgent, marketingAgents } from "@/data/agents";

const Index = () => {
  const [isAgentsOverlayOpen, setIsAgentsOverlayOpen] = React.useState(false);
  const [enabledAgents, setEnabledAgents] = useState<Set<string>>(new Set());

  const handleToggleAgent = (agentId: string, agentName: string) => {
    const agent = marketingAgents.find(a => a.id === agentId);
    if (!agent) return;

    setEnabledAgents(prev => {
      const newSet = new Set(prev);
      const isJoining = !newSet.has(agentId);
      let status: 'join' | 'leave';

      if (isJoining) {
        newSet.add(agentId);
        status = 'join';
      } else {
        newSet.delete(agentId);
        status = 'leave';
      }

      window.dispatchEvent(
        new CustomEvent('agentStatusChange', {
          detail: { 
            name: agentName, 
            status: status, 
            icon: agent.icon,
            colorClass: agent.colorClass
          }
        })
      );

      return newSet;
    });
  };

  return <div className="min-h-screen bg-transparent flex items-start justify-center p-4 gap-[8px]">
      <MarketingAgentsOverlay isOpen={isAgentsOverlayOpen} onOpenChange={setIsAgentsOverlayOpen} enabledAgents={enabledAgents} onToggleAgent={handleToggleAgent} />
      <ChatInterface 
        onBotIconClick={() => setIsAgentsOverlayOpen(true)} 
        enabledAgents={enabledAgents} 
        setEnabledAgents={setEnabledAgents}
      />
    </div>;
};
export default Index;