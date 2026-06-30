import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

/**
 * Atmosphere = the "Translucent sidebar" theme system from Settings.
 *
 * When `translucent` is on, the selected preset's gradient is painted as the
 * page background and the nav / sidebar / cards become frosted glass (56% white
 * + 40px blur) so the gradient shows through. The same state is shared with the
 * Co-marketer homepage so the look reflects across the app.
 *
 * Colors here are intentionally a self-contained decorative palette (OKLCH),
 * separate from the core token library in COLORS.md.
 */

export type InterfaceMode = 'system' | 'light' | 'dark';

export interface ThemePreset {
  id: string;
  name: string;
  /** short "from → to" descriptor shown under the name */
  hint: string;
  /** vivid mini gradient used for the card swatch */
  swatch: string;
  /** soft, readable full-page wash applied behind the frosted surfaces */
  page: string;
}

/**
 * Gradients are the exact Figma swatch gradients (node 1814:6463), sampled from
 * the source SVGs and converted to OKLCH. Direction matches Figma: most are
 * vertical (180deg, top→bottom); Midnight is horizontal (90deg). The same
 * gradient is used for the card swatch and the full-page atmosphere.
 */
const GRAD: Record<string, string> = {
  'ruby-cloud':    'linear-gradient(180deg, oklch(0.893 0.057 11.536) 0%, oklch(0.912 0.046 11.397) 22%, oklch(0.929 0.033 5.961) 38%, oklch(0.914 0.034 349.103) 56%, oklch(0.925 0.022 334.936) 72%, oklch(0.937 0.013 310.527) 100%)',
  'tangerine-air': 'linear-gradient(180deg, oklch(0.896 0.07 61.814) 0%, oklch(0.916 0.058 65.317) 22%, oklch(0.934 0.046 67.207) 38%, oklch(0.925 0.038 51.709) 56%, oklch(0.934 0.026 52.221) 72%, oklch(0.948 0.014 64.34) 100%)',
  'golden-light':  'linear-gradient(180deg, oklch(0.947 0.102 98.392) 0%, oklch(0.958 0.085 99.058) 22%, oklch(0.967 0.067 100.238) 38%, oklch(0.951 0.051 102.481) 56%, oklch(0.946 0.038 110.326) 72%, oklch(0.944 0.027 122.673) 100%)',
  'lime-veil':     'linear-gradient(180deg, oklch(0.934 0.102 120.106) 0%, oklch(0.948 0.087 119.817) 22%, oklch(0.952 0.068 121.017) 38%, oklch(0.935 0.055 133.577) 56%, oklch(0.924 0.045 149.204) 72%, oklch(0.923 0.038 166.554) 100%)',
  'emerald-mist':  'linear-gradient(180deg, oklch(0.906 0.07 152.49) 0%, oklch(0.922 0.063 153.48) 22%, oklch(0.93 0.052 156.433) 38%, oklch(0.916 0.051 171.5) 56%, oklch(0.913 0.051 182.451) 72%, oklch(0.916 0.044 191.074) 100%)',
  'teal-lagoon':   'linear-gradient(180deg, oklch(0.908 0.059 210.995) 0%, oklch(0.923 0.053 209.508) 22%, oklch(0.934 0.045 210.46) 38%, oklch(0.911 0.046 224.654) 56%, oklch(0.904 0.043 238.516) 72%, oklch(0.906 0.036 253.456) 100%)',
  'cyan-frost':    'linear-gradient(180deg, oklch(0.908 0.059 210.995) 0%, oklch(0.923 0.053 209.508) 22%, oklch(0.934 0.045 210.46) 38%, oklch(0.911 0.046 224.654) 56%, oklch(0.904 0.043 238.516) 72%, oklch(0.906 0.036 253.456) 100%)',
  'magenta-glow':  'linear-gradient(180deg, oklch(0.892 0.072 334.324) 0%, oklch(0.91 0.059 336.729) 22%, oklch(0.926 0.043 341.557) 38%, oklch(0.914 0.041 350.45) 56%, oklch(0.92 0.029 4.548) 72%, oklch(0.932 0.02 28.907) 100%)',
  'indigo-haze':   'linear-gradient(180deg, oklch(0.875 0.062 280.042) 0%, oklch(0.897 0.051 280.447) 22%, oklch(0.916 0.04 280.901) 38%, oklch(0.903 0.042 289.968) 56%, oklch(0.914 0.037 297.52) 72%, oklch(0.932 0.028 306.04) 100%)',
  'violet-bloom':  'linear-gradient(180deg, oklch(0.882 0.071 304.071) 0%, oklch(0.903 0.058 305.126) 22%, oklch(0.923 0.046 307.908) 38%, oklch(0.914 0.045 316.741) 56%, oklch(0.925 0.037 327.255) 72%, oklch(0.937 0.025 341.841) 100%)',
  'azure-drift':   'linear-gradient(180deg, oklch(0.883 0.059 250.817) 0%, oklch(0.902 0.05 249.305) 22%, oklch(0.919 0.039 249.439) 38%, oklch(0.906 0.04 260.146) 56%, oklch(0.908 0.035 271.562) 72%, oklch(0.925 0.026 278.724) 100%)',
  'rose-dawn':     'linear-gradient(180deg, oklch(0.896 0.063 351.849) 0%, oklch(0.915 0.049 355.586) 22%, oklch(0.932 0.036 2.985) 38%, oklch(0.922 0.035 24.38) 56%, oklch(0.932 0.033 60.085) 72%, oklch(0.944 0.029 80.659) 100%)',
  'midnight':      'linear-gradient(90deg, oklch(0.446 0.072 269.312) 0%, oklch(0.292 0.061 267.081) 100%)',
};

