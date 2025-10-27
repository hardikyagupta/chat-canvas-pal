import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
// Lucide icons for various UI elements
import { MoreHorizontal, Maximize2, Plus, X, Bot, Minimize2, Bookmark, PlusCircle, PanelLeftOpen, PanelLeftClose, Settings2, MessageSquare, Users, Trash2, Info, ChevronDown, StopCircle, Zap, MoreVertical } from 'lucide-react';
import { Card } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import SystemMessage from './SystemMessage';
import ChatInput from './ChatInput';
import ChatMessage from './ChatMessage';
import { MarketingAgent, marketingAgents } from '@/data/agents';
import AvatarStack from './AvatarStack';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '../../components/theme-provider';
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ModeSwitchConfirmation } from './ModeSwitchConfirmation';
import { ContentAgentSegmentAccordions } from './ContentAgentSegmentAccordions';


// Interface for individual chat message data
interface ChatMessageData {
  type: 'system' | 'chat';
  isAI?: boolean;
  content: string;
  agentName?: string;
  agentId?: string;
  avatarSrc?: string;
  avatarIcon?: React.ElementType;
  avatarBgClass?: string;
  animate?: boolean;
  animationSpeed?: number;
  onAnimationComplete?: () => void;
  // System message specific
  systemType?: 'join' | 'leave';
  agentIcon?: React.ElementType;
  agentColorClass?: string;
  // Chat message specific
  showExecuteFlowCTA?: boolean;
  onExecuteFlow?: () => void;
  isContentAgent?: boolean;
  isContentAgentClarification?: boolean;
  isContentAgentQuestionChoice?: boolean;
  onAnswerQuestions?: () => void;
  onSkipAndGenerate?: () => void;
  onGenerateContent?: () => void;
  showApproveContentCTA?: boolean;
  onApproveContent?: () => void;
  isFlowExecutionProgress?: boolean;
  onFlowExecutionComplete?: () => void;
  waitForUserInput?: boolean;
  isPlanMode?: boolean;
  isSegmentAccordion?: boolean;
  isSchedulerAccordion?: boolean;
  isSegmentAgentRationale?: boolean;
  isContentAgentRationale?: boolean;
  isExecutiveSummaryWithContent?: boolean;
  onContinueSegment?: () => void;
  onRefineThis?: () => void;
  updatedContent?: any; // New field to store updated content
}

