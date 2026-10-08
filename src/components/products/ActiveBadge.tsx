/**
 * Active / In-active pill used across Products (catalog status, product
 * availability): a tinted fill, a 1px hairline in the same hue and a bold
 * uppercase label.
 */
export default function ActiveBadge({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-flex items-center rounded-[3px] border px-2 py-[2px] font-manrope text-[11px] font-bold uppercase leading-4 tracking-[0.6px] ${
        active
          ? "border-[#80E0C2] bg-[#F0FFFB] text-[#4DB88C]"
          : "border-[#F2CF8C] bg-[#FFFAF0] text-[#DDA13A]"
      }`}
    >
      {active ? "Active" : "In-active"}
    </span>
  );
}
