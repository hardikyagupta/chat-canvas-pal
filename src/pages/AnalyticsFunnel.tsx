import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import L1Nav from "@/components/campaigns/L1Nav";
import TopNav from "@/components/campaigns/TopNav";
import ChatInterface from "@/components/ChatInterface";
import MarketingAgentsOverlay from "@/components/MarketingAgentsOverlay";
import { marketingAgents } from "@/data/agents";
import CoMarketerButton from "@/components/campaigns/CoMarketerButton";
import iconPinned from "/campaign-assets/ana-funnel-pinned.svg";
import iconStar from "/campaign-assets/ana-funnel-star.svg";

/**
 * Analytics → Funnel listing page, reached from the Funnel row of the Analytics
 * L2 flyout (Figma node 5646:44765). Same shell as <AudienceSegments/> — L1
 * rail, top bar, then the page's own header because Funnel's title block
 * carries a pin affordance that <PageHeader/> doesn't have.
 *
 * The card's "Get insights" is a ghost button leading with the animated
 * co-marketer sparkle; tapping it docks the co-marketer in the right column.
 */

/** The plot area's height in Figma — bar heights are expressed against it. */
const PLOT_H = 362;

interface Series {
  /** Legend label — the city this bar represents. */
  label: string;
  /** Fill of the colored (value) bar. */
  fill: string;
  /** Fill of the full-height track sitting behind it. */
  track: string;
}

const series: Series[] = [
  { label: "New delhi", fill: "#6979F8", track: "#E7EAFF" },
  { label: "Mumbai", fill: "#E07691", track: "#FFE1E9" },
  { label: "Bangalore", fill: "#FF9C82", track: "#FFE9E3" },
  { label: "Pune", fill: "#5DEFE4", track: "#DDFFFC" },
  { label: "Thane", fill: "#E5C35F", track: "#FFF1CA" },
];

interface Group {
  label: string;
  /** One entry per series, in `series` order. */
  bars: { value: number; /** Designed bar height in px. */ height: number }[];
}

const groups: Group[] = [
  {
    label: "Add to cart",
    bars: [
      { value: 65, height: 242 },
      { value: 55, height: 202 },
      { value: 85, height: 329 },
      { value: 65, height: 242 },
      { value: 80, height: 297 },
    ],
  },
  {
    label: "Checkout",
    bars: [
      { value: 65, height: 242 },
      { value: 55, height: 202 },
      { value: 45, height: 151 },
      { value: 65, height: 242 },
      { value: 80, height: 297 },
    ],
  },
  {
    label: "Product purchase",
    bars: [
      { value: 65, height: 242 },
      { value: 55, height: 202 },
      { value: 45, height: 151 },
      { value: 65, height: 242 },
      { value: 80, height: 297 },
    ],
  },
];

/**
 * Gridlines as drawn in Figma: 100%, 50%, 25% and 0%. Every tick still gets its
 * axis label — 75% is labelled without a rule, exactly as the design has it.
 */
const ticks = [
  { label: "100%", rule: true },
  { label: "75%", rule: false },
  { label: "50%", rule: true },
  { label: "25%", rule: true },
  { label: "0%", rule: true },
];

