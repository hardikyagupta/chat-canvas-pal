import React, { Suspense, useEffect, useState } from 'react';
import AgentAvatar from '../AgentAvatar';
import { getOrbTheme, type OrbTheme } from './agentOrbTheme';
import type { OrbState } from './AgentOrb3DCanvas';

/**
 * AgentOrb3D — the agent avatar the app renders. Shows the live WebGL fluid
 * orb (AgentOrb3DCanvas, lazy-loaded so three.js stays in its own chunk) and
 * falls back to the static SVG orb when:
 *  - `live` is false (older thread headers keep only one WebGL context alive),
 *  - WebGL is unavailable,
 *  - the user prefers reduced motion,
 *  - or while the three chunk is still loading (Suspense poster).
 */

const Canvas3D = React.lazy(() => import('./AgentOrb3DCanvas'));

let webglSupport: boolean | null = null;
const isWebGLAvailable = (): boolean => {
  if (webglSupport !== null) return webglSupport;
  try {
    const canvas = document.createElement('canvas');
    webglSupport = !!(canvas.getContext('webgl2') || canvas.getContext('webgl'));
  } catch {
    webglSupport = false;
  }
  return webglSupport;
};

/** Shared with AgentSwitchDivider — tracks the OS reduced-motion setting live. */
export const useReducedMotion = (): boolean => {
  const [reduced, setReduced] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return reduced;
};

interface AgentOrb3DProps {
  /** Agent label — selects the orb theme (and the SVG fallback). */
  name: string;
  /** Previous agent's label — the orb mounts in their colors and morphs over. */
  fromName?: string;
  state?: OrbState;
  /** Diameter in px. */
  size?: number;
  /** False renders the static SVG — used to cap live WebGL canvases at one. */
  live?: boolean;
  /** Passed through to the SVG fallback. */
  avatarSrc?: string;
  /** Explicit orb colors, overriding the name→theme lookup (custom agents). */
  theme?: OrbTheme;
}

const AgentOrb3D: React.FC<AgentOrb3DProps> = ({
  name,
  fromName,
  state = 'idle',
  size = 40,
  live = true,
  avatarSrc,
  theme,
}) => {
  const reducedMotion = useReducedMotion();

  // The SVG keeps the header's slow spin (keyframes live in AgentThreadHeader;
  // its reduced-motion media query also disables this).
  const fallback = (
    <AgentAvatar
      seed={name}
      src={avatarSrc}
      size={size}
      style={reducedMotion ? undefined : { animation: 'agentOrbSpin 14s linear infinite' }}
    />
  );

  if (!live || reducedMotion || !isWebGLAvailable()) {
    return fallback;
  }

  return (
    <span
      className="relative block shrink-0 overflow-hidden rounded-full"
      style={{ width: size, height: size }}
    >
      <Suspense fallback={fallback}>
        <Canvas3D
          theme={theme ?? getOrbTheme(name)}
          fromTheme={fromName ? getOrbTheme(fromName) : undefined}
          state={state}
          size={size}
        />
      </Suspense>
    </span>
  );
};

export default AgentOrb3D;