export const THEME_PRESETS: ThemePreset[] = [
  { id: 'ruby-cloud',   name: 'Ruby cloud',   hint: 'Blue → lavender',  swatch: GRAD['ruby-cloud'],   page: GRAD['ruby-cloud'] },
  { id: 'tangerine-air',name: 'Tangerine Air',hint: 'Sky → aqua',       swatch: GRAD['tangerine-air'],page: GRAD['tangerine-air'] },
  { id: 'golden-light', name: 'Golden Light', hint: 'Lilac → ice',      swatch: GRAD['golden-light'], page: GRAD['golden-light'] },
  { id: 'lime-veil',    name: 'Lime Veil',    hint: 'Blush → orchid',   swatch: GRAD['lime-veil'],    page: GRAD['lime-veil'] },
  { id: 'emerald-mist', name: 'Emerald Mist', hint: 'Peach → coral',    swatch: GRAD['emerald-mist'], page: GRAD['emerald-mist'] },
  { id: 'teal-lagoon',  name: 'Teal Lagoon',  hint: 'Lemon → mint',     swatch: GRAD['teal-lagoon'],  page: GRAD['teal-lagoon'] },
  { id: 'cyan-frost',   name: 'Cyan Frost',   hint: 'Aqua → sage',      swatch: GRAD['cyan-frost'],   page: GRAD['cyan-frost'] },
  { id: 'magenta-glow', name: 'Magenta Glow', hint: 'Slate → charcoal', swatch: GRAD['magenta-glow'], page: GRAD['magenta-glow'] },
  { id: 'indigo-haze',  name: 'Indigo Haze',  hint: 'Ice → cyan',       swatch: GRAD['indigo-haze'],  page: GRAD['indigo-haze'] },
  { id: 'violet-bloom', name: 'Violet Bloom', hint: 'Indigo → navy',    swatch: GRAD['violet-bloom'], page: GRAD['violet-bloom'] },
  { id: 'azure-drift',  name: 'Azure Drift',  hint: 'Moss → teal',      swatch: GRAD['azure-drift'],  page: GRAD['azure-drift'] },
  { id: 'rose-dawn',    name: 'Rose Dawn',    hint: 'Neutral mist',     swatch: GRAD['rose-dawn'],    page: GRAD['rose-dawn'] },
  { id: 'midnight',     name: 'Midnight',     hint: 'Indigo → navy',    swatch: GRAD['midnight'],     page: GRAD['midnight'] },
];

interface AtmosphereState {
  translucent: boolean;
  themeId: string;
  interfaceMode: InterfaceMode;
}

interface AtmosphereContextValue extends AtmosphereState {
  setTranslucent: (v: boolean) => void;
  setThemeId: (id: string) => void;
  setInterfaceMode: (m: InterfaceMode) => void;
  presets: ThemePreset[];
  activePreset: ThemePreset;
  /** true when the gradient + frosted glass should be visible */
  active: boolean;
}

const STORAGE_KEY = 'co-marketer-atmosphere';
const DEFAULT_STATE: AtmosphereState = { translucent: false, themeId: 'ruby-cloud', interfaceMode: 'system' };

function loadState(): AtmosphereState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    return { ...DEFAULT_STATE, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_STATE;
  }
}

const AtmosphereContext = createContext<AtmosphereContextValue | null>(null);

export const AtmosphereProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AtmosphereState>(loadState);

  const activePreset = useMemo(
    () => THEME_PRESETS.find((p) => p.id === state.themeId) ?? THEME_PRESETS[0],
    [state.themeId]
  );
  const active = state.translucent;

  // Persist + reflect to the document root so the homepage (and any surface
  // that opts into .atmo-glass) reacts to the same state.
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* ignore */
    }
    const root = document.documentElement;
    root.style.setProperty('--atmo-page-gradient', activePreset.page);
    root.setAttribute('data-atmo', active ? 'on' : 'off');
  }, [state, activePreset, active]);

  const value: AtmosphereContextValue = {
    ...state,
    setTranslucent: (v) => setState((s) => ({ ...s, translucent: v })),
    setThemeId: (id) => setState((s) => ({ ...s, themeId: id })),
    setInterfaceMode: (m) => setState((s) => ({ ...s, interfaceMode: m })),
    presets: THEME_PRESETS,
    activePreset,
    active,
  };

  return <AtmosphereContext.Provider value={value}>{children}</AtmosphereContext.Provider>;
};

export function useAtmosphere(): AtmosphereContextValue {
  const ctx = useContext(AtmosphereContext);
  if (!ctx) throw new Error('useAtmosphere must be used within AtmosphereProvider');
  return ctx;
}
