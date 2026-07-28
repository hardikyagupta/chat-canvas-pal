import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import type { ReportItem } from '@/data/reports';
import type { ScheduleItem, ScheduleCadence } from '@/data/schedules';
import { CADENCE_OPTIONS } from '@/data/schedules';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const MANROPE: React.CSSProperties = { fontFamily: 'Manrope, sans-serif' };

// Loose-but-sane email check — enough to flag typos without being a hard RFC gate.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Split the recipients field into trimmed tokens, keeping valid / invalid apart
// so we can enable Create on ≥1 valid and softly warn about the rest.
const parseRecipients = (raw: string) => {
  const tokens = raw
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);
  const valid = tokens.filter((t) => EMAIL_RE.test(t));
  const invalid = tokens.filter((t) => !EMAIL_RE.test(t));
  return { valid, invalid };
};

let scheduleCounter = 0;

/** Optional starting values (e.g. from tapping a suggested schedule). */
export interface SchedulePrefill {
  reportId?: string;
  cadence?: ScheduleCadence;
  cron?: string;
  recipients?: string[];
}

interface ScheduleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reports: ReportItem[];
  onCreate: (item: ScheduleItem) => void;
  /** Pre-fill applied each time the dialog opens. */
  prefill?: SchedulePrefill;
}

/**
 * Create-a-schedule dialog: pick a report, a cadence (Daily / Weekly / Monthly /
 * Custom cron), and recipient emails. Recipients get friendly inline validation
 * (a soft hint on invalid addresses — deliberately not a raw validation dump).
 */
