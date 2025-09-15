'use client'; // Add use client directive

import React, { useState, useRef, useEffect, useCallback } from 'react'; // Added useState, useRef, useEffect, useCallback
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'; // Added AvatarImage
import { Button } from '@/components/ui/button'; // Corrected path
import { Input } from '@/components/ui/input'; // Corrected path
import { ThemeToggle, useTheme } from '../../components/theme-provider'; // Corrected import and member
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'; // Corrected path
import { cn } from '@/lib/utils'; // Corrected path
import {
  Bookmark,
  Expand,
  Filter,
  Maximize,
  Plus,
  SendHorizontal,
  X,
} from 'lucide-react';
import ChatMessage from '../components/ChatMessage'; // Import ChatMessage
import { marketingAgents, MarketingAgent } from '../data/agents'; // Import marketingAgents

// Define ChatMessageData interface (can be moved to a types file later)
interface ChatMessageData {
  type: 'system' | 'chat';
  content: string;
  agentName?: string;
  systemType?: 'join' | 'leave';
  isAI?: boolean;
  agentIcon?: React.ElementType;
  agentColorClass?: string;
  avatarIcon?: React.ElementType; // For ChatMessage component if it uses this
  avatarBgClass?: string; // For ChatMessage component
  isSchedulerAccordion?: boolean;
  onAnimationComplete?: () => void;
}

// Static suggestions data remains the same
const suggestions = [
  "Help me create a campaign for valentine\'s day",
  'Find the top 5 and bottom 5 campaigns in the last 30 days. Show success rates and patterns behind high and low performance.',
  'Tell me the best time slots to send campaigns on APN, WPN, Email, SMS, and WhatsApp for higher engagement.',
];

