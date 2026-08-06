import React from 'react';
import { createPortal } from 'react-dom';
import {
  Check,
  X,
  Mail,
  TrendingUp,
  RefreshCw,
  SlidersHorizontal,
  MousePointerClick,
  Rocket,
  BarChart3,
  MoreHorizontal,
  Lightbulb,
  Clock,
  ClipboardCheck,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  ChevronRight,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const FONT = { fontFamily: 'Manrope, sans-serif' } as const;

export interface PersonalizeCoMarketerData {
  role: string | null;
  goals: string[];
  metrics: string[];
  aiPreferences: string[];
}

interface PersonalizeCoMarketerModalProps {
  open: boolean;
  onClose: () => void;
  /** Fired on "Save preferences" (final step) with everything picked so far. */
  onComplete: (data: PersonalizeCoMarketerData) => void;
  /** Skip the intro/welcome screen and open straight on the form steps
      (used when editing already-saved preferences). */
  startInSteps?: boolean;
  /** Pre-fill the form with previously saved answers (edit mode). */
  initialData?: PersonalizeCoMarketerData | null;
}

interface StepDef {
  title: string;
  hint?: (data: PersonalizeCoMarketerData) => string;
  options: string[];
  /** Selection cap for goals/metrics ("Select up to 3"); undefined = unlimited. */
  max?: number;
  continueLabel: string;
}

const ROLE_OPTIONS = [
  'CRM marketer',
  'Growth manager',
  'Lifecycle marketer',
  'Marketing ops',
  'Product engagement',
  'Business owner',
  'Analyst',
  'Other',
];

/** Icon shown on each role card (single-select step renders as a card grid). */
const ROLE_ICONS: Record<string, LucideIcon> = {
  'CRM marketer': Mail,
  'Growth manager': TrendingUp,
  'Lifecycle marketer': RefreshCw,
  'Marketing ops': SlidersHorizontal,
  'Product engagement': MousePointerClick,
  'Business owner': Rocket,
  Analyst: BarChart3,
  Other: MoreHorizontal,
};

const GOAL_OPTIONS = [
  'Revenue growth',
  'Campaign performance',
  'Journey health',
  'Retention',
  'Deliverability',
  'Web & in-app engagement',
  'Personalization',
  'Funnel conversion',
];

const METRIC_OPTIONS = [
  'Revenue',
  'Conversions',
  'Open rate',
  'CTR',
  'Delivered',
  'Drop-offs',
  'Repeat purchases',
  'Active users',
  'Churn risk',
];

const AI_PREFERENCE_OPTIONS = [
  'Show me what needs attention',
  'Recommend what to do next',
  'Explain why performance changed',
  'Help me create campaigns',
  'Help me optimize journeys',
  'Alert me when something breaks',
];

/** Capped multi-select hint — invites up front, then reflects the live count
    (no redundant "3" repeated): "Pick up to 3" → "2 of 3 selected". */
const capHint = (count: number, max: number) =>
  count === 0 ? `Pick up to ${max}` : `${count} of ${max} selected`;

const STEPS: StepDef[] = [
  { title: 'What best describes your role?', options: ROLE_OPTIONS, continueLabel: 'Continue' },
  {
    title: 'What are you trying to improve right now?',
    hint: (d) => capHint(d.goals.length, 3),
    options: GOAL_OPTIONS,
    max: 3,
    continueLabel: 'Continue',
  },
  {
    title: 'Which metrics do you track most often?',
    hint: (d) => capHint(d.metrics.length, 3),
    options: METRIC_OPTIONS,
    max: 3,
    continueLabel: 'Continue',
  },
  {
    title: 'How should Co-marketer help you?',
    hint: () => 'Select all that apply',
    options: AI_PREFERENCE_OPTIONS,
    continueLabel: 'Save preferences',
  },
];

const EMPTY_DATA: PersonalizeCoMarketerData = { role: null, goals: [], metrics: [], aiPreferences: [] };

/** Intro-screen value props (LHS), matching the Figma feature list. */
const INTRO_FEATURES: { icon: LucideIcon; title: string; desc: string }[] = [
  { icon: TrendingUp, title: 'Sharper insights', desc: 'See what matters most to your goals.' },
  { icon: Lightbulb, title: 'Better recommendations', desc: 'Get more relevant next steps and ideas.' },
  { icon: Clock, title: 'Less setup later', desc: "We'll tailor your workspace as you go." },
];

/** RHS illustration — a mock "Prioritized insights" panel built from components
    (the Figma ships it as a flat image; this keeps it crisp and theme-aware). */
function IntroIllustration() {
  return (
    <div className="relative hidden w-[360px] shrink-0 sm:block">
      <div className="flex h-full flex-col justify-center gap-[14px] rounded-[16px] border border-[#E6EAF3] bg-[#F5F7FB] p-[16px]">
        {/* Card 1 — Prioritized insights */}
        <div className="intro-card-in rounded-[12px] border border-[#EDF0F6] bg-white p-[14px]" style={{ animationDelay: '0s' }}>
          <div className="mb-[12px] flex items-center gap-[8px]">
            <BarChart3 className="size-[16px] text-[#2F68E5]" strokeWidth={2.2} />
            <span className="text-[12px] font-semibold text-[#17173A]" style={FONT}>
              Prioritized insights
            </span>
          </div>
          <div className="flex flex-col gap-[11px]">
            {[
              { pct: '12%', up: true },
              { pct: '8%', up: true },
              { pct: '4%', up: false },
            ].map((row, i) => (
              <div key={i} className="flex items-center gap-[10px]">
                <span className="size-[14px] shrink-0 rounded-[4px] bg-[#E7EAF2]" />
                <span className="h-[6px] flex-1 overflow-hidden rounded-full bg-[#EDF0F6]">
                  <span
                    className="intro-bar-fill block h-full w-full rounded-full"
                    style={{ animationDelay: `${i * 0.35}s` }}
                  />
                </span>
                <div
                  className="intro-trend-pop flex w-[42px] shrink-0 items-center justify-end gap-[3px]"
                  style={{ animationDelay: `${i * 0.35}s` }}
                >
                  {row.up ? (
                    <ArrowUpRight className="size-[13px] text-[#1F9D57]" strokeWidth={2.4} />
                  ) : (
                    <ArrowDownRight className="size-[13px] text-[#E5484D]" strokeWidth={2.4} />
                  )}
                  <span
                    className={cn('text-[11px] font-semibold', row.up ? 'text-[#1F9D57]' : 'text-[#E5484D]')}
                    style={FONT}
                  >
                    {row.pct}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Card 2 — Recommended next steps */}
        <div className="intro-card-in rounded-[12px] border border-[#EDF0F6] bg-white p-[14px]" style={{ animationDelay: '0.6s' }}>
          <div className="mb-[12px] flex items-center gap-[8px]">
            <ClipboardCheck className="size-[16px] text-[#2F68E5]" strokeWidth={2.2} />
            <span className="text-[12px] font-semibold text-[#17173A]" style={FONT}>
              Recommended next steps
            </span>
          </div>
          <div className="flex flex-col gap-[12px]">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex items-center gap-[10px]">
                <span
                  className="intro-step-ring flex size-[14px] shrink-0 items-center justify-center rounded-full border-[1.5px] border-[#D5DAE6]"
                  style={{ animationDelay: `${i * 0.5}s` }}
                >
                  <Check
                    className="intro-step-check size-[9px] text-white"
                    strokeWidth={3.2}
                    style={{ animationDelay: `${i * 0.5}s` }}
                  />
                </span>
                <span className="h-[6px] flex-1 overflow-hidden rounded-full bg-[#EDF0F6]">
                  <span
                    className="intro-bar-fill block h-full w-full rounded-full"
                    style={{ animationDelay: `${0.4 + i * 0.35}s` }}
                  />
                </span>
                <ChevronRight
                  className="intro-chevron-nudge size-[14px] shrink-0 text-[#C0C6D4]"
                  strokeWidth={2.2}
                  style={{ animationDelay: `${i * 0.25}s` }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Card 3 — Focus areas */}
        <div className="intro-card-in rounded-[12px] border border-[#EDF0F6] bg-white p-[14px]" style={{ animationDelay: '1.2s' }}>
          <div className="mb-[12px] flex items-center gap-[8px]">
            <Target className="size-[16px] text-[#2F68E5]" strokeWidth={2.2} />
            <span className="text-[12px] font-semibold text-[#17173A]" style={FONT}>
              Focus areas
            </span>
          </div>
          <div className="flex flex-wrap gap-[8px]">
            {['Engagement', 'Content', 'Activation'].map((chip, i) => (
              <span
                key={chip}
                className="intro-chip-pop rounded-[8px] bg-[#EAF0FF] px-[12px] py-[6px] text-[11px] font-semibold text-[#2F68E5]"
                style={{ ...FONT, animationDelay: `${i * 0.4}s` }}
              >
                {chip}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Selection indicator with shape semantics:
 *  - multi-select steps → square checkbox with a checkmark when picked
 *  - single-select (role) → round radio with an inner dot when picked
 * The glyph scales in so selecting an option feels responsive.
 */
function OptionIndicator({ selected, multi }: { selected: boolean; multi: boolean }) {
  return (
    <span
      className={cn(
        'flex size-[18px] shrink-0 items-center justify-center border-[1.5px] transition-colors',
        multi ? 'rounded-[5px]' : 'rounded-full',
        selected ? 'border-[#2F68E5] bg-[#2F68E5]' : 'border-[#DDE2EE] bg-transparent'
      )}
    >
      {selected &&
        (multi ? (
          <Check className="size-[12px] text-white motion-safe:animate-in motion-safe:zoom-in-50" strokeWidth={3} />
        ) : (
          <span className="size-[7px] rounded-full bg-white motion-safe:animate-in motion-safe:zoom-in-50" />
        ))}
    </span>
  );
}

function OptionButton({
  label,
  selected,
  multi,
  disabled,
  onClick,
}: {
  label: string;
  selected: boolean;
  multi: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'flex w-full items-center gap-[10px] rounded-[8px] border px-[16px] py-[14px] text-left transition-colors motion-safe:active:scale-[0.99]',
        selected
          ? 'border-[1.5px] border-[#2F68E5] bg-[#F0F5FF]'
          : 'border-[#DDE2EE] bg-white hover:bg-[#F7F9FC]',
        disabled && !selected && 'cursor-not-allowed opacity-50 hover:bg-white'
      )}
    >
      <OptionIndicator selected={selected} multi={multi} />
      <span
        className={cn('flex-1 text-[13px] text-[#17173A]', selected ? 'font-semibold' : 'font-medium')}
        style={FONT}
      >
        {label}
      </span>
    </button>
  );
}

/**
 * Role card — single-select identity picker rendered as a tile: an icon badge,
 * the role label, and a radio in the top-right corner (matches the onboarding
 * card pattern). Selected = blue border + tint + filled radio.
 */
function RoleCard({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  const Icon = ROLE_ICONS[label] ?? MoreHorizontal;
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'group flex h-full w-full flex-col overflow-hidden rounded-[12px] border text-left transition-colors motion-safe:active:scale-[0.99]',
        selected ? 'border-[1.5px] border-[#2F68E5]' : 'border-[#DDE2EE] hover:border-[#C3D2F2]'
      )}
    >
      {/* Top — icon centered, radio in the top-right corner (per Figma) */}
      <div
        className={cn(
          'relative flex flex-1 items-center justify-center px-[16px] py-[22px] transition-colors',
          selected ? 'bg-[#F0F5FF]' : 'bg-white'
        )}
      >
        <span
          className={cn(
            'absolute right-[10px] top-[10px] flex size-[18px] items-center justify-center rounded-full border-[1.5px] transition-colors',
            selected ? 'border-[#2F68E5] bg-[#2F68E5]' : 'border-[#DDE2EE] bg-transparent'
          )}
        >
          {selected && (
            <span className="size-[7px] rounded-full bg-white motion-safe:animate-in motion-safe:zoom-in-50" />
          )}
        </span>
        {/* Icon stays a single neutral grey in every state — selection is shown
            by the card border, radio, and footer tint, not the icon color. */}
        <span className="flex size-[46px] items-center justify-center rounded-[12px] bg-[#EEF1F8] text-[#5B6B8F]">
          <Icon className="size-[24px]" strokeWidth={2} />
        </span>
      </div>
      {/* Footer — label strip */}
      <div
        className={cn(
          'w-full border-t px-[14px] py-[11px] transition-colors',
          selected ? 'border-[#CFE0FF] bg-[#E9F0FF]' : 'border-[#EDEFF4] bg-[#F6F8FB]'
        )}
      >
        <span
          className={cn(
            'block text-center text-[13px] leading-[17px] text-[#17173A]',
            selected ? 'font-semibold' : 'font-medium'
          )}
          style={FONT}
        >
          {label}
        </span>
      </div>
    </button>
  );
}

/**
 * 4-step "Personalize Co-Marketer" onboarding modal (Figma node 5442:3829).
 * Skippable at any step; only the final step persists via onComplete.
 */
const PersonalizeCoMarketerModal: React.FC<PersonalizeCoMarketerModalProps> = ({
  open,
  onClose,
  onComplete,
  startInSteps = false,
  initialData = null,
}) => {
  // `started` gates the intro/welcome screen in front of the stepper — the flow
  // opens on a single "what this is" page, then reveals the steps on Get started.
  // In edit mode (startInSteps) we skip the intro and pre-fill saved answers.
  const [started, setStarted] = React.useState(false);
  const [stepIndex, setStepIndex] = React.useState(0);
  const [data, setData] = React.useState<PersonalizeCoMarketerData>(EMPTY_DATA);

  React.useEffect(() => {
    if (open) {
      setStarted(startInSteps);
      setStepIndex(0);
      setData(initialData ?? EMPTY_DATA);
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps -- reset only on open transition

  // The modal unmounts while closed (`if (!open) return null` below), so the
  // card/backdrop replay their CSS enter animation every time it reopens.

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const step = STEPS[stepIndex];
  const isRoleStep = stepIndex === 0;
  const isLastStep = stepIndex === STEPS.length - 1;
  const isMultiStep = !isRoleStep; // role = single-select radio; the rest = multi-select checkbox
  const gridSize = isLastStep ? 1 : 2;

  const toggleMulti = (list: string[], value: string, max?: number): string[] => {
    if (list.includes(value)) return list.filter((v) => v !== value);
    if (max !== undefined && list.length >= max) return list;
    return [...list, value];
  };

  const handleSelect = (option: string) => {
    setData((prev) => {
      if (isRoleStep) return { ...prev, role: prev.role === option ? null : option };
      if (stepIndex === 1) return { ...prev, goals: toggleMulti(prev.goals, option, step.max) };
      if (stepIndex === 2) return { ...prev, metrics: toggleMulti(prev.metrics, option, step.max) };
      return { ...prev, aiPreferences: toggleMulti(prev.aiPreferences, option, step.max) };
    });
  };

  const isSelected = (option: string) => {
    if (isRoleStep) return data.role === option;
    if (stepIndex === 1) return data.goals.includes(option);
    if (stepIndex === 2) return data.metrics.includes(option);
    return data.aiPreferences.includes(option);
  };

  const isAtCap = (option: string) => {
    if (!step.max || isSelected(option)) return false;
    if (stepIndex === 1) return data.goals.length >= step.max;
    if (stepIndex === 2) return data.metrics.length >= step.max;
    return false;
  };

  // Each step needs at least one pick before you can move on — "Skip for now"
  // is the deliberate way out, not an empty Continue.
  const isStepValid = () => {
    if (isRoleStep) return data.role !== null;
    if (stepIndex === 1) return data.goals.length > 0;
    if (stepIndex === 2) return data.metrics.length > 0;
    return data.aiPreferences.length > 0;
  };
  const canContinue = isStepValid();

  const handleContinue = () => {
    if (!canContinue) return;
    if (isLastStep) {
      onComplete(data);
      return;
    }
    setStepIndex((i) => i + 1);
  };

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-[16px]">
      <div className="personalize-backdrop-in absolute inset-0 bg-[rgba(23,23,58,0.45)]" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        className="personalize-card-in relative flex w-full max-w-[880px] flex-col gap-[28px] rounded-[18px] bg-white px-[44px] pb-[36px] pt-[40px] shadow-[0px_20px_0px_0px_rgba(23,23,58,0.18)]"
      >
        {/* Close */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-[16px] top-[16px] flex size-[32px] items-center justify-center rounded-[8px] text-[#9097AD] transition-colors hover:bg-[#F2F4F9] hover:text-[#17173A]"
        >
          <X className="size-[18px]" strokeWidth={2} />
        </button>

        {!started ? (
          /* Intro / welcome — states the purpose once, up front, before the
             stepper starts. Two columns: left-aligned copy + CTAs on the left,
             a sample illustration on the right. */
          <div key="intro" className="personalize-step-in flex w-full items-stretch gap-[28px] py-[8px]">
            {/* LHS — content + CTAs, left-aligned (structure per Figma) */}
            <div className="flex flex-1 flex-col items-start justify-center gap-[20px] text-left">
              <div className="flex flex-col items-start gap-[10px]">
                <p className="text-[26px] font-semibold leading-[34px] text-[#17173A]" style={FONT}>
                  Help Co-marketer understand you better
                </p>
                <p className="text-[14px] leading-[22px] text-[#6F6F8D]" style={FONT}>
                  Four quick questions — your role, goals, metrics, and how you like to work —
                  so we can show sharper insights and better next actions.
                </p>
              </div>

              {/* Value props */}
              <div className="flex flex-col gap-[14px]">
                {INTRO_FEATURES.map(({ icon: Icon, title, desc }) => (
                  <div key={title} className="flex items-start gap-[12px]">
                    <span className="flex size-[34px] shrink-0 items-center justify-center rounded-[9px] bg-[#EEF1FB] text-[#2F68E5]">
                      <Icon className="size-[17px]" strokeWidth={2} />
                    </span>
                    <div className="flex flex-col gap-[1px] pt-[1px]">
                      <span className="text-[13px] font-semibold text-[#17173A]" style={FONT}>
                        {title}
                      </span>
                      <span className="text-[12px] leading-[17px] text-[#6F6F8D]" style={FONT}>
                        {desc}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <p className="text-[12px] font-medium text-[#9097AD]" style={FONT}>
                Takes less than a minute · You can update this anytime
              </p>
              <div className="mt-[2px] flex items-center gap-[10px]">
                <button
                  type="button"
                  onClick={() => setStarted(true)}
                  className="whitespace-nowrap rounded-[8px] bg-[#2F68E5] px-[18px] py-[9px] text-[13px] font-semibold text-white transition-colors hover:bg-[#255ad2] motion-safe:active:scale-[0.99]"
                  style={FONT}
                >
                  Get started
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="whitespace-nowrap rounded-[8px] border border-[#DDE2EE] bg-white px-[16px] py-[9px] text-[13px] font-semibold text-[#17173A] transition-colors hover:bg-[#F7F9FC]"
                  style={FONT}
                >
                  Maybe later
                </button>
              </div>
            </div>

            {/* RHS — illustration rebuilt as components per Figma */}
            <IntroIllustration />
          </div>
        ) : (
          <>
            {/* Header — step count + question title. Close X (on the card) sits
                in this header row. */}
            <div className="flex w-full flex-col gap-[4px] pr-[40px]">
              <p className="whitespace-nowrap text-[12px] font-medium text-[#9097AD]" style={FONT}>
                Step {stepIndex + 1} of {STEPS.length}
              </p>
              <p
                key={stepIndex}
                className="personalize-step-in w-full text-[20px] font-semibold leading-[28px] text-[#17173A]"
                style={FONT}
              >
                {step.title}
              </p>
            </div>

            {/* Progress line at the header/body boundary — full-bleed, starts at
                the modal's left edge and fills to the current step's fraction
                (negative margins cancel the card's horizontal padding). */}
            <div className="-mx-[44px] h-[3px] bg-[#E7EAF2]">
              <div
                className="h-full bg-[#2F68E5] transition-[width] duration-300 ease-out"
                style={{ width: `${((stepIndex + 1) / STEPS.length) * 100}%` }}
              />
            </div>

            {/* Step body — hint + options; re-keyed per step so it fades up on
                advance/back instead of hard-swapping. */}
            <div key={stepIndex} className="personalize-step-in flex w-full flex-col gap-[16px]">
              <p className="w-full text-[13px] text-[#9097AD]" style={FONT}>
                {step.hint ? step.hint(data) : 'Choose one'}
              </p>

              {isRoleStep ? (
                <div className="grid w-full grid-cols-4 gap-[12px]">
                  {step.options.map((option) => (
                    <RoleCard
                      key={option}
                      label={option}
                      selected={isSelected(option)}
                      onClick={() => handleSelect(option)}
                    />
                  ))}
                </div>
              ) : (
                /* 2-col grid so an odd trailing option (e.g. Churn risk) sits in
                   one column at half width instead of stretching full-bleed. */
                <div className={cn('grid w-full gap-[12px]', gridSize === 2 ? 'grid-cols-2' : 'grid-cols-1')}>
                  {step.options.map((option) => (
                    <OptionButton
                      key={option}
                      label={option}
                      multi={isMultiStep}
                      selected={isSelected(option)}
                      disabled={isAtCap(option)}
                      onClick={() => handleSelect(option)}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Footer — "Skip for now" on the left, Back + Continue grouped on
                the right (matches the Figma structure). */}
            <div className="flex w-full items-center justify-between gap-[16px]">
              <button
                type="button"
                onClick={onClose}
                className="whitespace-nowrap text-[13px] font-semibold text-[#9097AD] transition-opacity hover:opacity-70"
                style={FONT}
              >
                Skip for now
              </button>
              <div className="flex shrink-0 items-center gap-[10px]">
                {!isRoleStep && (
                  <button
                    type="button"
                    onClick={() => setStepIndex((i) => i - 1)}
                    className="whitespace-nowrap rounded-[8px] border border-[#DDE2EE] bg-white px-[16px] py-[9px] text-[13px] font-semibold text-[#17173A] transition-colors hover:bg-[#F7F9FC]"
                    style={FONT}
                  >
                    Back
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleContinue}
                  disabled={!canContinue}
                  className={cn(
                    'whitespace-nowrap rounded-[8px] bg-[#2F68E5] px-[20px] py-[9px] text-[13px] font-semibold text-white transition-colors motion-safe:active:scale-[0.99]',
                    canContinue ? 'hover:bg-[#255ad2]' : 'cursor-not-allowed opacity-40'
                  )}
                  style={FONT}
                >
                  {step.continueLabel}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>,
    document.body
  );
};

export default PersonalizeCoMarketerModal;
