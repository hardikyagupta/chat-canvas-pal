import React, { useEffect, useLayoutEffect, useState, useRef, useMemo, useCallback } from 'react';
// Lucide icons for various UI elements
import { MoreHorizontal, Maximize2, Plus, X, Bot, Minimize2, Bookmark, PlusCircle, PanelLeftOpen, PanelLeftClose, Settings2, MessageSquare, MessageSquarePlus, Users, Trash2, Info, ChevronDown, StopCircle, MoreVertical, ArrowDown, Menu } from 'lucide-react';
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
import LhsSidebar, { defaultChats } from './LhsSidebar';
import ChatListPage from './ChatListPage';
import RhsHeader from './RhsHeader';
import RotatingWord from './RotatingWord';
import { GradientShimmer } from 'gradient-shimmer';
import MinViewLhsOverlay from './MinViewLhsOverlay';
import ArtifactPreview from './ArtifactPreview';
import LineNav, { LineNavItem } from './LineNav';
import FeedbackModal, { FeedbackSentiment } from './FeedbackModal';
import { ThumbsUp, ThumbsDown, CheckCircle2 } from 'lucide-react';
import { playResponseCue, playToggleCue, playExpandCue } from '@/lib/playCue';
import { ContentAgentSegmentAccordions } from './ContentAgentSegmentAccordions';
import GeneratingLoader from './GeneratingLoader';
import { BorderBeam } from 'border-beam';
import { welcomeCardBeamStyleBlock } from './welcomeCardBeamStyles';


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
  // Thinking state specific
  isThinkingState?: boolean;
  thinkingDuration?: number;
  reasoningSteps?: string[];
  // Doc-like artifact
  artifact?: { title: string; subtitle?: string; intro?: string };
  // Inline campaign performance dashboard escape hatch
  hidePerformanceDashboard?: boolean;
  // Short title used by the vertical line-nav (only meaningful on user turns)
  navLabel?: string;
  // Lightweight per-message graphics for follow-up answers (visual parity)
  statCards?: { label: string; value: string; sub?: string }[];
  miniChart?: 'delivery' | 'rates';
}

// Props for the main ChatInterface component
interface ChatInterfaceProps {
  onBotIconClick?: () => void; // Handler for agent selection overlay toggle in widget view
  enabledAgents: Set<string>;
  setEnabledAgents: React.Dispatch<React.SetStateAction<Set<string>>>;
  onCloseInterface?: () => void; // Handler to close the entire chat interface
}

// Rotating example topics shown in the empty-state greeting slot animation
const GREETING_TOPICS = [
  'Campaign performance',
  'Revenue trends',
  'Journey drop-offs',
  'Audience behavior',
  'Channel anomalies',
  'Conversion opportunities',
];

// Bookmarked chats — the saved subset of the chat list
const bookmarkedChats = defaultChats.filter((c) => ['2', '5', '8', '11', '17'].includes(c.id));

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
};

// --- Performance "story" -------------------------------------------------
// Whatever the user types, the conversation is anchored to a single coherent
// narrative so the input prompt and the charted output read as one story that
// ties directly to the info tiles and charts in the performance dashboard.
const STORY_PROMPT =
  "We just wrapped our mid-June push — 50 campaigns across 6 channels between June 8 and 19. Everyone keeps telling me it “did well,” but I need the real story: how many messages actually reached people, where we’re losing the audience, and which channels turned attention into revenue. Walk me through it.";

// The intro line (before the first \n\n) renders above the metric tiles; each
// <strong> line is a standalone section header (never inline) so the block
// splitter renders clean paragraphs. Numbers live in the tiles/charts.
const STORY_OUTPUT =
  "Here’s the full story of your June 8–19 push — 50 campaigns across 6 channels, with one clear plot line: we earned plenty of attention, but most of it slips away before it becomes revenue.\n\n" +
  "<strong>The headline</strong>\n\nWe published 1.12M messages and delivered 589K of them — about a 52.5% delivery rate. Those reached audiences produced 5,016 clicks, 590 conversions, and ₹24.3L in revenue. A strong top of funnel, but a thin bottom.\n\n" +
  "<strong>Chapter 1 — Where the audience leaks</strong>\n\nDelivery is the first crack. WhatsApp carried the volume at 510K published but only 195K landed — we lost more than 60% before a single customer saw the message, and RCS and BPN tell the same story. The bright spots are Email, which delivered all 52K it sent, and APN at 47K of 57K. The first chart below makes the gap clear.\n\n" +
  "<strong>Chapter 2 — Where attention stalls</strong>\n\nAmong the messages that did land, WhatsApp leads on engagement at a 1.41% click rate, with SMS close behind. But conversion collapses across the board — Email clicks at 0.97% yet converts just 0.02%, and BPN converts almost no one. People are clicking; the journey after the click isn’t closing.\n\n" +
  "<strong>How the story ends</strong>\n\nJune wasn’t an attention problem — it was a delivery and conversion problem. Recover WhatsApp, RCS and BPN delivery and we widen reach without spending more; tighten the post-click experience on Email and we convert traffic we already have. Two levers, both ready for the next chapter.";

// Short nav label for the opening story turn (shown in the vertical line-nav).
const STORY_NAV_LABEL = "June 8–19 recap";

// Suggested follow-up prompts shown under the first output. Tapping any one
// starts thread 2 (the follow-up drill-down). Mix of short and longer phrasings.
const SUGGESTED_PROMPTS = [
  "Why is WhatsApp delivery only ~38%?",
  "What's the single biggest fix before the next send?",
  "If we recover WhatsApp delivery, what's the realistic upside?",
  "Draft the next-cycle plan I can share with the team",
];

