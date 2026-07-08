export type CampaignStatus =
  | "SENT"
  | "IN-PROCESS"
  | "SCHEDULED"
  | "DRAFT"
  | "SUSPENDED"
  | "FAILED";

export type ChannelIcon = "mail" | "mail-ai" | "doc";

export interface Campaign {
  id: string;
  name: string;
  refId: string;
  status: CampaignStatus;
  channel: ChannelIcon;
  scheduledTime: string;
  published: string;
  sent: string;
  deliveredOpened: string;
  submission: string;
  clicked: string;
  conversions: string;
  expandable?: boolean; // shows a chevron instead of the kebab menu
  highlighted?: boolean; // subtle selected/hover row tint
}

const D = "--";

export const campaigns: Campaign[] = [
  {
    id: "1",
    name: "Cart_Abandonment_Twice",
    refId: "ID - 123",
    status: "SENT",
    channel: "mail",
    scheduledTime: "Jul 03, 2021 01:08 PM",
    published: "10,000,000",
    sent: "10,000,000",
    deliveredOpened: "2,000,000",
    submission: D,
    clicked: "12,000",
    conversions: "6,000",
    highlighted: true,
  },
  {
    id: "2",
    name: "Cart_Abandonment_Twice",
    refId: "ID - 123",
    status: "IN-PROCESS",
    channel: "mail-ai",
    scheduledTime: "Apr 06, 2021 12:06 PM",
    published: "100,000",
    sent: "80,000",
    deliveredOpened: "50,000",
    submission: "50,000",
    clicked: "6,000",
    conversions: "2,500",
    expandable: true,
  },
  {
    id: "3",
    name: "Cart_Abandonment_Twice",
    refId: "ID - 123",
    status: "SCHEDULED",
    channel: "mail",
    scheduledTime: "Apr 02, 2021 12:06 PM",
    published: "60,000",
    sent: "4,000",
    deliveredOpened: "5,000",
    submission: "50,000",
    clicked: "3,000",
    conversions: "500",
  },
  {
    id: "4",
    name: "Cart_Abandonment_Twice",
    refId: "ID - 123",
    status: "DRAFT",
    channel: "mail-ai",
    scheduledTime: D,
    published: D,
    sent: D,
    deliveredOpened: D,
    submission: "50,000",
    clicked: D,
    conversions: D,
  },
  {
    id: "5",
    name: "Cart_Abandonment_Twice",
    refId: "ID - 123",
    status: "IN-PROCESS",
    channel: "mail",
    scheduledTime: "Apr 06, 2021 12:06 PM",
    published: "10,000,000",
    sent: "10,000,000",
    deliveredOpened: "2,000,000",
    submission: "2,000,000",
    clicked: "12,000",
    conversions: "6,000",
    expandable: true,
  },
  {
    id: "6",
    name: "Cart_Abandonment_Twice",
    refId: "ID - 123",
    status: "IN-PROCESS",
    channel: "doc",
    scheduledTime: "Apr 06, 2021 12:06 PM",
    published: "25,000,000",
    sent: "25,000,000",
    deliveredOpened: "15,000,000",
    submission: "15,000,000",
    clicked: "1,200,000",
    conversions: "120,000",
  },
  {
    id: "7",
    name: "Cart_Abandonment_Twice",
    refId: "ID - 123",
    status: "SENT",
    channel: "mail",
    scheduledTime: "Jul 03, 2021 01:08 PM",
    published: "10,000,000",
    sent: "10,000,000",
    deliveredOpened: "2,000,000",
    submission: D,
    clicked: "12,000",
    conversions: "6,000",
  },
  {
    id: "8",
    name: "Cart_Abandonment_Twice",
    refId: "ID - 123",
    status: "SCHEDULED",
    channel: "mail-ai",
    scheduledTime: "Apr 02, 2021 12:06 PM",
    published: "60,000",
    sent: "4,000",
    deliveredOpened: "5,000",
    submission: "50,000",
    clicked: "3,000",
    conversions: "500",
  },
];

export const tabs = [
  { label: "All", count: 39 },
  { label: "Draft", count: 10 },
  { label: "Sent", count: 6 },
  { label: "Schedule", count: 12 },
  { label: "In-process", count: 1 },
  { label: "Suspended", count: 10 },
  { label: "Failed", count: 10 },
];
