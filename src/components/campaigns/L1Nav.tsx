import logo from "/campaign-assets/netcore-logo.svg";
import iconPinned from "/campaign-assets/nav-pinned.svg";
import iconDashboard from "/campaign-assets/nav-dashboard.svg";
import iconEngage from "/campaign-assets/nav-engage.svg";
import iconAudience from "/campaign-assets/nav-audience.svg";
import iconContent from "/campaign-assets/nav-content.svg";
import iconAnalytics from "/campaign-assets/nav-analytics.svg";
import iconSettings from "/campaign-assets/nav-settings.svg";
import iconProfile from "/campaign-assets/nav-profile.svg";

/**
 * L1 left navigation rail — 48px wide, Primary/Ash (#291E30), rounded on the
 * right edge. Netcore mark at top, primary destinations in the middle, and
 * settings + profile pinned to the bottom. "Engage" is the active item.
 */
const primary = [
  { key: "pinned", icon: iconPinned, label: "Pinned" },
  { key: "dashboard", icon: iconDashboard, label: "Dashboards" },
  { key: "engage", icon: iconEngage, label: "Engage", active: true },
  { key: "audience", icon: iconAudience, label: "Audience" },
  { key: "content", icon: iconContent, label: "Content" },
  { key: "analytics", icon: iconAnalytics, label: "Analytics" },
];

function NavButton({
  icon,
  label,
  active,
}: {
  icon: string;
  label: string;
  active?: boolean;
}) {
  return (
    <button
      title={label}
      aria-label={label}
      className={`grid h-8 w-8 place-items-center rounded transition-colors ${
        active ? "bg-white/10" : "hover:bg-white/10"
      }`}
    >
      <img
        src={icon}
        alt=""
        className={`h-4 w-4 ${active ? "opacity-100" : "opacity-70"}`}
      />
    </button>
  );
}

export default function L1Nav() {
  return (
    <nav className="flex h-full w-12 shrink-0 flex-col items-center rounded-r-lg bg-[#291E30]">
      {/* Brand mark */}
      <div className="mt-6 flex h-5 w-full items-center justify-center">
        <img src={logo} alt="Netcore" className="h-5 w-5" />
      </div>

      {/* Primary destinations */}
      <div className="mt-[26px] flex flex-col gap-2">
        {primary.map((item) => (
          <NavButton
            key={item.key}
            icon={item.icon}
            label={item.label}
            active={item.active}
          />
        ))}
      </div>

      {/* Bottom: settings + profile */}
      <div className="mb-8 mt-auto flex flex-col gap-2">
        <NavButton icon={iconSettings} label="Settings" />
        <NavButton icon={iconProfile} label="Profile" />
      </div>
    </nav>
  );
}
