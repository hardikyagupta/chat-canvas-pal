import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame } from '@react-three/fiber';
import type { OrbTheme } from './agentOrbTheme';

/**
 * AgentOrb3DCanvas — the WebGL fluid orb. A simplex-noise-displaced sphere
 * with a fresnel rim glow, colored per agent. Lazily imported by AgentOrb3D so
 * three/R3F land in their own chunk; this must stay the only module that
 * imports three / @react-three/fiber.
 *
 * States drive uniform TARGETS which are reached via frame-rate-independent
 * damping in useFrame — so idle↔thinking transitions, and the color "baton
 * pass" from the previous agent (fromTheme → theme), are themselves liquid.
 */

export type OrbState = 'idle' | 'thinking' | 'entering';

interface AgentOrb3DCanvasProps {
  theme: OrbTheme;
  /** Previous agent's colors — the orb mounts in these and morphs to `theme`. */
  fromTheme?: OrbTheme;
  state: OrbState;
  /** Canvas is size × size px. */
  size: number;
}

// Ashima / Ian McEwan 3D simplex noise (MIT), the standard GLSL snoise.
const SNOISE = /* glsl */ `
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

float snoise(vec3 v) {
  const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

  vec3 i  = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);

  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);

  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;

  i = mod289(i);
  vec4 p = permute(permute(permute(
        i.z + vec4(0.0, i1.z, i2.z, 1.0))
      + i.y + vec4(0.0, i1.y, i2.y, 1.0))
      + i.x + vec4(0.0, i1.x, i2.x, 1.0));

  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;

  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);

  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);

  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);

  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);

  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));

  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;

  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);

  vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;

  vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
}
`;

const VERTEX_SHADER = /* glsl */ `
uniform float uTime;
uniform float uAmplitude;
uniform float uFrequency;

varying vec3 vNormal;
varying vec3 vViewDir;
varying float vDisp;

${SNOISE}

void main() {
  float n = snoise(position * uFrequency + vec3(0.0, 0.0, uTime));
  float n2 = 0.5 * snoise(position * uFrequency * 2.3 + vec3(uTime * 1.7));
  vDisp = n + n2;
  vec3 displaced = position + normal * vDisp * uAmplitude;

  vec4 mvPosition = modelViewMatrix * vec4(displaced, 1.0);
  vNormal = normalMatrix * normal;
  vViewDir = -mvPosition.xyz;
  gl_Position = projectionMatrix * mvPosition;
}
`;

const FRAGMENT_SHADER = /* glsl */ `
uniform vec3 uColorCore;
uniform vec3 uColorGlow;
uniform float uCoreBoost;

varying vec3 vNormal;
varying vec3 vViewDir;
varying float vDisp;

void main() {
  float fresnel = pow(1.0 - clamp(dot(normalize(vNormal), normalize(vViewDir)), 0.0, 1.0), 2.2);
  vec3 col = mix(uColorCore * uCoreBoost, uColorGlow, fresnel);
  col += uColorGlow * fresnel * 0.6;
  col += uColorCore * smoothstep(0.3, 0.9, vDisp) * 0.15;
  gl_FragColor = vec4(col, 1.0);
}
`;

// Per-state uniform targets. `entering` starts hot and hands over to
// `thinking`/`idle` via the same damping, so no extra decay code is needed.
const STATE_TARGETS: Record<OrbState, { amplitude: number; speed: number; frequency: number; coreBoost: number }> = {
  idle:     { amplitude: 0.06, speed: 0.25, frequency: 1.6, coreBoost: 1.0 },
  thinking: { amplitude: 0.14, speed: 0.9,  frequency: 2.4, coreBoost: 1.35 },
  entering: { amplitude: 0.2,  speed: 1.2,  frequency: 2.0, coreBoost: 1.2 },
};

// Damping half-life factors (higher λ = snappier). Colors are slower so the
// baton pass reads as a deliberate ~900ms liquid morph.
const MOTION_LAMBDA = 3.5;
const COLOR_LAMBDA = 5.0;

const OrbMesh: React.FC<{ theme: OrbTheme; fromTheme?: OrbTheme; state: OrbState }> = ({
  theme,
  fromTheme,
  state,
}) => {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const stateRef = useRef(state);
  stateRef.current = state;

  const targetCore = useMemo(() => new THREE.Color(theme.core), [theme.core]);
  const targetGlow = useMemo(() => new THREE.Color(theme.glow), [theme.glow]);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uAmplitude: { value: STATE_TARGETS.entering.amplitude },
      uFrequency: { value: STATE_TARGETS.entering.frequency },
      uCoreBoost: { value: STATE_TARGETS.entering.coreBoost },
      uColorCore: { value: new THREE.Color(fromTheme?.core ?? theme.core) },
      uColorGlow: { value: new THREE.Color(fromTheme?.glow ?? theme.glow) },
    }),
    // Mount-time snapshot on purpose: live values are damped in useFrame.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const speedRef = useRef(STATE_TARGETS[state].speed);

  useFrame((_, delta) => {
    const mat = materialRef.current;
    if (!mat) return;
    // Clamp delta so a background-tab resume doesn't jump the animation.
    const dt = Math.min(delta, 0.1);
    const target = STATE_TARGETS[stateRef.current];

    speedRef.current = THREE.MathUtils.damp(speedRef.current, target.speed, MOTION_LAMBDA, dt);
    const u = mat.uniforms;
    u.uTime.value += dt * speedRef.current;
    u.uAmplitude.value = THREE.MathUtils.damp(u.uAmplitude.value, target.amplitude, MOTION_LAMBDA, dt);
    u.uFrequency.value = THREE.MathUtils.damp(u.uFrequency.value, target.frequency, MOTION_LAMBDA, dt);
    u.uCoreBoost.value = THREE.MathUtils.damp(u.uCoreBoost.value, target.coreBoost, MOTION_LAMBDA, dt);

    const core = u.uColorCore.value as THREE.Color;
    const glow = u.uColorGlow.value as THREE.Color;
    core.r = THREE.MathUtils.damp(core.r, targetCore.r, COLOR_LAMBDA, dt);
    core.g = THREE.MathUtils.damp(core.g, targetCore.g, COLOR_LAMBDA, dt);
    core.b = THREE.MathUtils.damp(core.b, targetCore.b, COLOR_LAMBDA, dt);
    glow.r = THREE.MathUtils.damp(glow.r, targetGlow.r, COLOR_LAMBDA, dt);
    glow.g = THREE.MathUtils.damp(glow.g, targetGlow.g, COLOR_LAMBDA, dt);
    glow.b = THREE.MathUtils.damp(glow.b, targetGlow.b, COLOR_LAMBDA, dt);
  });

  return (
    <mesh>
      <icosahedronGeometry args={[1, 48]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={VERTEX_SHADER}
        fragmentShader={FRAGMENT_SHADER}
        uniforms={uniforms}
      />
    </mesh>
  );
};

const AgentOrb3DCanvas: React.FC<AgentOrb3DCanvasProps> = ({ theme, fromTheme, state, size }) => (
  <Canvas
    dpr={[1, 2]}
    gl={{ alpha: true, antialias: true, powerPreference: 'low-power' }}
    // Far enough that the sphere plus max displacement (~1.2r) stays inside
    // the square canvas instead of clipping at the edges.
    camera={{ position: [0, 0, 3.1], fov: 45 }}
    style={{ width: size, height: size, display: 'block' }}
  >
    <OrbMesh theme={theme} fromTheme={fromTheme} state={state} />
  </Canvas>
);

export default AgentOrb3DCanvas;
