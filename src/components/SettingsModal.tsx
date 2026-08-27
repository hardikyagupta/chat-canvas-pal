import React from 'react';
import {
  Search, Palette, UserRound, BookOpen, Check, X, ArrowLeft,
  Plus, Pencil, Trash2, MoreHorizontal, FileText, Upload, ChevronDown, ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAtmosphere } from '@/contexts/AtmosphereContext';
import { useTheme } from '../../components/theme-provider';
import ReportCustomizationPanel from './ReportCustomizationPanel';
import {
  BRAND_WIKI_CATEGORIES,
  BRAND_WIKI_SEED,
  type WikiFileStatus,
} from '@/data/brandWikiSeed';
import { DsButton } from '@/components/ui/ds-button';
import { BrandWikiIntake } from './decisioning/BrandWikiIntake';
import {
  EMPTY_BRAND_WIKI,
  useDecisioningSetupOptional,
  type BrandWikiData,
} from '@/contexts/DecisioningSetupContext';

const FONT = { fontFamily: 'Manrope, sans-serif' } as const;

type NavItem = { id: string; label: string; icon: React.ComponentType<{ className?: string }> };
// Only sections that lead somewhere real. The unbuilt ones (Model & behavior,
// Tools, Notifications, Privacy, Advanced) are deliberately absent rather than
// listed against a placeholder — a rail where two thirds of the rows go nowhere
// reads as a broken product, not a roadmap. Add them back as they land.
const NAV_SECTIONS: { title: string; items: NavItem[] }[] = [
  { title: 'KNOWLEDGE', items: [
    { id: 'wiki', label: 'Brand wiki', icon: BookOpen },
  ] },
  { title: 'APPEARANCE', items: [
    { id: 'theme', label: 'Theme', icon: Palette },
    { id: 'reports', label: 'Report customization', icon: FileText },
  ] },
  { title: 'ACCOUNT', items: [
    { id: 'profile', label: 'Profile', icon: UserRound },
  ] },
];

/** Panels that own their scrolling (sticky header + scrolling list) rather than
 *  letting the content column scroll them. */
