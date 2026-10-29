import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { ArrowLeft, ChevronDown, ChevronLeft, Info, LayoutTemplate, Plus, Settings, TriangleAlert, X } from "lucide-react";
import { AndroidIcon, AppleIcon } from "@/components/campaigns/campaign-creation/PlatformIcons";
import SmsPreviewSource, { SmsPreviewEstimate } from "./SmsPreviewSource";
import SmsVariableField from "./SmsVariableField";
import SmsIcon from "@/components/SmsIcon";
import { DsButton } from "@/components/ui/ds-button";
import CampaignCreationStepper, { type Step } from "@/components/campaigns/campaign-creation/CampaignCreationStepper";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { previewContext, renderBody } from "./smsPreview.data";
import { MAX_SMS_VARIABLES } from "./smsVariables.data";
import {
  DLT_TEMPLATE_TYPES,
  DLT_VAR_LENGTH,
  smsLength,
  smsParts,
  dltTagTip,
  variableSlots,
  variableTokens,
  type DltTemplateType,
  type SmsTemplate,
} from "./smsTemplates.data";

export interface NewSmsTemplate {
  name: string;
  dltId: string;
  category: string;
  dltType: DltTemplateType;
  body: string;
  /** Liquid expression each {{n}} in the body is filled from. */
  variables: Record<string, string>;
}

const NAME_ALLOWED = /^[A-Za-z0-9\-_&@:]*$/;
const NAME_ERROR = "Only a-z A-Z 0-9 - _ & @ : characters are allowed.";
const DEFAULT_CATEGORY = "uncategorized";

/** Parked for now: the ADD VARIABLE button (numbered {{n}} variables). */
const SHOW_ADD_VARIABLE = false;

const VARIABLE_RE = /\{\{(\d+)\}\}/g;
/** Liquid typed straight into the message: any {{ … }} that isn't a plain {{n}} variable, or a {% … %} tag. */
const STRAY_LIQUID_RE = /\{\{(?!\d+\}\})[^}]*\}\}|\{%[\s\S]*?%\}/g;
/** Distinct variable numbers used in the message, ascending. */
function variablesIn(body: string): number[] {
  return [...new Set([...body.matchAll(VARIABLE_RE)].map((m) => Number(m[1])))].sort((a, b) => a - b);
}

const labelClass = "mb-2 block font-manrope text-[14px] font-semibold text-[#17173A]";
const fieldClass =
  "h-[46px] w-full rounded-[4px] border bg-[#F7F7F9] px-4 font-manrope text-[14px] text-[#17173A] outline-none transition-colors placeholder:text-[#A0A0B0] focus:bg-white";

function Required() {
  return <span className="text-[#E5484D]"> *</span>;
}

