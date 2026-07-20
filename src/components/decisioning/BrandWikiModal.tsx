import { useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronDown,
  Download,
  ExternalLink,
  FileText,
  Upload,
  X,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import type { BrandWikiData } from "@/contexts/DecisioningSetupContext";
import {
  BRAND_WIKI_GROUPS,
  BRAND_WIKI_TOTAL_QUESTIONS,
  type BrandWikiQuestionGroup,
} from "./brand-wiki-questions";

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function BrandWikiModal({
  open,
  onOpenChange,
  initialData,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData: BrandWikiData | null;
  onSave: (data: BrandWikiData) => void;
}) {
  const [files, setFiles] = useState<{ name: string; size: number }[]>([]);
  const [brandName, setBrandName] = useState("");
  const [brandVoice, setBrandVoice] = useState("");
  const [audience, setAudience] = useState("");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set());
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Re-seed the form from saved data every time the modal opens.
  useEffect(() => {
    if (!open) return;
    setFiles(initialData?.files ?? []);
    setBrandName(initialData?.brandName ?? "");
    setBrandVoice(initialData?.brandVoice ?? "");
    setAudience(initialData?.audience ?? "");
    setAnswers(initialData?.answers ?? {});
    setOpenGroups(new Set());
    setDragOver(false);
  }, [open, initialData]);

  const addFiles = (list: FileList | null) => {
    if (!list) return;
    const next = Array.from(list).map((f) => ({ name: f.name, size: f.size }));
    setFiles((prev) => [
      ...prev,
      ...next.filter((n) => !prev.some((p) => p.name === n.name)),
    ]);
  };

  const answeredCount = useMemo(
    () => Object.values(answers).filter((v) => v.trim() !== "").length,
    [answers]
  );

  const allExpanded = openGroups.size === BRAND_WIKI_GROUPS.length;
  const toggleAll = () =>
    setOpenGroups(allExpanded ? new Set() : new Set(BRAND_WIKI_GROUPS.map((g) => g.id)));
  const toggleGroup = (id: string) =>
    setOpenGroups((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const answeredInGroup = (g: BrandWikiQuestionGroup) =>
    g.questions.filter((q) => (answers[q.id] ?? "").trim() !== "").length;

  const hasQuickDetails =
    brandName.trim() !== "" || brandVoice.trim() !== "" || audience.trim() !== "";
  const isValid = files.length > 0 || hasQuickDetails || answeredCount > 0;

  const handleSave = () => {
    onSave({ files, brandName, brandVoice, audience, answers });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] gap-0 overflow-hidden rounded-[16px] p-0 font-manrope sm:max-w-[640px]">
        <DialogHeader className="space-y-1 border-b border-[#EDEFF5] px-6 py-5">
          <DialogTitle className="text-[20px] font-bold text-[#17173A]">
            Brand wiki
          </DialogTitle>
          <DialogDescription className="text-[13px] text-[#6F6F8D]">
            Give the engine your brand's story — docs, voice, and who you sell to.
          </DialogDescription>
        </DialogHeader>

        <div className="flex max-h-[calc(90vh-176px)] flex-col gap-5 overflow-y-auto px-6 py-5">
          {/* Upload zone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              addFiles(e.dataTransfer.files);
            }}
            className={`flex flex-col items-center gap-2 rounded-xl border-2 border-dashed px-6 py-7 text-center transition-colors ${
              dragOver ? "border-[#2F68E5] bg-[#EEF3FF]" : "border-[#C9D5F5] bg-[#F6F9FF]"
            }`}
          >
            <FileText className="h-6 w-6 text-[#2F68E5]" strokeWidth={1.8} />
            <p className="text-[15px] font-semibold text-[#17173A]">Upload brand document</p>
            <p className="text-[13px] text-[#6F6F8D]">
              Brand guidelines, tone of voice, product catalogue…
            </p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="mt-2 inline-flex items-center gap-2 rounded bg-[#2F68E5] px-5 py-2.5 text-[13px] font-semibold uppercase tracking-[0.42px] text-white transition-colors hover:bg-[#255ad2]"
            >
              <Upload className="h-4 w-4" strokeWidth={2} />
              Upload document
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.csv,.txt,.md,.xlsx"
              className="hidden"
              onChange={(e) => {
                addFiles(e.target.files);
                e.target.value = "";
              }}
            />
          </div>

          {files.length > 0 && (
            <ul className="flex flex-col gap-1.5">
              {files.map((f) => (
                <li
                  key={f.name}
                  className="flex items-center gap-2.5 rounded-lg border border-[#DDE2EE] px-3 py-2 animate-in fade-in slide-in-from-top-1 duration-200"
                >
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded bg-[#E7EDFF]">
                    <FileText className="h-3.5 w-3.5 text-[#2F68E5]" strokeWidth={1.8} />
                  </span>
                  <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-[#17173A]">
                    {f.name}
                  </span>
                  <span className="shrink-0 text-[12px] text-[#6F6F8D]">
                    {formatSize(f.size)}
                  </span>
                  <button
                    aria-label={`Remove ${f.name}`}
                    onClick={() =>
                      setFiles((prev) => prev.filter((p) => p.name !== f.name))
                    }
                    className="grid h-5 w-5 shrink-0 place-items-center rounded text-[#6F6F8D] transition-colors hover:bg-[#F4F8FF] hover:text-[#17173A]"
                  >
                    <X className="h-3.5 w-3.5" strokeWidth={2} />
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div className="flex items-center justify-between">
            <a
              href="#"
              onClick={(e) => e.preventDefault()}
              className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#2F68E5] hover:underline"
            >
              <Download className="h-4 w-4" strokeWidth={2} />
              Download sample template (Excel)
            </a>
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                document.getElementById("brand-quick-fields")?.scrollIntoView({
                  behavior: "smooth",
                  block: "start",
                });
              }}
              className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#2F68E5] hover:underline"
            >
              <ExternalLink className="h-4 w-4" strokeWidth={2} />
              Or fill the details manually
            </a>
          </div>

          {/* Quick fields */}
          <div id="brand-quick-fields" className="flex flex-col gap-4">
            <div className="space-y-2">
              <Label className="text-[13px] font-semibold text-[#17173A]">Brand name</Label>
              <Input
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                placeholder="e.g. Northwind"
                className="text-[13px]"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[13px] font-semibold text-[#17173A]">Brand voice</Label>
              <Input
                value={brandVoice}
                onChange={(e) => setBrandVoice(e.target.value)}
                placeholder="e.g. Warm, confident, never pushy"
                className="text-[13px]"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[13px] font-semibold text-[#17173A]">Who you sell to</Label>
              <Input
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
                placeholder="e.g. Urban millennials shopping for home goods"
                className="text-[13px]"
              />
            </div>
          </div>

          <div className="border-t border-[#EDEFF5]" />

          {/* Detailed questionnaire */}
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-[15px] font-bold text-[#17173A]">
                  Tell us more about your brand
                </h3>
                <p className="text-[13px] text-[#6F6F8D]">
                  The more details you share, the better the engine can represent your brand.
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <span className="rounded-md bg-[#F1F3F9] px-2.5 py-1 text-[12px] font-medium text-[#6F6F8D]">
                  {answeredCount > 0
                    ? `${answeredCount}/${BRAND_WIKI_TOTAL_QUESTIONS} answered`
                    : `${BRAND_WIKI_TOTAL_QUESTIONS} questions`}
                </span>
                <button
                  onClick={toggleAll}
                  className="text-[13px] font-semibold text-[#2F68E5] hover:underline"
                >
                  {allExpanded ? "Collapse all" : "Expand all"}
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-2.5">
              {BRAND_WIKI_GROUPS.map((group) => {
                const isOpen = openGroups.has(group.id);
                const answered = answeredInGroup(group);
                return (
                  <div
                    key={group.id}
                    className="overflow-hidden rounded-xl border border-[#E4E8F1] bg-white"
                  >
                    <button
                      onClick={() => toggleGroup(group.id)}
                      aria-expanded={isOpen}
                      className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-[#FAFBFE]"
                    >
                      <span
                        className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${group.tile}`}
                      >
                        <group.Icon className="h-5 w-5" strokeWidth={1.8} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-1.5 text-[14px] font-semibold text-[#17173A]">
                          {group.title}
                          <span className="text-[13px] font-medium text-[#9A9AB2]">
                            {answered > 0
                              ? `(${answered}/${group.questions.length})`
                              : `(${group.questions.length})`}
                          </span>
                        </span>
                        <span className="block truncate text-[12.5px] text-[#6F6F8D]">
                          {group.subtitle}
                        </span>
                      </span>
                      <ChevronDown
                        className={`h-5 w-5 shrink-0 text-[#9A9AB2] transition-transform duration-200 ${
                          isOpen ? "rotate-180" : ""
                        }`}
                        strokeWidth={2}
                      />
                    </button>

                    {isOpen && (
                      <div className="flex flex-col gap-4 border-t border-[#EDEFF5] px-4 py-4">
                        {group.questions.map((q) => (
                          <div key={q.id} className="space-y-1.5">
                            <Label className="text-[13px] font-semibold text-[#17173A]">
                              {q.label}
                            </Label>
                            {q.multiline ? (
                              <Textarea
                                value={answers[q.id] ?? ""}
                                onChange={(e) =>
                                  setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))
                                }
                                placeholder={q.placeholder}
                                className="min-h-[64px] text-[13px]"
                              />
                            ) : (
                              <Input
                                value={answers[q.id] ?? ""}
                                onChange={(e) =>
                                  setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))
                                }
                                placeholder={q.placeholder}
                                className="text-[13px]"
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <p className="text-[12px] text-[#6F6F8D]">
            Answers will be used to guide content generation and decisioning.
          </p>
        </div>

        <DialogFooter className="border-t border-[#EDEFF5] px-6 py-4">
          <button
            onClick={() => onOpenChange(false)}
            className="rounded border border-[#DDE2EE] bg-white px-4 py-2 font-manrope text-[13px] font-semibold text-[#17173A] transition-colors hover:bg-[#F4F8FF]"
          >
            Cancel
          </button>
          <button
            disabled={!isValid}
            onClick={handleSave}
            className="rounded bg-[#2F68E5] px-4 py-2 font-manrope text-[13px] font-semibold tracking-[0.42px] text-white transition-colors hover:bg-[#255ad2] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Save brand wiki
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
