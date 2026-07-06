import React, { useState, useRef, KeyboardEvent, CSSProperties, useEffect } from 'react';
import { Command, CommandGroup, CommandItem, CommandEmpty, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ActionMenu, ActionMenuTrigger, ActionMenuContent, ActionMenuItem } from "@/components/ui/action-menu";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { ArrowUp, StopCircle, X, Plus, ImagePlus, Blocks, FileVideo, FileAudio, FileText, File as FileIcon, Loader2 } from 'lucide-react';
import { marketingAgents, MarketingAgent } from '@/data/agents';
import { cn } from "@/lib/utils";

interface Agent {
  id: string;
  name: string;
}

type AttachmentCategory = 'image' | 'video' | 'audio' | 'document';

interface Attachment {
  id: string;
  name: string;
  size: number;
  category: AttachmentCategory;
  /** Object URL for image previews (revoked on remove). */
  previewUrl?: string;
  status: 'uploading' | 'done';
}

const CATEGORY_LABEL: Record<AttachmentCategory, string> = {
  image: 'Image',
  video: 'Video',
  audio: 'Audio',
  document: 'Document',
};

const getAttachmentCategory = (file: File): AttachmentCategory => {
  const t = file.type;
  if (t.startsWith('image/')) return 'image';
  if (t.startsWith('video/')) return 'video';
  if (t.startsWith('audio/')) return 'audio';
  return 'document';
};

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

