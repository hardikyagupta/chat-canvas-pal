import { useEffect, useRef, useState } from "react";
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
import CampaignAIPanel, {
  isContentPatchApplied,
  isPatchApplied,
  isSchedulePatchApplied,
  toSetupApplyCard,
  type CampaignSuggestion,
} from "./CampaignAIPanel";
import CampaignSetupStep, {
  goalLabel,
  mergeTags,
  type SetupValues,
} from "./CampaignSetupStep";
import CampaignAudienceStep, {
  EMPTY_AUDIENCE,
  type AudienceValues,
} from "./CampaignAudienceStep";
import { cohortsForGoal, type AudienceCohort } from "./audienceCohorts.data";
import CampaignContentStep, {
  EMPTY_CONTENT,
  type ContentValues,
} from "./CampaignContentStep";
import CampaignScheduleStep, {
  EMPTY_SCHEDULE,
  defaultSendAt,
  describeSlot,
  type ScheduleValues,
} from "./CampaignScheduleStep";
import { emailTemplates } from "./emailTemplates.data";
import type { Finding } from "./previewFindings.data";
import CampaignPreview from "./CampaignPreview";
import ChatInterface, { type SeededTopic } from "@/components/ChatInterface";
import "./campaign-creation.css";

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
  { id: "audience", label: "Audience", icon: Users },
  { id: "content", label: "Content", icon: FileText },
  { id: "schedule", label: "Schedule", icon: Calendar },
];

const EMPTY_SETUP: SetupValues = {
  goal: "",
  tags: "",
  gaTracking: false,
  conversionTracking: false,
  conversionEvent: "",
  audienceSuggestion: "",
};

/**
 * The co-marketer's audience thread: the Segment agent scores cohorts against
 * the goal and hands back cuts to plot. Reached both by landing on the step and
 * by "Audience options" in the suggestion rail, so it lives out here.
 */
