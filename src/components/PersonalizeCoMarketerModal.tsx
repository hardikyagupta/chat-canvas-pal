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
        'flex flex-1 items-center gap-[10px] rounded-[8px] border px-[14px] py-[12px] text-left transition-colors',
        selected
          ? 'border-[1.5px] border-[#2F68E5] bg-[#F0F5FF]'
          : 'border-[#DDE2EE] bg-white hover:bg-[#F7F9FC]',
        disabled && !selected && 'cursor-not-allowed opacity-50 hover:bg-white'
      )}
    >
      <OptionDot selected={selected} />
      <span
        className={cn('flex-1 text-[13px] text-[#17173A]', selected ? 'font-semibold' : 'font-medium')}
        style={FONT}
      >
        {label}
      </span>
    </button>
  );
}

/** Chunks options into rows of 2 (role/goals/metrics grid), or 1 for the full-width AI-preference list. */
function chunk<T>(items: T[], size: number): T[][] {
  const rows: T[][] = [];
  for (let i = 0; i < items.length; i += size) rows.push(items.slice(i, i + size));
  return rows;
}

/**
 * 4-step "Personalize Co-Marketer" onboarding modal (Figma node 5442:3829).
 * Skippable at any step; only the final step persists via onComplete.
 */
const PersonalizeCoMarketerModal: React.FC<PersonalizeCoMarketerModalProps> = ({ open, onClose, onComplete }) => {
  const [stepIndex, setStepIndex] = React.useState(0);
  const [data, setData] = React.useState<PersonalizeCoMarketerData>(EMPTY_DATA);

  React.useEffect(() => {
    if (open) {
      setStepIndex(0);
      setData(EMPTY_DATA);
    }
  }, [open]);

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

  const handleContinue = () => {
    if (isLastStep) {
      onComplete(data);
      return;
    }
    setStepIndex((i) => i + 1);
  };

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-[16px]">
      <div className="absolute inset-0 bg-[rgba(23,23,58,0.45)]" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        className="relative flex w-full max-w-[700px] flex-col gap-[24px] rounded-[16px] bg-white px-[32px] pb-[28px] pt-[32px] shadow-[0px_20px_40px_0px_rgba(23,23,58,0.18)]"
      >
        {/* Header — progress bar, step count, title, description */}
        <div className="flex w-full flex-col items-start gap-[16px]">
          <div className="flex w-full items-start gap-[8px]">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={cn('h-[4px] flex-1 rounded-[2px]', i <= stepIndex ? 'bg-[#2F68E5]' : 'bg-[#DDE2EE]')}
              />
            ))}
          </div>
          <p className="whitespace-nowrap text-[11px] font-medium text-[#9097AD]" style={FONT}>
            Step {stepIndex + 1} of {STEPS.length}
          </p>
          <p className="w-full text-[20px] font-semibold leading-[28px] text-[#17173A]" style={FONT}>
            Help Co-Marketer understand you better
          </p>
          <p className="w-full text-[13px] leading-[20px] text-[#6F6F8D]" style={FONT}>
            A few quick answers will help us show sharper insights and better next actions.
          </p>
        </div>

        {/* Step body — question + options grid */}
        <div className="flex w-full flex-col gap-[4px]">
          <p className="w-full text-[15px] font-semibold leading-[22px] text-[#17173A]" style={FONT}>
            {step.title}
          </p>
          {step.hint && (
            <p className="w-full text-[12px] text-[#9097AD]" style={FONT}>
              {step.hint(data)}
            </p>
          )}
        </div>

        <div className="flex w-full flex-col gap-[10px]">
          {chunk(step.options, gridSize).map((row, rowIndex) => (
            <div key={rowIndex} className="flex w-full items-start gap-[10px]">
              {row.map((option) => (
                <OptionButton
                  key={option}
                  label={option}
                  selected={isSelected(option)}
                  disabled={isAtCap(option)}
                  onClick={() => handleSelect(option)}
                />
              ))}
            </div>
          ))}
        </div>

        {/* Footer — skip / back / continue */}
        <div className="flex w-full flex-col gap-[10px]">
          <div className="flex w-full items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="whitespace-nowrap text-[13px] font-semibold text-[#9097AD] transition-opacity hover:opacity-70"
              style={FONT}
            >
              Skip for now
            </button>
            <div className="flex items-start gap-[10px]">
              {!isRoleStep && (
                <button
                  type="button"
                  onClick={() => setStepIndex((i) => i - 1)}
                  className="whitespace-nowrap rounded-[6px] border border-[#DDE2EE] bg-white px-[16px] py-[10px] text-[13px] font-semibold text-[#17173A] transition-colors hover:bg-[#F7F9FC]"
                  style={FONT}
                >
                  Back
                </button>
              )}
              <button
                type="button"
                onClick={handleContinue}
                className="whitespace-nowrap rounded-[6px] bg-[#2F68E5] px-[18px] py-[10px] text-[13px] font-semibold text-white transition-colors hover:bg-[#255ad2]"
                style={FONT}
              >
                {step.continueLabel}
              </button>
            </div>
          </div>
          <p className="w-full text-center text-[11px] text-[#9097AD]" style={FONT}>
            Your preferences are only used to personalize your workspace.
          </p>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default PersonalizeCoMarketerModal;
