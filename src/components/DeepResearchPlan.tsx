import React, { useEffect, useRef, useState } from 'react';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DsButton } from '@/components/ui/ds-button';

/**
 * DeepResearchPlan — a ChatGPT-style deep-research card shown inline in the chat
 * thread. It opens on the "plan" phase (the agent proposes the steps it will
 * run), then moves to "researching" (steps light up one by one behind a
 * progress bar), and finally "done".
 *
 * First pass: the progression is self-driven on timers so we can see the whole
 * story; wiring to real research output comes later.
 */

type Phase = 'plan' | 'researching' | 'done' | 'cancelled';

// Status lines cycled above the progress bar while researching. The greyed
// `tail` mimics the "…for RSS blocks…" trailing phrase in the reference.
const RESEARCH_STATUSES: { text: string; tail: string }[] = [
  { text: "Reading this quarter's WhatsApp delivery logs", tail: 'across campaigns…' },
  { text: 'Reconciling sent vs delivered', tail: 'by template…' },
  { text: 'Scanning blocked and opted-out numbers', tail: 'to size the leak…' },
  { text: 'Benchmarking WhatsApp against Email', tail: 'and APN…' },
  { text: 'Clustering the highest-engagement', tail: 'segments…' },
  { text: 'Modeling the recoverable', tail: 'delivery upside…' },
];

interface DeepResearchPlanProps {
  title: string;
  /** The tasks the agent will run to complete the research. */
  steps: string[];
  /** How long each research step takes, in ms. */
  stepDurationMs?: number;
  /** Fired when "Start" is tapped — research begins running. */
  onStart?: () => void;
  onComplete?: () => void;
  /** Fired when "Edit" is tapped — the composer takes over for a follow-up. */
  onEdit?: () => void;
  /** Fired when "Cancel" is tapped. */
  onCancel?: () => void;
}

// A step's left-hand indicator: dashed (pending), spinning (active), check (done).
const StepIndicator: React.FC<{ state: 'pending' | 'active' | 'done' }> = ({ state }) => {
  if (state === 'done') {
    return (
      <span className="mt-[1px] flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full bg-[var(--color-ink)]">
        <Check className="h-[11px] w-[11px] text-white" strokeWidth={3} />
      </span>
    );
  }
  if (state === 'active') {
    return (
      <span
        className="mt-[1px] h-[18px] w-[18px] shrink-0 rounded-full border-2 border-[var(--color-line)] border-t-[var(--color-ink)] animate-spin"
        aria-hidden
      />
    );
  }
  return (
    <span
      className="mt-[1px] h-[18px] w-[18px] shrink-0 rounded-full border border-dashed border-[var(--color-line)]"
      aria-hidden
    />
  );
};

