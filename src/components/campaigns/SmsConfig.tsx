import { useState } from "react";
import { MessageSquare, X } from "lucide-react";
import { DEFAULT_SMS_SETTING, isSmsValid, SMS_CHARACTER_LIMIT, SMS_QUICK_TEMPLATES, type SmsSetting } from "./journeySms.data";

/**
 * "SMS" action node — message body plus sender ID. Quick-insert chips fill
 * the message field the same way the journey-creation landing page's "Try
 * these examples" pills fill the AI prompt box, rather than a separate
 * picker pattern.
 */
export default function SmsConfig({
  initial,
  onCancel,
  onSave,
}: {
  initial?: SmsSetting;
  onCancel: () => void;
  /** Called with the sentence to show on the canvas node, and the raw
   *  setting (so it can be persisted for re-editing later). */
  onSave: (nodeLabel: string, setting: SmsSetting) => void;
}) {
  const [setting, setSetting] = useState<SmsSetting>(initial ?? DEFAULT_SMS_SETTING);

  const valid = isSmsValid(setting);
  const overLimit = setting.message.length > SMS_CHARACTER_LIMIT;

  return (
    <>
      {/* Header */}
      <div className="flex items-start gap-3 px-6 pt-6">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[#EBD2FF]">
          <MessageSquare className="h-[18px] w-[18px] text-[#9449DF]" strokeWidth={2} />
        </span>
        <div className="flex-1">
          <h2 className="font-manrope text-[16px] font-bold leading-tight text-[#17173A]">SMS</h2>
          <p className="mt-1 font-manrope text-[12.5px] text-[#6F6F8D]">
            Write the message this step sends.
          </p>
        </div>
        <button
          type="button"
          aria-label="Close"
          onClick={onCancel}
          className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center text-[#6F6F8D] transition-colors hover:text-[#17173A]"
        >
          <X className="h-5 w-5" strokeWidth={2} />
        </button>
      </div>

      <div className="mt-3 border-t border-[#EBEBF5]" />

      {/* Body */}
      <div className="scroll-slim min-h-0 flex-1 overflow-y-auto px-5 py-4">
        <label className="block font-manrope text-[13.5px] font-medium text-[#6F6F8D]">Quick templates</label>
        <div className="mt-2 flex flex-wrap gap-2">
          {SMS_QUICK_TEMPLATES.map((t) => (
            <button
              key={t.label}
              type="button"
              onClick={() => setSetting((s) => ({ ...s, message: t.message }))}
              className="rounded-full bg-[#F4F4F8] px-3 py-1.5 font-manrope text-[12.5px] text-[#17173A] transition-colors hover:bg-[#EAF1FF]"
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="mt-4">
          <label className="block font-manrope text-[13.5px] font-bold text-[#17173A]">Message</label>
          <textarea
            value={setting.message}
            onChange={(e) => setSetting((s) => ({ ...s, message: e.target.value }))}
            placeholder="e.g. Hi {first_name}, you left items in your cart. Complete your order: {cart_link}"
            rows={4}
            className="mt-2 w-full resize-none rounded-md border border-[#DDE2EE] bg-white px-3 py-2.5 font-manrope text-[13.5px] text-[#17173A] outline-none placeholder:text-[#9494AE] focus:border-[#B9C4DD]"
          />
          <p className={`mt-1.5 font-manrope text-[11.5px] ${overLimit ? "text-[#D92D20]" : "text-[#6F6F8D]"}`}>
            {setting.message.length}/{SMS_CHARACTER_LIMIT} characters
            {overLimit ? " — this will send as multiple segments" : ""}
          </p>
        </div>

        <div className="mt-4">
          <label className="block font-manrope text-[13.5px] font-bold text-[#17173A]">
            Sender ID <span className="font-normal text-[#6F6F8D]">(optional)</span>
          </label>
          <input
            value={setting.senderId}
            onChange={(e) => setSetting((s) => ({ ...s, senderId: e.target.value }))}
            placeholder="e.g. BRAND"
            className="mt-2 h-10 w-full rounded-md border border-[#DDE2EE] bg-white px-3 font-manrope text-[13.5px] text-[#17173A] outline-none placeholder:text-[#9494AE] focus:border-[#B9C4DD]"
          />
        </div>
      </div>

      <div className="border-t border-[#EBEBF5]" />

      {/* Footer */}
      <div className="flex items-center justify-end px-6 py-4">
        <button
          type="button"
          disabled={!valid}
          onClick={() => valid && onSave(setting.message.length > 40 ? `Send "${setting.message.slice(0, 40)}…"` : `Send "${setting.message}"`, setting)}
          className="dc-btn dc-btn-primary"
        >
          Save
        </button>
      </div>
    </>
  );
}
