import sparkle from "/campaign-assets/ic-sparkle.gif";
import { cn } from "@/lib/utils";

/**
 * The co-marketer CTA — animated sparkle + label inside a pill. Shared so every
 * surface uses the same button: the top bar's "Ask co-marketer" and page
 * headers' "Get insights".
 *
 * `ghost` drops the white fill so the button reads as an outline only.
 * `animation` picks the border treatment: 'snake' is the rotating orange ring
 * (the top-bar CTA); 'sheen' is a static hairline with a diagonal light sweep,
 * used where the button sits inside a card and shouldn't read as that CTA.
 */
export default function CoMarketerButton({
  label,
  onClick,
  ghost = false,
  animation = "snake",
  className,
}: {
  label: string;
  onClick?: () => void;
  /** Outline only — no white fill. */
  ghost?: boolean;
  animation?: "snake" | "sheen";
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative z-[1] flex h-8 items-center gap-1.5 overflow-hidden rounded-lg px-2.5 transition-shadow",
        ghost ? "bg-transparent" : "bg-white hover:shadow-sm",
        animation === "sheen" && "ai-sheen-cta",
        className
      )}
    >
      <span aria-hidden="true" className={animation === "sheen" ? "ai-sheen" : "snake-border"} />
      <img src={sparkle} alt="" className="relative z-[1] h-5 w-5" />
      <span className="relative z-[1] font-manrope text-xs font-semibold tracking-[0.42px] text-ash">
        {label}
      </span>
    </button>
  );
}
