export const SMS_CATEGORIES = [
  "Promotions",
  "Cart recovery",
  "Order updates",
  "Delivery alerts",
  "Payment reminders",
  "Authentication",
  "Feedback & surveys",
] as const;

/** Starts as the seeded list; new templates can introduce categories of their own. */
export type SmsCategory = string;

export const DLT_TEMPLATE_TYPES = [
  "Service Explicit",
  "Service Implicit",
  "Promotional",
  "Transactional",
] as const;

export type DltTemplateType = (typeof DLT_TEMPLATE_TYPES)[number];

export interface SmsTemplate {
  id: number;
  name: string;
  /** Registered DLT template ID — what the operator checks the send against. */
  dltId: string;
  category: SmsCategory;
  dltType?: DltTemplateType;
  /** {#var#} marks a value filled in per recipient at send time. */
  body: string;
  /** Liquid expression each {{n}} in the body is filled from. */
  /** Mapping per variable slot: "1" for {{1}}, "#1" for the first DLT tag, … (see variableSlots). */
  variables?: Record<string, string>;
}

export const smsTemplates: SmsTemplate[] = [
  {
    id: 104,
    name: "Flash sale — 30% off",
    dltType: "Promotional",
    dltId: "1107171884520193",
    category: "Promotions",
    body: "FLASH SALE! Flat 30% off on all candles and diffusers till midnight. Use code GLOW30 at checkout. Shop now: {#var#} T&C apply.",
  },
  {
    id: 103,
    name: "Cart reminder",
    dltType: "Service Implicit",
    dltId: "1107171884520187",
    category: "Cart recovery",
    body: "Hi {#var#}, you left something in your cart. Complete your order today and get free shipping above Rs.999. Pick up where you left off: {#var#}",
  },
  {
    id: 102,
    name: "Order confirmed",
    dltType: "Transactional",
    dltId: "1107171884520164",
    category: "Order updates",
    body: "Hi {#var#}, your order #{#var#} is confirmed and will reach you by {#var#}. Track your package here: {#var#} - Bloomwood",
  },
  {
    id: 101,
    name: "Login OTP",
    dltType: "Service Explicit",
    dltId: "1107171884520142",
    category: "Authentication",
    body: "{#var#} is your one-time password for Bloomwood. It is valid for 10 minutes. Please do not share this code with anyone.",
  },
];

/** DLT reserves 30 characters for every variable — {{n}} or a DLT tag — whatever it ends up holding. */
export const DLT_VAR_LENGTH = 30;

/** DLT placeholder tags (with their short aliases) that stand for a value filled in per recipient. */
export const DLT_TAGS = [
  "var",
  "numeric",
  "num",
  "number",
  "alphanumeric",
  "alp",
  "url",
  "urg",
  "urlott",
  "uro",
  "cbn",
  "email",
  "eml",
] as const;

/** Matches one variable in a message: a numbered {{n}} (group 1) or a DLT tag (group 2). */
const variableTokenRe = () => new RegExp(`\\{\\{(\\d+)\\}\\}|\\{#(${DLT_TAGS.join("|")})#\\}`, "g");

/** Every variable token in the text, in order. */
export function variableTokens(text: string): string[] {
  return text.match(variableTokenRe()) ?? [];
}

export interface VariableSlot {
  /** Key of its mapping: "1" for {{1}}, "#1" for the first DLT tag in the text, "#2" for the next, … */
  key: string;
  /** The token as typed, e.g. "{{1}}" or "{#numeric#}". */
  token: string;
  /** Row label — the token, numbered when the same tag appears more than once. */
  label: string;
}

/**
 * The variables a message contains, in the order they appear: one slot per distinct {{n}}
 * and one per DLT-tag occurrence. Each slot gets a row to map to a value.
 */
export function variableSlots(body: string): VariableSlot[] {
  const slots: VariableSlot[] = [];
  const seenNumbers = new Set<string>();
  const tagTotals: Record<string, number> = {};
  for (const m of body.matchAll(variableTokenRe())) if (m[2]) tagTotals[m[2]] = (tagTotals[m[2]] ?? 0) + 1;
  const tagSeen: Record<string, number> = {};
  let tagOrdinal = 0;
  for (const m of body.matchAll(variableTokenRe())) {
    if (m[1] !== undefined) {
      if (seenNumbers.has(m[1])) continue;
      seenNumbers.add(m[1]);
      slots.push({ key: m[1], token: m[0], label: m[0] });
    } else {
      tagOrdinal++;
      tagSeen[m[2]] = (tagSeen[m[2]] ?? 0) + 1;
      slots.push({
        key: `#${tagOrdinal}`,
        token: m[0],
        label: tagTotals[m[2]] > 1 ? `${m[0]} (${tagSeen[m[2]]})` : m[0],
      });
    }
  }
  return slots;
}

/** Billable length of a template body, with each variable counted at its DLT size. */
export function smsLength(body: string): number {
  let length = body.length;
  for (const v of variableTokens(body)) length += DLT_VAR_LENGTH - v.length;
  return length;
}

/** Single-part SMS holds 160 characters; concatenated parts carry 153 each. */
export function smsParts(length: number): number {
  return length <= 160 ? 1 : Math.ceil(length / 153);
}
