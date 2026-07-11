import React, { useEffect, useMemo, useRef, useState } from 'react';
import AgentSwitchDivider from './AgentSwitchDivider';
import AgentOrb3D, { useReducedMotion } from './orb/AgentOrb3D';

/**
 * AgentDeliberation — opens a turn where the AI has to decide which specialist
 * takes the query.
 *
 * Choreography: the standard switch divider holds on its "Calling in agents…"
 * beat while, below it, a large live WebGL orb thinks — liquid-morphing
 * between the candidate agents' colors as their names shimmer-crossfade in a
 * label under it (decelerating, like a reel settling). When it lands on the
 * chosen agent the divider crossfades to "Switched to <agent>", the orb block
 * collapses away, and the standard thread header + thinking loader below take
 * over — so the settled thread reads exactly like every other hand-off.
 */

interface AgentDeliberationProps {
  /** Display labels of the candidate agents, e.g. ["Insights agent", …]. */
  candidates: string[];
  /** The agent that wins the query — must match one of the candidates. */
  chosenLabel: string;
  /**
   * True once the turn's answer has fully streamed: the marker rests as the
   * settled "Switched to <agent>" divider in the thread history.
   */
  settled?: boolean;
}

// Timeline. The name reel decelerates — each candidate dwells a little longer
// than the last — while the orb's colors chase the current candidate (the
// canvas damps toward its theme, so quick early ticks read as fluid blending
// and the slow final ones as the orb "settling" on its pick). Extra ticks are
// appended (at the slowest cadence) until the reel lands on the chosen
// candidate. With three candidates and the chosen one first: last tick at
// ~5100ms, divider crossfades at ~5550ms, orb collapsed by ~6150ms; the
// sequencer in ChatInterface reveals the thread header at 6300ms and advances
// to the thinking loader at 7400ms — keep those in sync if retimed.
const BASE_TICK_DELAYS = [600, 700, 800, 900, 1000, 1100];
const EXTRA_TICK_DELAY = 1100;
const LOCK_PAUSE = 450;   // dwell on the final candidate before the divider flips
const COLLAPSE_MS = 600;  // the orb block folding away after the decision
const ORB_SIZE = 180;
const ORB_BLOCK_HEIGHT = ORB_SIZE + 76; // orb + gap + label + breathing room

const AgentDeliberation: React.FC<AgentDeliberationProps> = ({
  candidates,
  chosenLabel,
  settled = false,
}) => {
  const reducedMotion = useReducedMotion();
  // Markers that mount already settled (history re-renders) or under reduced
  // motion skip the deliberation and rest as the plain divider immediately.
  const skipAnimation = settled || reducedMotion;
  const skipRef = useRef(skipAnimation);
  // Reel step counter — the visible candidate is candidates[tick % n].
  const [tick, setTick] = useState(0);
  const [decided, setDecided] = useState(skipAnimation);
  // The live orb unmounts only after the collapse finishes, so it fades out
  // with the folding block instead of vanishing.
  const [orbGone, setOrbGone] = useState(skipAnimation);

  // Decelerating tick schedule, extended so the reel's final step lands
  // exactly on the chosen candidate. Deterministic per turn.
  const { delays, decideAt } = useMemo(() => {
    const n = Math.max(1, candidates.length);
    const chosenIndex = Math.max(0, candidates.indexOf(chosenLabel));
    const all = [...BASE_TICK_DELAYS];
    while (all.length % n !== chosenIndex) all.push(EXTRA_TICK_DELAY);
    return { delays: all, decideAt: all.reduce((a, b) => a + b, 0) + LOCK_PAUSE };
  }, [candidates, chosenLabel]);

  useEffect(() => {
    if (skipRef.current) return;
    const timers: ReturnType<typeof setTimeout>[] = [];
    let at = 0;
    delays.forEach((delay, i) => {
      at += delay;
      timers.push(setTimeout(() => setTick(i + 1), at));
    });
    timers.push(setTimeout(() => setDecided(true), decideAt));
    timers.push(setTimeout(() => setOrbGone(true), decideAt + COLLAPSE_MS));
    return () => timers.forEach(clearTimeout);
    // Mount-time schedule on purpose — candidates/chosen are static per turn.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // The answer finished streaming while mid-animation (shouldn't happen with
  // the sequencer's timings, but stay correct): jump to the end state.
  useEffect(() => {
    if (settled) {
      setDecided(true);
      setOrbGone(true);
    }
  }, [settled]);

  const current = decided ? chosenLabel : candidates[tick % candidates.length];

  return (
    <div className="flex w-full flex-col">

      {/* The SAME divider every thread uses. Its "Calling in agents…" beat
          runs for the whole deliberation and crossfades to "Switched to
          <agent>" the moment the orb below picks one. */}
      <AgentSwitchDivider
        agentLabel={chosenLabel}
        callingDuration={skipAnimation ? 0 : decideAt}
        settled={settled}
      />

      {/* The deliberation stage: a large live orb whose colors chase the
          candidate named under it. Folds away smoothly once decided. */}
      <div
        aria-hidden={decided}
        className="overflow-hidden"
        style={{
          height: decided ? 0 : ORB_BLOCK_HEIGHT,
          opacity: decided ? 0 : 1,
          transition: `height ${COLLAPSE_MS}ms cubic-bezier(0.22, 1, 0.36, 1), opacity ${Math.round(COLLAPSE_MS * 0.75)}ms ease`,
        }}
      >
        {!orbGone && (
          <div className="flex flex-col items-center gap-[20px] pt-[16px]">
            {/* 'idle' keeps the big orb a soft, slowly-breathing sphere — the
                'thinking' displacement reads spiky at this size. */}
            <AgentOrb3D name={current} state="idle" size={ORB_SIZE} live />

            {/* Candidate name under the orb — the same shimmer the thinking
                indicator uses, crossfading as the AI considers each agent. */}
            <div className="inline-grid h-[24px] place-items-center">
              <span
                key={current}
                className="col-start-1 row-start-1 whitespace-nowrap text-[16px] leading-[24px] font-semibold thinking-shimmer-gradient animate-in fade-in duration-300"
                style={{ fontFamily: 'Manrope, sans-serif' }}
              >
                {current}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AgentDeliberation;
