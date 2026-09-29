import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Plus, Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  newConversionPayloadParam,
  MAX_CONVERSION_PAYLOAD_PARAMS,
  type ConversionPayloadParameters,
} from "./CampaignSetupStep";

/** Behaviour events a conversion can be defined against — kept in sync with
 *  CampaignAudienceStep's own list, the summary sentence's source of truth. */
export const CONVERSION_EVENT_OPTIONS = [
  "Purchase",
  "Added to cart",
  "Product viewed",
  "App opened",
  "Page visited",
  "Coupon issued",
  "Coupon redeemed",
  "Viewed or wishlisted a product",
];

export const CONVERSION_WINDOW_VALUES = ["1", "3", "7", "14", "30", "60", "90"];
export const CONVERSION_WINDOW_UNITS = ["Hours", "Days", "Weeks"];
export const REVENUE_PARAMETER_OPTIONS = ["Order value", "Revenue", "Cart value", "Custom attribute"];

const PAYLOAD_ATTRIBUTE_OPTIONS = ["name", "Price", "Product_Checkout", "Product_Delivery", "Quantity", "Category"];
const PAYLOAD_OPERATOR_OPTIONS = ["Equal to", "Not equal to", "One of", "Begins with", "Contains"];

const fieldClass =
  "h-10 w-full rounded-md border border-[#DDE2EE] bg-white px-3 font-manrope text-sm text-[#17173A] outline-none transition-colors placeholder:text-[#A0A0A0] focus:border-[#2F68E5]";

/** A checkbox matching the style used in the tracking-parameters drawer. */
function RowCheckbox({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        "grid size-[18px] shrink-0 place-items-center rounded border-2 transition-colors",
        checked ? "border-[#2F68E5] bg-[#2F68E5]" : "border-[#C3CAD9] bg-white"
      )}
    >
      {checked && (
        <svg viewBox="0 0 12 12" className="size-2.5 text-white" fill="none">
          <path
            d="M2.5 6.2 4.8 8.5 9.5 3.8"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </button>
  );
}

/** The app's own floating-panel dropdown — same look as every other select
 *  in the wizard (Send to's Dropdown, the removed FieldSelect) rather than
 *  the browser's native <select> popup, which looks visibly out of place
 *  next to the rest of this styled drawer. Portalled to <body> and
 *  positioned by rect so it isn't clipped by the drawer's own overflow. */
