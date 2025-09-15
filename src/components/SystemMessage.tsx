import React from 'react';
import { cn } from '../lib/utils';
// Remove unused UserPlus/UserMinus icons
// import { UserPlus, UserMinus } from 'lucide-react'; 

interface SystemMessageProps {
  type: 'join' | 'leave';
  agentName: string;
  agentIcon?: React.ElementType; // Add agent icon prop
  agentColorClass?: string; // Add color class prop (unused for now)
}

const SystemMessage = ({ type, agentName, agentIcon: Icon, agentColorClass }: SystemMessageProps) => { // Destructure agentIcon as Icon
  return (
    <div className="flex items-center justify-center gap-1 py-1">
      {/* Render the agent's specific icon if available */}
      {Icon ? (
        <Icon className="w-3.5 h-3.5 text-gray-400" /> // Reverted to fixed gray color
      ) : (
        // Fallback if no icon is provided (shouldn't happen with current logic)
        <span className="w-3.5 h-3.5"></span> // Placeholder or default icon
      )}
      <span className="text-xs text-gray-400">
        {agentName} {type === 'join' ? 'joined' : 'left'} the chat
      </span>
    </div>
  );
};

export default SystemMessage;
