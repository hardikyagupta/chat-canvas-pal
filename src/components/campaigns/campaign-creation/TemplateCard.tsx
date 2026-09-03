import { Check, MoreVertical, Pencil, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  ActionMenu,
  ActionMenuContent,
  ActionMenuTrigger,
} from "@/components/ui/action-menu";
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
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

/** Brand wordmark, small enough to read as a logo lockup at this size. */
function Wordmark() {
  return (
    <div className="flex items-center justify-center gap-1 py-2">
      <span className="font-manrope text-[13px] font-black leading-none text-[#3F6B4F]">B</span>
      <span className="font-manrope text-[11px] font-bold leading-none text-[#17173A]">
        Bloomwood
      </span>
    </div>
  );
}

function Line({ w, tone = "#D8D8D8", h = 3 }: { w: string; tone?: string; h?: number }) {
  return <span className="block rounded-full" style={{ width: w, height: h, background: tone }} />;
}

export function TemplateThumbnail({ kind }: { kind: TemplatePreview }) {
  if (kind === "launch") {
    return (
      <div className="flex h-full flex-col bg-[#B5714A] px-2.5 pt-3">
        <p className="text-center font-manrope text-[6px] font-bold uppercase leading-[9px] tracking-[0.2px] text-white">
          New in the botanicals line
        </p>
        <p className="mt-1.5 text-center font-manrope text-[10px] font-black uppercase leading-none text-white">
          <span className="text-[6px] font-bold">Introducing the </span>Wildflower Trio
        </p>
        <p className="mt-1 text-center font-manrope text-[5px] leading-[8px] text-white/85">
          Three hand-poured candles, blended with real botanicals and soy wax.
        </p>
        <div className="mt-2 flex flex-1 items-end justify-center gap-1.5 pb-0">
          <span className="mb-1 size-6 rounded-full border-2 border-[#5C3A22] bg-[#EFE3D3]" />
          <span className="size-8 rounded-full border-2 border-[#5C3A22] bg-[#F6EEDF]" />
          <span className="mb-1 size-6 rounded-full border-2 border-[#5C3A22] bg-[#EFE3D3]" />
        </div>
        <div className="-mx-2.5 h-3 bg-[#3F6B4F]" />
      </div>
    );
  }

  if (kind === "giftset") {
    return (
      <div className="flex h-full flex-col bg-white">
        <p className="py-1.5 text-center font-manrope text-[9px] font-bold tracking-[1px] text-[#17173A]">
          LOGO
        </p>
        <div className="relative flex-1 bg-gradient-to-b from-[#D9C7A8] to-[#8C6A44]">
          <p className="absolute left-2 top-2 font-manrope text-[7px] font-bold uppercase text-white/90">
            Up to
          </p>
          <p className="absolute left-2 top-6 font-manrope text-[15px] font-black leading-none text-white">
            30%
          </p>
          <p className="absolute left-2 top-11 font-manrope text-[9px] font-black leading-none text-white">
            OFF
          </p>
        </div>
        <div className="px-2 py-1.5 text-center">
          <p className="font-manrope text-[7px] font-bold text-[#17173A]">
            Your self-care ritual starts here
          </p>
          <p className="mt-0.5 font-manrope text-[5px] text-[#6F6F8D]">
            Limited-time gift sets you don't want to miss.
          </p>
        </div>
        <div className="mx-2 mb-2 rounded-[2px] bg-black py-1 text-center">
          <p className="font-manrope text-[6px] font-bold text-white">SELFCARE20</p>
          <p className="font-manrope text-[5px] text-white/70">Use the coupon code</p>
        </div>
      </div>
    );
  }

  if (kind === "text") {
    return (
      <div className="flex h-full flex-col gap-1.5 bg-white p-2.5">
        <p className="font-manrope text-[9px] font-bold text-[#3F6B4F]">New In</p>
        {["100%", "96%", "100%", "88%", "94%", "70%"].map((w, i) => (
          <Line key={i} w={w} tone="#C7D9C0" h={2.5} />
        ))}
      </div>
    );
  }

  if (kind === "receipt") {
    return (
      <div className="flex h-full flex-col bg-white p-1.5">
        <Wordmark />
        <p className="text-center font-manrope text-[6px] font-bold text-[#17173A]">
          Order Confirmed
        </p>
        <p className="text-center font-manrope text-[4px] text-[#6F6F8D]">
          Bloomwood Botanicals Pvt. Ltd.
        </p>
        <div className="mt-1.5 flex-1 border border-[#D8D8D8]">
          {Array.from({ length: 7 }).map((_, i) => (
            <div
              key={i}
              className={cn(
                "flex h-[9px] items-center gap-1 border-b border-[#E4E4E4] px-1",
                i === 3 && "bg-[#DCE9D6]"
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
        <p className="py-1.5 text-center font-manrope text-[8px] font-bold text-[#3F6B4F]">
          New Season, New Rituals
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

  if (kind === "skincare") {
    const items: [string, string][] = [
      ["#E7DCCB", "Shea Butter"],
      ["#DCE9D6", "Rosewater"],
      ["#F0E4D3", "Oat Milk"],
    ];
    return (
      <div className="flex h-full flex-col bg-white p-1.5">
        <p className="py-1 text-center font-manrope text-[8px] font-bold text-[#17173A]">
          Shop the ritual
        </p>
        <div className="flex flex-1 items-stretch gap-1">
          {items.map(([tone, label]) => (
            <div key={label} className="flex flex-1 flex-col gap-1">
              <div className="flex-1 rounded-[2px]" style={{ background: tone }} />
              <p className="text-center font-manrope text-[4.5px] font-semibold leading-[6px] text-[#6F6F8D]">
                {label}
              </p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return <EmptyFrame className="h-full" />;
}

/** One row in a card kebab — icon on the right, a blue rail on hover. Grey by
 *  default; hovering darkens the label only, never the icon. The menu that
 *  hosts this needs its own `overflow-hidden` so the row's edge-to-edge
 *  highlight follows the panel's rounded corners instead of squaring off
 *  past them. */
export function CardMenuItem({
  icon: Icon,
  children,
  onSelect,
}: {
  icon: typeof Pencil;
  children: string;
  onSelect: () => void;
}) {
  return (
    <DropdownMenuPrimitive.Item
      onSelect={onSelect}
      className={cn(
        "relative flex h-9 cursor-pointer items-center justify-between gap-8 pl-4 pr-3 font-manrope text-[13px] font-medium text-[#6F6F8D] outline-none transition-colors",
        "data-[highlighted]:bg-[#F4F8FF] data-[highlighted]:text-[#17173A]",
        "data-[highlighted]:before:absolute data-[highlighted]:before:inset-y-0 data-[highlighted]:before:left-0 data-[highlighted]:before:w-[3px] data-[highlighted]:before:bg-[#2F68E5]"
      )}
    >
      {children}
      <Icon className="size-4 shrink-0 text-[#8A8AA3]" strokeWidth={1.75} />
    </DropdownMenuPrimitive.Item>
  );
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
    <div
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-lg border bg-white text-left transition-all",
        selected
          ? "border-[#2F68E5] shadow-[0_0_0_3px_rgba(47,104,229,0.15)]"
          : "border-[#DDE2EE] hover:border-[#B9C6E4] hover:shadow-[0_4px_14px_rgba(23,23,58,0.08)]"
      )}
    >
      <div className="aspect-square w-full overflow-hidden border-b border-[#EEF1F7] bg-white">
        {template.image ? (
          <img
            src={template.image}
            alt=""
            className="h-full w-full object-cover object-top"
          />
        ) : (
          <TemplateThumbnail kind={template.preview} />
        )}
      </div>

      {template.inUse && (
        <span className="pointer-events-none absolute right-2 top-2 rounded-[4px] border-[1.5px] border-[#4CC08C] bg-white/95 px-1.5 py-[3px] font-manrope text-[9px] font-extrabold uppercase leading-none tracking-[0.06em] text-[#4CC08C]">
          In use
        </span>
      )}

      {/* Moves aside on a template that's already badged, so the two don't stack. */}
      {selected && (
        <span
          className={cn(
            "pointer-events-none absolute top-2 grid size-5 place-items-center rounded-full bg-[#2F68E5] text-white shadow-sm",
            template.inUse ? "left-2" : "right-2"
          )}
        >
          <Check className="size-3" strokeWidth={3} />
        </span>
      )}

      <div className="flex items-center gap-1 px-2 py-2.5 pl-3">
        <div className="min-w-0 flex-1 text-left">
          <p className="truncate font-manrope text-[13px] font-semibold text-[#17173A]">
            {template.name}
          </p>
          <p className="mt-0.5 font-manrope text-[11px] text-[#6F6F8D]">ID: {template.id}</p>
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