const ScheduleDialog: React.FC<ScheduleDialogProps> = ({ open, onOpenChange, reports, onCreate, prefill }) => {
  const [reportId, setReportId] = useState<string>('');
  const [cadence, setCadence] = useState<ScheduleCadence>('weekly');
  const [cron, setCron] = useState('');
  const [recipientsRaw, setRecipientsRaw] = useState('');

  // Apply the prefill each time the dialog opens (e.g. from a suggested schedule);
  // a plain "New schedule" passes no prefill and opens with defaults.
  useEffect(() => {
    if (open) {
      setReportId(prefill?.reportId ?? '');
      setCadence(prefill?.cadence ?? 'weekly');
      setCron(prefill?.cron ?? '');
      setRecipientsRaw(prefill?.recipients?.join(', ') ?? '');
    }
    // Read prefill at open time only; the caller sets it before opening.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const { valid, invalid } = useMemo(() => parseRecipients(recipientsRaw), [recipientsRaw]);

  const cronNeeded = cadence === 'custom';
  const canCreate =
    !!reportId && valid.length > 0 && (!cronNeeded || cron.trim().length > 0);

  const reset = () => {
    setReportId('');
    setCadence('weekly');
    setCron('');
    setRecipientsRaw('');
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  const handleCreate = () => {
    if (!canCreate) return;
    const report = reports.find((r) => r.id === reportId);
    if (!report) return;
    const option = CADENCE_OPTIONS.find((o) => o.value === cadence) ?? CADENCE_OPTIONS[1];
    const trimmedCron = cron.trim();

    const item: ScheduleItem = {
      id: `s-${Date.now()}-${scheduleCounter++}`,
      reportId: report.id,
      title: report.title,
      fileType: report.fileType,
      cadence,
      cadenceLabel: cronNeeded ? `Custom — ${trimmedCron}` : option.label,
      cron: cronNeeded ? trimmedCron : undefined,
      recipients: valid,
      nextRun: cronNeeded ? 'Per cron' : option.nextRun,
      status: 'active',
      createdTime: 'now',
      doc: report.doc,
    };

    onCreate(item);
    toast.success('Schedule created', {
      description: `${report.title} · ${item.cadenceLabel}`,
    });
    handleOpenChange(false);
  };

  const fieldLabel = 'text-[13px] font-medium text-[var(--color-ink)]';

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-[480px] gap-0 rounded-[16px] border-[var(--color-line-input)] p-[24px]" style={MANROPE}>
        <DialogHeader className="mb-[20px] space-y-[4px]">
          <DialogTitle className="text-[18px] leading-[24px] text-[var(--color-ink)]" style={MANROPE}>
            New schedule
          </DialogTitle>
          <DialogDescription className="text-[13px] leading-[18px] text-[var(--color-grey)]" style={MANROPE}>
            Pick a report, choose how often it runs, and who gets it by email.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-[16px]">
          {/* Report */}
          <div className="flex flex-col gap-[6px]">
            <label className={fieldLabel} style={MANROPE}>Report</label>
            <Select value={reportId} onValueChange={setReportId}>
              <SelectTrigger className="h-[40px] rounded-[10px] border-[var(--color-line-input)] text-[14px]" style={MANROPE}>
                <SelectValue placeholder="Select a report" />
              </SelectTrigger>
              <SelectContent>
                {reports.map((r) => (
                  <SelectItem key={r.id} value={r.id} className="text-[14px]" style={MANROPE}>
                    {r.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Cadence */}
          <div className="flex flex-col gap-[6px]">
            <label className={fieldLabel} style={MANROPE}>Cadence</label>
            <Select value={cadence} onValueChange={(v) => setCadence(v as ScheduleCadence)}>
              <SelectTrigger className="h-[40px] rounded-[10px] border-[var(--color-line-input)] text-[14px]" style={MANROPE}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CADENCE_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value} className="text-[14px]" style={MANROPE}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Cron — only for custom cadence */}
          {cronNeeded && (
            <div className="flex flex-col gap-[6px]">
              <label className={fieldLabel} style={MANROPE}>Cron expression</label>
              <input
                type="text"
                value={cron}
                onChange={(e) => setCron(e.target.value)}
                placeholder="0 9 * * 1"
                className="h-[40px] rounded-[10px] border border-[var(--color-line-input)] bg-white px-[14px] text-[14px] text-[var(--color-ink)] outline-none placeholder:text-[var(--color-grey-soft)] focus:border-[var(--color-royal)] transition-colors font-mono"
              />
            </div>
          )}

          {/* Recipients */}
          <div className="flex flex-col gap-[6px]">
            <label className={fieldLabel} style={MANROPE}>Recipients</label>
            <input
              type="text"
              value={recipientsRaw}
              onChange={(e) => setRecipientsRaw(e.target.value)}
              placeholder="name@company.com, teammate@company.com"
              className="h-[40px] rounded-[10px] border border-[var(--color-line-input)] bg-white px-[14px] text-[14px] text-[var(--color-ink)] outline-none placeholder:text-[var(--color-grey-soft)] focus:border-[var(--color-royal)] transition-colors"
              style={MANROPE}
            />
            {/* Soft, friendly helper — never a raw validation dump. */}
            <p className="text-[12px] leading-[16px] text-[var(--color-grey)]" style={MANROPE}>
              {invalid.length > 0 ? (
                <span className="text-[var(--color-orange)]">
                  {invalid.length} address{invalid.length > 1 ? 'es' : ''} don't look right — separate emails with commas.
                </span>
              ) : valid.length > 0 ? (
                `${valid.length} recipient${valid.length > 1 ? 's' : ''} will get this report.`
              ) : (
                'Separate multiple emails with commas.'
              )}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-[24px] flex items-center justify-end gap-[8px]">
          <button
            type="button"
            onClick={() => handleOpenChange(false)}
            className="flex items-center justify-center px-[14px] py-[8px] rounded-[8px] text-[14px] font-medium text-[var(--color-ink)] hover:bg-[var(--color-surface-1)] transition-colors"
            style={MANROPE}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleCreate}
            disabled={!canCreate}
            className="relative flex items-center justify-center px-[16px] py-[8px] rounded-[8px] bg-foreground overflow-hidden transition-opacity disabled:opacity-40 disabled:pointer-events-none hover:bg-foreground/90"
          >
            <span
              aria-hidden
              className="absolute inset-0 rounded-[8px] pointer-events-none"
              style={{ background: 'linear-gradient(to bottom, oklch(1 0 0 / 0.07) 82%, oklch(1 0 0 / 0.15) 94%)' }}
            />
            <span className="relative z-10 text-[14px] leading-[20px] font-medium text-background" style={MANROPE}>
              Create schedule
            </span>
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ScheduleDialog;
