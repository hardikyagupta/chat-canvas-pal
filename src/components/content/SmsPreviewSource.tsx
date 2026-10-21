import { useEffect, useRef, useState } from "react";
import { ArrowRight, Check, ChevronDown, Search, TriangleAlert } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { RECENT_PREVIEW_USERS } from "./smsPreview.data";
import { smsParts } from "./smsTemplates.data";
import { PAYLOAD_EVENTS } from "./smsVariables.data";

const labelClass = "mb-2 block font-manrope text-[14px] font-semibold text-[#17173A]";

/** "Preview using" — pick the user activity whose payload fills {{ payload.… }} variables. */
function ActivitySelect({ value, onChange }: { value: string; onChange: (key: string) => void }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const selected = PAYLOAD_EVENTS.find((e) => e.key === value);
  const q = query.trim().toLowerCase();

  return (
    <Popover
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (o) setQuery("");
      }}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex h-[46px] w-full items-center justify-between rounded-[4px] border bg-[#F7F7F9] px-4 text-left font-manrope text-[14px] transition-colors",
            open ? "border-[#2F68E5] bg-white" : "border-transparent"
          )}
        >
          <span className={selected ? "text-[#17173A]" : "text-[#A0A0B0]"}>
            {selected?.label ?? "Choose a user activity to load preview"}
          </span>
          <ChevronDown className={cn("size-4 text-[#6F6F8D] transition-transform", open && "rotate-180")} strokeWidth={2.4} />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="z-[120] w-[var(--radix-popover-trigger-width)] overflow-hidden rounded-[4px] border-[#DDE2EE] p-0 font-manrope shadow-[0_8px_24px_rgba(23,23,58,0.12)]"
      >
        <div className="flex items-center border-b border-[#DDE2EE] px-4">
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search"
            className="h-11 min-w-0 flex-1 bg-transparent text-[14px] text-[#17173A] outline-none placeholder:text-[#A0A0B0]"
          />
          <Search className="size-4 text-[#6F6F8D]" strokeWidth={2} />
        </div>
        <div className="scroll-slim max-h-[220px] overflow-y-auto">
          {PAYLOAD_EVENTS.filter((e) => !q || e.label.toLowerCase().includes(q)).map((e) => (
            <button
              key={e.key}
              type="button"
              onClick={() => {
                onChange(e.key);
                setOpen(false);
              }}
              className={cn(
                "block w-full border-l-[3px] px-5 py-3.5 text-left text-[14px] font-semibold transition-colors",
                e.key === value
                  ? "border-[#2F68E5] bg-[#F4F8FF] text-[#17173A]"
                  : "border-transparent text-[#6F6F8D] hover:bg-[#F4F8FF] hover:text-[#17173A]"
              )}
            >
              {e.label}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

/** "Preview for a specific user" — a primary key (email) with recents; only the arrow button loads that user into the preview. */
function UserKeyField({ value, onLoad }: { value: string; onLoad: (key: string) => void }) {
  const [text, setText] = useState(value);
  const [focused, setFocused] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!focused) return;
    const onDown = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setFocused(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [focused]);

  // Picking a recent only fills the field; the preview loads on the arrow button.
  const pick = (key: string) => {
    setText(key);
    setFocused(false);
  };

  const q = text.trim().toLowerCase();
  const recents = RECENT_PREVIEW_USERS.filter((u) => !q || u.includes(q));
  const ready = text.trim().length > 0;

  return (
    <div ref={wrapRef} className="relative flex items-center gap-3">
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        onFocus={() => setFocused(true)}
        placeholder="Enter primary key"
        aria-label="Primary key of the user to preview"
        className={cn(
          "h-[46px] min-w-0 flex-1 rounded-[4px] border bg-[#F7F7F9] px-4 font-manrope text-[14px] text-[#17173A] outline-none transition-colors placeholder:text-[#A0A0B0]",
          focused ? "border-[#2F68E5] bg-white" : "border-transparent"
        )}
      />
      <button
        type="button"
        aria-label="Load preview for this user"
        disabled={!ready}
        onClick={() => {
          setFocused(false);
          onLoad(text.trim());
        }}
        className="grid h-[46px] w-[54px] shrink-0 place-items-center rounded-[4px] bg-[#2F68E5] text-white transition-colors hover:bg-[#2559C9] disabled:cursor-not-allowed disabled:bg-[#A0B4EE] disabled:hover:bg-[#A0B4EE]"
      >
        <ArrowRight className="size-5" strokeWidth={2.2} />
      </button>

      {focused && recents.length > 0 && (
        <div className="absolute left-0 top-full z-20 mt-1 w-[calc(100%-66px)] overflow-hidden rounded-[4px] border border-[#DDE2EE] bg-white py-2 shadow-[0_8px_24px_rgba(23,23,58,0.12)]">
          <p className="px-5 py-2 font-manrope text-[13px] font-semibold text-[#6F6F8D]">Recently used</p>
          {recents.map((u) => (
            <button
              key={u}
              type="button"
              onClick={() => pick(u)}
              className="block w-full px-8 py-2.5 text-left font-manrope text-[14px] font-semibold text-[#6F6F8D] transition-colors hover:bg-[#F4F8FF] hover:text-[#17173A]"
            >
              {u}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Controls above the phone preview: which activity's payload to use and which
 * user to render the message for. Loading a user re-renders the preview with
 * that person's attribute values.
 */
export default function SmsPreviewSource({
  activity,
  onActivityChange,
  userKey,
  onUserLoad,
}: {
  activity: string;
  onActivityChange: (key: string) => void;
  userKey: string;
  onUserLoad: (key: string) => void;
}) {
  return (
    <div className="space-y-5 text-left">
      <div>
        <label className={labelClass}>Preview using</label>
        <ActivitySelect value={activity} onChange={onActivityChange} />
      </div>
      <div>
        <label className={labelClass}>
          Preview for a specific user<span className="text-[#E5484D]"> *</span>
        </label>
        <UserKeyField value={userKey} onLoad={onUserLoad} />
      </div>
    </div>
  );
}

/**
 * Thin strip between the user field and the platform toggle: the rendered length
 * and SMS parts for the loaded user (real characters, not the DLT 30-per-variable
 * allowance the editor counts), or what's still unfilled. Hover explains it. The
 * caller positions it inside an existing gap, so it adds no height of its own.
 */
export function SmsPreviewEstimate({ text, unfilled, className }: { text: string; unfilled: string[]; className?: string }) {
  const characters = text.length;
  const parts = smsParts(characters);
  const ok = unfilled.length === 0 && characters > 0;
  const label = ok
    ? `${characters} characters · ${parts} SMS ${parts === 1 ? "part" : "parts"}`
    : unfilled.length > 0
      ? `${unfilled.join(", ")} ${unfilled.length === 1 ? "has" : "have"} no value for this user`
      : "Message is empty";

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          tabIndex={0}
          className={cn(
            "flex h-8 cursor-default items-center gap-2 rounded-[4px] px-3 font-manrope text-[14px] font-semibold",
            ok ? "bg-[#E4F6EC] text-[#2F8F63]" : "bg-[#FFF1D6] text-[#B86E00]",
            className
          )}
        >
          {ok ? <Check className="size-4 shrink-0" strokeWidth={3} /> : <TriangleAlert className="size-4 shrink-0" strokeWidth={2.6} />}
          <span className="truncate">{label}</span>
        </div>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="max-w-[280px] rounded-lg border-0 bg-black px-3 py-2 text-white">
        <p className="font-manrope text-xs leading-[18px]">
          {ok
            ? `Length of the message this user would actually receive, with variables replaced by their values. One SMS part holds 160 characters; longer messages split into parts of 153. The editor counts each variable as 30 (the DLT allowance), so its number can differ.`
            : unfilled.length > 0
              ? "These variables resolved to nothing for the loaded user — map them to an attribute that user has, or add a default value."
              : "Write a message to see its length for this user."}
        </p>
      </TooltipContent>
    </Tooltip>
  );
}
