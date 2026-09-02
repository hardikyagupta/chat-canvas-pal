import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  BarChart3,
  Bell,
  Calendar,
  Check,
  ChevronDown,
  FileText,
  FlaskConical,
  Mail,
  Megaphone,
  MessageCircle,
  MessageSquare,
  Monitor,
  Percent,
  Sparkles,
  Tag,
  Target,
  Users,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import CampaignCreationNavbar from "./CampaignCreationNavbar";
import CampaignSettingsDrawer from "./CampaignSettingsDrawer";
import CampaignCreationIntro from "./CampaignCreationIntro";
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
  AudienceReachablePill,
  AudienceReachStat,
  EMPTY_AUDIENCE,
  reachFor,
  type AudienceValues,
} from "./CampaignAudienceStep";
import { cohortsForGoal, type AudienceCohort } from "./audienceCohorts.data";
import CampaignContentStep, {
  EMPTY_CONTENT,
  VariantTestSettingsStep,
  type ContentValues,
} from "./CampaignContentStep";
import CampaignScheduleStep, {
  EMPTY_SCHEDULE,
  defaultSendAt,
  describeSlot,
  type ScheduleValues,
} from "./CampaignScheduleStep";
import { emailTemplates } from "./emailTemplates.data";
import { SEGMENT_STARTERS } from "@/components/campaigns/SegmentSuggestions";
import SegmentCreationOverlay from "@/components/campaigns/segment-creation/SegmentCreationOverlay";
import type { Finding } from "./previewFindings.data";
import CampaignPreview from "./CampaignPreview";
import ChatInterface, {
  type SeededTopic,
  type StarterChip,
} from "@/components/ChatInterface";
import "./campaign-creation.css";
// The one-page accordion reuses the objective v2 card styling (.ov2-*) so both
// flows read the same; campaign-creation.css supplies the tokens it references.
import "@/components/decisioning/objective-v2/objective-flow-v2.css";

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
  { id: "audience", label: "Send to", icon: Users },
  { id: "content", label: "Message", icon: FileText },
  { id: "variantSettings", label: "Variant test settings", icon: FlaskConical },
  { id: "schedule", label: "Schedule & tracking", icon: Calendar },
];

/**
 * Contextual co-marketer chips per step — what "Ask co-marketer" opens with
 * while that card is the one on screen, instead of the generic home-page set.
 */
const STEP_CHIPS: Record<string, StarterChip[]> = {
  content: [
    {
      label: "Offer 50% off",
      icon: Percent,
      header: "Write a 50% off email",
      prompts: [
        "Write a subject line and email for a 50% off sale.",
        "Draft the body copy for a 50% off offer email.",
        "Suggest a pre-header that boosts opens for a 50% off email.",
      ],
    },
    {
      label: "End of season sale",
      icon: Tag,
      header: "Write an end-of-season sale email",
      prompts: [
        "Write a subject line for an end-of-season sale email.",
        "Draft the body copy for an end-of-season clearance email.",
        "What template style fits an end-of-season sale best?",
      ],
    },
    {
      label: "Announce season sale",
      icon: Megaphone,
      header: "Announce the season sale",
      prompts: [
        "Write an announcement email for our new season sale.",
        "Draft a subject line that builds excitement for the season sale.",
        "Suggest a pre-header for a season sale announcement.",
      ],
    },
  ],
  schedule: [
    {
      label: "Tracking recommendation",
      icon: BarChart3,
      header: "Get this campaign tracked",
      prompts: [
        "Do I need GA tracking on for this campaign?",
        "Which UTM parameters should this campaign carry?",
        "What will I lose in reporting if I leave tracking off?",
      ],
    },
    {
      label: "Track conversion goal",
      icon: Target,
      header: "Pick the conversion to measure",
      prompts: [
        "What conversion goal should I set for this campaign?",
        "Which event counts as success for a send like this?",
        "Should conversion tracking be on for this campaign?",
      ],
    },
  ],
};

/** Sub-line under each accordion header, before the step has a summary. */
const STEP_DESCRIPTIONS: Record<string, string> = {
  audience: "Select the target audience.",
  content: "Design the message which would go to your selected contacts.",
  variantSettings: "Configure how the winning variant is tested and picked.",
  schedule: "Decide when this send leaves, and what you want to track.",
};

