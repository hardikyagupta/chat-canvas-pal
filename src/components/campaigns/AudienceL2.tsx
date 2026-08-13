import { useNavigate } from "react-router-dom";
import iconOverview from "/campaign-assets/aud-overview.svg";
import iconAllContacts from "/campaign-assets/aud-all-contacts.svg";
import iconLists from "/campaign-assets/aud-lists.svg";
import iconSegments from "/campaign-assets/aud-segments.svg";
import iconPredictive from "/campaign-assets/aud-predictive-segment.svg";
import iconBlacklist from "/campaign-assets/aud-blacklist-contacts.svg";
import iconAttributes from "/campaign-assets/aud-attributes.svg";
import iconTable from "/campaign-assets/aud-table.svg";
import iconGoogleAudience from "/campaign-assets/aud-google-audience.svg";

/**
 * Audience L2 — the flyout menu that opens beside the Audience entry in the L1
 * rail (Figma node 5638:44168). Same Primary/Ash drawer treatment as
 * <EngageL2/> so both read as the same surface sliding out of the rail.
 *
 * Every glyph is its exported Figma asset drawn as a leaf inside a 14px box,
 * using the design's outer/inner insets so nothing gets stretched to fill.
 */

interface AudienceItem {
  key: string;
  label: string;
  icon: string;
  /** Leaf inset inside the 14px box, from Figma. */
  inset: string;
  /** Inner bleed that preserves the asset's stroke overflow. */
  innerInset?: string;
  route?: string;
}

const items: AudienceItem[] = [
  { key: "overview", label: "Overview", icon: iconOverview, inset: "5.36%", innerInset: "-4%" },
  {
    key: "all-contacts",
    label: "All contacts",
    icon: iconAllContacts,
    inset: "16.55% 6.93%",
    innerInset: "-5.34% -4.15%",
  },
  { key: "lists", label: "Lists", icon: iconLists, inset: "7.14% 10.71%", innerInset: "-4.17% -4.55%" },
  {
    key: "segments",
    label: "Segments",
    icon: iconSegments,
    inset: "7.14%",
    innerInset: "-4.17%",
    route: "/audience/segments",
  },
  { key: "predictive", label: "Predictive segment", icon: iconPredictive, inset: "20.35% 8.33%" },
  { key: "blacklist", label: "Blacklist contacts", icon: iconBlacklist, inset: "8.33%", innerInset: "-5.14%" },
  { key: "attributes", label: "Attributes", icon: iconAttributes, inset: "3.61% 3.57%", innerInset: "-3.85%" },
  { key: "user-data-table", label: "User data table", icon: iconTable, inset: "5.36%", innerInset: "-4%" },
  { key: "control-group", label: "Control group", icon: iconTable, inset: "5.36%", innerInset: "-4%" },
  { key: "fb-audience", label: "FB custom audience", icon: iconTable, inset: "5.36%", innerInset: "-4%" },
  {
    key: "google-audience",
    label: "Google audience",
    icon: iconGoogleAudience,
    inset: "4.99% 8.26%",
    innerInset: "-3.97% -4.28%",
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
    <span className="relative block size-[14px] shrink-0 overflow-hidden">
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

export default function AudienceL2({
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
      className="fixed left-12 top-[187px] z-50 w-[190px] animate-in fade-in slide-in-from-left-2 duration-200 rounded-[8px] bg-[#291E30] p-4"
      role="menu"
      aria-label="Audience"
    >
      <p className="font-manrope text-xs font-semibold text-white">Audience</p>

      <div className="mt-[16px] flex flex-col gap-4">
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
              className={`flex items-center gap-2 text-left ${
                isActive ? "text-[#FC5E02]" : "text-[#AC9AB8]"
              }`}
            >
              <ItemIcon src={item.icon} inset={item.inset} innerInset={item.innerInset} />
              <span className="font-manrope text-[13px] font-medium leading-[18px]">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}