function audienceCutsTopic(goalValue: string): SeededTopic {
  const label = goalLabel(goalValue);
  return {
    prompt: "Who should this campaign go to?",
    navLabel: "Audience",
    // Building the cuts is the Segment agent's job, so the co-marketer hands
    // over and the thread shows that work happening before the cards land.
    agentId: "segment-agent",
    reasoningSteps: [
      "Reading 90 days of opens, clicks and orders",
      `Scoring cohorts against "${label ?? "this goal"}"`,
      "Checking channel reachability and consent",
      "Pairing each cut with the suppression it needs",
    ],
    reply:
      `I read your last 90 days of engagement against "${label ?? "this goal"}" and pulled three cuts worth ` +
      `considering, best fit first. Each one comes with the suppression I'd pair it with. ` +
      `Review one and I'll plot it onto the form — you can still edit it there.`,
    setupApplyCard: {
      kind: "cohorts",
      title: "Audience options",
      applyLabel: "Review audience",
      appliedLabel: "Plotted on audience",
      cohorts: cohortsForGoal(goalValue),
      goalLabel: label,
    },
  };
}

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
  const [setup, setSetup] = useState<SetupValues>(EMPTY_SETUP);
  const [audience, setAudience] = useState<AudienceValues>(EMPTY_AUDIENCE);
  const [content, setContent] = useState<ContentValues>(EMPTY_CONTENT);
  const [schedule, setSchedule] = useState<ScheduleValues>(EMPTY_SCHEDULE);
  // Preview is the screen after the last step, not a fifth step — it replaces
  // the wizard chrome with its own header while the draft stays in state.
  const [previewOpen, setPreviewOpen] = useState(false);
  // Docked co-marketer chat, opened from the navbar CTA. `chatSession` is
  // bumped per open so the widget remounts on a fresh thread.
  const [chatOpen, setChatOpen] = useState(false);
  const [chatSession, setChatSession] = useState(0);
  const [chatTopic, setChatTopic] = useState<SeededTopic | null>(null);
  const [followUpTopic, setFollowUpTopic] = useState<SeededTopic | null>(null);
  const [followUpSeq, setFollowUpSeq] = useState(0);
  const [enabledAgents, setEnabledAgents] = useState<Set<string>>(new Set());
  const [aiReady, setAiReady] = useState(false);
  const [highlight, setHighlight] = useState<Partial<Record<keyof SetupValues, boolean>>>({});
  const [contentHighlight, setContentHighlight] = useState<
    Partial<Record<keyof ContentValues, boolean>>
  >({});
  const [audienceFlash, setAudienceFlash] = useState(false);
  // The audience thread seeds once per wizard open, not every time the step is
  // revisited — coming back shouldn't wipe what the user already discussed.
  const audienceSeeded = useRef(false);
  // Whether the open chat is the audience thread — it closes when the step does.
  const audienceChat = useRef(false);

  useEffect(() => {
    if (open) {
      setMounted(true);
      return;
    }
    setShown(false);
    const id = setTimeout(() => {
      setMounted(false);
      setChatOpen(false);
      setChatTopic(null);
      setFollowUpTopic(null);
      setFollowUpSeq(0);
      // Reset only after the panel is gone, so the exit slide doesn't show the
      // wizard snapping back to step 1.
      setActiveIndex(0);
      setSetup(EMPTY_SETUP);
      setAudience(EMPTY_AUDIENCE);
      setContent(EMPTY_CONTENT);
      setPreviewOpen(false);
      // Fresh default send time — the module-level one ages with the session.
      setSchedule({ ...EMPTY_SCHEDULE, sendAt: defaultSendAt() });
      setAudienceFlash(false);
      audienceSeeded.current = false;
      setAiReady(false);
      setHighlight({});
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

  // Co-marketer suggestions skeleton in while the goal is new, then reveal.
  useEffect(() => {
    if (!setup.goal) {
      setAiReady(false);
      return;
    }
    setAiReady(false);
    const id = setTimeout(() => setAiReady(true), 1600);
    return () => clearTimeout(id);
  }, [setup.goal]);

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

  // Landing on Audience opens the co-marketer straight away and asks it for
  // cuts — the audience is the one step where the recommendation is the work,
  // so the thread leads and the form follows what the user picks.
  useEffect(() => {
    if (!open || STEPS[activeIndex].id !== "audience") return;
    if (audienceSeeded.current || !setup.goal) return;
    audienceSeeded.current = true;
    audienceChat.current = true;
    setChatTopic(audienceCutsTopic(setup.goal));
    setFollowUpTopic(null);
    setFollowUpSeq(0);
    setChatSession((n) => n + 1);
    setChatOpen(true);
  }, [open, activeIndex, setup.goal]);

  // The audience thread belongs to its step. Moving on to Content or Schedule
  // closes it rather than carrying an answered conversation into work it has
  // nothing to say about — the suggestion rail takes over there. A chat the
  // user opened themselves from the navbar is left alone.
  useEffect(() => {
    if (!open || STEPS[activeIndex].id === "audience" || !audienceChat.current) return;
    audienceChat.current = false;
    setChatOpen(false);
    setChatTopic(null);
    setFollowUpTopic(null);
    setFollowUpSeq(0);
  }, [open, activeIndex]);

  if (!mounted) return null;

  const toSeeded = (point: CampaignSuggestion): SeededTopic => ({
    prompt: point.prompt,
    reply: point.reply,
    navLabel: point.navLabel,
    // A prompt-only rail card is a question, not an offer — no apply card.
    setupApplyCard: point.promptOnly ? undefined : toSetupApplyCard(point),
  });

  /** Plots a proposed cut onto the audience form as co-marketer-built chips. */
  const applyCohort = (cohort: AudienceCohort) => {
    setAudience((a) => ({
      ...a,
      mode: "segments",
      segments: [
        { id: `cohort-${cohort.id}`, name: cohort.name, reach: cohort.reachable, ai: true },
      ],
      excludeEnabled: true,
      excludeSegments: [
        {
          id: `suppress-${cohort.id}`,
          name: cohort.exclude.name,
          reach: cohort.exclude.reach,
          ai: true,
        },
      ],
      cohortId: cohort.id,
    }));
    setAudienceFlash(true);
    window.setTimeout(() => setAudienceFlash(false), 1200);
  };

  const applySetup = (patch: Partial<SetupValues>) => {
    setSetup((s) => {
      const next = { ...s, ...patch };
      if (patch.tags) next.tags = mergeTags(s.tags, patch.tags);
      return next;
    });
    const flashed = Object.fromEntries(
      Object.keys(patch).map((k) => [k, true])
    ) as Partial<Record<keyof SetupValues, boolean>>;
    setHighlight(flashed);
    window.setTimeout(() => setHighlight({}), 1200);
  };

  /** Plots a content suggestion — subject, pre-header, template — onto the form. */
  const applyContent = (patch: Partial<ContentValues>) => {
    setContent((c) => ({ ...c, ...patch }));
    const flashed = Object.fromEntries(
      Object.keys(patch).map((k) => [k, true])
    ) as Partial<Record<keyof ContentValues, boolean>>;
    setContentHighlight(flashed);
    window.setTimeout(() => setContentHighlight({}), 1200);
  };

  /** Opens a brand-new co-marketer thread, from either header CTA. */
  const openFreshChat = () => {
    audienceChat.current = false;
    setChatTopic(null);
    setFollowUpTopic(null);
    setFollowUpSeq(0);
    setChatSession((n) => n + 1);
    setChatOpen(true);
  };

  /** Drops a topic into the docked chat, opening it if it isn't up yet. */
  const openTopic = (topic: SeededTopic, fromAudienceStep = false) => {
    audienceChat.current = fromAudienceStep;
    if (chatOpen) {
      setFollowUpTopic(topic);
      setFollowUpSeq((n) => n + 1);
      return;
    }
    setChatTopic(topic);
    setChatSession((n) => n + 1);
    setChatOpen(true);
  };

  /** A preview finding, as a thread the co-marketer is already answering. */
  const findingTopic = (finding: Finding): SeededTopic => {
    const action = finding.action;
    const patchText = () => {
      const sp = action?.schedulePatch;
      const cp = action?.contentPatch;
      if (sp?.mode === "optimize") return "Optimised per contact, inside the next 24 hours";
      if (sp?.mode === "later" && sp.sendAt) return describeSlot(sp.sendAt);
      if (sp?.skipFrequencyCap === false) return "Respect the account frequency cap";
      if (sp?.sliceGapMins) return `${sp.sliceGapMins} minutes between batches`;
      if (cp?.subject) return cp.subject;
      if (cp?.preHeader) return cp.preHeader;
      if (cp?.templateId) {
        const t = emailTemplates.find((x) => x.id === cp.templateId);
        return t ? `${t.name} (Id: ${t.id})` : "Recommended template";
      }
      return undefined;
    };

    return {
      prompt: finding.askLabel,
      navLabel: finding.category,
      reply:
        `${finding.detail}\n\n**Evidence** — ${finding.evidence}\n\n` +
        (action
          ? "I can fix it from here, or you can open the step and do it by hand."
          : `This one needs the ${finding.link.stepLabel} step — open it and I'll stay on this thread while you change it.`),
      setupApplyCard: action
        ? {
            kind: action.kind,
            title: finding.title,
            applyLabel: action.label,
            appliedLabel: "Applied",
            blurb: finding.impact,
            text: patchText(),
            contentPatch: action.contentPatch,
            schedulePatch: action.schedulePatch,
          }
        : undefined,
    };
  };

  /* Co-marketer chat — docked column. Opened from a suggestion card (seeded
     on that prompt), from a preview finding, or from "Ask co-marketer" in
     either header. Rendered beside whichever screen is up. */
  const chatColumn = chatOpen ? (
    <div className="flex h-full min-h-0 w-[474px] shrink-0 justify-end overflow-hidden py-3">
      <ChatInterface
        key={chatSession}
        initialExpanded={false}
        docked
        conversationVariant="campaigns"
        initialTopic={chatTopic ?? undefined}
        followUpTopic={followUpTopic}
        followUpSeq={followUpSeq}
        onSetupApply={(card, cohortId) => {
          const cohort = card.cohorts?.find((c) => c.id === cohortId);
          if (cohort) {
            applyCohort(cohort);
            return;
          }
          if (card.contentPatch) {
            applyContent(card.contentPatch);
            return;
          }
          if (card.schedulePatch) {
            setSchedule((s) => ({ ...s, ...card.schedulePatch }));
            return;
          }
          if (card.patch) applySetup(card.patch);
        }}
        isSetupApplyApplied={(card) =>
          card.contentPatch
            ? isContentPatchApplied(card.contentPatch, content)
            : card.schedulePatch
              ? isSchedulePatchApplied(card.schedulePatch, schedule)
              : card.patch
                ? isPatchApplied(card.patch, setup)
                : false
        }
        appliedCohortId={audience.cohortId}
        enabledAgents={enabledAgents}
        setEnabledAgents={setEnabledAgents}
        onCloseInterface={() => {
          audienceChat.current = false;
          setChatOpen(false);
          setChatTopic(null);
        }}
      />
    </div>
  ) : null;

  const Icon = CHANNEL_ICONS[channel] ?? Mail;
  const activeStep = STEPS[activeIndex];
  const isLastStep = activeIndex === STEPS.length - 1;
  const goal = goalLabel(setup.goal);
  // The suggestion rail stays closed until the campaign has a goal — before
  // that there's nothing for the co-marketer to be relevant about — and stands
  // down whenever the chat is docked, so the co-marketer is only ever in one
  // place. Closing the chat brings the rail back, which is the way back into
  // the conversation on a step whose thread has already been dismissed.
  const showAIPanel = Boolean(goal) && !chatOpen;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Create ${channel} campaign`}
      className={cn(
        "campaign-create-shell fixed inset-0 z-[60] flex flex-col bg-[#F4F8FF]",
        "transition-transform duration-[380ms] ease-[cubic-bezier(0.22,1,0.36,1)]",
        "motion-reduce:transition-none",
        shown ? "translate-y-0" : "translate-y-full"
      )}
    >
      {previewOpen ? (
        <CampaignPreview
          campaignId="1234"
          setup={setup}
          audience={audience}
          content={content}
          schedule={schedule}
          onBack={() => setPreviewOpen(false)}
          onPublish={onClose}
          onEditStep={(stepId) => {
            const index = STEPS.findIndex((s) => s.id === stepId);
            if (index >= 0) setActiveIndex(index);
            setPreviewOpen(false);
          }}
          onAskCoMarketer={openFreshChat}
          onAskFinding={(finding) => openTopic(findingTopic(finding))}
          chatOpen={chatOpen}
          chatSlot={chatColumn}
        />
      ) : (
        <>
      <CampaignCreationNavbar
        campaignName={goal ?? `Untitled ${channel} campaign`}
        icon={Icon}
        nextLabel={isLastStep ? "Preview" : "Next step"}
        onAskCoMarketer={openFreshChat}
        onSave={onClose}
        onNextStep={() =>
          isLastStep ? setPreviewOpen(true) : setActiveIndex((i) => i + 1)
        }
        onClose={onClose}
      />

      <CampaignCreationStepper
        steps={STEPS}
        activeIndex={activeIndex}
        campaignId="1234"
        lastSaved="just now"
        onStepSelect={setActiveIndex}
      />

      <div className={cn("flex min-h-0 flex-1 gap-5 pl-14", chatOpen ? "pr-5" : "pr-14")}>
        <div className="scroll-slim min-w-0 flex-1 overflow-y-auto py-6">
          {activeStep.id === "setup" ? (
            <CampaignSetupStep
              values={setup}
              highlight={highlight}
              onChange={(patch) => setSetup((s) => ({ ...s, ...patch }))}
            />
          ) : activeStep.id === "audience" ? (
            <CampaignAudienceStep
              values={audience}
              highlight={audienceFlash}
              onChange={(patch) => setAudience((a) => ({ ...a, ...patch }))}
            />
          ) : activeStep.id === "content" ? (
            <CampaignContentStep
              values={content}
              highlight={contentHighlight}
              onChange={(patch) => setContent((c) => ({ ...c, ...patch }))}
            />
          ) : (
            <CampaignScheduleStep
              values={schedule}
              onChange={(patch) => setSchedule((s) => ({ ...s, ...patch }))}
            />
          )}
        </div>

        {showAIPanel && (
          <CampaignAIPanel
            key={setup.goal}
            stepId={activeStep.id}
            goal={setup.goal}
            loading={!aiReady}
            values={setup}
            contentValues={content}
            scheduleValues={schedule}
            onAsk={(point) => {
              // "Audience options" re-runs the cuts rather than replaying a
              // canned answer, so it rebuilds the Segment agent's thread.
              const topic =
                point.key === "audience-cuts" ? audienceCutsTopic(setup.goal) : toSeeded(point);
              openTopic(topic, activeStep.id === "audience");
            }}
          />
        )}

        {chatColumn}
      </div>
        </>
      )}
    </div>
  );
}
