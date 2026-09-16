import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import * as SwitchPrimitives from "@radix-ui/react-switch";
import {
  ArrowRight,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Copy,
  FlaskConical,
  ImageIcon,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AppleIcon, AndroidIcon } from "./PlatformIcons";
import AiSuggestPopover from "./AiSuggestPopover";

const fieldClass =
  "h-10 w-full rounded-md border border-[#DDE2EE] bg-[#F7F9FC] px-3 font-manrope text-sm text-[#17173A] outline-none transition-colors placeholder:text-[#A0A0A0] focus:border-[#2F68E5] focus:bg-white";

const TITLE_SUGGESTIONS = [
  "Your next favourite is here",
  "Fresh finds, picked for you",
  "Discover the latest collection",
  "A little inspiration for your day",
  "Explore something new today",
  "Swipe through our newest arrivals",
];

const DESCRIPTION_SUGGESTIONS = [
  "Explore the collection and find your next favourite.",
  "Swipe through the latest arrivals, handpicked for you.",
  "Discover fresh styles and make them yours today.",
  "Take a closer look at what's new in store.",
  "Find something you'll love in our latest collection.",
  "Tap to explore the details and shop your favourites.",
];

function CopyField({
  label,
  value,
  placeholder,
  onChange,
  suggestions,
  suggestionLabel,
}: {
  label: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
  suggestions: string[];
  suggestionLabel: string;
}) {
  return (
    <Field label={label}>
      <div className="relative">
        <input
          aria-label={label}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={cn(fieldClass, "pr-11")}
        />
        <div className="absolute right-2 top-1.5">
          <AiSuggestPopover pool={suggestions} onPick={onChange} ariaLabel={suggestionLabel} />
        </div>
      </div>
    </Field>
  );
}

/** Same compact toggle used across the wizard. */
function MiniSwitch({
  checked,
  onCheckedChange,
}: {
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
}) {
  return (
    <SwitchPrimitives.Root
      checked={checked}
      onCheckedChange={onCheckedChange}
      className="peer inline-flex h-4 w-7 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background data-[state=checked]:bg-[#00C48C] data-[state=unchecked]:bg-input"
    >
      <SwitchPrimitives.Thumb className="pointer-events-none block h-3 w-3 rounded-full bg-background shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-3 data-[state=unchecked]:translate-x-0" />
    </SwitchPrimitives.Root>
  );
}

function Radio({ checked }: { checked: boolean }) {
  return (
    <span
      className={cn(
        "grid size-[18px] shrink-0 place-items-center rounded-full border-2 transition-colors",
        checked ? "border-[#2F68E5]" : "border-[#C3CAD9]"
      )}
    >
      {checked && <span className="size-2 rounded-full bg-[#2F68E5]" />}
    </span>
  );
}

function RadioRow<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-6">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className="flex items-center gap-2 text-left"
        >
          <Radio checked={value === o.value} />
          <span
            className={cn(
              "font-manrope text-sm text-[#17173A]",
              value === o.value ? "font-semibold" : "font-medium"
            )}
          >
            {o.label}
          </span>
        </button>
      ))}
    </div>
  );
}

function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 flex items-baseline gap-1.5 font-manrope text-sm font-semibold text-[#17173A]">
        {label}
        {required && <span className="text-[#FC5E02]">*</span>}
        {hint && <span className="font-manrope text-xs font-normal text-[#8A8AA3]">{hint}</span>}
      </label>
      {children}
    </div>
  );
}

/** A toggle row with a label, optional hint, matching the settings drawer's
 *  own toggle rows — reused here for the long list of on/off options. */
