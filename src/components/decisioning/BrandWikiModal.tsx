import { useEffect, useRef, useState } from "react";
import { FileText, Upload, X } from "lucide-react";
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
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Re-seed the form from saved data every time the modal opens.
  useEffect(() => {
    if (!open) return;
    setFiles(initialData?.files ?? []);
    setBrandName(initialData?.brandName ?? "");
    setBrandVoice(initialData?.brandVoice ?? "");
    setAudience(initialData?.audience ?? "");
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

  const allQuestionsAnswered =
    brandName.trim() !== "" && brandVoice.trim() !== "" && audience.trim() !== "";
  const isValid = files.length > 0 || allQuestionsAnswered;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-[16px] font-manrope sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle className="text-[18px] font-bold text-[#17173A]">
            Build your brand wiki
          </DialogTitle>
          <DialogDescription className="text-[13px] text-[#6F6F8D]">
            Upload brand docs or answer a few questions — the engine reads everything.
          </DialogDescription>
        </DialogHeader>

        <div className="flex max-h-[55vh] flex-col gap-4 overflow-y-auto pr-1">
          {/* Drop zone */}
          <div
            onClick={() => fileInputRef.current?.click()}
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
            className={`flex cursor-pointer flex-col items-center gap-1.5 rounded-lg border-2 border-dashed px-4 py-6 text-center transition-colors ${
              dragOver ? "border-[#2F68E5] bg-[#EEF3FF]" : "border-[#DDE2EE] bg-white"
            }`}
          >
            <Upload className="h-5 w-5 text-[#2F68E5]" strokeWidth={1.8} />
            <p className="text-[13px] font-medium text-[#17173A]">
              Drag files here or <span className="font-semibold text-[#2F68E5]">browse</span>
            </p>
            <p className="text-[12px] text-[#6F6F8D]">
              Brand guidelines, tone docs, product catalogs — PDF, DOC, CSV
            </p>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.csv,.txt,.md"
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

          <p className="text-[12px] text-[#6F6F8D]">
            No docs handy? The questions below work just as well.
          </p>

          <div className="space-y-2">
            <Label className="text-[13px] font-semibold text-[#17173A]">Brand name</Label>
            <Input
              value={brandName}
              onChange={(e) => setBrandName(e.target.value)}
              placeholder="e.g. Acme Fresh"
              className="text-[13px]"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-[13px] font-semibold text-[#17173A]">
              How does your brand sound?
            </Label>
            <Textarea
              value={brandVoice}
              onChange={(e) => setBrandVoice(e.target.value)}
              placeholder="e.g. Warm, direct, a little playful — never pushy"
              className="min-h-[64px] text-[13px]"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-[13px] font-semibold text-[#17173A]">
              Who are you talking to?
            </Label>
            <Textarea
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
              placeholder="e.g. Value-conscious parents shopping weekly for groceries"
              className="min-h-[64px] text-[13px]"
            />
          </div>
        </div>

        <DialogFooter>
          <button
            onClick={() => onOpenChange(false)}
            className="rounded border border-[#DDE2EE] bg-white px-4 py-2 font-manrope text-[13px] font-semibold text-[#17173A] transition-colors hover:bg-[#F4F8FF]"
          >
            Cancel
          </button>
          <button
            disabled={!isValid}
            onClick={() => {
              onSave({ files, brandName, brandVoice, audience });
              onOpenChange(false);
            }}
            className="rounded bg-[#2F68E5] px-4 py-2 font-manrope text-[13px] font-semibold tracking-[0.42px] text-white transition-colors hover:bg-[#255ad2] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Save brand wiki
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
