import { Check, MoreVertical, Pencil, Send, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  ActionMenu,
  ActionMenuContent,
  ActionMenuTrigger,
} from "@/components/ui/action-menu";
import { CardMenuItem } from "./TemplateCard";
import type { EmailTemplate } from "./emailTemplates.data";

/**
 * App Push's own template card — a phone mockup instead of a flat thumbnail,
 * since the point of the card here is how the notification actually sits on
 * a lock screen, not a cropped screenshot the way email templates work.
 */

/** Phone chrome — bezel, camera/speaker cluster, status strip — wrapping
 *  whichever notification preview is passed in. */
function PhoneMock({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex justify-center bg-[#EEF1F7] px-3 pb-3 pt-5">
      <div className="w-[168px] rounded-[20px] border-[5px] border-[#17173A] bg-[#17173A] shadow-[0_6px_16px_rgba(23,23,58,0.18)]">
        <div className="flex items-center justify-center gap-1.5 py-1">
          <span className="size-[3px] rounded-full bg-[#4A4A63]" />
          <span className="size-[3px] rounded-full bg-[#4A4A63]" />
          <span className="h-[3px] w-7 rounded-full bg-[#4A4A63]" />
          <span className="size-[3px] rounded-full bg-[#4A4A63]" />
        </div>
        <div className="overflow-hidden rounded-b-[15px] bg-[#DCE4F0]">
          <div className="h-[6px] bg-[#0C7B75]" />
          <div className="p-2">{children}</div>
        </div>
      </div>
    </div>
  );
}

function RegularNotification() {
  return (
    <div className="rounded-[6px] bg-white p-2 shadow-[0_1px_3px_rgba(23,23,58,0.15)]">
      <div className="flex items-center gap-1.5">
        <span className="size-4 shrink-0 rounded-full bg-[#8B3A3A]" />
        <p className="font-manrope text-[8px] font-bold text-[#17173A]">TrendyGems</p>
      </div>
      <p className="mt-1 font-manrope text-[9px] font-bold leading-[11px] text-[#17173A]">
        Herbal creams @20% OFF
      </p>
      <p className="mt-0.5 font-manrope text-[7px] leading-[9px] text-[#6F6F8D]">
        Reply and know more about the offer…
      </p>
      <div className="mt-1.5 flex h-[46px] items-center justify-center gap-1.5 rounded-[4px] bg-[#F3EFE7] px-2">
        <span className="h-[75%] w-[38%] rounded-[2px] bg-[#5C4A3A]" />
        <span className="h-[58%] w-[26%] rounded-[2px] bg-[#8B6F4E]" />
      </div>
      <p className="mt-1.5 font-manrope text-[7px] font-bold uppercase tracking-[0.3px] text-[#17173A]">
        Reply now
      </p>
    </div>
  );
}

function CarouselNotification() {
  const swatches = ["#DCE9D6", "#F0E4D3", "#8B6F4E", "#E7DCCB", "#D9C7A8"];
  return (
    <div className="rounded-[6px] bg-white p-2 shadow-[0_1px_3px_rgba(23,23,58,0.15)]">
      <div className="flex items-center gap-1.5">
        <span className="size-4 shrink-0 rounded-full bg-gradient-to-br from-[#F5C542] to-[#FC5E02]" />
        <p className="font-manrope text-[8px] font-bold text-[#17173A]">VogueLux</p>
      </div>
      <p className="mt-1 font-manrope text-[8.5px] font-bold leading-[10px] text-[#17173A]">
        Don't worry we got you covered
      </p>
      <p className="mt-0.5 font-manrope text-[7px] leading-[9px] text-[#6F6F8D]">
        Explore our latest collection
      </p>
      <div className="mt-1.5 flex gap-1">
        {swatches.map((tone, i) => (
          <span key={i} className="h-[30px] flex-1 rounded-[3px]" style={{ background: tone }} />
        ))}
      </div>
    </div>
  );
}

function TimerNotification() {
  return (
    <div className="overflow-hidden rounded-[6px] bg-white shadow-[0_1px_3px_rgba(23,23,58,0.15)]">
      <div className="flex items-center justify-between gap-1.5 px-2 py-1.5">
        <div className="flex min-w-0 items-center gap-1.5">
          <span className="size-4 shrink-0 rounded-[3px] bg-[#8B1E1E]" />
          <div className="min-w-0">
            <p className="font-manrope text-[6.5px] font-bold leading-[8px] text-[#17173A]">
              5 days to sale!
            </p>
            <p className="font-manrope text-[5.5px] leading-[7px] text-[#6F6F8D]">
              Buy before it ends
            </p>
          </div>
        </div>
        <span className="shrink-0 rounded-[3px] bg-[#F5C542] px-1 py-[2px] font-manrope text-[6.5px] font-bold text-[#17173A]">
          03:00:00
        </span>
      </div>
      <div className="relative flex h-[64px] flex-col justify-center bg-gradient-to-br from-[#FC5E02] to-[#F5C542] px-2">
        <p className="font-manrope text-[8px] font-black italic leading-[9px] text-white">
          Summer
          <br />
          fashion sale
        </p>
        <span className="absolute bottom-1.5 right-1.5 rounded-[2px] bg-white/90 px-1 py-[1px] font-manrope text-[6px] font-bold text-[#8B1E1E]">
          70% off
        </span>
      </div>
    </div>
  );
}

export default function AppPushTemplateCard({
  template,
  selected,
  onSelect,
}: {
  template: EmailTemplate;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <div
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-lg border bg-white text-left transition-all",
        selected
          ? "border-[#2F68E5] shadow-[0_0_0_3px_rgba(47,104,229,0.15)]"
          : "border-[#DDE2EE] hover:border-[#B9C6E4] hover:shadow-[0_4px_14px_rgba(23,23,58,0.08)]"
      )}
    >
      {template.image ? (
        // A real rendered mock — phone chrome already baked into the image,
        // so it stands in for PhoneMock entirely rather than sitting inside
        // it. Fixed box height keeps every card the same length regardless
        // of each source image's own aspect ratio; object-contain (not
        // cover) so a wider phone shot never gets cropped, just top-aligned
        // with the others.
        <div className="flex h-[172px] justify-center overflow-hidden bg-[#EEF1F7] px-3 pt-5">
          <img
            src={template.image}
            alt=""
            className="h-full w-[168px] object-contain object-top"
          />
        </div>
      ) : (
        <PhoneMock>
          {template.preview === "push-carousel" ? (
            <CarouselNotification />
          ) : template.preview === "push-timer" ? (
            <TimerNotification />
          ) : (
            <RegularNotification />
          )}
        </PhoneMock>
      )}

      {template.aiGenerated && (
        <span
          aria-label="AI-generated"
          className="pointer-events-none absolute left-2 top-2 grid size-6 place-items-center rounded-full bg-white/95 shadow-[0_1px_4px_rgba(23,23,58,0.16)]"
        >
          <Sparkles className="size-3.5 text-[#7B5CFA]" strokeWidth={2.2} />
        </span>
      )}

      {selected && (
        <span className="pointer-events-none absolute right-3 top-3 grid size-5 place-items-center rounded-full bg-[#2F68E5] text-white shadow-sm">
          <Check className="size-3" strokeWidth={3} />
        </span>
      )}

      <div className="flex items-start justify-between gap-2 px-4 py-3">
        <div className="min-w-0">
          <p className="truncate font-manrope text-[15px] font-bold text-[#17173A]">
            {template.name}
          </p>
          <p className="mt-1 font-manrope text-[13px] text-[#6F6F8D]">ID: {template.id}</p>
        </div>
        <ActionMenu>
          <ActionMenuTrigger asChild>
            <button
              type="button"
              aria-label={`Actions for ${template.name}`}
              className="grid size-7 shrink-0 place-items-center rounded-md text-[#8A8AA3] transition-colors hover:bg-[#F0F3F9] hover:text-[#17173A]"
            >
              <MoreVertical className="size-4" strokeWidth={2} />
            </button>
          </ActionMenuTrigger>
          <ActionMenuContent
            align="end"
            side="bottom"
            sideOffset={4}
            className="z-[120] w-[148px] gap-0 overflow-hidden rounded-lg border-[#DDE2EE] p-0 shadow-[0_8px_24px_rgba(23,23,58,0.12)]"
          >
            <CardMenuItem icon={Pencil} onSelect={() => {}}>
              Edit
            </CardMenuItem>
            <CardMenuItem icon={Send} onSelect={onSelect}>
              Use
            </CardMenuItem>
          </ActionMenuContent>
        </ActionMenu>
      </div>
    </div>
  );
}
