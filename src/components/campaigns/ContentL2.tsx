import { useNavigate } from "react-router-dom";
import {
  AppWindow,
  Mail,
  MessageCircleMore,
  MessageSquareText,
  Monitor,
  Package,
  Palette,
  Phone,
  Smartphone,
  Tag,
  TabletSmartphone,
  type LucideIcon,
} from "lucide-react";

/**
 * Content L2 — the flyout menu that opens beside the Content entry in the L1
 * rail. Same Primary/Ash drawer treatment as <EngageL2/>, <AudienceL2/> and
 * <AnalyticsL2/> so all four read as the same surface sliding out of the rail.
 *
 * Only Products has a page so far; the rest grow a `route` as they are built.
 */

interface ContentItem {
  key: string;
  label: string;
  icon: LucideIcon;
  route?: string;
}

const items: ContentItem[] = [
  { key: "email", label: "Email", icon: Mail },
  { key: "sms", label: "SMS", icon: MessageCircleMore },
  { key: "app-push", label: "App push", icon: Smartphone },
  { key: "web-push", label: "Web push", icon: Monitor },
  { key: "web-message", label: "Web message", icon: AppWindow },
  { key: "in-app", label: "In-app", icon: TabletSmartphone },
  { key: "whatsapp", label: "WhatsApp", icon: Phone },
  { key: "rcs", label: "RCS", icon: MessageSquareText },
  { key: "coupon", label: "Coupon", icon: Tag },
  { key: "brand-assets", label: "Brand assets", icon: Palette },
  { key: "products", label: "Products", icon: Package, route: "/content/products" },
];

export default function ContentL2({
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
      // Anchored to the Content rail button's own top edge (74px start, 40px
      // per entry, Content is index 7), nudged up only if the window is too
      // short to fit the whole drawer below that.
      className="fixed left-12 z-50 w-[176px] animate-in fade-in slide-in-from-left-2 duration-200 rounded-[8px] bg-[#291E30] p-4"
      style={{ top: "max(8px, min(354px, calc(100vh - 380px)))" }}
      role="menu"
      aria-label="Content"
    >
      <p className="font-manrope text-xs font-semibold leading-[18px] text-white">Content</p>

      <div className="mt-[16px] flex flex-col gap-3">
        {items.map((item) => {
          const isActive = item.key === active;
          const Icon = item.icon;
          return (
            <button
              key={item.key}
              role="menuitem"
              onClick={() => {
                onClose();
                if (item.route) navigate(item.route);
              }}
              // The row owns the colour so the glyph (currentColor) and the
              // label stay in step.
              className={`flex items-start gap-2 text-left ${
                isActive ? "text-[#FC5E02]" : "text-[#AC9AB8]"
              }`}
            >
              <Icon className="mt-[2px] size-[14px] shrink-0" strokeWidth={1.6} />
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
