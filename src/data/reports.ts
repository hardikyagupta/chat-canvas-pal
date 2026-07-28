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

export interface ReportItem {
  id: string;
  title: string;
  fileType: 'PDF' | 'DOC';
  /** Relative "generated" time, e.g. "2h", "3d". */
  time: string;
  doc: ReportDoc;
}

export const generatedReports: ReportItem[] = [
  {
    id: 'r1',
    title: 'WhatsApp Channel Performance — This Quarter',
    fileType: 'PDF',
    time: '2h',
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
];