// --- Follow-up "chapter 2" thread ---------------------------------------
// After the story, the user's next message auto-plays this scripted batch of
// follow-up Q&A that drills deeper into the same June campaign data. Each
// question becomes a navigable turn in the line-nav. FOLLOWUPS[0] is shown as
// the user's own bubble; the rest are generated as the conversation unfolds.
type StatCard = { label: string; value: string; sub?: string };
const FOLLOWUPS: { label: string; q: string; a: string; statCards?: StatCard[]; miniChart?: 'delivery' | 'rates' }[] = [
  {
    label: "WhatsApp delivery",
    q: "WhatsApp delivery looks brutal — only 195K of 510K landed. Why is it leaking that badly?",
    a:
      "<strong>Why WhatsApp delivery is only ~38%</strong>\n\nIt isn’t one failure — three issues stack up:\n• Stale opt-ins — much of the 510K hadn’t been messaged in 90+ days, so Meta drops them as inactive.\n• Template quality — two high-volume templates fell to a “Medium” rating after blocks, which throttles delivery.\n• Marketing caps — we hit the per-user limit for part of the list, so those sends were never attempted.\n\nIt never shows as a hard failure; it just surfaces as the gap between published and delivered, shown below.",
    statCards: [
      { label: "WhatsApp published", value: "510K", sub: "most of any channel" },
      { label: "Delivered", value: "195K", sub: "~38% delivery rate" },
      { label: "Lost in delivery", value: "315K", sub: "never reached" },
    ],
    miniChart: 'delivery',
  },
  {
    label: "Biggest fix",
    q: "If we could fix only one thing before the next send, what’s the single biggest lever?",
    a:
      "<strong>Fix delivery before anything else</strong>\n\nEngagement isn’t the problem — among messages that land, WhatsApp clicks at 1.41%, the best of any channel. The issue is that 60%+ never arrive.\n\nThe highest-ROI move is a list-hygiene and template pass on WhatsApp: suppress inactive numbers, replace the Medium-rated templates with fresh ones, and stagger sends under the marketing cap. It recovers reach we already paid to publish — at no extra cost.",
    statCards: [
      { label: "WhatsApp click rate", value: "1.41%", sub: "best of all channels" },
      { label: "Delivery gap", value: "62%", sub: "the real bottleneck" },
      { label: "Added spend to fix", value: "₹0", sub: "hygiene, not budget" },
    ],
  },
  {
    label: "Quantify upside",
    q: "Quantify it for me — if we recover WhatsApp delivery, what’s the upside?",
    a:
      "<strong>The upside, in round numbers</strong>\n\nWhatsApp delivers 195K today (~38%). Email proves a clean list can reach ~100% and APN already runs ~82%, so a realistic post-cleanup target is 70% delivery.\n\nThat lifts delivered volume to roughly 357K — about 162K more customers reached. At WhatsApp’s current click and conversion rates that’s ~2,280 more clicks and ~400 more conversions: a ~68% lift, with no added send cost.",
    statCards: [
      { label: "Delivered (target)", value: "~357K", sub: "from 195K" },
      { label: "Extra reach", value: "+162K", sub: "more customers" },
      { label: "Extra clicks", value: "~2,280", sub: "at 1.41% CTR" },
      { label: "Extra conversions", value: "~400", sub: "+68% on WhatsApp" },
    ],
  },
  {
    label: "Next-cycle plan",
    q: "Good. Draft the plan for the next cycle so I can share it with the team.",
    a:
      "<strong>Next-cycle plan — June recovery</strong>\n\nWhatsApp is the priority: scrub inactive numbers, swap the Medium-rated templates for High-rated ones, and stagger sends to target 70% delivery. For Email, delivery is already ~100% — the leak is post-click, so A/B test landing pages and tighten the offer-to-page match. RCS and BPN get the same hygiene playbook, since both lose ~60% in delivery.\n\nThe goal: recover ~162K in WhatsApp reach and lift conversions without increasing spend. I’ll prep the send calendar once you approve.",
    statCards: [
      { label: "Delivery target", value: "70%", sub: "from ~38%" },
      { label: "Reach recovered", value: "+162K", sub: "no extra send" },
      { label: "Added spend", value: "₹0", sub: "hygiene-driven" },
    ],
  },
];

