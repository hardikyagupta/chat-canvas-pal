import { Check, type LucideIcon } from "lucide-react";

/**
 * One required setup step on the "Configuring decisioning engine" page.
 * Unconfigured: blue icon tile + "Configure" CTA. Configured: green tile,
 * animated check beside the title, one-line summary, ghost "Edit" button.
 */
export default function SetupCard({
  icon: Icon,
  title,
  description,
  configured,
  summary,
  onConfigure,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  configured: boolean;
  summary?: string;
  onConfigure: () => void;
}) {
  return (
    <div
      className={`flex items-center gap-4 rounded-lg border bg-white p-5 transition-colors duration-300 ${
        configured ? "border-[#00C48C]/40" : "border-[#DDE2EE]"
      }`}
    >
      <div
        className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg transition-colors duration-300 ${
          configured ? "bg-[#E7EFEA]" : "bg-[#E7EDFF]"
        }`}
      >
        <Icon
          className={`h-5 w-5 transition-colors duration-300 ${
            configured ? "text-[#00C48C]" : "text-[#2F68E5]"
          }`}
          strokeWidth={1.8}
        />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h3 className="font-manrope text-sm font-semibold text-[#17173A]">{title}</h3>
          {configured && (
            <span className="grid h-4 w-4 place-items-center rounded-full bg-[#E7EFEA] animate-in zoom-in duration-300">
              <Check className="h-2.5 w-2.5 text-[#00C48C]" strokeWidth={3} />
            </span>
          )}
        </div>
        <p className="mt-0.5 truncate font-manrope text-[13px] text-[#6F6F8D]">
          {configured && summary ? summary : description}
        </p>
      </div>

      {configured ? (
        <button
          onClick={onConfigure}
          className="shrink-0 rounded border border-[#DDE2EE] bg-white px-4 py-1.5 font-manrope text-[13px] font-semibold text-[#17173A] transition-colors hover:bg-[#F4F8FF]"
        >
          Edit
        </button>
      ) : (
        <button
          onClick={onConfigure}
          className="shrink-0 rounded bg-[#2F68E5] px-4 py-1.5 font-manrope text-[13px] font-semibold tracking-[0.42px] text-white transition-colors hover:bg-[#255ad2]"
        >
          Configure
        </button>
      )}
    </div>
  );
}
