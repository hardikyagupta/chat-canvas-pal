import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { EmailTemplate, TemplatePreview } from "./emailTemplates.data";

/**
 * Template picker card — thumbnail, name, id. Thumbnails are drawn rather than
 * loaded: the point of the card is the shape of the email, and a real account's
 * saved templates mostly have no generated thumbnail at all, which the empty
 * frame below stands in for.
 */

/** The empty frame shown when a template has no generated thumbnail. */
function EmptyFrame({ className }: { className?: string }) {
  return (
    <div className={cn("relative grid flex-1 place-items-center bg-[#EDEDED]", className)}>
      {[
        "left-2 top-2 border-l border-t",
        "right-2 top-2 border-r border-t",
        "bottom-2 left-2 border-b border-l",
        "bottom-2 right-2 border-b border-r",
      ].map((pos) => (
        <span key={pos} className={cn("absolute size-3.5 border-[#B9B9B9]", pos)} />
      ))}
      <p className="text-center font-manrope text-[8px] font-medium uppercase leading-[13px] tracking-[0.2px] text-[#6F6F8D]">
        Thumbnail
        <br />
        not available
      </p>
    </div>
  );
}

/** Netcore-style wordmark, small enough to read as a logo lockup at this size. */
function Wordmark() {
  return (
    <div className="flex items-center justify-center gap-1 py-2">
      <span className="font-manrope text-[13px] font-black leading-none text-[#FC5E02]">N</span>
      <span className="font-manrope text-[11px] font-bold leading-none text-[#17173A]">
        Netcore
      </span>
    </div>
  );
}

function Line({ w, tone = "#D8D8D8", h = 3 }: { w: string; tone?: string; h?: number }) {
  return <span className="block rounded-full" style={{ width: w, height: h, background: tone }} />;
}

export function TemplateThumbnail({ kind }: { kind: TemplatePreview }) {
  if (kind === "watch") {
    return (
      <div className="flex h-full flex-col bg-[#E8302A] px-2.5 pt-3">
        <p className="text-center font-manrope text-[6px] font-bold uppercase leading-[9px] tracking-[0.2px] text-white">
          Upgrade your watch, upgrade your world.
        </p>
        <p className="mt-1.5 text-center font-manrope text-[10px] font-black uppercase leading-none text-white">
          <span className="text-[6px] font-bold">Introducing </span>Volt 3.0
        </p>
        <p className="mt-1 text-center font-manrope text-[5px] leading-[8px] text-white/85">
          A whole new series of smartwatches with a blend of innovation, style and functionality.
        </p>
        <div className="mt-2 flex flex-1 items-end justify-center gap-1.5 pb-0">
          <span className="mb-1 size-6 rounded-full border-2 border-[#1A1A1A] bg-[#2B2B2B]" />
          <span className="size-8 rounded-full border-2 border-[#1A1A1A] bg-[#111]" />
          <span className="mb-1 h-8 w-5 rounded-[4px] border-2 border-[#1A1A1A] bg-[#2B2B2B]" />
        </div>
        <div className="-mx-2.5 h-3 bg-[#5B4BE8]" />
      </div>
    );
  }

  if (kind === "fashion") {
    return (
      <div className="flex h-full flex-col bg-white">
        <p className="py-1.5 text-center font-manrope text-[9px] font-bold tracking-[1px] text-[#17173A]">
          LOGO
        </p>
        <div className="relative flex-1 bg-gradient-to-b from-[#9A9A9A] to-[#4A4A4A]">
          <p className="absolute left-2 top-2 font-manrope text-[7px] font-bold uppercase text-white/90">
            Up to
          </p>
          <p className="absolute left-2 top-6 font-manrope text-[15px] font-black leading-none text-white">
            40%
          </p>
          <p className="absolute left-2 top-11 font-manrope text-[9px] font-black leading-none text-white">
            OFF
          </p>
        </div>
        <div className="px-2 py-1.5 text-center">
          <p className="font-manrope text-[7px] font-bold text-[#17173A]">
            Your style upgrade starts here!
          </p>
          <p className="mt-0.5 font-manrope text-[5px] text-[#6F6F8D]">
            Limited-time deals you don't want to miss.
          </p>
        </div>
        <div className="mx-2 mb-2 rounded-[2px] bg-black py-1 text-center">
          <p className="font-manrope text-[6px] font-bold text-white">Special OFFER</p>
          <p className="font-manrope text-[5px] text-white/70">Use the coupon code</p>
        </div>
      </div>
    );
  }

  if (kind === "text") {
    return (
      <div className="flex h-full flex-col gap-1.5 bg-white p-2.5">
        <p className="font-manrope text-[9px] font-bold text-[#E8302A]">Heading</p>
        {["100%", "96%", "100%", "88%", "94%", "70%"].map((w, i) => (
          <Line key={i} w={w} tone="#F0A9A6" h={2.5} />
        ))}
      </div>
    );
  }

  if (kind === "receipt") {
    return (
      <div className="flex h-full flex-col bg-white p-1.5">
        <Wordmark />
        <p className="text-center font-manrope text-[6px] font-bold text-[#17173A]">
          Receipt Summary
        </p>
        <p className="text-center font-manrope text-[4px] text-[#6F6F8D]">
          Netcore Cloud Private Limited
        </p>
        <div className="mt-1.5 flex-1 border border-[#D8D8D8]">
          {Array.from({ length: 7 }).map((_, i) => (
            <div
              key={i}
              className={cn(
                "flex h-[9px] items-center gap-1 border-b border-[#E4E4E4] px-1",
                i === 3 && "bg-[#F7C8C4]"
              )}
            >
              <Line w="45%" tone="#CFCFCF" h={2} />
              <Line w="30%" tone="#E0E0E0" h={2} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (kind === "brand") {
    return (
      <div className="flex h-full flex-col bg-white p-1.5">
        <Wordmark />
        <EmptyFrame />
      </div>
    );
  }

  if (kind === "heading") {
    return (
      <div className="flex h-full flex-col bg-white p-1.5">
        <p className="py-1.5 text-center font-manrope text-[8px] font-bold text-[#E8302A]">
          Test Campaign Create
        </p>
        <EmptyFrame />
      </div>
    );
  }

  if (kind === "band") {
    return (
      <div className="flex h-full flex-col bg-white p-1.5">
        <div className="h-8 bg-[#EDEDED]" />
        <div className="flex-1" />
      </div>
    );
  }

  return <EmptyFrame className="h-full" />;
}

export default function TemplateCard({
  template,
  selected,
  onSelect,
}: {
  template: EmailTemplate;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-lg border bg-white text-left transition-all",
        selected
          ? "border-[#2F68E5] shadow-[0_0_0_3px_rgba(47,104,229,0.15)]"
          : "border-[#DDE2EE] hover:border-[#B9C6E4] hover:shadow-[0_4px_14px_rgba(23,23,58,0.08)]"
      )}
    >
      <div className="aspect-square w-full overflow-hidden border-b border-[#EEF1F7] bg-white">
        <TemplateThumbnail kind={template.preview} />
      </div>

      {selected && (
        <span className="absolute right-2 top-2 grid size-5 place-items-center rounded-full bg-[#2F68E5] text-white shadow-sm">
          <Check className="size-3" strokeWidth={3} />
        </span>
      )}

      <div className="px-3 py-2.5">
        <p className="truncate font-manrope text-[13px] font-semibold text-[#17173A]">
          {template.name}
        </p>
        <p className="mt-0.5 font-manrope text-[11px] text-[#6F6F8D]">Id: {template.id}</p>
      </div>
    </button>
  );
}
