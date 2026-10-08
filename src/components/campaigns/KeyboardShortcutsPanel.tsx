import type { ReactNode } from "react";
import { X } from "lucide-react";

/**
 * "Keyboard shortcuts" — right-side reference panel opened from the Journey
 * Builder header's overflow menu. Lists every shortcut in the product's
 * reference list for this canvas; only a handful (Review, Add, Copy
 * (keyboard), Paste, Delete, Zoom in/out, Zoom to fit) have a real action
 * wired up today (see the keydown listener in JourneyBuilder.tsx and the
 * zoom one in JourneyCanvas.tsx) — the rest document shortcuts for canvas
 * features (Goal, Message settings, Exit conditions, multi-select, pan,
 * notes, zen mode, command palette) that don't exist yet, kept here only
 * because they're part of the same reference list.
 *
 * ⌘C copies the selected node to a clipboard and arms every insertion gap
 * in every chain/branch as a paste target (JourneyCanvas's pasteArmed —
 * see .jc-gap.paste-target in journey-canvas.css); ⌘V only does something
 * while the mouse is actually over one of those gaps, landing the copy
 * there and nowhere else.
 */

/** One physical key, rendered the same "keycap" way throughout the list. */
function Key({ children }: { children: string }) {
  return (
    <span className="inline-flex h-7 min-w-[28px] items-center justify-center rounded-md border border-[#DDE2EE] bg-[#F7F7FB] px-2 font-manrope text-[12.5px] font-semibold text-[#17173A]">
      {children}
    </span>
  );
}

/** A plain-text gesture word next to a keycap, e.g. "drag" after [Alt]. */
function GestureText({ children }: { children: string }) {
  return <span className="font-manrope text-[13px] text-[#6F6F8D]">{children}</span>;
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <span className="font-manrope text-[14px] text-[#17173A]">{label}</span>
      <div className="flex shrink-0 items-center gap-1.5">{children}</div>
    </div>
  );
}

export default function KeyboardShortcutsPanel({ onClose }: { onClose: () => void }) {
  return (
    <div
      role="complementary"
      aria-label="Keyboard shortcuts"
      className="jc-drawer-panel flex h-full w-[420px] max-w-[94vw] shrink-0 flex-col overflow-hidden rounded-lg bg-white shadow-[0px_1px_3px_rgba(23,23,58,0.06)] duration-200 animate-in fade-in slide-in-from-right-3"
    >
      {/* Header */}
      <div className="flex items-start gap-3 px-6 pt-6">
        <div className="flex-1">
          <h2 className="font-manrope text-[16px] font-bold leading-tight text-[#17173A]">Keyboard shortcuts</h2>
        </div>
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center text-[#6F6F8D] transition-colors hover:text-[#17173A]"
        >
          <X className="h-5 w-5" strokeWidth={2} />
        </button>
      </div>

      <div className="mt-4 border-t border-[#EBEBF5]" />

      {/* List */}
      <div className="scroll-slim min-h-0 flex-1 overflow-y-auto px-6 py-2">
        <div className="divide-y divide-[#EBEBF5]">
          <Row label="Publish">
            <Key>R</Key>
          </Row>
          <Row label="Add">
            <Key>A</Key>
          </Row>
          <Row label="Goal">
            <Key>G</Key>
          </Row>
          <Row label="Journey settings">
            <Key>S</Key>
          </Row>
          <Row label="Exit conditions">
            <Key>E</Key>
          </Row>
          <Row label="Select multiple">
            <Key>Shift</Key>
          </Row>
          <Row label="Copy">
            <Key>Alt</Key>
            <GestureText>drag</GestureText>
          </Row>
          <Row label="Copy (keyboard)">
            <Key>⌘C</Key>
          </Row>
          <Row label="Paste">
            <Key>⌘V</Key>
          </Row>
          <Row label="Delete">
            <Key>⌫</Key>
          </Row>
          <div className="flex items-center justify-between gap-4 py-3">
            <span className="font-manrope text-[14px] text-[#17173A]">Pan</span>
            <div className="flex shrink-0 flex-col items-end gap-1.5">
              <div className="flex items-center gap-1.5">
                <Key>␣</Key>
                <GestureText>drag</GestureText>
              </div>
              <GestureText>right-click drag</GestureText>
            </div>
          </div>
          <Row label="Zoom in/out">
            <Key>⌘=</Key>
            <Key>⌘-</Key>
          </Row>
          <Row label="Zoom to fit">
            <Key>⌘0</Key>
          </Row>
          <Row label="Show/Hide Notes">
            <Key>⇧N</Key>
          </Row>
          <Row label="Toggle Zen mode">
            <Key>⇧Z</Key>
          </Row>
          <Row label="Command palette">
            <Key>⌘K</Key>
          </Row>
        </div>
      </div>
    </div>
  );
}