export default function Home() {
  // Use the hook to manage theme
  const { toggleTheme, resolvedTheme } = useTheme();

  // Messages state
  const [messages, setMessages] = useState<ChatMessageData[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null); // Added for consistency if needed for scrolling

  // Mock chat states
  const [isMockAgentChatActive, setIsMockAgentChatActive] = useState(false);
  const mockMessageTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMockAgentChatActiveRef = useRef(isMockAgentChatActive);
  const [inputValue, setInputValue] = useState(''); // For the actual input field

  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const chatWindowRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef({ initialMouseX: 0, initialMouseY: 0, initialWindowX: 0, initialWindowY: 0 });

  useEffect(() => {
    console.log("Position state updated:", position);
  }, [position]);

  useEffect(() => {
    console.log("isDragging state updated:", isDragging);
  }, [isDragging]);

  useEffect(() => {
    isMockAgentChatActiveRef.current = isMockAgentChatActive;
  }, [isMockAgentChatActive]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const stopMockConversation = () => {
    setIsMockAgentChatActive(false);
    if (mockMessageTimeoutRef.current) {
      clearTimeout(mockMessageTimeoutRef.current);
      mockMessageTimeoutRef.current = null;
    }
  };

  // Adapted mockMessagesDefinition from ChatInterface.tsx
  const mockMessagesDefinition: (Omit<ChatMessageData, 'onAnimationComplete'> & { agentId?: string })[] = [
    { agentId: 'co-marketer', type: 'chat', isAI: true, agentName: marketingAgents.find(a=>a.id === 'co-marketer')?.name, content: "I'll loop in the team to get this campaign rolling.", avatarIcon: marketingAgents.find(a=>a.id === 'co-marketer')?.icon, avatarBgClass: marketingAgents.find(a=>a.id === 'co-marketer')?.colorClass },
    { agentId: 'co-marketer', type: 'chat', isAI: true, agentName: marketingAgents.find(a=>a.id === 'co-marketer')?.name, content: "This looks like a good project. <strong>Segment specialist</strong>, can you help identify the best audience segments for this campaign?", avatarIcon: marketingAgents.find(a=>a.id === 'co-marketer')?.icon, avatarBgClass: marketingAgents.find(a=>a.id === 'co-marketer')?.colorClass },
    { agentId: 'segment-agent', type: 'chat', isAI: true, agentName: marketingAgents.find(a=>a.id === 'segment-agent')?.name, content: "<strong>Affinity_based_segment:</strong> Users who have demonstrated interest in similar product categories based on browsing and purchase history, indicating a higher likelihood of conversion.\n\n<strong>High_AOV_segment:</strong> Customers with above-average order values who tend to purchase premium products and respond well to exclusive offers.\n\n<strong>Seasonal_buyers:</strong> Customers who primarily shop during specific seasons or holidays, with Valentine's Day being a significant purchasing period.\n\n<strong>Loyalty_program_members:</strong> Members of our rewards program who engage frequently with our communications and have accumulated points.", avatarIcon: marketingAgents.find(a=>a.id === 'segment-agent')?.icon, avatarBgClass: marketingAgents.find(a=>a.id === 'segment-agent')?.colorClass },
    { agentId: 'content-agent', type: 'chat', isAI: true, agentName: marketingAgents.find(a=>a.id === 'content-agent')?.name, content: "I've created some subject lines for each segment:\n\n<strong>High-Intent Male Gifters</strong> – \"The Perfect Gift, Just a Click Away! 🎯\"\n\n<strong>High-Intent Female Gifters</strong> – \"Gift with Love—Handpicked Just for You! 💕\"", avatarIcon: marketingAgents.find(a=>a.id === 'content-agent')?.icon, avatarBgClass: marketingAgents.find(a=>a.id === 'content-agent')?.colorClass },
    { agentId: 'scheduler-agent', type: 'chat', isAI: true, agentName: marketingAgents.find(a=>a.id === 'scheduler-agent')?.name, content: 'Scheduler agent response', avatarIcon: marketingAgents.find(a=>a.id === 'scheduler-agent')?.icon, avatarBgClass: marketingAgents.find(a=>a.id === 'scheduler-agent')?.colorClass, isSchedulerAccordion: true },
    { agentId: 'co-marketer', type: 'chat', isAI: true, agentName: marketingAgents.find(a=>a.id === 'co-marketer')?.name, content: "Here's a summary of what our team has put together:\n\n1. We've identified <strong>4 high-performing target segments</strong> for your Valentine's campaign\n2. <strong>Custom subject lines</strong> have been created for each segment to maximize engagement\n3. A <strong>strategic send schedule</strong> has been designed to optimize open rates\n4. All components are ready for your review\n\nWould you like to make any adjustments before we proceed to implementation?", avatarIcon: marketingAgents.find(a=>a.id === 'co-marketer')?.icon, avatarBgClass: marketingAgents.find(a=>a.id === 'co-marketer')?.colorClass }
  ];

  const addNextMockMessage = (index: number) => {
    if (!isMockAgentChatActiveRef.current) {
      if (mockMessageTimeoutRef.current) clearTimeout(mockMessageTimeoutRef.current);
      mockMessageTimeoutRef.current = null;
      return;
    }
    if (index >= mockMessagesDefinition.length) {
      setIsMockAgentChatActive(false);
      if (mockMessageTimeoutRef.current) clearTimeout(mockMessageTimeoutRef.current);
      mockMessageTimeoutRef.current = null;
      return;
    }

    const currentMessageDef = mockMessagesDefinition[index];
    const agent = marketingAgents.find(a => a.id === currentMessageDef.agentId);

    // Simplified: Does not dispatch 'agentStatusChange' events or handle enabling agents visually here
    // This Home component's mock flow is self-contained for message display.

    const messageWithCallback: ChatMessageData = {
      type: currentMessageDef.type,
      content: currentMessageDef.content,
      isAI: currentMessageDef.isAI,
      agentName: agent?.name || currentMessageDef.agentName,
      avatarIcon: agent?.icon || currentMessageDef.avatarIcon,
      avatarBgClass: agent?.colorClass || currentMessageDef.avatarBgClass,
      isSchedulerAccordion: currentMessageDef.isSchedulerAccordion,
      onAnimationComplete: () => {
        if (mockMessageTimeoutRef.current) clearTimeout(mockMessageTimeoutRef.current);
        mockMessageTimeoutRef.current = setTimeout(() => {
          addNextMockMessage(index + 1);
        }, 500);
      }
    };
    setMessages(prev => [...prev, messageWithCallback]);
  };

  const handleSendMessage = (messageText: string) => {
    const userMessage: ChatMessageData = {
      type: 'chat',
      content: messageText,
      isAI: false,
      onAnimationComplete: () => {}
    };
    setMessages(prev => [...prev, userMessage]);
    setInputValue(''); // Clear input field

    const lowerCaseMessage = messageText.toLowerCase().trim();
    // Check if this is the first user message. If messages array was empty, this new one is the first.
    const isFirstUserMessage = messages.filter(m => !m.isAI && m.type === 'chat').length === 0;


    if (isFirstUserMessage && (lowerCaseMessage === "hi" || lowerCaseMessage === "help me create a campaign for valentine\'s day")) {
      setIsMockAgentChatActive(true);
      isMockAgentChatActiveRef.current = true;
      if (mockMessageTimeoutRef.current) clearTimeout(mockMessageTimeoutRef.current);
      mockMessageTimeoutRef.current = setTimeout(() => {
        addNextMockMessage(0);
      }, 1000);
    } else if (isMockAgentChatActiveRef.current) {
      stopMockConversation();
      // Optionally add a default AI response if mock chat is interrupted by other user input
      // For now, just stops the mock flow.
    } else {
      // Handle other messages (not "hi" or valentine's prompt on first go, and not interrupting mock flow)
      // For now, no default AI response for other inputs in this simplified Home component
    }
  };
  
  const handleSuggestionClick = (suggestionText: string) => {
    // Directly call handleSendMessage which now contains the logic
    // to add to messages and trigger mock flow.
    handleSendMessage(suggestionText);
  };

  const handleMouseDown = useCallback((event: React.MouseEvent<HTMLElement>) => {
    console.log("handleMouseDown triggered"); 
    if (!chatWindowRef.current) {
      console.log("chatWindowRef.current is null in handleMouseDown"); 
      return;
    }
    console.log("chatWindowRef.current:", chatWindowRef.current); 
    event.preventDefault();
    setIsDragging(true);

    const currentPosition = position ?? (() => {
      const rect = chatWindowRef.current!.getBoundingClientRect();
      console.log("Initial rect in handleMouseDown:", rect); 
      return { x: rect.left, y: rect.top };
    })();
    console.log("currentPosition in handleMouseDown:", currentPosition); 
    console.log("Event clientX/Y in handleMouseDown:", event.clientX, event.clientY); 

    dragStartRef.current = {
      initialMouseX: event.clientX,
      initialMouseY: event.clientY,
      initialWindowX: currentPosition.x,
      initialWindowY: currentPosition.y,
    };
    
    if (!position) {
      setPosition(currentPosition);
    }

    document.body.style.userSelect = 'none';
  }, [position]);

  const handleMouseMove = useCallback((event: MouseEvent) => {
    console.log("handleMouseMove triggered"); 
    if (!isDragging || !chatWindowRef.current) {
      console.log("handleMouseMove: not dragging or ref is null", isDragging, chatWindowRef.current); 
      return;
    }

    const deltaX = event.clientX - dragStartRef.current.initialMouseX;
    const deltaY = event.clientY - dragStartRef.current.initialMouseY;

    let newX = dragStartRef.current.initialWindowX + deltaX;
    let newY = dragStartRef.current.initialWindowY + deltaY;
    console.log("MouseMove deltas:", { deltaX, deltaY }, "New raw X/Y:", { newX, newY }); 

    const windowWidth = chatWindowRef.current.offsetWidth;
    const windowHeight = chatWindowRef.current.offsetHeight;

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    newX = Math.max(0, Math.min(newX, viewportWidth - windowWidth));
    newY = Math.max(0, Math.min(newY, viewportHeight - windowHeight));
    console.log("MouseMove setting position to:", { x: newX, y: newY }); 

    setPosition({ x: newX, y: newY });
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    console.log("handleMouseUp triggered"); 
    if (isDragging) {
      setIsDragging(false);
      document.body.style.userSelect = '';
    }
  }, [isDragging]);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    } else {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = '';
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  return (
    // Use background color from theme, remove dark: variants for gradient
    <main className={cn(
        "flex min-h-screen p-4 bg-gradient-to-br from-indigo-50 via-white to-cyan-100 dark:from-gray-900 dark:via-background dark:to-slate-900",
        !position && "items-center justify-center" // Only center if not positioned by drag
      )}>
      {/* Main Chat Window: Use theme background and shadow */}
      <div 
        ref={chatWindowRef}
        className={cn(
          "flex flex-col overflow-hidden rounded-xl bg-background shadow-2xl",
          "h-[776px] w-[470px]", // Fixed dimensions
           // 'relative' is kept for internal absolutely positioned decorative elements
           // It does not interfere with 'fixed' positioning for dragging
          "relative" 
        )}
        style={position ? {
          position: 'fixed',
          top: `${position.y}px`,
          left: `${position.x}px`,
          width: '470px', 
          height: '776px',
        } : {
          // When position is null, it will be centered by the parent 'main' if its flex properties are active
          // or remain in the normal flow if the parent's centering is conditionally disabled.
          // The 'relative' class is primarily for the ::before/::after pseudo-elements or internal absolute elements.
        }}
      >
        {/* Background decorative shapes: Adjusted dark mode colors */}
        <div className="absolute -right-20 -top-20 z-0 h-96 w-96 rotate-[-22deg] rounded-[80px] bg-gradient-to-br from-indigo-50 to-transparent opacity-50 dark:from-muted/10 dark:to-transparent" />
        <div className="absolute right-0 top-[-10px] z-0 h-72 w-72 rotate-[-22deg] rounded-[34px] bg-gradient-to-br from-cyan-50 to-transparent opacity-50 dark:from-accent/5 dark:to-transparent" />

        {/* Header: Use theme colors and shadow */}
        <header 
          className={cn(
            "relative z-10 flex h-[66px] items-center justify-between rounded-t-xl border-b bg-background/80 p-4 shadow-header backdrop-blur-sm dark:bg-popover/80",
            isDragging ? "cursor-grabbing" : "cursor-grab" // Dynamic cursor
          )}
          onMouseDown={() => { console.log("Header element clicked (simple test)"); }}
        >
          {/* Left Side: Use theme text colors */}
          <div className="flex flex-col">
            <div className="flex items-center gap-3">
              <h1 className="text-sm font-bold text-foreground">Co-marketer</h1>
              <span className="flex items-center gap-1 rounded bg-accent/10 px-1.5 py-0.5 text-[10px] font-bold text-accent dark:bg-accent/20 dark:text-accent">
                <Maximize className="h-2 w-2" strokeWidth={3} /> Option + C / Alt
                + C
              </span>
            </div>
            <span className="text-[10px] text-foreground-muted">
              Drag to reposition this window
            </span>
          </div>

          {/* Right Side: Use theme text/icon colors, add ThemeToggle */}
          <div className="flex items-center space-x-1 text-foreground/80">
            <TooltipProvider delayDuration={100}>
              <ThemeToggle />
              <div className="mx-1 h-5 w-px bg-border" /> {/* Divider */} 
              <Tooltip>
                <TooltipTrigger asChild>
                   {/* Use theme colors for button hover/text */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-foreground/60 hover:bg-muted/50 hover:text-foreground/80"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>New Chat</TooltipContent>
              </Tooltip>
              <div className="mx-1 h-5 w-px bg-border" /> {/* Divider */} 
              <Tooltip>
                <TooltipTrigger asChild>
                   {/* Use theme colors for button hover/text */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-foreground/60 hover:bg-muted/50 hover:text-foreground/80"
                  >
                    <Bookmark className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Bookmarks</TooltipContent>
              </Tooltip>
              <div className="mx-1 h-5 w-px bg-border" /> {/* Divider */} 
              <Tooltip>
                <TooltipTrigger asChild>
                    {/* Use theme colors for button hover/text */} 
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-foreground/60 hover:bg-muted/50 hover:text-foreground/80"
                  >
                    <Expand className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Expand</TooltipContent>
              </Tooltip>
            </TooltipProvider>
             {/* Close Button: Use theme colors */} 
             <Button
              variant="ghost"
              size="icon"
              className="ml-2 h-7 w-7 text-foreground/60 hover:bg-muted/50 hover:text-foreground/80"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </header>

        {/* Chat Content Area: Use theme scrollbar colors */}
        <div ref={chatContainerRef} className="flex flex-1 flex-col overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
          {messages.length === 0 ? (
            // Initial Suggestions view
            <div className="mb-auto flex flex-col items-start gap-4 pt-4">
              <div className="flex items-start gap-3">
                <Avatar className="h-8 w-8 rounded bg-avatar-bg">
                   {/* Using AvatarImage for GIF if available, or fallback */}
                  <AvatarImage src="/avatarGIF.gif" alt="AI Assistant" />
                  <AvatarFallback className="text-xs font-semibold text-muted-foreground">
                    AI
                  </AvatarFallback>
                </Avatar>
                <div className="mt-1 rounded-lg bg-card p-3 text-xs text-card-foreground">
                  Hello, try these suggestions or just type in a few key words to
                  get started!
                </div>
              </div>
              <div className="ml-11 flex w-full max-w-[396px] flex-col gap-4">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(suggestion)} // Wire button to handleSuggestionClick
                    className={cn(
                      'rounded-md bg-card p-4 text-left text-xs text-card-foreground transition-colors hover:bg-muted dark:hover:bg-input/80'
                    )}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            // Chat Messages view
            <div className="flex-1 space-y-4 py-4">
              {messages.map((message, index) => (
                <ChatMessage
                  key={index}
                  isAI={!!message.isAI}
                  content={message.content}
                  agentName={message.agentName}
                  avatarIcon={message.avatarIcon}
                  avatarBgClass={message.avatarBgClass}
                  isSchedulerAccordion={message.isSchedulerAccordion}
                  // animationSpeed={...} // Pass if needed by ChatMessage
                  onAnimationComplete={message.onAnimationComplete}
                  // messageId={...} // Pass if needed
                />
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Area: Use theme popover colors and shadow */} 
        <footer className="relative z-10 flex h-[82px] items-center justify-between rounded-b-xl border-t bg-popover p-4 shadow-footer">
          <div className="relative flex-1">
             {/* Input: Use theme input/border/ring/shadow colors */} 
            <Input
              type="text"
              placeholder="Ask anything..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey && inputValue.trim()) {
                  e.preventDefault();
                  handleSendMessage(inputValue);
                }
              }}
              className="h-10 w-full rounded-md border-input-border bg-input pl-4 pr-10 text-sm text-foreground shadow-input placeholder:text-foreground-muted focus:border-ring focus:ring-1 focus:ring-ring" // Added focus:ring-1
            />
             {/* Send Button: Use theme colors */} 
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                if (inputValue.trim()) {
                  handleSendMessage(inputValue);
                }
              }}
              className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2 text-foreground-muted hover:bg-muted/50"
            >
              <SendHorizontal className="h-4 w-4" />
            </Button>
          </div>
           {/* Filter Button: Use theme colors */} 
          <TooltipProvider delayDuration={100}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="ml-3 h-10 w-10 text-foreground-muted hover:bg-muted/50"
                >
                  <Filter className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Filter</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </footer>
      </div>
    </main>
  );
} 