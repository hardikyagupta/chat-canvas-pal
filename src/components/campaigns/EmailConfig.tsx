import { useState, type ReactNode } from "react";
import { Check, ChevronDown, Mail, Sparkles, X } from "lucide-react";
import Dropdown from "./Dropdown";
import PersonalizeInput from "./PersonalizeInput";
import type { ActivityAttribute } from "./journeyActivities.data";
import {
  DEFAULT_EMAIL_SETTING,
  EMAIL_DOMAINS,
  EMAIL_NODE_TEMPLATES,
  isEmailValid,
  REPLY_TO_INBOXES,
  type EmailFormat,
  type EmailSetting,
} from "./journeyEmail.data";

/** A labelled, collapsible group of related fields — no card/box, just a
 *  header row (title, one-line description) that's always visible;
 *  clicking it expands/collapses the body below. Sections are told apart
 *  by a single divider line between them (see the parent's `divide-y`),
 *  not a border around each one — same pattern as JourneySettingsDrawer's
 *  own SettingsSection. */
function ConfigSection({
  title,
  description,
  defaultOpen = false,
  children,
}: {
  title: string;
  description?: string;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-start gap-3 py-4 text-left"
      >
        <div className="flex-1">
          <h3 className="font-manrope text-[13.5px] font-bold text-[#17173A]">{title}</h3>
          {description && (
            <p className="mt-0.5 font-manrope text-[12px] text-[#6F6F8D]">{description}</p>
          )}
        </div>
        <ChevronDown
          className={`mt-1 h-4 w-4 shrink-0 text-[#6F6F8D] transition-transform duration-150 ${open ? "rotate-180" : ""}`}
          strokeWidth={2}
        />
      </button>
      {open && <div className="flex flex-col gap-4 pb-4">{children}</div>}
    </div>
  );
}

function FieldLabel({ children, required }: { children: ReactNode; required?: boolean }) {
  return (
    <label className="block font-manrope text-[13px] font-bold text-[#17173A]">
      {children}
      {required && <span className="ml-0.5 text-[#E5484D]">*</span>}
      {!required && <span className="ml-1 font-normal text-[#6F6F8D]">(optional)</span>}
    </label>
  );
}

const textInputClass =
  "mt-2 h-10 w-full rounded-md border border-[#DDE2EE] bg-white px-3 font-manrope text-[13.5px] text-[#17173A] outline-none placeholder:text-[#9494AE] focus:border-[#B9C4DD]";

/**
 * "Email" action node — journey-scoped settings, mirroring the same fields
 * Netcore's own "Action - Send email" node exposes (message name, sender
 * identity, HTML/AMP format, sender email + domain, reply-to inbox,
 * subject/pre-header, template, personalize/tracking toggles). Related
 * fields are clubbed into two collapsible sections (Sender & delivery,
 * Advanced settings) so the always-relevant fields — message name,
 * template, subject — stay visible without the screen turning into one
 * long flat form.
 */
