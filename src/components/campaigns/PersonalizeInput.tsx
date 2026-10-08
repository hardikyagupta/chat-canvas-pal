import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, UserRound } from "lucide-react";
import { USER_ATTRIBUTES } from "./campaign-creation/ConditionAttributePicker";
import type { ActivityAttribute } from "./journeyActivities.data";

type MenuLevel = "root" | "attribute" | "payload";

/**
 * A plain text input with a personalize menu underneath — appears the
 * moment the field is focused (a bordered row with a single person-icon
 * button, matching the reference), and opens a two-level popover: "User
 * attribute" (this account's standard profile fields, reused from
 * ConditionAttributePicker's own "User attributes" category) and "User
 * activity payload" (this journey's actual trigger activity's own fields,
 * e.g. Cart Abandoned → cart_value — see JourneyBuilder's
 * triggerPayloadAttributes). Picking either inserts a `{{Label}}` merge tag
 * at the cursor rather than replacing the field's contents.
 */
export default function PersonalizeInput({
  value,
  onChange,
  placeholder,
  payloadAttributes = [],
  className = "",
  "aria-label": ariaLabel,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  payloadAttributes?: ActivityAttribute[];
  className?: string;
  "aria-label"?: string;
}) {
  const [focused, setFocused] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuLevel, setMenuLevel] = useState<MenuLevel>("root");
  const [rect, setRect] = useState<{ left: number; top: number; width: number } | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const iconRef = useRef<HTMLButtonElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const active = focused || menuOpen;

  useEffect(() => {
    if (!menuOpen) return;
    const place = () => {
      const r = iconRef.current?.getBoundingClientRect();
      if (r) setRect({ left: r.left, top: r.bottom + 6, width: 220 });
    };
    place();
    const onDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (!wrapRef.current?.contains(target) && !popoverRef.current?.contains(target)) {
        setMenuOpen(false);
        setMenuLevel("root");
      }
    };
    window.addEventListener("scroll", place, true);
    window.addEventListener("resize", place);
    document.addEventListener("mousedown", onDown);
    return () => {
      window.removeEventListener("scroll", place, true);
      window.removeEventListener("resize", place);
      document.removeEventListener("mousedown", onDown);
    };
  }, [menuOpen]);

  const insertToken = (label: string) => {
    const el = inputRef.current;
    const token = `{{${label}}}`;
    if (!el) {
      onChange(value + token);
    } else {
      const start = el.selectionStart ?? value.length;
      const end = el.selectionEnd ?? value.length;
      onChange(value.slice(0, start) + token + value.slice(end));
      const pos = start + token.length;
      requestAnimationFrame(() => {
        el.focus();
        el.setSelectionRange(pos, pos);
      });
    }
    setMenuOpen(false);
    setMenuLevel("root");
  };

  return (
    <div ref={wrapRef}>
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder}
        aria-label={ariaLabel}
        className={className}
      />
      {active && (
        <div className="mt-1.5 flex h-9 w-full items-center rounded-md border border-[#DDE2EE] bg-white">
          <button
            ref={iconRef}
            type="button"
            aria-label="Insert a personalized value"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setMenuOpen((o) => !o)}
            className={`grid h-9 w-9 shrink-0 place-items-center rounded-md text-[#6F6F8D] transition-colors hover:bg-[#F3F6FF] hover:text-[#17173A] ${
              menuOpen ? "bg-[#F3F6FF] text-[#17173A]" : ""
            }`}
          >
            <UserRound className="h-4 w-4" strokeWidth={1.8} />
          </button>
        </div>
      )}

      {menuOpen &&
        rect &&
        createPortal(
          <div
            ref={popoverRef}
            style={{ position: "fixed", left: rect.left, top: rect.top, width: rect.width }}
            className="z-[300] overflow-hidden rounded-lg border border-[#DDE2EE] bg-white shadow-[0_12px_32px_rgba(23,23,58,0.14)]"
          >
            {menuLevel === "root" && (
              <div className="py-1">
                <button
                  type="button"
                  onClick={() => setMenuLevel("attribute")}
                  className="flex w-full items-center justify-between px-3.5 py-2.5 font-manrope text-[13.5px] font-semibold text-[#2F68E5] transition-colors hover:bg-[#F5F9FF]"
                >
                  User attribute
                  <ChevronRight className="h-4 w-4 text-[#8A8AA3]" strokeWidth={2} />
                </button>
                <div className="mx-3.5 border-t border-[#EBEBF5]" />
                <button
                  type="button"
                  onClick={() => setMenuLevel("payload")}
                  className="flex w-full items-center justify-between px-3.5 py-2.5 font-manrope text-[13.5px] font-semibold text-[#2F68E5] transition-colors hover:bg-[#F5F9FF]"
                >
                  User activity payload
                  <ChevronRight className="h-4 w-4 text-[#8A8AA3]" strokeWidth={2} />
                </button>
              </div>
            )}

            {menuLevel !== "root" && (
              <>
                <button
                  type="button"
                  onClick={() => setMenuLevel("root")}
                  className="flex w-full items-center gap-1.5 border-b border-[#EBEBF5] px-3 py-2.5 font-manrope text-[12.5px] font-bold text-[#17173A] transition-colors hover:bg-[#F7F7FB]"
                >
                  <ChevronLeft className="h-3.5 w-3.5" strokeWidth={2.5} />
                  {menuLevel === "attribute" ? "User attribute" : "User activity payload"}
                </button>
                <div className="scroll-slim max-h-[220px] overflow-y-auto py-1">
                  {menuLevel === "attribute" &&
                    USER_ATTRIBUTES.map((a) => (
                      <button
                        key={a.label}
                        type="button"
                        onClick={() => insertToken(a.label)}
                        className="block w-full px-3.5 py-2 text-left font-manrope text-[13px] font-medium text-[#17173A] transition-colors hover:bg-[#F7F9FC]"
                      >
                        {a.label}
                      </button>
                    ))}
                  {menuLevel === "payload" &&
                    (payloadAttributes.length > 0 ? (
                      payloadAttributes.map((a) => (
                        <button
                          key={a.id}
                          type="button"
                          onClick={() => insertToken(a.label)}
                          className="block w-full px-3.5 py-2 text-left font-manrope text-[13px] font-medium text-[#17173A] transition-colors hover:bg-[#F7F9FC]"
                        >
                          {a.label}
                        </button>
                      ))
                    ) : (
                      <p className="px-3.5 py-2.5 font-manrope text-[12.5px] text-[#6F6F8D]">
                        Set an Activity trigger to see its payload fields here.
                      </p>
                    ))}
                </div>
              </>
            )}
          </div>,
          document.body,
        )}
    </div>
  );
}
