export type JourneyStatus = "DRAFT" | "SCHEDULED" | "STOPPED" | "COMPLETED";

export interface Journey {
  id: string;
  name: string;
  status: JourneyStatus;
  journeyId: string;
  startEnd: string;
  lastEdited: string;
  sent: string;
  delivered: string;
  openedRead: string;
  openedRead2: string;
  /** Marks a journey that was built via the "Create with AI" flow. */
  generatedByAI?: boolean;
}

const D = "--";

export const journeys: Journey[] = [
  {
    id: "1",
    name: "Welcome_Series_Onboarding",
    status: "COMPLETED",
    journeyId: "3841",
    startEnd: "Oct 12, 2025 09:00 AM - Oct 26, 2025 09:00 AM",
    lastEdited: "Oct 10, 2025 04:15 PM",
    sent: "82,400",
    delivered: "79,120",
    openedRead: "41,860",
    openedRead2: "18,230",
  },
  {
    id: "2",
    name: "Cart_Abandonment_Recovery",
    status: "COMPLETED",
    journeyId: "3812",
    startEnd: "Sep 01, 2025 12:00 AM - Sep 30, 2025 11:59 PM",
    lastEdited: "Aug 29, 2025 02:40 PM",
    sent: "54,900",
    delivered: "53,110",
    openedRead: "27,004",
    openedRead2: "9,845",
  },
  {
    id: "3",
    name: "VIP_Loyalty_Nurture",
    status: "STOPPED",
    journeyId: "3790",
    startEnd: "Jul 15, 2025 08:00 AM - Never Ending",
    lastEdited: "Nov 02, 2025 11:05 AM",
    sent: "12,300",
    delivered: "11,940",
    openedRead: "6,512",
    openedRead2: "2,201",
  },
  {
    id: "4",
    name: "Win_Back_Inactive_Users",
    status: "SCHEDULED",
    journeyId: "3925",
    startEnd: "Dec 10, 2025 06:00 AM - Dec 24, 2025 06:00 AM",
    lastEdited: "Dec 04, 2025 12:08 PM",
    sent: D,
    delivered: D,
    openedRead: D,
    openedRead2: D,
  },
  {
    id: "5",
    name: "Post_Purchase_Upsell",
    status: "DRAFT",
    journeyId: "3931",
    startEnd: D,
    lastEdited: "Dec 06, 2025 03:22 PM",
    sent: D,
    delivered: D,
    openedRead: D,
    openedRead2: D,
  },
  {
    id: "6",
    name: "Browse_Abandonment_Retarget",
    status: "DRAFT",
    journeyId: "3928",
    startEnd: D,
    lastEdited: "Dec 05, 2025 10:47 AM",
    sent: D,
    delivered: D,
    openedRead: D,
    openedRead2: D,
  },
  {
    id: "7",
    name: "Birthday_Offer_Journey",
    status: "SCHEDULED",
    journeyId: "3940",
    startEnd: "Jan 01, 2026 12:00 AM - Jan 31, 2026 11:59 PM",
    lastEdited: "Dec 08, 2025 09:15 AM",
    sent: D,
    delivered: D,
    openedRead: D,
    openedRead2: D,
  },
  {
    id: "8",
    name: "Re_engagement_Dormant_Users",
    status: "COMPLETED",
    journeyId: "3865",
    startEnd: "Nov 01, 2025 07:00 AM - Nov 15, 2025 07:00 AM",
    lastEdited: "Nov 16, 2025 09:30 AM",
    sent: "38,700",
    delivered: "37,220",
    openedRead: "19,455",
    openedRead2: "7,308",
  },
];

export const journeyTabs = [
  { label: "All", count: 8 },
  { label: "Draft", count: 2 },
  { label: "Scheduled", count: 2 },
  { label: "Stopped", count: 1 },
  { label: "Completed", count: 3 },
];
