import { useState, type ReactNode } from "react";
import { Monitor, Pencil, Smartphone, Tablet } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet";
import TemplateFrame from "./TemplateFrame";
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

/* The template editor opens in a new tab (stand-in for the real builder). */
const TEMPLATE_EDITOR_URL = "https://uce-email.lovable.app/";
const openTemplateEditor = () =>
  window.open(TEMPLATE_EDITOR_URL, "_blank", "noopener,noreferrer");

export default function TemplatePreviewSheet({
  open,
  onOpenChange,
  mappedName,
  mappedId,
  channelName,
  templateSrc,
  preview,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mappedName: string;
  mappedId: string;
  channelName: string;
  /* Public URL of the real template HTML; rendered in an iframe when present. */
  templateSrc?: string;
  /* Optional custom preview body; falls back to the default mapped preview. */
  preview?: ReactNode;
}) {
  const [device, setDevice] = useState<"desktop" | "tablet" | "mobile">("desktop");

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
              <button className="cp-pp-btn" type="button" onClick={openTemplateEditor}>
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
          </div>

          <div className="cp-pp-scroll">
            <div className="cp-pp-heading">
              <strong>{mappedName}</strong>
              <span>Template ID: {mappedId}</span>
            </div>

            <div className={`cp-pp-canvas ${device}`}>
              <div className="cp-pp-body">
                {templateSrc ? (
                  <TemplateFrame
                    mode="preview"
                    device={device}
                    src={templateSrc}
                    title={mappedName}
                  />
                ) : (
                  preview ?? <MappedPreview />
                )}
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
