import type { ReactNode } from "react";

/**
 * The white card every step's content sits in, plus its heading block. Keeping
 * this in one place is what makes each channel's steps look identical.
 */
export default function StepCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <div className="w-full rounded-lg border border-[#DDE2EE] bg-white p-8">
      <div className="max-w-[640px]">
        <div className="mb-6">
          <h2 className="font-manrope text-base font-bold text-[#17173A]">{title}</h2>
          <p className="mt-1 font-manrope text-sm text-[#6F6F8D]">{description}</p>
        </div>
        {children}
      </div>
    </div>
  );
}
