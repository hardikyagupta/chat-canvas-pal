import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  BrandTheme,
  DEFAULT_BRAND_THEME,
  DEFAULT_TEMPLATE_ID,
  REPORT_TEMPLATES,
  ReportTemplate,
} from '@/data/reportThemes';

/**
 * ReportTheme = the look applied to generated reports: a layout template + an
 * editable brand theme (colors + font). Mirrors AtmosphereContext — state is
 * persisted to localStorage and exposed to the Settings panel that edits it.
 *
 * The panel edits a *draft* locally and calls `save(...)`; this context holds the
 * committed value so anything that renders reports can consume it later.
 */

interface ReportThemeState {
  templateId: string;
  brand: BrandTheme;
}

interface ReportThemeContextValue extends ReportThemeState {
  templates: ReportTemplate[];
  activeTemplate: ReportTemplate;
  /** Commit a template + brand theme (called by the Settings panel's Save). */
  save: (next: ReportThemeState) => void;
}

const STORAGE_KEY = 'co-marketer-report-theme';
const DEFAULT_STATE: ReportThemeState = {
  templateId: DEFAULT_TEMPLATE_ID,
  brand: DEFAULT_BRAND_THEME,
};

function loadState(): ReportThemeState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    const parsed = JSON.parse(raw);
    return {
      templateId: parsed.templateId ?? DEFAULT_STATE.templateId,
      brand: { ...DEFAULT_BRAND_THEME, ...(parsed.brand ?? {}) },
    };
  } catch {
    return DEFAULT_STATE;
  }
}

const ReportThemeContext = createContext<ReportThemeContextValue | null>(null);

export const ReportThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<ReportThemeState>(loadState);

  const activeTemplate = useMemo(
    () => REPORT_TEMPLATES.find((t) => t.id === state.templateId) ?? REPORT_TEMPLATES[0],
    [state.templateId]
  );

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* ignore */
    }
  }, [state]);

  const value: ReportThemeContextValue = {
    ...state,
    templates: REPORT_TEMPLATES,
    activeTemplate,
    save: (next) => setState(next),
  };

  return <ReportThemeContext.Provider value={value}>{children}</ReportThemeContext.Provider>;
};

export function useReportTheme(): ReportThemeContextValue {
  const ctx = useContext(ReportThemeContext);
  if (!ctx) throw new Error('useReportTheme must be used within ReportThemeProvider');
  return ctx;
}
