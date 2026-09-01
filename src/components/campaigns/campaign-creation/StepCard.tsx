import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * The white card every step's content sits in, plus its heading block. Keeping
 * this in one place is what makes each channel's steps look identical.
 */
export default function StepCard({
  title,
  description,
  action,
  wide,
  children,
}: {
  /** Omitted on steps whose heading lives on the accordion header instead. */
  title?: string;
  /** Omitted on steps whose heading stands alone, e.g. Schedule. */
  description?: string;
  /** Right-aligned slot on the heading row, e.g. the reachable-contacts pill. */
  action?: ReactNode;
  /** Steps whose content is a full-width surface rather than a form column. */
  wide?: boolean;
  children?: ReactNode;
}) {
  return (
    <div
      className={cn(
        "cc-step-card w-full rounded-lg border border-[#DDE2EE] bg-white p-8",
        wide ? "max-w-[1044px]" : "max-w-[704px]"
      )}
    >
      <div className={cn(wide ? "max-w-[980px]" : "max-w-[640px]")}>
        {(title || action) && (
          <div className="mb-6 flex items-start justify-between gap-6">
            {title && (
              <div>
                <h2 className="font-manrope text-base font-bold text-[#17173A]">{title}</h2>
                {description && (
                  <p className="mt-1 font-manrope text-sm text-[#6F6F8D]">{description}</p>
                )}
              </div>
            )}
            {action && <div className="shrink-0 pt-0.5">{action}</div>}
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
