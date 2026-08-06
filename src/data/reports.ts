// Generated reports (PDFs / Docs) shown on the Reports page. Each carries the
// same `doc` payload the RHS artifact previewer renders (see ArtifactPreview
// `doc` / DeepResearchDoc), so tapping a report opens it in the doc previewer.

export interface ReportDoc {
  title: string;
  citations: number;
  summaryHeading?: string;
  /** Report paragraphs; may contain inline <strong> markup. */
  paragraphs: string[];
}

/** Where a report was generated from — drives the grouping on the Reports page. */
export type ReportSource = 'deep-research' | 'custom-agent' | 'scheduled';

export interface ReportItem {
  id: string;
  title: string;
  fileType: 'PDF' | 'DOC';
  /** Relative "generated" time, e.g. "2h", "3d". */
  time: string;
  /** Origin category — drives grouping / filtering / the source icon. */
  source: ReportSource;
  /** Specific origin name shown to the user, e.g. the exact agent ("Churn Risk
   *  Agent") or schedule ("Weekly digest"); for deep research, "Deep research". */
  sourceLabel: string;
  doc: ReportDoc;
}

export const generatedReports: ReportItem[] = [
  {
    id: 'r1',
    title: 'WhatsApp Channel Performance — This Quarter',
    fileType: 'PDF',
    time: '2h',
    source: 'deep-research',
    sourceLabel: 'Deep research',
    doc: {
      title: 'WhatsApp Channel Performance — This Quarter',
      citations: 9,
      summaryHeading: 'Executive summary',
      paragraphs: [
        "This quarter WhatsApp reached more people than any other channel but <strong>delivered the least of what it sent</strong> — over 60% of published messages never landed. The gap traces back to a handful of templates and unverified sender numbers, not the audience, which means most of it is recoverable.",
        "Email and APN are quietly carrying your qualified engagement, with near-100% delivery and the steadiest click rates. WhatsApp's raw reach is being wasted at the delivery step, so the channel looks weak on outcomes despite the largest send volume.",
        "The three lowest-performing templates account for the majority of failures, and a small cluster of multi-channel, high-intent users are the ones most worth protecting. Re-verifying sender identities and re-sequencing the 48-hour follow-up are the highest-leverage fixes.",
        "If delivery recovers to roughly 85%, we estimate <strong>~4,800 recovered conversations and an 18–24% lift in WhatsApp-attributed conversions</strong> next quarter — at no additional send cost.",
      ],
    },
  },
  {
    id: 'r2',
    title: 'Q3 Business Review — Campaign Snapshot',
    fileType: 'DOC',
    time: '1d',
    source: 'scheduled',
    sourceLabel: 'Quarterly digest',
    doc: {
      title: 'Q3 Business Review — Campaign Snapshot',
      citations: 12,
      summaryHeading: 'Executive summary',
      paragraphs: [
        "Q3 closed with <strong>8 active campaigns</strong> delivering 1.2M messages, a 34.6% open rate, and 12,430 conversions — the strongest quarter on record for re-engagement flows.",
        "The weekend re-engagement flow was the single biggest driver of incremental revenue, while two legacy flows dragged the blended CTR below target and should be retired.",
        "Deliverability held above 98% across email and APN, giving us headroom to scale the top-performing segment without incremental risk.",
      ],
    },
  },
  {
    id: 'r3',
    title: 'CTR Anomalies — Last 30 Days',
    fileType: 'PDF',
    time: '3d',
    source: 'deep-research',
    sourceLabel: 'Deep research',
    doc: {
      title: 'CTR Anomalies — Last 30 Days',
      citations: 6,
      summaryHeading: 'Executive summary',
      paragraphs: [
        "Five campaigns posted high CTR with unexpectedly low conversions, pointing to a <strong>landing-experience mismatch</strong> rather than a targeting problem.",
        "The pattern concentrates in two audience segments that click through on curiosity-driven subject lines but bounce before the primary action.",
        "Aligning the post-click page to the message promise is the highest-leverage fix, with an estimated 9–13% conversion recovery on the affected campaigns.",
      ],
    },
  },
  {
    id: 'r4',
    title: 'Seasonal Engagement Trends — Trailing 12 Months',
    fileType: 'DOC',
    time: '1w',
    source: 'custom-agent',
    sourceLabel: 'Trends Agent',
    doc: {
      title: 'Seasonal Engagement Trends — Trailing 12 Months',
      citations: 15,
      summaryHeading: 'Executive summary',
      paragraphs: [
        "Engagement follows a clear festival-season cadence, with the two largest lifts landing in the weeks ahead of major holidays across every channel.",
        "Campaigns launched 10–14 days before a festival peak consistently outperformed same-content sends outside those windows by a wide margin.",
        "Pre-loading creative and budget against next year's calendar is the clearest planning takeaway from the trailing-year data.",
      ],
    },
  },
  {
    id: 'r5',
    title: 'Churn Risk Watchlist — High-Value Segment',
    fileType: 'PDF',
    time: '5h',
    source: 'custom-agent',
    sourceLabel: 'Churn Risk Agent',
    doc: {
      title: 'Churn Risk Watchlist — High-Value Segment',
      citations: 7,
      summaryHeading: 'Executive summary',
      paragraphs: [
        "The retention agent flagged <strong>1,940 high-value customers</strong> trending toward churn — a 22% jump over last month, concentrated in accounts that have gone quiet after a strong first quarter.",
        "The clearest early signal is a drop in open rate paired with zero site visits over 14 days; this pair predicts churn far better than either signal alone.",
        "A targeted win-back with a personalised incentive to the top decile is the recommended next step, with the agent estimating a 6–9% save rate on contacted accounts.",
      ],
    },
  },
  {
    id: 'r6',
    title: 'Weekly Deliverability Digest',
    fileType: 'DOC',
    time: '2d',
    source: 'scheduled',
    sourceLabel: 'Weekly digest',
    doc: {
      title: 'Weekly Deliverability Digest',
      citations: 4,
      summaryHeading: 'Executive summary',
      paragraphs: [
        "Deliverability held at <strong>98.4% across all channels</strong> this week, steady with the trailing four-week average and comfortably above the 95% target.",
        "One sending domain dipped briefly on Wednesday after a spike in soft bounces; it self-recovered within the day and needs no action.",
        "Inbox placement remains strong on the primary provider, so there is headroom to scale the top-performing segment without deliverability risk.",
      ],
    },
  },
];
