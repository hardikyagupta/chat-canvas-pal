import { useEffect, useState } from "react";
import { ArrowRight, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DEFAULT_EVENT_MAPPINGS,
  DETECTED_EVENTS,
  STANDARD_EVENTS,
  type EventMappingData,
} from "@/contexts/DecisioningSetupContext";

export default function EventMappingModal({
  open,
  onOpenChange,
  initialData,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData: EventMappingData | null;
  onSave: (data: EventMappingData) => void;
}) {
  const [mappings, setMappings] = useState<Record<string, string>>(DEFAULT_EVENT_MAPPINGS);

  useEffect(() => {
    if (!open) return;
    setMappings(initialData?.mappings ?? DEFAULT_EVENT_MAPPINGS);
  }, [open, initialData]);

  // The engine can't decide anything without knowing carts and purchases.
  const isValid = mappings.add_to_cart !== "none" && mappings.purchase !== "none";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-[16px] font-manrope sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle className="text-[18px] font-bold text-[#17173A]">
            Map your events
          </DialogTitle>
          <DialogDescription className="text-[13px] text-[#6F6F8D]">
            Tell the engine what your event names mean, so "add_to_bag" counts as "Add
            to cart". We've matched what we detected — adjust anything that looks off.
          </DialogDescription>
        </DialogHeader>

        <div className="flex max-h-[55vh] flex-col divide-y divide-[#DDE2EE] overflow-y-auto pr-1">
          {STANDARD_EVENTS.map((event) => {
            const mapped = mappings[event.id] && mappings[event.id] !== "none";
            return (
              <div key={event.id} className="flex items-center gap-3 py-3">
                <span className="w-[130px] shrink-0 rounded bg-[#E7EDFF] px-2 py-1 text-center text-xs font-semibold text-[#2F68E5]">
                  {event.label}
                </span>
                <ArrowRight className="h-3.5 w-3.5 shrink-0 text-[#6F6F8D]" strokeWidth={2} />
                <div className="min-w-0 flex-1">
                  <Select
                    value={mappings[event.id] ?? "none"}
                    onValueChange={(v) =>
                      setMappings((prev) => ({ ...prev, [event.id]: v }))
                    }
                  >
                    <SelectTrigger className="h-9 w-full border-[#DDE2EE] bg-white text-[13px] shadow-none">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DETECTED_EVENTS.map((detected) => (
                        <SelectItem
                          key={detected.id}
                          value={detected.id}
                          className="font-mono text-[13px]"
                        >
                          {detected.label}
                        </SelectItem>
                      ))}
                      <SelectItem value="none" className="text-[13px] text-[#6F6F8D]">
                        Not tracked yet
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <span className="grid h-4 w-4 shrink-0 place-items-center">
                  {mapped && (
                    <Check
                      className="h-4 w-4 text-[#00C48C] animate-in fade-in zoom-in duration-200"
                      strokeWidth={2.5}
                    />
                  )}
                </span>
              </div>
            );
          })}
        </div>

        {!isValid && (
          <p className="text-[12px] text-[#6F6F8D]">
            The engine needs at least "Add to cart" and "Purchase" mapped to start
            learning.
          </p>
        )}

        <DialogFooter>
          <button
            onClick={() => onOpenChange(false)}
            className="rounded border border-[#DDE2EE] bg-white px-4 py-2 font-manrope text-[13px] font-semibold text-[#17173A] transition-colors hover:bg-[#F4F8FF]"
          >
            Cancel
          </button>
          <button
            disabled={!isValid}
            onClick={() => {
              onSave({ mappings });
              onOpenChange(false);
            }}
            className="rounded bg-[#2F68E5] px-4 py-2 font-manrope text-[13px] font-semibold tracking-[0.42px] text-white transition-colors hover:bg-[#255ad2] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Save mappings
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
