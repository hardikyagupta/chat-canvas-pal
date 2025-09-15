import React, { useState, useEffect, useRef } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { User, ThumbsUp, ThumbsDown, Copy, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ContentAgentResponse } from './ContentAgentResponse';
import { ContentAgentClarification } from './ContentAgentClarification';
import { ContentAgentQuestionChoice } from './ContentAgentQuestionChoice';
import { FlowExecutionProgress } from './FlowExecutionProgress';
import { ContentAgentSegmentAccordions } from './ContentAgentSegmentAccordions';
import { SchedulerAgentCampaignAccordions } from './SchedulerAgentCampaignAccordions';
import { SegmentAgentRationale } from './SegmentAgentRationale';
import { ContentAgentRationale } from './ContentAgentRationale';
import { ExecutiveSummaryContentAccordion } from './ExecutiveSummaryContentAccordion';

interface ChatMessageProps {
  isAI: boolean;
  content: string;
  agentName?: string;
  avatarSrc?: string; // SVG avatar source
  avatarIcon?: React.ElementType;
  avatarBgClass?: string;
  animate?: boolean;
  animationSpeed?: number;
  onAnimationComplete?: () => void;
  messageId?: string;
  isLastMessage?: boolean;
  showExecuteFlowCTA?: boolean;
  onExecuteFlow?: () => void;
  isContentAgent?: boolean;
  isContentAgentClarification?: boolean;
  isContentAgentQuestionChoice?: boolean;
  onAnswerQuestions?: () => void;
  onSkipAndGenerate?: () => void;
  showQuestionChoiceCTAs?: boolean;
  onGenerateContent?: () => void;
  showGenerateContentCTA?: boolean;
  showApproveContentCTA?: boolean;
  onApproveContent?: () => void;
  showApproveSegmentsCTA?: boolean;
  onApproveSegments?: () => void;
  isFlowExecutionProgress?: boolean;
  onFlowExecutionComplete?: () => void;
  isPlanMode?: boolean;
  isSegmentAccordion?: boolean;
  isSchedulerAccordion?: boolean;
  isSegmentAgentRationale?: boolean;
  isContentAgentRationale?: boolean;
  isExecutiveSummaryWithContent?: boolean;
  onContinueSegment?: () => void;
  onRefineThis?: () => void;
  onUpdateContent?: (updatedContent: any) => void; // New prop for update action
  onDiscardChanges?: () => void; // New prop for discard action
  updatedContent?: any; // New prop to pass updated content
  promptTemplateExists?: boolean; // New prop for prompt template existence toggle
}

