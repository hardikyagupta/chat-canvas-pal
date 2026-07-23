import { useState } from "react";
import {
  ChevronDown,
  CircleCheck,
  GitBranch,
  Globe,
  ListChecks,
  LogOut,
  Mail,
  MessageCircle,
  MessageSquare,
  Mic,
  Share2,
  Smartphone,
  Sparkles,
  UserCheck,
  Users,
  Webhook,
} from "lucide-react";

/**
 * Journey Builder LHS palette — the draggable node library (Figma
 * node 16788:23440). Collapsible sections: Triggers, Actions, Conditions,
 * Flow Controls. Action tiles are violet, Condition tiles green, matching
 * the Figma tile colours exactly (Nunito Sans → Manrope per house font).
 */

type LucideIcon = typeof Mail;
type Tone = "action" | "condition";
interface Tile {
  label: string;
  icon: LucideIcon;
}

const ACTION_TILES: Tile[] = [
  { label: "Email", icon: Mail },
  { label: "SMS", icon: MessageSquare },
  { label: "WebPush", icon: Globe },
  { label: "App Push", icon: Smartphone },
  { label: "Voice", icon: Mic },
  { label: "Web-hook", icon: Webhook },
  { label: "Update Attribute", icon: ListChecks },
  { label: "Whatsapp", icon: MessageCircle },
  { label: "Remove from Journey", icon: LogOut },
];

const CONDITION_TILES: Tile[] = [
  { label: "Check Attribute", icon: UserCheck },
  { label: "Has done event", icon: CircleCheck },
  { label: "Preferred Channel", icon: Users },
  { label: "Split Action", icon: GitBranch },
  { label: "Is in Segment", icon: Share2 },
  { label: "Path optimiser", icon: Sparkles },
];

const TONE_STYLES: Record<Tone, { box: string; icon: string; radius: string }> = {
  action: { box: "bg-[#EBD2FF] border-[#9449DF]", icon: "text-[#9449DF]", radius: "rounded-lg" },
  condition: { box: "bg-[#D5F2D6] border-[#00C48C]", icon: "text-[#00B27E]", radius: "rounded" },
};

function PaletteTile({ tile, tone }: { tile: Tile; tone: Tone }) {
  const Icon = tile.icon;
  const s = TONE_STYLES[tone];
  return (
    <button
      type="button"
      className="group flex w-[76px] flex-col items-center gap-2 outline-none"
      aria-label={tile.label}
    >
      <span
        className={`grid h-[50px] w-[50px] place-items-center border ${s.box} ${s.radius} transition-transform group-hover:-translate-y-0.5 group-hover:shadow-[0px_4px_10px_rgba(23,23,58,0.10)]`}
      >
        <Icon className={`h-[22px] w-[22px] ${s.icon}`} strokeWidth={1.9} />
      </span>
      <span className="text-center font-manrope text-[12px] font-semibold leading-4 tracking-[0.42px] text-[#17173A]">
        {tile.label}
      </span>
    </button>
  );
}

function Section({
  title,
  open,
  onToggle,
  children,
}: {
  title: string;
  open: boolean;
  onToggle: () => void;
  children?: React.ReactNode;
}) {
  return (
    <div>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center gap-3 outline-none"
      >
        <span className="shrink-0 font-manrope text-[16px] font-semibold tracking-[0.33px] text-[#6F6F8D]">
          {title}
        </span>
        <span className="h-px flex-1 bg-[#DDE2EE]" />
        <ChevronDown
          className={`h-3.5 w-3.5 shrink-0 text-[#6F6F8D] transition-transform ${open ? "rotate-180" : ""}`}
          strokeWidth={2}
        />
      </button>
      {open && children ? <div className="mt-5">{children}</div> : null}
    </div>
  );
}

export default function JourneyPalette() {
  const [open, setOpen] = useState<Record<string, boolean>>({
    triggers: false,
    actions: true,
    conditions: true,
    flow: false,
  });
  const toggle = (key: string) => setOpen((o) => ({ ...o, [key]: !o[key] }));

  return (
    <aside className="scroll-slim flex w-[292px] shrink-0 flex-col gap-[30px] overflow-y-auto rounded-lg border border-[#EBEBF5] bg-white px-6 py-5 shadow-[0px_1px_3px_rgba(23,23,58,0.06)]">
      <Section title="Triggers" open={open.triggers} onToggle={() => toggle("triggers")} />

      <Section title="Actions" open={open.actions} onToggle={() => toggle("actions")}>
        <div className="grid grid-cols-3 justify-items-center gap-x-4 gap-y-6">
          {ACTION_TILES.map((tile) => (
            <PaletteTile key={tile.label} tile={tile} tone="action" />
          ))}
        </div>
      </Section>

      <Section title="Conditions" open={open.conditions} onToggle={() => toggle("conditions")}>
        <div className="grid grid-cols-3 justify-items-center gap-x-4 gap-y-6">
          {CONDITION_TILES.map((tile) => (
            <PaletteTile key={tile.label} tile={tile} tone="condition" />
          ))}
        </div>
      </Section>

      <Section title="Flow Controls" open={open.flow} onToggle={() => toggle("flow")} />
    </aside>
  );
}
