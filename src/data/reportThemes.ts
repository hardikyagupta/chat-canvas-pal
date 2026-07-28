// Report customization = the look applied to generated reports (see Reports page
// / ArtifactPreview). A report look is (1) a layout Template and (2) a Brand
// theme (colors + font). This is a prototype store: templates are static seeds,
// the user's selection + brand theme persist in localStorage via
// ReportThemeContext.

/** Visual traits a mini-preview renders from — kept small + declarative so new
 * templates are a one-line addition and the same traits drive every thumbnail. */
export interface ReportTemplate {
  id: string;
  name: string;
  /** One-line gallery description. */
  description: string;
  /** Masthead treatment. */
  header: 'rail' | 'band' | 'gradient' | 'plain';
  /** Card treatment for stat tiles / sections. */
  card: 'outlined' | 'soft' | 'borderless';
  /** Corner rounding scale. */
  radius: 'sm' | 'md' | 'lg';
  /** Vertical rhythm. */
  density: 'normal' | 'compact';
  /** Tint the page canvas with a wash of the accent color. */
  tint?: boolean;
  /** Inverted, high-contrast surface. */
  dark?: boolean;
}

export const REPORT_TEMPLATES: ReportTemplate[] = [
  { id: 'standard',  name: 'Standard',   description: 'Built-in dashboard layout with a navy section rail.', header: 'rail',     card: 'outlined',   radius: 'md', density: 'normal' },
  { id: 'executive', name: 'Executive',  description: 'Brand-banded corporate report with soft cards.',       header: 'band',     card: 'soft',       radius: 'md', density: 'normal' },
  { id: 'minimal',   name: 'Minimal',    description: 'Understated, whitespace-forward, borderless sections.', header: 'plain',    card: 'borderless', radius: 'sm', density: 'normal' },
  { id: 'editorial', name: 'Editorial',  description: 'Full-bleed gradient masthead, magazine-style.',         header: 'gradient', card: 'soft',       radius: 'lg', density: 'normal' },
  { id: 'compact',   name: 'Compact',    description: 'Dense, small-type layout for number-heavy reports.',    header: 'plain',    card: 'outlined',   radius: 'sm', density: 'compact' },
  { id: 'soft',      name: 'Soft Cards', description: 'Accent-tinted canvas with pronounced rounded cards.',    header: 'plain',    card: 'soft',       radius: 'lg', density: 'normal', tint: true },
  { id: 'dark',      name: 'Dark',       description: 'Inverted, high-contrast presentation look.',            header: 'band',     card: 'outlined',   radius: 'md', density: 'normal', dark: true },
];

/** Editable brand identity applied on top of a template. All colors are hex so
 * they round-trip through the native color picker. */
export interface BrandTheme {
  brandName: string;
  primary: string;
  accent: string;
  ink: string;
  background: string;
  surface: string;
  font: string;
}

export type BrandColorKey = 'primary' | 'accent' | 'ink' | 'background' | 'surface';

export const BRAND_COLOR_FIELDS: { key: BrandColorKey; label: string; hint: string }[] = [
  { key: 'primary',    label: 'Primary',    hint: 'Headers, mastheads and rails' },
  { key: 'accent',     label: 'Accent',     hint: 'Highlights, logo and emphasis' },
  { key: 'ink',        label: 'Ink',        hint: 'Body text and headings' },
  { key: 'background', label: 'Background', hint: 'Page canvas behind cards' },
  { key: 'surface',    label: 'Surface',    hint: 'Card and table fills' },
];

/** The "suggested" defaults — what "Reset to suggested" restores. */
export const DEFAULT_BRAND_THEME: BrandTheme = {
  brandName: 'Your Brand',
  primary: '#201D46',
  accent: '#E1703A',
  ink: '#17162E',
  background: '#F4F5FA',
  surface: '#FFFFFF',
  font: "Inter, 'Helvetica Neue', system-ui, -apple-system",
};

export const FONT_OPTIONS: string[] = [
  "Inter, 'Helvetica Neue', system-ui, -apple-system",
  "Manrope, system-ui, sans-serif",
  "'Georgia', 'Times New Roman', serif",
  "'IBM Plex Sans', system-ui, sans-serif",
  "'Space Grotesk', system-ui, sans-serif",
];

export const DEFAULT_TEMPLATE_ID = 'standard';
