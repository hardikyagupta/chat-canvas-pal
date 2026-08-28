import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "/campaign-assets/netcore-logo.svg";
import iconAiDashboard from "/campaign-assets/nav-ai-dashboard.svg";
import iconAgents from "/campaign-assets/nav-agents.svg";
import iconDecisioning from "/campaign-assets/nav-decisioning.svg";
import iconPinned from "/campaign-assets/nav-pinned.svg";
import iconDashboard from "/campaign-assets/nav-dashboard.svg";
import iconEngage from "/campaign-assets/nav-engage.svg";
import iconAudience from "/campaign-assets/nav-audience.svg";
import iconContent from "/campaign-assets/nav-content.svg";
import iconAnalytics from "/campaign-assets/nav-analytics.svg";
import iconSettings from "/campaign-assets/nav-settings.svg";
import iconProfile from "/campaign-assets/nav-profile.svg";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import EngageL2 from "./EngageL2";
import AudienceL2 from "./AudienceL2";
import AnalyticsL2 from "./AnalyticsL2";

/**
 * L1 left navigation rail — 48px wide, Primary/Ash (#291E30), rounded on the
 * right edge. Netcore mark at top, primary destinations in the middle, and
 * settings + profile pinned to the bottom.
 */
const primary = [
  { key: "pinned", icon: iconPinned, label: "Pinned" },
  { key: "ai-dashboard", icon: iconAiDashboard, label: "AI Dashboard", route: "/ai-dashboard" },
  { key: "agents", icon: iconAgents, label: "Agents", route: "/agents" },
  { key: "decisioning", icon: iconDecisioning, label: "Decisioning engine", route: "/decisioning-engine" },
  { key: "dashboard", icon: iconDashboard, label: "Dashboards" },
  { key: "engage", icon: iconEngage, label: "Engage", route: "/campaigns" },
  { key: "audience", icon: iconAudience, label: "Audience" },
  { key: "content", icon: iconContent, label: "Content" },
  { key: "analytics", icon: iconAnalytics, label: "Analytics" },
];

function NavButton({
  icon,
  label,
  active,
  onClick,
  showDot,
}: {
  icon: string;
  label: string;
  active?: boolean;
  onClick?: () => void;
  /** Royal-blue pulsing dot on the lower edge — same as Ask co-marketer's. */
  showDot?: boolean;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={onClick}
          aria-label={label}
          className={`relative grid h-8 w-8 place-items-center rounded transition-colors ${
            active ? "bg-white/10" : "hover:bg-white/10"
          }`}
        >
          {showDot && (
            <span
              aria-hidden="true"
              className="pointer-events-none absolute -bottom-1 left-1/2 z-[2] grid h-2.5 w-2.5 -translate-x-1/2 place-items-center"
            >
              <span className="absolute inset-0 animate-ping rounded-full bg-[#2F68E5]/50" />
              <span className="relative h-2 w-2 rounded-full bg-[#2F68E5]" />
            </span>
          )}
          <img
            src={icon}
            alt=""
            className={`h-5 w-5 object-contain ${active ? "opacity-100" : "opacity-70"}`}
          />
        </button>
      </TooltipTrigger>
      <TooltipContent
        side="right"
        className="border-0 bg-foreground text-background text-[12px] leading-[16px] px-[8px] py-[4px]"
      >
        {label}
      </TooltipContent>
    </Tooltip>
  );
}

export default function L1Nav({
  active = "engage",
  activeEngageItem = "campaigns",
  activeAudienceItem,
  activeAnalyticsItem,
  nudgeHighlightKey,
}: {
  active?: string;
  /** Which Engage L2 item renders active when that menu is open. */
  activeEngageItem?: string;
  /** Which Audience L2 item renders active when that menu is open. Undefined
   *  (e.g. opening the drawer from a non-Audience page) highlights nothing. */
  activeAudienceItem?: string;
  /** Which Analytics L2 item renders active when that menu is open. Undefined
   *  highlights nothing — none of these have pages yet. */
  activeAnalyticsItem?: string;
  /** Rail entry (e.g. "decisioning", "ai-dashboard") to highlight with the
   *  pulsing discovery dot — whichever step of the sequence is currently up. */
  nudgeHighlightKey?: string;
}) {
  const navigate = useNavigate();
  // Only one L2 drawer is ever open — opening one closes the other.
  const [openMenu, setOpenMenu] = useState<"engage" | "audience" | "analytics" | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Dismiss the open L2 menu on any click outside the rail/menu.
  useEffect(() => {
    if (!openMenu) return;
    const onDocDown = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpenMenu(null);
    };
    document.addEventListener("mousedown", onDocDown);
    return () => document.removeEventListener("mousedown", onDocDown);
  }, [openMenu]);

  const toggleMenu = (key: "engage" | "audience" | "analytics") =>
    setOpenMenu((cur) => (cur === key ? null : key));

  return (
    <div ref={containerRef} className="contents">
      <nav className="flex h-full w-12 shrink-0 flex-col items-center rounded-r-lg bg-[#291E30]">
        {/* Brand mark */}
        <div className="mt-6 flex h-6 w-full items-center justify-center">
          <img src={logo} alt="Netcore" className="h-6 w-6" />
        </div>

        {/* Primary destinations */}
        <div className="mt-[26px] flex flex-col gap-2">
          {primary.map((item) => (
            <NavButton
              key={item.key}
              icon={item.icon}
              label={item.label}
              active={item.key === active}
              onClick={
                item.key === "engage" || item.key === "audience" || item.key === "analytics"
                  ? () => toggleMenu(item.key as "engage" | "audience" | "analytics")
                  : item.route
                  ? () => navigate(item.route)
                  : undefined
              }
              showDot={item.key === nudgeHighlightKey}
            />
          ))}
        </div>

        {/* Bottom: settings + profile */}
        <div className="mb-8 mt-auto flex flex-col gap-2">
          <NavButton icon={iconSettings} label="Settings" />
          <NavButton icon={iconProfile} label="Profile" />
        </div>
      </nav>

      {openMenu === "engage" && (
        <EngageL2 active={activeEngageItem} onClose={() => setOpenMenu(null)} />
      )}

      {openMenu === "audience" && (
        <AudienceL2 active={activeAudienceItem} onClose={() => setOpenMenu(null)} />
      )}

      {openMenu === "analytics" && (
        <AnalyticsL2 active={activeAnalyticsItem} onClose={() => setOpenMenu(null)} />
      )}
    </div>
  );
}
