import React, { useCallback, useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
// Imported (not /public) so Vite content-hashes the URL — every gif change
// busts the browser cache automatically.
import customAgentsGif from "@/assets/custom-agents.gif";
import multiAgentsGif from "@/assets/multi-agents.gif";
import deepResearchGif from "@/assets/deep-research.gif";
import scheduleReportsGif from "@/assets/schedule-reports.gif";

// Session-scoped dismissal: cleared when the tab/session ends, so the strip
// reappears in a new session (per spec).
const DISMISS_KEY = "discoveryBannersDismissed";

/**
 * DiscoveryBanners — the rotating "did you know" cards shown at the bottom of
 * the empty chat state. Each card is a 540×96 banner: text on the LEFT, an
 * illustration on the RIGHT. Cards auto-advance every AUTOPLAY_MS; tapping a
 * dot jumps straight to that card.
 *
 * To add / edit / reorder cards, touch ONLY the DISCOVERY_BANNERS array below —
 * everything else (carousel, timer, dots) is content-agnostic.
 */

// ---------------------------------------------------------------------------
// Tunables — nudge these to restyle the whole strip.
// ---------------------------------------------------------------------------
const AUTOPLAY_MS = 5000; // dwell time per card
const TRANSITION_MS = 500; // slide duration between cards
const CARD_WIDTH = 540; // px — matches the ~540×96 spec
const CARD_HEIGHT = 96; // px

// ---------------------------------------------------------------------------
// Illustrations — one lightweight inline SVG per card. Kept here so a card and
// its art travel together. Each is authored on a 96×96 canvas.
// ---------------------------------------------------------------------------
type IllustrationProps = { className?: string };

const CustomAgentArt: React.FC<IllustrationProps> = ({ className }) => (
  // Custom-agents bots GIF (public/custom-agents.gif). Full card height (96px),
  // width auto — overrides the shared 80px sizing passed in via className.
  <img src={customAgentsGif} alt="" className={cn(className, "h-[96px] w-auto object-contain")} />
);

const ResearchReportArt: React.FC<IllustrationProps> = ({ className }) => (
  // Deep-research GIF (src/assets/deep-research.gif) — hashed import busts cache.
  <img src={deepResearchGif} alt="" className={cn(className, "h-[96px] w-auto object-contain")} />
);

const ScheduleReportArt: React.FC<IllustrationProps> = ({ className }) => (
  // Schedule-reports GIF (src/assets/schedule-reports.gif) — hashed import busts cache.
  <img src={scheduleReportsGif} alt="" className={cn(className, "h-[96px] w-auto object-contain")} />
);

const MultiAgentArt: React.FC<IllustrationProps> = ({ className }) => (
  // Multi-agents GIF (src/assets/multi-agents.gif) — hashed import busts cache.
  <img src={multiAgentsGif} alt="" className={cn(className, "h-[96px] w-auto object-contain")} />
);

// ---------------------------------------------------------------------------
// Card content — the single source of truth. Edit here to change copy / art.
// ---------------------------------------------------------------------------
export type DiscoveryBanner = {
  id: string;
  title: string;
  body: string;
  Illustration: React.FC<IllustrationProps>;
};

export const DISCOVERY_BANNERS: DiscoveryBanner[] = [
  {
    id: "custom-agents",
    title: "Create custom AI agents",
    body: "Built for your marketing goals.",
    Illustration: CustomAgentArt,
  },
  {
    id: "deep-research-reports",
    title: "Generate deep research reports",
    body: "Receive a detailed report while you focus on your work.",
    Illustration: ResearchReportArt,
  },
  {
    id: "schedule-reports",
    title: "Schedule recurring reports",
    body: "Schedule reports for yourself or your team.",
    Illustration: ScheduleReportArt,
  },
  {
    id: "multi-agent",
    title: "Work with multiple AI agents",
    body: "From insights to execution in one conversation.",
    Illustration: MultiAgentArt,
  },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
type DiscoveryBannersProps = {
  banners?: DiscoveryBanner[];
  className?: string;
  /** Fired with the banner id when a card is tapped. */
  onActivate?: (bannerId: string) => void;
};

const DiscoveryBanners: React.FC<DiscoveryBannersProps> = ({
  banners = DISCOVERY_BANNERS,
  className,
  onActivate,
}) => {
  const count = banners.length;
  // Dismissed for this session? Reappears in a new session (sessionStorage).
  const [dismissed, setDismissed] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem(DISMISS_KEY) === "1";
    } catch {
      return false;
    }
  });
  const dismiss = useCallback(() => {
    try {
      sessionStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* ignore storage failures — still hide for this render */
    }
    setDismissed(true);
  }, []);
  // Seamless infinite loop: render a clone of the first card at the end. `pos`
  // walks 0..count; landing on `count` (the clone) slides forward, then we
  // snap back to 0 with the transition off — so the last→first wrap always
  // reads as a natural forward move, never a jump backwards.
  const [pos, setPos] = useState(0);
  const [animate, setAnimate] = useState(true);
  const active = pos % count; // which real card the dots highlight
  // Pause autoplay while the pointer is over the strip so users can read.
  const pausedRef = useRef(false);

  const goTo = useCallback((index: number) => {
    setAnimate(true);
    setPos(((index % count) + count) % count);
  }, [count]);

  // Autoplay — always steps forward (into the clone when leaving the last card).
  useEffect(() => {
    if (count <= 1) return;
    const timer = window.setInterval(() => {
      if (pausedRef.current) return;
      setAnimate(true);
      setPos((prev) => prev + 1);
    }, AUTOPLAY_MS);
    return () => window.clearInterval(timer);
  }, [count]);

  // After the slide onto the clone finishes, snap back to the real first card
  // with the transition disabled (invisible reset).
  useEffect(() => {
    if (pos !== count) return;
    const t = window.setTimeout(() => {
      setAnimate(false);
      setPos(0);
    }, TRANSITION_MS);
    return () => window.clearTimeout(t);
  }, [pos, count]);

  // Re-arm the transition on the next frame after a snap-back.
  useEffect(() => {
    if (animate) return;
    const t = window.setTimeout(() => setAnimate(true), 20);
    return () => window.clearTimeout(t);
  }, [animate]);

  if (count === 0 || dismissed) return null;

  // Real cards + a clone of the first for the seamless wrap.
  const slides = [...banners, banners[0]];

  return (
    <div
      className={cn("group/discovery flex flex-col items-center gap-[10px]", className)}
      onMouseEnter={() => (pausedRef.current = true)}
      onMouseLeave={() => (pausedRef.current = false)}
    >
      {/* Card + close-button context — relative so the × can sit on the top edge
          without being clipped by the viewport's overflow-hidden. */}
      <div className="relative w-full" style={{ maxWidth: CARD_WIDTH }}>
        {/* Close (×) — appears on hover; "Don't show again" dismisses for the
            session. */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={dismiss}
                aria-label="Don't show again"
                className="absolute -top-[10px] -right-[10px] z-10 flex h-[24px] w-[24px] items-center justify-center rounded-full bg-[var(--color-grey-soft)] text-white opacity-0 shadow-sm transition-opacity duration-200 hover:bg-[var(--color-grey)] focus-visible:opacity-100 group-hover/discovery:opacity-100"
              >
                <X className="h-[14px] w-[14px]" strokeWidth={2.5} />
              </button>
            </TooltipTrigger>
            <TooltipContent
              side="top"
              className="border-0 bg-foreground text-background text-[12px] leading-[16px] px-[8px] py-[4px]"
              style={{ fontFamily: "Manrope, sans-serif", fontWeight: 500 }}
            >
              <p>Don't show again</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

      {/* Viewport — fixed to the card size, clips the sliding track. */}
      <div
        className="w-full overflow-hidden rounded-[12px]"
        style={{ height: CARD_HEIGHT }}
        role="group"
        aria-roledescription="carousel"
        aria-label="Discover what you can do"
      >
        <div
          className="flex h-full"
          style={{
            transform: `translateX(-${pos * 100}%)`,
            transition: animate ? `transform ${TRANSITION_MS}ms cubic-bezier(0.4, 0, 0.2, 1)` : "none",
          }}
        >
          {slides.map((banner, index) => {
            const Art = banner.Illustration;
            const isClone = index === count;
            return (
              <button
                key={isClone ? `${banner.id}-clone` : banner.id}
                type="button"
                onClick={() => onActivate?.(banner.id)}
                aria-hidden={isClone}
                tabIndex={index === active ? 0 : -1}
                className="flex h-full w-full shrink-0 items-center justify-between gap-3 overflow-hidden rounded-[12px] border border-[var(--color-line)] bg-[#F6F6F6] pl-[20px] pr-0 text-left transition-colors hover:border-[var(--color-line-strong)]"
              >
                {/* LEFT — text */}
                <div className="flex min-w-0 flex-col gap-[4px]">
                  <p
                    className="text-[13px] font-semibold leading-[18px] text-[var(--color-ink)]"
                    style={{ fontFamily: "Manrope, sans-serif" }}
                  >
                    {banner.title}
                  </p>
                  <p
                    className="text-[10px] leading-[14px] text-[var(--color-grey)]"
                    style={{ fontFamily: "Manrope, sans-serif" }}
                  >
                    {banner.body}
                  </p>
                </div>
                {/* RIGHT — illustration */}
                <Art className="h-[80px] w-[80px] shrink-0" />
              </button>
            );
          })}
        </div>
      </div>
      </div>

      {/* Dots — tap to jump to a card. */}
      {count > 1 && (
        <div className="flex items-center gap-[6px]">
          {banners.map((banner, index) => {
            const isActive = index === active;
            return (
              <button
                key={banner.id}
                type="button"
                onClick={() => goTo(index)}
                aria-label={`Go to ${banner.title}`}
                aria-current={isActive}
                className={cn(
                  "h-[6px] rounded-full transition-all duration-300",
                  isActive
                    ? "w-[18px] bg-[var(--color-royal)]"
                    : "w-[6px] bg-[var(--color-line-strong)] hover:bg-[var(--color-grey-soft)]"
                )}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};

export default DiscoveryBanners;
