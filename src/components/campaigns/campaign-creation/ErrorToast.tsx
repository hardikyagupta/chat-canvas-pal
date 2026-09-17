import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle } from "lucide-react";

const AUTO_DISMISS_MS = 3000;

/** Small centered banner for a blocked action — e.g. trying to use/create a
 *  template before a required earlier field is filled in. Portalled to
 *  <body> so it floats above the wizard regardless of which accordion card
 *  triggered it, and auto-dismisses itself after a few seconds. */
export default function ErrorToast({
  message,
  onDismiss,
}: {
  message: string;
  onDismiss: () => void;
}) {
  const onDismissRef = useRef(onDismiss);
  onDismissRef.current = onDismiss;

  useEffect(() => {
    const timer = window.setTimeout(() => onDismissRef.current(), AUTO_DISMISS_MS);
    return () => window.clearTimeout(timer);
  }, [message]);

  return createPortal(
    <div
      role="alert"
      className="fixed bottom-8 left-1/2 z-[200] -translate-x-1/2"
    >
      <div className="flex items-center gap-2 rounded-lg bg-destructive px-4 py-2.5 shadow-[0_8px_24px_rgba(23,23,58,0.18)]">
        <AlertTriangle className="size-4 shrink-0 text-destructive-foreground" strokeWidth={2.4} />
        <span className="font-manrope text-sm font-semibold text-destructive-foreground">
          {message}
        </span>
      </div>
    </div>,
    document.body
  );
}