// Icon + tint used for the non-image (doc/video/audio) attachment cards.
const getDocVisual = (category: AttachmentCategory) => {
  switch (category) {
    case 'video':
      return { Icon: FileVideo, className: 'bg-orange text-white' };
    case 'audio':
      return { Icon: FileAudio, className: 'bg-[var(--color-royal)] text-white' };
    case 'document':
      return { Icon: FileText, className: 'bg-[var(--color-surface-1)] text-[var(--color-charcoal)]' };
    default:
      return { Icon: FileIcon, className: 'bg-[var(--color-surface-1)] text-[var(--color-charcoal)]' };
  }
};

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
  /** Fired with the live textarea value on every change (typing, clear-on-send). */
  onInputValueChange?: (value: string) => void;
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
  onInputValueChange,
}) => {
  const [inputValue, setInputValue] = useState("");
  const [showMentionList, setShowMentionList] = useState(false);
  const [cursorPosition, setCursorPosition] = useState(0);
  const [mentionSearch, setMentionSearch] = useState("");
  const [popoverStyle, setPopoverStyle] = useState<CSSProperties>({});
  // Controls the "+" attachment menu (Add files or photos / Skills)
  const [showPlusMenu, setShowPlusMenu] = useState(false);
  // Files/photos attached to the current message (shown above the textarea).
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFilesSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (files.length === 0) return;
    const newItems: Attachment[] = files.map((file, i) => {
      const category = getAttachmentCategory(file);
      return {
        id: `${Date.now()}-${i}-${file.name}`,
        name: file.name,
        size: file.size,
        category,
        previewUrl: category === 'image' ? URL.createObjectURL(file) : undefined,
        status: 'uploading',
      };
    });
    setAttachments((prev) => [...prev, ...newItems]);
    // Simulate an upload completing (swap "Uploading …" → "Type · Size").
    newItems.forEach((item) => {
      setTimeout(() => {
        setAttachments((prev) =>
          prev.map((a) => (a.id === item.id ? { ...a, status: 'done' } : a))
        );
      }, 1500);
    });
    // Allow re-selecting the same file later.
    event.target.value = '';
  };

  const attachmentsScrollRef = useRef<HTMLDivElement>(null);
  // Whether content is clipped on each side → drives the edge fade overlays.
  const [attFade, setAttFade] = useState({ left: false, right: false });
  const updateAttFade = () => {
    const el = attachmentsScrollRef.current;
    if (!el) return;
    setAttFade({
      left: el.scrollLeft > 1,
      right: el.scrollLeft + el.clientWidth < el.scrollWidth - 1,
    });
  };
  useEffect(() => {
    updateAttFade();
  }, [attachments]);

  const removeAttachment = (id: string) => {
    setAttachments((prev) => {
      const found = prev.find((a) => a.id === id);
      if (found?.previewUrl) URL.revokeObjectURL(found.previewUrl);
      return prev.filter((a) => a.id !== id);
    });
  };
  // True once the textarea wraps past one line — drives the container's grow +
  // radius change (mirrors the chip-expanded state).
  const [isMultiline, setIsMultiline] = useState(false);
  // True when content exceeds the 4-line cap (drives the bottom fade overlay).
  const [isScrollable, setIsScrollable] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const measurementRef = useRef<HTMLSpanElement>(null);

  // Auto-grow the textarea: reset to content height, capped at 4 lines (88px),
  // then scroll. Runs on every value change (typing, paste, clear-after-send).
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    const MAX_H = 88; // 4 lines × 22px line-height
    el.style.height = 'auto';
    const next = Math.min(el.scrollHeight, MAX_H);
    el.style.height = `${next}px`;
    const scrollable = el.scrollHeight > MAX_H;
    el.style.overflowY = scrollable ? 'auto' : 'hidden';
    setIsMultiline(next > 23);
    setIsScrollable(scrollable);
  }, [inputValue]);

  useEffect(() => {
    onInputValueChange?.(inputValue);
  }, [inputValue, onInputValueChange]);

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

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    // Enter sends; Shift+Enter inserts a newline (modern multiline input).
    if (e.key === 'Enter' && !e.shiftKey && !showMentionList && inputValue.trim()) {
      e.preventDefault();
      if (onSend) {
        onSend(inputValue.trim());
      }
      setInputValue('');
      setAttachments([]);
    } else if (e.key === 'Escape' && showMentionList) {
      setShowMentionList(false);
    }
  };

  const handleSendClick = () => {
    if (inputValue.trim() && onSend) {
      onSend(inputValue.trim());
      setInputValue('');
      setAttachments([]);
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
    // Expanded = a chip is selected OR the text has wrapped past one line. In this
    // state the textarea spans the full width (text reaches the right edge, like
    // ChatGPT) and the chip + send button drop to a row below.
    const expanded = !!selectedContextChip || isMultiline || attachments.length > 0;
    return (
      <div className="relative w-full">
        {/* Outer container — height grows smoothly when chip appears */}
        <div
          className={cn(
            "relative overflow-hidden w-full border-[0.5px] border-[var(--color-line-input)] min-h-[56px] pt-[12px] pr-[12px] pb-[12px] pl-[12px] transition-[border-radius] duration-200",
            // Pill at 56px in the default single-line state (border-box absorbs the
            // 0.5px borders so it's exactly 56px). Once the field grows past one
            // line — or a context chip is selected — it relaxes to a 16px radius
            // and grows to fit (textarea handles the height, capped at 4 lines).
            expanded ? "rounded-[16px]" : "rounded-[48px]",
            "drop-shadow-[0px_1px_1px_oklch(0.21_0.034_263.436_/_0.05)]",
            "focus-within:ring-1 focus-within:ring-[var(--color-royal)] transition-shadow",
            // Disabled (questionnaire) OR generating: greyish fill + not-allowed across the field
            (isQuestionnaireActive || isLoading) ? "bg-[var(--color-surface-1)] cursor-not-allowed" : "bg-card"
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
          {/* Hidden file picker driven by the "+" → "Add files or photos" menu item. */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.csv"
            className="hidden"
            onChange={handleFilesSelected}
          />

          {/* Attachments — always render above the text. Image files show as square
              thumbnails; docs/video/audio show as a row card (icon + name + type·size). */}
          {attachments.length > 0 && (
            <div className="relative z-10 mb-[10px]">
              {/* Edge fades — appear only when the row is clipped on that side. */}
              {attFade.left && (
                <div aria-hidden="true" className="pointer-events-none absolute left-0 top-0 bottom-0 z-10 w-[24px] bg-gradient-to-r from-white to-transparent" />
              )}
              {attFade.right && (
                <div aria-hidden="true" className="pointer-events-none absolute right-0 top-0 bottom-0 z-10 w-[24px] bg-gradient-to-l from-white to-transparent" />
              )}
              <div
                ref={attachmentsScrollRef}
                onScroll={updateAttFade}
                className="attachments-scroll flex flex-nowrap gap-[8px] overflow-x-auto"
              >
              {attachments.map((a) => {
                if (a.category === 'image' && a.previewUrl) {
                  return (
                    <div
                      key={a.id}
                      className="group relative w-[64px] h-[64px] rounded-[12px] overflow-hidden border border-[var(--color-line-input)] shrink-0"
                    >
                      <img src={a.previewUrl} alt={a.name} className="w-full h-full object-cover" />
                      {a.status === 'uploading' && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                          <Loader2 className="w-4 h-4 text-white animate-spin" />
                        </div>
                      )}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            aria-label={`Remove ${a.name}`}
                            onClick={() => removeAttachment(a.id)}
                            className="absolute top-[3px] right-[3px] flex items-center justify-center w-[18px] h-[18px] rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100"
                          >
                            <X className="w-[12px] h-[12px]" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" align="start" className="border-0 bg-foreground text-background">
                          Remove file
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  );
                }
                const { Icon, className: iconClass } = getDocVisual(a.category);
                return (
                  <div
                    key={a.id}
                    className="group relative flex items-center gap-[10px] rounded-[12px] border border-[var(--color-line-input)] bg-card pl-[10px] pr-[12px] py-[8px] shrink-0"
                  >
                    <div className={cn("flex items-center justify-center w-[40px] h-[40px] rounded-[8px] shrink-0", iconClass)}>
                      <Icon className="w-[20px] h-[20px]" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[14px] font-medium text-[var(--color-ink)] truncate max-w-[220px]">
                        {a.name}
                      </p>
                      <p className="text-[12px] text-[var(--color-grey)]">
                        {a.status === 'uploading'
                          ? 'Uploading …'
                          : `${CATEGORY_LABEL[a.category]} · ${formatFileSize(a.size)}`}
                      </p>
                    </div>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          aria-label={`Remove ${a.name}`}
                          onClick={() => removeAttachment(a.id)}
                          className="flex items-center justify-center w-[20px] h-[20px] rounded-full text-[var(--color-grey)] opacity-0 transition-opacity hover:bg-[oklch(0_0_0_/_0.06)] group-hover:opacity-100 shrink-0"
                        >
                          <X className="w-[14px] h-[14px]" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" align="start" className="border-0 bg-foreground text-background">
                        Remove file
                      </TooltipContent>
                    </Tooltip>
                  </div>
                );
              })}
              </div>
            </div>
          )}

          {/* Flex-wrap row: textarea + chip + send. Compact single row by default;
              when `expanded`, the textarea takes the full width (basis-full) so it
              wraps everything else (chip, send) to a row below — text reaches the
              right edge and the send button sits bottom-right (ChatGPT-style). */}
          <div className={cn("relative z-10 flex flex-wrap items-center gap-x-[8px]", expanded ? "gap-y-[26px]" : "gap-y-[10px]")}>
            {/* Auto-growing textarea — grows from 1 to 4 lines, then scrolls.
                Sits on top (row 1) when expanded; otherwise shares the row. */}
            <div className={cn("relative min-w-0", expanded ? "order-1 basis-full w-full" : "order-2 flex-1")}>
              <textarea
                ref={inputRef}
                rows={1}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask Co-marketer..."
                disabled={isQuestionnaireActive || isLoading}
                className="chat-input-scroll block w-full min-w-0 resize-none bg-transparent border-0 p-0 text-[14px] leading-[22px] text-foreground placeholder:text-[var(--color-grey)] focus:outline-none disabled:cursor-not-allowed"
                style={{ fontFamily: "Manrope, sans-serif", fontWeight: 500, maxHeight: "88px" }}
                autoComplete="off"
              />
              {/* Bottom fade — appears once content scrolls past the 4-line cap */}
              {isScrollable && (
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-x-0 bottom-0 h-[22px] bg-gradient-to-t from-white to-transparent"
                />
              )}
            </div>

            {/* + button — "Add files and more" (no action yet). Left edge by default,
                bottom-left when expanded. Matches the 32×32 send-button size. */}
            <ActionMenu open={showPlusMenu} onOpenChange={setShowPlusMenu}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <ActionMenuTrigger asChild>
                    <button
                      type="button"
                      aria-label="Add files and more"
                      disabled={isQuestionnaireActive || isLoading}
                      className={cn(
                        "flex items-center justify-center w-[32px] h-[32px] rounded-full shrink-0 transition-colors",
                        (isQuestionnaireActive || isLoading)
                          ? "opacity-50 cursor-not-allowed"
                          : "hover:bg-[oklch(0_0_0_/_0.06)] data-[state=open]:bg-[oklch(0_0_0_/_0.06)]",
                        expanded ? "order-2" : "order-1"
                      )}
                    >
                      <Plus className="w-[20px] h-[20px] text-[var(--color-charcoal)]" />
                    </button>
                  </ActionMenuTrigger>
                </TooltipTrigger>
                <TooltipContent side="bottom" align="start" className="border-0 bg-foreground text-background">
                  Add files and more
                </TooltipContent>
              </Tooltip>
              <ActionMenuContent side="bottom" align="start" alignOffset={-5}>
                <ActionMenuItem
                  icon={ImagePlus}
                  onSelect={() => fileInputRef.current?.click()}
                >
                  Add files or photos
                </ActionMenuItem>
                <ActionMenuItem icon={Blocks} onSelect={() => {}}>
                  Skills
                </ActionMenuItem>
              </ActionMenuContent>
            </ActionMenu>

            {/* Context chip — bottom-left when selected (after the + button) */}
            {selectedContextChip && (
              <button
                type="button"
                onClick={onClearSelectedContextChip}
                className="order-3 inline-flex items-center gap-[4px] border border-[var(--color-royal)] rounded-[4px] px-[6px] py-[4px] shadow-[0px_0px_0px_2px_oklch(0.554_0.199_263.043_/_0.1)] whitespace-nowrap animate-in fade-in duration-200"
                style={{
                  backgroundImage:
                    "linear-gradient(180deg, var(--color-background) 0%, oklch(1 0 0 / 0) 100%), linear-gradient(180deg, var(--color-royal-pale) 0%, oklch(0.894 0.051 266.995 / 0.6) 100%)",
                }}
              >
                <span
                  className="text-[12px] leading-[16px] text-[var(--color-royal)]"
                  style={{ fontFamily: "Manrope, sans-serif", fontWeight: 400 }}
                >
                  {selectedContextChip}
                </span>
                <X className="w-[14px] h-[14px] text-[var(--color-royal)] shrink-0" />
              </button>
            )}

            {/* Send button — far right (always last in the row) */}
            <div className="order-4 flex shrink-0 ml-auto">
              <button
                type="button"
                onClick={handleSendClick}
                disabled={isQuestionnaireActive || isLoading}
                className={cn(
                  // Fixed 32×32 in every state so the field height never changes
                  // (default field height = 56px: 32px button + 2×12px padding).
                  "relative flex items-center justify-center overflow-hidden rounded-[30px] w-[32px] h-[32px] shrink-0 transition-all duration-200",
                  isActive
                    ? "border-[0.75px] border-[var(--color-royal-strong)] shadow-[0px_1px_0px_0px_oklch(0_0_0_/_0.02)]"
                    : "border-0",
                  isQuestionnaireActive && "opacity-50 cursor-not-allowed"
                )}
                style={{
                  background: isActive
                    ? "linear-gradient(180deg, oklch(1 0 0 / 0) 0%, oklch(1 0 0 / 0.24) 100%), linear-gradient(90deg, var(--color-royal) 0%, var(--color-royal) 100%)"
                    : "linear-gradient(90deg, oklch(0 0 0 / 0.08) 0%, oklch(0 0 0 / 0.08) 100%), linear-gradient(180deg, oklch(1 0 0 / 0) 0%, oklch(1 0 0 / 0.24) 100%)",
                }}
                aria-label={isLoading ? "Generating response" : "Send message"}
              >
                {/* Inner highlight for active state */}
                {isActive && (
                  <span
                    className="absolute inset-0 rounded-[30px] pointer-events-none"
                    style={{ boxShadow: "inset 0px 1px 1px 0px oklch(1 0 0 / 0.25)" }}
                  />
                )}
                {isLoading ? (
                  /* Loading/disabled state — grey rounded square per Figma (node 16318:13144) */
                  <span className="block w-3 h-3 rounded-[4px] bg-[var(--color-grey)] relative z-10" />
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
            ref={inputRef as unknown as React.Ref<HTMLInputElement>}
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
              "w-full h-[56px] pl-4 pr-0 pt-3 pb-3 rounded-lg border border-[var(--color-line-input)] dark:border-input-border dark:bg-input focus:outline-none focus:ring-1 focus:ring-[var(--color-royal)] dark:focus:ring-ring transition-shadow text-sm placeholder:text-[var(--color-grey)] dark:placeholder:text-foreground-muted dark:text-foreground shadow-[0px_1px_2px_0px_oklch(0.21_0.034_263.436_/_0.05)]",
              isQuestionnaireActive && "cursor-not-allowed opacity-50 bg-muted"
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
            ? "text-[var(--color-grey)] dark:text-foreground-muted hover:text-cobalt-blue dark:hover:text-accent" 
            : inputValue.trim() 
              ? "bg-[var(--color-navy-deep)] text-white hover:bg-[var(--color-navy-deepest)]" 
              : "bg-surface-2 text-grey-soft cursor-not-allowed",
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