const ChatMessage: React.FC<ChatMessageProps> = ({
  isAI,
  content,
  agentName,
  avatarSrc,
  avatarIcon: AvatarIconComponent,
  avatarBgClass,
  animate = true,
  animationSpeed = 15,
  onAnimationComplete,
  messageId,
  isLastMessage,
  showExecuteFlowCTA,
  onExecuteFlow,
  isContentAgent = false,
  isContentAgentClarification = false,
  isContentAgentQuestionChoice = false,
  onAnswerQuestions,
  onSkipAndGenerate,
  showQuestionChoiceCTAs,
  onGenerateContent,
  showGenerateContentCTA,
  showApproveContentCTA,
  onApproveContent,
  showApproveSegmentsCTA,
  onApproveSegments,
  isFlowExecutionProgress = false,
  onFlowExecutionComplete,
  isPlanMode = false,
  isSegmentAccordion = false,
  isSchedulerAccordion = false,
  isSegmentAgentRationale = false,
  isContentAgentRationale = false,
  isExecutiveSummaryWithContent = false,
  onContinueSegment,
  onRefineThis,
  onUpdateContent,
  onDiscardChanges,
  updatedContent,
  promptTemplateExists = true,
}) => {
  const [displayedText, setDisplayedText] = useState('');
  const [isAnimationDone, setIsAnimationDone] = useState(false);
  const [isFlowExecuting, setIsFlowExecuting] = useState(false);
  const [isContentApproving, setIsContentApproving] = useState(false);
  const [isSegmentsApproving, setIsSegmentsApproving] = useState(false);
  const [isContentGenerating, setIsContentGenerating] = useState(false);
  const [isAnsweringQuestions, setIsAnsweringQuestions] = useState(false);
  const [isSkippingToGenerate, setIsSkippingToGenerate] = useState(false);
  const animationTimeoutIdRef = useRef<NodeJS.Timeout | null>(null);
  const [dynamicAvatarSrc, setDynamicAvatarSrc] = useState<string | null>("/avatarGIF.gif");
  
  // State for content changes
  const [hasContentChanges, setHasContentChanges] = useState(false);
  const [isUpdatingContent, setIsUpdatingContent] = useState(false);
  const contentUpdateHandlersRef = useRef<{
    handleUpdate: () => void;
    handleDiscard: () => void;
  } | null>(null);

  // Initialize the update handlers ref
  useEffect(() => {
    if (!contentUpdateHandlersRef.current) {
      contentUpdateHandlersRef.current = {
        handleUpdate: () => {},
        handleDiscard: () => {}
      };
    }
  }, []);

  useEffect(() => {
    setIsAnimationDone(false);
    if (animationTimeoutIdRef.current) {
      clearTimeout(animationTimeoutIdRef.current);
      animationTimeoutIdRef.current = null;
    }

    // ===================================================================
    // ANIMATION CONTROL LOGIC
    // ===================================================================
    // We skip the typing animation under four conditions:
    // 1. For user messages (!isAI)
    // 2. When animate prop is explicitly set to false
    // 3. For messages containing HTML tables (to avoid slow character-by-character
    //    rendering of large HTML structures like tables which takes too long and
    //    provides poor UX)
    // 4. For segment accordion messages (since they render as components, not text)
    //
    // If adding more animation exceptions, add them here rather than creating
    // new props or flags in message definitions.
    // ===================================================================
    if (!isAI || !animate || (content && content.includes('<table')) || isSegmentAccordion) {
      // For segment accordions, don't set displayedText since we render a component
      if (isSegmentAccordion) {
        setDisplayedText('');
      } else {
        setDisplayedText(content || '');
      }
      setIsAnimationDone(true);
      onAnimationComplete?.();
      return;
    }

    if (!content) {
        setDisplayedText('');
        setIsAnimationDone(true);
        onAnimationComplete?.();
        return;
    }

    const currentContentForAnimation = content;
    const contentLength = currentContentForAnimation.length;
    
    setDisplayedText('');

    if (contentLength === 0) {
        onAnimationComplete?.();
        return;
    }

    const animateStep = (index: number) => {
      setDisplayedText(prev => prev + currentContentForAnimation.charAt(index));

      if (index < contentLength - 1) {
        animationTimeoutIdRef.current = setTimeout(() => {
          animateStep(index + 1);
        }, animationSpeed);
      } else {
        animationTimeoutIdRef.current = null;
        setIsAnimationDone(true);
        onAnimationComplete?.();
      }
    };

    animationTimeoutIdRef.current = setTimeout(() => {
      animateStep(0);
    }, animationSpeed);

    return () => {
      if (animationTimeoutIdRef.current) {
        clearTimeout(animationTimeoutIdRef.current);
        animationTimeoutIdRef.current = null;
      }
    };
  }, [content, isAI, animationSpeed, onAnimationComplete, animate]);

  useEffect(() => {
    let playTimeoutId: NodeJS.Timeout | undefined;
    let pauseTimeoutId: NodeJS.Timeout | undefined;

    const GIF_ASSUMED_DURATION = 10000; // 10 seconds for the GIF to play
    const STATIC_FRAME_HOLD_DURATION = 10000;  // 10 seconds to show the static first frame
    const STATIC_FRAME_SRC = "/gif1frameavatar.png"; // Path to your static first frame

    const cycleGif = () => {
      const now = Date.now();
      // Show and restart animated GIF
      setDynamicAvatarSrc(`/avatarGIF.gif?t=${now}`);

      // After assumed duration, switch to static frame
      playTimeoutId = setTimeout(() => {
        setDynamicAvatarSrc(STATIC_FRAME_SRC);

        // After the hold period, schedule to show and play animated GIF again
        pauseTimeoutId = setTimeout(() => {
          cycleGif();
        }, STATIC_FRAME_HOLD_DURATION);
      }, GIF_ASSUMED_DURATION);
    };

    // Only use GIF cycling logic if no avatarSrc prop is provided and no AvatarIconComponent
    if (isAI && !avatarSrc && !AvatarIconComponent) {
      cycleGif(); // Start the cycle
    } else {
      // If the conditions for looping are not met, ensure the dynamicAvatarSrc is set to the default static GIF path.
      // This handles cases where the component might re-render with different props and should stop looping.
      if (dynamicAvatarSrc !== "/avatarGIF.gif") { 
         setDynamicAvatarSrc("/avatarGIF.gif"); // Reset to static non-timestamped default animated GIF
      }
    }

    return () => { 
      clearTimeout(playTimeoutId);
      clearTimeout(pauseTimeoutId);
    };
  }, [isAI, AvatarIconComponent, content]);

  // Auto-approve content in autonomous mode
  useEffect(() => {
    if (isPlanMode && isContentAgent && isAnimationDone && showApproveContentCTA && onApproveContent) {
      // Small delay to ensure the UI is fully rendered before auto-continuing
      const autoApproveTimeout = setTimeout(() => {
        onApproveContent();
      }, 1000); // 1 second delay for better UX

      return () => clearTimeout(autoApproveTimeout);
    }
  }, [isPlanMode, isContentAgent, isAnimationDone, showApproveContentCTA, onApproveContent]);

  // Handle content change tracking
  const handleContentChanged = (hasChanges: boolean) => {
    setHasContentChanges(hasChanges);
  };

  // Handle update content action
  const handleUpdateContent = async () => {
    if (contentUpdateHandlersRef.current) {
      setIsUpdatingContent(true);
      contentUpdateHandlersRef.current.handleUpdate();
      
      // Call the parent's update handler
      if (onUpdateContent) {
        onUpdateContent({});
      }
      
      // Reset states
      setHasContentChanges(false);
      setIsUpdatingContent(false);
    }
  };

  // Handle discard changes action  
  const handleDiscardChanges = () => {
    if (contentUpdateHandlersRef.current) {
      contentUpdateHandlersRef.current.handleDiscard();
      setHasContentChanges(false);
    }
  };

  // Function to generate full text content for segment accordions
  const generateSegmentAccordionCopyText = () => {
    const segmentData = [
      {
        id: "premium-perfume",
        name: "Premium Perfume Enthusiasts",
        email: {
          subject: "VIP Access: Love's Luxury Collection"
        },
        appPush: {
          title: "Luxury Awaits 💎",
          message: "VIP Valentine's collection - exclusively for you",
          cta: "Shop VIP Collection"
        },
        whatsapp: {
          header: "💎 VIP Valentine's Collection 💎",
          body: "Exclusive access to our most luxurious fragrances. Limited edition Valentine's collection available only to our VIP members.",
          footer: "Premium experience guaranteed ✨",
          cta1: "Shop VIP Collection",
          cta2: "Browse Luxury"
        }
      },
      {
        id: "recent-browsers",
        name: "Recent Beauty Browsers",
        email: {
          subject: "First Love: Special Valentine's Offer"
        },
        appPush: {
          title: "Special Offer Inside 💕",
          message: "Your perfect Valentine's fragrance awaits",
          cta: "Claim Offer"
        },
        whatsapp: {
          header: "💕 Your Perfect Scent Awaits 💕",
          body: "We noticed you've been exploring our fragrance collection. Here's a special Valentine's offer just for you - find your signature scent today!",
          footer: "Limited time offer ends soon! ⏰",
          cta1: "Shop Now",
          cta2: "Browse Collection"
        }
      },
      {
        id: "loyal-shoppers",
        name: "Loyal Beauty Shoppers",
        email: {
          subject: "Members-Only Valentine's Bundle"
        },
        appPush: {
          title: "Members Only 🌟",
          message: "Exclusive Valentine's bundle just for you",
          cta: "View Bundle"
        },
        whatsapp: {
          header: "🌟 Members-Only Valentine's Bundle 🌟",
          body: "Thank you for being a valued customer! Enjoy exclusive access to our curated Valentine's bundle with special member pricing.",
          footer: "Your loyalty is appreciated 💖",
          cta1: "View Bundle",
          cta2: "Member Benefits"
        }
      },
      {
        id: "high-intent",
        name: "High Intent New Customers",
        email: {
          subject: "Love at First Scent: 20% Off"
        },
        appPush: {
          title: "20% Off Valentine's 💘",
          message: "Limited time - your favorites at special prices",
          cta: "Shop Now"
        },
        whatsapp: {
          header: "💘 20% Off Valentine's Collection 💘",
          body: "Ready to find your perfect Valentine's fragrance? Enjoy 20% off our entire collection - from classic romance to modern allure.",
          footer: "Offer ends February 14th! 📅",
          cta1: "Shop 20% Off",
          cta2: "View Collection"
        }
      },
      {
        id: "welcome-premium",
        name: "Welcome Premium Segment",
        email: {
          subject: "Your Perfect Valentine's Match"
        },
        appPush: {
          title: "Perfect Match Found 💖",
          message: "Personalized Valentine's recommendations ready",
          cta: "See Matches"
        },
        whatsapp: {
          header: "💖 Your Perfect Valentine's Match 💖",
          body: "Welcome to our premium fragrance family! Based on your preferences, we've curated personalized Valentine's recommendations just for you.",
          footer: "Discover your signature scent journey 🌹",
          cta1: "See My Matches",
          cta2: "Take Quiz"
        }
      }
    ];

    let copyText = "I've created communication templates for your Valentine's Day perfume campaign across all segments:\n\n";
    
    segmentData.forEach((segment, index) => {
      copyText += `Segment ${index + 1}: ${segment.name}\n\n`;
      
      copyText += `Email\n`;
      copyText += `Subject: ${segment.email.subject}\n\n`;
      
      copyText += `App Push\n`;
      copyText += `Title: ${segment.appPush.title}\n`;
      copyText += `Message: ${segment.appPush.message}\n`;
      copyText += `CTA: ${segment.appPush.cta}\n\n`;
      
      copyText += `WhatsApp\n`;
      copyText += `Header: ${segment.whatsapp.header}\n`;
      copyText += `Body: ${segment.whatsapp.body}\n`;
      copyText += `Footer: ${segment.whatsapp.footer}\n`;
      copyText += `CTA 1: ${segment.whatsapp.cta1}\n`;
      copyText += `CTA 2: ${segment.whatsapp.cta2}\n\n`;
      
      if (index < segmentData.length - 1) {
        copyText += "---\n\n";
      }
    });

    return copyText;
  };

  // Function to handle copy action
  const handleCopy = async () => {
    try {
      let textToCopy = '';
      
      if (isSegmentAccordion) {
        textToCopy = generateSegmentAccordionCopyText();
      } else {
        textToCopy = content;
      }
      
      await navigator.clipboard.writeText(textToCopy);
      console.log('Content copied to clipboard');
    } catch (err) {
      console.error('Failed to copy content:', err);
    }
  };

  if (!isAI) {
    return (
      <div className="flex items-center gap-[18px] w-full bg-[#E7F0FF] px-4 py-2">
        <Avatar className="w-8 h-8 rounded-full flex-shrink-0">
          <AvatarImage src="/user-avatar.png" alt="User" />
          <AvatarFallback className="bg-gray-200">
            <User className="w-4 h-4 text-gray-600" />
          </AvatarFallback>
        </Avatar>
        <p className="text-[#143F93] text-xs font-medium leading-normal font-['Nunito Sans']">
          {displayedText}
        </p>
      </div>
    );
  }

  const iconContainerBgClass = avatarBgClass ? avatarBgClass.split(' ').find(cls => cls.startsWith('bg-')) : 'bg-gray-200';
  const iconFileClass = avatarBgClass ? avatarBgClass.split(' ').find(cls => cls.startsWith('text-')) : 'text-gray-700';

  return (
    <div className="flex gap-3 items-start py-2">
      <div className="flex-shrink-0 pt-1">
        <Avatar className={cn("w-8 h-8", (AvatarIconComponent && !avatarSrc) ? iconContainerBgClass : '')}>
          {/* Priority: avatarSrc (SVG) > AvatarIconComponent (Lucide) > dynamicAvatarSrc (GIF) */}
          {avatarSrc ? (
            <>
              <AvatarImage
                src={avatarSrc}
                alt={agentName || "AI Assistant"}
              />
              <AvatarFallback className={cn("uppercase", iconContainerBgClass, iconFileClass, 'rounded-lg')}>
                {agentName ? agentName.substring(0, 2) : "AI"}
              </AvatarFallback>
            </>
          ) : AvatarIconComponent ? (
            <AvatarFallback className={cn("flex items-center justify-center w-full h-full", iconContainerBgClass, iconFileClass, 'rounded-lg')}>
              <AvatarIconComponent className={cn("w-5 h-5")} />
            </AvatarFallback>
          ) : (
            <>
              <AvatarImage
                src={dynamicAvatarSrc || undefined}
                alt={agentName || "AI Assistant"}
              />
              <AvatarFallback className={cn("uppercase", iconContainerBgClass, iconFileClass, 'rounded-lg')}>
                {agentName ? agentName.substring(0, 2) : "AI"}
              </AvatarFallback>
            </>
          )}
        </Avatar>
      </div>
      <div className="flex-1 flex flex-col items-start min-w-0">
        {agentName && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
            {agentName}
          </p>
        )}
        <div className="p-0 flex flex-col items-start gap-[4px] w-full">
            <Card className="p-4 w-full dark:bg-[#343538] dark:shadow-[0_5px_10px_rgba(23,23,58,0.05)] rounded-lg bg-white border border-[#DDE2EE] dark:border-transparent shadow-[0_5px_10px_rgba(23,23,58,0.05)]">
                {/* Segment Accordion - Highest Priority */}
                {isSegmentAccordion ? (
                  <ContentAgentSegmentAccordions />
                ) :
                /* Scheduler Accordion */
                isSchedulerAccordion ? (
                  <SchedulerAgentCampaignAccordions />
                ) :
                /* Segment Agent Rationale */
                isSegmentAgentRationale && isAnimationDone ? (
                  <SegmentAgentRationale onContinue={onContinueSegment || (() => {})} />
                ) :
                /* Content Agent Rationale */
                isContentAgentRationale && isAnimationDone ? (
                  <ContentAgentRationale onContinue={onContinueSegment || (() => {})} onRefineThis={onRefineThis || (() => {})} />
                ) :
                /* Content Agent Question Choice */
                isContentAgentQuestionChoice && isAnimationDone ? (
                  <ContentAgentQuestionChoice />
                ) :
                /* Other Component Conditions */
                isContentAgentClarification && isAnimationDone ? (
                  <ContentAgentClarification 
                    onGenerateContent={onGenerateContent || (() => {})} 
                    promptTemplateExists={promptTemplateExists}
                  />
                ) : isContentAgent && isAnimationDone ? (
                  <ContentAgentResponse 
                    isPlanMode={isPlanMode}
                    onContentChanged={handleContentChanged}
                    onUpdateContent={onUpdateContent}
                    onDiscardChanges={onDiscardChanges}
                    updateHandlers={contentUpdateHandlersRef.current}
                    updatedContent={updatedContent}
                  />
                ) : isFlowExecutionProgress && isAnimationDone ? (
                  <FlowExecutionProgress onComplete={onFlowExecutionComplete} />
                ) : 
                /* Default Text Content */
                displayedText ? (
                  <div>
                    <p 
                        className="text-sm text-[#17173A] dark:text-white leading-normal font-['Nunito Sans'] whitespace-pre-line"
                        dangerouslySetInnerHTML={{ __html: displayedText }}
                    />
                    {/* Executive Summary Content Accordion - only shown for executive summary messages */}
                    {isExecutiveSummaryWithContent && <ExecutiveSummaryContentAccordion />}
                  </div>
                ) : null}
            </Card>
        
            {isAnimationDone && (
              <div className="flex items-center justify-between w-full mt-2 pr-1">
                <div>
                  {/* Show GENERATE CONTENT for ContentAgentClarification messages */}
                  {showGenerateContentCTA && !isContentGenerating && (
                    <div className="flex items-center rounded-[4px] shadow-md">
                      <Button
                        onClick={() => {
                          setIsContentGenerating(true);
                          onGenerateContent?.();
                        }}
                        className="bg-[#002D72] text-white hover:bg-[#001f4d] font-normal text-xs uppercase px-3.5 py-1.5 rounded-[4px] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        style={{ letterSpacing: '0.42px', lineHeight: 'normal' }}
                      >
                        Generate Content
                      </Button>
                    </div>
                  )}
                  
                  {/* Show Question Choice CTAs for ContentAgentQuestionChoice messages */}
                  {showQuestionChoiceCTAs && !isAnsweringQuestions && !isSkippingToGenerate && (
                    <div className="flex items-center gap-3">
                      <Button
                        onClick={() => {
                          setIsAnsweringQuestions(true);
                          onAnswerQuestions?.();
                        }}
                        className="bg-[#143F93] hover:bg-[#0f2d70] text-white font-medium px-4 py-2 rounded-md text-sm transition-colors uppercase"
                      >
                        Answer Questions
                      </Button>
                      
                      <Button
                        onClick={() => {
                          setIsSkippingToGenerate(true);
                          onSkipAndGenerate?.();
                        }}
                        variant="outline"
                        className="border-[#143F93] text-[#143F93] bg-white hover:bg-[#143F93]/15 hover:text-[#143F93] hover:border-[#143F93] dark:border-[#143F93] dark:text-[#143F93] dark:bg-white dark:hover:bg-[#143F93]/15 dark:hover:text-[#143F93] font-medium px-4 py-2 rounded-md text-sm transition-colors uppercase"
                      >
                        Skip And Generate
                      </Button>
                    </div>
                  )}
                  
                  {/* Show UPDATE AND CONTINUE + DISCARD CHANGES when content has changed */}
                  {!isContentAgentClarification && showApproveContentCTA && !isContentApproving && !isPlanMode && hasContentChanges && (
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={handleDiscardChanges}
                        variant="outline"
                        className="border-input bg-background hover:bg-muted hover:text-foreground font-normal text-xs uppercase px-3.5 py-1.5 rounded-[4px] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        style={{ letterSpacing: '0.42px', lineHeight: 'normal' }}
                      >
                        Discard Changes
                      </Button>
                      <Button
                        onClick={handleUpdateContent}
                        disabled={isUpdatingContent}
                        className="bg-cobalt-blue text-white font-normal text-xs uppercase px-3.5 py-1.5 rounded-[4px] hover:bg-[#0f2d70] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        style={{ letterSpacing: '0.42px', lineHeight: 'normal' }}
                      >
                        {isUpdatingContent ? 'Updating...' : 'Update and Continue'}
                      </Button>
                    </div>
                  )}
                  
                  {/* Show APPROVE CONTENT when no changes */}
                  {!isContentAgentClarification && showApproveContentCTA && !isContentApproving && !isPlanMode && !hasContentChanges && (
                    <div className="flex items-center rounded-[4px] shadow-md">
                      <Button
                        onClick={() => {
                          setIsContentApproving(true);
                          onApproveContent?.();
                        }}
                        className="bg-cobalt-blue text-white font-normal text-xs uppercase px-3.5 py-1.5 rounded-[4px] hover:bg-[#0f2d70] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        style={{ letterSpacing: '0.42px', lineHeight: 'normal' }} 
                      >
                        Approve content
                      </Button>
                    </div>
                  )}

                  {/* Show APPROVE SEGMENTS for segment agent table */}
                  {showApproveSegmentsCTA && !isSegmentsApproving && !isPlanMode && (
                    <div className="flex items-center rounded-[4px] shadow-md">
                      <Button
                        onClick={() => {
                          setIsSegmentsApproving(true);
                          onApproveSegments?.();
                        }}
                        className="bg-cobalt-blue text-white font-normal text-xs uppercase px-3.5 py-1.5 rounded-[4px] hover:bg-[#0f2d70] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        style={{ letterSpacing: '0.42px', lineHeight: 'normal' }} 
                      >
                        Approve segments
                      </Button>
                    </div>
                  )}
                  
                  {showExecuteFlowCTA && !isFlowExecuting && (
                    <div className="flex items-center rounded-[4px] shadow-md">
                      <Button
                        onClick={() => {
                          setIsFlowExecuting(true);
                          onExecuteFlow?.();
                        }}
                        className="bg-cobalt-blue text-white font-normal text-xs uppercase px-3.5 py-1.5 rounded-l-[4px] rounded-r-none hover:bg-[#0f2d70] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        style={{ letterSpacing: '0.42px', lineHeight: 'normal' }} 
                      >
                        Execute flow
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            aria-label="More options"
                            className="bg-cobalt-blue text-white p-1.5 rounded-r-[4px] rounded-l-none border-l border-white/30 hover:bg-[#0f2d70] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                          >
                            <ChevronDown className="h-3.5 w-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent 
                          align="start" 
                          className="w-[300px] bg-white dark:bg-popover border border-[#DDE2EE] dark:border-border rounded-[4px] p-0 shadow-lg"
                        >
                          <DropdownMenuItem
                            onSelect={() => {}}
                            className="flex items-center h-[50px] px-[15px] cursor-pointer text-xs font-normal text-[#17173A] dark:text-popover-foreground focus:bg-[#F4F8FF] dark:focus:bg-accent focus:text-[#17173A] dark:focus:text-accent-foreground data-[highlighted]:bg-[#F4F8FF] dark:data-[highlighted]:bg-accent data-[highlighted]:text-[#17173A] dark:data-[highlighted]:text-accent-foreground rounded-none"
                          >
                            Create content template(s)
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onSelect={() => {}}
                            className="flex items-center h-[50px] px-[15px] cursor-pointer text-xs font-normal text-[#17173A] dark:text-popover-foreground focus:bg-[#F4F8FF] dark:focus:bg-accent focus:text-[#17173A] dark:focus:text-accent-foreground data-[highlighted]:bg-[#F4F8FF] dark:data-[highlighted]:bg-accent data-[highlighted]:text-[#17173A] dark:data-[highlighted]:text-accent-foreground rounded-none"
                          >
                            Create segment(s) only
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  )}
                  
                </div>
                <div className="flex items-center gap-3 text-gray-400 dark:text-gray-500">
                  <Button variant="ghost" size="sm" className="p-1 h-auto hover:text-green-600 hover:bg-green-50 focus-visible:ring-0 focus-visible:ring-offset-0">
                    <ThumbsUp className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="sm" className="p-1 h-auto hover:text-red-600 hover:bg-red-50 focus-visible:ring-0 focus-visible:ring-offset-0">
                    <ThumbsDown className="h-3.5 w-3.5" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="p-1 h-auto hover:text-gray-600 hover:bg-gray-100 focus-visible:ring-0 focus-visible:ring-offset-0"
                    onClick={handleCopy}
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            )}
        </div>
      </div>
    </div>
  );
}

export default ChatMessage;
