import React from 'react';
import { Check, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useReportTheme } from '@/contexts/ReportThemeContext';
import {
  BRAND_COLOR_FIELDS,
  BrandTheme,
  DEFAULT_BRAND_THEME,
  FONT_OPTIONS,
  REPORT_TEMPLATES,
  ReportTemplate,
} from '@/data/reportThemes';
import { DsButton } from '@/components/ui/ds-button';

const FONT = { fontFamily: 'Manrope, sans-serif' } as const;

/* ── Mini report preview ─────────────────────────────────────────────
   A tiny, faithful mock of a rendered report. The SAME component powers the
   large "live preview" and every small template thumbnail — it just scales.
   Layout traits come from the template; all colors come from the brand theme. */

const RADIUS: Record<ReportTemplate['radius'], number> = { sm: 4, md: 7, lg: 11 };
const mix = (color: string, pct: number, base: string) =>
  `color-mix(in srgb, ${color} ${pct}%, ${base})`;

const ReportMiniPreview: React.FC<{
  template: ReportTemplate;
  brand: BrandTheme;
  /** Multiplier: ~1 for grid thumbnails, ~1.9 for the hero preview. */
  scale?: number;
}> = ({ template, brand, scale = 1 }) => {
  const s = scale;
  const dark = template.dark;

  const canvas = dark
    ? '#191828'
    : template.tint
    ? mix(brand.accent, 8, brand.background)
    : brand.background;
  const surface = dark ? 'rgba(255,255,255,0.07)' : brand.surface;
  const ink = dark ? '#F4F5FA' : brand.ink;
  const muted = dark ? 'rgba(244,245,250,0.5)' : mix(brand.ink, 45, brand.background);
  const line = dark ? 'rgba(255,255,255,0.12)' : mix(brand.ink, 12, brand.background);
  const rad = RADIUS[template.radius] * s;
  const pad = (template.density === 'compact' ? 8 : 11) * s;
  const gap = (template.density === 'compact' ? 5 : 7) * s;

  const cardStyle: React.CSSProperties =
    template.card === 'soft'
      ? { background: mix(brand.accent, 7, surface), borderRadius: rad, boxShadow: `0 ${1 * s}px ${3 * s}px oklch(0 0 0 / 0.06)` }
      : template.card === 'borderless'
      ? { background: 'transparent' }
      : { background: surface, borderRadius: rad * 0.8, border: `1px solid ${line}` };

  // A little text/number "bar".
  const bar = (w: string | number, h: number, color: string, r = 2) => (
    <div style={{ width: w, height: h * s, background: color, borderRadius: r * s }} />
  );

  const logo = (
    <div
      style={{ width: 9 * s, height: 9 * s, borderRadius: 2.5 * s, background: brand.accent, flexShrink: 0 }}
    />
  );

  const statTile = (withChip: boolean) => (
    <div style={{ ...cardStyle, flex: 1, padding: pad * 0.85, display: 'flex', flexDirection: 'column', gap: 4 * s }}>
      {bar('62%', 9, ink, 2)}
      {bar('44%', 4, muted, 2)}
      {withChip && (
        <div
          style={{
            marginTop: 1 * s,
            alignSelf: 'flex-start',
            padding: `${1.5 * s}px ${4 * s}px`,
            borderRadius: 10 * s,
            fontSize: 0,
            background: mix(brand.accent, 18, surface),
            height: 7 * s,
            width: 26 * s,
          }}
        />
      )}
    </div>
  );

  const table = (
    <div style={{ ...cardStyle, padding: template.card === 'borderless' ? 0 : pad * 0.7, display: 'flex', flexDirection: 'column', gap: gap * 0.7 }}>
      {[0, 1, template.density === 'compact' ? 2 : -1].filter((r) => r !== -1).map((r) => (
        <div key={r} style={{ display: 'flex', alignItems: 'center', gap: 6 * s }}>
          {bar('40%', r === 0 ? 5 : 4, r === 0 ? mix(ink, 70, canvas) : muted, 2)}
          <div style={{ flex: 1 }} />
          {bar('22%', r === 0 ? 5 : 4, r === 0 ? mix(ink, 70, canvas) : muted, 2)}
        </div>
      ))}
    </div>
  );

  const content = (
    <div style={{ display: 'flex', flexDirection: 'column', gap, flex: 1, minWidth: 0, padding: pad }}>
      {/* Report title */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 * s }}>
        {bar('70%', 8, ink, 2)}
        {bar('40%', 4, muted, 2)}
        {template.header === 'plain' && (
          <div style={{ width: 18 * s, height: 2 * s, background: brand.accent, borderRadius: 2, marginTop: 2 * s }} />
        )}
      </div>
      <div style={{ display: 'flex', gap }}>
        {statTile(true)}
        {statTile(false)}
      </div>
      {table}
    </div>
  );

  // Header treatments
  const bandBg =
    template.header === 'gradient'
      ? `linear-gradient(90deg, ${brand.primary}, ${brand.accent})`
      : brand.primary;

  const banner = (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6 * s,
        padding: `${pad * 0.7}px ${pad}px`,
        background: bandBg,
      }}
    >
      {logo}
      {bar('34%', 6, 'rgba(255,255,255,0.92)', 2)}
    </div>
  );

  return (
    <div
      style={{
        fontFamily: brand.font,
        background: canvas,
        borderRadius: rad + 2 * s,
        overflow: 'hidden',
        border: dark ? '1px solid rgba(255,255,255,0.08)' : `1px solid ${mix(brand.ink, 9, brand.background)}`,
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {(template.header === 'band' || template.header === 'gradient') && banner}
      {template.header === 'rail' ? (
        <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
          {/* section rail */}
          <div
            style={{
              width: `${26}%`,
              background: brand.primary,
              padding: pad * 0.8,
              display: 'flex',
              flexDirection: 'column',
              gap: 6 * s,
            }}
          >
            {logo}
            <div style={{ marginTop: 4 * s, display: 'flex', flexDirection: 'column', gap: 5 * s }}>
              {bar('80%', 4, 'rgba(255,255,255,0.9)', 2)}
              {bar('60%', 4, 'rgba(255,255,255,0.5)', 2)}
              {bar('66%', 4, 'rgba(255,255,255,0.5)', 2)}
            </div>
          </div>
          {content}
        </div>
      ) : (
        content
      )}
    </div>
  );
};

/* ── Panel ───────────────────────────────────────────────────────────── */

const brandEqual = (a: BrandTheme, b: BrandTheme) =>
  (Object.keys(a) as (keyof BrandTheme)[]).every((k) => a[k] === b[k]);

const ReportCustomizationPanel: React.FC = () => {
  const { templateId, brand, save } = useReportTheme();

  // Edit a local draft; commit on Save.
  const [draftTemplate, setDraftTemplate] = React.useState(templateId);
  const [draftBrand, setDraftBrand] = React.useState<BrandTheme>(brand);
  const [justSaved, setJustSaved] = React.useState(false);

  const dirty = draftTemplate !== templateId || !brandEqual(draftBrand, brand);
  const activeTemplate = REPORT_TEMPLATES.find((t) => t.id === draftTemplate) ?? REPORT_TEMPLATES[0];

  const patchBrand = (patch: Partial<BrandTheme>) => {
    setDraftBrand((b) => ({ ...b, ...patch }));
    setJustSaved(false);
  };
  const selectTemplate = (id: string) => {
    setDraftTemplate(id);
    setJustSaved(false);
  };
  const onSave = () => {
    save({ templateId: draftTemplate, brand: draftBrand });
    setJustSaved(true);
  };
  const onReset = () => {
    setDraftBrand(DEFAULT_BRAND_THEME);
    setJustSaved(false);
  };

  return (
    <div className="flex flex-col gap-[16px]">
      {/* Heading */}
      <div className="flex flex-col gap-[8px]">
        <h1 className="text-[24px] font-medium text-[var(--color-ink)]" style={FONT}>Report customization</h1>
        <p className="text-[13px] text-[var(--color-grey)]" style={FONT}>
          Pick a layout and apply your brand. New reports render in this style — no full preview to manage, just a live thumbnail.
        </p>
      </div>

      {/* ── Live preview + summary ─────────────────────────────────── */}
      <div className="flex items-stretch gap-[16px] rounded-[14px] border border-[var(--color-line)] bg-card p-[16px]">
        <div className="w-[176px] shrink-0 h-[132px]">
          <ReportMiniPreview template={activeTemplate} brand={draftBrand} scale={1.9} />
        </div>
        <div className="flex min-w-0 flex-1 flex-col justify-center gap-[6px]">
          <span className="inline-flex w-fit items-center gap-[6px] rounded-full bg-[var(--color-surface-1)] px-[10px] py-[3px] text-[11px] font-medium text-[var(--color-grey)]" style={FONT}>
            Live preview
          </span>
          <p className="text-[15px] font-semibold text-[var(--color-ink)]" style={FONT}>{activeTemplate.name}</p>
          <p className="text-[12px] leading-[1.5] text-[var(--color-grey-soft)]" style={FONT}>{activeTemplate.description}</p>
          <p className="text-[12px] text-[var(--color-grey-soft)]" style={FONT}>
            Brand · <span style={{ fontFamily: draftBrand.font }} className="text-[var(--color-slate)]">{draftBrand.brandName}</span>
          </p>
        </div>
      </div>

      {/* ── Template gallery ───────────────────────────────────────── */}
      <SectionLabel title="Template" sub="Each card is its own preview — pick the layout that fits the report." />
      <div className="grid grid-cols-2 gap-[12px] sm:grid-cols-3">
        {REPORT_TEMPLATES.map((t) => {
          const selected = draftTemplate === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => selectTemplate(t.id)}
              className={cn(
                'group relative flex flex-col gap-[8px] rounded-[12px] border p-[8px] text-left transition-all',
                selected
                  ? 'border-[1.5px] border-[var(--color-royal)] bg-[color-mix(in_oklch,var(--color-royal)_5%,var(--color-card))]'
                  : 'border-[var(--color-line)] bg-card hover:border-[var(--color-line-strong)]'
              )}
            >
              <div className="h-[76px] w-full overflow-hidden rounded-[9px]">
                <ReportMiniPreview template={t} brand={draftBrand} scale={0.92} />
              </div>
              <div className="flex flex-col gap-[1px] px-[2px] pb-[1px]">
                <span className="text-[12px] font-medium text-[var(--color-ink)]" style={FONT}>{t.name}</span>
                <span className="line-clamp-1 text-[11px] text-[var(--color-grey-soft)]" style={FONT}>{t.description}</span>
              </div>
              {selected && (
                <span className="absolute right-[10px] top-[10px] flex size-[18px] items-center justify-center rounded-[9px] bg-[var(--color-royal)] shadow-sm">
                  <Check className="size-[10px] text-white" strokeWidth={3} />
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="h-px w-full bg-[var(--color-line)]" />

      {/* ── Brand theme ────────────────────────────────────────────── */}
      <SectionLabel title="Brand theme" sub="Colors and type applied across every template. Changes update the preview instantly." />

      {/* Brand name */}
      <div className="flex flex-col gap-[8px]">
        <label className="text-[13px] font-medium text-[var(--color-slate)]" style={FONT}>Brand name</label>
        <input
          value={draftBrand.brandName}
          onChange={(e) => patchBrand({ brandName: e.target.value })}
          placeholder="Your Brand"
          className="h-[40px] w-full rounded-[9px] border border-[var(--color-line-input)] bg-[oklch(1_0_0_/_0.56)] px-[12px] text-[13px] text-[var(--color-ink)] placeholder:text-[var(--color-grey-soft)] outline-none transition-colors ds-field"
          style={FONT}
        />
      </div>

      {/* Color swatches */}
      <div className="flex flex-col gap-[8px]">
        <label className="text-[13px] font-medium text-[var(--color-slate)]" style={FONT}>Colors</label>
        <div className="grid grid-cols-2 gap-[10px] sm:grid-cols-3">
          {BRAND_COLOR_FIELDS.map((field) => (
            <ColorSwatch
              key={field.key}
              label={field.label}
              hint={field.hint}
              value={draftBrand[field.key]}
              onChange={(v) => patchBrand({ [field.key]: v } as Partial<BrandTheme>)}
            />
          ))}
        </div>
      </div>

      {/* Font */}
      <div className="flex flex-col gap-[8px]">
        <label className="text-[13px] font-medium text-[var(--color-slate)]" style={FONT}>Font</label>
        <div className="relative">
          <select
            value={draftBrand.font}
            onChange={(e) => patchBrand({ font: e.target.value })}
            className="h-[40px] w-full appearance-none rounded-[9px] border border-[var(--color-line-input)] bg-[oklch(1_0_0_/_0.56)] px-[12px] pr-[36px] text-[13px] text-[var(--color-ink)] outline-none transition-colors ds-field"
            style={{ fontFamily: draftBrand.font }}
          >
            {FONT_OPTIONS.map((f) => (
              <option key={f} value={f} style={{ fontFamily: f }}>
                {f.split(',')[0].replace(/'/g, '')}
              </option>
            ))}
          </select>
          <svg className="pointer-events-none absolute right-[12px] top-1/2 -translate-y-1/2 text-[var(--color-grey-soft)]" width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2.5 4.5L6 8l3.5-3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>

      {/* Actions — pinned to the bottom of the scrollable settings pane so they
          stay visible while the customization options scroll underneath. The
          negative margins + padding let the bar span the pane's full width and
          sit flush with its bottom edge, covering the content that scrolls by. */}
      <div className="sticky bottom-0 z-10 -mx-[32px] -mb-[40px] mt-[4px] flex items-center justify-between border-t border-[var(--color-line)] bg-[var(--color-surface-0)] px-[32px] pb-[24px] pt-[16px]">
        <DsButton variant="tertiary" onClick={onReset}>
          <RotateCcw />
          Reset to suggested
        </DsButton>
        <div className="flex items-center gap-[12px]">
          {justSaved && !dirty && (
            <span className="flex items-center gap-[5px] text-[12px] text-[var(--color-grey)]" style={FONT}>
              <Check className="size-[14px] text-[var(--color-success,oklch(0.6_0.15_150))]" strokeWidth={2.5} />
              Saved
            </span>
          )}
          <DsButton disabled={!dirty} onClick={onSave}>Save theme</DsButton>
        </div>
      </div>
    </div>
  );
};

const SectionLabel: React.FC<{ title: string; sub: string }> = ({ title, sub }) => (
  <div className="flex flex-col gap-[3px]">
    <p className="text-[14px] font-medium text-[var(--color-slate)]" style={FONT}>{title}</p>
    <p className="text-[12px] text-[var(--color-grey-soft)]" style={FONT}>{sub}</p>
  </div>
);

const ColorSwatch: React.FC<{
  label: string;
  hint: string;
  value: string;
  onChange: (v: string) => void;
}> = ({ label, hint, value, onChange }) => (
  <label
    className="flex cursor-pointer items-center gap-[10px] rounded-[10px] border border-[var(--color-line-input)] bg-card p-[8px] transition-colors hover:border-[var(--color-line-strong)]"
    title={hint}
  >
    <span
      className="relative size-[34px] shrink-0 overflow-hidden rounded-[8px] ring-1 ring-inset ring-[oklch(0_0_0_/_0.08)]"
      style={{ background: value }}
    >
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="absolute inset-0 size-full cursor-pointer opacity-0"
        aria-label={`${label} color`}
      />
    </span>
    <span className="flex min-w-0 flex-col">
      <span className="text-[12px] font-medium text-[var(--color-slate)]" style={FONT}>{label}</span>
      <span className="truncate text-[11px] uppercase tracking-[0.3px] text-[var(--color-grey-soft)]" style={FONT}>{value}</span>
    </span>
  </label>
);

export default ReportCustomizationPanel;