/** Outline "i" beside a field label; hover (or focus) explains the field. */
function LabelInfo({ label, children }: { label: string; children: string }) {
  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button type="button" aria-label={label} className="text-[#6F6F8D] transition-colors hover:text-[#17173A]">
            <Info className="size-4" strokeWidth={1.8} />
          </button>
        </TooltipTrigger>
        <TooltipContent side="right" className="max-w-[260px] rounded-lg border-0 bg-black px-3 py-2 text-white">
          <p className="font-manrope text-xs leading-[18px]">{children}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function FieldError({ children }: { children: string }) {
  return <p className="mt-1.5 font-manrope text-[12px] text-[#E5484D]">{children}</p>;
}

/** Chip input — Enter or comma commits what's typed as a category. */
function CategoryInput({ value, onChange }: { value: string[]; onChange: (next: string[]) => void }) {
  const [text, setText] = useState("");

  const commit = () => {
    const next = text.trim();
    setText("");
    if (next && !value.some((c) => c.toLowerCase() === next.toLowerCase())) onChange([...value, next]);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      commit();
    } else if (e.key === "Backspace" && !text && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  };

  return (
    <div className="flex min-h-[46px] w-full flex-wrap items-center gap-2 rounded-[4px] border border-transparent bg-[#F7F7F9] px-2.5 py-1.5 focus-within:border-[#2F68E5] focus-within:bg-white">
      {value.map((c) => (
        <span
          key={c}
          className="flex items-center gap-1.5 rounded-full bg-[#6F6F8D] py-1 pl-3 pr-2 font-manrope text-[13px] font-semibold text-white"
        >
          {c}
          <button
            type="button"
            aria-label={`Remove ${c}`}
            onClick={() => onChange(value.filter((x) => x !== c))}
            className="grid size-4 place-items-center rounded-full bg-white/25 transition-colors hover:bg-white/40"
          >
            <X className="size-3" strokeWidth={3} />
          </button>
        </span>
      ))}
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={onKeyDown}
        onBlur={commit}
        placeholder="Category"
        className="min-w-[80px] flex-1 bg-transparent px-1.5 font-manrope text-[14px] text-[#17173A] outline-none placeholder:text-[#A0A0B0]"
      />
    </div>
  );
}

function DltTypeSelect({
  value,
  onChange,
  invalid,
}: {
  value: DltTemplateType | "";
  onChange: (v: DltTemplateType) => void;
  invalid: boolean;
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex h-[46px] w-full items-center justify-between rounded-[4px] border bg-white px-4 text-left font-manrope text-[14px] outline-none transition-colors",
          open ? "border-[#2F68E5]" : invalid ? "border-[#E5484D]" : "border-[#DDE2EE]"
        )}
      >
        <span className={value ? "text-[#17173A]" : "text-[#A0A0B0]"}>{value || "Select DLT Template Type"}</span>
        <ChevronDown className={cn("size-4 text-[#2F68E5] transition-transform", open && "rotate-180")} strokeWidth={2.4} />
      </button>
      {open && (
        <div
          role="listbox"
          className="absolute left-0 top-full z-20 mt-1 w-full overflow-hidden rounded-[4px] border border-[#DDE2EE] bg-white shadow-[0_8px_24px_rgba(23,23,58,0.12)]"
        >
          {DLT_TEMPLATE_TYPES.map((t) => (
            <button
              key={t}
              type="button"
              role="option"
              aria-selected={t === value}
              onClick={() => {
                onChange(t);
                setOpen(false);
              }}
              className={cn(
                "block w-full border-l-[3px] px-6 py-4 text-left font-manrope text-[14px] font-semibold transition-colors",
                t === value
                  ? "border-[#2F68E5] bg-[#F4F8FF] text-[#17173A]"
                  : "border-transparent text-[#6F6F8D] hover:border-[#2F68E5] hover:bg-[#F4F8FF] hover:text-[#17173A]"
              )}
            >
              {t}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const STEPS: Step[] = [
  { id: "setup", label: "Setup", icon: Settings },
  { id: "content", label: "Content", icon: LayoutTemplate },
];

function PhonePreview({ platform, body }: { platform: "android" | "ios"; body: string }) {
  const bubble = body.trim();
  return (
    <div className="mx-auto mt-8 h-[520px] w-[290px] overflow-hidden rounded-t-[36px] border-[7px] border-b-0 border-[#3B3B3F] bg-black">
      {platform === "android" ? (
        <>
          <div className="flex h-8 items-center justify-center gap-2.5">
            <span className="size-[7px] rounded-full bg-[#4A4A52]" />
            <span className="size-[7px] rounded-full bg-[#4A4A52]" />
            <span className="h-[7px] w-20 rounded-full bg-[#5C5C66]" />
            <span className="size-[11px] rounded-full bg-[#4A4A52]" />
          </div>
          <div className="flex h-full flex-col rounded-t-[10px] bg-white">
            <div className="flex h-12 shrink-0 items-center bg-[#009688] px-3 text-white">
              <ArrowLeft className="size-5" strokeWidth={2.4} />
            </div>
            <div className="flex-1 bg-white p-3">
              {bubble && (
                <p className="max-w-[85%] whitespace-pre-wrap break-words rounded-[10px] bg-[#EEF0F4] px-3 py-2 font-manrope text-[13px] leading-[19px] text-[#17173A]">
                  {bubble}
                </p>
              )}
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="flex h-8 items-center justify-center">
            <span className="h-[18px] w-24 rounded-full bg-[#1B1B1F]" />
          </div>
          <div className="flex h-full flex-col rounded-t-[10px] bg-white">
            <div className="flex h-12 shrink-0 items-center justify-between border-b border-[#E4E4E8] bg-[#F7F7F9] px-3 text-[#2F68E5]">
              <ChevronLeft className="size-5" strokeWidth={2.4} />
              <span className="font-manrope text-[12px] font-semibold text-[#17173A]">Bloomwood</span>
              <span className="w-5" />
            </div>
            <div className="flex-1 bg-white p-3">
              {bubble && (
                <p className="max-w-[85%] whitespace-pre-wrap break-words rounded-[16px] bg-[#E9E9EB] px-3.5 py-2 font-manrope text-[13px] leading-[19px] text-[#17173A]">
                  {bubble}
                </p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/**
 * Full-screen "Create SMS template" flow behind the SMS page's CREATE NEW (and, prefilled,
 * its card's Edit action) — a
 * Setup step for the DLT details, then a Content step for the message, with a
 * live phone preview beside it. Mounted per open, so every draft starts from `initial` or blank.
 */
export default function CreateSmsTemplateOverlay({
  onClose,
  onSave,
  initial,
}: {
  onClose: () => void;
  onSave: (template: NewSmsTemplate) => void;
  /** An existing template to edit; omitted when creating a new one. */
  initial?: SmsTemplate;
}) {
  const editing = Boolean(initial);
  // Editing opens on the Content step (the message is what's usually being changed); Setup is one click back.
  const [step, setStep] = useState<"setup" | "content">(editing ? "content" : "setup");
  const [name, setName] = useState(initial?.name ?? "");
  const [dltId, setDltId] = useState(initial?.dltId ?? "");
  const [categories, setCategories] = useState<string[]>([initial?.category ?? DEFAULT_CATEGORY]);
  const [dltType, setDltType] = useState<DltTemplateType | "">(initial?.dltType ?? "");
  const [body, setBody] = useState(initial?.body ?? "");
  const [mappings, setMappings] = useState<Record<string, string>>(initial?.variables ?? {});
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const caretRef = useRef<number | null>(null);
  // Who the phone is rendered for. Nothing loads until the arrow button is clicked (until then the
  // phone shows the raw {{n}} tags); after that, edits to the message, the mappings or the
  // "Preview using" activity all re-render it live. Only switching user needs the arrow again.
  const [previewActivity, setPreviewActivity] = useState("");
  const [loadedPreview, setLoadedPreview] = useState<{ user: string } | null>(null);
  const [platform, setPlatform] = useState<"android" | "ios">("android");
  // Errors only surface once the user has tried to move on.
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  // A template's existing name is left alone when editing (older ones predate the character rule);
  // the rule applies as soon as the name is changed.
  const nameInvalidChars = name !== initial?.name && !NAME_ALLOWED.test(name);
  const nameError = nameInvalidChars ? NAME_ERROR : submitted && !name.trim() ? "Template name is required." : "";
  const dltIdError = submitted && !dltId ? "DLT Template ID is required." : "";
  const dltTypeError = submitted && !dltType ? "Select a DLT Template Type." : "";
  const strayLiquid = body.match(STRAY_LIQUID_RE) ?? [];
  const bodyError = submitted && !body.trim() ? "Message is required." : "";

  const setupValid = Boolean(name.trim()) && !nameInvalidChars && Boolean(dltId) && Boolean(dltType);

  const next = () => {
    setSubmitted(true);
    if (setupValid) {
      setSubmitted(false);
      setStep("content");
    }
  };

  const save = () => {
    setSubmitted(true);
    if (!body.trim() || strayLiquid.length > 0 || unmapped.length > 0 || !setupValid || !dltType) return;
    onSave({
      name: name.trim(),
      dltId,
      category: categories[0] ?? DEFAULT_CATEGORY,
      dltType,
      body: body.trim(),
      variables: Object.fromEntries(slots.map((v) => [v.key, mappings[v.key].trim()])),
    });
  };

  const characters = smsLength(body);
  const slots = variableSlots(body);
  const previewBody = loadedPreview ? renderBody(body, mappings, previewContext(loadedPreview.user, previewActivity)) : body;
  // Variables still showing as {{n}} after rendering had no value for the loaded user.
  const unfilled = loadedPreview ? [...new Set(variableTokens(previewBody))] : [];
  const unmapped = slots.filter((v) => !mappings[v.key]?.trim());
  const remaining = MAX_SMS_VARIABLES - slots.length;

  // Drops the next unused {{n}} at the cursor (or over the selection).
  const addVariable = () => {
    const el = bodyRef.current;
    if (remaining <= 0) return;
    const token = `{{${Math.max(0, ...variablesIn(body)) + 1}}}`;
    const start = el?.selectionStart ?? body.length;
    const end = el?.selectionEnd ?? body.length;
    setBody(body.slice(0, start) + token + body.slice(end));
    caretRef.current = start + token.length;
  };

  // Put the caret back after the inserted tag once the new text has rendered.
  useEffect(() => {
    const caret = caretRef.current;
    if (caret === null) return;
    caretRef.current = null;
    bodyRef.current?.focus();
    bodyRef.current?.setSelectionRange(caret, caret);
  }, [body]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={editing ? "Edit SMS template" : "Create SMS template"}
      className="fixed inset-0 z-[60] flex flex-col bg-[#F4F8FF] animate-in fade-in slide-in-from-bottom-4 duration-300"
    >
      {/* Top bar and step strip match the campaign-creation flow's. */}
      <header className="flex h-14 shrink-0 items-center border-b border-[#DDE2EE] bg-white px-14">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded bg-[#E7EDFF]">
            <SmsIcon className="h-4 w-4 text-[#2F68E5]" />
          </span>
          <h1 className="font-manrope text-[20px] font-bold leading-tight text-[#17173A]">
            {editing ? "Edit SMS template" : "Create SMS template"}
          </h1>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <DsButton onClick={step === "setup" ? next : save}>{step === "setup" ? "Next" : "Save"}</DsButton>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-lg border border-[#DDE2EE] text-[#6F6F8D] transition-colors hover:bg-[#F7F9FC] hover:text-[#17173A]"
          >
            <X className="h-4 w-4" strokeWidth={2} />
          </button>
        </div>
      </header>
      <CampaignCreationStepper
        steps={STEPS}
        activeIndex={step === "setup" ? 0 : 1}
        onStepSelect={(i) => i === 0 && setStep("setup")}
      />

      <div className="scroll-slim min-h-0 flex-1 overflow-y-auto px-14 py-6">
        {step === "setup" ? (
          <section className="rounded-[4px] border border-[#DDE2EE] bg-white p-6">
            <h2 className="font-manrope text-[22px] font-bold text-[#17173A]">Template details</h2>
            <div className="mt-6 max-w-[880px]">
              <label className={labelClass}>
                Template name
                <Required />
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: MyTemplate"
                aria-invalid={Boolean(nameError)}
                className={cn(fieldClass, nameError ? "border-[#E5484D]" : "border-transparent focus:border-[#2F68E5]")}
              />
              {nameError && <FieldError>{nameError}</FieldError>}

              <div className="mt-8 grid grid-cols-2 gap-8">
                <div>
                  <label className={cn(labelClass, "flex items-center gap-1.5")}>
                    <span>
                      DLT Template ID
                      <Required />
                    </span>
                    <LabelInfo label="About DLT Template ID">
                      Enter the DLT-approved template ID provided by your telecom operator.
                    </LabelInfo>
                  </label>
                  <input
                    value={dltId}
                    // Digits only — anything else typed or pasted is dropped.
                    onChange={(e) => setDltId(e.target.value.replace(/\D/g, ""))}
                    inputMode="numeric"
                    placeholder="DLT Template ID"
                    aria-invalid={Boolean(dltIdError)}
                    className={cn(fieldClass, dltIdError ? "border-[#E5484D]" : "border-transparent focus:border-[#2F68E5]")}
                  />
                  {dltIdError && <FieldError>{dltIdError}</FieldError>}
                </div>
                <div>
                  <label className={labelClass}>Category</label>
                  <CategoryInput value={categories} onChange={setCategories} />
                </div>
              </div>

              <div className="mt-10 grid grid-cols-2 gap-8">
                <div>
                  <label className={cn(labelClass, "flex items-center gap-1.5")}>
                    <span>
                      DLT Template Type
                      <Required />
                    </span>
                    <LabelInfo label="About DLT Template Type">
                      The type this template is registered under with your telecom operator — it decides when the
                      message can be sent.
                    </LabelInfo>
                  </label>
                  <DltTypeSelect value={dltType} onChange={setDltType} invalid={Boolean(dltTypeError)} />
                  {dltTypeError && <FieldError>{dltTypeError}</FieldError>}
                </div>
              </div>
            </div>
          </section>
        ) : (
          <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,0.48fr)] items-start gap-10">
            <section className="rounded-[4px] border border-[#DDE2EE] bg-white p-6">
              <h2 className="font-manrope text-[22px] font-bold text-[#17173A]">Create template</h2>

              <div className="mt-6 rounded-[4px] bg-[#E8EDFF] px-4 py-3 font-manrope text-[14px] leading-[22px] text-[#17173A]">
                Please verify <strong>DLT template ID and SMS template</strong> before saving. Please note that your
                message must match with the SMS approved by the DLT, else it will be{" "}
                <strong>blocked by the telecom operator.</strong>
                <p className="text-[#6F6F8D]">
                  As per the DLT guidelines, the length of a variable {"{#var#}"} is {DLT_VAR_LENGTH} characters.
                </p>
              </div>

              <label className="mb-2 mt-6 block font-manrope text-[15px] text-[#17173A]">
                Message<span className="text-[#E5484D]">*</span>
              </label>
              <div
                className={cn(
                  "overflow-hidden rounded-[4px] border bg-white",
                  bodyError || strayLiquid.length > 0
                    ? "border-[#E5484D]"
                    : "border-[#DDE2EE] focus-within:border-[#2F68E5]"
                )}
              >
                <textarea
                  ref={bodyRef}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  className="block h-[180px] w-full resize-none bg-transparent p-4 font-manrope text-[15px] leading-[23px] text-[#17173A] outline-none"
                />
                <div className="flex items-center justify-between gap-6 border-t border-[#DDE2EE] px-5 py-4">
                  <p className="flex max-w-[360px] items-start gap-2.5 font-manrope text-[13px] leading-[18px] text-[#6F6F8D]">
                    <Info className="mt-px size-4 shrink-0 fill-[#6F6F8D] text-white" strokeWidth={2} />
                    URLs are converted into 20-25 character long short-URLs. Please manage your SMS length accordingly.
                  </p>
                  <div className="flex shrink-0 items-stretch gap-4 font-manrope">
                    <div className="text-right">
                      <p className="text-[15px] text-[#6F6F8D]">Characters</p>
                      <p className="text-[16px] font-bold text-[#17173A]">{characters}</p>
                    </div>
                    <span className="w-px bg-[#DDE2EE]" />
                    <div className="text-right">
                      <p className="text-[15px] text-[#6F6F8D]">SMS Parts</p>
                      <p className="text-[16px] font-bold text-[#17173A]">{smsParts(characters)}</p>
                    </div>
                  </div>
                </div>
              </div>
              {strayLiquid.length > 0 ? (
                <p role="alert" className="mt-2 flex items-start gap-2 font-manrope text-[13px] leading-[19px] text-[#E5484D]">
                  <TriangleAlert className="mt-px size-4 shrink-0" strokeWidth={2.2} />
                  <span>
                    <code className="rounded bg-[#FDECEC] px-1 font-mono text-[12px]">{strayLiquid[0]}</code>
                    {strayLiquid.length > 1 && ` and ${strayLiquid.length - 1} more`} can&apos;t sit directly in the message —
                    liquid only works inside a variable. Click ADD VARIABLE, then paste{" "}
                    {strayLiquid.length > 1 ? "each one into its own variable's value" : "it into that variable's value"}, and remove{" "}
                    {strayLiquid.length > 1 ? "them" : "it"} from the text.
                  </span>
                </p>
              ) : (
                bodyError && <FieldError>{bodyError}</FieldError>
              )}

              {/* Parked for now: variables come from DLT tags typed in the message. */}
              {SHOW_ADD_VARIABLE && (
                <DsButton variant="tertiary" onClick={addVariable} disabled={remaining <= 0} className="mt-4 uppercase">
                  <Plus />
                  Add variable ({remaining})
                </DsButton>
              )}

              {slots.length > 0 && (
                <div className="mt-6 rounded-[4px] border border-[#DDE2EE] p-6">
                  <h3 className="font-manrope text-[14px] font-bold text-[#17173A]">Map body variable</h3>
                  <div className="mt-4 space-y-4">
                    {slots.map((v, i) => (
                      <div key={v.key}>
                        <p className="font-manrope text-[14px] font-semibold text-[#17173A]">
                          <span className="mr-2 text-[#6F6F8D]">{i + 1}.</span>
                          {v.label}
                          <Required />
                        </p>
                        {dltTagTip(v.tag) && (
                          <p className="mt-1 font-manrope text-[12px] leading-[18px] text-[#6F6F8D]">{dltTagTip(v.tag)}</p>
                        )}
                        <div className="mt-2">
                          <SmsVariableField
                            value={mappings[v.key] ?? ""}
                            onChange={(val) => setMappings({ ...mappings, [v.key]: val })}
                            invalid={submitted && !mappings[v.key]?.trim()}
                            ariaLabel={`Value for variable ${i + 1} ${v.token}`}
                          />
                        </div>
                        {submitted && !mappings[v.key]?.trim() && (
                          <FieldError>Map this variable to an attribute or liquid code.</FieldError>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>

            <section className="self-stretch rounded-[4px] border border-[#DDE2EE] bg-white px-8 pb-0 pt-6">
              <SmsPreviewSource
                activity={previewActivity}
                onActivityChange={setPreviewActivity}
                userKey={loadedPreview?.user ?? ""}
                onUserLoad={(user) => setLoadedPreview({ user })}
              />
              {/* The strip lives in the gap above the toggle, so loading a user never moves the phone. */}
              <div className="relative mt-12">
                {loadedPreview && (
                  <SmsPreviewEstimate text={previewBody} unfilled={unfilled} className="absolute inset-x-0 -top-10" />
                )}
              <div className="mx-auto flex w-fit overflow-hidden rounded-[4px] border border-[#DDE2EE]">
                {(
                  [
                    { id: "android", label: "Android preview", icon: AndroidIcon },
                    { id: "ios", label: "iOS preview", icon: AppleIcon },
                  ] as const
                ).map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    aria-label={p.label}
                    aria-pressed={platform === p.id}
                    onClick={() => setPlatform(p.id)}
                    className={cn(
                      "grid h-10 w-[60px] place-items-center transition-colors",
                      platform === p.id ? "bg-[#2F68E5] text-white" : "bg-white text-[#6F6F8D] hover:bg-[#F7F9FC]"
                    )}
                  >
                    <p.icon className="size-4" />
                  </button>
                ))}
              </div>
              </div>
<PhonePreview platform={platform} body={previewBody} />
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
