import { useMemo, useState } from "react";
import {
  Bell,
  Eye,
  Globe,
  Mail,
  MessageSquare,
  Monitor,
  Pencil,
  Plus,
  Smartphone,
  Tablet,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet";
import "./content-pool.css";

/**
 * Approved content pool — the Content step of the objective creation flow.
 * The decisioning engine maps one approved template and audience per channel;
 * the marketer reviews the message details and can preview the mapped template.
 * No RHS summary is shown for this step (the pool spans the full canvas).
 */

type FieldSpec = {
  key: string;
  label: string;
  type?: "input" | "textarea";
  value: string;
  max?: number;
};

type Channel = {
  id: string;
  name: string;
  sub: string;
  icon: typeof Mail;
  contentTitle: string;
  contentDesc: string;
  fields: FieldSpec[];
  template: { name: string; id: string };
  audience: { name: string; lift: string; stat: string; people: number };
};

const CHANNELS: Channel[] = [
  {
    id: "email",
    name: "Email",
    sub: "Second-purchase offer",
    icon: Mail,
    contentTitle: "Email content",
    contentDesc: "Review the email details and the mapped template.",
    fields: [
      { key: "senderName", label: "Sender name", value: "Netcore", max: 100 },
      { key: "senderEmail", label: "Sender email", value: "offers@netcore.in" },
      { key: "replyEmail", label: "Reply email ID", value: "support@netcore.in" },
      { key: "subject", label: "Subject line", value: "Still interested? Here's something for you" },
      {
        key: "preHeader",
        label: "Pre-header",
        value: "Because you left something special behind",
        max: 120,
      },
    ],
    template: { name: "Second-purchase offer", id: "868" },
    audience: {
      name: "High-value gifters",
      lift: "+9.5%",
      stat: "Top 15% by trailing AOV",
      people: 234000,
    },
  },
  {
    id: "sms",
    name: "SMS",
    sub: "Free-shipping nudge",
    icon: MessageSquare,
    contentTitle: "SMS content",
    contentDesc: "Review the SMS details and the mapped template.",
    fields: [
      { key: "senderId", label: "Sender ID", value: "NETCOR", max: 11 },
      {
        key: "message",
        label: "Message",
        type: "textarea",
        value: "Still deciding? Free shipping is on us — complete your order today. Reply STOP to opt out.",
        max: 160,
      },
    ],
    template: { name: "Free-shipping nudge", id: "742" },
    audience: {
      name: "Deal-seeking shoppers",
      lift: "+6.2%",
      stat: "Top 20% by discount responsiveness",
      people: 180000,
    },
  },
  {
    id: "push",
    name: "Push notification",
    sub: "Complete-the-set reminder",
    icon: Bell,
    contentTitle: "Push notification content",
    contentDesc: "Review the push notification details and the mapped template.",
    fields: [
      { key: "title", label: "Title", value: "Complete the set", max: 65 },
      {
        key: "message",
        label: "Message",
        type: "textarea",
        value: "You're one piece away. Add the matching band and make it yours.",
        max: 240,
      },
      { key: "deepLink", label: "Deep link", value: "netcore://volt/accessories" },
    ],
    template: { name: "Complete-the-set reminder", id: "915" },
    audience: {
      name: "Recent cart abandoners",
      lift: "+12.4%",
      stat: "Added to cart in the last 7 days",
      people: 92000,
    },
  },
  {
    id: "webpush",
    name: "Web push",
    sub: "Limited-time comeback offer",
    icon: Globe,
    contentTitle: "Web push content",
    contentDesc: "Review the web push details and the mapped template.",
    fields: [
      { key: "title", label: "Title", value: "A limited-time welcome back", max: 65 },
      {
        key: "message",
        label: "Message",
        type: "textarea",
        value: "Your cart is waiting. Come back within 24 hours for an exclusive offer.",
        max: 200,
      },
      { key: "landingUrl", label: "Landing URL", value: "https://netcore.in/comeback" },
    ],
    template: { name: "Limited-time comeback offer", id: "603" },
    audience: {
      name: "Lapsed 30-day visitors",
      lift: "+4.8%",
      stat: "No purchase in 30+ days",
      people: 310000,
    },
  },
];

function formatPeople(count: number) {
  if (count >= 1000) return `${Math.round(count / 1000)}K`;
  return String(count);
}

/* ---- Netcore logo mark (small "N") ---- */
function NetcoreMark() {
  return (
    <span className="cp-logo-mark">
      <svg viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M4 20V6.5C4 5.7 4.9 5.2 5.6 5.7L18 14.5V4"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

/* Rendered inside the top card's preview frame and the preview side panel. */
function MappedPreview() {
  return (
    <>
      <div className="cp-preview-topbar">
        <NetcoreMark />
        <b>Netcore</b>
      </div>
      <div className="cp-preview-hero">
        <p className="cp-hero-kicker">Upgrade your WATCH, Upgrade your WORLD.</p>
        <p className="cp-hero-title">
          INTRODUCING <em>VOLT 3.0</em>
        </p>
        <p className="cp-hero-sub">
          A whole new series of smartwatches with a blend of innovation, style and functionality.
        </p>
        <div className="cp-hero-watches">
          <span className="cp-hero-watch" />
          <span className="cp-hero-watch" />
          <span className="cp-hero-watch" />
        </div>
      </div>
    </>
  );
}

export default function ContentPool() {
  const [activeChannel, setActiveChannel] = useState<string>("email");
  const [values, setValues] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    CHANNELS.forEach((c) => c.fields.forEach((f) => (init[`${c.id}.${f.key}`] = f.value)));
    return init;
  });
  const [previewOpen, setPreviewOpen] = useState(false);
  const [device, setDevice] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [browserView, setBrowserView] = useState(true);
  const [mobileView, setMobileView] = useState(false);

  const channel = useMemo(
    () => CHANNELS.find((c) => c.id === activeChannel) ?? CHANNELS[0],
    [activeChannel],
  );

  const mappedName = channel.template.name;
  const mappedId = channel.template.id;

  const setValue = (key: string, v: string, max?: number) =>
    setValues((prev) => ({ ...prev, [key]: max ? v.slice(0, max) : v }));

  return (
    <div className="content-pool">
      {/* Header */}
      <div className="cp-header">
        <h1>Approved content pool ({CHANNELS.length})</h1>
        <p>
          Content mapped by the decisioning engine. Review the mapped content for
          each channel.
        </p>
      </div>

      {/* Channel tabs */}
      <div className="cp-channels" role="tablist" aria-label="Channels">
        {CHANNELS.map((c) => {
          const Icon = c.icon;
          const active = c.id === activeChannel;
          return (
            <button
              key={c.id}
              role="tab"
              aria-selected={active}
              className={`cp-channel${active ? " active" : ""}`}
              onClick={() => setActiveChannel(c.id)}
            >
              <span className="cp-channel-icon">
                <Icon strokeWidth={1.8} />
              </span>
              <span className="cp-channel-text">
                <span className="cp-channel-name">{c.name}</span>
                <span className="cp-channel-sub">{c.sub}</span>
              </span>
            </button>
          );
        })}
      </div>

      {/* Body: content form (left) + mapped template (right) */}
      <div className="cp-body">
        <div>
          <h2 className="cp-section-title">{channel.contentTitle}</h2>
          <p className="cp-section-desc">{channel.contentDesc}</p>

          {channel.fields.map((f) => {
            const fieldKey = `${channel.id}.${f.key}`;
            const val = values[fieldKey] ?? "";
            return (
              <label key={f.key} className="cp-field">
                <span>{f.label}</span>
                <div className="cp-input-wrap">
                  {f.type === "textarea" ? (
                    <textarea
                      value={val}
                      onChange={(e) => setValue(fieldKey, e.target.value, f.max)}
                    />
                  ) : (
                    <input
                      value={val}
                      onChange={(e) => setValue(fieldKey, e.target.value, f.max)}
                    />
                  )}
                  {f.max ? (
                    <span className="cp-counter">
                      {val.length}/{f.max}
                    </span>
                  ) : null}
                </div>
              </label>
            );
          })}
        </div>

        {/* Mapped template card */}
        <div className="cp-template-card">
          <div className="cp-template-head">
            <strong>Mapped template</strong>
            <span className="cp-badge">Recommended by DE</span>
          </div>

          <div className="cp-preview">
            <MappedPreview />
          </div>

          <p className="cp-template-name">{mappedName}</p>
          <p className="cp-template-id">Template ID: {mappedId}</p>

          <div className="cp-audience-card">
            <span className="cp-audience-eyebrow">Mapped audience</span>
            <div className="cp-audience-row">
              <span className="cp-audience-name">{channel.audience.name}</span>
              <span className="cp-audience-lift">{channel.audience.lift}</span>
              <span className="cp-audience-chip">sends</span>
            </div>
            <p className="cp-audience-stat">
              {channel.audience.stat} · {formatPeople(channel.audience.people)} people
            </p>
          </div>

          <div className="cp-template-actions">
            <button
              className="cp-btn"
              type="button"
              onClick={() => setPreviewOpen(true)}
            >
              <Eye strokeWidth={1.8} />
              Preview
            </button>
          </div>
        </div>
      </div>

      {/* Email preview side panel — widened to fit a 640px email body. */}
      <Sheet open={previewOpen} onOpenChange={setPreviewOpen}>
        <SheetContent
          side="right"
          className="w-full gap-0 p-0 sm:max-w-[760px]"
        >
          <SheetTitle className="sr-only">Email preview</SheetTitle>
          <SheetDescription className="sr-only">
            Preview of the mapped template for the {channel.name} channel.
          </SheetDescription>

          <div className="cp-preview-panel">
            <div className="cp-pp-toolbar">
              <div className="cp-pp-left">
                <button className="cp-pp-btn" type="button">
                  <Pencil strokeWidth={2} />
                  Edit template
                </button>
              </div>

              <div className="cp-pp-devices" role="group" aria-label="Preview device">
                <button
                  className={`cp-pp-device${device === "desktop" ? " active" : ""}`}
                  type="button"
                  aria-label="Desktop"
                  aria-pressed={device === "desktop"}
                  onClick={() => setDevice("desktop")}
                >
                  <Monitor strokeWidth={1.8} />
                </button>
                <button
                  className={`cp-pp-device${device === "tablet" ? " active" : ""}`}
                  type="button"
                  aria-label="Tablet"
                  aria-pressed={device === "tablet"}
                  onClick={() => setDevice("tablet")}
                >
                  <Tablet strokeWidth={1.8} />
                </button>
                <button
                  className={`cp-pp-device${device === "mobile" ? " active" : ""}`}
                  type="button"
                  aria-label="Mobile"
                  aria-pressed={device === "mobile"}
                  onClick={() => setDevice("mobile")}
                >
                  <Smartphone strokeWidth={1.8} />
                </button>
              </div>

              <div className="cp-pp-right">
                <label className="cp-pp-check">
                  <input
                    type="checkbox"
                    checked={browserView}
                    onChange={(e) => setBrowserView(e.target.checked)}
                  />
                  Browser view
                </label>
                <label className="cp-pp-check">
                  <input
                    type="checkbox"
                    checked={mobileView}
                    onChange={(e) => setMobileView(e.target.checked)}
                  />
                  Mobile view
                </label>
              </div>
            </div>

            <div className="cp-pp-scroll">
              <div className="cp-pp-heading">
                <strong>{mappedName}</strong>
                <span>Template ID: {mappedId}</span>
              </div>

              <div className={`cp-pp-canvas ${device}`}>
                <button className="cp-pp-dropzone" type="button">
                  <Plus strokeWidth={2} />
                  Add Header
                </button>
                <div className="cp-pp-body">
                  <MappedPreview />
                </div>
                <button className="cp-pp-dropzone" type="button">
                  <Plus strokeWidth={2} />
                  Add Footer
                </button>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
