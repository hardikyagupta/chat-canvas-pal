import { useEffect, useState } from "react";
import {
  Bell,
  Calendar,
  Check,
  FileText,
  Mail,
  MessageCircle,
  MessageSquare,
  Monitor,
  Users,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import CampaignCreationNavbar from "./CampaignCreationNavbar";
import CampaignCreationStepper, { type Step } from "./CampaignCreationStepper";
import CampaignAIPanel, { type DiscoveryPoint } from "./CampaignAIPanel";
import CampaignSetupStep, { type SetupValues } from "./CampaignSetupStep";
import StepPlaceholder from "./StepPlaceholder";
import ChatInterface from "@/components/ChatInterface";

/**
 * Full-screen campaign creation wizard, opened from the top bar's quick-create
 * menu. Slides up from the bottom on open and back down on close.
 *
 * Layout follows the shared campaign-creation reference — navbar, stepper,
 * step card, right summary — so every channel's flow is the same shell. Only
 * the step content differs per channel; today Setup is built for Email and the
 * remaining three steps are stubs.
 */

/** How long the slide runs; must match the duration class below. */
const SLIDE_MS = 380;

const CHANNEL_ICONS: Record<string, LucideIcon> = {
  Email: Mail,
  SMS: MessageSquare,
  Whatsapp: MessageCircle,
  "App Push Notification": Bell,
  "Web Push Notification": Monitor,
  "In-app Message": MessageSquare,
  "Web Message": Monitor,
};

/** Canonical order — do not reorder; every channel shares it. */
const STEPS: Step[] = [
  { id: "setup", label: "Setup", icon: Check },
  { id: "content", label: "Content", icon: FileText },
  { id: "audience", label: "Audience", icon: Users },
  { id: "schedule", label: "Schedule", icon: Calendar },
];

const PLACEHOLDERS: Record<string, { title: string; description: string; note: string }> = {
  content: {
    title: "Content",
    description: "Build the message this campaign sends",
    note: "Template picker, subject line and body editor land here. Setup is saved, so you can move on and come back.",
  },
  audience: {
    title: "Audience",
    description: "Choose who receives this campaign",
    note: "Segment and list selection, exclusions and reachability estimates land here.",
  },
  schedule: {
    title: "Schedule",
    description: "Decide when this campaign goes out",
    note: "Send now, schedule for later and send-time optimisation land here.",
  },
};

export default function CampaignCreationOverlay({
  open,
  channel,
  onClose,
}: {
  open: boolean;
  /** Quick-create label that opened this, e.g. "Email". */
  channel: string;
  onClose: () => void;
}) {
  // `mounted` keeps the panel in the DOM through its exit slide; `shown` drives
  // the transform. Same mount → enter → leave → unmount dance the docked chat
  // on the campaigns page uses.
  const [mounted, setMounted] = useState(false);
  const [shown, setShown] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [setup, setSetup] = useState<SetupValues>({
    name: "",
    tags: "",
    gaTracking: false,
    conversionTracking: false,
  });
  // Docked co-marketer chat, opened from the navbar CTA. `chatSession` is
  // bumped per open so the widget remounts on a fresh thread.
  const [chatOpen, setChatOpen] = useState(false);
  const [chatSession, setChatSession] = useState(0);
  // Discovery point the chat opens on; null when opened from the navbar CTA.
  const [chatTopic, setChatTopic] = useState<DiscoveryPoint | null>(null);
  const [enabledAgents, setEnabledAgents] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (open) {
      setMounted(true);
      return;
    }
    setShown(false);
    const id = setTimeout(() => {
      setMounted(false);
      setChatOpen(false);
      // Reset only after the panel is gone, so the exit slide doesn't show the
      // wizard snapping back to step 1.
      setActiveIndex(0);
      setSetup({ name: "", tags: "", gaTracking: false, conversionTracking: false });
    }, SLIDE_MS);
    return () => clearTimeout(id);
  }, [open]);

  // Flip to open only once the closed panel is actually in the DOM — hence a
  // second effect keyed on `mounted` rather than doing this above. Scheduling
  // it alongside setMounted lets React batch the mount and the transform into
  // one paint, and the slide never runs. The double rAF then guarantees the
  // closed state gets a frame of its own before the transform changes.
  useEffect(() => {
    if (!mounted || !open) return;
    let raf2 = 0;
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => setShown(true));
    });
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
  }, [mounted, open]);

  // Esc closes, and the page behind shouldn't scroll while we're over it.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!mounted) return null;

  const Icon = CHANNEL_ICONS[channel] ?? Mail;
  const activeStep = STEPS[activeIndex];
  const isLastStep = activeIndex === STEPS.length - 1;
  const placeholder = PLACEHOLDERS[activeStep.id];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Create ${channel} campaign`}
      className={cn(
        "fixed inset-0 z-[60] flex flex-col bg-[#F4F8FF]",
        "transition-transform duration-[380ms] ease-[cubic-bezier(0.22,1,0.36,1)]",
        "motion-reduce:transition-none",
        shown ? "translate-y-0" : "translate-y-full"
      )}
    >
      <CampaignCreationNavbar
        campaignName={setup.name.trim() || `Untitled ${channel} campaign`}
        icon={Icon}
        nextLabel={isLastStep ? "Launch" : "Next step"}
        onAskCoMarketer={() => {
          setChatTopic(null);
          setChatSession((n) => n + 1);
          setChatOpen(true);
        }}
        onSave={onClose}
        onNextStep={() => (isLastStep ? onClose() : setActiveIndex((i) => i + 1))}
        onClose={onClose}
      />

      <CampaignCreationStepper
        steps={STEPS}
        activeIndex={activeIndex}
        campaignId="1234"
        lastSaved="just now"
        onStepSelect={setActiveIndex}
      />

      <div className="flex min-h-0 flex-1">
        <div className="scroll-slim min-w-0 flex-1 overflow-y-auto py-6 pl-6 pr-3">
          {activeStep.id === "setup" ? (
            <CampaignSetupStep
              values={setup}
              onChange={(patch) => setSetup((s) => ({ ...s, ...patch }))}
            />
          ) : (
            <StepPlaceholder
              title={placeholder.title}
              description={placeholder.description}
              icon={activeStep.icon}
              note={placeholder.note}
            />
          )}
        </div>

        <CampaignAIPanel
          stepId={activeStep.id}
          onAsk={(point) => {
            setChatTopic(point);
            setChatSession((n) => n + 1);
            setChatOpen(true);
          }}
        />

        {/* Co-marketer chat — docked column, same widget the campaigns list
            uses. Opened by "Ask co-marketer" in the navbar; remounted per open
            (key bump) so each session starts on a clean thread. */}
        {chatOpen && (
          <div className="flex h-full min-h-0 w-[474px] shrink-0 justify-end overflow-hidden py-3 pr-3">
            <ChatInterface
              key={chatSession}
              initialExpanded={false}
              docked
              conversationVariant="campaigns"
              initialTopic={chatTopic ?? undefined}
              enabledAgents={enabledAgents}
              setEnabledAgents={setEnabledAgents}
              onCloseInterface={() => setChatOpen(false)}
            />
          </div>
        )}
      </div>
    </div>
  );
}
