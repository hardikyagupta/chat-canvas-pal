import { useEffect, useRef, useState } from "react";

/**
 * Renders a real HTML email template inside a sandboxed <iframe>, in two modes:
 *
 *  - "thumb":   a miniature that scales the 600px-wide email down to fit its
 *               container (the gallery card). JS-driven scale (a ResizeObserver
 *               measures the container) because CSS can't derive a unitless
 *               transform: scale() from container-query units. Pointer events
 *               are disabled so the surrounding card still receives clicks.
 *  - "preview": full-width, fills the preview canvas. The canvas max-width
 *               changes per device, so the email's own responsive breakpoints
 *               drive the mobile/tablet/desktop layout. Height auto-fits to the
 *               rendered document.
 *
 * The iframe is sandboxed with only `allow-same-origin` (needed to load the
 * co-located images/ and to measure document height). `allow-scripts` is
 * deliberately omitted — the emails are static, and combining the two flags
 * would neutralize the sandbox.
 */

/** The fixed design width of the exported emails (Unlayer 600px layout). */
const EMAIL_WIDTH = 600;

type TemplateFrameProps = {
  src: string;
  mode: "thumb" | "preview";
  device?: "desktop" | "tablet" | "mobile";
  title?: string;
};

export default function TemplateFrame({ src, mode, device, title }: TemplateFrameProps) {
  if (mode === "thumb") return <ThumbFrame src={src} title={title} />;
  return <PreviewFrame src={src} device={device} title={title} />;
}

/* Scaled-down, non-interactive miniature for gallery cards. */
function ThumbFrame({ src, title }: { src: string; title?: string }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const measure = () => setScale(el.clientWidth / EMAIL_WIDTH);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={wrapRef} className="tf-thumb" aria-hidden>
      <iframe
        className="tf-thumb-frame"
        src={src}
        title={title ?? "Email template preview"}
        loading="lazy"
        scrolling="no"
        sandbox="allow-same-origin"
        tabIndex={-1}
        style={{
          width: `${EMAIL_WIDTH}px`,
          // Tall enough that, once scaled down, the top of the email fills the
          // card's 4/5 box with no empty gap; the parent's overflow:hidden clips
          // the rest (so the thumbnail is the top slice of the real email).
          height: `${EMAIL_WIDTH * 2}px`,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
        }}
      />
    </div>
  );
}

/* Full-size, height-fitting preview for the RHS sheet. */
function PreviewFrame({
  src,
  device,
  title,
}: {
  src: string;
  device?: "desktop" | "tablet" | "mobile";
  title?: string;
}) {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState(800);

  // Read the rendered document height (same-origin, so contentDocument is
  // accessible). Re-fit on load and whenever the device width changes, since a
  // width reflow changes the height.
  const fit = () => {
    const frame = frameRef.current;
    try {
      const doc = frame?.contentDocument;
      if (doc) {
        const h = Math.max(
          doc.documentElement.scrollHeight,
          doc.body?.scrollHeight ?? 0,
        );
        if (h > 0) setHeight(h);
      }
    } catch {
      /* cross-origin guard — never expected for same-origin assets */
    }
  };

  useEffect(() => {
    // Device change reflows the email; re-measure after layout settles.
    const t = window.setTimeout(fit, 60);
    return () => window.clearTimeout(t);
  }, [device]);

  const onLoad = () => {
    fit();
    // CDN images can load after DOMContentLoaded and grow the document, so
    // re-measure once the full window load fires and again shortly after.
    try {
      frameRef.current?.contentWindow?.addEventListener("load", fit, { once: true });
    } catch {
      /* ignore */
    }
    window.setTimeout(fit, 400);
  };

  return (
    <iframe
      ref={frameRef}
      className="tf-preview-frame"
      src={src}
      title={title ?? "Email template preview"}
      sandbox="allow-same-origin"
      onLoad={onLoad}
      style={{ width: "100%", height: `${height}px`, border: 0, display: "block" }}
    />
  );
}