export default function EmailConfig({
  initial,
  onCancel,
  onSave,
  triggerPayloadAttributes,
}: {
  initial?: EmailSetting;
  onCancel: () => void;
  /** Called with the sentence to show on the canvas node, and the raw
   *  setting (so it can be persisted for re-editing later). */
  onSave: (nodeLabel: string, setting: EmailSetting) => void;
  /** This journey's actual trigger activity's payload fields, offered by
   *  every personalize menu here (Sender name/email, Subject, Pre-header)
   *  under "User activity payload". */
  triggerPayloadAttributes?: ActivityAttribute[];
}) {
  const [setting, setSetting] = useState<EmailSetting>(initial ?? DEFAULT_EMAIL_SETTING);

  const valid = isEmailValid(setting);

  return (
    <>
      {/* Header */}
      <div className="flex items-start gap-3 px-6 pt-6">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[#EBD2FF]">
          <Mail className="h-[18px] w-[18px] text-[#9449DF]" strokeWidth={2} />
        </span>
        <div className="flex-1">
          <h2 className="font-manrope text-[16px] font-bold leading-tight text-[#17173A]">Email</h2>
          <p className="mt-1 font-manrope text-[12.5px] text-[#6F6F8D]">
            Pick a template and write what this send says.
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
        <FieldLabel required>Message name</FieldLabel>
        <input
          value={setting.messageName}
          onChange={(e) => setSetting((s) => ({ ...s, messageName: e.target.value }))}
          placeholder="e.g. Cart abandonment — email 1"
          className={textInputClass}
        />

        <div className="mt-2 divide-y divide-[#EBEBF5] border-y border-[#EBEBF5]">
          <ConfigSection
            title="Sender & delivery"
            description="Who this comes from and where replies land."
            defaultOpen
          >
            <div>
              <FieldLabel required>Sender name</FieldLabel>
              <PersonalizeInput
                value={setting.senderName}
                onChange={(v) => setSetting((s) => ({ ...s, senderName: v }))}
                placeholder="Your brand name"
                payloadAttributes={triggerPayloadAttributes}
                className={textInputClass}
              />
            </div>

            <div className="flex items-center gap-5">
              {(["html", "amp"] as EmailFormat[]).map((format) => (
                <label key={format} className="flex cursor-pointer items-center gap-2">
                  <input
                    type="radio"
                    name="email-format"
                    checked={setting.emailFormat === format}
                    onChange={() => setSetting((s) => ({ ...s, emailFormat: format }))}
                    className="h-4 w-4 accent-[#2F68E5]"
                  />
                  <span className="font-manrope text-[13.5px] font-semibold text-[#17173A]">
                    {format === "html" ? "HTML Email" : "AMP Email"}
                  </span>
                </label>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <FieldLabel required>Sender email</FieldLabel>
                <PersonalizeInput
                  value={setting.senderEmail}
                  onChange={(v) => setSetting((s) => ({ ...s, senderEmail: v }))}
                  placeholder="Ex: noreply"
                  payloadAttributes={triggerPayloadAttributes}
                  className={textInputClass}
                />
              </div>
              <div>
                <FieldLabel required>@ Domain</FieldLabel>
                <Dropdown
                  value={setting.senderDomain}
                  options={EMAIL_DOMAINS.map((d) => ({ value: d, label: `@ ${d}` }))}
                  onChange={(v) => setSetting((s) => ({ ...s, senderDomain: v }))}
                  widthClass="mt-2 w-full"
                />
              </div>
            </div>

            <div>
              <FieldLabel>Reply to inbox</FieldLabel>
              <Dropdown
                value={setting.replyToInbox}
                options={REPLY_TO_INBOXES}
                onChange={(v) => setSetting((s) => ({ ...s, replyToInbox: v }))}
                placeholder="Ex: MyInbox"
                widthClass="mt-2 w-full"
              />
            </div>
          </ConfigSection>

          <ConfigSection title="Advanced settings" description="Personalization and tracking for this send.">
            <label className="flex cursor-pointer items-center gap-2.5">
              <input
                type="checkbox"
                checked={setting.personalizeLatestActivity}
                onChange={(e) => setSetting((s) => ({ ...s, personalizeLatestActivity: e.target.checked }))}
                className="h-4 w-4 rounded accent-[#2F68E5]"
              />
              <span className="font-manrope text-[13.5px] text-[#17173A]">Personalize latest activity</span>
            </label>
            <label className="flex cursor-pointer items-center gap-2.5">
              <input
                type="checkbox"
                checked={setting.googleAnalyticsTracking}
                onChange={(e) => setSetting((s) => ({ ...s, googleAnalyticsTracking: e.target.checked }))}
                className="h-4 w-4 rounded accent-[#2F68E5]"
              />
              <span className="font-manrope text-[13.5px] text-[#17173A]">Google analytics tracking</span>
            </label>
          </ConfigSection>
        </div>

        <div className="mt-5">
          <FieldLabel required>Subject</FieldLabel>
          <PersonalizeInput
            value={setting.subject}
            onChange={(v) => setSetting((s) => ({ ...s, subject: v }))}
            placeholder="e.g. You left something in your cart 🛒"
            payloadAttributes={triggerPayloadAttributes}
            className={textInputClass}
          />
        </div>

        <div className="mt-4">
          <FieldLabel>Pre-header</FieldLabel>
          <PersonalizeInput
            value={setting.preheader}
            onChange={(v) => setSetting((s) => ({ ...s, preheader: v }))}
            placeholder="e.g. Complete your order before it's gone"
            payloadAttributes={triggerPayloadAttributes}
            className={textInputClass}
          />
        </div>

        <div className="mt-5">
          <FieldLabel required>Template</FieldLabel>
          <div className="mt-2 grid grid-cols-2 gap-2.5">
            {EMAIL_NODE_TEMPLATES.slice(0, 6).map((t) => {
              const selected = setting.templateId === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setSetting((s) => ({ ...s, templateId: t.id }))}
                  className={`group relative overflow-hidden rounded-lg border text-left transition-colors ${
                    selected ? "border-[#2F68E5] ring-1 ring-[#2F68E5]" : "border-[#DDE2EE] hover:border-[#B9C4DD]"
                  }`}
                >
                  <div className="aspect-[4/3] w-full overflow-hidden bg-[#F4F4F8]">
                    {t.image ? (
                      <img src={t.image} alt="" className="h-full w-full object-cover object-top" />
                    ) : (
                      <div className="grid h-full w-full place-items-center text-[#B9BAC7]">
                        <Mail className="h-5 w-5" strokeWidth={1.5} />
                      </div>
                    )}
                  </div>
                  <div className="flex items-start gap-1 px-2 py-1.5">
                    {t.aiGenerated && <Sparkles className="mt-0.5 h-3 w-3 shrink-0 text-[#9449DF]" strokeWidth={2} />}
                    <p className="line-clamp-2 font-manrope text-[11.5px] font-medium leading-snug text-[#17173A]">
                      {t.name}
                    </p>
                  </div>
                  {selected && (
                    <span className="absolute right-1.5 top-1.5 grid h-5 w-5 place-items-center rounded-full bg-[#2F68E5] text-white">
                      <Check className="h-3 w-3" strokeWidth={3} />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="border-t border-[#EBEBF5]" />

      {/* Footer */}
      <div className="flex items-center justify-end px-6 py-4">
        <button
          type="button"
          disabled={!valid}
          onClick={() => valid && onSave(`Send "${EMAIL_NODE_TEMPLATES.find((t) => t.id === setting.templateId)?.name}"`, setting)}
          className="dc-btn dc-btn-primary"
        >
          Save
        </button>
      </div>
    </>
  );
}