function ToggleRow({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-6 py-4">
      <div>
        <p className="font-manrope text-sm font-semibold text-[#17173A]">{label}</p>
        {hint && <p className="mt-0.5 font-manrope text-xs text-[#6F6F8D]">{hint}</p>}
      </div>
      <MiniSwitch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

/** Compact portal-based single-select — same pattern as every other
 *  dropdown in this wizard, so a long option list isn't clipped by the
 *  accordion card's overflow:hidden. */
function SelectDropdown({
  value,
  placeholder,
  options,
  onChange,
}: {
  value: string;
  placeholder?: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (!wrapRef.current?.contains(target) && !panelRef.current?.contains(target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  useLayoutEffect(() => {
    if (!open) return;
    const update = () => wrapRef.current && setRect(wrapRef.current.getBoundingClientRect());
    update();
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [open]);

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex h-10 w-full items-center justify-between gap-2 rounded-md border bg-white px-3 font-manrope text-sm outline-none transition-colors",
          open ? "border-[#2F68E5]" : "border-[#DDE2EE]",
          value ? "text-[#17173A]" : "text-[#A0A0A0]"
        )}
      >
        <span className="truncate">{value || placeholder}</span>
        <ChevronDown
          className={cn("size-4 shrink-0 text-[#8A8AA3] transition-transform", open && "rotate-180")}
          strokeWidth={2}
        />
      </button>
      {open &&
        rect &&
        createPortal(
          <div
            ref={panelRef}
            style={{ position: "fixed", top: rect.bottom + 4, left: rect.left, width: rect.width }}
            className="scroll-slim z-[120] max-h-[220px] overflow-y-auto rounded-md border border-[#DDE2EE] bg-white py-1 shadow-[0_8px_24px_rgba(23,23,58,0.12)]"
          >
            {options.map((o) => (
              <button
                key={o}
                type="button"
                onClick={() => {
                  onChange(o);
                  setOpen(false);
                }}
                className={cn(
                  "block w-full px-3 py-2 text-left font-manrope text-sm transition-colors",
                  o === value ? "bg-[#F4F8FF] font-semibold text-[#2F68E5]" : "text-[#17173A] hover:bg-[#F7F9FC]"
                )}
              >
                {o}
              </button>
            ))}
          </div>,
          document.body
        )}
    </div>
  );
}

type CTAType = "Deeplink" | "Open app" | "Web URL";
type OverlayType = "solid" | "gradient";

interface CarouselImage {
  id: string;
  uploadMode: "url" | "upload";
  mediaUrl: string;
  cardTitle: string;
  cardDescription: string;
  ctaType: CTAType;
  deeplinkUrl: string;
  overlayType: OverlayType;
  solidColor: string;
  gradientFrom: string;
  gradientTo: string;
}

function newImage(n: number): CarouselImage {
  return {
    id: `img-${n}-${Date.now()}`,
    uploadMode: "url",
    mediaUrl: "",
    cardTitle: "",
    cardDescription: "",
    ctaType: "Deeplink",
    deeplinkUrl: "",
    overlayType: "solid",
    solidColor: "#FFFFFF00",
    gradientFrom: "#FFFFFFFF",
    gradientTo: "#000000FF",
  };
}

interface OSConfig {
  subtitleEnabled: boolean;
  carouselType: "manual" | "automatic";
  transitionEffect: string;
  transitionRate: string;
  images: CarouselImage[];
  activeImageId: string;
  backgroundColorEnabled: boolean;
  actionButtonEnabled: boolean;
  stickyNotificationEnabled: boolean;
  customizeCollapsedEnabled: boolean;
  soundEnabled: boolean;
  addOnOptionsEnabled: boolean;
}

function newOSConfig(): OSConfig {
  const first = newImage(1);
  const second = newImage(2);
  return {
    subtitleEnabled: false,
    carouselType: "manual",
    transitionEffect: "None",
    transitionRate: "",
    images: [first, second],
    activeImageId: first.id,
    backgroundColorEnabled: false,
    actionButtonEnabled: false,
    stickyNotificationEnabled: false,
    customizeCollapsedEnabled: false,
    soundEnabled: false,
    addOnOptionsEnabled: false,
  };
}

const TRANSITION_EFFECTS = ["None", "Slide", "Fade", "Zoom"];
const TRANSITION_RATES = ["1s", "2s", "3s", "5s"];
const CTA_TYPES: CTAType[] = ["Deeplink", "Open app", "Web URL"];
const LANDING_PAGES = ["App Homepage", "Product page", "Cart", "Custom URL"];

/** The phone mockup on the preview column — a live CSS mock (not a static
 *  screenshot) that reflects what's been filled in on the left as it's
 *  typed, since there's no rendered asset to screenshot yet. */
function CarouselPhoneMock({
  os,
  expanded,
  title,
  image,
}: {
  os: "android" | "ios";
  expanded: boolean;
  title: string;
  image: CarouselImage;
}) {
  return (
    <div
      className={cn(
        "relative mx-auto overflow-hidden border-[10px] border-[#17173A] bg-white shadow-[0_20px_40px_rgba(23,23,58,0.18)]",
        os === "ios" ? "rounded-[38px]" : "rounded-[28px]"
      )}
      style={{ width: 220 }}
    >
      {/* Notch / camera cutout */}
      <div
        aria-hidden="true"
        className={cn(
          "absolute left-1/2 top-0 z-10 -translate-x-1/2 bg-[#17173A]",
          os === "ios" ? "h-[18px] w-[90px] rounded-b-2xl" : "h-[10px] w-[10px] translate-y-1 rounded-full"
        )}
      />
      <div className="flex h-9 items-center justify-between bg-[#F7F9FC] px-3 pt-2">
        <span className="grid size-5 place-items-center rounded bg-white text-[8px] font-bold text-[#8A8AA3]">
          <ImageIcon className="size-3" strokeWidth={2} />
        </span>
        <span className="font-manrope text-[11px] font-semibold text-[#17173A]">
          {title || "Brand name"}
        </span>
        <ChevronDown className="size-3.5 text-[#8A8AA3]" strokeWidth={2} />
      </div>

      <div
        className={cn(
          "flex flex-col items-center justify-center gap-2 bg-[#EEF1F7] transition-all duration-300",
          expanded ? "h-[130px]" : "h-[70px]"
        )}
      >
        {image.mediaUrl ? (
          <img src={image.mediaUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <>
            <ImageIcon className="size-6 text-[#B9C6E4]" strokeWidth={1.5} />
            <span className="font-manrope text-[10px] font-semibold text-[#2F68E5]">
              Recommended -200 x 100 (2:1)
            </span>
          </>
        )}
      </div>

      {expanded && (
        <div className="flex items-center justify-between border-t border-[#EEF1F7] bg-white px-2 py-1.5">
          <ChevronLeft className="size-3.5 text-[#8A8AA3]" strokeWidth={2} />
          <span className="flex items-center gap-1">
            <span className="size-1.5 rounded-full bg-[#2F68E5]" />
            <span className="size-1.5 rounded-full bg-[#DDE2EE]" />
          </span>
          <ChevronRight className="size-3.5 text-[#8A8AA3]" strokeWidth={2} />
        </div>
      )}
    </div>
  );
}

/**
 * Full-screen builder for the "Carousel (E2E)" push layout — opened from the
 * Message step's "Create new" menu. Three-quarters of the row is the
 * configuration form (title/description, APN interactions per OS, the
 * carousel's own cards, delivery toggles); the last quarter is a sticky
 * live preview, same split as this layout's actual reference design.
 */
export default function CarouselTemplateEditor({ onBack }: { onBack: () => void }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [landingPage, setLandingPage] = useState("App Homepage");
  const [os, setOs] = useState<"android" | "ios">("android");
  const [expanded, setExpanded] = useState(true);
  const [android, setAndroid] = useState<OSConfig>(newOSConfig);
  const [ios, setIos] = useState<OSConfig>(newOSConfig);
  const [primaryKey, setPrimaryKey] = useState("");

  const cfg = os === "android" ? android : ios;
  const setCfg = os === "android" ? setAndroid : setIos;
  const patchCfg = (patch: Partial<OSConfig>) => setCfg((c) => ({ ...c, ...patch }));

  const activeImage = cfg.images.find((i) => i.id === cfg.activeImageId) ?? cfg.images[0];
  const patchActiveImage = (patch: Partial<CarouselImage>) =>
    patchCfg({
      images: cfg.images.map((i) => (i.id === activeImage.id ? { ...i, ...patch } : i)),
    });

  const addImage = () => {
    const img = newImage(cfg.images.length + 1);
    patchCfg({ images: [...cfg.images, img], activeImageId: img.id });
  };

  const copyFromOther = () => {
    const source = os === "android" ? ios : android;
    setCfg({ ...source, images: source.images.map((i) => ({ ...i, id: `${i.id}-copy` })) });
  };

  return (
    <div className="mt-10 space-y-8">
      <div className="grid grid-cols-[minmax(0,1fr)_348px] items-center gap-6">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 justify-self-start font-manrope text-sm font-semibold text-[#2F68E5]"
        >
          <ChevronLeft className="size-4" strokeWidth={2.2} />
          Change layout
        </button>
        <div className="flex shrink-0 items-center gap-2 whitespace-nowrap">
          <div className="inline-flex shrink-0">
            {(["android", "ios"] as const).map((o, i) => (
              <button
                key={o}
                type="button"
                aria-label={o === "android" ? "Android" : "iOS"}
                aria-pressed={os === o}
                onClick={() => setOs(o)}
                className={cn(
                  "flex h-8 w-9 items-center justify-center border font-manrope text-sm font-medium transition-colors",
                  i > 0 && "-ml-px",
                  i === 0 && "rounded-l-md",
                  i === 1 && "rounded-r-md",
                  os === o
                    ? "relative z-[1] border-[#2F68E5] bg-[#F4F8FF] text-[#2F68E5]"
                    : "border-[#DDE2EE] text-[#17173A] hover:bg-[#F7F9FC]"
                )}
              >
                {o === "android" ? <AndroidIcon className="size-4" /> : <AppleIcon className="size-4" />}
              </button>
            ))}
          </div>

          <div className="inline-flex shrink-0">
            {([true, false] as const).map((v, i) => (
              <button
                key={String(v)}
                type="button"
                onClick={() => setExpanded(v)}
                className={cn(
                  "-ml-px flex h-8 items-center border px-3 font-manrope text-sm font-medium transition-colors first:ml-0",
                  i === 0 && "rounded-l-md",
                  i === 1 && "rounded-r-md",
                  expanded === v
                    ? "relative z-[1] border-[#2F68E5] bg-[#F4F8FF] text-[#2F68E5]"
                    : "border-[#DDE2EE] text-[#17173A] hover:bg-[#F7F9FC]"
                )}
              >
                {v ? "Expanded" : "Collapsed"}
              </button>
            ))}
          </div>

          <button
            type="button"
            className="flex h-8 shrink-0 items-center justify-center gap-2 rounded-md border border-[#DDE2EE] bg-white px-3 font-manrope text-sm font-semibold text-[#2F68E5] transition-colors hover:bg-[#F7F9FC]"
          >
            <FlaskConical className="size-4" strokeWidth={2} />
            Test
          </button>
        </div>
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)_348px] items-start gap-6">
      {/* Configuration fills the space beside the compact preview. */}
      <div className="min-w-0 flex-1 space-y-8">

        <div className="space-y-5">
          <CopyField
            label="Title"
            value={title}
            onChange={setTitle}
            placeholder="Enter a title for your notification"
            suggestions={TITLE_SUGGESTIONS}
            suggestionLabel="Suggest notification title with AI"
          />
          <CopyField
            label="Description"
            value={description}
            onChange={setDescription}
            placeholder="Enter description here"
            suggestions={DESCRIPTION_SUGGESTIONS}
            suggestionLabel="Suggest notification description with AI"
          />
          <Field label="Landing page">
            <SelectDropdown value={landingPage} options={LANDING_PAGES} onChange={setLandingPage} />
          </Field>
        </div>

        <div className="border-t border-[#EEF1F7] pt-6">
          <h3 className="font-manrope text-base font-bold text-[#17173A]">Enable APN interactions</h3>
          <p className="mt-1 font-manrope text-sm text-[#6F6F8D]">
            Include rich media, action buttons, sound, deep links, and much more
          </p>

          <div className="mt-4 flex items-center justify-between border-b border-[#EEF1F7]">
            <div className="flex items-center gap-6">
              {(["android", "ios"] as const).map((o) => (
                <button
                  key={o}
                  type="button"
                  onClick={() => setOs(o)}
                  className={cn(
                    "flex items-center gap-1.5 border-b-2 pb-2.5 font-manrope text-sm transition-colors",
                    os === o
                      ? "border-[#2F68E5] font-bold text-[#2F68E5]"
                      : "border-transparent font-medium text-[#6F6F8D] hover:text-[#17173A]"
                  )}
                >
                  {o === "android" ? (
                    <AndroidIcon className="size-3.5" />
                  ) : (
                    <AppleIcon className="size-3.5" />
                  )}
                  {o === "android" ? "Android" : "iOS"}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={copyFromOther}
              className="mb-2.5 flex items-center gap-1.5 font-manrope text-sm font-semibold text-[#2F68E5] hover:text-[#2455C0]"
            >
              <Copy className="size-3.5" strokeWidth={2} />
              Copy from {os === "android" ? "iOS" : "Android"}
            </button>
          </div>

          <div className="border-b border-[#EEF1F7]">
            <ToggleRow
              label="Subtitle"
              hint="(For SDK 3.4.0 and above)"
              checked={cfg.subtitleEnabled}
              onChange={(v) => patchCfg({ subtitleEnabled: v })}
            />
          </div>

          <div className="mt-6">
            <h4 className="font-manrope text-sm font-bold text-[#17173A]">Rich media</h4>
            <div className="mt-3 flex items-center gap-3">
              <span className="font-manrope text-sm font-semibold text-[#17173A]">Add Carousel</span>
              <span className="h-px flex-1 border-t border-dashed border-[#DDE2EE]" />
            </div>
          </div>

          <div className="mt-5">
            <Field label="Carousel type">
              <RadioRow
                options={[
                  { value: "manual", label: "Manual" },
                  { value: "automatic", label: "Automatic" },
                ]}
                value={cfg.carouselType}
                onChange={(v) => patchCfg({ carouselType: v })}
              />
            </Field>
            <p className="mt-2 font-manrope text-xs text-[#8A8AA3]">
              Note: Transition effect only applies to the collapsed state if a customized collapsed
              state is enabled.
            </p>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-4">
            <Field label="Transition effect">
              <SelectDropdown
                value={cfg.transitionEffect}
                options={TRANSITION_EFFECTS}
                onChange={(v) => patchCfg({ transitionEffect: v })}
              />
            </Field>
            <Field label="Transition rate">
              <SelectDropdown
                value={cfg.transitionRate}
                placeholder="Select count"
                options={TRANSITION_RATES}
                onChange={(v) => patchCfg({ transitionRate: v })}
              />
            </Field>
          </div>

          <div className="mt-6 flex items-center gap-1 border-b border-[#EEF1F7]">
            {cfg.images.map((img, i) => (
              <button
                key={img.id}
                type="button"
                onClick={() => patchCfg({ activeImageId: img.id })}
                className={cn(
                  "-mb-px rounded-t-md border border-b-0 px-4 py-2 font-manrope text-sm font-bold uppercase tracking-[0.4px] transition-colors",
                  img.id === activeImage.id
                    ? "border-[#DDE2EE] bg-white text-[#2F68E5]"
                    : "border-transparent text-[#8A8AA3] hover:text-[#17173A]"
                )}
              >
                Image {i + 1}
              </button>
            ))}
            <button
              type="button"
              onClick={addImage}
              className="mb-2 ml-2 flex items-center gap-1 font-manrope text-sm font-bold text-[#2F68E5] hover:text-[#2455C0]"
            >
              <Plus className="size-3.5" strokeWidth={2.4} />
              ADD
            </button>
          </div>

          <div className="mt-5 space-y-5">
            <RadioRow
              options={[
                { value: "url", label: "URL" },
                { value: "upload", label: "Upload file" },
              ]}
              value={activeImage.uploadMode}
              onChange={(v) => patchActiveImage({ uploadMode: v })}
            />

            {activeImage.uploadMode === "url" && (
              <Field label="Media URL" required>
                <input
                  value={activeImage.mediaUrl}
                  onChange={(e) => patchActiveImage({ mediaUrl: e.target.value })}
                  placeholder="Media URL"
                  className={fieldClass}
                />
              </Field>
            )}

            <CopyField
              label="Enter a title for the card"
              value={activeImage.cardTitle}
              onChange={(cardTitle) => patchActiveImage({ cardTitle })}
              placeholder="Enter a title for the card"
              suggestions={TITLE_SUGGESTIONS}
              suggestionLabel="Suggest carousel card title with AI"
            />

            <CopyField
              label="Description"
              value={activeImage.cardDescription}
              onChange={(cardDescription) => patchActiveImage({ cardDescription })}
              placeholder="Enter description here"
              suggestions={DESCRIPTION_SUGGESTIONS}
              suggestionLabel="Suggest carousel card description with AI"
            />

            <div>
              <label className="mb-1.5 block font-manrope text-sm font-semibold text-[#17173A]">
                Call to action
              </label>
              <div className="grid grid-cols-2 gap-3">
                <SelectDropdown
                  value={activeImage.ctaType}
                  options={CTA_TYPES}
                  onChange={(v) => patchActiveImage({ ctaType: v as CTAType })}
                />
                <div>
                  <Field label="Enter deeplink URL" required>
                    <input
                      value={activeImage.deeplinkUrl}
                      onChange={(e) => patchActiveImage({ deeplinkUrl: e.target.value })}
                      placeholder="Enter deeplink URL"
                      className={fieldClass}
                    />
                  </Field>
                  {!activeImage.deeplinkUrl && (
                    <p className="mt-1 font-manrope text-xs font-medium text-[#E5484D]">
                      Deep link URL required
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block font-manrope text-sm font-semibold text-[#17173A]">
                Overlay color
              </label>
              <RadioRow
                options={[
                  { value: "solid", label: "Solid" },
                  { value: "gradient", label: "Gradient" },
                ]}
                value={activeImage.overlayType}
                onChange={(v) => patchActiveImage({ overlayType: v })}
              />
              <div className="mt-3">
                <label className="mb-1.5 block font-manrope text-xs font-semibold text-[#6F6F8D]">
                  Color
                </label>
                {activeImage.overlayType === "solid" ? (
                  <div className="flex h-10 w-fit items-center gap-2 rounded-md border border-[#DDE2EE] bg-white pl-1.5 pr-3">
                    <span
                      className="size-7 shrink-0 rounded border border-[#DDE2EE]"
                      style={{ background: activeImage.solidColor }}
                    />
                    <input
                      value={activeImage.solidColor}
                      onChange={(e) => patchActiveImage({ solidColor: e.target.value })}
                      className="w-28 bg-transparent font-manrope text-sm text-[#17173A] outline-none"
                    />
                  </div>
                ) : (
                  <div className="flex h-10 w-fit items-center gap-2 rounded-md border border-[#DDE2EE] bg-white pl-1.5 pr-3">
                    <span
                      className="size-7 shrink-0 rounded border border-[#DDE2EE]"
                      style={{
                        background: `linear-gradient(90deg, ${activeImage.gradientFrom}, ${activeImage.gradientTo})`,
                      }}
                    />
                    <input
                      value={activeImage.gradientFrom}
                      onChange={(e) => patchActiveImage({ gradientFrom: e.target.value })}
                      className="w-24 bg-transparent font-manrope text-sm text-[#17173A] outline-none"
                    />
                    <span className="text-[#8A8AA3]">–</span>
                    <input
                      value={activeImage.gradientTo}
                      onChange={(e) => patchActiveImage({ gradientTo: e.target.value })}
                      className="w-24 bg-transparent font-manrope text-sm text-[#17173A] outline-none"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mt-4 divide-y divide-[#EEF1F7] border-t border-[#EEF1F7]">
            <ToggleRow
              label="Background color"
              checked={cfg.backgroundColorEnabled}
              onChange={(v) => patchCfg({ backgroundColorEnabled: v })}
            />
            <ToggleRow
              label="Action button"
              checked={cfg.actionButtonEnabled}
              onChange={(v) => patchCfg({ actionButtonEnabled: v })}
            />
            {os === "android" && (
              <ToggleRow
                label="Enable sticky notification"
                checked={cfg.stickyNotificationEnabled}
                onChange={(v) => patchCfg({ stickyNotificationEnabled: v })}
              />
            )}
            <ToggleRow
              label="Customize collapsed state"
              checked={cfg.customizeCollapsedEnabled}
              onChange={(v) => patchCfg({ customizeCollapsedEnabled: v })}
            />
            <ToggleRow
              label="Sound"
              checked={cfg.soundEnabled}
              onChange={(v) => patchCfg({ soundEnabled: v })}
            />
          </div>

          <div className="mt-6 rounded-lg border border-[#DDE2EE] p-4">
            <ToggleRow
              label="Add-on options"
              hint="Enable custom key value or overwrite the comment of the notification"
              checked={cfg.addOnOptionsEnabled}
              onChange={(v) => patchCfg({ addOnOptionsEnabled: v })}
            />
          </div>
        </div>
      </div>

      {/* Compact live preview, stays in view while the form scrolls. */}
      <div className="sticky top-6 min-w-0">
        <div>
          <Field label="Preview for a specific user" required>
            <div className="flex items-center gap-2">
              <input
                value={primaryKey}
                onChange={(e) => setPrimaryKey(e.target.value)}
                placeholder="Enter primary key"
                className={cn(fieldClass, "min-w-0 flex-1")}
              />
              <button
                type="button"
                aria-label="Preview"
                className="grid size-10 shrink-0 place-items-center rounded-full bg-[#2F68E5] text-white transition-colors hover:bg-[#2455C0]"
              >
                <ArrowRight className="size-4" strokeWidth={2.4} />
              </button>
            </div>
          </Field>
        </div>

        <div className="mt-6 flex justify-center">
          <CarouselPhoneMock os={os} expanded={expanded} title={title} image={activeImage} />
        </div>

        <div className="mt-5 font-manrope text-xs leading-[18px] text-[#8A8AA3]">
          <p className="font-semibold text-[#6F6F8D]">Note:</p>
          <ul className="mt-1 list-disc space-y-1 pl-4">
            <li>
              This preview is for reference purposes only. The actual display may vary across
              devices with different resolutions
            </li>
            <li>
              In dynamic previews, blank values may indicate that the underlying data does not
              exist.{" "}
              <a href="#" className="font-semibold text-[#2F68E5]">
                Learn more
              </a>
            </li>
          </ul>
        </div>
      </div>
      </div>
    </div>
  );
}
