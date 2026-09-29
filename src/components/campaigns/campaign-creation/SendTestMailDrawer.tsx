import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown, Lightbulb, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";

/** Verified sending domains on the account — kept in sync with the one in
 *  CampaignContentStep's own From row (duplicated rather than imported, to
 *  avoid a circular import between the two files). */
const DOMAINS = ["m3m.in", "mailer.m3m.in", "news.m3m.in", "offers.m3m.in"];

const fieldClass =
  "w-full rounded-md border-0 bg-[#F7F9FC] px-3 py-2.5 font-manrope text-sm text-[#17173A] outline-none transition-colors placeholder:text-[#A0A0A0] focus:bg-[#F0F3F9]";

/** Stand-in for the account's actual send history. */
const RECENTLY_USED_TEST_EMAILS = [
  "tanvi.netcore@gmail.com",
  "nikhilsinghrs5@gmail.com",
  "jeph144@gmail.com",
  "jones.jeyasankar@gmail.com",
];

const MAX_TEST_EMAILS = 10;

function parseEmails(value: string): string[] {
  return value
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean);
}

/** Right-side drawer reached from "Send a test email" — a one-off send that
 *  never touches the campaign draft, so all of its fields live locally. */
export default function SendTestMailDrawer({
  open,
  onClose,
  defaultSubject,
  defaultSenderName,
  defaultDomain,
}: {
  open: boolean;
  onClose: () => void;
  defaultSubject: string;
  defaultSenderName: string;
  defaultDomain: string;
}) {
  const [shown, setShown] = useState(false);
  const [subject, setSubject] = useState(defaultSubject);
  const [senderName, setSenderName] = useState(defaultSenderName);
  const [domain, setDomain] = useState(defaultDomain || DOMAINS[0]);
  const [usePreset, setUsePreset] = useState(false);
  const [emailAddress, setEmailAddress] = useState("");

  useEffect(() => {
    if (!open) {
      setShown(false);
      return;
    }
    setSubject(defaultSubject);
    setSenderName(defaultSenderName);
    setDomain(defaultDomain || DOMAINS[0]);
    setUsePreset(false);
    setEmailAddress("");
    const id = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(id);
    // Only reset from the campaign's current values the moment the drawer
    // opens — not on every keystroke made to those fields afterwards.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  const addRecentEmail = (email: string) => {
    const emails = parseEmails(emailAddress);
    if (emails.includes(email) || emails.length >= MAX_TEST_EMAILS) return;
    setEmailAddress(emails.length ? `${emailAddress}, ${email}` : email);
  };

  const canSend = subject.trim() && senderName.trim() && domain && parseEmails(emailAddress).length > 0;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex justify-end">
      <div
        className={cn(
          "absolute inset-0 bg-black/40 transition-opacity duration-300",
          shown ? "opacity-100" : "opacity-0"
        )}
        onClick={onClose}
      />
      <div
        className={cn(
          "relative flex h-full w-full max-w-[560px] flex-col bg-white shadow-[-20px_0_60px_rgba(23,23,58,0.15)] transition-transform duration-300 ease-out",
          shown ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="flex items-center justify-between border-b border-[#DDE2EE] px-6 py-5">
          <h2 className="font-manrope text-xl font-bold text-[#17173A]">Send test mail</h2>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="grid size-8 shrink-0 place-items-center rounded-full text-[#8A8AA3] transition-colors hover:bg-[#F0F3F9] hover:text-[#17173A]"
          >
            <X className="size-5" strokeWidth={2} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          <div className="rounded-lg border border-[#DDE2EE] p-5">
            <label className="mb-1.5 flex items-center gap-1 font-manrope text-sm font-semibold text-[#17173A]">
              Subject
              <span className="text-[#FC5E02]">*</span>
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="for ex: Get an extra 20% off your next purchase"
              className={fieldClass}
            />

            <div className="mt-5 grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 flex items-center gap-1 font-manrope text-sm font-semibold text-[#17173A]">
                  Sender email
                  <span className="text-[#FC5E02]">*</span>
                </label>
                <input
                  type="text"
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                  placeholder="for ex: promotions"
                  className={fieldClass}
                />
              </div>
              <div>
                <label className="mb-1.5 flex items-center gap-1 font-manrope text-sm font-semibold text-[#17173A]">
                  Domain
                  <span className="text-[#FC5E02]">*</span>
                </label>
                <div className="relative">
                  <select
                    value={domain}
                    onChange={(e) => setDomain(e.target.value)}
                    className={cn(fieldClass, "appearance-none pr-8")}
                  >
                    {DOMAINS.map((d) => (
                      <option key={d} value={d}>{`@${d}`}</option>
                    ))}
                  </select>
                  <ChevronDown
                    className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-[#8A8AA3]"
                    strokeWidth={2}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-5 rounded-lg border border-[#DDE2EE] p-5">
            <label className="flex items-center gap-2.5">
              <button
                type="button"
                role="checkbox"
                aria-checked={usePreset}
                onClick={() => setUsePreset((v) => !v)}
                className={cn(
                  "grid size-[18px] shrink-0 place-items-center rounded border-2 transition-colors",
                  usePreset ? "border-[#2F68E5] bg-[#2F68E5]" : "border-[#C3CAD9] bg-white"
                )}
              >
                {usePreset && (
                  <svg viewBox="0 0 12 12" className="size-2.5 text-white" fill="none">
                    <path
                      d="M2.5 6.2 4.8 8.5 9.5 3.8"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </button>
              <span className="font-manrope text-sm text-[#17173A]">Use preset test email addresses</span>
            </label>

            <label className="mb-1.5 mt-5 flex items-center gap-1 font-manrope text-sm font-semibold text-[#17173A]">
              Email address
              <span className="text-[#FC5E02]">*</span>
            </label>
            <textarea
              value={emailAddress}
              onChange={(e) => setEmailAddress(e.target.value)}
              placeholder="for ex: john.doe@gmail.com"
              rows={4}
              className={cn(fieldClass, "resize-none")}
            />
            <p className="mt-3 font-manrope text-xs leading-[18px] text-[#8A8AA3]">
              Note: You can add upto {MAX_TEST_EMAILS} email addresses seperated by commas. Test emails
              are excluded from billing.
            </p>

            <div className="my-4 border-t border-[#EEF1F7]" />

            <p className="mb-3 font-manrope text-sm font-bold text-[#17173A]">Recently used</p>
            <div className="grid grid-cols-2 gap-2.5">
              {RECENTLY_USED_TEST_EMAILS.map((email) => (
                <button
                  key={email}
                  type="button"
                  onClick={() => addRecentEmail(email)}
                  className="flex items-center justify-between gap-2 rounded-full border border-[#DDE2EE] bg-white py-1.5 pl-3.5 pr-2.5 font-manrope text-sm text-[#17173A] transition-colors hover:border-[#2F68E5] hover:bg-[#F4F8FF]"
                >
                  <span className="truncate">{email}</span>
                  <Plus className="size-4 shrink-0 text-[#6F6F8D]" strokeWidth={2.2} />
                </button>
              ))}
            </div>
          </div>

          <div className="mt-5 rounded-lg border border-[#DDE2EE] p-5">
            <div className="flex items-center gap-2">
              <Lightbulb className="size-4 shrink-0 text-[#F5A623]" strokeWidth={2} />
              <p className="font-manrope text-sm font-bold text-[#17173A]">
                Points to remember while testing your email
              </p>
            </div>
            <ul className="mt-3 space-y-2">
              <li className="flex items-start gap-2">
                <Check className="mt-0.5 size-4 shrink-0 text-[#00C48C]" strokeWidth={2.6} />
                <span className="font-manrope text-sm text-[#17173A]">
                  Test emails bypass blacklist/suppression rules, unlike live campaigns.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="mt-0.5 size-4 shrink-0 text-[#00C48C]" strokeWidth={2.6} />
                <span className="font-manrope text-sm text-[#17173A]">
                  If the entered email ID is not present in the contact master, a non-personalized
                  email is sent.
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-[#DDE2EE] px-6 py-4">
          <button
            type="button"
            disabled={!canSend}
            onClick={onClose}
            className="dc-btn dc-btn-primary"
          >
            Send test
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