function SelectField({
  value,
  placeholder,
  options,
  onChange,
}: {
  value: string;
  placeholder?: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (!wrapRef.current?.contains(target) && !panelRef.current?.contains(target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  useLayoutEffect(() => {
    if (!open) return;
    const update = () => wrapRef.current && setRect(wrapRef.current.getBoundingClientRect());
    update();
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [open]);

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex h-10 w-full items-center justify-between gap-2 rounded-md border bg-white px-3 font-manrope text-sm outline-none transition-colors",
          open ? "border-[#2F68E5]" : "border-[#DDE2EE]",
          value ? "text-[#17173A]" : "text-[#A0A0A0]"
        )}
      >
        <span className="truncate">{value || placeholder}</span>
        <ChevronDown
          className={cn("size-4 shrink-0 text-[#8A8AA3] transition-transform", open && "rotate-180")}
          strokeWidth={2}
        />
      </button>
      {open &&
        rect &&
        createPortal(
          <div
            ref={panelRef}
            style={{ position: "fixed", top: rect.bottom + 4, left: rect.left, width: rect.width }}
            className="scroll-slim z-[120] max-h-[240px] overflow-y-auto rounded-md border border-[#DDE2EE] bg-white py-1 shadow-[0_8px_24px_rgba(23,23,58,0.12)]"
          >
            {options.map((o) => (
              <button
                key={o}
                type="button"
                onClick={() => {
                  onChange(o);
                  setOpen(false);
                }}
                className={cn(
                  "block w-full px-3 py-2 text-left font-manrope text-sm transition-colors",
                  o === value
                    ? "bg-[#F4F8FF] font-semibold text-[#2F68E5]"
                    : "text-[#17173A] hover:bg-[#F7F9FC]"
                )}
              >
                {o}
              </button>
            ))}
          </div>,
          document.body
        )}
    </div>
  );
}

/** Right-side drawer for the conversion goal's own config — reached from the
 *  "Conversion tracking" section's edit icon, once the summary sentence has
 *  something to edit. Same chrome as UtmParametersDrawer. */
export default function ConversionGoalDrawer({
  open,
  conversionEvent,
  onConversionEventChange,
  conversionWindowValue,
  conversionWindowUnit,
  onConversionWindowChange,
  revenueParameter,
  onRevenueParameterChange,
  payloadParameters,
  onPayloadParametersChange,
  onClose,
}: {
  open: boolean;
  conversionEvent: string;
  onConversionEventChange: (v: string) => void;
  conversionWindowValue: string;
  conversionWindowUnit: string;
  onConversionWindowChange: (patch: { conversionWindowValue?: string; conversionWindowUnit?: string }) => void;
  revenueParameter: string;
  onRevenueParameterChange: (v: string) => void;
  payloadParameters: ConversionPayloadParameters;
  onPayloadParametersChange: (patch: Partial<ConversionPayloadParameters>) => void;
  onClose: () => void;
}) {
  const [shown, setShown] = useState(false);

  useEffect(() => {
    if (!open) {
      setShown(false);
      return;
    }
    const id = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(id);
  }, [open]);

  if (!open) return null;

  const pairs = payloadParameters.pairs;
  const setPairs = (next: typeof pairs) => onPayloadParametersChange({ pairs: next });
  const patchPair = (id: string, patch: Partial<(typeof pairs)[number]>) =>
    setPairs(pairs.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  const removePair = (id: string) => setPairs(pairs.filter((p) => p.id !== id));
  const toggleSpecify = (enabled: boolean) =>
    onPayloadParametersChange({ enabled, pairs: enabled && pairs.length === 0 ? [newConversionPayloadParam()] : pairs });

  return createPortal(
    <div className="fixed inset-0 z-[100] flex justify-end">
      <div
        className={cn(
          "absolute inset-0 bg-black/40 transition-opacity duration-300",
          shown ? "opacity-100" : "opacity-0"
        )}
        onClick={onClose}
      />
      <div
        className={cn(
          "relative flex h-full w-full max-w-[560px] flex-col bg-white shadow-[-20px_0_60px_rgba(23,23,58,0.15)] transition-transform duration-300 ease-out",
          shown ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="flex items-center justify-between border-b border-[#DDE2EE] px-6 py-5">
          <div>
            <h2 className="font-manrope text-lg font-bold text-[#17173A]">Set conversion goal</h2>
            <p className="mt-0.5 font-manrope text-sm text-[#6F6F8D]">
              Select the event you would like to count as a conversion.
            </p>
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="grid size-8 shrink-0 place-items-center rounded-full text-[#8A8AA3] transition-colors hover:bg-[#F0F3F9] hover:text-[#17173A]"
          >
            <X className="size-5" strokeWidth={2} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          <div>
            <label className="mb-1.5 flex items-center gap-1 font-manrope text-sm font-semibold text-[#17173A]">
              Event name
              <span className="text-[#FC5E02]">*</span>
            </label>
            <SelectField
              value={conversionEvent}
              placeholder="Select event"
              options={CONVERSION_EVENT_OPTIONS}
              onChange={onConversionEventChange}
            />
          </div>

          <div className="mt-5">
            <label className="flex items-center gap-2.5">
              <RowCheckbox checked={payloadParameters.enabled} onChange={toggleSpecify} />
              <span className="font-manrope text-sm font-semibold text-[#17173A]">
                Specify payload parameters
              </span>
            </label>

            {payloadParameters.enabled && (
              <div className="mt-4 space-y-4">
                {pairs.map((pair) => (
                  <div key={pair.id} className="flex items-center gap-3">
                    <div className="min-w-0 flex-1">
                      <SelectField
                        value={pair.attribute}
                        placeholder="Attribute"
                        options={PAYLOAD_ATTRIBUTE_OPTIONS}
                        onChange={(attribute) => patchPair(pair.id, { attribute })}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <SelectField
                        value={pair.operator}
                        options={PAYLOAD_OPERATOR_OPTIONS}
                        onChange={(operator) => patchPair(pair.id, { operator })}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <input
                        type="text"
                        value={pair.value}
                        onChange={(e) => patchPair(pair.id, { value: e.target.value })}
                        placeholder="Select"
                        className={fieldClass}
                      />
                    </div>
                    {pairs.length > 1 && (
                      <button
                        type="button"
                        aria-label="Remove payload parameter"
                        onClick={() => removePair(pair.id)}
                        className="grid size-10 shrink-0 place-items-center rounded-md border border-[#DDE2EE] text-[#8A8AA3] transition-colors hover:bg-[#F0F3F9] hover:text-[#17173A]"
                      >
                        <Trash2 className="size-4" strokeWidth={2} />
                      </button>
                    )}
                  </div>
                ))}
                {pairs.length < MAX_CONVERSION_PAYLOAD_PARAMS && (
                  <button
                    type="button"
                    onClick={() => setPairs([...pairs, newConversionPayloadParam()])}
                    className="dc-btn dc-btn-secondary font-bold"
                  >
                    <Plus strokeWidth={2.4} />
                    ADD PARAMETERS ({MAX_CONVERSION_PAYLOAD_PARAMS - pairs.length})
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="my-6 border-t border-[#EEF1F7]" />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 flex items-center gap-1 font-manrope text-sm font-semibold text-[#17173A]">
                Conversion window
                <span className="text-[#FC5E02]">*</span>
              </label>
              <div className="flex items-center gap-2">
                <div className="min-w-0 flex-1">
                  <SelectField
                    value={conversionWindowValue}
                    options={CONVERSION_WINDOW_VALUES}
                    onChange={(v) => onConversionWindowChange({ conversionWindowValue: v })}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <SelectField
                    value={conversionWindowUnit}
                    options={CONVERSION_WINDOW_UNITS}
                    onChange={(v) => onConversionWindowChange({ conversionWindowUnit: v })}
                  />
                </div>
              </div>
            </div>
            <div>
              <label className="mb-1.5 flex items-center gap-1 font-manrope text-sm font-semibold text-[#17173A]">
                Revenue parameter
                <span className="text-[#FC5E02]">*</span>
              </label>
              <SelectField
                value={revenueParameter}
                placeholder="Revenue parameter"
                options={REVENUE_PARAMETER_OPTIONS}
                onChange={onRevenueParameterChange}
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end border-t border-[#DDE2EE] px-6 py-4">
          <button type="button" onClick={onClose} className="dc-btn dc-btn-primary">
            Done
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
