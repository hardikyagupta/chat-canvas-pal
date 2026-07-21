import { useState } from "react";
import { Monitor, Pencil, Plus, Smartphone, Tablet } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet";
import "./content-pool.css";

/**
 * Template preview side panel — the mapped-template preview shared by the
 * Content step (ContentPool) and the Journey Preview template nodes. Renders a
 * device toolbar and a canvas showing the mapped template body.
 */

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
export function MappedPreview() {
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

export default function TemplatePreviewSheet({
  open,
  onOpenChange,
  mappedName,
  mappedId,
  channelName,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mappedName: string;
  mappedId: string;
  channelName: string;
}) {
  const [device, setDevice] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [browserView, setBrowserView] = useState(true);
  const [mobileView, setMobileView] = useState(false);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full gap-0 p-0 sm:max-w-[760px]">
        <SheetTitle className="sr-only">Template preview</SheetTitle>
        <SheetDescription className="sr-only">
          Preview of the mapped template for the {channelName} channel.
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
  );
}
