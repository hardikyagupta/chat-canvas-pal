/**
 * "SMS" action node — a lightweight settings screen: message body (with a
 * few cart-abandonment-relevant quick-insert presets, the same
 * "tap a chip to fill the field" pattern already used for the AI examples on
 * the journey-creation landing page) and a sender ID, not a full DLT/template
 * management screen.
 */

export const SMS_QUICK_TEMPLATES: { label: string; message: string }[] = [
  {
    label: "Cart reminder",
    message: "Hi {first_name}, you left items in your cart. Complete your order: {cart_link}",
  },
  {
    label: "Discount nudge",
    message: "Still deciding? Use code SAVE10 for 10% off the items in your cart: {cart_link}",
  },
  {
    label: "Last chance",
    message: "Your cart expires soon! Grab your items before they're gone: {cart_link}",
  },
];

export const SMS_CHARACTER_LIMIT = 160;

export interface SmsSetting {
  message: string;
  senderId: string;
}

export const DEFAULT_SMS_SETTING: SmsSetting = { message: "", senderId: "" };

export function isSmsValid(s: SmsSetting): boolean {
  return s.message.trim() !== "";
}

/** The sentence shown on the canvas node once saved, e.g. "Send 'Hi
 *  {first_name}, you left items…'". */
export function describeSms(s: SmsSetting): string {
  const trimmed = s.message.trim();
  if (!trimmed) return "Send an SMS";
  return trimmed.length > 40 ? `Send "${trimmed.slice(0, 40)}…"` : `Send "${trimmed}"`;
}