const ChatInterface: React.FC<ChatInterfaceProps> = ({ onBotIconClick, enabledAgents, setEnabledAgents, onCloseInterface }) => {
  const [messages, setMessages] = useState<ChatMessageData[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [isMockAgentChatActive, setIsMockAgentChatActive] = useState(false);
  // Briefly shimmers the input after every send (survives the empty→conversation input swap)
  const [inputShimmer, setInputShimmer] = useState(false);
  const inputShimmerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [mockChatCompleted, setMockChatCompleted] = useState(false); // New state
  // Shows the suggested follow-up chips after the first output completes (until thread 2 starts)
  const [showSuggestions, setShowSuggestions] = useState(false);
  // End-of-conversation feedback: floating prompt → modal (up/down) → success toast
  const [showFeedbackPrompt, setShowFeedbackPrompt] = useState(false);
  const [feedbackModal, setFeedbackModal] = useState<FeedbackSentiment | null>(null);
  const [showFeedbackToast, setShowFeedbackToast] = useState(false);
  const feedbackToastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleFeedbackSubmit = () => {
    setFeedbackModal(null);
    setShowFeedbackPrompt(false);
    setShowFeedbackToast(true);
    if (feedbackToastTimerRef.current) clearTimeout(feedbackToastTimerRef.current);
    feedbackToastTimerRef.current = setTimeout(() => setShowFeedbackToast(false), 3000);
  };

  const resetFeedback = () => {
    setShowFeedbackPrompt(false);
    setFeedbackModal(null);
    setShowFeedbackToast(false);
    if (feedbackToastTimerRef.current) clearTimeout(feedbackToastTimerRef.current);
  };
  const [isGeneratingOutput, setIsGeneratingOutput] = useState(false); // Drives the persistent bottom-of-thread loader
  const [contentApproved, setContentApproved] = useState(false); // New state for content approval
  const [segmentsApproved, setSegmentsApproved] = useState(false); // New state for segments approval
  const [contentGenerated, setContentGenerated] = useState(false); // New state for content generation
  const mockMessageTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMockAgentChatActiveRef = useRef(isMockAgentChatActive);
  // True while the performance "story" flow is running, so re-typing restarts the
  // story instead of being captured by the Valentine collaborative continuation path.
  const isStoryFlowActiveRef = useRef(false);
  // Which "act" of the performance story the conversation is on: the opening
  // recap runs first, then the next message auto-plays the follow-up batch.
  const hasRunStoryRef = useRef(false);
  const hasRunFollowupsRef = useRef(false);
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
  const [selectedStarterChip, setSelectedStarterChip] = useState<string | null>(null);
  const starterChips = [
    "Seasonal Trend",
    "CTR Monitoring",
    "QBR Report",
    "Channel Anomalies",
    "Revenue Monitoring",
  ];
  const starterPromptsByChip: Record<string, string[]> = {
    "Seasonal Trend": [
      "Show me seasonal engagement trends across channels for the last 12 months.",
      "Which campaigns performed best during festival periods, and why?",
      "What seasonal patterns should we use for next quarter planning?",
    ],
    "CTR Monitoring": [
      "Which campaigns had the highest CTR but lowest conversions, and what could be the possible reasons?",
      "Find the top 5 and bottom 5 campaigns in the last 30 days. Show success rates and patterns behind high and low performance.",
      "Tell me the best time slots to send campaigns on APN, WPN, Email, SMS, and WhatsApp for higher engagement.",
    ],
    "QBR Report": [
      "Summarize this quarter's campaign performance with wins, gaps, and next actions.",
      "Build a QBR snapshot by channel with CTR, CVR, and revenue trends.",
      "Highlight top opportunities and risks for next quarter's campaign plan.",
    ],
    "Channel Anomalies": [
      "Detect unusual drops or spikes in campaign performance by channel in the last 30 days.",
      "Which channels show anomaly patterns in delivery, CTR, or conversion rates?",
      "Suggest likely reasons and next checks for identified channel anomalies.",
    ],
    "Revenue Monitoring": [
      "Which campaigns contributed the most revenue in the last 30 days?",
      "Show revenue trends by channel with week-over-week changes.",
      "Identify low-efficiency campaigns with high spend but low revenue impact.",
    ],
  };
  // Contextual header shown above the suggested prompts for the selected category
  const starterPromptHeaderByChip: Record<string, string> = {
    "Seasonal Trend": "Explore seasonal trends",
    "CTR Monitoring": "Monitor click-through performance",
    "QBR Report": "Build your QBR report",
    "Channel Anomalies": "Investigate channel anomalies",
    "Revenue Monitoring": "Track revenue performance",
  };

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
  // Collapsed (icon-rail) state for the LHS sidebar in expanded view.
  // A single sidebar component animates its own width + label opacity, so there is
  // no component swap and no position jump between the two states.
  const [lhsCollapsed, setLhsCollapsed] = useState(false);
  // RHS page: the default conversation view, or the full Chats / Bookmarks list page
  const [activePage, setActivePage] = useState<'home' | 'chats' | 'bookmarks'>('home');
  // Minimized-view LHS overlay (opened from the widget header menu icon)
  const [showMinOverlay, setShowMinOverlay] = useState(false);
  // Artifact preview split-view (opened from a message's "Preview" button)
  const [showArtifactPreview, setShowArtifactPreview] = useState(false);
  const [artifactFullExpanded, setArtifactFullExpanded] = useState(false);
  const [artifactClosing, setArtifactClosing] = useState(false); // exit-animation flag
  const hasOpenedArtifactRef = useRef(false);
  const artifactCloseTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleOpenArtifactPreview = () => {
    if (artifactCloseTimerRef.current) clearTimeout(artifactCloseTimerRef.current);
    setArtifactClosing(false);
    setShowArtifactPreview(true);
    setArtifactFullExpanded(false);
    // First time a user previews, collapse the LHS to give room
    if (!hasOpenedArtifactRef.current) {
      hasOpenedArtifactRef.current = true;
      setLhsCollapsed(true);
    }
  };

  const handleCloseArtifactPreview = () => {
    // Play the slide-out/fade exit before unmounting
    setArtifactClosing(true);
    if (artifactCloseTimerRef.current) clearTimeout(artifactCloseTimerRef.current);
    artifactCloseTimerRef.current = setTimeout(() => {
      setShowArtifactPreview(false);
      setArtifactFullExpanded(false);
      setArtifactClosing(false);
    }, 320);
  };

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

  // Chat name shown in the header — derived from the first user turn, kept short.
  const chatName = useMemo(() => {
    const firstUser = messages.find(m => m.type === 'chat' && !m.isAI);
    const raw = (firstUser?.navLabel || firstUser?.content || '').trim();
    if (!raw) return null;
    const MAX = 32;
    return raw.length > MAX ? `${raw.slice(0, MAX).trimEnd()}…` : raw;
  }, [messages]);

  // The live conversation shows up as the top "active" chat in the LHS list.
  const CURRENT_CHAT_ID = '__current__';
  const lhsChats = useMemo(() => {
    if (messages.length === 0) return defaultChats;
    return [{ id: CURRENT_CHAT_ID, title: chatName || 'New chat', time: 'now' }, ...defaultChats];
  }, [messages.length, chatName]);
  const activeLhsChatId = messages.length > 0 ? CURRENT_CHAT_ID : null;
  // Pulse the active chat while it is still generating output.
  const busyLhsChatId =
    messages.length > 0 && (isGeneratingOutput || isMockAgentChatActive) ? CURRENT_CHAT_ID : null;

  // One line-nav entry per user turn, anchored to its message div (msg-<index>).
  const navItems: LineNavItem[] = useMemo(() => {
    return messages
      .map((m, index) => ({ m, index }))
      .filter(({ m }) => m.type === 'chat' && !m.isAI)
      .map(({ m, index }) => ({
        id: `msg-${index}`,
        label: m.navLabel || (m.content.length > 28 ? `${m.content.slice(0, 28)}…` : m.content),
      }));
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    setShowScrollButton(false); // Hide button after scrolling
  };

  // Detect if user is near bottom of chat and show/hide scroll button
  useEffect(() => {
    const chatContainer = chatContainerRef.current;
    if (!chatContainer) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = chatContainer;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      setShowScrollButton(!isNearBottom);
    };

    chatContainer.addEventListener('scroll', handleScroll);
    
    return () => chatContainer.removeEventListener('scroll', handleScroll);
  }, []);

  // Monitor content changes and show scroll button when content overflows
  useEffect(() => {
    const chatContainer = chatContainerRef.current;
    if (!chatContainer) return;

    const checkScrollButton = () => {
      const { scrollTop, scrollHeight, clientHeight } = chatContainer;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      
      // Show button if content exceeds viewport and user is not at bottom
      if (scrollHeight > clientHeight && !isNearBottom) {
        setShowScrollButton(true);
      } else if (isNearBottom) {
        setShowScrollButton(false);
      }
    };

    // Use MutationObserver to detect when content changes (including typing animation)
    const observer = new MutationObserver(() => {
      checkScrollButton();
    });

    // Observe the messages container for any changes
    const messagesContainer = chatContainer.querySelector('.space-y-4');
    if (messagesContainer) {
      observer.observe(messagesContainer, {
        childList: true,
        subtree: true,
        characterData: true,
        attributes: false
      });
    }

    // Also check on initial messages load
    checkScrollButton();

    return () => {
      observer.disconnect();
    };
  }, [messages]);

  // Stop the input shimmer (output generation ended / was stopped).
  const clearInputShimmer = () => {
    if (inputShimmerTimerRef.current) clearTimeout(inputShimmerTimerRef.current);
    setInputShimmer(false);
  };

  const stopMockConversation = () => {
    setIsMockAgentChatActive(false);
    isStoryFlowActiveRef.current = false;
    setIsGeneratingOutput(false);
    clearInputShimmer();
    if (mockMessageTimeoutRef.current) {
      clearTimeout(mockMessageTimeoutRef.current);
      mockMessageTimeoutRef.current = null;
    }
  };

  // Resets the RHS to its default empty state so the user can start a fresh chat.
  const handleNewChat = () => {
    stopMockConversation();
    hasRunStoryRef.current = false;
    hasRunFollowupsRef.current = false;
    setActivePage('home');
    setMessages([]);
    setShowSuggestions(false);
    resetFeedback();
    setMockChatCompleted(false);
    setContentApproved(false);
    setContentGenerated(false);
    setAutonomousWaitingForInput(false);
    setSelectedStarterChip(null);
    setShowMinOverlay(false);
    // Tear down the artifact preview split-view
    if (artifactCloseTimerRef.current) {
      clearTimeout(artifactCloseTimerRef.current);
      artifactCloseTimerRef.current = null;
    }
    setShowArtifactPreview(false);
    setArtifactFullExpanded(false);
    setArtifactClosing(false);
    hasOpenedArtifactRef.current = false;
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
      isStoryFlowActiveRef.current = false;
      hasRunStoryRef.current = false;
      hasRunFollowupsRef.current = false;
      setShowSuggestions(false);
      resetFeedback();
      setIsGeneratingOutput(false);
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
    const userMessagesCount = messages.filter(m => !m.isAI && m.type === 'chat').length + 1;
    const lowerCaseMessage = message.toLowerCase().trim();

    // Explicit Valentine demo triggers (scripted strings) — left untouched.
    const isAutonomousValentinesTrigger = selectedMode === 'autonomous' &&
      lowerCaseMessage === "can you help me create a valentine's day campaign for perfumes";
    const isCollaborativeValentinesTrigger = selectedMode === 'collaborative' &&
      (lowerCaseMessage === "hi" || lowerCaseMessage === "help me create a campaign for valentine's day");
    const isValentineTrigger = userMessagesCount === 1 &&
      (isAutonomousValentinesTrigger || isCollaborativeValentinesTrigger);

    // Continuations of an in-progress Valentine flow (waiting for the user's reply).
    const isAutonomousValentineContinuation = selectedMode === 'autonomous' && autonomousWaitingForInput;
    const isCollaborativeValentineContinuation = selectedMode === 'collaborative' &&
      isMockAgentChatActive && !isStoryFlowActiveRef.current;

    // Anything else the user types is anchored to the performance "story". The
    // first turn plays the opening recap; the next message auto-plays the
    // follow-up batch ("chapter 2"); anything after that restarts the recap.
    const isStoryTrigger = !isValentineTrigger &&
      !isAutonomousValentineContinuation && !isCollaborativeValentineContinuation;
    const storyPhase: 'story' | 'followups' = isStoryTrigger && hasRunStoryRef.current && !hasRunFollowupsRef.current
      ? 'followups'
      : 'story';

    const userMessage: ChatMessageData = {
      type: 'chat',
      content: !isStoryTrigger
        ? message
        : storyPhase === 'followups' ? FOLLOWUPS[0].q : STORY_PROMPT,
      navLabel: !isStoryTrigger
        ? undefined
        : storyPhase === 'followups' ? FOLLOWUPS[0].label : STORY_NAV_LABEL,
      isAI: false,
      onAnimationComplete: () => {}
    };
    // The just-sent message lands at this index — used to pin it near the top
    // after sending so the start of the incoming response is revealed.
    const sentMsgIndex = messages.length;
    setMessages(prev => [...prev, userMessage]);
    setShowSuggestions(false); // hide follow-up chips once a message is sent
    resetFeedback(); // clear any feedback prompt/toast on a new send
    setMockChatCompleted(false); // Reset when user sends a new message
    setIsGeneratingOutput(true); // Show the persistent bottom loader until this response finishes

    // Slight scroll: bring the user's message toward the top so they can see the
    // response begin loading below it, then scroll freely from there.
    setTimeout(() => {
      document.getElementById(`msg-${sentMsgIndex}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);

    // Shimmer the input for the whole generation. Mock flows keep it on via
    // isMockAgentChatActive; non-mock responses clear it when their streaming
    // finishes (see the AI response's onAnimationComplete below). A long safety
    // fallback guards against a response that never reports completion.
    setInputShimmer(true);
    if (inputShimmerTimerRef.current) clearTimeout(inputShimmerTimerRef.current);
    inputShimmerTimerRef.current = setTimeout(() => setInputShimmer(false), 30000);

    if (isStoryTrigger) {
      if (storyPhase === 'followups') hasRunFollowupsRef.current = true;
      else hasRunStoryRef.current = true;
      setIsMockAgentChatActive(true);
      isStoryFlowActiveRef.current = true;
      setContentApproved(false);
      setContentGenerated(false);
      setAutonomousWaitingForInput(false);
      isMockAgentChatActiveRef.current = true;

      const coMarketer = marketingAgents.find(agent => agent.id === 'co-marketer');

      // Opening recap (with dashboard + artifact) vs. the deeper follow-up batch.
      const storyMessages: (Omit<ChatMessageData, 'onAnimationComplete'> & { agentId?: string })[] = [
        {
          type: 'chat',
          isAI: true,
          content: '',
          isThinkingState: true,
          thinkingDuration: 3,
          reasoningSteps: [
            "Pulling 50 campaigns across 6 channels (Jun 8–19)",
            "Reconciling published vs delivered volumes",
            "Tracing where the audience drops off",
            "Linking engagement to revenue by channel"
          ]
        },
        {
          agentId: coMarketer?.id,
          type: 'chat',
          isAI: true,
          agentName: coMarketer?.name,
          content: STORY_OUTPUT,
          avatarIcon: coMarketer?.icon,
          avatarBgClass: coMarketer?.colorClass,
          artifact: {
            intro: "I've created the Highest Engagement Last Quarter summary in an artifact with all the information you provided, formatted and ready to use",
            title: "Highest Engagement Last Quarter",
            subtitle: "WhatsApp Document",
          },
        }
      ];

      // Follow-up batch: thinking → answer to Q0, then Q1/A1, Q2/A2, Q3/A3.
      // The user questions are rendered as their own bubbles (navigable turns)
      // and the answers suppress the dashboard so it isn't repeated each turn.
      const followupMessages: (Omit<ChatMessageData, 'onAnimationComplete'> & { agentId?: string })[] = [
        {
          type: 'chat',
          isAI: true,
          content: '',
          isThinkingState: true,
          thinkingDuration: 2,
          reasoningSteps: [
            "Re-checking WhatsApp published vs delivered",
            "Diagnosing the delivery gap",
            "Pulling template quality + opt-in status",
            "Estimating recoverable reach"
          ]
        },
        {
          agentId: coMarketer?.id, type: 'chat', isAI: true, agentName: coMarketer?.name,
          content: FOLLOWUPS[0].a, avatarIcon: coMarketer?.icon, avatarBgClass: coMarketer?.colorClass,
          hidePerformanceDashboard: true,
          statCards: FOLLOWUPS[0].statCards, miniChart: FOLLOWUPS[0].miniChart,
        },
        ...FOLLOWUPS.slice(1).flatMap((f) => ([
          { type: 'chat' as const, isAI: false, content: f.q, navLabel: f.label },
          {
            agentId: coMarketer?.id, type: 'chat' as const, isAI: true, agentName: coMarketer?.name,
            content: f.a, avatarIcon: coMarketer?.icon, avatarBgClass: coMarketer?.colorClass,
            hidePerformanceDashboard: true,
            statCards: f.statCards, miniChart: f.miniChart,
          },
        ])),
      ];

      const mockMessagesDefinition = storyPhase === 'followups' ? followupMessages : storyMessages;

      mockMessagesDefinitionRef.current = mockMessagesDefinition;
      
      const processedAgentIdsForJoinMessage = new Set<string>();

      const addNextMockMessage = (index: number) => {
        if (!isMockAgentChatActiveRef.current) {
          if (mockMessageTimeoutRef.current) {
            clearTimeout(mockMessageTimeoutRef.current);
            mockMessageTimeoutRef.current = null;
          }
          return;
        }

        if (index >= mockMessagesDefinition.length) {
          setIsMockAgentChatActive(false);
          setIsGeneratingOutput(false);
          clearInputShimmer();
          setMockChatCompleted(true);
          // After the opening recap, surface follow-up chips; after thread 2 (followups),
          // clear chips and float the end-of-conversation feedback prompt instead.
          setShowSuggestions(storyPhase === 'story');
          if (storyPhase === 'followups') setShowFeedbackPrompt(true);
          playResponseCue(); // response finished — audible cue
          if (mockMessageTimeoutRef.current) {
            clearTimeout(mockMessageTimeoutRef.current);
            mockMessageTimeoutRef.current = null;
          }
          return;
        }

        const currentMessageDef = mockMessagesDefinition[index];
        const messageWithCallback: ChatMessageData = {
          type: currentMessageDef.type,
          content: currentMessageDef.content,
          isAI: currentMessageDef.isAI,
          agentName: currentMessageDef.agentName,
          avatarSrc: coMarketer?.avatarSrc,
          avatarIcon: currentMessageDef.avatarIcon,
          avatarBgClass: currentMessageDef.avatarBgClass,
          animate: currentMessageDef.animate,
          animationSpeed: currentMessageDef.animationSpeed,
          isThinkingState: currentMessageDef.isThinkingState,
          thinkingDuration: currentMessageDef.thinkingDuration,
          reasoningSteps: currentMessageDef.reasoningSteps,
          // Preserve the doc-like artifact so the "Preview" card/split-view stays intact
          artifact: currentMessageDef.artifact,
          // Follow-up answers suppress the repeated dashboard; user turns carry a nav label
          hidePerformanceDashboard: currentMessageDef.hidePerformanceDashboard,
          navLabel: currentMessageDef.navLabel,
          // Per-message graphics so follow-up answers match the opening recap visually
          statCards: currentMessageDef.statCards,
          miniChart: currentMessageDef.miniChart,
          onAnimationComplete: () => {
            if (mockMessageTimeoutRef.current) {
              clearTimeout(mockMessageTimeoutRef.current);
            }
            mockMessageTimeoutRef.current = setTimeout(() => {
              addNextMockMessage(index + 1);
            }, 500);
          }
        };
        setMessages(prev => [...prev, messageWithCallback]);
      };

      addNextMockMessageRef.current = addNextMockMessage;

      if (mockMessageTimeoutRef.current) {
        clearTimeout(mockMessageTimeoutRef.current);
        mockMessageTimeoutRef.current = null; 
      }
      
      mockMessageTimeoutRef.current = setTimeout(() => {
        addNextMockMessage(0);
      }, 1000);
      
      return;
    }

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
        // Thinking state before Co-Marketer responds
        {
          type: 'chat',
          isAI: true,
          content: '',
          isThinkingState: true,
          thinkingDuration: 3,
          reasoningSteps: [
            "Analyzing campaign requirements for Valentine's Day",
            "Identifying key information needed for effective targeting",
            "Preparing strategic questions to gather campaign details",
            "Structuring questionnaire for optimal campaign planning"
          ]
        },
        // Add the questionnaire flow to collaborative mode as well
        { 
          agentId: coMarketer?.id, 
          type: 'chat', 
          isAI: true, 
          agentName: coMarketer?.name, 
          content: "I'll help you design a Valentine's Day perfume campaign. To create the most effective campaign, I need some additional information:\n\n<strong>1. Campaign Goals:</strong>\n• What are your primary objectives? (e.g., increase sales, brand awareness, etc.)\n• Do you have specific revenue or sales targets?\n\n<strong>2. Product Details:</strong>\n• Which perfume brands/collections are you promoting?\n• What is the price range of the perfumes?\n• Are there any special Valentine's Day offers or bundles?\n\n<strong>3. Target Audience:</strong>\n• Are you targeting specific age groups?\n• Any specific gender focus (men buying for women, women for men, or both)?\n• Geographic location for the campaign?\n\n<strong>4. Campaign Duration:</strong>\n• When would you like to start the campaign?\n• How long do you want to run it? (typically Valentine's campaigns start 2-3 weeks before February 14th)\n\n<strong>5. Budget and Resources:</strong>\n• Do you have a specific marketing budget?\n• Which marketing channels would you like to use? (email, social media, etc.)\n\nPlease provide as much information as possible so I can help create a targeted and effective Valentine's Day campaign.", 
          avatarIcon: coMarketer?.icon, 
          avatarBgClass: coMarketer?.colorClass,
          waitForUserInput: true // Wait for user to type and send something
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
          setIsGeneratingOutput(false);
          clearInputShimmer();
          setMockChatCompleted(true); // <-- Set mock chat completed true
          playResponseCue(); // response finished — audible cue
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
            isThinkingState: currentMessageDef.isThinkingState,
            thinkingDuration: currentMessageDef.thinkingDuration,
            reasoningSteps: currentMessageDef.reasoningSteps,
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
            isThinkingState: currentMessageDef.isThinkingState,
            thinkingDuration: currentMessageDef.thinkingDuration,
            reasoningSteps: currentMessageDef.reasoningSteps,
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
      
      // Check if the questionnaire message (index 1, after thinking state at index 0) is waiting for user input
      const questionnaireMessage = mockMessagesDefinitionRef.current[1];
      if (questionnaireMessage && questionnaireMessage.waitForUserInput && !questionnaireMessage.isSegmentAgentRationale) {
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
        
        // Continue the collaborative flow from the next message 
        // Index 0 is thinking state, Index 1 is questionnaire, so continue from Index 2
        setTimeout(() => {
          addNextMockMessageRef.current(2);
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
      // Re-assert the bottom loader for this new (generic) response, since stopMockConversation clears it.
      setIsGeneratingOutput(true);
      // Re-arm the shimmer for this new response (stopMockConversation clears it).
      setInputShimmer(true);
      if (inputShimmerTimerRef.current) clearTimeout(inputShimmerTimerRef.current);
      inputShimmerTimerRef.current = setTimeout(() => setInputShimmer(false), 30000);
      setMockChatCompleted(false); // Also reset if conversation is stopped manually

      const coMarketer = marketingAgents.find(agent => agent.id === 'co-marketer');

      // Guard so the AI response is appended only once even if
      // the thinking state's onComplete fires more than once.
      let hasResponded = false;

      // 1) Thinking state
      setTimeout(() => {
        const thinking: ChatMessageData = {
          type: 'chat',
          isAI: true,
          content: '',
          isThinkingState: true,
          thinkingDuration: 3,
          reasoningSteps: [
            "Understanding the campaign request",
            "Identifying information needed for targeting",
            "Structuring a questionnaire",
            "Preparing a ready-to-use artifact",
          ],
          onAnimationComplete: () => {
            if (hasResponded) return;
            hasResponded = true;
            // 2) AI response with the doc-like artifact
            const aiResponse: ChatMessageData = {
              type: 'chat',
              isAI: true,
              agentName: coMarketer?.name || 'Co-marketer',
              avatarIcon: coMarketer?.icon,
              avatarBgClass: coMarketer?.colorClass,
              content:
                "I'll help you design a Valentine's Day perfume campaign. To create the most effective campaign, I need some additional information:\n\n" +
                "<strong>1. Campaign Goals:</strong>\n• What are your primary objectives? (e.g., increase sales, brand awareness, etc.)\n• Do you have specific revenue or sales targets?\n\n" +
                "<strong>2. Product Details:</strong>\n• Which perfume brands/collections are you promoting?\n• What is the price range of the perfumes?\n• Are there any special Valentine's Day offers or bundles?\n\n" +
                "<strong>3. Target Audience:</strong>\n• Are you targeting specific age groups?\n• Any specific gender focus (men buying for women, women for men, or both)?\n• Geographic location for the campaign?\n\n" +
                "<strong>4. Campaign Duration:</strong>\n• When would you like to start the campaign?\n• How long do you want to run it? (typically Valentine's campaigns start 2-3 weeks before February 14th)\n\n" +
                "<strong>5. Budget and Resources:</strong>\n• Do you have a specific marketing budget?\n• Which marketing channels would you like to use? (email, social media, etc.)",
              artifact: {
                intro: "I've created the Highest Engagement Last Quarter summary in an artifact with all the information you provided, formatted and ready to use",
                title: "Highest Engagement Last Quarter",
                subtitle: "WhatsApp Document",
              },
              onAnimationComplete: () => {
                // Output finished streaming — stop the input shimmer and bottom loader.
                if (inputShimmerTimerRef.current) clearTimeout(inputShimmerTimerRef.current);
                setInputShimmer(false);
                setIsGeneratingOutput(false);
                playResponseCue(); // response finished — audible cue
              },
            };
            setMessages(prev => [...prev, aiResponse]);
          },
        };
        setMessages(prev => [...prev, thinking]);
      }, 600);
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
        "flex items-start shrink-0 w-full border-b border-[#DDE2EE]",
        !isExpanded && (isDragging ? "cursor-grabbing" : "cursor-grab")
      )}
      onMouseDown={!isExpanded ? handleDragMouseDown : undefined}
    >
      {/* Left: menu + icon + title */}
      <div className="flex flex-col items-start justify-center pl-[16px] py-[16px] shrink-0 w-[287px]">
        <div className="flex gap-[8px] items-center w-full">
          {/* Menu icon — minimized mode only */}
          <button
            type="button"
            className="flex items-center justify-center p-[4px] rounded-[8px] hover:bg-[#F2F4F7] transition-colors shrink-0"
            aria-label="Menu"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={() => setShowMinOverlay(true)}
          >
            <Menu className="w-[16px] h-[16px] text-[#40474C]" />
          </button>
          {/* Logo + title group (4px gap per Figma) */}
          <div className="flex gap-[4px] items-center min-w-0">
            {/* Blue gradient circle icon */}
            <div
              className="flex items-center justify-center rounded-full shrink-0 size-[24px]"
              style={{ background: "linear-gradient(to top, #143f93 13.75%, #97baff 76.25%)" }}
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M6 1L7.545 4.455L11 6L7.545 7.545L6 11L4.455 7.545L1 6L4.455 4.455L6 1Z" fill="white" fillOpacity="0.9" />
              </svg>
            </div>
            <span
              className="font-bold text-[16px] leading-[20px] text-[#101828] whitespace-nowrap"
              style={{ fontFamily: "Manrope, sans-serif" }}
            >
              Co-marketer
            </span>
          </div>
        </div>
      </div>

      {/* Right: expand + close buttons */}
      <div className="flex flex-1 h-[56px] items-center justify-end pr-[24px] gap-[4px]">
        <button
          onClick={() => setIsExpanded(true)}
          className="flex items-center justify-center p-[8px] rounded-[8px] hover:bg-[#F2F4F7] transition-colors"
          aria-label="Expand"
        >
          <Maximize2 className="w-[16px] h-[16px] text-[#40474C]" />
        </button>
        <button
          onClick={() => onCloseInterface?.()}
          className="flex items-center justify-center p-[8px] rounded-[8px] hover:bg-[#F2F4F7] transition-colors"
          aria-label="Close"
        >
          <X className="w-[16px] h-[16px] text-[#40474C]" />
        </button>
      </div>
    </div>
  );

  // Header for the expanded view
  const ExpandedViewHeader = () => (
    <div className="px-4 py-3 border-b border-border flex items-center justify-between bg-background shadow-sm flex-shrink-0 h-[64px]">
      <div className="flex items-center gap-3">
        <div className="flex flex-col pl-3">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold text-foreground">Co-marketer</h1>
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
        <div>
          <Button
            variant="ghost"
            size="icon"
            className="p-1.5 hover:bg-muted rounded-md"
            title="Preferences"
            onClick={() => window.open('https://www.figma.com/proto/PpMyMSpfteIiBlbsBYryx2/Raman-AI---Co-Marketer---Co-Pilot?page-id=5891:1439&node-id=7073-4874&viewport=-442,2798,0.17&t=3ThX3Yd3gjcwJf8j-1&scaling=contain&content-scaling=responsive&starting-point-node-id=7073:4873&hide-ui=1', '_blank')}
          >
            <Settings2 className="w-8 h-8 text-muted-foreground" />
          </Button>
        </div>
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
            ? "fixed z-50 inset-0 bg-background flex flex-col overflow-hidden"
            // For widget view, if position is null, it uses these classes. If position is set, inline style takes over for pos.
            : "w-[470px] h-[776px] bg-background border border-border shadow-lg rounded-xl flex flex-col overflow-hidden relative",
            !isExpanded && position && "fixed z-50" // Ensure it's fixed and on top when dragged
        )}
        style={!isExpanded && position ? {
            top: `${position.y}px`,
            left: `${position.x}px`,
            width: '470px', // Keep width/height consistent
            height: '776px',
        } : {}}
      >
        {/* Widget (minimized) header sits above everything */}
        {!isExpanded && <WidgetViewHeader />}

        {/* Minimized-view LHS overlay — opened from the widget header menu icon */}
        {!isExpanded && showMinOverlay && (
          <MinViewLhsOverlay
            activeChatId={null}
            onClose={() => setShowMinOverlay(false)}
            onNewChat={handleNewChat}
          />
        )}

        {/* Feedback modal (👍 happy / 👎 improvement) — overlays the whole chat window */}
        {feedbackModal && (
          <FeedbackModal
            sentiment={feedbackModal}
            onClose={() => setFeedbackModal(null)}
            onSubmit={handleFeedbackSubmit}
          />
        )}


        {/* Main content area: Layout changes based on view mode */}
        <div className={cn(
          "flex flex-1 overflow-hidden",
          isExpanded ? "flex-row pt-0" : "flex-col"
        )}>
          {/* Full-height LHS sidebar (expanded view) — single component animates between full and icon-rail */}
          {isExpanded && activeSidebar === 'bookmarks' && (
            <LhsSidebar
              collapsed={lhsCollapsed}
              chats={lhsChats}
              activeChatId={activeLhsChatId}
              busyChatId={busyLhsChatId}
              onNewChat={handleNewChat}
              onOpenChats={() => setActivePage('chats')}
              onOpenBookmarks={() => setActivePage('bookmarks')}
              onSelectChat={() => setActivePage('home')}
              onOpenSettings={() => window.open('https://www.figma.com/proto/PpMyMSpfteIiBlbsBYryx2/Raman-AI---Co-Marketer---Co-Pilot?page-id=5891:1439&node-id=7073-4874&viewport=-442,2798,0.17&t=3ThX3Yd3gjcwJf8j-1&scaling=contain&content-scaling=responsive&starting-point-node-id=7073:4873&hide-ui=1', '_blank')}
            />
          )}
          {/* Conditional rendering of AgentsSidebar in expanded view */}
          {isExpanded && activeSidebar === 'agents' && (
            <AgentsSidebar
              onClose={() => setActiveSidebar(null)}
              enabledAgents={enabledAgents}
              onAgentToggle={handleAgentToggle}
            />
          )}

          {/* Right column: header + chat (expanded) / chat only (widget) */}
          <div className={cn("flex flex-col flex-1 min-w-0 min-h-0", isExpanded ? "overflow-hidden" : "")}>
          {isExpanded && (
            <RhsHeader
              chatName={chatName}
              showSidebarToggle={true}
              sidebarCollapsed={lhsCollapsed}
              onToggleSidebar={() => { setLhsCollapsed(prev => !prev); playToggleCue(); }}
              onMinimize={() => setIsExpanded(false)}
              onClose={onCloseInterface}
            />
          )}

          {/* Chat messages and input area.
              Window is full screen; the chat-area itself is the Figma bordered card. */}
          <div className={cn(
            "flex flex-col flex-1 overflow-hidden min-h-0",
            isExpanded && "p-[8px]"
          )}>
          <ChatCardBeam enabled={isExpanded} active={messages.length === 0 && !isGeneratingOutput}>
          <div className={cn(
            "relative flex flex-1 overflow-hidden min-h-0 min-w-0",
            isExpanded ? "bg-[#F9FAFB] border-[0.5px] border-[#DDE2EE] rounded-[16px]" : "bg-[#F9FAFB]",
            isExpanded && showArtifactPreview && !artifactClosing && !artifactFullExpanded && "gap-[12px] pl-[12px]",
            isExpanded && showArtifactPreview && !artifactClosing && artifactFullExpanded && "px-[12px]"
          )}>
          {/* Chats / Bookmarks full page — overlays the conversation when active */}
          {isExpanded && activePage !== 'home' && (
            <div className="absolute inset-0 z-20 rounded-[16px] overflow-hidden bg-white">
              <ChatListPage
                title={activePage === 'chats' ? 'Chats' : 'Bookmarks'}
                searchPlaceholder={activePage === 'chats' ? 'Search chats' : 'Search bookmarks'}
                chats={activePage === 'chats' ? defaultChats : bookmarkedChats}
                showNewChat={activePage === 'chats'}
                onNewChat={handleNewChat}
                onSelectChat={() => setActivePage('home')}
              />
            </div>
          )}
          {/* Conversation column — 60% when artifact open, hidden when full-expanded, expands back while closing */}
          <div
            className={cn(
              "relative z-10 flex flex-col overflow-hidden min-w-0 min-h-0 transition-[width] duration-300 ease-in-out",
              isExpanded && showArtifactPreview && !artifactClosing && artifactFullExpanded && "w-0 opacity-0 pointer-events-none",
              isExpanded && showArtifactPreview && !artifactClosing && !artifactFullExpanded && "w-[60%]",
              !(isExpanded && showArtifactPreview && !artifactClosing) && "w-full flex-1",
              // Widget view: the artifact takes over full-screen, so hide (not unmount) the chat
              !isExpanded && showArtifactPreview && "hidden"
            )}
          >
            {/* Scrollable chat messages area */}
            <div
              className={cn(
                "relative z-0 flex-1 flex flex-col overflow-y-auto scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent",
                isExpanded ? "" : "p-[16px]"
              )}
              ref={chatContainerRef}
            >
              {/* Centered container for chat content - 768px width as per Figma */}
              <div className={cn(
                "flex flex-col items-center w-full min-h-full",
                isExpanded && messages.length > 0 ? "pt-2" : "",
                messages.length === 0 ? "justify-center" : ""
              )}>
                <div className={cn(
                  "flex flex-col items-start space-y-0 max-w-full",
                  isExpanded ? "w-[768px]" : "w-full",
                  messages.length > 0 ? "pb-8" : ""
                )}>
                {messages.length === 0 && !isGeneratingOutput && (
                  <div className="w-full flex flex-col items-center">
                    <div className={cn("w-full flex flex-col gap-[24px] items-center", isExpanded ? "max-w-[768px]" : "max-w-full")}>
                      {/* Greeting: "Good morning Amit," then, on one line,
                          "what can I do for you?" + the rotating slot-text topic */}
                      <div className="flex flex-col gap-[6px] items-center">
                        <GradientShimmer
                          as="p"
                          className="font-semibold text-[24px] leading-[30px] text-center tracking-[0.42px] whitespace-nowrap"
                          style={{ fontFamily: "Manrope, sans-serif" }}
                          baseColor="#40474C"
                          gradient={[
                            { position: 0.2, color: "#5c80ff" },  /* shimmer-blue */
                            { position: 0.4, color: "#ffa8dc" },  /* shimmer-pink */
                            { position: 0.6, color: "#fc5e02" },  /* shimmer-orange */
                            { position: 0.8, color: "#085286" },  /* shimmer-teal */
                          ]}
                          duration={2}
                          pauseBetween={1200}
                        >
                          {`${getGreeting()}, Amit`}
                        </GradientShimmer>
                        <div
                          className="flex items-center justify-center gap-[6px] text-[16px] leading-[22px] text-[#40474C] text-center tracking-[0.42px] whitespace-nowrap"
                          style={{ fontFamily: "Manrope, sans-serif" }}
                        >
                          <span className="font-semibold">What can I do for you?</span>
                          <RotatingWord
                            words={GREETING_TOPICS}
                            className="font-medium text-[#143F93]"
                          />
                        </div>
                      </div>
                      <div className="w-full flex flex-col gap-[16px] items-center">
                        <ChatInput
                          onSend={handleSendMessage}
                          isMockAgentChatActive={isMockAgentChatActive}
                          onStopMockConversation={stopMockConversation}
                          isQuestionnaireActive={false}
                          selectedContextChip={selectedStarterChip}
                          onClearSelectedContextChip={() => setSelectedStarterChip(null)}
                        />
                        {!selectedStarterChip && (
                          <div className="flex flex-wrap gap-[8px] items-center justify-center w-full">
                            {starterChips.map((chipLabel, index) => (
                              <button
                                key={index}
                                type="button"
                                className="fig-chip flex items-center justify-center px-[12px] py-[6px] rounded-[6px] whitespace-nowrap shrink-0"
                                onClick={() => setSelectedStarterChip(chipLabel)}
                              >
                                <span
                                  className="font-normal text-[14px] leading-[20px] text-[#17173A] tracking-[0.42px]"
                                  style={{ fontFamily: "Manrope, sans-serif" }}
                                >
                                  {chipLabel}
                                </span>
                              </button>
                            ))}
                          </div>
                        )}
                        {selectedStarterChip && (
                          <div className="w-full flex flex-col gap-[8px]">
                            <p
                              className="px-[2px] font-semibold text-[13px] leading-[18px] text-[#6F6F8D] tracking-[0.42px]"
                              style={{ fontFamily: "Manrope, sans-serif" }}
                            >
                              {starterPromptHeaderByChip[selectedStarterChip] ?? "Suggested prompts"}
                            </p>
                            {(starterPromptsByChip[selectedStarterChip] ?? []).map((suggestion, index) => (
                              <button
                                key={`${selectedStarterChip}-${index}`}
                                type="button"
                                className="fig-chip w-full text-left p-[12px] rounded-[6px] cursor-pointer"
                                onClick={() => handleSendMessage(suggestion)}
                              >
                                <p
                                  className="text-[14px] leading-[20px] text-[#17173A]"
                                  style={{ fontFamily: "Manrope, sans-serif" }}
                                >
                                  {suggestion}
                                </p>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {messages.map((message, index) => (
                  <div key={index} id={`msg-${index}`} className="w-full scroll-mt-2">
                  {message.type === 'system' ? (
                    <SystemMessage
                      type={message.systemType || 'join'}
                      agentName={message.agentName || ''}
                      agentIcon={message.agentIcon}
                      agentColorClass={message.agentColorClass}
                    />
                  ) : (
                    <ChatMessage
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
                      showPerformanceDashboard={
                        (message.isAI ?? false) &&
                        !message.isThinkingState &&
                        !message.hidePerformanceDashboard
                      }
                      statCards={message.statCards}
                      miniChart={message.miniChart}
                      onThumbsUp={() => setFeedbackModal('up')}
                      onThumbsDown={() => setFeedbackModal('down')}
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
                      isThinkingState={message.isThinkingState}
                      thinkingDuration={message.thinkingDuration}
                      reasoningSteps={message.reasoningSteps}
                      artifact={message.artifact}
                      onDownloadArtifact={() => {}}
                      onPreviewArtifact={handleOpenArtifactPreview}
                    />
                  )}
                  </div>
                ))}
                {/* Suggested follow-up prompts after the first output — tapping any starts thread 2 */}
                {showSuggestions && !isGeneratingOutput && messages.length > 0 && (
                  <div className="w-full flex flex-col items-start gap-[8px] py-2 animate-in fade-in slide-in-from-bottom-1 duration-300">
                    {SUGGESTED_PROMPTS.map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => handleSendMessage(p)}
                        className="group flex w-fit max-w-full items-start gap-[10px] text-left rounded-[10px] border border-[#E5E7EB] bg-white px-[12px] py-[8px] hover:bg-[#F9FAFB] hover:border-[#D4D4D4] transition-colors"
                      >
                        <MessageSquarePlus className="size-[16px] text-[#6F6F8D] shrink-0 mt-[1px]" strokeWidth={1.75} />
                        <span className="text-[14px] leading-[20px] text-[#475467]" style={{ fontFamily: 'Manrope, sans-serif' }}>{p}</span>
                      </button>
                    ))}
                  </div>
                )}
                {/* Loader is shown as a floating pill above the input (both views) — see below. */}
                <div ref={messagesEndRef} />
                </div>
              </div>
            </div>

            {/* Floating Scroll to Bottom Button - Positioned relative to parent chat container */}
            {showScrollButton && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={scrollToBottom}
                      size="icon"
                      className={cn(
                        "absolute right-6 h-10 w-10 rounded-full shadow-lg z-50 bg-white dark:bg-white border-[1.5px] hover:bg-gray-50 dark:hover:bg-gray-50",
                        isExpanded ? "bottom-[112px]" : "bottom-[150px]"
                      )}
                      style={{ borderColor: '#DDE2EE' }}
                      aria-label="Scroll to latest"
                    >
                      <ArrowDown className="h-4 w-4 text-gray-700" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="left">
                    <p>Scroll to latest</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}

            {/* Vertical line-nav for jumping between conversation turns. Shown in
                expanded view while L1 is collapsed, and hidden while the artifact
                preview is open (no room beside the split-view). */}
            {isExpanded && lhsCollapsed && !showArtifactPreview && navItems.length > 0 && (
              <LineNav items={navItems} containerRef={chatContainerRef} />
            )}


            {messages.length > 0 && (
              <div className={cn(
                "relative flex-shrink-0",
                // Widget: match the messages area's 16px on left/right/bottom
                isExpanded ? "" : "px-[16px] pt-[8px] pb-[16px]"
              )}>
                {/* Feedback popover / success toast — pinned to the chat's right edge,
                    on the line just above the input field (not over its face). */}
                {(showFeedbackToast || (showFeedbackPrompt && !feedbackModal)) && (
                  <div className="absolute right-[24px] bottom-full mb-[12px] z-30 flex justify-end max-w-[calc(100%-48px)]">
                    {showFeedbackToast ? (
                      <div className="inline-flex items-center gap-[8px] rounded-full border border-[#E5E7EB] bg-white px-[14px] py-[8px] shadow-[0px_8px_20px_-6px_rgba(16,24,40,0.22)] animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <CheckCircle2 className="size-[16px] text-[#22A565] shrink-0" />
                        <span className="text-[13px] text-[#17173A] whitespace-nowrap" style={{ fontFamily: 'Manrope, sans-serif' }}>
                          Feedback sent successfully. Thank you
                        </span>
                      </div>
                    ) : (
                      <div className="inline-flex items-center gap-[10px] rounded-[12px] border border-[#E5E7EB] bg-white px-[16px] py-[10px] shadow-[0px_8px_24px_-6px_rgba(16,24,40,0.22)] animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <span className="text-[14px] text-[#17173A] whitespace-nowrap" style={{ fontFamily: 'Manrope, sans-serif' }}>
                          Was your Co-marketer experience helpful?
                        </span>
                        <button
                          type="button"
                          onClick={() => setFeedbackModal('up')}
                          aria-label="Helpful"
                          className="flex items-center justify-center p-[6px] rounded-md text-[#6F6F8D] hover:bg-green-50 hover:text-green-600 transition-colors"
                        >
                          <ThumbsUp className="size-[16px]" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setFeedbackModal('down')}
                          aria-label="Not helpful"
                          className="flex items-center justify-center p-[6px] rounded-md text-[#6F6F8D] hover:bg-red-50 hover:text-red-600 transition-colors"
                        >
                          <ThumbsDown className="size-[16px]" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowFeedbackPrompt(false)}
                          aria-label="Dismiss"
                          className="flex items-center justify-center p-[6px] rounded-md text-[#6F6F8D] hover:bg-[#F2F4F7] transition-colors"
                        >
                          <X className="size-[16px]" />
                        </button>
                      </div>
                    )}
                  </div>
                )}
                {/* Centered container for chat input - 768px width as per Figma */}
                <div className={cn(
                  "flex items-center justify-center w-full bg-transparent outline-none",
                  isExpanded ? "pb-2 pt-0" : ""
                )}>
                  <div className={cn(
                    "relative",
                    isExpanded ? "w-[768px]" : "w-full"
                  )}>
                    {/* Floating "still loading" pill, centered just above the input (both views) */}
                    {isGeneratingOutput && (
                      <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-[10px] z-20">
                        <GeneratingLoader pill />
                      </div>
                    )}

                    <ChatInput
                      onSend={handleSendMessage}
                      isMockAgentChatActive={isMockAgentChatActive}
                      shimmer={inputShimmer || isGeneratingOutput}
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
                      selectedContextChip={null}
                    />
                    {/* Footer text below input — widget view only (expanded uses card footer) */}
                    {!isExpanded && (
                      <div className="flex flex-col items-center gap-1 mt-2">
                        <p className="text-sm text-foreground-muted text-center">
                          Co-marketer can make mistakes. Please double check responses
                        </p>
                        <p className="text-[12px] text-foreground-muted text-center">
                          This AI doesn&apos;t take coffee breaks. Made with ❤️ by design engineer.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Persistent card footer (expanded view) — per Figma */}
            {isExpanded && (
              <div className="flex flex-col items-center justify-center gap-1 py-[8px] w-full shrink-0">
                <p
                  className="text-[12px] text-[#6F6F8D] text-center w-[768px]"
                  style={{ fontFamily: "Manrope, sans-serif", fontWeight: 400 }}
                >
                  Co-marketer can make mistakes. Please double check responses
                </p>
                <p
                  className="text-[10px] text-[#6F6F8D] text-center w-[768px]"
                  style={{ fontFamily: "Manrope, sans-serif", fontWeight: 400 }}
                >
                  This AI doesn&apos;t take coffee breaks. Made with ❤️ by design engineer.
                </p>
              </div>
            )}
          </div>
          {/* Artifact preview panel.
              Expanded view: 40% split (or full width when expanded), slides out on close.
              Widget (collapse) view: full-bleed take-over below the Co-marketer nav,
              with the artifact's own top-nav acting as the close sub-nav. */}
          {showArtifactPreview && (
            <div className={cn(
              "relative z-10 shrink-0 h-full transition-all duration-300 ease-in-out will-change-[width,transform,opacity]",
              !isExpanded
                ? "w-full"
                : artifactClosing
                  ? "w-0 opacity-0 translate-x-6 pr-0"
                  : artifactFullExpanded
                    ? "w-full py-[12px]"
                    : "w-[40%] pr-[12px] py-[12px]"
            )}>
              <ArtifactPreview
                onClose={handleCloseArtifactPreview}
                onDownload={() => {}}
                isFullExpanded={artifactFullExpanded}
                onToggleExpand={isExpanded ? () => { setArtifactFullExpanded(prev => !prev); playExpandCue(); } : undefined}
                bare={!isExpanded}
              />
            </div>
          )}
          </div>
          </ChatCardBeam>
          </div>
          </div>
        </div>
      </div>


    </>
  );
};

export default ChatInterface;

type ChatCardBeamProps = {
  enabled: boolean;
  active: boolean;
  children: React.ReactNode;
};

/** border-beam md — rotating inner edge shimmer (not pulse-inner breathe). */
function ChatCardBeam({ enabled, active, children }: ChatCardBeamProps) {
  const beamRef = useRef<HTMLDivElement>(null);
  const [beamId, setBeamId] = useState<string | null>(null);

  // Read the generated beam id once; the wrapper is always rendered so that
  // toggling `enabled` (widget ⇄ full screen) never changes the element type
  // above the conversation — otherwise React remounts every message and the
  // typing animations replay. We only inject the beam CSS / activate when enabled.
  useLayoutEffect(() => {
    const id = beamRef.current?.getAttribute('data-beam') ?? null;
    if (id) setBeamId(id);
  }, []);

  return (
    <>
      {enabled && beamId ? <style>{welcomeCardBeamStyleBlock(beamId)}</style> : null}
      <BorderBeam
        ref={beamRef}
        size="md"
        theme="light"
        colorVariant="colorful"
        staticColors={true}
        borderRadius={16}
        strength={0.72}
        brightness={1.55}
        saturation={1.85}
        duration={3.2}
        active={enabled && active}
        className="welcome-card-beam flex flex-1 min-h-0 min-w-0"
      >
        {children}
      </BorderBeam>
    </>
  );
}
