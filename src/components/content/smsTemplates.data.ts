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
  variables?: Record<number, string>;
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

/** DLT reserves 30 characters for every {#var#} (or {{n}}), whatever it ends up holding. */
export const DLT_VAR_LENGTH = 30;

/** Billable length of a template body, with each {#var#} counted at its DLT size. */
export function smsLength(body: string): number {
  let length = body.length;
  for (const v of body.match(/\{#var#\}|\{\{\d+\}\}/g) ?? []) length += DLT_VAR_LENGTH - v.length;
  return length;
}

/** Single-part SMS holds 160 characters; concatenated parts carry 153 each. */
export function smsParts(length: number): number {
  return length <= 160 ? 1 : Math.ceil(length / 153);
}

/**
 * Seeded bodies mark per-recipient values with DLT's {#var#}; the editor works in
 * numbered {{n}} variables (each mapped to liquid), so opening one for editing
 * renumbers its {#var#}s after any {{n}} it already has.
 */
export function toNumberedVariables(body: string): string {
  let n = Math.max(0, ...[...body.matchAll(/\{\{(\d+)\}\}/g)].map((m) => Number(m[1])));
  return body.replace(/\{#var#\}/g, () => `{{${++n}}}`);
}