const DeepResearchPlan: React.FC<DeepResearchPlanProps> = ({
  title,
  steps,
  stepDurationMs = 2600,
  onStart,
  onComplete,
  onEdit,
  onCancel,
}) => {
  const [phase, setPhase] = useState<Phase>('plan');
  const [activeStep, setActiveStep] = useState(0);
  // Live status line + running "searches" tally shown while researching.
  const [statusIndex, setStatusIndex] = useState(0);
  const [searches, setSearches] = useState(0);
  const stepTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startResearch = () => {
    setPhase('researching');
    setActiveStep(0);
    onStart?.();
  };

  // Researching phase — advance one step per stepDurationMs, then finish.
  useEffect(() => {
    if (phase !== 'researching') return;
    if (activeStep >= steps.length) {
      setPhase('done');
      return;
    }
    stepTimerRef.current = setTimeout(() => setActiveStep((s) => s + 1), stepDurationMs);
    return () => {
      if (stepTimerRef.current) clearTimeout(stepTimerRef.current);
    };
  }, [phase, activeStep, steps.length, stepDurationMs]);

  // Fire completion once the card reaches "done" — both natural finish and Stop
  // route through here, so the parent swaps in the doc exactly once.
  useEffect(() => {
    if (phase === 'done') onComplete?.();
  }, [phase, onComplete]);

  // Researching — cycle the status line and tick up the running search count.
  useEffect(() => {
    if (phase !== 'researching') return;
    const statusT = setInterval(() => {
      setStatusIndex((i) => (i + 1) % RESEARCH_STATUSES.length);
    }, 1600);
    const searchT = setInterval(() => {
      setSearches((n) => n + 7 + (n % 5));
    }, 450);
    return () => {
      clearInterval(statusT);
      clearInterval(searchT);
    };
  }, [phase]);

  const stepState = (i: number): 'pending' | 'active' | 'done' => {
    if (phase === 'done') return 'done';
    if (phase === 'researching') {
      if (i < activeStep) return 'done';
      if (i === activeStep) return 'active';
    }
    return 'pending';
  };

  const isResearching = phase === 'researching';
  const isDone = phase === 'done';
  const completed = Math.min(activeStep, steps.length);
  const progress = isDone ? 1 : completed / steps.length;

  if (phase === 'cancelled') {
    return (
      <div className="w-full rounded-[16px] border border-[var(--color-line)] bg-card px-[20px] py-[16px] animate-in fade-in duration-300">
        <p
          className="text-[14px] leading-[20px] text-[var(--color-grey)]"
          style={{ fontFamily: 'Manrope, sans-serif' }}
        >
          Deep research cancelled.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full rounded-[16px] border border-[var(--color-line)] bg-card px-[20px] py-[18px] animate-in fade-in duration-300">
      {/* Header — the plan title. */}
      <p
        className="text-[15px] leading-[22px] font-semibold text-[var(--color-ink)]"
        style={{ fontFamily: 'Manrope, sans-serif' }}
      >
        {title}
      </p>

      {/* The research plan — loader on the left, task label on the right. */}
      <div className="mt-[14px] flex flex-col gap-[14px]">
        {steps.map((step, i) => (
          <div key={i} className="flex items-start gap-[12px]">
            <StepIndicator state={stepState(i)} />
            <p
              className="text-[14px] leading-[20px] text-[var(--color-ink)]"
              style={{ fontFamily: 'Manrope, sans-serif' }}
            >
              {step}
            </p>
          </div>
        ))}
      </div>

      {/* Plan footer — Edit on the left, Cancel + Start on the right (app DL buttons). */}
      {phase === 'plan' && (
        <div className="mt-[18px] flex items-center justify-between gap-[12px]">
          <DsButton variant="tertiary" onClick={() => onEdit?.()}>Edit</DsButton>
          <div className="flex items-center gap-[8px]">
            <DsButton
              variant="tertiary"
              onClick={() => {
                setPhase('cancelled');
                onCancel?.();
              }}
            >
              Cancel
            </DsButton>
            <DsButton onClick={startResearch}>Start</DsButton>
          </div>
        </div>
      )}

      {/* Researching footer — live status + search tally, then progress + stop. */}
      {isResearching && (
        <div className="mt-[18px] flex flex-col gap-[10px]">
          <div className="flex items-center justify-between gap-[12px]">
            <p
              className="min-w-0 truncate text-[14px] leading-[20px] text-[var(--color-ink)]"
              style={{ fontFamily: 'Manrope, sans-serif' }}
            >
              {RESEARCH_STATUSES[statusIndex].text}{' '}
              <span className="text-[var(--color-grey)]">{RESEARCH_STATUSES[statusIndex].tail}</span>
            </p>
            <span
              className="shrink-0 text-[14px] leading-[20px] text-[var(--color-grey)]"
              style={{ fontFamily: 'Manrope, sans-serif' }}
            >
              {searches} searches
            </span>
          </div>
          <div className="flex items-center gap-[12px]">
            <div className="h-[3px] flex-1 overflow-hidden rounded-full bg-[var(--color-line)]">
              <div
                className="h-full rounded-full bg-[var(--color-ink)] transition-[width] ease-linear"
                style={{ width: `${Math.max(progress, 0.04) * 100}%`, transitionDuration: `${stepDurationMs}ms` }}
              />
            </div>
            <button
              type="button"
              onClick={() => setPhase('done')}
              aria-label="Stop research"
              className="flex h-[28px] w-[28px] shrink-0 items-center justify-center rounded-full bg-[var(--color-surface-0)] transition-colors hover:bg-[var(--color-line)]"
            >
              <span className="h-[8px] w-[8px] rounded-[1px] bg-[var(--color-ink)]" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeepResearchPlan;
