import React, { useState, useRef, KeyboardEvent, CSSProperties, useEffect } from 'react';
import { Command, CommandGroup, CommandItem, CommandEmpty, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Send, StopCircle } from 'lucide-react';
import { marketingAgents, MarketingAgent } from '@/data/agents';
import { cn } from "@/lib/utils";

interface Agent {
  id: string;
  name: string;
}

const agents: Agent[] = [
  { id: "co-marketer", name: "Co-marketer" },
  { id: "content-agent", name: "Content Agent" },
  { id: "segment-agent", name: "Segment Agent" },
  { id: "scheduler-agent", name: "Scheduler Agent" },
  { id: "insight-agent", name: "Insight Agent" },
];

interface ChatInputProps {
  onSend?: (message: string) => void;
  isMockAgentChatActive?: boolean;
  onStopMockConversation?: () => void;
  isQuestionnaireActive?: boolean;
}

// Temporary feature flag to disable @-agent mention dropdown
const ALLOW_AGENT_MENTION = false;

const ChatInput: React.FC<ChatInputProps> = ({ onSend, isMockAgentChatActive, onStopMockConversation, isQuestionnaireActive = false }) => {
  const [inputValue, setInputValue] = useState("");
  const [showMentionList, setShowMentionList] = useState(false);
  const [cursorPosition, setCursorPosition] = useState(0);
  const [mentionSearch, setMentionSearch] = useState("");
  const [popoverStyle, setPopoverStyle] = useState<CSSProperties>({});
  const inputRef = useRef<HTMLInputElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const measurementRef = useRef<HTMLSpanElement>(null);

  const calculatePopoverPosition = (atIndex: number) => {
    if (!ALLOW_AGENT_MENTION) return {};
    if (!inputRef.current || !measurementRef.current) return {};
    const textBeforeAt = inputValue.slice(0, atIndex);
    measurementRef.current.textContent = textBeforeAt;
    const textWidth = measurementRef.current.offsetWidth;
    const inputRect = inputRef.current.getBoundingClientRect();
    const inputStyle = window.getComputedStyle(inputRef.current);
    const inputPaddingLeft = parseFloat(inputStyle.paddingLeft || '0');
    const popoverTop = inputRect.top;
    const popoverLeft = inputRect.left + inputPaddingLeft + textWidth;
    return {
      position: 'fixed',
      top: `${popoverTop}px`,
      left: `${popoverLeft}px`,
      transform: 'translateY(-100%) translateY(-8px)',
      width: '192px',
    };
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!ALLOW_AGENT_MENTION) {
      setShowMentionList(false);
      setInputValue(e.target.value);
      setCursorPosition(e.target.selectionStart || 0);
      return;
    }
    const newValue = e.target.value;
    const currentCursorPos = e.target.selectionStart || 0;
    setInputValue(newValue);
    setCursorPosition(currentCursorPos);

    const atIndex = newValue.lastIndexOf('@', currentCursorPos - 1);
    let shouldShow = false;

    if (atIndex !== -1) {
        const charAfterAt = newValue.charAt(atIndex + 1);
        const isStart = atIndex === 0;
        const isPrecededBySpace = atIndex > 0 && /\s/.test(newValue.charAt(atIndex - 1));
        const isFollowedByNonSpace = charAfterAt && !/\s/.test(charAfterAt);
        const isAtCursor = atIndex === currentCursorPos - 1;

        if (isAtCursor && (charAfterAt === '' || !/\s/.test(charAfterAt))) {
             const searchText = newValue.slice(atIndex + 1, currentCursorPos);
             if (!searchText.includes(' ')) {
                 setMentionSearch(searchText);
                 shouldShow = true;
             }
        }
    }
    
    // Disable mention list if flag is off
    const finalShow = ALLOW_AGENT_MENTION && shouldShow;
    setShowMentionList(finalShow);
  };

  const insertMention = (agent: MarketingAgent) => {
    console.log('Inserting mention:', agent.name);
    const mentionText = `@${agent.name}`;
    const beforeCursor = inputValue.slice(0, cursorPosition);
    const atSymbolIndex = beforeCursor.lastIndexOf('@');
    
    if (atSymbolIndex === -1) return;

    const textBeforeMention = inputValue.slice(0, atSymbolIndex);
    const textAfterCursor = inputValue.slice(cursorPosition);
    const spaceNeeded = textAfterCursor.length === 0 || !/^\s/.test(textAfterCursor);
    
    const newValue = `${textBeforeMention}${mentionText}${spaceNeeded ? ' ' : ''}${textAfterCursor}`;
    setInputValue(newValue);
    setShowMentionList(false);

    const newCursorPos = textBeforeMention.length + mentionText.length + (spaceNeeded ? 1 : 0);
    
    if (inputRef.current) {
      inputRef.current.focus();
      setTimeout(() => {
        inputRef.current?.setSelectionRange(newCursorPos, newCursorPos);
      }, 0);
    }
  };

  const handleClickOutside = () => {
    setShowMentionList(false);
  };

  // Filtered agents (only used if mentions are enabled)
  const agentsForMention = marketingAgents.filter(agent => agent.id !== "co-marketer");
  const filteredAgents = agentsForMention.filter(agent =>
    agent.name.toLowerCase().includes(mentionSearch.toLowerCase())
  );

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !showMentionList && inputValue.trim()) {
      e.preventDefault();
      if (onSend) {
        onSend(inputValue.trim());
      }
      setInputValue('');
    } else if (e.key === 'Escape' && showMentionList) {
      setShowMentionList(false);
    }
  };

  const handleSendClick = () => {
    if (inputValue.trim() && onSend) {
      onSend(inputValue.trim());
      setInputValue('');
      inputRef.current?.focus();
    }
  };

  const handleStopClick = () => {
    if (onStopMockConversation) {
      onStopMockConversation();
    }
  };

  const handleMentionKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp' || event.key === 'Enter') {
      return;
    }
  };

  // If mentions disabled, never render popover
  if (!ALLOW_AGENT_MENTION) {
    return (
      <div className="relative w-full">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e)=>setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your message..."
          disabled={isQuestionnaireActive}
          className={cn(
            "w-full pl-4 pr-12 py-3 rounded-md border border-[#DDE2EE] dark:border-input-border dark:bg-input focus:outline-none focus:ring-1 focus:ring-[#007BFF] dark:focus:ring-ring transition-shadow text-sm placeholder:text-[#6F6F8D] dark:placeholder:text-foreground-muted dark:text-foreground",
            isQuestionnaireActive && "cursor-not-allowed opacity-50 bg-gray-100 dark:bg-gray-800"
          )}
          autoComplete="off"
        />
        <button
          type="button"
          onClick={isMockAgentChatActive ? handleStopClick : handleSendClick}
          disabled={isQuestionnaireActive || (!isMockAgentChatActive && !inputValue.trim())}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#6F6F8D] dark:text-foreground-muted hover:text-cobalt-blue dark:hover:text-accent disabled:text-gray-300 dark:disabled:text-gray-600 disabled:cursor-not-allowed transition-colors"
          aria-label={isMockAgentChatActive ? "Stop conversation" : "Send message"}
        >
          {isMockAgentChatActive ? <StopCircle className="w-4.5 h-4.5" /> : <Send className="w-4.5 h-4.5" />}
        </button>
      </div>
    );
  }

  return (
    <div className="relative w-full">
      <span 
        ref={measurementRef} 
        aria-hidden="true" 
        style={{
          position: 'absolute',
          visibility: 'hidden',
          height: 'auto',
          width: 'auto',
          whiteSpace: 'pre',
          fontSize: inputRef.current ? window.getComputedStyle(inputRef.current).fontSize : 'inherit',
          fontFamily: inputRef.current ? window.getComputedStyle(inputRef.current).fontFamily : 'inherit',
          fontWeight: inputRef.current ? window.getComputedStyle(inputRef.current).fontWeight : 'inherit',
          fontStyle: inputRef.current ? window.getComputedStyle(inputRef.current).fontStyle : 'inherit',
          letterSpacing: inputRef.current ? window.getComputedStyle(inputRef.current).letterSpacing : 'inherit',
          textTransform: (inputRef.current ? window.getComputedStyle(inputRef.current).textTransform : 'inherit') as CSSProperties['textTransform'],
        }}
      />
      <Popover open={showMentionList} onOpenChange={setShowMentionList}>
        <PopoverTrigger asChild>
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !showMentionList && !e.shiftKey && inputValue.trim()) {
                e.preventDefault();
                handleSendClick();
              }
            }}
            placeholder="Type your message or use '@' to mention an agent..."
            disabled={isQuestionnaireActive}
            className={cn(
              "w-full pl-4 pr-12 py-3 rounded-md border border-[#DDE2EE] dark:border-input-border dark:bg-input focus:outline-none focus:ring-1 focus:ring-[#007BFF] dark:focus:ring-ring transition-shadow text-sm placeholder:text-[#6F6F8D] dark:placeholder:text-foreground-muted dark:text-foreground",
              isQuestionnaireActive && "cursor-not-allowed opacity-50 bg-gray-100 dark:bg-gray-800"
            )}
            autoComplete="off"
          />
        </PopoverTrigger>
        {showMentionList && filteredAgents.length > 0 && (
          <PopoverContent 
            className="w-48 p-0"
            side="top"
            align="start"
            alignOffset={-5}
            onEscapeKeyDown={() => setShowMentionList(false)}
            onOpenAutoFocus={(e) => e.preventDefault()}
            ref={popoverRef}
          >
            <Command>
              <CommandList>
                <CommandEmpty>No agent found.</CommandEmpty>
                <CommandGroup>
                  {filteredAgents.map((agent) => {
                    const Icon = agent.icon;
                    return (
                      <CommandItem
                        key={agent.id}
                        onSelect={() => { 
                          console.log('Selected:', agent.name);
                          insertMention(agent); 
                        }}
                        className="flex items-center gap-2 px-2 py-1.5 cursor-pointer hover:bg-accent"
                        value={agent.name}
                      >
                        <Avatar className={cn("h-5 w-5 flex items-center justify-center text-xs", (Icon && !agent.avatarSrc) ? agent.colorClass : 'bg-transparent')}>
                          {/* Priority: avatarSrc (SVG) > Icon (Lucide) > initials fallback */}
                          {agent.avatarSrc ? (
                            <>
                              <AvatarImage src={agent.avatarSrc} alt={agent.name} className="h-full w-full object-cover" />
                              <AvatarFallback>{agent.initials}</AvatarFallback>
                            </>
                          ) : Icon ? (
                            <Icon className="h-3 w-3" />
                          ) : (
                            <AvatarFallback>{agent.initials}</AvatarFallback>
                          )}
                        </Avatar>
                        <span className="text-sm">{agent.name}</span>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        )}
      </Popover>
      <button 
        type="button"
        onClick={isMockAgentChatActive ? handleStopClick : handleSendClick}
        disabled={isQuestionnaireActive || (!isMockAgentChatActive && !inputValue.trim())}
        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#6F6F8D] dark:text-foreground-muted hover:text-cobalt-blue dark:hover:text-accent disabled:text-gray-300 dark:disabled:text-gray-600 disabled:cursor-not-allowed transition-colors"
        aria-label={isMockAgentChatActive ? "Stop conversation" : "Send message"}
      >
        {isMockAgentChatActive ? <StopCircle className="w-4.5 h-4.5" /> : <Send className="w-4.5 h-4.5" />}
      </button>
    </div>
  );
};

export default ChatInput;
