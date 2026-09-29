import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Info, Plus, Trash2, X } from "lucide-react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
  newUtmKeyValuePair,
  MAX_CUSTOM_KEYS,
  type UtmParamConfig,
  type UtmParameters,
  type KeyValueParameters,
} from "./CampaignSetupStep";

/** One row's static copy — key order doubles as the table's row order. */
const ROWS: { key: keyof UtmParameters; label: string; placeholder: string }[] = [
  { key: "source", label: "Source (utm_source)", placeholder: "Value" },
  { key: "medium", label: "Medium (utm_medium)", placeholder: "Value" },
  { key: "campaign", label: "Campaign (utm_campaign)", placeholder: "Value" },
  { key: "term", label: "Term (utm_term)", placeholder: "Value" },
];

const fieldClass =
  "h-10 w-full rounded-md border border-[#DDE2EE] bg-white px-3 font-manrope text-sm text-[#17173A] outline-none transition-colors placeholder:text-[#A0A0A0] focus:border-[#2F68E5]";

/** A checkbox matching the square, rounded style used in the segment picker. */
function RowCheckbox({
  checked,
  disabled,
  onChange,
}: {
  checked: boolean;
  disabled?: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "grid size-[18px] shrink-0 place-items-center rounded border-2 transition-colors",
        disabled
          ? "cursor-not-allowed border-[#E4E8F0] bg-[#F7F9FC]"
          : checked
            ? "border-[#2F68E5] bg-[#2F68E5]"
            : "border-[#C3CAD9] bg-white"
      )}
    >
      {checked && !disabled && (
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

/** Info-icon tooltip — black bubble, matches the wizard's other field-level
 *  hints (e.g. CampaignSettingsDrawer's HeadingInfo). */
function InfoDot({ label }: { label: string }) {
  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            aria-label="More information"
            className="inline-grid shrink-0 place-items-center text-[#8A8AA3] transition-colors hover:text-[#6F6F8D]"
          >
            <Info className="size-3.5" strokeWidth={2} />
          </button>
        </TooltipTrigger>
        <TooltipContent
          side="top"
          align="start"
          className="max-w-[260px] overflow-visible rounded-lg border-0 bg-black px-3 py-2.5 text-white shadow-none"
        >
          <p className="font-manrope text-xs leading-[18px]">{label}</p>
          <TooltipPrimitive.Arrow className="fill-black" width={10} height={6} />
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/** Right-side drawer for the per-parameter UTM table — reached from "Edit"
 *  once "Customize tracking parameters" is switched on. Off-account defaults
 *  live in GaConfigPill; this is what overrides them per campaign. */
export default function UtmParametersDrawer({
  open,
  channel = "Email",
  values,
  onChange,
  keyValueParameters,
  onKeyValueChange,
  onClose,
}: {
  open: boolean;
  /** Custom key-value parameters are Email-only. */
  channel?: string;
  values: UtmParameters;
  onChange: (patch: Partial<UtmParameters>) => void;
  keyValueParameters: KeyValueParameters;
  onKeyValueChange: (patch: Partial<KeyValueParameters>) => void;
  onClose: () => void;
}) {
  const [shown, setShown] = useState(false);
  const isEmail = channel === "Email";

  useEffect(() => {
    if (!open) {
      setShown(false);
      return;
    }
    const id = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(id);
  }, [open]);

  if (!open) return null;

  const setRow = (key: keyof UtmParameters, patch: Partial<UtmParamConfig>) =>
    onChange({ [key]: { ...values[key], ...patch } } as Partial<UtmParameters>);

  const pairs = keyValueParameters.pairs;
  const setPairs = (next: typeof pairs) => onKeyValueChange({ pairs: next });
  const patchPair = (id: string, patch: Partial<(typeof pairs)[number]>) =>
    setPairs(pairs.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  const removePair = (id: string) => setPairs(pairs.filter((p) => p.id !== id));
  const toggleKeyValue = (enabled: boolean) =>
    onKeyValueChange({ enabled, pairs: enabled && pairs.length === 0 ? [newUtmKeyValuePair()] : pairs });

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
            <h2 className="font-manrope text-lg font-bold text-[#17173A]">Tracking parameters</h2>
            <p className="mt-0.5 font-manrope text-sm text-[#6F6F8D]">
              Choose which UTM parameters go on this campaign's links.
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
          <div className="space-y-6">
            {ROWS.map((row) => {
              const cfg = values[row.key];
              return (
                <div key={row.key} className="grid grid-cols-[1fr_1fr] items-center gap-4">
                  <label className="flex items-center gap-2.5">
                    <RowCheckbox
                      checked={cfg.enabled}
                      onChange={(enabled) => setRow(row.key, { enabled })}
                    />
                    <span className="font-manrope text-sm text-[#17173A]">{row.label}</span>
                  </label>
                  <input
                    type="text"
                    value={cfg.value}
                    onChange={(e) => setRow(row.key, { value: e.target.value })}
                    placeholder={row.placeholder}
                    className={fieldClass}
                  />
                </div>
              );
            })}
          </div>

          <div className="my-6 border-t border-[#EEF1F7]" />

          <div>
            <label className="flex items-center gap-2.5">
              <RowCheckbox
                checked={keyValueParameters.enabled}
                disabled={!isEmail}
                onChange={toggleKeyValue}
              />
              <span className="font-manrope text-sm font-semibold text-[#17173A]">
                Key value parameters
              </span>
              <InfoDot
                label={
                  isEmail
                    ? `Add up to ${MAX_CUSTOM_KEYS} custom key-value parameters appended to this campaign's links.`
                    : "Custom UTM keys are supported only for email channel."
                }
              />
            </label>

            {isEmail && keyValueParameters.enabled && (
              <div className="mt-4">
                <div className="space-y-4">
                  {pairs.map((pair, i) => (
                    <div key={pair.id} className="flex items-end gap-4">
                      <div className="min-w-0 flex-1">
                        <label className="mb-1.5 flex items-center gap-1 font-manrope text-sm font-semibold text-[#17173A]">
                          {`Key ${i + 1}`}
                          <span className="text-[#FC5E02]">*</span>
                        </label>
                        <input
                          type="text"
                          value={pair.key}
                          onChange={(e) => patchPair(pair.id, { key: e.target.value })}
                          className={fieldClass}
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <label className="mb-1.5 flex items-center gap-1 font-manrope text-sm font-semibold text-[#17173A]">
                          {`Value ${i + 1}`}
                          <span className="text-[#FC5E02]">*</span>
                        </label>
                        <input
                          type="text"
                          value={pair.value}
                          onChange={(e) => patchPair(pair.id, { value: e.target.value })}
                          className={fieldClass}
                        />
                      </div>
                      {pairs.length > 1 && (
                        <button
                          type="button"
                          aria-label={`Remove key-value pair ${i + 1}`}
                          onClick={() => removePair(pair.id)}
                          className="grid size-10 shrink-0 place-items-center rounded-md border border-[#DDE2EE] text-[#8A8AA3] transition-colors hover:bg-[#F0F3F9] hover:text-[#17173A]"
                        >
                          <Trash2 className="size-4" strokeWidth={2} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                {pairs.length < MAX_CUSTOM_KEYS && (
                  <button
                    type="button"
                    onClick={() => setPairs([...pairs, newUtmKeyValuePair()])}
                    className="dc-btn dc-btn-secondary mt-4 font-bold"
                  >
                    <Plus strokeWidth={2.4} />
                    ADD CUSTOM KEY ({MAX_CUSTOM_KEYS - pairs.length})
                  </button>
                )}
              </div>
            )}
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
