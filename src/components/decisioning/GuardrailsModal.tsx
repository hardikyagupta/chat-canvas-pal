import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  DEFAULT_GUARDRAILS,
  type GuardrailsData,
} from "@/contexts/DecisioningSetupContext";

function GuardrailRow({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-4">
      <div className="min-w-0">
        <p className="text-[13px] font-semibold text-[#17173A]">{title}</p>
        <p className="mt-0.5 text-[12px] text-[#6F6F8D]">{subtitle}</p>
      </div>
      <div className="flex shrink-0 items-center gap-2">{children}</div>
    </div>
  );
}

export default function GuardrailsModal({
  open,
  onOpenChange,
  initialData,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData: GuardrailsData | null;
  onSave: (data: GuardrailsData) => void;
}) {
  const [form, setForm] = useState<GuardrailsData>(DEFAULT_GUARDRAILS);

  useEffect(() => {
    if (!open) return;
    setForm(initialData ?? DEFAULT_GUARDRAILS);
  }, [open, initialData]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-[16px] font-manrope sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle className="text-[18px] font-bold text-[#17173A]">
            Set your guardrails
          </DialogTitle>
          <DialogDescription className="text-[13px] text-[#6F6F8D]">
            Hard limits the engine will never cross, no matter what it learns.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col divide-y divide-[#DDE2EE]">
          <GuardrailRow
            title="Require marketing consent"
            subtitle="Only message customers who've opted in"
          >
            <Switch
              checked={form.requireConsent}
              onCheckedChange={(v) => setForm((f) => ({ ...f, requireConsent: v }))}
              aria-label="Require marketing consent"
            />
          </GuardrailRow>

          <GuardrailRow
            title="Frequency cap"
            subtitle="Most messages any one customer gets per week"
          >
            <Input
              type="number"
              min={1}
              max={14}
              value={form.frequencyCapPerWeek}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  frequencyCapPerWeek: Math.max(1, Math.min(14, Number(e.target.value) || 1)),
                }))
              }
              className="h-9 w-16 text-center text-[13px]"
            />
            <span className="text-[12px] text-[#6F6F8D]">per week</span>
          </GuardrailRow>

          <GuardrailRow
            title="Quiet hours"
            subtitle="No sends during these hours (customer's local time)"
          >
            <Input
              type="time"
              value={form.quietHoursStart}
              onChange={(e) => setForm((f) => ({ ...f, quietHoursStart: e.target.value }))}
              className="h-9 w-[92px] text-[13px]"
            />
            <span className="text-[12px] text-[#6F6F8D]">to</span>
            <Input
              type="time"
              value={form.quietHoursEnd}
              onChange={(e) => setForm((f) => ({ ...f, quietHoursEnd: e.target.value }))}
              className="h-9 w-[92px] text-[13px]"
            />
          </GuardrailRow>

          <GuardrailRow
            title="Hold-out group"
            subtitle="Kept aside so you can measure true lift"
          >
            <Input
              type="number"
              min={0}
              max={20}
              value={form.holdoutPercent}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  holdoutPercent: Math.max(0, Math.min(20, Number(e.target.value) || 0)),
                }))
              }
              className="h-9 w-16 text-center text-[13px]"
            />
            <span className="text-[12px] text-[#6F6F8D]">%</span>
          </GuardrailRow>
        </div>

        <DialogFooter>
          <button
            onClick={() => onOpenChange(false)}
            className="rounded border border-[#DDE2EE] bg-white px-4 py-2 font-manrope text-[13px] font-semibold text-[#17173A] transition-colors hover:bg-[#F4F8FF]"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onSave(form);
              onOpenChange(false);
            }}
            className="rounded bg-[#2F68E5] px-4 py-2 font-manrope text-[13px] font-semibold tracking-[0.42px] text-white transition-colors hover:bg-[#255ad2]"
          >
            Save guardrails
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