const SELF_SCROLLING = new Set(['wiki', 'profile']);

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const [activeNav, setActiveNav] = React.useState('wiki');
  const { translucent, setTranslucent, themeId, setThemeId, presets } = useAtmosphere();
  const { theme, setTheme } = useTheme();

  React.useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-[16px] pointer-events-none">
        <div
          className="relative flex w-full max-w-[960px] h-[min(85vh,640px)] overflow-hidden rounded-[16px] bg-background shadow-[0px_20px_60px_-12px_oklch(0_0_0_/_0.28)] pointer-events-auto"
          role="dialog"
          aria-modal="true"
        >
          {/* ── Left rail (search + nav) ─────────────────────────────── */}
          <aside className="flex w-[264px] shrink-0 flex-col border-r border-[var(--color-line)] bg-card">
            <div className="flex items-center px-[16px] h-[56px] shrink-0">
              <span className="text-[15px] font-bold text-[var(--color-ink)]" style={FONT}>Settings</span>
            </div>
            <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-[12px] pb-[16px]">
              <div className="flex h-[38px] w-full shrink-0 items-center gap-[9px] rounded-[9px] border border-[var(--color-line-input)] bg-[oklch(1_0_0_/_0.56)] px-[11px]">
                <Search className="size-[16px] text-[var(--color-grey-soft)]" />
                <span className="text-[12px] text-[var(--color-grey-soft)]" style={FONT}>Search settings…</span>
              </div>

              <nav className="mt-[20px] flex flex-col gap-[20px]">
                {NAV_SECTIONS.map((section) => (
                  <div key={section.title} className="flex flex-col gap-[8px]">
                    <p className="text-[10px] font-medium uppercase tracking-[0.6px] text-[var(--color-grey-soft)]" style={FONT}>
                      {section.title}
                    </p>
                    <div className="flex flex-col">
                      {section.items.map((item) => {
                        const isActive = activeNav === item.id;
                        const Icon = item.icon;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => setActiveNav(item.id)}
                            className={cn(
                              'flex h-[38px] items-center gap-[10px] rounded-[8px] px-[10px] transition-colors',
                              isActive ? 'bg-[oklch(0_0_0_/_0.06)]' : 'hover:bg-[oklch(0_0_0_/_0.06)]'
                            )}
                          >
                            <Icon className={cn('size-[17px]', isActive ? 'text-[var(--color-ink)]' : 'text-[var(--color-slate)]')} />
                            <span
                              className={cn('text-[13px]', isActive ? 'font-medium text-[var(--color-ink)]' : 'text-[var(--color-slate)]')}
                              style={FONT}
                            >
                              {item.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </nav>
            </div>
          </aside>

          {/* ── Right column: content ────────────────────────────────── */}
          <div className="flex min-w-0 flex-1 flex-col bg-[var(--color-surface-0)]">
            <button
              type="button"
              onClick={onClose}
              aria-label="Close settings"
              className="absolute right-[14px] top-[14px] z-10 flex size-[32px] items-center justify-center rounded-[8px] text-[var(--color-slate)] hover:bg-[oklch(0_0_0_/_0.06)] transition-colors"
            >
              <X className="size-[18px]" />
            </button>
            <div
              className={cn(
                'min-h-0 flex-1',
                SELF_SCROLLING.has(activeNav) ? 'flex flex-col overflow-hidden' : 'overflow-y-auto',
              )}
            >
              <div
                className={cn(
                  'w-full max-w-[720px] px-[32px]',
                  SELF_SCROLLING.has(activeNav)
                    ? 'flex min-h-0 flex-1 flex-col py-[40px]'
                    : 'py-[40px]',
                )}
              >
                {activeNav === 'theme' ? (
                  <ThemePanel
                    translucent={translucent}
                    setTranslucent={setTranslucent}
                    theme={theme}
                    setTheme={setTheme}
                    themeId={themeId}
                    setThemeId={setThemeId}
                    presets={presets}
                  />
                ) : activeNav === 'reports' ? (
                  <ReportCustomizationPanel />
                ) : activeNav === 'profile' ? (
                  <PersonalizationPanel profileOnly />
                ) : (
                  // Browse-only, as the early release intended: entries are
                  // seeded and the Add/Upload actions stay hidden.
                  <PersonalizationPanel wikiOnly hideWikiActions />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

/* ── Theme panel ─────────────────────────────────────────────────── */
type Theme = ReturnType<typeof useTheme>['theme'];
const MODES: { id: Theme; label: string }[] = [
  { id: 'system', label: 'System' },
  { id: 'light', label: 'Light' },
  { id: 'dark', label: 'Dark' },
];

const ThemePanel: React.FC<{
  translucent: boolean;
  setTranslucent: (v: boolean) => void;
  theme: Theme;
  setTheme: (t: Theme) => void;
  themeId: string;
  setThemeId: (id: string) => void;
  presets: ReturnType<typeof useAtmosphere>['presets'];
}> = ({ translucent, setTranslucent, theme, setTheme, themeId, setThemeId, presets }) => {
  return (
    <div className="flex flex-col gap-[16px]">
      {/* Heading */}
      <div className="flex flex-col gap-[8px]">
        <h1 className="text-[24px] font-medium text-[var(--color-ink)]" style={FONT}>Theme</h1>
        <p className="text-[13px] text-[var(--color-grey)]" style={FONT}>
          Choose a subtle sidebar atmosphere while keeping content surfaces neutral and readable.
        </p>
      </div>

      {/* Interface mode */}
      <div className="flex h-[52px] items-center justify-between">
        <SettingCopy title="Interface mode" sub="Use system appearance or choose a fixed mode." />
        <div className="flex items-center gap-[2px] rounded-[9px] bg-[var(--color-surface-1)] p-[3px]">
          {MODES.map((m) => {
            const on = theme === m.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => setTheme(m.id)}
                className={cn(
                  'rounded-[7px] px-[13px] py-[7px] text-[12px] transition-colors',
                  on ? 'bg-card font-medium text-[var(--color-slate)] shadow-[0px_1px_0px_0px_oklch(0_0_0_/_0.02)]' : 'text-[var(--color-grey)]'
                )}
                style={FONT}
              >
                {m.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="h-px w-full bg-[var(--color-line)]" />

      {/* Translucent sidebar */}
      <div className="flex items-center justify-between">
        <SettingCopy title="Translucent sidebar" sub="Frost the navigation and reveal a soft color atmosphere behind it." />
        <Switch checked={translucent} onCheckedChange={setTranslucent} />
      </div>

      {/* Sidebar theme grid — only when translucent is on */}
      {translucent && (
        <div className="flex flex-col gap-[12px] animate-in fade-in slide-in-from-top-1 duration-300">
          <SettingCopy title="Sidebar theme" sub="Themes affect the settings rail and the main app navigation." />
          <div className="grid grid-cols-1 gap-[16px] sm:grid-cols-2">
            {presets.map((preset) => {
              const selected = themeId === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => setThemeId(preset.id)}
                  className={cn(
                    'relative flex h-[76px] items-center gap-[12px] rounded-[12px] border bg-card py-[11px] pl-[11px] pr-[12px] text-left transition-all',
                    selected ? 'border-[1.5px] border-[var(--color-royal)]' : 'border-[var(--color-line)] hover:border-[var(--color-line-strong)]'
                  )}
                >
                  <span
                    className="relative size-[54px] shrink-0 overflow-hidden rounded-[10px] shadow-[0px_8px_24px_-6px_oklch(0.18_0.03_265_/_0.18)] ring-1 ring-inset ring-[oklch(1_0_0_/_0.72)]"
                    style={{ backgroundImage: preset.swatch }}
                  >
                    {/* Mini UI mockup — matches Figma node 1819:6618 */}
                    <svg
                      viewBox="0 0 54 54"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      className="absolute inset-0 size-full"
                      aria-hidden="true"
                    >
                      <circle cx="12" cy="12" r="4" fill="white" fillOpacity="0.82" />
                      <rect x="8" y="23" width="30" height="3" rx="1.5" fill="white" fillOpacity="0.82" />
                      <rect x="8" y="31" width="24" height="3" rx="1.5" fill="white" fillOpacity="0.58" />
                      <rect x="8" y="39" width="24" height="3" rx="1.5" fill="white" fillOpacity="0.58" />
                    </svg>
                  </span>
                  <span className="flex min-w-0 flex-col gap-[3px]">
                    <span className="truncate text-[13px] font-medium text-[var(--color-slate)]" style={FONT}>{preset.name}</span>
                    <span className="truncate text-[11px] text-[var(--color-grey-soft)]" style={FONT}>{preset.hint}</span>
                  </span>
                  {selected && (
                    <span className="absolute right-[12px] top-[11px] flex size-[18px] items-center justify-center rounded-[9px] bg-[var(--color-royal)]">
                      <Check className="size-[10px] text-white" strokeWidth={3} />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

const SettingCopy: React.FC<{ title: string; sub: string }> = ({ title, sub }) => (
  <div className="flex flex-col gap-[3px]">
    <p className="text-[14px] font-medium text-[var(--color-slate)]" style={FONT}>{title}</p>
    <p className="text-[12px] text-[var(--color-grey-soft)]" style={FONT}>{sub}</p>
  </div>
);

/* ── Personalization panel ───────────────────────────────────────── */
type PersonalizationTab = 'profile' | 'wiki';

const TAB_LABEL: Record<PersonalizationTab, string> = {
  profile: 'Profile',
  wiki: 'Brand wiki',
};

/** The two halves of the brand wiki: the file library, and the brand intake
 *  form shared with the decisioning engine. Kept separate from
 *  PersonalizationTab, which still governs the Profile/Brand-wiki split. */
type WikiTab = 'sources' | 'brandProfile';

const WIKI_TAB_LABEL: Record<WikiTab, string> = {
  sources: 'Sources',
  brandProfile: 'Brand profile',
};

interface WikiItem {
  id: string;
  name: string;
  useWhen: string;
  content: string;
  enabled: boolean;
  createdAt: string; // display label, e.g. "28 Jul"
  fileName?: string; // set when the entry was created from an uploaded document
  category?: string;
  status?: WikiFileStatus;
}

const WIKI_STATUS_STYLES: Record<WikiFileStatus, string> = {
  validated: 'bg-[oklch(0.94_0.04_145)] text-[oklch(0.45_0.12_145)]',
  derived: 'bg-[oklch(0.94_0.04_250)] text-[oklch(0.45_0.12_250)]',
  'llm-synthesised': 'bg-[oklch(0.94_0.04_65)] text-[oklch(0.48_0.12_55)]',
  uploaded: 'bg-[oklch(0.94_0.04_145)] text-[oklch(0.45_0.12_145)]',
};

const seedToWikiItem = (seed: (typeof BRAND_WIKI_SEED)[number]): WikiItem => ({
  id: seed.id,
  name: seed.name,
  useWhen: seed.useWhen ?? '',
  content: seed.content,
  enabled: true,
  createdAt: '28 Jul',
  fileName: seed.fileName,
  category: seed.category,
  status: seed.status,
});

const WikiStatusBadge: React.FC<{ status: WikiFileStatus }> = ({ status }) => (
  <span
    className={cn(
      'shrink-0 rounded-full px-[10px] py-[3px] text-[11px] font-medium capitalize',
      WIKI_STATUS_STYLES[status],
    )}
    style={FONT}
  >
    {status}
  </span>
);

const WikiFileRow: React.FC<{
  item: WikiItem;
  onToggle: (id: string) => void;
  /** Tapping the file name reads it — the detail view opens in this same pane. */
  onOpen: (item: WikiItem) => void;
  onEdit: (item: WikiItem) => void;
  onRemove: (id: string) => void;
}> = ({ item, onToggle, onOpen, onEdit, onRemove }) => (
  <div
    className={cn(
      'group relative flex items-center justify-between gap-[12px] px-[14px] py-[11px] transition-opacity',
      !item.enabled && 'opacity-50',
    )}
  >
    <button
      type="button"
      onClick={() => onOpen(item)}
      className="min-w-0 flex-1 truncate text-left text-[13px] text-[var(--color-ink)] transition-colors hover:text-[var(--color-slate)]"
      style={FONT}
    >
      {item.fileName ?? `${item.name}.md`}
    </button>
    <div className="flex shrink-0 items-center gap-[10px]">
      {item.status && <WikiStatusBadge status={item.status} />}
      <Switch checked={item.enabled} onCheckedChange={() => onToggle(item.id)} />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label="Brand wiki options"
            className="flex size-[26px] items-center justify-center rounded-[6px] text-[var(--color-slate)] transition-colors hover:bg-[oklch(0_0_0_/_0.06)] data-[state=open]:bg-[oklch(0_0_0_/_0.06)]"
          >
            <MoreHorizontal className="size-[16px]" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          sideOffset={6}
          className="z-[60] w-[152px] rounded-[10px] border border-[var(--color-line)] bg-card p-[4px] shadow-[0px_12px_32px_-8px_oklch(0_0_0_/_0.22)]"
        >
          <DropdownMenuItem
            onClick={() => onEdit(item)}
            className="flex cursor-pointer items-center gap-[9px] rounded-[6px] px-[12px] py-[8px] text-[13px] text-[var(--color-slate)] focus:bg-[oklch(0_0_0_/_0.06)]"
            style={FONT}
          >
            <Pencil className="size-[15px]" /> Edit
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => onRemove(item.id)}
            className="flex cursor-pointer items-center gap-[9px] rounded-[6px] px-[12px] py-[8px] text-[13px] text-[var(--color-danger,oklch(0.58_0.2_25))] focus:bg-[oklch(0_0_0_/_0.06)]"
            style={FONT}
          >
            <Trash2 className="size-[15px]" /> Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  </div>
);

// Exported so other entry points can host the same profile/brand-wiki panel
// without the settings nav rail around it.
export const PersonalizationPanel: React.FC<{
  /** For hosts that render their own title/description in a header row — this
   * suppresses the panel's copy so the heading doesn't appear twice. Inside
   * Settings it stays on, where it's the only place the title appears. */
  hideHeading?: boolean;
  /** Locks the view to the brand wiki, dropping the tab switcher — the wiki is
   * its own item in the settings rail, so tabs would duplicate that nav. */
  wikiOnly?: boolean;
  /** Browse-only mode: hides the Add/Upload buttons above the wiki list,
   * leaving just the search. */
  hideWikiActions?: boolean;
  /** Mirror of `wikiOnly` for the Profile nav item — the brand wiki is its own
   * section in the rail now, so neither view needs the tab switcher. */
  profileOnly?: boolean;
}> = ({ hideHeading = false, wikiOnly = false, hideWikiActions = false, profileOnly = false }) => {
  const [tab, setTab] = React.useState<PersonalizationTab>(wikiOnly ? 'wiki' : 'profile');
  // One section per rail item, so the in-panel tabs only appear when a caller
  // asks for both halves at once.
  const singleSection = wikiOnly || profileOnly;

  // The brand profile is the decisioning engine's brand wiki: one shared store,
  // so filling it here ticks that setup step and vice versa. Optional hook —
  // this panel is exported for hosts that may sit outside the provider, and
  // without the context the Brand profile tab simply isn't offered.
  const setup = useDecisioningSetupOptional();
  const [wikiTab, setWikiTab] = React.useState<WikiTab>('sources');
  const showBrandProfile = wikiOnly && !!setup;
  // Settings unmounts on close (SettingsModal early-returns when !isOpen), so
  // this initialiser re-reads the store on every open — no re-seed effect.
  const [draft, setDraft] = React.useState<BrandWikiData>(() => setup?.brandWiki ?? EMPTY_BRAND_WIKI);
  const [justSaved, setJustSaved] = React.useState(false);

  const normalise = (d: BrandWikiData) => JSON.stringify({ ...d, website: d.website ?? '' });
  const brandProfileDirty = normalise(draft) !== normalise(setup?.brandWiki ?? EMPTY_BRAND_WIKI);

  const saveBrandProfile = () => {
    setup?.saveBrandWiki(draft);
    setJustSaved(true);
  };

  // Saved brand documents, listed read-only under Sources. Reads the store, not
  // the draft, so an unsaved upload doesn't appear as if it were filed. Honours
  // the search box, since it sits in the same list.
  const uploadedDocs = (setup?.brandWiki?.files ?? []).filter((f) =>
    f.name.toLowerCase().includes(query.trim().toLowerCase()),
  );

  // Profile fields
  const [nickname, setNickname] = React.useState('');
  const [occupation, setOccupation] = React.useState('');
  const [about, setAbout] = React.useState('');
  const [instructions, setInstructions] = React.useState('');

  // Brand wiki store — pre-seeded with generated .md files by category
  const [items, setItems] = React.useState<WikiItem[]>(() => BRAND_WIKI_SEED.map(seedToWikiItem));
  const [query, setQuery] = React.useState('');
  const [editorOpen, setEditorOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<WikiItem | null>(null);
  // The file currently being read. Held by id, not by value, so edits and the
  // enable toggle stay live while the detail view is open.
  const [viewingId, setViewingId] = React.useState<string | null>(null);
  const [collapsedCategories, setCollapsedCategories] = React.useState<Set<string>>(new Set());
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const wikiScrollRef = React.useRef<HTMLDivElement>(null);
  const wikiScrollTimerRef = React.useRef<ReturnType<typeof setTimeout>>();

  const handleWikiScroll = () => {
    const el = wikiScrollRef.current;
    if (!el) return;
    el.classList.add('is-scrolling');
    if (wikiScrollTimerRef.current) clearTimeout(wikiScrollTimerRef.current);
    wikiScrollTimerRef.current = setTimeout(() => {
      el.classList.remove('is-scrolling');
    }, 800);
  };

  React.useEffect(
    () => () => {
      if (wikiScrollTimerRef.current) clearTimeout(wikiScrollTimerRef.current);
    },
    [],
  );

  const filtered = items.filter((it) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    const haystack = [it.name, it.content, it.useWhen, it.fileName, it.category].filter(Boolean).join(' ').toLowerCase();
    return haystack.includes(q);
  });

  const grouped = React.useMemo(() => {
    const byCategory = new Map<string, WikiItem[]>();
    for (const item of filtered) {
      const cat = item.category ?? 'uploads';
      const list = byCategory.get(cat) ?? [];
      list.push(item);
      byCategory.set(cat, list);
    }
    const ordered = ['uploads', 'custom', ...BRAND_WIKI_CATEGORIES].filter((cat) => byCategory.has(cat));
    for (const cat of byCategory.keys()) {
      if (!ordered.includes(cat)) ordered.push(cat);
    }
    return ordered.map((category) => ({ category, items: byCategory.get(category)! }));
  }, [filtered]);

  const toggleCategory = (category: string) =>
    setCollapsedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) next.delete(category);
      else next.add(category);
      return next;
    });

  const openAdd = () => { setEditing(null); setEditorOpen(true); };
  const openEdit = (it: WikiItem) => { setEditing(it); setEditorOpen(true); };

  const addItem = (data: {
    name: string;
    content: string;
    useWhen?: string;
    fileName?: string;
    category?: string;
    status?: WikiFileStatus;
  }) => {
    const category = data.category ?? (data.fileName ? 'uploads' : 'custom');
    setCollapsedCategories((prev) => {
      const next = new Set(prev);
      next.delete(category);
      return next;
    });
    setItems((prev) => [
      {
        id: `k-${prev.length}-${prev.reduce((m, i) => Math.max(m, Number(i.id.split('-')[1]) || 0), 0) + 1}`,
        useWhen: '',
        category,
        status: data.fileName ? 'uploaded' : undefined,
        ...data,
        enabled: true,
        createdAt: '28 Jul',
      },
      ...prev,
    ]);
  };

  // Upload a document straight into the wiki (separate from the manual "Add"
  // flow). Text files have their contents read in; other docs are attached by
  // name with a short placeholder body.
  const MAX = 2000;
  const onUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-selecting the same file
    if (!file) return;
    const name = file.name.replace(/\.[^.]+$/, '');
    if (/\.(txt|md|markdown|csv|json|html?|rtf)$/i.test(file.name) || file.type.startsWith('text/')) {
      const reader = new FileReader();
      reader.onload = () =>
        addItem({ name, content: String(reader.result ?? '').slice(0, MAX), fileName: file.name });
      reader.readAsText(file);
    } else {
      addItem({ name, content: `Uploaded document: ${file.name}`, fileName: file.name });
    }
  };

  const handleSave = (data: { name: string; useWhen: string; content: string }) => {
    if (editing) {
      setItems((prev) => prev.map((it) => (it.id === editing.id ? { ...it, ...data } : it)));
    } else {
      addItem(data);
    }
    setEditorOpen(false);
    setEditing(null);
  };

  const toggle = (id: string) =>
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, enabled: !it.enabled } : it)));
  const remove = (id: string) => {
    setItems((prev) => prev.filter((it) => it.id !== id));
    setViewingId((cur) => (cur === id ? null : cur));
  };

  // Reading a file takes over this pane rather than stacking a dialog on the
  // settings dialog — the back arrow returns to the list, as in the wider
  // settings pattern where a detail replaces its list in place.
  const viewing = viewingId ? items.find((it) => it.id === viewingId) ?? null : null;
  if (viewing) {
    return (
      <>
        <WikiFileDetail
          item={viewing}
          onBack={() => setViewingId(null)}
          onToggle={() => toggle(viewing.id)}
          onEdit={() => openEdit(viewing)}
          onRemove={() => remove(viewing.id)}
        />
        {/* Edit still opens the editor dialog — it has to render here too, or
            editing from the detail view would do nothing. */}
        {editorOpen && (
          <WikiEditor
            initial={editing}
            onCancel={() => { setEditorOpen(false); setEditing(null); }}
            onSave={handleSave}
          />
        )}
      </>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* Sticky header — title, tabs, and wiki search stay fixed while list scrolls.
          No explicit background: it must blend into whichever panel hosts it
          (the settings content column, or a plain dialog) rather than opt into
          its own tint, or it reads as a separate boxed-off header. */}
      <div className="shrink-0 flex flex-col gap-[16px]">
        {!hideHeading && (
          <div className="flex flex-col gap-[8px]">
            <h1 className="text-[24px] font-medium text-[var(--color-ink)]" style={FONT}>
              {wikiOnly ? 'Brand wiki' : profileOnly ? 'Profile' : 'Memory & personalization'}
            </h1>
            <p className="text-[13px] text-[var(--color-grey)]" style={FONT}>
              {wikiOnly
                ? wikiTab === 'brandProfile'
                  ? 'Your brand story, voice and audience — shared with the decisioning engine.'
                  : 'The brand knowledge the assistant references when it writes for you.'
                : profileOnly
                  ? 'Who you are, so the assistant writes in your context.'
                  : 'Manage who you are and what the assistant remembers.'}
            </p>
          </div>
        )}

        {showBrandProfile && (
          <div className="flex items-center gap-[24px] border-b border-[var(--color-line)]">
            {(['sources', 'brandProfile'] as WikiTab[]).map((t) => {
              const on = wikiTab === t;
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => setWikiTab(t)}
                  className={cn(
                    'relative -mb-px pb-[10px] text-[14px] transition-colors',
                    on ? 'font-medium text-[var(--color-ink)]' : 'text-[var(--color-grey)] hover:text-[var(--color-slate)]'
                  )}
                  style={FONT}
                >
                  {WIKI_TAB_LABEL[t]}
                  {on && <span className="absolute inset-x-0 bottom-0 h-[2px] rounded-full bg-[var(--color-ink)]" />}
                </button>
              );
            })}
          </div>
        )}

        {!singleSection && (
          <div className="flex items-center gap-[24px] border-b border-[var(--color-line)]">
            {(['profile', 'wiki'] as PersonalizationTab[]).map((t) => {
              const on = tab === t;
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTab(t)}
                  className={cn(
                    'relative -mb-px pb-[10px] text-[14px] transition-colors',
                    on ? 'font-medium text-[var(--color-ink)]' : 'text-[var(--color-grey)] hover:text-[var(--color-slate)]'
                  )}
                  style={FONT}
                >
                  {TAB_LABEL[t]}
                  {on && <span className="absolute inset-x-0 bottom-0 h-[2px] rounded-full bg-[var(--color-ink)]" />}
                </button>
              );
            })}
          </div>
        )}

        {tab === 'wiki' && wikiTab === 'sources' && (
          <div className="flex items-center gap-[10px] pb-[4px]">
            <div className="flex h-[38px] flex-1 items-center gap-[9px] rounded-[9px] border border-[var(--color-line-input)] bg-[oklch(1_0_0_/_0.56)] px-[11px]">
              <Search className="size-[16px] text-[var(--color-grey-soft)]" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search brand wiki"
                className="min-w-0 flex-1 bg-transparent text-[13px] text-[var(--color-ink)] placeholder:text-[var(--color-grey-soft)] outline-none"
                style={FONT}
              />
            </div>
            {!hideWikiActions && (
              <>
                <DsButton onClick={openAdd}>
                  <Plus />
                  Add
                </DsButton>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".txt,.md,.markdown,.csv,.json,.html,.htm,.rtf,.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,text/*"
                  className="hidden"
                  onChange={onUpload}
                />
                <DsButton variant="tertiary" onClick={() => fileInputRef.current?.click()}>
                  <Upload />
                  Upload
                </DsButton>
              </>
            )}
          </div>
        )}
      </div>

      {/* Scrollable body */}
      <div
        ref={wikiScrollRef}
        onScroll={handleWikiScroll}
        className="scroll-reveal min-h-0 flex-1 overflow-y-auto pt-[16px]"
      >
      {tab === 'wiki' && wikiTab === 'brandProfile' ? (
        <div className="pt-[4px]">
          <BrandWikiIntake value={draft} onChange={(next) => { setDraft(next); setJustSaved(false); }} />
        </div>
      ) : tab === 'profile' ? (
        <div className="flex flex-col gap-[20px] pt-[4px]">
          <div className="grid grid-cols-1 gap-[16px] sm:grid-cols-2">
            <Field label="Nickname">
              <TextInput value={nickname} onChange={setNickname} placeholder="Jane" />
            </Field>
            <Field label="Occupation">
              <TextInput value={occupation} onChange={setOccupation} placeholder="Product designer" />
            </Field>
          </div>
          <Field label="More about you">
            <TextArea
              value={about}
              onChange={setAbout}
              rows={4}
              placeholder="I'm an Analyst based in NYC. I work mainly in React and SQL."
            />
            <p className="mt-[8px] text-[12px] text-[var(--color-grey-soft)]" style={FONT}>
              This information personalizes responses across all tasks.
            </p>
          </Field>
          <Field label="Custom Instructions">
            <TextArea
              value={instructions}
              onChange={setInstructions}
              rows={4}
              placeholder="Be concise and direct. Default to Python unless I say otherwise. When writing docs, use a professional tone."
            />
          </Field>
        </div>
      ) : (
        <div className="flex flex-col gap-[10px] pt-[4px]">
          {filtered.length === 0 && uploadedDocs.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-[10px] py-[72px]">
              <div className="flex size-[44px] items-center justify-center rounded-full bg-[var(--color-surface-1)]">
                <Search className="size-[20px] text-[var(--color-grey-soft)]" />
              </div>
              <p className="text-[13px] text-[var(--color-grey-soft)]" style={FONT}>
                No matches found
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-[10px]">
              {/* Documents uploaded on the Brand profile tab. Read-only here —
                  they belong to the brand profile, so they're shown for
                  findability rather than managed from this list. */}
              {uploadedDocs.length > 0 && (
                <div className="overflow-hidden rounded-[12px] border border-[var(--color-line)] bg-card">
                  <div className="flex items-center gap-[10px] bg-[var(--color-surface-1)] px-[14px] py-[11px]">
                    <Upload className="size-[15px] shrink-0 text-[var(--color-slate)]" />
                    <span className="text-[14px] font-semibold text-[var(--color-ink)]" style={FONT}>
                      Uploads
                    </span>
                    <span className="text-[13px] font-medium text-[var(--color-grey-soft)]" style={FONT}>
                      ({uploadedDocs.length})
                    </span>
                  </div>
                  <div className="divide-y divide-[var(--color-line)]">
                    {uploadedDocs.map((doc) => (
                      <div
                        key={doc.name}
                        className="flex items-center justify-between gap-[12px] px-[14px] py-[11px]"
                      >
                        <span className="min-w-0 flex-1 truncate text-[13px] text-[var(--color-ink)]" style={FONT}>
                          {doc.name}
                        </span>
                        <WikiStatusBadge status="uploaded" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {grouped.map(({ category, items: categoryItems }) => {
                const expanded = !collapsedCategories.has(category);
                return (
                  <div
                    key={category}
                    className="overflow-hidden rounded-[12px] border border-[var(--color-line)] bg-card"
                  >
                    <button
                      type="button"
                      onClick={() => toggleCategory(category)}
                      aria-expanded={expanded}
                      className={cn(
                        'flex w-full items-center gap-[10px] bg-[var(--color-surface-1)] px-[14px] py-[11px] text-left transition-colors hover:bg-[oklch(0_0_0_/_0.03)]',
                        expanded && 'border-b border-[var(--color-line)]',
                      )}
                    >
                      {expanded ? (
                        <ChevronDown className="size-[16px] shrink-0 text-[var(--color-slate)]" />
                      ) : (
                        <ChevronRight className="size-[16px] shrink-0 text-[var(--color-slate)]" />
                      )}
                      <span className="text-[14px] font-semibold text-[var(--color-ink)]" style={FONT}>
                        {category}
                      </span>
                      <span className="text-[13px] font-medium text-[var(--color-grey-soft)]" style={FONT}>
                        ({categoryItems.length})
                      </span>
                    </button>
                    {expanded && (
                      <div className="divide-y divide-[var(--color-line)]">
                        {categoryItems.map((it) => (
                          <WikiFileRow
                            key={it.id}
                            item={it}
                            onToggle={toggle}
                            onOpen={(it) => setViewingId(it.id)}
                            onEdit={openEdit}
                            onRemove={remove}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
      </div>

      {/* Brand profile action bar. A flex sibling after the scroll body rather
          than a sticky element — this panel is already a flex column with a
          flex-1 scroll area, so shrink-0 pins it to the bottom on its own. The
          negative margins let it span the settings pane's full width (same
          offsets ReportCustomizationPanel uses). Saving is explicit because
          saveBrandWiki also ticks the decisioning setup step — autosave would
          do that on the first keystroke. */}
      {tab === 'wiki' && wikiTab === 'brandProfile' && (
        <div className="shrink-0 -mx-[32px] -mb-[40px] mt-[16px] flex items-center gap-[12px] border-t border-[var(--color-line)] bg-[var(--color-surface-0)] px-[32px] pb-[24px] pt-[16px]">
          <p className="min-w-0 flex-1 text-[12px] leading-[17px] text-[var(--color-grey)]" style={FONT}>
            Answers guide content generation and the decisioning engine's setup.
          </p>
          {justSaved && !brandProfileDirty && (
            <span className="flex shrink-0 items-center gap-[5px] text-[12px] text-[var(--color-grey)]" style={FONT}>
              <Check className="size-[14px] text-[var(--color-success)]" strokeWidth={2.5} />
              Saved
            </span>
          )}
          <DsButton disabled={!brandProfileDirty} onClick={saveBrandProfile}>
            Save brand profile
          </DsButton>
        </div>
      )}

      {editorOpen && (
        <WikiEditor
          initial={editing}
          onCancel={() => { setEditorOpen(false); setEditing(null); }}
          onSave={handleSave}
        />
      )}
    </div>
  );
};

/* ── Brand wiki: single file ─────────────────────────────────────── */
/**
 * Reading view for one wiki entry, rendered in place of the list inside the
 * same settings pane. Header carries the way back; the file's own controls
 * (enable toggle, edit, delete) sit with its name so they read as acting on
 * this file rather than on the section.
 */
const WikiFileDetail: React.FC<{
  item: WikiItem;
  onBack: () => void;
  onToggle: () => void;
  onEdit: () => void;
  onRemove: () => void;
}> = ({ item, onBack, onToggle, onEdit, onRemove }) => (
  <div className="flex min-h-0 flex-1 flex-col">
    <div className="shrink-0 flex flex-col gap-[16px]">
      <button
        type="button"
        onClick={onBack}
        className="flex w-fit items-center gap-[8px] text-[14px] text-[var(--color-slate)] transition-colors hover:text-[var(--color-ink)]"
        style={FONT}
      >
        <ArrowLeft className="size-[16px]" />
        Sources
      </button>

      <div className="flex items-start justify-between gap-[16px]">
        <div className="flex min-w-0 flex-col gap-[6px]">
          <div className="flex items-center gap-[10px]">
            <h1 className="truncate text-[20px] font-medium text-[var(--color-ink)]" style={FONT}>
              {item.fileName ?? `${item.name}.md`}
            </h1>
            {item.status && <WikiStatusBadge status={item.status} />}
          </div>
          {item.useWhen && (
            <p className="text-[13px] leading-[19px] text-[var(--color-grey)]" style={FONT}>
              {item.useWhen}
            </p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-[10px]">
          <Switch checked={item.enabled} onCheckedChange={onToggle} />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label="Brand wiki options"
                className="flex size-[28px] items-center justify-center rounded-[6px] text-[var(--color-slate)] transition-colors hover:bg-[oklch(0_0_0_/_0.06)] data-[state=open]:bg-[oklch(0_0_0_/_0.06)]"
              >
                <MoreHorizontal className="size-[16px]" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              sideOffset={6}
              className="z-[60] w-[152px] rounded-[10px] border border-[var(--color-line)] bg-card p-[4px] shadow-[0px_12px_32px_-8px_oklch(0_0_0_/_0.22)]"
            >
              <DropdownMenuItem
                onClick={onEdit}
                className="flex cursor-pointer items-center gap-[9px] rounded-[6px] px-[12px] py-[8px] text-[13px] text-[var(--color-slate)] focus:bg-[oklch(0_0_0_/_0.06)]"
                style={FONT}
              >
                <Pencil className="size-[15px]" /> Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={onRemove}
                className="flex cursor-pointer items-center gap-[9px] rounded-[6px] px-[12px] py-[8px] text-[13px] text-[var(--color-danger,oklch(0.58_0.2_25))] focus:bg-[oklch(0_0_0_/_0.06)]"
                style={FONT}
              >
                <Trash2 className="size-[15px]" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>

    {/* The file's contents, boxed so the entry reads as a document rather than
        as more settings copy. Scrolls on its own; the header stays put. */}
    <div className="mt-[16px] min-h-0 flex-1 overflow-y-auto rounded-[12px] border border-[var(--color-line)] bg-card">
      <p
        className="whitespace-pre-wrap break-words px-[20px] py-[18px] text-[13px] leading-[21px] text-[var(--color-charcoal)]"
        style={FONT}
      >
        {item.content}
      </p>
    </div>
  </div>
);

const WikiEditor: React.FC<{
  initial: WikiItem | null;
  onCancel: () => void;
  onSave: (data: { name: string; useWhen: string; content: string; fileName?: string }) => void;
}> = ({ initial, onCancel, onSave }) => {
  const [name, setName] = React.useState(initial?.name ?? '');
  const [useWhen, setUseWhen] = React.useState(initial?.useWhen ?? '');
  const [content, setContent] = React.useState(initial?.content ?? '');
  const MAX = 2000;

  const canSave = name.trim().length > 0 && content.trim().length > 0;

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onCancel]);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-[16px]">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} />
      <div
        role="dialog"
        aria-modal="true"
        className="relative flex w-full max-w-[520px] flex-col gap-[18px] rounded-[16px] bg-background p-[24px] shadow-[0px_20px_60px_-12px_oklch(0_0_0_/_0.32)]"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-[17px] font-bold text-[var(--color-ink)]" style={FONT}>
            {initial ? 'Edit brand wiki entry' : 'Add to brand wiki'}
          </h2>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Close"
            className="flex size-[30px] items-center justify-center rounded-[8px] text-[var(--color-slate)] transition-colors hover:bg-[oklch(0_0_0_/_0.06)]"
          >
            <X className="size-[17px]" />
          </button>
        </div>

        <Field label="Name">
          <TextInput value={name} onChange={setName} placeholder="Name of the entry" />
        </Field>
        <Field label="Use when">
          <TextInput value={useWhen} onChange={setUseWhen} placeholder="When to use this entry" />
        </Field>
        <Field label="Content">
          <div className="relative">
            <TextArea
              value={content}
              onChange={(v) => setContent(v.slice(0, MAX))}
              rows={6}
              placeholder="Content of the entry"
            />
            <span className="pointer-events-none absolute bottom-[10px] right-[12px] text-[11px] text-[var(--color-grey-soft)]" style={FONT}>
              {content.length} / {MAX}
            </span>
          </div>
        </Field>

        <div className="flex items-center justify-end gap-[10px]">
          <DsButton variant="tertiary" onClick={onCancel}>Cancel</DsButton>
          <DsButton
            disabled={!canSave}
            onClick={() => canSave && onSave({ name: name.trim(), useWhen: useWhen.trim(), content: content.trim() })}
          >
            Save
          </DsButton>
        </div>
      </div>
    </div>
  );
};

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="flex flex-col gap-[8px]">
    <label className="text-[13px] font-medium text-[var(--color-slate)]" style={FONT}>{label}</label>
    {children}
  </div>
);

const TextInput: React.FC<{ value: string; onChange: (v: string) => void; placeholder?: string }> = ({ value, onChange, placeholder }) => (
  <input
    value={value}
    onChange={(e) => onChange(e.target.value)}
    placeholder={placeholder}
    className="h-[40px] w-full rounded-[9px] border border-[var(--color-line-input)] bg-[oklch(1_0_0_/_0.56)] px-[12px] text-[13px] text-[var(--color-ink)] placeholder:text-[var(--color-grey-soft)] outline-none transition-colors ds-field"
    style={FONT}
  />
);

const TextArea: React.FC<{ value: string; onChange: (v: string) => void; rows?: number; placeholder?: string }> = ({ value, onChange, rows = 4, placeholder }) => (
  <textarea
    value={value}
    onChange={(e) => onChange(e.target.value)}
    rows={rows}
    placeholder={placeholder}
    className="w-full resize-none rounded-[9px] border border-[var(--color-line-input)] bg-[oklch(1_0_0_/_0.56)] px-[12px] py-[10px] text-[13px] leading-[1.5] text-[var(--color-ink)] placeholder:text-[var(--color-grey-soft)] outline-none transition-colors ds-field"
    style={FONT}
  />
);

export default SettingsModal;
