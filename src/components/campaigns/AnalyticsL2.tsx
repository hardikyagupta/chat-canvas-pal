import { useNavigate } from "react-router-dom";
import iconFunnel from "/campaign-assets/ana-funnel.svg";
import iconCohorts from "/campaign-assets/ana-cohorts.svg";
import iconRfm from "/campaign-assets/ana-rfm.svg";
import iconUserPath from "/campaign-assets/ana-user-path.svg";
import iconScheduledReports from "/campaign-assets/ana-scheduled-reports.svg";

/**
 * Analytics L2 — the flyout menu that opens beside the Analytics entry in the
 * L1 rail (Figma node 5641:44397). Same Primary/Ash drawer treatment as
 * <EngageL2/> and <AudienceL2/> so all three read as the same surface sliding
 * out of the rail.
 *
 * Every glyph is its exported Figma asset drawn as a leaf inside a 14px box,
 * using the design's outer/inner insets so nothing gets stretched to fill.
 */

interface AnalyticsItem {
  key: string;
  label: string;
  icon: string;
  /** Leaf inset inside the 14px box, from Figma. */
  inset: string;
  /** Inner bleed that preserves the asset's stroke overflow. */
  innerInset?: string;
  route?: string;
}

const items: AnalyticsItem[] = [
  {
    key: "funnel",
    label: "Funnel",
    icon: iconFunnel,
    inset: "7.64% 5.7% 7.05% 5.61%",
    innerInset: "-4.19% -4.03% -4.19% -4.06%",
    route: "/analytics/funnel",
  },
  {
    key: "cohorts",
    label: "Cohorts",
    icon: iconCohorts,
    inset: "9.21% 7.94% 7.59% 10.09%",
    innerInset: "-4.29% -4.36%",
  },
  // RFM is a filled glyph rather than a stroked one, so it has no stroke
  // overflow to bleed for — hence no innerInset.
  { key: "rfm", label: "RFM", icon: iconRfm, inset: "8.34% 8.33%" },
  {
    key: "user-path",
    label: "User Path",
    icon: iconUserPath,
    inset: "3.94% 3.88% 3.94% 3.89%",
    innerInset: "-3.88% -3.87%",
  },
  {
    key: "scheduled-reports",
    label: "Scheduled Reports",
    icon: iconScheduledReports,
    inset: "4.12% 5.14%",
    innerInset: "-3.89% -3.98%",
  },
];

/**
 * The exported assets bake in the inactive stroke (#AC9AB8), so each glyph is
 * drawn as a mask over `currentColor` instead of an <img> — that lets the
 * active row tint its icon the way <EngageL2/>'s inline SVGs do, while still
 * rendering the exact exported artwork at its designed geometry.
 */
function ItemIcon({ src, inset, innerInset }: { src: string; inset: string; innerInset?: string }) {
  const mask: React.CSSProperties = {
    maskImage: `url(${src})`,
    WebkitMaskImage: `url(${src})`,
    maskSize: "100% 100%",
    WebkitMaskSize: "100% 100%",
    maskRepeat: "no-repeat",
    WebkitMaskRepeat: "no-repeat",
    backgroundColor: "currentColor",
  };

  return (
    // mt-[2px] matches the icon's 2px offset inside each 18px row in Figma;
    // with items-start it stays put when a label wraps to two lines.
    <span className="relative mt-[2px] block size-[14px] shrink-0 overflow-hidden">
      <span className="absolute" style={{ inset }}>
        {innerInset ? (
          <span className="absolute block" style={{ inset: innerInset }}>
            <span className="block size-full" style={mask} />
          </span>
        ) : (
          <span className="absolute inset-0 block size-full" style={mask} />
        )}
      </span>
    </span>
  );
}

export default function AnalyticsL2({
  active,
  onClose,
}: {
  /** Which item renders in the active (Primary/Core orange) tint. */
  active?: string;
  onClose: () => void;
}) {
  const navigate = useNavigate();

  return (
    <div
      // Anchored to the Analytics rail button's own top edge: the rail starts
      // its buttons at 74px and steps 40px each, and Analytics is index 7 —
      // 74 + 7*40 = 354. <EngageL2/> and <AudienceL2/> instead sit 87px above
      // their buttons, which for the last rail entry would put this header
      // level with the Audience icon.
      className="fixed left-12 top-[354px] z-50 w-[176px] animate-in fade-in slide-in-from-left-2 duration-200 rounded-[8px] bg-[#291E30] p-4"
      role="menu"
      aria-label="Analytics"
    >
      {/* leading-[18px] is the design's text style; Tailwind's default 16px
          for text-xs would lift every row below it by 2px. */}
      <p className="font-manrope text-xs font-semibold leading-[18px] text-white">Analytics</p>

      <div className="mt-[16px] flex flex-col gap-3">
        {items.map((item) => {
          const isActive = item.key === active;
          return (
            <button
              key={item.key}
              role="menuitem"
              onClick={() => {
                onClose();
                if (item.route) navigate(item.route);
              }}
              // The row owns the colour so both children inherit it: the glyph
              // is painted with `currentColor`, so colouring only the label
              // would leave the icon on the app's default dark foreground.
              className={`flex items-start gap-2 text-left ${
                isActive ? "text-[#FC5E02]" : "text-[#AC9AB8]"
              }`}
            >
              <ItemIcon src={item.icon} inset={item.inset} innerInset={item.innerInset} />
              <span className="font-manrope text-[14px] font-semibold leading-[18px]">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
