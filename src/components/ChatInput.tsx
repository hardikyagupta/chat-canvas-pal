import React, { useState, useRef, KeyboardEvent, CSSProperties, useEffect } from 'react';
import { Command, CommandGroup, CommandItem, CommandEmpty, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ArrowUp, StopCircle, X } from 'lucide-react';
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
  selectedContextChip?: string | null;
  onClearSelectedContextChip?: () => void;
  /** Drives the input shimmer (set by parent on every send / while generating). */
  shimmer?: boolean;
}

// Temporary feature flag to disable @-agent mention dropdown
const ALLOW_AGENT_MENTION = false;

const ChatInput: React.FC<ChatInputProps> = ({
  onSend,
  isMockAgentChatActive,
  onStopMockConversation,
  isQuestionnaireActive = false,
  selectedContextChip = null,
  onClearSelectedContextChip,
  shimmer = false,
}) => {
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
    const hasText = inputValue.trim().length > 0;
    // Button is active (blue) by default; while output is generating (input shimmering)
    // it switches to the disabled/grey state with the Figma square icon.
    const isLoading = !!isMockAgentChatActive || shimmer;
    const isActive = !isLoading;
    return (
      <div className="relative w-full">
        {/* Outer container — height grows smoothly when chip appears */}
        <div
          className={cn(
            "relative overflow-hidden w-full rounded-[16px] border-[0.5px] border-[#DDE2EE] p-[12px]",
            "drop-shadow-[0px_1px_1px_rgba(16,24,40,0.05)]",
            "focus-within:ring-1 focus-within:ring-[#0056F8] transition-shadow",
            // Disabled (questionnaire) OR generating: greyish fill + not-allowed across the field
            (isQuestionnaireActive || isLoading) ? "bg-[#F2F4F7] cursor-not-allowed" : "bg-white"
          )}
        >
          {/* Shimmer layers — active while a response is being generated (mock
              flow) and briefly after every send. Inner sheen sweeps inside,
              border ring shimmers around the edge. */}
          {(isMockAgentChatActive || shimmer) && (
            <>
              <span aria-hidden="true" className="input-inner-shimmer" />
              <span aria-hidden="true" className="input-border-shimmer" />
            </>
          )}
          {/* Single flex row: lhs-area + rhs-area.
              Center-aligned in zero state; bottom-aligned when chip expands it. */}
          <div className={cn("relative z-10 flex gap-[8px]", selectedContextChip ? "items-end" : "items-center")}>
            {/* lhs-area: input on top, chip below (gap-[24px]) */}
            <div className="flex-1 min-w-0 flex flex-col">
              {/* Placeholder / input row */}
              <div className="flex items-center">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask Co-marketer..."
                  disabled={isQuestionnaireActive || isLoading}
                  className="flex-1 min-w-0 bg-transparent border-0 p-0 font-medium text-[14px] leading-[22px] text-foreground placeholder:text-[#6F6F8D] focus:outline-none disabled:cursor-not-allowed"
                  style={{ fontFamily: "Manrope, sans-serif" }}
                  autoComplete="off"
                />
              </div>

              {/* Context chip — animates in/out using grid-rows trick */}
              <div
                className="grid transition-[grid-template-rows,margin-top] duration-200 ease-in-out"
                style={{ gridTemplateRows: selectedContextChip ? '1fr' : '0fr', marginTop: selectedContextChip ? '24px' : '0px' }}
              >
                <div className="overflow-hidden min-h-0">
                  {selectedContextChip && (
                    <button
                      type="button"
                      onClick={onClearSelectedContextChip}
                      className="inline-flex items-center gap-[4px] bg-[#F9FAFB] border border-[#2F68E5] rounded-[4px] px-[6px] py-[4px] shadow-[0px_0px_0px_2px_rgba(10,143,253,0.1)] whitespace-nowrap transition-opacity duration-200"
                    >
                      <span
                        className="text-[12px] leading-[16px] text-[#2F68E5] tracking-[0.42px]"
                        style={{ fontFamily: "Manrope, sans-serif", fontWeight: 400 }}
                      >
                        {selectedContextChip}
                      </span>
                      <X className="w-[12px] h-[12px] text-[#6F6F8D] shrink-0" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* rhs-area: send button (alignment handled by parent row) */}
            <div className="flex shrink-0">
              <button
                type="button"
                onClick={handleSendClick}
                disabled={isQuestionnaireActive || isLoading}
                className={cn(
                  "relative flex items-center justify-center overflow-hidden rounded-[30px] p-[8px] transition-all duration-200",
                  isActive
                    ? "border-[0.75px] border-[#0043C1] shadow-[0px_1px_0px_0px_rgba(0,0,0,0.02)]"
                    : "border-0",
                  isQuestionnaireActive && "opacity-50 cursor-not-allowed"
                )}
                style={{
                  background: isActive
                    ? "linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.24) 100%), linear-gradient(90deg, rgb(0,86,248) 0%, rgb(0,86,248) 100%)"
                    : "linear-gradient(90deg, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0.08) 100%), linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.24) 100%)",
                }}
                aria-label={isLoading ? "Generating response" : "Send message"}
              >
                {/* Inner highlight for active state */}
                {isActive && (
                  <span
                    className="absolute inset-0 rounded-[30px] pointer-events-none"
                    style={{ boxShadow: "inset 0px 1px 1px 0px rgba(255,255,255,0.25)" }}
                  />
                )}
                {isLoading ? (
                  /* Loading/disabled state — grey rounded square per Figma (node 16318:13144) */
                  <span className="block w-3 h-3 rounded-[4px] bg-[#6F6F8D] relative z-10" />
                ) : (
                  <ArrowUp className="w-4 h-4 text-white relative z-10" />
                )}
              </button>
            </div>
          </div>
        </div>
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
              "w-full h-[56px] pl-4 pr-0 pt-3 pb-3 rounded-lg border border-[#DDE2EE] dark:border-input-border dark:bg-input focus:outline-none focus:ring-1 focus:ring-[#007BFF] dark:focus:ring-ring transition-shadow text-sm placeholder:text-[#6F6F8D] dark:placeholder:text-foreground-muted dark:text-foreground shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)]",
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
        className={cn(
          "absolute right-3 top-1/2 -translate-y-1/2 rounded-lg w-8 h-8 flex items-center justify-center transition-colors",
          isMockAgentChatActive 
            ? "text-[#6F6F8D] dark:text-foreground-muted hover:text-cobalt-blue dark:hover:text-accent" 
            : inputValue.trim() 
              ? "bg-[#002D72] text-white hover:bg-[#001f4d]" 
              : "bg-gray-200 text-gray-400 cursor-not-allowed",
          isQuestionnaireActive && "opacity-50 cursor-not-allowed"
        )}
        aria-label={isMockAgentChatActive ? "Stop conversation" : "Send message"}
      >
        {isMockAgentChatActive ? <StopCircle className="w-4 h-4" /> : <ArrowUp className="w-4 h-4" />}
      </button>
    </div>
  );
};

export default ChatInput;
