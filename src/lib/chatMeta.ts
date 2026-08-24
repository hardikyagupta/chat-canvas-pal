// Byline helpers for chat history rows — "Amit Sharma • 24 August 2026, 01:12 PM".
//
// The prototype stores only a coarse relative label on each chat ('now', '2h',
// '6d', '1w'), so the absolute timestamp shown in the history list is derived
// back from that label. Real data can skip the derivation by setting
// `LhsChatItem.timestamp` to an ISO string.

/** Signed-in user — chats are attributed to them unless the row says otherwise. */
export const CURRENT_USER_NAME = 'Amit Sharma';

// 'mo' must be tested before 'm' — otherwise "1mo" parses as one minute.
const UNIT_MS: Record<string, number> = {
  mo: 2_592_000_000, // 30d
  y: 31_536_000_000, // 365d
  m: 60_000,
  h: 3_600_000,
  d: 86_400_000,
  w: 604_800_000,
};

/**
 * Turns a relative label ('2h', '6d', '1mo', 'now') into the millisecond offset
 * it sits behind `now`. Returns 0 for 'now' and for anything unparseable, so an
 * unknown label degrades to "just now" rather than to an invalid date.
 */
export const relativeLabelToOffsetMs = (label: string): number => {
  const match = /^(\d+)\s*(mo|[mhdwy])$/i.exec(label.trim());
  if (!match) return 0;
  return Number(match[1]) * (UNIT_MS[match[2].toLowerCase()] ?? 0);
};

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/** "24 August 2026, 01:12 PM" — 12-hour clock, zero-padded hour. */
export const formatChatTimestamp = (date: Date): string => {
  const hours24 = date.getHours();
  const meridiem = hours24 < 12 ? 'AM' : 'PM';
  const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
  const hh = String(hours12).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  return `${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}, ${hh}:${mm} ${meridiem}`;
};

/**
 * Absolute timestamp for a chat row: the stored ISO value when present,
 * otherwise `now` walked back by the row's relative label.
 */
export const chatTimestamp = (
  chat: { time: string; timestamp?: string },
  now: Date,
): string => {
  if (chat.timestamp) {
    const parsed = new Date(chat.timestamp);
    if (!Number.isNaN(parsed.getTime())) return formatChatTimestamp(parsed);
  }
  return formatChatTimestamp(new Date(now.getTime() - relativeLabelToOffsetMs(chat.time)));
};
