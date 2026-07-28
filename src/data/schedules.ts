// Scheduled reports shown on the Scheduler page. Each schedule references a
// generated report and embeds its `doc` payload (see reports.ts) so a schedule
// card can render the same preview thumbnail and open the doc previewer, and so
// a "Send now" action has the content to (simulate) emailing.

import type { ReportDoc, ReportItem } from './reports';
import { generatedReports } from './reports';

export type ScheduleCadence = 'daily' | 'weekly' | 'monthly' | 'custom';

export type ScheduleStatus = 'active' | 'paused';

export interface ScheduleItem {
  id: string;
  reportId: string;
  /** Denormalized report title for display. */
  title: string;
  fileType: ReportItem['fileType'];
  cadence: ScheduleCadence;
  /** Human label, e.g. "Weekly — Mon 9:00 UTC". */
  cadenceLabel: string;
  /** Cron expression — only set when cadence === 'custom'. */
  cron?: string;
  /** Validated recipient email addresses. */
  recipients: string[];
  /** Next run label, e.g. "Mon 9:00 UTC". */
  nextRun: string;
  /** Running vs. paused — shown as a status pill on the card. */
  status: ScheduleStatus;
  /** Relative "created" time, e.g. "2h", "3d". */
  createdTime: string;
  /** Preview + previewer payload (same shape the RHS artifact panel renders). */
  doc: ReportDoc;
}

// A pre-baked schedule suggestion shown on the Scheduler homepage. Tapping one
// opens the create dialog pre-filled with its report / cadence / recipients.
export interface ScheduleTemplate {
  id: string;
  emoji: string;
  title: string;
  description: string;
  reportId: string;
  cadence: ScheduleCadence;
  recipients: string[];
}

// Cadence choices for the <Select> in ScheduleDialog, reused by the page to
// derive a schedule's `cadenceLabel` / `nextRun`. `custom` uses the entered cron.
export const CADENCE_OPTIONS: {
  value: ScheduleCadence;
  label: string;
  nextRun: string;
}[] = [
  { value: 'daily', label: 'Daily — 9:00 UTC', nextRun: 'Tomorrow 9:00 UTC' },
  { value: 'weekly', label: 'Weekly — Mon 9:00 UTC', nextRun: 'Mon 9:00 UTC' },
  { value: 'monthly', label: 'Monthly — 1st, 9:00 UTC', nextRun: '1st 9:00 UTC' },
  { value: 'custom', label: 'Custom cron…', nextRun: 'Per cron' },
];

// Seed the grid from a few generated reports so the card view isn't empty on
// first open (demonstrates the "created schedule" format).
const seed = (
  id: string,
  reportId: string,
  cadence: ScheduleCadence,
  recipients: string[],
  status: ScheduleStatus,
  createdTime: string,
): ScheduleItem => {
  const report = generatedReports.find((r) => r.id === reportId) ?? generatedReports[0];
  const option = CADENCE_OPTIONS.find((o) => o.value === cadence) ?? CADENCE_OPTIONS[1];
  return {
    id,
    reportId: report.id,
    title: report.title,
    fileType: report.fileType,
    cadence,
    cadenceLabel: option.label,
    recipients,
    nextRun: option.nextRun,
    status,
    createdTime,
    doc: report.doc,
  };
};

export const scheduledReports: ScheduleItem[] = [
  seed('s1', 'r1', 'weekly', ['kirit@netcorecloud.com', 'growth@netcorecloud.com'], 'active', '2h'),
  seed('s2', 'r2', 'monthly', ['leadership@netcorecloud.com'], 'paused', '1d'),
];

// Suggested schedules on the homepage — one-tap starting points that open the
// create dialog pre-filled. Descriptions read like ChatGPT's Scheduled samples.
export const scheduleTemplates: ScheduleTemplate[] = [
  {
    id: 't1',
    emoji: '📊',
    title: 'Weekly channel performance',
    description: 'Email the WhatsApp channel performance report every Monday at 9:00 UTC',
    reportId: 'r1',
    cadence: 'weekly',
    recipients: ['kirit@netcorecloud.com'],
  },
  {
    id: 't2',
    emoji: '📈',
    title: 'Monthly business review',
    description: 'Send the Q3 campaign snapshot to leadership on the 1st of each month',
    reportId: 'r2',
    cadence: 'monthly',
    recipients: ['leadership@netcorecloud.com'],
  },
  {
    id: 't3',
    emoji: '🔍',
    title: 'Daily CTR anomaly digest',
    description: 'Get a daily digest of CTR anomalies across campaigns at 9:00 UTC',
    reportId: 'r3',
    cadence: 'daily',
    recipients: ['analytics@netcorecloud.com'],
  },
  {
    id: 't4',
    emoji: '🗓️',
    title: 'Seasonal engagement recap',
    description: 'A weekly recap of seasonal engagement trends across all channels',
    reportId: 'r4',
    cadence: 'weekly',
    recipients: ['kirit@netcorecloud.com'],
  },
];