/** Draft name every new campaign starts on: Untitled_YYYYMMDDHHMMSS, local time. */
function newCampaignName() {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return (
    `Untitled_${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}` +
    `${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`
  );
}

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
      `Scoring cohorts against "${label ?? "this campaign"}"`,
      "Checking channel reachability and consent",
      "Pairing each cut with the suppression it needs",
    ],
    reply:
      `I read your last 90 days of engagement against "${label ?? "this campaign"}" and pulled three cuts worth ` +
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
  // The Email flow opens on a goal prompt before the step-by-step wizard;
  // "Start from scratch" (or submitting a goal) is what gets past it.
  const [introOpen, setIntroOpen] = useState(true);
  // Which accordion card is open. -1 means every card is collapsed, which the
  // header toggle allows — the stepper's "current step" is now just this.
  const [activeIndex, setActiveIndex] = useState(0);
  // Steps the user has tapped "Done" on. Only these show the green check and
  // the inline summary when collapsed, same rule as the objective v2 flow.
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  // The step the co-marketer rail is answering for. Tracked separately from
  // activeIndex so collapsing every card doesn't blank the suggestions.
  const [railStepId, setRailStepId] = useState<string>("audience");
  // The campaign's own name — set once per open and only ever changed by the
  // navbar rename, so picking a goal no longer retitles the draft.
  const [campaignName, setCampaignName] = useState(newCampaignName);
  const [setup, setSetup] = useState<SetupValues>(EMPTY_SETUP);
  const [audience, setAudience] = useState<AudienceValues>(EMPTY_AUDIENCE);
  const [content, setContent] = useState<ContentValues>(EMPTY_CONTENT);
  const [schedule, setSchedule] = useState<ScheduleValues>(EMPTY_SCHEDULE);
  // Preview is the screen after the last step, not a fifth step — it replaces
  // the wizard chrome with its own header while the draft stays in state.
  const [previewOpen, setPreviewOpen] = useState(false);
  // Campaign-level settings (tags, for now) live in their own drawer off the
  // navbar rather than a step, since they don't belong to any one of them.
  const [settingsOpen, setSettingsOpen] = useState(false);
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
  // The docked chat can play either storyline: the campaign relay, or the
  // Segment agent's thread when an audience pill is picked. Both run in the
  // same column, so picking a pill never takes the user out of the wizard.
  const [chatVariant, setChatVariant] = useState<"campaigns" | "segments">("campaigns");
  const [chatMessage, setChatMessage] = useState<string>();
  // A segment starting point was picked from the audience pills — opens the
  // same segment creation canvas the Segments page uses, on that ask.
  const [segmentPrompt, setSegmentPrompt] = useState<string>();
  // The audience thread seeds once per wizard open, not every time the step is
  // revisited — coming back shouldn't wipe what the user already discussed.
  const audienceSeeded = useRef(false);
  // Whether the open chat is the audience thread — it closes when the step does.
  const audienceChat = useRef(false);
  // Scroll container + per-card nodes, so opening a card can bring its header
  // up to the top of the canvas.
  const canvasRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<Record<string, HTMLElement | null>>({});

  useEffect(() => {
    if (open) {
      setMounted(true);
      // Each new draft gets its own timestamped name.
      setCampaignName(newCampaignName());
      return;
    }
    setShown(false);
    const id = setTimeout(() => {
      setMounted(false);
      setChatOpen(false);
      setChatTopic(null);
      setChatVariant("campaigns");
      setChatMessage(undefined);
      setFollowUpTopic(null);
      setFollowUpSeq(0);
      // Reset only after the panel is gone, so the exit slide doesn't show the
      // wizard snapping back to step 1.
      setIntroOpen(true);
      setActiveIndex(0);
      setCompletedSteps(new Set());
      setRailStepId("audience");
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

  // Keep the rail pointed at the last card the user opened.
  useEffect(() => {
    if (activeIndex >= 0) setRailStepId(STEPS[activeIndex].id);
  }, [activeIndex]);

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

  // Landing on Audience opens the co-marketer, but it doesn't answer anything
  // yet — the thread offers the segment starting points as pills and waits.
  useEffect(() => {
    if (!open || STEPS[activeIndex]?.id !== "audience") return;
    if (audienceSeeded.current) return;
    audienceSeeded.current = true;
    audienceChat.current = true;
    // Previously seeded the Segment agent's cuts thread here:
    // setChatTopic(audienceCutsTopic(setup.goal));
    setChatVariant("campaigns");
    setChatMessage(undefined);
    setChatTopic(null);
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
    const openId = STEPS[activeIndex]?.id;
    // Every card collapsed isn't "moved on" — the thread stays until another
    // step is actually opened.
    if (!open || !openId || openId === "audience" || !audienceChat.current) return;
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
        {
          id: `cohort-${cohort.id}`,
          name: cohort.name,
          reach: cohort.reachable,
          ai: true,
          rationale: {
            status: "Draft",
            members: cohort.matched,
            conditions: cohort.signals,
            why: `${cohort.why} ${cohort.matched.toLocaleString("en-US")} contacts match, of which ${cohort.reachable.toLocaleString("en-US")} are reachable after consent and suppression checks. This cut converts at ${cohort.cvr} historically.`,
          },
        },
      ],
      excludeEnabled: true,
      excludeSegments: [
        {
          id: `suppress-${cohort.id}`,
          name: cohort.exclude.name,
          reach: cohort.exclude.reach,
          ai: true,
          rationale: {
            status: "Draft",
            members: cohort.exclude.reach,
            conditions: [cohort.exclude.name],
            why: "Held back so this campaign doesn't land on contacts who are already being messaged — it keeps the send from competing with itself.",
          },
        },
      ],
      cohortId: cohort.id,
    }));
    setAudienceFlash(true);
    window.setTimeout(() => setAudienceFlash(false), 1200);
  };

  /** Segment saved on the canvas — plot it straight onto the audience form. */
  const plotSavedSegment = (saved: { name: string; count: string; aiGenerated: boolean }) => {
    const reach = Number(String(saved.count).replace(/,/g, "")) || 0;
    setAudience((a) => ({
      ...a,
      mode: "segments",
      segments: [{ id: `seg-${Date.now()}`, name: saved.name, reach, ai: saved.aiGenerated }],
    }));
    setAudienceFlash(true);
    window.setTimeout(() => setAudienceFlash(false), 1200);
  };

  /**
   * Audience pills — the same four starting points the Segments page offers.
   * Picking one replays the Segment agent's thread for that ask in the docked
   * chat, so the wizard stays exactly where it is.
   */
  const audienceChips: StarterChip[] = SEGMENT_STARTERS.map((starter) => ({
    label: starter.title,
    icon: Users,
    onSelect: () => {
      audienceChat.current = true;
      setChatVariant("segments");
      setChatMessage(starter.prompt);
      setChatTopic(null);
      setFollowUpTopic(null);
      setFollowUpSeq(0);
      setChatSession((n) => n + 1);
      setChatOpen(true);
      // Previously handed off to the full-screen segment canvas:
      // setSegmentPrompt(starter.prompt);
    },
  }));

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

  /** Brings a card's header to the top of the canvas once it has opened. */
  const scrollToStep = (id: string) => {
    const container = canvasRef.current;
    const el = cardRefs.current[id];
    if (!container || !el) return;
    const top =
      container.scrollTop +
      (el.getBoundingClientRect().top - container.getBoundingClientRect().top) -
      12;
    container.scrollTo({ top, behavior: "smooth" });
  };

  /** Accordion header: open a card, or shut it if it's already the open one. */
  const toggleStep = (index: number) =>
    setActiveIndex((current) => (current === index ? -1 : index));

  /** "Done" on a card: mark it finished and open the next one. */
  const completeStep = (index: number) => {
    setCompletedSteps((prev) => new Set(prev).add(STEPS[index].id));
    const next = index + 1;
    if (next >= STEPS.length) {
      setActiveIndex(-1);
      return;
    }
    setActiveIndex(next);
    // Let the collapse/expand transition run before chasing the new position.
    window.setTimeout(() => scrollToStep(STEPS[next].id), 380);
  };

  /** Has this step got enough on it to read as done? */
  const isStepComplete = (id: string): boolean => {
    switch (id) {
      case "audience":
        return reachFor(audience) > 0;
      case "content":
        return Boolean(content.subject || content.templateId);
      // Nothing here is required — the goal question is out, and a send
      // time always has a default.
      case "schedule":
        return true;
      default:
        return false;
    }
  };

  /** One-line recap shown on a finished card while it's collapsed. */
  const summaryFor = (id: string): ReactNode => {
    switch (id) {
      case "audience": {
        const reachable = `${reachFor(audience).toLocaleString()} reachable`;
        if (audience.mode === "segments") {
          if (audience.segments.length === 0) return `No segment selected · ${reachable}`;
          return (
            <span className="inline-flex min-w-0 items-center gap-1.5 overflow-hidden">
              {audience.segments.map((s) => (
                <span
                  key={s.id}
                  className="inline-flex shrink-0 items-center gap-1 rounded-full border border-[#DDE2EE] bg-white px-2 py-0.5 text-[11px] font-semibold text-[#17173A]"
                >
                  {s.ai && <Sparkles className="size-2.5 shrink-0 text-[#7B5CFA]" strokeWidth={2.2} />}
                  {s.name}
                </span>
              ))}
              <span className="shrink-0 font-semibold text-[#17173A]">· {reachable}</span>
            </span>
          );
        }
        const who =
          audience.mode === "all"
            ? "All contacts"
            : audience.mode === "table"
              ? audience.table || "No table selected"
              : `${audience.conditions.length} condition${audience.conditions.length === 1 ? "" : "s"}`;
        return `${who} · ${reachable}`;
      }
      case "content": {
        const template = emailTemplates.find((t) => t.id === content.templateId);
        return (
          [content.subject, template?.name].filter(Boolean).join(" · ") || "Nothing written yet"
        );
      }
      case "schedule": {
        const when =
          schedule.mode === "now"
            ? "As soon as this is published"
            : schedule.mode === "later"
              ? describeSlot(schedule.sendAt)
              : schedule.mode === "slice"
                ? `${schedule.sliceBatches} batches, ${schedule.sliceGapMins} minutes apart`
                : `Optimised per contact · ${schedule.optimizeWindow}`;
        const goalBits = [
          setup.gaTracking ? "GA tracking on" : null,
          setup.conversionTracking ? "Conversion tracking on" : null,
        ].filter(Boolean);
        return [when, ...goalBits].join(" · ");
      }
      default:
        return "";
    }
  };

  /** Opens a brand-new co-marketer thread, from either header CTA. */
  const openFreshChat = () => {
    audienceChat.current = railStepId === "audience";
    setChatVariant("campaigns");
    setChatMessage(undefined);
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
    setChatVariant("campaigns");
    setChatMessage(undefined);
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
        conversationVariant={chatVariant}
        initialMessage={chatMessage}
        starterChipSet={railStepId === "audience" ? audienceChips : STEP_CHIPS[railStepId]}
        initialTopic={chatTopic ?? undefined}
        // A segment the agent built — plot it onto the audience form rather
        // than leaving the wizard for the segment canvas.
        onReviewArtifact={(card) => {
          const reach = Number(String(card.stats?.[0]?.label ?? "").replace(/[^0-9]/g, "")) || 0;
          setAudience((a) => ({
            ...a,
            mode: "segments",
            segments: [
              {
                id: `seg-${Date.now()}`,
                name: card.title,
                reach,
                ai: true,
                rationale: {
                  status: "Draft",
                  members: reach,
                  conditions: card.conditions,
                  why: card.description,
                },
              },
            ],
          }));
          setAudienceFlash(true);
          window.setTimeout(() => setAudienceFlash(false), 1200);
        }}
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
          setChatVariant("campaigns");
          setChatMessage(undefined);
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
      {channel === "Email" && introOpen ? (
        <CampaignCreationIntro
          onContinue={() => {
            setIntroOpen(false);
            // Co-marketer stays open by default going into the wizard —
            // the intro screen was already a co-marketer prompt.
            openFreshChat();
          }}
          onClose={onClose}
        />
      ) : previewOpen ? (
        <CampaignPreview
          campaignId="1234"
          campaignName={campaignName}
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
        campaignName={campaignName}
        icon={Icon}
        // Every step is on the page now, so the primary action is the end of
        // the flow rather than the next step.
        nextLabel="Send"
        // Previous, stepper-driven CTA:
        // nextLabel={isLastStep ? "Preview" : "Next step"}
        onRenameCampaign={setCampaignName}
        onOpenSettings={() => setSettingsOpen(true)}
        onAskCoMarketer={openFreshChat}
        onSave={onClose}
        onNextStep={() => setPreviewOpen(true)}
        // Previous, stepper-driven handler:
        // onNextStep={() => (isLastStep ? setPreviewOpen(true) : setActiveIndex((i) => i + 1))}
        onClose={onClose}
      />

      {/* Step rail — replaced by the accordion below. Kept for reference.
      <CampaignCreationStepper
        steps={STEPS}
        activeIndex={activeIndex}
        campaignId="1234"
        lastSaved="just now"
        onStepSelect={setActiveIndex}
      />
      */}

      <div className={cn("flex min-h-0 flex-1 gap-5 pl-14", chatOpen ? "pr-5" : "pr-14")}>
        <div ref={canvasRef} className="scroll-slim min-w-0 flex-1 overflow-y-auto py-6">
          <div className="cc-accordion ov2-accordion">
            {STEPS.map((step, index) => {
              // Only relevant once the Message step has more than one
              // variant to test against each other.
              if (step.id === "variantSettings" && content.variants.length <= 1) return null;

              const StepIcon = step.icon;
              const active = index === activeIndex;
              const complete =
                !active && completedSteps.has(step.id) && isStepComplete(step.id);
              const state = active ? "active" : complete ? "complete" : "idle";

              return (
                <section
                  key={step.id}
                  ref={(el) => (cardRefs.current[step.id] = el)}
                  data-step-id={step.id}
                  className={`ov2-card ${state}`}
                >
                  <div
                    role="button"
                    tabIndex={0}
                    className="ov2-card-header"
                    aria-expanded={active}
                    onClick={() => toggleStep(index)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        toggleStep(index);
                      }
                    }}
                  >
                    <span className="ov2-badge">
                      {complete ? <Check /> : <StepIcon />}
                    </span>
                    <span className="ov2-card-label">
                      <strong>{step.label}</strong>
                      {step.id === "audience" ||
                      step.id === "content" ||
                      step.id === "variantSettings" ||
                      step.id === "schedule" ? (
                        active && (
                          <span className="ov2-card-desc">{STEP_DESCRIPTIONS[step.id]}</span>
                        )
                      ) : complete ? (
                        <span className="ov2-card-summary">{summaryFor(step.id)}</span>
                      ) : (
                        <span className="ov2-card-desc">{STEP_DESCRIPTIONS[step.id]}</span>
                      )}
                    </span>
                    {/* Only while collapsed — once expanded, the same count
                        moves into the card body next to the mode picker. */}
                    {step.id === "audience" && !active && (
                      <div onClick={(e) => e.stopPropagation()}>
                        <AudienceReachablePill reach={reachFor(audience)} />
                      </div>
                    )}
                    <ChevronDown className="ov2-chevron" />
                  </div>

                  <div className={`ov2-card-bodywrap${active ? " open" : ""}`}>
                    <div className="ov2-card-bodywrap-inner">
                      <div className="ov2-card-body">
                        {step.id === "audience" && (
                          <div className="flex items-start justify-between gap-6">
                            <div className="min-w-0 flex-1">
                              <CampaignAudienceStep
                                values={audience}
                                highlight={audienceFlash}
                                onChange={(patch) => setAudience((a) => ({ ...a, ...patch }))}
                              />
                            </div>
                            {/* Sits outside CampaignAudienceStep's own StepCard so
                                it reaches the accordion row's true right edge
                                instead of being capped by the card's own max-width. */}
                            <div className="shrink-0">
                              <AudienceReachStat reach={reachFor(audience)} />
                            </div>
                          </div>
                        )}
                        {step.id === "content" && (
                          <CampaignContentStep
                            values={content}
                            highlight={contentHighlight}
                            onChange={(patch) => setContent((c) => ({ ...c, ...patch }))}
                            chatOpen={chatOpen}
                            reach={reachFor(audience)}
                          />
                        )}
                        {step.id === "variantSettings" && (
                          <VariantTestSettingsStep
                            values={content}
                            onChange={(patch) => setContent((c) => ({ ...c, ...patch }))}
                          />
                        )}
                        {step.id === "schedule" && (
                          <>
                            <CampaignScheduleStep
                              values={schedule}
                              onChange={(patch) => setSchedule((s) => ({ ...s, ...patch }))}
                            />
                            <div className="mt-8">
                              <CampaignSetupStep
                                values={setup}
                                highlight={highlight}
                                onChange={(patch) => setSetup((s) => ({ ...s, ...patch }))}
                              />
                            </div>
                          </>
                        )}

                        {index < STEPS.length - 1 && (
                          <div className="ov2-card-actions">
                            <Button type="button" onClick={() => completeStep(index)}>
                              Done
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </section>
              );
            })}
          </div>

          {/* One step at a time, driven by the rail above. Replaced by the
              accordion; kept for reference.
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
          */}
        </div>

        {/* Standing suggestion rail — not part of phase 1. The co-marketer now
            leads with the open step's chips inside the chat instead.
        {showAIPanel && (
          <CampaignAIPanel
            key={setup.goal}
            stepId={railStepId}
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
              openTopic(topic, railStepId === "audience");
            }}
          />
        )}
        */}

        {chatColumn}
      </div>
        </>
      )}

      <CampaignSettingsDrawer
        open={settingsOpen}
        tags={setup.tags}
        onChangeTags={(tags) => setSetup((s) => ({ ...s, tags }))}
        onClose={() => setSettingsOpen(false)}
      />

      {/* Segment creation canvas — an audience pill used to hand off to the
          full-screen Segments experience. It now plays in the docked chat
          instead, so the wizard is never replaced mid-campaign.
      <SegmentCreationOverlay
        open={segmentPrompt !== undefined}
        segment={null}
        initialPrompt={segmentPrompt}
        onSaved={plotSavedSegment}
        onClose={() => setSegmentPrompt(undefined)}
      />
      */}
    </div>
  );
}