// Props for the main ChatInterface component
interface ChatInterfaceProps {
  onBotIconClick?: () => void; // Handler for agent selection overlay toggle in widget view
  enabledAgents: Set<string>;
  setEnabledAgents: React.Dispatch<React.SetStateAction<Set<string>>>;
  onCloseInterface?: () => void; // Handler to close the entire chat interface
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ onBotIconClick, enabledAgents, setEnabledAgents, onCloseInterface }) => {
  const [messages, setMessages] = useState<ChatMessageData[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [isMockAgentChatActive, setIsMockAgentChatActive] = useState(false);
  const [mockChatCompleted, setMockChatCompleted] = useState(false); // New state
  const [contentApproved, setContentApproved] = useState(false); // New state for content approval
  const [segmentsApproved, setSegmentsApproved] = useState(false); // New state for segments approval
  const [contentGenerated, setContentGenerated] = useState(false); // New state for content generation
  const mockMessageTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMockAgentChatActiveRef = useRef(isMockAgentChatActive);
  const [selectedMode, setSelectedMode] = useState<'collaborative' | 'autonomous'>('collaborative'); // Added state for mode
  const [autonomousWaitingForInput, setAutonomousWaitingForInput] = useState(false); // State to track if autonomous mode is waiting for user input
  const [showModeSwitchConfirmation, setShowModeSwitchConfirmation] = useState(false); // State for mode switch confirmation popup
  const [pendingMode, setPendingMode] = useState<'collaborative' | 'autonomous' | null>(null); // Mode that user wants to switch to
  
  // Dev mode states
  const [showDevOptions, setShowDevOptions] = useState(false);
  const [disableAnimation, setDisableAnimation] = useState(false);
  const [disableContentAccordion, setDisableContentAccordion] = useState(true); // Enabled by default to hide old content accordion
  const [promptTemplateExists, setPromptTemplateExists] = useState(true); // New toggle for prompt template existence - ON by default
  
  // Chat options dropdown state
  const [openChatId, setOpenChatId] = useState<string | null>(null);

  const handleCopyChatId = (chatId: string) => {
    navigator.clipboard.writeText(chatId);
    setOpenChatId(null);
  };

  const handleShareChat = () => {
    setOpenChatId(null);
  };

  const handleDeleteChat = () => {
    setOpenChatId(null);
  };
  
  // Reference to mock messages definition for use in handlers across the component
  const mockMessagesDefinitionRef = useRef<(Omit<ChatMessageData, 'onAnimationComplete'> & { agentId?: string })[]>([]);
  // Function reference to continue the mock conversation from a specific index
  const addNextMockMessageRef = useRef<(index: number) => void>(() => {}); // Default no-op function

  // State to manage the expanded (full-screen like) view vs. widget view
  const [isExpanded, setIsExpanded] = useState(true);
  // State to manage which sidebar (bookmarks/history or agents) is active in expanded view
  const [activeSidebar, setActiveSidebar] = useState<'bookmarks' | 'agents' | null>('bookmarks');

  // --- DRAG AND DROP STATE AND REFS ---
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const chatWindowRef = useRef<HTMLDivElement>(null); // Ref for the main draggable window
  const dragStartRef = useRef({ initialMouseX: 0, initialMouseY: 0, initialWindowX: 0, initialWindowY: 0 });

  useEffect(() => {
    // Reset position if window is expanded
    if (isExpanded) {
      setPosition(null);
      setIsDragging(false); // Ensure dragging stops if expanded mid-drag
    }
  }, [isExpanded]);

  // Keep the ref synchronized with the state
  useEffect(() => {
    isMockAgentChatActiveRef.current = isMockAgentChatActive;
  }, [isMockAgentChatActive]);

  const handleDragMouseDown = useCallback((event: React.MouseEvent<HTMLElement>) => {
    const targetElement = event.target as HTMLElement;
    // Check if the click was on an interactive element within the header, not the header itself.
    // If so, don't start dragging, let the button/interactive element handle the click.
    if (targetElement.closest('button, a, input, select, textarea, [role="button"]')) {
      // Further check if the closest interactive element is actually part of the header controls,
      // and not the drag handle itself if it somehow gained a role=button.
      // This ensures clicks on actual buttons within the header are not hijacked.
      if (event.currentTarget.contains(targetElement) && targetElement !== event.currentTarget) {
         return;
      }
    }

    if (isExpanded || !chatWindowRef.current) {
      return;
    }
    event.preventDefault();
    setIsDragging(true);

    const currentPosition = position ?? (() => {
      const rect = chatWindowRef.current!.getBoundingClientRect();
      return { x: rect.left, y: rect.top };
    })();

    dragStartRef.current = {
      initialMouseX: event.clientX,
      initialMouseY: event.clientY,
      initialWindowX: currentPosition.x,
      initialWindowY: currentPosition.y,
    };
    
    if (!position) { // If it's the first drag, set the position to activate fixed styling
      setPosition(currentPosition);
    }
    document.body.style.userSelect = 'none';
  }, [isExpanded, position]);

  const handleDragMouseMove = useCallback((event: MouseEvent) => {
    if (!isDragging || isExpanded || !chatWindowRef.current) {
      return;
    }

    const deltaX = event.clientX - dragStartRef.current.initialMouseX;
    const deltaY = event.clientY - dragStartRef.current.initialMouseY;

    let newX = dragStartRef.current.initialWindowX + deltaX;
    let newY = dragStartRef.current.initialWindowY + deltaY;

    const windowWidth = chatWindowRef.current.offsetWidth;
    const windowHeight = chatWindowRef.current.offsetHeight;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    newX = Math.max(0, Math.min(newX, viewportWidth - windowWidth));
    newY = Math.max(0, Math.min(newY, viewportHeight - windowHeight));
    
    setPosition({ x: newX, y: newY });
  }, [isDragging, isExpanded]);

  const handleDragMouseUp = useCallback(() => {
    if (isDragging) {
      setIsDragging(false);
      document.body.style.userSelect = '';
    }
  }, [isDragging]);

  useEffect(() => {
    if (isDragging && !isExpanded) {
      document.addEventListener('mousemove', handleDragMouseMove);
      document.addEventListener('mouseup', handleDragMouseUp);
    } else {
      document.removeEventListener('mousemove', handleDragMouseMove);
      document.removeEventListener('mouseup', handleDragMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleDragMouseMove);
      document.removeEventListener('mouseup', handleDragMouseUp);
      if (document.body.style.userSelect === 'none') { // Clean up just in case
          document.body.style.userSelect = '';
      }
    };
  }, [isDragging, isExpanded, handleDragMouseMove, handleDragMouseUp]);

  // Toggles the enabled state of a marketing agent and dispatches an event
  const handleAgentToggle = (agentId: string) => {
    const agent = marketingAgents.find(a => a.id === agentId);
    if (!agent) return;

    let newStatus: 'join' | 'leave';

    setEnabledAgents(prev => {
      const newSet = new Set(prev);
      if (newSet.has(agentId)) {
        newSet.delete(agentId);
        newStatus = 'leave';
      } else {
        newSet.add(agentId);
        newStatus = 'join';
      }
      return newSet;
    });

    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('agentStatusChange', {
        detail: {
          name: agent.name,
          status: newStatus,
          icon: agent.icon,
          colorClass: agent.colorClass
        }
      }));
    }, 0);
  };

  const activeAgents: MarketingAgent[] = useMemo(() => {
    return marketingAgents.filter(agent => enabledAgents.has(agent.id));
  }, [enabledAgents]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Listen for scroll events during text streaming
  useEffect(() => {
    const handleScrollToBottom = () => {
      scrollToBottom();
    };

    window.addEventListener('chatScrollToBottom', handleScrollToBottom);
    
    return () => {
      window.removeEventListener('chatScrollToBottom', handleScrollToBottom);
    };
  }, []);

  const stopMockConversation = () => {
    setIsMockAgentChatActive(false); 
    if (mockMessageTimeoutRef.current) {
      clearTimeout(mockMessageTimeoutRef.current);
      mockMessageTimeoutRef.current = null;
    }
  };

  const handleModeSwitch = (newMode: 'collaborative' | 'autonomous') => {
    if (newMode !== selectedMode) {
      // If there are messages, show confirmation popup
      if (messages.length > 0) {
        setPendingMode(newMode);
        setShowModeSwitchConfirmation(true);
      } else {
        // If no messages, switch directly
        setSelectedMode(newMode);
      }
    }
  };

  const confirmModeSwitch = () => {
    if (pendingMode) {
      // Clear current conversation
      setMessages([]);
      setIsMockAgentChatActive(false);
      setMockChatCompleted(false);
      setContentApproved(false);
      setContentGenerated(false);
      setAutonomousWaitingForInput(false);
      
      // Clear any timeouts
      if (mockMessageTimeoutRef.current) {
        clearTimeout(mockMessageTimeoutRef.current);
        mockMessageTimeoutRef.current = null;
      }
      
      // Switch to new mode
      setSelectedMode(pendingMode);
      
      // Close popup and reset pending mode
      setShowModeSwitchConfirmation(false);
      setPendingMode(null);
    }
  };

  const cancelModeSwitch = () => {
    setShowModeSwitchConfirmation(false);
    setPendingMode(null);
  };

  // Dev mode handlers
  const toggleDevOptions = () => {
    setShowDevOptions(!showDevOptions);
  };

  const handleDisableAnimationToggle = () => {
    setDisableAnimation(!disableAnimation);
  };

  const handleDisableContentAccordionToggle = () => {
    setDisableContentAccordion(!disableContentAccordion);
  };

  const handlePromptTemplateExistsToggle = () => {
    setPromptTemplateExists(!promptTemplateExists);
  };

  const handleApproveContent = () => {
    setContentApproved(true);
    // Find the Content Agent Response message index and continue from the next message (Scheduler Agent)
    const contentAgentResponseIndex = mockMessagesDefinitionRef.current.findIndex(msg => msg.isContentAgent);
    if (contentAgentResponseIndex >= 0) {
      // Continue the flow from the next message after content agent response (Scheduler Agent)
      addNextMockMessageRef.current(contentAgentResponseIndex + 1);
    }
  };

  const handleApproveSegments = () => {
    setSegmentsApproved(true);
    // Find the Segment Agent table message index and continue from the next message (Content Agent Question Choice)
    const segmentAgentTableIndex = mockMessagesDefinitionRef.current.findIndex(msg => 
      msg.agentName === 'Segment agent' && msg.content.includes('<table')
    );
    if (segmentAgentTableIndex >= 0) {
      // Continue the flow from the next message after segment agent table (Content Agent Question Choice)
      addNextMockMessageRef.current(segmentAgentTableIndex + 1);
    }
  };

  const handleUpdateContent = (updatedContent: any) => {
    // Find the content agent from the imported marketingAgents
    const contentAgent = marketingAgents.find(agent => agent.id === 'content-agent');
    
    // Create a summary of the changes made
    const { collaborativeContentData, selectedSegment } = updatedContent;
    const segmentData = collaborativeContentData.email[selectedSegment];
    
    // Create a message that shows the updated content
    const updateMessage = `I've incorporated your changes into the content. Here's the updated version with your modifications:

**Email Subject Line:** ${segmentData.subject}

The content has been updated across all channels to reflect your changes.`;
    
    // Create a new content agent response message with the updated content
    const newContentAgentMessage = {
      agentId: contentAgent?.id || 'content-agent',
      type: 'chat' as const,
      isAI: true,
      agentName: contentAgent?.name || 'Content Agent',
      content: updateMessage,
      avatarSrc: contentAgent?.avatarSrc,
      avatarIcon: contentAgent?.icon,
      avatarBgClass: contentAgent?.colorClass,
      isContentAgent: true,
      isPlanMode: false,
      showApproveContentCTA: true,
      updatedContent: updatedContent  // Pass the updated content
    };

    // Add the new message to the conversation
    setMessages(prev => [...prev, newContentAgentMessage]);
    
    // Reset content approved state so user needs to approve the new content
    setContentApproved(false);
  };

  const handleDiscardChanges = () => {
    // Just revert the changes, no new message needed
    // The ContentAgentResponse component will handle the actual content revert
  };

  const handleFlowExecutionMessage = () => {
    const coMarketer = marketingAgents.find(agent => agent.id === 'co-marketer');
    const executionMessage: ChatMessageData = {
      type: 'chat',
      agentName: coMarketer?.name || "Co-marketer",
      avatarSrc: coMarketer?.avatarSrc,
      avatarIcon: coMarketer?.icon,
      avatarBgClass: coMarketer?.colorClass,
      isAI: true,
      content: "", // Content is handled by the FlowExecutionProgress component
      isFlowExecutionProgress: true,
      onFlowExecutionComplete: () => {
        // This callback is called when the FlowExecutionProgress component completes all steps
        setTimeout(() => {
          const followUpMessage: ChatMessageData = {
            type: 'chat',
            agentName: coMarketer?.name || "Co-marketer",
            avatarSrc: coMarketer?.avatarSrc,
            avatarIcon: coMarketer?.icon,
            avatarBgClass: coMarketer?.colorClass,
            isAI: true,
            content: `Great! The <strong>Email</strong> and <strong>APN campaigns</strong> have now been saved as drafts and are ready to go. However, there's a slight issue with the <strong>WhatsApp templates</strong> that requires your manual review.\n\n<strong>WhatsApp Template Issues:</strong>\n• Initial template was approved but Meta assigned it a different category than expected\n• Second template was rejected by Meta due to policy compliance issues\n\n<strong>Manual Steps Required:</strong>\n1. <strong>Review Template Categories:</strong> Log into Meta Business Manager and check the assigned category for the approved template. Decide if you want to proceed with the different category or request a change.\n\n2. <strong>Address Rejected Template:</strong> Review the rejection reasons in your Meta Business Manager dashboard. Common issues include:\n   • Promotional content in template headers\n   • Missing required opt-out language\n   • Non-compliant call-to-action buttons\n\n3. <strong>Template Resubmission:</strong> If needed, modify and resubmit the rejected template with the necessary compliance updates.\n\n4. <strong>Campaign Activation:</strong> Once WhatsApp templates are resolved, you can activate all three campaigns simultaneously.\n\nWould you like me to provide more specific guidance on any of these steps?`,
            onAnimationComplete: () => {}
          };
          setMessages(prev => [...prev, followUpMessage]);
        }, 1000); // Small delay to make the conversation flow feel natural
      },
      onAnimationComplete: () => {}
    };
    setMessages(prev => [...prev, executionMessage]);
  };

  const handleSendMessage = (message: string) => {
    const userMessage: ChatMessageData = {
      type: 'chat',
      content: message,
      isAI: false,
      onAnimationComplete: () => {}
    };
    setMessages(prev => [...prev, userMessage]);
    setMockChatCompleted(false); // Reset when user sends a new message

    const userMessagesCount = messages.filter(m => !m.isAI && m.type === 'chat').length + 1;
    const lowerCaseMessage = message.toLowerCase().trim();

    // Check for autonomous mode triggers
    const isAutonomousValentinesTrigger = selectedMode === 'autonomous' && 
      lowerCaseMessage === "can you help me create a valentine's day campaign for perfumes";
    
    // Check for collaborative mode triggers
    const isCollaborativeValentinesTrigger = selectedMode === 'collaborative' && 
      (lowerCaseMessage === "hi" || lowerCaseMessage === "help me create a campaign for valentine's day");

    if (userMessagesCount === 1 && (isAutonomousValentinesTrigger || isCollaborativeValentinesTrigger)) {
      setIsMockAgentChatActive(true); // Set state
      setContentApproved(false); // Reset content approval when starting new conversation
      setContentGenerated(false); // Reset content generation when starting new conversation
      setAutonomousWaitingForInput(false); // Reset autonomous waiting state when starting new conversation
      isMockAgentChatActiveRef.current = true; // Set ref immediately for the first call to addNextMockMessage
      
      const coMarketer = marketingAgents.find(agent => agent.id === 'co-marketer');
      const segmentAgent = marketingAgents.find(agent => agent.id === 'segment-agent');
      const contentAgent = marketingAgents.find(agent => agent.id === 'content-agent');
      const schedulerAgent = marketingAgents.find(agent => agent.id === 'scheduler-agent');
      const insightAgent = marketingAgents.find(agent => agent.id === 'insight-agent');

            // Add agentId to mock messages for easier lookup
      const mockMessagesDefinition: (Omit<ChatMessageData, 'onAnimationComplete'> & { agentId?: string })[] = 
        selectedMode === 'autonomous' ? [
          { 
            agentId: coMarketer?.id, 
            type: 'chat', 
            isAI: true, 
            agentName: coMarketer?.name, 
            content: "I'll help you design a Valentine's Day perfume campaign. To create the most effective campaign, I need some additional information:\n\n<strong>1. Campaign Goals:</strong>\n• What are your primary objectives? (e.g., increase sales, brand awareness, etc.)\n• Do you have specific revenue or sales targets?\n\n<strong>2. Product Details:</strong>\n• Which perfume brands/collections are you promoting?\n• What is the price range of the perfumes?\n• Are there any special Valentine's Day offers or bundles?\n\n<strong>3. Target Audience:</strong>\n• Are you targeting specific age groups?\n• Any specific gender focus (men buying for women, women for men, or both)?\n• Geographic location for the campaign?\n\n<strong>4. Campaign Duration:</strong>\n• When would you like to start the campaign?\n• How long do you want to run it? (typically Valentine's campaigns start 2-3 weeks before February 14th)\n\n<strong>5. Budget and Resources:</strong>\n• Do you have a specific marketing budget?\n• Which marketing channels would you like to use? (email, social media, etc.)\n\nPlease provide as much information as possible so I can help create a targeted and effective Valentine's Day campaign.", 
            avatarIcon: coMarketer?.icon, 
            avatarBgClass: coMarketer?.colorClass,
            waitForUserInput: true // Special flag to pause and wait for user input
          },
          // After user input, continue with autonomous flow
          { agentId: coMarketer?.id, type: 'chat', isAI: true, agentName: coMarketer?.name, content: "I'll start by creating audience segments based on the information provided. Let me work with the Segment Expert Agent to create optimal segments for the Valentine's campaign.", avatarIcon: coMarketer?.icon, avatarBgClass: coMarketer?.colorClass },
          { agentId: segmentAgent?.id, type: 'chat', isAI: true, agentName: segmentAgent?.name, content: "Let me retrieve the segments for this Valentine's Day perfume campaign by providing the campaign summary to the retrieve_segment tool.", avatarIcon: segmentAgent?.icon, avatarBgClass: segmentAgent?.colorClass },
          { 
            agentId: segmentAgent?.id, 
            type: 'chat', 
            isAI: true, 
            agentName: segmentAgent?.name, 
            content: `Based on the segmentation rules and available segments, I'll create targeted micro-segments that incorporate:\n\n• RFM checks (Rule #1)\n• Product and Category Affinity (Enhanced Rules #1 & #2)\n• Price Sensitivity (Enhanced Rule #4)\n• Gender-Specific targeting (Enhanced Rule #5)\n• Channel Interactions (Enhanced Rule #6)\n• Avoiding overlap and campaign fatigue (Rule #2)\n\nLet me structure the segments optimally for the Valentine's campaign.\n\n<table style="width: 100%; border-collapse: collapse; font-size: 0.875rem; table-layout: fixed; border: 1px solid hsl(var(--border)); background-color: hsl(var(--background));">
                      <thead>
                        <tr>
                          <th style="border: 1px solid hsl(var(--border)); padding: 8px; text-align: left; background-color: hsl(var(--muted)); color: hsl(var(--muted-foreground)); width: 22%;">Segment info</th>
                          <th style="border: 1px solid hsl(var(--border)); padding: 8px; text-align: left; background-color: hsl(var(--muted)); color: hsl(var(--muted-foreground)); width: 30%;">Segment description</th>
                          <th style="border: 1px solid hsl(var(--border)); padding: 8px; text-align: left; background-color: hsl(var(--muted)); color: hsl(var(--muted-foreground)); width: 12%;">WhatsApp</th>
                          <th style="border: 1px solid hsl(var(--border)); padding: 8px; text-align: left; background-color: hsl(var(--muted)); color: hsl(var(--muted-foreground)); width: 12%;">Email</th>
                          <th style="border: 1px solid hsl(var(--border)); padding: 8px; text-align: left; background-color: hsl(var(--muted)); color: hsl(var(--muted-foreground)); width: 12%;">APN</th>
                          <th style="border: 1px solid hsl(var(--border)); padding: 8px; text-align: left; background-color: hsl(var(--muted)); color: hsl(var(--muted-foreground)); width: 12%;">Total users</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td style="border: 1px solid hsl(var(--border)); padding: 8px; vertical-align: top; overflow-wrap: break-word;"><strong>Premium Perfume Enthusiasts</strong></td>
                          <td style="border: 1px solid hsl(var(--border)); padding: 8px; vertical-align: top; overflow-wrap: break-word;">Users who clicked emails in the last 90 days AND have a high PBL_HI score AND engaged with luxury perfume categories</td>
                          <td style="border: 1px solid hsl(var(--border)); padding: 8px; vertical-align: top; text-align: right; overflow-wrap: break-word;">156,850</td>
                          <td style="border: 1px solid hsl(var(--border)); padding: 8px; vertical-align: top; text-align: right; overflow-wrap: break-word;">183,237</td>
                          <td style="border: 1px solid hsl(var(--border)); padding: 8px; vertical-align: top; text-align: right; overflow-wrap: break-word;">83,631</td>
                          <td style="border: 1px solid hsl(var(--border)); padding: 8px; vertical-align: top; text-align: right; overflow-wrap: break-word;"><strong>423,718</strong></td>
                        </tr>
                        <tr>
                          <td style="border: 1px solid hsl(var(--border)); padding: 8px; vertical-align: top; overflow-wrap: break-word;"><strong>Recent Beauty Browsers</strong></td>
                          <td style="border: 1px solid hsl(var(--border)); padding: 8px; vertical-align: top; overflow-wrap: break-word;">Users who opened emails in the last 90 days AND viewed skin or beauty/perfume category pages recently AND have not purchased yet</td>
                          <td style="border: 1px solid hsl(var(--border)); padding: 8px; vertical-align: top; text-align: right; overflow-wrap: break-word;">202,362</td>
                          <td style="border: 1px solid hsl(var(--border)); padding: 8px; vertical-align: top; text-align: right; overflow-wrap: break-word;">231,664</td>
                          <td style="border: 1px solid hsl(var(--border)); padding: 8px; vertical-align: top; text-align: right; overflow-wrap: break-word;">144,306</td>
                          <td style="border: 1px solid hsl(var(--border)); padding: 8px; vertical-align: top; text-align: right; overflow-wrap: break-word;"><strong>578,332</strong></td>
                        </tr>
                        <tr>
                          <td style="border: 1px solid hsl(var(--border)); padding: 8px; vertical-align: top; overflow-wrap: break-word;"><strong>Loyal Beauty Shoppers</strong></td>
                          <td style="border: 1px solid hsl(var(--border)); padding: 8px; vertical-align: top; overflow-wrap: break-word;">Users who bought skincare products in the last 90 days AND are repeat buyers based on PBL_buyers tag</td>
                          <td style="border: 1px solid hsl(var(--border)); padding: 8px; vertical-align: top; text-align: right; overflow-wrap: break-word;">171,724</td>
                          <td style="border: 1px solid hsl(var(--border)); padding: 8px; vertical-align: top; text-align: right; overflow-wrap: break-word;">196,177</td>
                          <td style="border: 1px solid hsl(var(--border)); padding: 8px; vertical-align: top; text-align: right; overflow-wrap: break-word;">122,452</td>
                          <td style="border: 1px solid hsl(var(--border)); padding: 8px; vertical-align: top; text-align: right; overflow-wrap: break-word;"><strong>490,353</strong></td>
                        </tr>
                        <tr>
                          <td style="border: 1px solid hsl(var(--border)); padding: 8px; vertical-align: top; overflow-wrap: break-word;"><strong>High Intent New Customers</strong></td>
                          <td style="border: 1px solid hsl(var(--border)); padding: 8px; vertical-align: top; overflow-wrap: break-word;">New buyers with high intent in the last 30 days (HI_NB_L30D) AND have opened emails recently AND haven't made a purchase yet</td>
                          <td style="border: 1px solid hsl(var(--border)); padding: 8px; vertical-align: top; text-align: right; overflow-wrap: break-word;">155,832</td>
                          <td style="border: 1px solid hsl(var(--border)); padding: 8px; vertical-align: top; text-align: right; overflow-wrap: break-word;">178,381</td>
                          <td style="border: 1px solid hsl(var(--border)); padding: 8px; vertical-align: top; text-align: right; overflow-wrap: break-word;">110,736</td>
                          <td style="border: 1px solid hsl(var(--border)); padding: 8px; vertical-align: top; text-align: right; overflow-wrap: break-word;"><strong>444,949</strong></td>
                        </tr>
                        <tr>
                          <td style="border: 1px solid hsl(var(--border)); padding: 8px; vertical-align: top; overflow-wrap: break-word;"><strong>Welcome Premium Segment</strong></td>
                          <td style="border: 1px solid hsl(var(--border)); padding: 8px; vertical-align: top; overflow-wrap: break-word;">Users in the high-tier Welcome segment AND clicked emails in the last 180 days</td>
                          <td style="border: 1px solid hsl(var(--border)); padding: 8px; vertical-align: top; text-align: right; overflow-wrap: break-word;">205,200</td>
                          <td style="border: 1px solid hsl(var(--border)); padding: 8px; vertical-align: top; text-align: right; overflow-wrap: break-word;">234,515</td>
                          <td style="border: 1px solid hsl(var(--border)); padding: 8px; vertical-align: top; text-align: right; overflow-wrap: break-word;">146,571</td>
                          <td style="border: 1px solid hsl(var(--border)); padding: 8px; vertical-align: top; text-align: right; overflow-wrap: break-word;"><strong>586,286</strong></td>
                        </tr>
                      </tbody>
                    </table>`, 
            avatarIcon: segmentAgent?.icon, 
            avatarBgClass: segmentAgent?.colorClass,
            animate: true,
            animationSpeed: 50
          },
          { agentId: coMarketer?.id, type: 'chat', isAI: true, agentName: coMarketer?.name, content: "Now that I have the segments, I'll get insights from previous campaigns to optimize our approach. I'll contact the Insights Agent.", avatarIcon: coMarketer?.icon, avatarBgClass: coMarketer?.colorClass },
          { 
            agentId: insightAgent?.id, 
            type: 'chat', 
            isAI: true, 
            agentName: insightAgent?.name, 
            content: `Based on comprehensive data analysis, here are the key performance drivers for perfume campaigns:\n\n<strong>Email Campaign Best Practices:</strong>\n• Subject Line Optimization: 31-62 characters (+44.03% click rate)\n• Words: 4-5 words (+18.94% click rate)\n• Use punctuation (+2.85% click rate)\n• Avoid emojis (23.78% better click rates)\n\n<strong>Timing & Scheduling:</strong>\n• Best revenue window: 19 PM - 22 PM (+14.61% revenue)\n• Optimal open rates: 15 PM - 19 PM (+2.27%)\n• Best click rates: 12 PM - 15 PM (+19.50%)\n• Schedule for weekends (+12.68% revenue)\n\n<strong>Content Strategy:</strong>\n• Use 'Content Engagement' approach (+37.81% click rate)\n• Implement 'Exclusivity' tone (+150% click rate)\n• Include 'Urgency' elements (+14.04% revenue)\n• Use 'Discounted Promotion' messaging (+12.20% revenue)\n\n<strong>SMS Campaign Optimization:</strong>\n• Timing: 9 AM - 11 AM for clicks (+13.73%)\n• Message length: 234-239 characters\n• Weekend scheduling (+13.80% revenue)\n\n<strong>Revenue Growth Strategy (to achieve 3% increase):</strong>\n• Combine weekend scheduling (+12.68%) with optimal timing\n• Use exclusivity messaging with urgency elements\n• Implement discounted promotions during peak hours\n• Focus on content engagement with clear call-to-actions`, 
            avatarIcon: insightAgent?.icon, 
            avatarBgClass: insightAgent?.colorClass 
          },
          { agentId: coMarketer?.id, type: 'chat', isAI: true, agentName: coMarketer?.name, content: "Now I'll work with the Content Agent to create personalized subject lines and content for each segment based on these insights.", avatarIcon: coMarketer?.icon, avatarBgClass: coMarketer?.colorClass },
                    // Old content agent message - conditionally included based on toggle (only in autonomous mode)
          ...(disableContentAccordion ? [] : [{ agentId: contentAgent?.id, type: 'chat' as const, isAI: true, agentName: contentAgent?.name, content: "I've prepared communication templates for your campaign across multiple channels.", avatarSrc: contentAgent?.avatarSrc, avatarIcon: contentAgent?.icon, avatarBgClass: contentAgent?.colorClass, isContentAgent: true, isPlanMode: true }]),
          // New content agent message with segment accordions
          { 
            agentId: contentAgent?.id, 
            type: 'chat', 
            isAI: true, 
            agentName: contentAgent?.name, 
            content: '', // Empty content since we render the accordion component
            avatarSrc: contentAgent?.avatarSrc,
            avatarIcon: contentAgent?.icon, 
            avatarBgClass: contentAgent?.colorClass,
              isPlanMode: true,
            isSegmentAccordion: true
          },
          { agentId: coMarketer?.id, type: 'chat', isAI: true, agentName: coMarketer?.name, content: "Let me now work with the Scheduling Agent to optimize the campaign timing for maximum impact.", avatarIcon: coMarketer?.icon, avatarBgClass: coMarketer?.colorClass },
          { 
            agentId: schedulerAgent?.id, 
            type: 'chat', 
            isAI: true, 
            agentName: schedulerAgent?.name, 
            content: 'Scheduler agent response', 
            avatarIcon: schedulerAgent?.icon, 
            avatarBgClass: schedulerAgent?.colorClass,
            isSchedulerAccordion: true
          },
          { 
            agentId: coMarketer?.id, 
            type: 'chat', 
            isAI: true, 
            agentName: coMarketer?.name, 
            content: `<strong>Valentine's Day Perfume Campaign Report</strong>\n\n<strong>Executive Summary</strong>\n• Campaign goal: Achieve 3% sales increase over Feb 7–14\n• Reach: Over 2.5 million customers\n• Strategy: Personalized messaging + optimal timing to drive engagement & conversion\n\n<strong>Audience Segments</strong>\n1. Premium Perfume Enthusiasts (423,718 users) - High-value customers with luxury perfume purchase history\n2. Recent Beauty Browsers (578,332 users) - Active browsers in beauty/perfume categories\n3. Loyal Beauty Shoppers (490,353 users) - Repeat beauty category purchasers\n4. High Intent New Customers (444,949 users) - Recent high-intent prospects\n5. Welcome Premium Segment (586,286 users) - Engaged new customers with premium potential\n\n<strong>Campaign Insights – Key Performance Drivers</strong>\n• Optimal revenue window: 19 PM – 22 PM (+14.61% revenue)\n• Weekend scheduling advantage: +12.68% revenue\n• Subject line length (31–62 characters): +44.03% click rate\n• Exclusivity messaging: +150% click rate\n• Urgency elements: +14.04% revenue\n\n<strong>Content Strategy</strong>\nPersonalized subject lines for each segment incorporating exclusivity, urgency, and Valentine's theme within optimal character limits.\n\n<strong>Campaign Schedule</strong>\n• Premium & Loyal Segments: Prime time 19–22 PM with Smart Time Optimization\n• New & Browse Segments: Fixed timing 15 PM weekdays, 19 PM weekends\n• Welcome Segment: Immediate trigger with 19 PM follow-up\n\n<strong>Conclusion</strong>\nCampaign designed to exceed 3% sales increase through strategic timing, personalization, and segment-specific offers. Continuous monitoring and optimization throughout the campaign duration.`, 
            avatarIcon: coMarketer?.icon, 
            avatarBgClass: coMarketer?.colorClass,
            isExecutiveSummaryWithContent: true
          }
        ] : [
        // Add the questionnaire flow to collaborative mode as well
        { 
          agentId: coMarketer?.id, 
          type: 'chat', 
          isAI: true, 
          agentName: coMarketer?.name, 
          content: "I'll help you design a Valentine's Day perfume campaign. To create the most effective campaign, I need some additional information:\n\n<strong>1. Campaign Goals:</strong>\n• What are your primary objectives? (e.g., increase sales, brand awareness, etc.)\n• Do you have specific revenue or sales targets?\n\n<strong>2. Product Details:</strong>\n• Which perfume brands/collections are you promoting?\n• What is the price range of the perfumes?\n• Are there any special Valentine's Day offers or bundles?\n\n<strong>3. Target Audience:</strong>\n• Are you targeting specific age groups?\n• Any specific gender focus (men buying for women, women for men, or both)?\n• Geographic location for the campaign?\n\n<strong>4. Campaign Duration:</strong>\n• When would you like to start the campaign?\n• How long do you want to run it? (typically Valentine's campaigns start 2-3 weeks before February 14th)\n\n<strong>5. Budget and Resources:</strong>\n• Do you have a specific marketing budget?\n• Which marketing channels would you like to use? (email, social media, etc.)\n\nPlease provide as much information as possible so I can help create a targeted and effective Valentine's Day campaign.", 
          avatarIcon: coMarketer?.icon, 
          avatarBgClass: coMarketer?.colorClass,
          waitForUserInput: true // Special flag to pause and wait for user input
        },
        // After user input, continue with collaborative flow starting with "This looks like a good campaign..."
        { agentId: coMarketer?.id, type: 'chat', isAI: true, agentName: coMarketer?.name, content: "This looks like a good project. <strong>Segment specialist</strong>, can you help identify the best audience segments for this campaign?", avatarIcon: coMarketer?.icon, avatarBgClass: coMarketer?.colorClass },
        // Segment agent rationale - explain approach before proceeding
        { 
          agentId: segmentAgent?.id, 
          type: 'chat', 
          isAI: true, 
          agentName: segmentAgent?.name, 
          content: '', // Content handled by component
          avatarIcon: segmentAgent?.icon, 
          avatarBgClass: segmentAgent?.colorClass,
          isSegmentAgentRationale: true,
          waitForUserInput: true // Wait for user to click Continue or type response
        },
        { 
          agentId: segmentAgent?.id, 
          type: 'chat', 
          isAI: true, 
          agentName: segmentAgent?.name, 
          // Enable animation for Segment agent to show thinking animation
          // Table content will still be handled appropriately by ChatMessage.tsx
          animate: true, 
          animationSpeed: 50, 
          content: `
                    <table style="width: 100%; border-collapse: collapse; font-size: 0.875rem; table-layout: fixed; border: 1px solid hsl(var(--border)); background-color: hsl(var(--background));">
                      <thead>
                        <tr>
                          <th style="border: 1px solid hsl(var(--border)); padding: 8px; text-align: left; background-color: hsl(var(--muted)); color: hsl(var(--muted-foreground)); width: 22%;">Segment info</th>
                          <th style="border: 1px solid hsl(var(--border)); padding: 8px; text-align: left; background-color: hsl(var(--muted)); color: hsl(var(--muted-foreground)); width: 30%;">Segment description</th>
                          <th style="border: 1px solid hsl(var(--border)); padding: 8px; text-align: left; background-color: hsl(var(--muted)); color: hsl(var(--muted-foreground)); width: 12%;">WhatsApp</th>
                          <th style="border: 1px solid hsl(var(--border)); padding: 8px; text-align: left; background-color: hsl(var(--muted)); color: hsl(var(--muted-foreground)); width: 12%;">Email</th>
                          <th style="border: 1px solid hsl(var(--border)); padding: 8px; text-align: left; background-color: hsl(var(--muted)); color: hsl(var(--muted-foreground)); width: 12%;">APN</th>
                          <th style="border: 1px solid hsl(var(--border)); padding: 8px; text-align: left; background-color: hsl(var(--muted)); color: hsl(var(--muted-foreground)); width: 12%;">Total users</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td style="border: 1px solid hsl(var(--border)); padding: 8px; vertical-align: top; overflow-wrap: break-word;"><strong>Affinity_based_segment</strong></td>
                          <td style="border: 1px solid hsl(var(--border)); padding: 8px; vertical-align: top; overflow-wrap: break-word;">Users who clicked emails in the last 90 days AND have a high PBL_HI score AND engaged with luxury perfume categories</td>
                          <td style="border: 1px solid hsl(var(--border)); padding: 8px; vertical-align: top; text-align: right; overflow-wrap: break-word;">19,537</td>
                          <td style="border: 1px solid hsl(var(--border)); padding: 8px; vertical-align: top; text-align: right; overflow-wrap: break-word;">22,321</td>
                          <td style="border: 1px solid hsl(var(--border)); padding: 8px; vertical-align: top; text-align: right; overflow-wrap: break-word;">10,820</td>
                          <td style="border: 1px solid hsl(var(--border)); padding: 8px; vertical-align: top; text-align: right; overflow-wrap: break-word;"><strong>52,678</strong></td>
                        </tr>
                        <tr>
                          <td style="border: 1px solid hsl(var(--border)); padding: 8px; vertical-align: top; overflow-wrap: break-word;"><strong>High_AOV_segment</strong></td>
                          <td style="border: 1px solid hsl(var(--border)); padding: 8px; vertical-align: top; overflow-wrap: break-word;">Users who opened emails in the last 90 days AND viewed skin or beauty/perfume category pages recently AND have not purchased yet</td>
                          <td style="border: 1px solid hsl(var(--border)); padding: 8px; vertical-align: top; text-align: right; overflow-wrap: break-word;">4,578</td>
                          <td style="border: 1px solid hsl(var(--border)); padding: 8px; vertical-align: top; text-align: right; overflow-wrap: break-word;">5,234</td>
                          <td style="border: 1px solid hsl(var(--border)); padding: 8px; vertical-align: top; text-align: right; overflow-wrap: break-word;">2,533</td>
                          <td style="border: 1px solid hsl(var(--border)); padding: 8px; vertical-align: top; text-align: right; overflow-wrap: break-word;"><strong>12,345</strong></td>
                        </tr>
                        <tr>
                          <td style="border: 1px solid hsl(var(--border)); padding: 8px; vertical-align: top; overflow-wrap: break-word;"><strong>Seasonal_buyers</strong></td>
                          <td style="border: 1px solid hsl(var(--border)); padding: 8px; vertical-align: top; overflow-wrap: break-word;">Users who bought skincare products in the last 90 days AND are repeat buyers based on PBL_buyers tag</td>
                          <td style="border: 1px solid hsl(var(--border)); padding: 8px; vertical-align: top; text-align: right; overflow-wrap: break-word;">12,810</td>
                          <td style="border: 1px solid hsl(var(--border)); padding: 8px; vertical-align: top; text-align: right; overflow-wrap: break-word;">14,647</td>
                          <td style="border: 1px solid hsl(var(--border)); padding: 8px; vertical-align: top; text-align: right; overflow-wrap: break-word;">7,110</td>
                          <td style="border: 1px solid hsl(var(--border)); padding: 8px; vertical-align: top; text-align: right; overflow-wrap: break-word;"><strong>34,567</strong></td>
                        </tr>
                        <tr>
                          <td style="border: 1px solid hsl(var(--border)); padding: 8px; vertical-align: top; overflow-wrap: break-word;"><strong>Loyalty_program_members</strong></td>
                          <td style="border: 1px solid hsl(var(--border)); padding: 8px; vertical-align: top; overflow-wrap: break-word;">Users in the high-tier Welcome segment AND clicked emails in the last 180 days</td>
                          <td style="border: 1px solid hsl(var(--border)); padding: 8px; vertical-align: top; text-align: right; overflow-wrap: break-word;">3,304</td>
                          <td style="border: 1px solid hsl(var(--border)); padding: 8px; vertical-align: top; text-align: right; overflow-wrap: break-word;">3,777</td>
                          <td style="border: 1px solid hsl(var(--border)); padding: 8px; vertical-align: top; text-align: right; overflow-wrap: break-word;">1,829</td>
                          <td style="border: 1px solid hsl(var(--border)); padding: 8px; vertical-align: top; text-align: right; overflow-wrap: break-word;"><strong>8,910</strong></td>
                        </tr>
                      </tbody>
                    </table>
                  `.trim(), 
          avatarIcon: segmentAgent?.icon, 
          avatarBgClass: segmentAgent?.colorClass,
          waitForUserInput: true // Wait for user to approve segments
        },
        // New question choice message before clarification
        { agentId: contentAgent?.id, type: 'chat', isAI: true, agentName: contentAgent?.name, content: '', avatarSrc: contentAgent?.avatarSrc, avatarIcon: contentAgent?.icon, avatarBgClass: contentAgent?.colorClass, isContentAgentQuestionChoice: true },
        { agentId: contentAgent?.id, type: 'chat', isAI: true, agentName: contentAgent?.name, content: "Based on these segments, I'll need some information to craft the most effective content.", avatarSrc: contentAgent?.avatarSrc, avatarIcon: contentAgent?.icon, avatarBgClass: contentAgent?.colorClass, isContentAgentClarification: true },
        // Content agent rationale – appears after "Generate Content" click
        { agentId: contentAgent?.id, type: 'chat', isAI: true, agentName: contentAgent?.name, content: '', avatarSrc: contentAgent?.avatarSrc, avatarIcon: contentAgent?.icon, avatarBgClass: contentAgent?.colorClass, isContentAgentRationale: true, waitForUserInput: true },
        // Content agent accordion response – shown after user clicks "Continue" on rationale
        { agentId: contentAgent?.id, type: 'chat', isAI: true, agentName: contentAgent?.name, content: 'Content agent response', avatarSrc: contentAgent?.avatarSrc, avatarIcon: contentAgent?.icon, avatarBgClass: contentAgent?.colorClass, isContentAgent: true, isPlanMode: false },
        // Scheduler agent response in collaborative mode
        { 
          agentId: schedulerAgent?.id, 
          type: 'chat', 
          isAI: true, 
          agentName: schedulerAgent?.name, 
          content: 'Scheduler agent response', 
          avatarIcon: schedulerAgent?.icon, 
          avatarBgClass: schedulerAgent?.colorClass,
          isSchedulerAccordion: true
        },
        { agentId: coMarketer?.id, type: 'chat', isAI: true, agentName: coMarketer?.name, content: "Here\'s a summary of what our team has put together:\n\n1. We\'ve identified <strong>4 high-performing target segments</strong> for your Valentine\'s campaign\n2. <strong>Custom subject lines</strong> have been created for each segment to maximize engagement\n3. A <strong>strategic send schedule</strong> has been designed to optimize open rates\n4. All components are ready for your review\n\nWould you like to make any adjustments before we proceed to implementation?", avatarIcon: coMarketer?.icon, avatarBgClass: coMarketer?.colorClass }
      ];
      
      // Store the mock messages definition in ref for use in other handlers
      mockMessagesDefinitionRef.current = mockMessagesDefinition;
      
      const processedAgentIdsForJoinMessage = new Set<string>();

      const addNextMockMessage = (index: number) => {
        // If mock chat is no longer active (e.g., stopped by user or ended), exit.
        if (!isMockAgentChatActiveRef.current) { // Always check the ref
          if (mockMessageTimeoutRef.current) { // Ensure any lingering timeout for this function is cleared
            clearTimeout(mockMessageTimeoutRef.current);
            mockMessageTimeoutRef.current = null;
          }
          return;
        }

        if (index >= mockMessagesDefinition.length) {
          setIsMockAgentChatActive(false); // End of sequence (ref will update via useEffect)
          setMockChatCompleted(true); // <-- Set mock chat completed true
          if (mockMessageTimeoutRef.current) { // Clear ref if sequence ends naturally
            clearTimeout(mockMessageTimeoutRef.current);
            mockMessageTimeoutRef.current = null;
          }
          return;
        }

        const currentMessageDef = mockMessagesDefinition[index];
        const agentToProcess = marketingAgents.find(a => a.id === currentMessageDef.agentId);

        if (agentToProcess && !enabledAgents.has(agentToProcess.id) && !processedAgentIdsForJoinMessage.has(agentToProcess.id)) {
          // 1. Update enabled state
          setEnabledAgents(prev => new Set(prev).add(agentToProcess.id));
          
          // Skip the join message dispatch since Co-marketer is always present
          // 2. Dispatch join event
          // window.dispatchEvent(new CustomEvent('agentStatusChange', {
          //   detail: {
          //     name: agentToProcess.name,
          //     status: 'join',
          //     icon: agentToProcess?.icon,
          //     colorClass: agentToProcess.colorClass
          //   }
          // }));
          processedAgentIdsForJoinMessage.add(agentToProcess.id);

          // Process the message immediately without delay since there's no join message
          setTimeout(() => {
                      const messageWithCallback: ChatMessageData = {
            type: currentMessageDef.type,
            content: currentMessageDef.content,
            isAI: currentMessageDef.isAI,
            agentName: currentMessageDef.agentName,
            avatarSrc: agentToProcess?.avatarSrc,
            avatarIcon: currentMessageDef.avatarIcon,
            avatarBgClass: currentMessageDef.avatarBgClass,
            // Transfer animation control properties from the message definition
            // This is important for messages like tables that shouldn't animate
            animate: currentMessageDef.animate,
            animationSpeed: currentMessageDef.animationSpeed,
            isContentAgent: currentMessageDef.isContentAgent,
            isContentAgentClarification: currentMessageDef.isContentAgentClarification,
            isContentAgentQuestionChoice: currentMessageDef.isContentAgentQuestionChoice,
            isPlanMode: currentMessageDef.isPlanMode,
            isSegmentAccordion: currentMessageDef.isSegmentAccordion,
            isSchedulerAccordion: currentMessageDef.isSchedulerAccordion,
            isSegmentAgentRationale: currentMessageDef.isSegmentAgentRationale,
            isContentAgentRationale: currentMessageDef.isContentAgentRationale,
            isExecutiveSummaryWithContent: currentMessageDef.isExecutiveSummaryWithContent,
            onAnimationComplete: () => {
              // Clear previous timeout before setting a new one
              if (mockMessageTimeoutRef.current) {
                clearTimeout(mockMessageTimeoutRef.current);
              }
              // For autonomous mode, check if this message should wait for user input
              if (selectedMode === 'autonomous' && currentMessageDef.waitForUserInput) {
                setAutonomousWaitingForInput(true);
                return;
              }
              // For collaborative mode, also check if this message should wait for user input
              if (selectedMode === 'collaborative' && currentMessageDef.waitForUserInput) {
                // Don't set autonomousWaitingForInput, just return to wait for user input
                return;
              }
              // For content agent question choice, we stop the auto flow until user clicks a choice
              if (currentMessageDef.isContentAgentQuestionChoice) {
                return;
              }
              // For content agent clarification, we stop the auto flow until Generate Content is clicked
              if (currentMessageDef.isContentAgentClarification) {
                return;
              }
              // For segment agent rationale, we stop the auto flow until Continue is clicked
              if (currentMessageDef.isSegmentAgentRationale) {
                return;
              }
              // For segment agent table, we stop the auto flow until Approve Segments is clicked
              if (currentMessageDef.agentName === 'Segment agent' && currentMessageDef.content.includes('<table')) {
                return;
              }
              // For content agent response, we stop the auto flow until Approve Content is clicked
              if (currentMessageDef.isContentAgent) {
                return;
              }
              mockMessageTimeoutRef.current = setTimeout(() => {
                addNextMockMessage(index + 1);
              }, 500); // Original delay
            }
          };
            setMessages(prev => [...prev, messageWithCallback]);
          }, 100); // Reduced delay since no join message
        } else {
          // Agent already enabled or join message already shown, or no agent found for this message
          const messageWithCallback: ChatMessageData = {
            type: currentMessageDef.type,
            content: currentMessageDef.content,
            isAI: currentMessageDef.isAI,
            agentName: currentMessageDef.agentName,
            avatarSrc: agentToProcess?.avatarSrc,
            avatarIcon: currentMessageDef.avatarIcon,
            avatarBgClass: currentMessageDef.avatarBgClass,
            // Transfer animation control properties from the message definition
            // This ensures tables and other complex content gets displayed properly
            animate: currentMessageDef.animate,
            animationSpeed: currentMessageDef.animationSpeed,
            isContentAgent: currentMessageDef.isContentAgent,
            isContentAgentClarification: currentMessageDef.isContentAgentClarification,
            isContentAgentQuestionChoice: currentMessageDef.isContentAgentQuestionChoice,
            isPlanMode: currentMessageDef.isPlanMode,
            isSegmentAccordion: currentMessageDef.isSegmentAccordion,
            isSchedulerAccordion: currentMessageDef.isSchedulerAccordion,
            isSegmentAgentRationale: currentMessageDef.isSegmentAgentRationale,
            isContentAgentRationale: currentMessageDef.isContentAgentRationale,
            isExecutiveSummaryWithContent: currentMessageDef.isExecutiveSummaryWithContent,
            onAnimationComplete: () => {
              // Clear previous timeout before setting a new one
              if (mockMessageTimeoutRef.current) {
                clearTimeout(mockMessageTimeoutRef.current);
              }
              // For autonomous mode, check if this message should wait for user input
              if (selectedMode === 'autonomous' && currentMessageDef.waitForUserInput) {
                setAutonomousWaitingForInput(true);
                return;
              }
              // For collaborative mode, also check if this message should wait for user input
              if (selectedMode === 'collaborative' && currentMessageDef.waitForUserInput) {
                // Don't set autonomousWaitingForInput, just return to wait for user input
                return;
              }
              // For content agent question choice, we stop the auto flow until user clicks a choice
              if (currentMessageDef.isContentAgentQuestionChoice) {
                return;
              }
              // For content agent clarification, we stop the auto flow until Generate Content is clicked
              if (currentMessageDef.isContentAgentClarification) {
                return;
              }
              // For segment agent rationale, we stop the auto flow until Continue is clicked
              if (currentMessageDef.isSegmentAgentRationale) {
                return;
              }
              // For segment agent table, we stop the auto flow until Approve Segments is clicked
              if (currentMessageDef.agentName === 'Segment agent' && currentMessageDef.content.includes('<table')) {
                return;
              }
              // For content agent response, we stop the auto flow until Approve Content is clicked
              if (currentMessageDef.isContentAgent) {
                return;
              }
              mockMessageTimeoutRef.current = setTimeout(() => {
                addNextMockMessage(index + 1);
              }, 500); // Original delay
            }
          };
          setMessages(prev => [...prev, messageWithCallback]);
        }
      };
      
      // Store the function reference for use elsewhere in the component
      addNextMockMessageRef.current = addNextMockMessage;

      // Initial delay before starting the sequence
      // Clear previous timeout before setting a new one
      if (mockMessageTimeoutRef.current) {
        clearTimeout(mockMessageTimeoutRef.current);
        mockMessageTimeoutRef.current = null; 
      }
      
      mockMessageTimeoutRef.current = setTimeout(() => {
        addNextMockMessage(0);
      }, 1000);

    } else if (selectedMode === 'autonomous' && autonomousWaitingForInput) {
      // In autonomous mode and waiting for user input, replace their input with the predefined response
      // and continue the autonomous flow
      setAutonomousWaitingForInput(false);
      
      // Add the predefined autonomous response
      const autonomousResponse: ChatMessageData = {
        type: 'chat',
        content: "Objective of the campaign is to increase sales for perfumes by 3%. I want to cater to entire audience base with demographic and Affinity bifurcations - feel free to make micro segments. Duration of the campaign is for 7 days from 7th Feb to 14th Feb.",
        isAI: false,
        onAnimationComplete: () => {}
      };
      
      // Replace the user's message with the predefined response
      setMessages(prev => {
        const updatedMessages = [...prev];
        updatedMessages[updatedMessages.length - 1] = autonomousResponse;
        return updatedMessages;
      });
      
      // Continue the autonomous flow from the next message (index 1, since index 0 was the question)
      setTimeout(() => {
        addNextMockMessageRef.current(1);
      }, 1000);
    } else if (selectedMode === 'collaborative' && isMockAgentChatActive) {
      // In collaborative mode and waiting for user input, handle different types of waiting states
      
      // Check if the first message in the collaborative flow is waiting for user input (questionnaire)
      const firstMessage = mockMessagesDefinitionRef.current[0];
      if (firstMessage && firstMessage.waitForUserInput && !firstMessage.isSegmentAgentRationale) {
        // Add the predefined collaborative response for questionnaire
        const collaborativeResponse: ChatMessageData = {
          type: 'chat',
          content: "Objective of the campaign is to increase sales for perfumes by 3%. I want to cater to entire audience base with demographic and Affinity bifurcations - feel free to make micro segments. Duration of the campaign is for 7 days from 7th Feb to 14th Feb.",
          isAI: false,
          onAnimationComplete: () => {}
        };
        
        // Replace the user's message with the predefined response
        setMessages(prev => {
          const updatedMessages = [...prev];
          updatedMessages[updatedMessages.length - 1] = collaborativeResponse;
          return updatedMessages;
        });
        
        // Continue the collaborative flow from the next message (index 1, since index 0 was the question)
        setTimeout(() => {
          addNextMockMessageRef.current(1);
        }, 1000);
      } else {
        // Check if we're waiting for segment agent rationale continuation
        const segmentRationaleMessage = mockMessagesDefinitionRef.current.find(msg => msg.isSegmentAgentRationale);
        const contentRationaleMessage = mockMessagesDefinitionRef.current.find(msg => msg.isContentAgentRationale);

        if ((segmentRationaleMessage || contentRationaleMessage) && (lowerCaseMessage.includes('continue') || lowerCaseMessage.includes('yes') || lowerCaseMessage.includes('ok'))) {
          // Find the index of the segment rationale message and continue from the next one
          const rationaleIndex = segmentRationaleMessage
            ? mockMessagesDefinitionRef.current.findIndex(msg => msg.isSegmentAgentRationale)
            : mockMessagesDefinitionRef.current.findIndex(msg => msg.isContentAgentRationale);
          if (rationaleIndex >= 0) {
            setTimeout(() => {
              addNextMockMessageRef.current(rationaleIndex + 1);
            }, 1000);
          }
        }
      }
    } else {
      // If it's not the start of a mock chat, or mock chat is already active and user sends another message, stop it.
      if (isMockAgentChatActiveRef.current) { // Check the ref here too
        stopMockConversation();
      }
      setMockChatCompleted(false); // Also reset if conversation is stopped manually
      // Proceed with normal message handling or other AI responses
      setTimeout(() => {
        const defaultAIMessage: ChatMessageData = {
            type: 'chat',
            content: "Thank you for your message. I'm processing your request.",
            isAI: true,
            agentName: "AI Assistant",
            avatarBgClass: "bg-gray-100 text-gray-800",
            onAnimationComplete: () => {}
        };
        setMessages(prev => [...prev, defaultAIMessage]);
      }, 1000);
    }
  };

  useEffect(() => {
    const handleAgentStatus = (event: CustomEvent<{
      name: string;
      status: 'join' | 'leave';
      icon: React.ElementType | undefined;
      colorClass: string;
    }>) => {
      setMessages(prev => [...prev, {
        type: 'system',
        content: '',
        agentName: event.detail.name,
        systemType: event.detail.status === 'join' ? 'join' : 'leave',
        agentIcon: event.detail.icon,
        agentColorClass: event.detail.colorClass
      }]);
    };

    window.addEventListener('agentStatusChange' as any, handleAgentStatus as EventListener);
    return () => {
      window.removeEventListener('agentStatusChange' as any, handleAgentStatus as EventListener);
    };
  }, []);

  // Header for the compact widget view
  const WidgetViewHeader = () => (
    <div 
      className={cn(
        "p-4 border-b border-border flex items-center justify-between bg-background/80 backdrop-blur-sm",
        "shadow-header",
        !isExpanded && (isDragging ? "cursor-grabbing" : "cursor-grab")
      )}
      onMouseDown={!isExpanded ? handleDragMouseDown : undefined}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex flex-col min-w-0">
          <div className="h-6 flex items-center">
            {activeAgents.length === 0 && (
              <h1 className="text-base font-semibold text-foreground truncate">Co-marketer</h1>
            )}
            {activeAgents.length === 1 && (() => {
              const agent = activeAgents[0];
              const Icon = agent.icon;
              return (
                <div className="flex items-center gap-2 min-w-0">
                  <Avatar 
                    className={cn(
                      "h-6 w-6 flex items-center justify-center flex-shrink-0",
                      "border-2 border-white",
                      (Icon && !agent.avatarSrc) ? agent.colorClass : 'bg-transparent'
                    )}
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
                      <>
                        <AvatarImage src="/avatarGIF.gif" alt={agent.name} className="h-full w-full object-cover" />
                        <AvatarFallback>{agent.initials}</AvatarFallback>
                      </>
                    )}
                  </Avatar>
                  <span className="text-base font-semibold text-foreground/90 truncate">
                    {agent.name}
                  </span>
                </div>
              );
            })()}
            {activeAgents.length > 1 && (
              <div className="flex items-center gap-2 min-w-0">
                <AvatarStack agents={activeAgents} />
                <span className="text-base font-semibold text-foreground/90 truncate">
                  Multi-agent
                </span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-xs text-muted-foreground whitespace-nowrap">⌥ Option + C / Alt + C</span>
            <span className="border-l border-border h-3 mx-1 flex-shrink-0"></span>
            <p className="text-xs text-muted-foreground whitespace-nowrap">Drag to reposition</p>
          </div>
        </div>
      </div>
      {/* Right side actions: Agent selection, theme toggle, expand, close */}
      <div className="flex items-center space-x-1 flex-shrink-0">
        {onBotIconClick && (
            <Button variant="ghost" size="icon" onClick={onBotIconClick} className="h-7 w-7 text-foreground/60 hover:bg-muted/50 hover:text-foreground/80" aria-label="Select Agents">
                <Users className="h-4 w-4" />
            </Button>
        )}
        
        <ThemeToggle /> {/* ThemeToggle is already a button with appropriate styling */}

        <Button variant="ghost" size="icon" onClick={() => setIsExpanded(true)} className="h-7 w-7 text-foreground/60 hover:bg-muted/50 hover:text-foreground/80" aria-label="Expand">
            <Maximize2 className="h-4 w-4" />
        </Button>
        
        {/* Close button - visible, onClick safely calls prop if provided */}
        <Button variant="ghost" size="icon" onClick={() => onCloseInterface?.()} className="ml-1 h-7 w-7 text-foreground/60 hover:bg-muted/50 hover:text-foreground/80" aria-label="Close">
            <X className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );

  // Header for the expanded view
  const ExpandedViewHeader = () => (
    <div className="p-4 border-b border-border flex items-center justify-between bg-background shadow-sm flex-shrink-0 h-[80px]">
      <div className="flex items-center gap-3">
        <div className="flex flex-col pl-3">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold text-foreground">Co-marketer</h1>
            
            {/* Mode toggle - new tab-like implementation */}
            <div className="flex items-center gap-0 rounded-md border border-border bg-muted p-0.5">
              <TooltipProvider delayDuration={0}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => handleModeSwitch('collaborative')}
                      className={cn(
                        "flex items-center gap-1 px-1.5 py-0.5 rounded-sm text-[0.55rem] font-medium transition-all duration-150",
                        selectedMode === 'collaborative'
                          ? "bg-background text-blue-600 dark:text-blue-400 shadow-sm"
                          : "text-muted-foreground hover:bg-background hover:text-foreground"
                      )}
                    >
                      <Users className="w-2.5 h-2.5" /> {/* Original icon: Users */}
                      Execute
                    </button>
                  </TooltipTrigger>
                  <TooltipContent 
                    side="bottom" 
                    className="bg-black text-white border-black max-w-[200px] text-xs p-2 text-center relative"
                    sideOffset={6}
                  >
                    <div className="absolute top-0 left-1/2 -mt-2 -ml-2 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-b-[8px] border-b-black"></div>
                    <p>Execute mode: Collaborate for full campaign creation and deployment</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => handleModeSwitch('autonomous')}
                      className={cn(
                        "flex items-center gap-1 px-1.5 py-0.5 rounded-sm text-[0.55rem] font-medium transition-all duration-150",
                        selectedMode === 'autonomous'
                          ? "bg-background text-blue-600 dark:text-blue-400 shadow-sm"
                          : "text-muted-foreground hover:bg-background hover:text-foreground"
                      )}
                    >
                      <Zap className="w-2.5 h-2.5" /> {/* Original icon: Zap */}
                      Plan
                    </button>
                  </TooltipTrigger>
                  <TooltipContent 
                    side="bottom" 
                    className="bg-black text-white border-black max-w-[200px] text-xs p-2 text-center relative"
                    sideOffset={6}
                  >
                    <div className="absolute top-0 left-1/2 -mt-2 -ml-2 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-b-[8px] border-b-black"></div>
                    <p>Plan mode: Get comprehensive campaign strategies to implement yourself</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
          <p className="text-xs text-muted-foreground leading-tight">Your assistant for data-driven success</p>
        </div>
      </div>
      <div className="flex items-center space-x-1">
        <Button variant="ghost" className="text-muted-foreground hover:bg-transparent hover:text-muted-foreground">
          <Plus className="w-4 h-4 mr-2" />
          New chat
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="p-1.5 hover:bg-muted rounded-md"
          title="Agents"
          onClick={() => setActiveSidebar(prev => prev === 'agents' ? null : 'agents')}
        >
          <Bot className="w-5 h-5 text-muted-foreground" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="p-1.5 hover:bg-muted rounded-md"
          title="Preferences"
          onClick={() => window.open('https://www.figma.com/proto/PpMyMSpfteIiBlbsBYryx2/Raman-AI---Co-Marketer---Co-Pilot?page-id=5891:1439&node-id=7073-4874&viewport=-442,2798,0.17&t=3ThX3Yd3gjcwJf8j-1&scaling=contain&content-scaling=responsive&starting-point-node-id=7073:4873&hide-ui=1', '_blank')}
        >
          <Settings2 className="w-5 h-5 text-muted-foreground" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="p-1.5 hover:bg-muted rounded-md"
          title="Chat history"
          onClick={() => setActiveSidebar(prev => prev === 'bookmarks' ? null : 'bookmarks')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-muted-foreground">
            <path d="M12 2a10 10 0 0 1 7.38 16.75"></path>
            <path d="M12 6v6l4 2"></path>
            <path d="M2.5 8.875a10 10 0 0 0-.5 3"></path>
            <path d="M2.83 16a10 10 0 0 0 2.43 3.4"></path>
            <path d="M4.636 5.235a10 10 0 0 1 .891-.857"></path>
            <path d="M8.644 21.42a10 10 0 0 0 7.631-.38"></path>
          </svg>
        </Button>
        <Button variant="ghost" size="icon" className="p-1.5 hover:bg-muted rounded-md" title="Toggle theme">
          <ThemeToggle />
        </Button>
        <Button variant="ghost" size="icon" className="p-1.5 hover:bg-muted rounded-md" onClick={() => setIsExpanded(false)} title="Minimize">
          <Minimize2 className="w-5 h-5 text-muted-foreground" />
        </Button>
        <Button variant="ghost" size="icon" className="p-1.5 hover:bg-muted rounded-md" onClick={onCloseInterface} title="Close">
          <X className="w-5 h-5 text-muted-foreground" />
        </Button>
      </div>
    </div>
  );

  // Common props for sidebar components
  interface SidebarProps {
    onClose: () => void; // Function to close the current sidebar
  }

  // Sidebar for Saved Content and Chat History
  const AppSidebar: React.FC<SidebarProps> = ({ onClose }) => {
    // Placeholder data for recent chats - replace with actual data fetching
    const recentChats = [
      { id: "0", chatId: "5341", title: "Template generated", date: "07 April 2025, 05:42 PM" },
      { id: "1", chatId: "2847", title: "Unlock 50% OFF on New Courses! Limited Ti...", date: "02 September 2024, 01:03 PM" },
      { id: "2", chatId: "1629", title: "Grab 50% Discount on New Courses! Start L...", date: "02 September 2024, 01:03 PM" },
    ];

    return (
      <div className="w-[324px] h-full flex flex-col bg-background border-r border-border flex-shrink-0">
        <Tabs defaultValue="chat-history" className="flex flex-col h-full">
          <div className="p-4 flex items-center justify-between border-b border-border">
            <TabsList className="grid grid-cols-2 w-full bg-muted p-1 rounded-md">
              <TabsTrigger value="chat-history" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">Chat history</TabsTrigger>
              <TabsTrigger value="saved-content" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">Bookmarks</TabsTrigger>
            </TabsList>
            <Button variant="ghost" size="icon" onClick={onClose} className="ml-2 hover:bg-muted">
              <X className="w-4 h-4 text-muted-foreground" />
            </Button>
          </div>

          <TabsContent value="chat-history" className="flex-1 overflow-y-auto p-4 flex flex-col">
            <div className="space-y-2">
              <div className="text-xs text-muted-foreground mb-2">last 30 days</div>
              {recentChats.map((chat) => (
                <div key={chat.id} className={cn(
                  "group p-2 rounded-md cursor-pointer flex items-start justify-between",
                  "hover:bg-muted",
                  openChatId === chat.id && "bg-muted"
                )}>
                  <div className="flex-1 min-w-0">
                    <span className="block text-sm text-foreground truncate font-medium">
                      {chat.title}
                    </span>
                    <span className="block text-xs text-muted-foreground mt-0.5">
                      {chat.date}
                    </span>
                  </div>
                  <DropdownMenu open={openChatId === chat.id} onOpenChange={(open) => setOpenChatId(open ? chat.id : null)}>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => e.stopPropagation()}
                        className="h-5 w-5 opacity-0 group-hover:opacity-100 hover:bg-transparent"
                        aria-label="Chat options"
                      >
                        <MoreVertical className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                      <DropdownMenuItem onClick={() => handleCopyChatId(chat.chatId)} className="hover:bg-muted hover:text-foreground focus:bg-muted focus:text-foreground">
                        Copy chat ID
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleShareChat} className="hover:bg-muted hover:text-foreground focus:bg-muted focus:text-foreground">
                        Share chat
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleDeleteChat} className="text-red-600 hover:bg-muted hover:text-red-600 focus:bg-muted focus:text-red-600">
                        Delete chat
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
              {recentChats.length === 0 && (
                   <p className="text-xs text-muted-foreground italic text-center pt-10">No chat history yet.</p>
              )}
            </div>

            {/* Dev Options Panel - Aligned to bottom */}
            <div className="mt-auto pt-4 border-t border-border">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-medium text-foreground font-mono">&lt;dev_options&gt;</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleDevOptions}
                  className={cn(
                    "h-6 w-6 p-0 hover:bg-muted",
                    showDevOptions && "bg-muted"
                  )}
                  title="Toggle Dev Panel"
                >
                  <Settings2 className="h-3 w-3 text-muted-foreground" />
                </Button>
              </div>
              
              {showDevOptions && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <label htmlFor="disable-animation" className="text-xs font-medium text-foreground">
                        Disable Animation
                      </label>
                      <span className="text-[10px] text-muted-foreground">
                        Messages load instantly
                      </span>
                    </div>
                    <Switch
                      id="disable-animation"
                      checked={disableAnimation}
                      onCheckedChange={handleDisableAnimationToggle}
                      className="scale-75"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <label htmlFor="disable-content-accordion" className="text-xs font-medium text-foreground">
                        Disable old content accordion
                      </label>
                      <span className="text-[10px] text-muted-foreground">
                        Hides legacy accordion only
                      </span>
                    </div>
                    <Switch
                      id="disable-content-accordion"
                      checked={disableContentAccordion}
                      onCheckedChange={handleDisableContentAccordionToggle}
                      className="scale-75"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <label htmlFor="prompt-template-exists" className="text-xs font-medium text-foreground">
                        Prompt Template Exists
                      </label>
                      <span className="text-[10px] text-muted-foreground">
                        Enabling this shows pre-made prompt templates in content agent response
                      </span>
                    </div>
                    <Switch
                      id="prompt-template-exists"
                      checked={promptTemplateExists}
                      onCheckedChange={handlePromptTemplateExistsToggle}
                      className="scale-75"
                    />
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
          <TabsContent value="saved-content" className="flex-1 overflow-y-auto p-4">
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground pt-16">
              <div className="relative mb-4">
                <Bookmark className="w-20 h-20 text-gray-300" />
                <div className="absolute -top-1 -right-1 bg-background p-1 rounded-full shadow-md">
                  <PlusCircle className="w-8 h-8 text-blue-500" />
                </div>
              </div>
              <p className="text-sm font-semibold">Nothing bookmarked yet</p>
              <p className="text-xs text-center mt-1">Save content from your chats to find it easily later.</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    );
  };

  // Props for the AgentsSidebar, extending common SidebarProps
  interface AgentsSidebarProps extends SidebarProps {
    enabledAgents: Set<string>;
    onAgentToggle: (agentId: string) => void;
  }

  // Sidebar for managing Marketing Agents
  const AgentsSidebar: React.FC<AgentsSidebarProps> = ({ onClose, enabledAgents, onAgentToggle }) => {
    return (
      <div className="w-[324px] h-full flex flex-col bg-background border-r border-border flex-shrink-0">
        <div className="px-4 py-2 border-b border-border flex items-center justify-between">
          <h2 className="text-base font-medium text-foreground">Marketing agents</h2>
          <Button variant="ghost" size="icon" onClick={onClose} className="hover:bg-muted">
             <X className="w-4 h-4 text-muted-foreground" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
          {marketingAgents.map((agent) => {
            const Icon = agent.icon;
            const isEnabled = enabledAgents.has(agent.id);
            return (
              <div key={agent.id} className="flex items-start gap-4 p-3 rounded-lg border border-border bg-card transition-colors hover:bg-muted/50">
                 <div className="mt-1 flex-shrink-0 w-10 h-10"> {/* Simplified container for positioning */} 
                  {/* Priority: avatarSrc (SVG) > Icon (Lucide) > GIF fallback */}
                  {agent.avatarSrc ? (
                    <Avatar className="h-full w-full rounded-lg"> {/* Squircle shape on Avatar */}
                      <AvatarImage src={agent.avatarSrc} alt={agent.name} className="object-cover" />
                      <AvatarFallback>{agent.initials}</AvatarFallback>
                    </Avatar>
                  ) : Icon ? (
                    <div className={cn(
                       "p-2 rounded-lg flex items-center justify-center h-full w-full", 
                       agent.colorClass?.replace('dark:', '') // Safely access colorClass
                      )}
                    >
                       <Icon className="w-5 h-5" />
                    </div>
                  ) : (
                    // Fallback for agents without avatarSrc or icon
                    <Avatar className="h-full w-full rounded-lg"> {/* Squircle shape on Avatar */}
                      <AvatarImage src="/avatarGIF.gif" alt={agent.name} className="object-cover" />
                      <AvatarFallback>{agent.initials}</AvatarFallback>
                    </Avatar>
                  )}
                 </div>
                 <div className="flex-1 min-w-0">
                   <div className="flex items-center justify-between">
                     <h3 className="font-semibold text-sm text-card-foreground truncate">{agent.name}</h3>
                     {agent.id === "co-marketer" ? (
                       <>
                         {/* Switch for Co-marketer intentionally removed as per request */}
                       </>
                     ) : (
                       <Switch
                         checked={isEnabled}
                         onCheckedChange={() => onAgentToggle(agent.id)}
                         aria-label={`Toggle ${agent.name}`}
                       />
                     )}
                   </div>
                   <p className="text-xs text-muted-foreground mt-1">{agent.description}</p>
                 </div>
               </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Mode Switch Confirmation Popup */}
      <ModeSwitchConfirmation
        isOpen={showModeSwitchConfirmation}
        onConfirm={confirmModeSwitch}
        onCancel={cancelModeSwitch}
        targetMode={pendingMode || 'collaborative'}
      />
      
      {/* Overlay for expanded view background, click to minimize */}
      {isExpanded && <div className="fixed inset-0 z-40 bg-black/10 backdrop-blur-sm" onClick={() => setIsExpanded(false)}></div>}

      {/* 
        Main container: Switches between expanded and widget styles.
        NOTE: \`overflow-hidden\` is crucial here in conjunction with \`rounded-xl\` 
        to ensure child elements (like the header) are clipped by the parent's border radius.
      */}
      <div 
        ref={chatWindowRef} // Attach ref here
        className={cn(
          isExpanded
            ? "fixed z-50 inset-0 m-auto w-[1416px] max-w-[95vw] h-[776px] max-h-[90vh] bg-background border border-border shadow-2xl rounded-xl flex flex-col overflow-hidden"
            // For widget view, if position is null, it uses these classes. If position is set, inline style takes over for pos.
            : "w-[470px] h-[776px] bg-background border border-border shadow-lg rounded-xl flex flex-col overflow-hidden",
            !isExpanded && position && "fixed z-50" // Ensure it's fixed and on top when dragged
        )}
        style={!isExpanded && position ? {
            top: `${position.y}px`,
            left: `${position.x}px`,
            width: '470px', // Keep width/height consistent
            height: '776px',
        } : {}}
      >
        {/* Conditional rendering of header based on view mode */}
        {isExpanded ? (
          <ExpandedViewHeader />
        ) : (
          <WidgetViewHeader />
        )}

        {/* Main content area: Layout changes based on view mode */}
        <div className={cn(
          "flex flex-1 overflow-hidden",
          isExpanded ? "flex-row" : "flex-col"
        )}>
          {/* Conditional rendering of AppSidebar (Bookmarks/History) in expanded view */}
          {isExpanded && activeSidebar === 'bookmarks' && (
            <AppSidebar onClose={() => setActiveSidebar(null)} />
          )}
          {/* Conditional rendering of AgentsSidebar in expanded view */}
          {isExpanded && activeSidebar === 'agents' && (
            <AgentsSidebar
              onClose={() => setActiveSidebar(null)}
              enabledAgents={enabledAgents}
              onAgentToggle={handleAgentToggle}
            />
          )}

          {/* Chat messages and input area */}
          <div className={cn(
            "flex flex-col flex-1",
            isExpanded ? "overflow-hidden" : "overflow-hidden"
          )}>
            <div
              className={cn(
                "relative z-0 flex-1 flex flex-col overflow-y-auto scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent",
                isExpanded ? "p-6" : "p-4"
              )}
              ref={chatContainerRef}
            >
              <div className="mt-auto space-y-4">
                {messages.length === 0 && (
                  <div className="flex gap-3">
                    <Avatar className="w-10 h-10">
                      <AvatarImage
                        src="/AgentIcons/Co-Marketer.svg"
                        alt="Co-marketer"
                      />
                      <AvatarFallback className="bg-gray-200 text-gray-600">CM</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-foreground/90 mb-4 text-sm">Hello! Try these suggestions or just type in a few key words to get started!</p>
                      {selectedMode === 'collaborative' ? [
                        "Help me create a campaign for valentine\'s day",
                        "Find the top 5 and bottom 5 campaigns in the last 30 days. Show success rates and patterns behind high and low performance.",
                        "Tell me the best time slots to send campaigns on APN, WPN, Email, SMS, and WhatsApp for higher engagement.",
                      ].map((suggestion, index) => (
                        <Card
                          key={index}
                          className="p-4 mb-3 bg-primary-foreground border border-border rounded-md hover:shadow-md cursor-pointer transition-shadow duration-150 hover:bg-muted"
                          onClick={() => handleSendMessage(suggestion)}
                        >
                          <p className="text-primary text-sm">{suggestion}</p>
                        </Card>
                      )) : [
                        "Can you help me create a valentine's day campaign for perfumes",
                        "Find the top 5 and bottom 5 campaigns in the last 30 days. Show success rates and patterns behind high and low performance.",
                        "Tell me the best time slots to send campaigns on APN, WPN, Email, SMS, and WhatsApp for higher engagement.",
                      ].map((suggestion, index) => (
                        <Card
                          key={index}
                          className="p-4 mb-3 bg-primary-foreground border border-border rounded-md hover:shadow-md cursor-pointer transition-shadow duration-150 hover:bg-muted"
                          onClick={() => handleSendMessage(suggestion)}
                        >
                          <p className="text-primary text-sm">{suggestion}</p>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {messages.map((message, index) => (
                  message.type === 'system' ? (
                    <SystemMessage
                      key={index}
                      type={message.systemType || 'join'}
                      agentName={message.agentName || ''}
                      agentIcon={message.agentIcon}
                      agentColorClass={message.agentColorClass}
                    />
                  ) : (
                    <ChatMessage
                      key={index}
                      messageId={`msg-${index}`}
                      isAI={message.isAI ?? false}
                      content={message.content}
                      agentName={message.agentName}
                      avatarSrc={message.avatarSrc}
                      avatarIcon={message.avatarIcon}
                      avatarBgClass={message.avatarBgClass}
                      animate={disableAnimation ? false : message.animate}
                      animationSpeed={message.animationSpeed}
                      isLastMessage={index === messages.length - 1}
                      showExecuteFlowCTA={
                        index === messages.length - 1 &&
                        mockChatCompleted &&
                        message.agentName === "Co-marketer" &&
                        message.content.startsWith("Here's a summary of what our team has put together:") &&
                        !isMockAgentChatActive
                      }
                      onExecuteFlow={handleFlowExecutionMessage}
                      isContentAgent={message.isContentAgent}
                      isContentAgentClarification={message.isContentAgentClarification}
                      isContentAgentQuestionChoice={message.isContentAgentQuestionChoice}
                      isFlowExecutionProgress={message.isFlowExecutionProgress}
                      onFlowExecutionComplete={message.onFlowExecutionComplete}
                      isPlanMode={message.isPlanMode}
                      isSegmentAccordion={message.isSegmentAccordion}
                      isSchedulerAccordion={message.isSchedulerAccordion}
                      isSegmentAgentRationale={message.isSegmentAgentRationale}
                      isContentAgentRationale={message.isContentAgentRationale}
                      isExecutiveSummaryWithContent={message.isExecutiveSummaryWithContent}
                      onContinueSegment={() => {
                        if (message.isSegmentAgentRationale) {
                          const idx = mockMessagesDefinitionRef.current.findIndex(msg => msg.isSegmentAgentRationale);
                          if (idx >= 0) addNextMockMessageRef.current(idx + 1);
                        } else if (message.isContentAgentRationale) {
                          const idx = mockMessagesDefinitionRef.current.findIndex(msg => msg.isContentAgentRationale);
                          if (idx >= 0) addNextMockMessageRef.current(idx + 1);
                        }
                      }}
                      onRefineThis={() => {
                        if (message.isContentAgentRationale) {
                          // Find the ContentAgentClarification message and add it after the current rationale
                          const clarificationMessage = mockMessagesDefinitionRef.current.find(msg => msg.isContentAgentClarification);
                          const contentAgent = marketingAgents.find(agent => agent.id === 'content-agent');
                          if (clarificationMessage) {
                            // Add the clarification message as a new message with proper avatar
                            setMessages(prevMessages => [...prevMessages, {
                              ...clarificationMessage,
                              avatarSrc: contentAgent?.avatarSrc,
                              avatarIcon: contentAgent?.icon,
                              avatarBgClass: contentAgent?.colorClass,
                              animate: true,
                              onAnimationComplete: () => {}
                            }]);
                          }
                        }
                      }}
                      onAnswerQuestions={() => {
                        if (message.isContentAgentQuestionChoice) {
                          const idx = mockMessagesDefinitionRef.current.findIndex(msg => msg.isContentAgentQuestionChoice);
                          if (idx >= 0) addNextMockMessageRef.current(idx + 1);
                        }
                      }}
                      onSkipAndGenerate={() => {
                        if (message.isContentAgentQuestionChoice) {
                          const idx = mockMessagesDefinitionRef.current.findIndex(msg => msg.isContentAgentQuestionChoice);
                          // Skip to rationale message (idx + 2 to skip the clarification message)
                          if (idx >= 0) addNextMockMessageRef.current(idx + 2);
                        }
                      }}
                      onGenerateContent={() => {
                        if (message.isContentAgentClarification) {
                          setContentGenerated(true);
                          // Find the index of the clarification message in the mock messages
                          const clarificationIndex = mockMessagesDefinitionRef.current.findIndex(msg => msg.isContentAgentClarification);
                          if (clarificationIndex >= 0) {
                            // Continue the flow from the next message after clarification
                            addNextMockMessageRef.current(clarificationIndex + 1);
                          }
                        }
                      }}
                      showGenerateContentCTA={
                        index === messages.length - 1 &&
                        message.isContentAgentClarification &&
                        !contentGenerated
                      }
                      showQuestionChoiceCTAs={
                        index === messages.length - 1 &&
                        message.isContentAgentQuestionChoice &&
                        !contentGenerated
                      }
                      showApproveContentCTA={
                        index === messages.length - 1 &&
                        message.isContentAgent &&
                        !contentApproved
                      }
                      onApproveContent={handleApproveContent}
                      showApproveSegmentsCTA={
                        index === messages.length - 1 &&
                        message.agentName === 'Segment agent' &&
                        message.content.includes('<table') &&
                        !segmentsApproved
                      }
                      onApproveSegments={handleApproveSegments}
                      onUpdateContent={handleUpdateContent}
                      onDiscardChanges={handleDiscardChanges}
                      updatedContent={message.updatedContent}
                      onAnimationComplete={message.onAnimationComplete}
                      promptTemplateExists={promptTemplateExists}
                    />
                  )
                ))}
                <div ref={messagesEndRef} />
              </div>
            </div>



            <div className={cn(
              "bg-background border-t border-border shadow-footer backdrop-blur-sm flex-shrink-0",
              isExpanded ? "p-6" : "h-[82px] px-4 py-5"
            )}>
              <ChatInput
                onSend={handleSendMessage}
                isMockAgentChatActive={isMockAgentChatActive}
                onStopMockConversation={stopMockConversation}
                isQuestionnaireActive={(() => {
                  const lastMessage = messages[messages.length - 1];
                  
                  // If the last message is a content agent response, input should be enabled
                  if (lastMessage?.isContentAgent) {
                    return false; // Content agent response phase - input enabled
                  }
                  
                  // Check if we're currently in the clarification phase (questionnaire form)
                  if (lastMessage?.isContentAgentClarification) {
                    return true; // Currently filling out questionnaire - input disabled
                  }
                  
                  // Check if we're in rationale phase (creative proposal)
                  if (lastMessage?.isContentAgentRationale) {
                    // Rationale phase is a response phase, not an input phase
                    // User should be able to type messages during creative proposals
                    return false; // Input enabled during rationale phase
                  }
                  
                  // All other cases - input enabled
                  return false;
                })()}
              />
            </div>
          </div>
        </div>
      </div>


    </>
  );
};

export default ChatInterface;