export default function AnalyticsFunnel() {
  const [chatOpen, setChatOpen] = useState(false);
  // The ask that opened the chat — handed to the docked co-marketer as its
  // opening message so the thread starts on the funnel that was tapped.
  const [insightPrompt, setInsightPrompt] = useState<string>();
  // `chatMounted` keeps the docked column in the DOM while its exit animation
  // plays; `chatIn` drives the enter/leave transition (slide + fade + width).
  const [chatMounted, setChatMounted] = useState(false);
  const [chatIn, setChatIn] = useState(false);
  // Bumped on every open so <ChatInterface/> remounts fresh.
  const [chatSession, setChatSession] = useState(0);
  const [isAgentsOverlayOpen, setIsAgentsOverlayOpen] = useState(false);
  const [enabledAgents, setEnabledAgents] = useState<Set<string>>(new Set());

  // Coordinate mount → enter and leave → unmount so both directions animate.
  useEffect(() => {
    if (chatOpen) {
      setChatMounted(true);
      setChatSession((n) => n + 1);
      let raf2 = 0;
      const raf1 = requestAnimationFrame(() => {
        raf2 = requestAnimationFrame(() => setChatIn(true));
      });
      return () => {
        cancelAnimationFrame(raf1);
        cancelAnimationFrame(raf2);
      };
    }
    setChatIn(false);
    if (isAgentsOverlayOpen) setIsAgentsOverlayOpen(false);
  }, [chatOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleToggleAgent = (agentId: string, agentName: string) => {
    const agent = marketingAgents.find((a) => a.id === agentId);
    if (!agent) return;

    setEnabledAgents((prev) => {
      const next = new Set(prev);
      const isJoining = !next.has(agentId);
      if (isJoining) next.add(agentId);
      else next.delete(agentId);

      window.dispatchEvent(
        new CustomEvent("agentStatusChange", {
          detail: {
            name: agentName,
            status: isJoining ? "join" : "leave",
            icon: agent.icon,
            colorClass: agent.colorClass,
          },
        })
      );
      return next;
    });
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#F4F8FF]">
      <L1Nav active="analytics" activeAnalyticsItem="funnel" />

      <div className="flex min-w-0 flex-1 flex-col p-2">
        <TopNav
          onOpenChat={() => {
            setInsightPrompt(undefined);
            setChatOpen(true);
          }}
          showCoMarketerNudge={false}
        />

        <div className="mt-2 flex min-h-0 flex-1 gap-2">
          <div className="scroll-slim min-w-0 flex-1 overflow-y-auto px-2 pt-4">
            {/* 18px between the header, the tab strip and the card — the
                design's row gap for this frame. */}
            <div className="flex flex-col gap-[18px]">
              {/* Title block + search / create */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="font-manrope text-[16px] font-bold leading-none text-[#17173A]">
                      Funnel
                    </h1>
                    <button aria-label="Unpin Funnel" className="block size-[12px] shrink-0">
                      <img src={iconPinned} alt="" className="block size-full" />
                    </button>
                  </div>
                  <p className="mt-[10px] font-manrope text-[14px] font-medium leading-[16px] tracking-[0.42px] text-[#6F6F8D]">
                    Track, analyze, and optimize user conversions and drop-offs with funnel
                    analytics.
                  </p>
                </div>

                <div className="flex items-center gap-4 pr-6">
                  <button
                    aria-label="Search funnels"
                    className="grid size-[30px] place-items-center rounded-[4px] border border-[#DDE2EE] bg-white text-[#6F6F8D] transition-colors hover:bg-[#F4F8FF]"
                  >
                    <Search className="size-[15px]" strokeWidth={1.8} />
                  </button>
                  <button className="rounded-[4px] bg-[#2F68E5] px-3 py-[5px] font-manrope text-[14px] font-semibold leading-[20px] tracking-[0.42px] text-white shadow-[0px_5px_5px_rgba(0,0,0,0.05)] transition-colors hover:bg-[#255AD2]">
                    Create funnel
                  </button>
                </div>
              </div>

              {/* Tab strip + retention note */}
              <div className="flex items-center justify-between">
                <div className="flex items-start gap-[5px]">
                  <button className="flex flex-col items-center gap-[6px]">
                    <span className="font-manrope text-[14px] font-bold tracking-[0.2917px] text-[#2F68E5]">
                      Starred (01)
                    </span>
                    <span className="h-[3px] w-full rounded-[1.5px] bg-[#2F68E5]" />
                  </button>
                  <button className="pt-[1px] font-manrope text-[14px] font-semibold tracking-[0.2917px] text-[#6F6F8D]">
                    All (39)
                  </button>
                </div>
                <p className="font-manrope text-[14px] tracking-[0.2917px] text-[#6F6F8D]">
                  *Expired funnels will be auto-archived due to data retention policy
                </p>
              </div>

              {/* Funnel card */}
              <div className="rounded-[5px] border border-[#DDE2EE] bg-white pb-6">
                <div className="flex h-[63px] items-center justify-between px-[23px]">
                  <div className="flex items-center gap-4">
                    {/* 16px box with the glyph inset 4.54% off the bottom, as
                        exported — sizing the leaf to the box would stretch it. */}
                    <span className="relative block size-4 shrink-0" aria-label="Starred" role="img">
                      <span className="absolute inset-[0_0_4.54%_0]">
                        <img src={iconStar} alt="" className="block size-full" />
                      </span>
                    </span>
                    <span className="font-manrope text-[14px] font-bold tracking-[0.3333px] text-[#291E30]">
                      First app_launch
                    </span>
                  </div>
                  {/* Sheen treatment rather than the top bar's rotating snake
                      border — this sits inside the funnel card and shouldn't
                      read as the "Ask co-marketer" CTA. */}
                  <CoMarketerButton
                    label="Get insights"
                    ghost
                    animation="sheen"
                    onClick={() => {
                      setInsightPrompt(
                        "Get insights on the First app_launch funnel — where are users dropping off?"
                      );
                      setChatOpen(true);
                    }}
                  />
                </div>

                <div className="border-t border-[#DDE2EE]" />

                {/* Headline stats */}
                <div className="flex gap-[152px] px-[42px] pt-[31px]">
                  {[
                    { label: "Conversion rate", value: "62%", tone: "text-[#291E30]" },
                    { label: "Average time", value: "2min", tone: "text-[#17173A]" },
                  ].map((stat) => (
                    <div key={stat.label}>
                      <p className="font-manrope text-[14px] tracking-[0.2917px] text-[#6F6F8D]">
                        {stat.label}
                      </p>
                      <p
                        className={`mt-[5px] font-manrope text-[20px] font-bold tracking-[0.4167px] ${stat.tone}`}
                      >
                        {stat.value}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Grouped bar chart */}
                <div className="mt-[31px] px-[42px]">
                  <div className="flex">
                    {/* Y axis: each tick label sits on its own gridline, so the
                        column is the plot's height plus the label's half-line. */}
                    <div
                      className="relative w-[47px] shrink-0"
                      style={{ height: PLOT_H, marginTop: 14 }}
                    >
                      {ticks.map((tick, i) => (
                        <p
                          key={tick.label}
                          className="absolute right-[10px] -translate-y-1/2 font-manrope text-[14px] tracking-[0.4167px] text-[#6F6F8D]"
                          style={{ top: `${(i / (ticks.length - 1)) * 100}%` }}
                        >
                          {tick.label}
                        </p>
                      ))}
                    </div>

                    <div className="min-w-0 flex-1">
                      {/* Plot: gridlines behind, one bar group per funnel step. */}
                      <div className="relative" style={{ height: PLOT_H, marginTop: 14 }}>
                        {ticks.map((tick, i) =>
                          tick.rule ? (
                            <span
                              key={tick.label}
                              className="absolute inset-x-0 h-px bg-[#DDE2EE]"
                              style={{ top: `${(i / (ticks.length - 1)) * 100}%` }}
                            />
                          ) : null
                        )}

                        <div className="absolute inset-0 flex gap-[48px]">
                          {groups.map((group) => (
                            <div key={group.label} className="flex min-w-0 flex-1">
                              {group.bars.map((bar, i) => (
                                <div
                                  key={series[i].label}
                                  className="relative flex min-w-0 flex-1 flex-col justify-end"
                                  style={{ backgroundColor: series[i].track }}
                                >
                                  {/* The value label is centred in the colored
                                      bar, as in the design. */}
                                  <div
                                    className="flex items-center justify-center"
                                    style={{
                                      height: `${(bar.height / PLOT_H) * 100}%`,
                                      backgroundColor: series[i].fill,
                                    }}
                                  >
                                    <span className="font-manrope text-[14px] font-semibold tracking-[0.4167px] text-black">
                                      {bar.value}%
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Step labels, centred under their group */}
                      <div className="mt-[15px] flex gap-[48px]">
                        {groups.map((group) => (
                          <p
                            key={group.label}
                            className="min-w-0 flex-1 text-center font-manrope text-[16px] font-semibold tracking-[0.4167px] text-black"
                          >
                            {group.label}
                          </p>
                        ))}
                      </div>

                      {/* Legend — swatches carry each series' bar fill so the
                          chart and its key read as the same colours. */}
                      <div className="mt-[42px] flex items-center justify-center gap-[30px]">
                        {series.map((s) => (
                          <div key={s.label} className="flex items-center gap-3">
                            <span
                              className="block h-[17.324px] w-[19px] shrink-0"
                              style={{ backgroundColor: s.fill }}
                            />
                            <span className="font-manrope text-[14px] tracking-[0.2917px] text-black">
                              {s.label}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="h-8" />
          </div>

          {/* Co-marketer chat — docked third column */}
          {chatMounted && (
            <div
              className={cn(
                "flex h-full min-h-0 shrink-0 justify-end overflow-hidden pr-1",
                "transition-[width,opacity] duration-[360ms] ease-[cubic-bezier(0.22,1,0.36,1)]",
                "motion-reduce:transition-none",
                chatIn ? "w-[474px] opacity-100" : "w-0 opacity-0"
              )}
              onTransitionEnd={(e) => {
                if (e.target === e.currentTarget && e.propertyName === "width" && !chatIn) {
                  setChatMounted(false);
                }
              }}
            >
              <MarketingAgentsOverlay
                isOpen={isAgentsOverlayOpen}
                onOpenChange={setIsAgentsOverlayOpen}
                enabledAgents={enabledAgents}
                onToggleAgent={handleToggleAgent}
              />
              <ChatInterface
                key={chatSession}
                initialExpanded={false}
                docked
                conversationVariant="campaigns"
                initialMessage={insightPrompt}
                onBotIconClick={() => setIsAgentsOverlayOpen(true)}
                enabledAgents={enabledAgents}
                setEnabledAgents={setEnabledAgents}
                onCloseInterface={() => setChatOpen(false)}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
