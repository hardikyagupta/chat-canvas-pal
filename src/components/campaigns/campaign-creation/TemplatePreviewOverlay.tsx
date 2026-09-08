import { useMemo, useState } from "react";
import { Check, Monitor, Search, Smartphone, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { TemplateThumbnail } from "./TemplateCard";
import type { EmailTemplate } from "./emailTemplates.data";

interface PreviewProfile {
  email: string;
  mobile: string;
  city: string;
  productPreference: string;
  productAffinity: string;
}

/** Stand-in contact records to preview against — real profile search has
 *  nothing to query yet, so this is a small fixed list rather than a live
 *  lookup. The same email can carry more than one row (different product
 *  signals on file), same as the underlying contact table would. */
const PREVIEW_PROFILES: PreviewProfile[] = [
  {
    email: "amit.sharma@netcore.com",
    mobile: "98220011234",
    city: "Mumbai",
    productPreference: "Face wash",
    productAffinity: "High",
  },
  {
    email: "dharam.dhoke@gmail.com",
    mobile: "91234567890",
    city: "Pune",
    productPreference: "Body lotion",
    productAffinity: "Medium",
  },
  {
    email: "nikunj0202@hotmail.com",
    mobile: "99876543210",
    city: "Ahmedabad",
    productPreference: "Sunscreen",
    productAffinity: "Low",
  },
  {
    email: "sarah@gmail.com",
    mobile: "98765432109",
    city: "Mumbai",
    productPreference: "Face wash",
    productAffinity: "High",
  },
  {
    email: "sarah@gmail.com",
    mobile: "98765432109",
    city: "Mumbai",
    productPreference: "Face cream",
    productAffinity: "Medium",
  },
];

const rowKey = (p: PreviewProfile, i: number) => `${p.email}-${p.productPreference}-${i}`;

/**
 * "Preview mode" — a large centered overlay (not full-bleed) with the
 * rendered email on the left at the picked device width, and on the right
 * who it's being previewed as. Opened from the template panel's "Preview"
 * button; closing it returns to the step exactly where it was, since
 * nothing here writes back to the campaign.
 */
export default function TemplatePreviewOverlay({
  template,
  onClose,
}: {
  template: EmailTemplate | null;
  onClose: () => void;
}) {
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const [query, setQuery] = useState("");
  // Set once a suggested email is clicked — that's what reveals the record
  // table below. Typing again (see the input's onChange) clears it, so the
  // plain suggestion list comes back instead of the table.
  const [activeEmail, setActiveEmail] = useState<string | null>(null);
  const [selected, setSelected] = useState<PreviewProfile>(PREVIEW_PROFILES[0]);

  // One suggestion per distinct email — the table can hold more than one
  // record for the same address, but the picker shouldn't show duplicates.
  const suggestionEmails = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const seen = new Set<string>();
    const out: string[] = [];
    for (const p of PREVIEW_PROFILES) {
      if (p.email.toLowerCase().includes(q) && !seen.has(p.email)) {
        seen.add(p.email);
        out.push(p.email);
      }
    }
    return out;
  }, [query]);

  const activeRows = useMemo(
    () => (activeEmail ? PREVIEW_PROFILES.filter((p) => p.email === activeEmail) : []),
    [activeEmail]
  );

  // Picking a row just updates "Previewing as" — the table stays open so the
  // pick is visible against its neighbours instead of vanishing immediately.
  const pickProfile = (p: PreviewProfile) => {
    setSelected(p);
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-[#17173A]/50 pt-[5vh]"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex h-full w-full flex-col overflow-hidden rounded-2xl bg-white shadow-[0_24px_64px_rgba(23,23,58,0.35)]"
      >
        <header className="flex h-14 shrink-0 items-center gap-3 border-b border-[#DDE2EE] px-6">
          <p className="font-manrope text-base font-bold text-[#17173A]">Preview mode</p>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close preview"
            className="ml-auto grid size-8 shrink-0 place-items-center rounded text-[#17173A] transition-colors hover:bg-[#F0F3F9]"
          >
            <X className="size-5" strokeWidth={2.2} />
          </button>
        </header>

        <div className="flex min-h-0 flex-1">
          <div className="scroll-slim flex min-h-0 flex-1 flex-col items-center overflow-y-auto px-8 py-8">
            <div className="mb-6 flex items-center gap-1 rounded-md border border-[#DDE2EE] bg-white p-1">
              <button
                type="button"
                aria-label="Desktop preview"
                aria-pressed={device === "desktop"}
                onClick={() => setDevice("desktop")}
                className={cn(
                  "grid size-8 place-items-center rounded-md transition-colors",
                  device === "desktop"
                    ? "bg-[#F0F3F9] text-[#17173A]"
                    : "text-[#8A8AA3] hover:text-[#17173A]"
                )}
              >
                <Monitor className="size-4" strokeWidth={2} />
              </button>
              <button
                type="button"
                aria-label="Mobile preview"
                aria-pressed={device === "mobile"}
                onClick={() => setDevice("mobile")}
                className={cn(
                  "grid size-8 place-items-center rounded-md transition-colors",
                  device === "mobile"
                    ? "bg-[#F0F3F9] text-[#17173A]"
                    : "text-[#8A8AA3] hover:text-[#17173A]"
                )}
              >
                <Smartphone className="size-4" strokeWidth={2} />
              </button>
            </div>

            <div
              className={cn(
                "overflow-hidden rounded-lg border border-[#DDE2EE] bg-white shadow-[0_8px_24px_rgba(23,23,58,0.08)] transition-all duration-300 ease-in-out",
                device === "desktop" ? "w-[720px]" : "w-[380px]"
              )}
            >
              <div className="h-9 border-b border-[#EEF1F7] bg-[#F7F9FC]" />
              <div
                className={cn(
                  "overflow-y-auto bg-white transition-all duration-300 ease-in-out",
                  device === "desktop" ? "h-[560px]" : "h-[640px]"
                )}
              >
                {!template ? (
                  <div className="grid h-full place-items-center font-manrope text-sm text-[#6F6F8D]">
                    Template not found.
                  </div>
                ) : template.image ? (
                  <img src={template.image} alt="" className="block h-auto w-full" />
                ) : (
                  <TemplateThumbnail kind={template.preview} />
                )}
              </div>
            </div>
          </div>

          <aside className="scroll-slim w-[640px] shrink-0 overflow-y-auto border-l border-[#DDE2EE] px-6 py-6">
            <h2 className="font-manrope text-sm font-bold text-[#17173A]">
              Select a profile for the preview
            </h2>

            <div className="relative mt-3">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#8A8AA3]"
                strokeWidth={2}
              />
              <input
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setActiveEmail(null);
                }}
                placeholder="Search profiles"
                aria-label="Search profiles"
                className="h-10 w-full rounded-md border border-[#DDE2EE] bg-white pl-9 pr-3 font-manrope text-sm text-[#17173A] outline-none transition-colors placeholder:text-[#A0A0A0] focus:border-[#2F68E5]"
              />
            </div>

            {/* Step 1 — a plain suggestion per distinct email, while typing. */}
            {query.trim() && !activeEmail && (
              <div className="mt-2 overflow-hidden rounded-md border border-[#DDE2EE] bg-white shadow-[0_8px_24px_rgba(23,23,58,0.08)]">
                {suggestionEmails.length === 0 ? (
                  <p className="px-3 py-2.5 font-manrope text-sm text-[#6F6F8D]">
                    No profiles match “{query}”.
                  </p>
                ) : (
                  suggestionEmails.map((email) => (
                    <button
                      key={email}
                      type="button"
                      onClick={() => {
                        setActiveEmail(email);
                        setQuery(email);
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2.5 text-left font-manrope text-sm text-[#17173A] transition-colors hover:bg-[#F7F9FC]"
                    >
                      <Search className="size-3.5 shrink-0 text-[#8A8AA3]" strokeWidth={2} />
                      {email}
                    </button>
                  ))
                )}
              </div>
            )}

            {/* Step 2 — picking a suggestion reveals every record on file for
                that email, so the right one can be picked by its attributes. */}
            {activeEmail && (
              <div className="mt-2 overflow-hidden rounded-md border border-[#DDE2EE] shadow-[0_8px_24px_rgba(23,23,58,0.08)]">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-[#DDE2EE] bg-[#F7F9FC]">
                      <th className="w-9 py-2.5 pl-3" />
                      <th className="px-3 py-2.5 text-left font-manrope text-xs font-semibold text-[#6F6F8D]">
                        Primary key (EMAIL ID)
                      </th>
                      <th className="px-3 py-2.5 text-left font-manrope text-xs font-semibold text-[#6F6F8D]">
                        Mobile
                      </th>
                      <th className="px-3 py-2.5 text-left font-manrope text-xs font-semibold text-[#6F6F8D]">
                        City
                      </th>
                      <th className="px-3 py-2.5 text-left font-manrope text-xs font-semibold text-[#6F6F8D]">
                        Product preference
                      </th>
                      <th className="px-3 py-2.5 text-left font-manrope text-xs font-semibold text-[#6F6F8D]">
                        Product affinity
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeRows.map((p, i) => {
                      const checked = p === selected;
                      return (
                        <tr
                          key={rowKey(p, i)}
                          onClick={() => pickProfile(p)}
                          className={cn(
                            "cursor-pointer border-b border-[#EEF1F7] last:border-b-0 transition-colors",
                            checked ? "bg-[#F4F8FF]" : "hover:bg-[#F7F9FC]"
                          )}
                        >
                          <td className="py-2.5 pl-3">
                            <span
                              className={cn(
                                "grid size-4 shrink-0 place-items-center rounded-full border-2 transition-colors",
                                checked ? "border-[#2F68E5] bg-[#2F68E5]" : "border-[#C3CAD9] bg-white"
                              )}
                            >
                              {checked && <Check className="size-2.5 text-white" strokeWidth={3} />}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-3 py-2.5 font-manrope text-sm text-[#17173A]">
                            {p.email}
                          </td>
                          <td className="whitespace-nowrap px-3 py-2.5 font-manrope text-sm text-[#17173A]">
                            {p.mobile}
                          </td>
                          <td className="whitespace-nowrap px-3 py-2.5 font-manrope text-sm text-[#17173A]">
                            {p.city}
                          </td>
                          <td className="whitespace-nowrap px-3 py-2.5 font-manrope text-sm text-[#17173A]">
                            {p.productPreference}
                          </td>
                          <td className="whitespace-nowrap px-3 py-2.5 font-manrope text-sm text-[#17173A]">
                            {p.productAffinity}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            <p className="mt-6 font-manrope text-sm text-[#17173A]">Previewing as</p>
            <div className="mt-2 rounded-md border border-[#DDE2EE] bg-white px-3 py-2.5">
              <p className="font-manrope text-sm font-bold text-[#17173A]">{selected.email}</p>
              <p className="mt-0.5 font-manrope text-xs text-[#6F6F8D]">
                {selected.city} · {selected.mobile}
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
