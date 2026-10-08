import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { toast } from "sonner";

/**
 * Maps each product-feed attribute to the field it's read from in the synced
 * catalog. Opened from "Attribute mapping" on the All products tab.
 */

export interface MappableAttribute {
  key: string;
  label: string;
  /** Catalog field it's read from by default. */
  field: string;
}

const SOURCE_FIELDS = [
  "title",
  "item_group_id",
  "price",
  "sale_price",
  "inventory",
  "locations",
  "availability",
  "brand",
  "condition",
  "currency",
  "description",
  "link",
  "id",
  "— Not mapped —",
];

export default function AttributeMappingSheet({
  open,
  onOpenChange,
  attributes,
  catalogName,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  attributes: MappableAttribute[];
  catalogName: string;
}) {
  const [mapping, setMapping] = useState<Record<string, string>>(() =>
    Object.fromEntries(attributes.map((a) => [a.key, a.field]))
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-[480px] flex-col gap-0 p-0 sm:max-w-[480px]">
        <SheetHeader className="border-b border-[#DDE2EE] px-6 py-5 text-left">
          <SheetTitle className="font-manrope text-base font-bold text-[#17173A]">
            Attribute mapping
          </SheetTitle>
          <SheetDescription className="font-manrope text-[13px] text-[#6F6F8D]">
            Choose which field in <span className="font-semibold text-[#17173A]">{catalogName}</span> feeds each
            product attribute.
          </SheetDescription>
        </SheetHeader>

        <div className="scroll-slim min-h-0 flex-1 overflow-y-auto px-6 py-4">
          <div className="grid grid-cols-[1fr_1fr] gap-x-4 gap-y-3">
            <p className="font-manrope text-xs font-medium text-[#6F6F8D]">Attribute</p>
            <p className="font-manrope text-xs font-medium text-[#6F6F8D]">Catalog field</p>
            {attributes.map((a) => (
              <div key={a.key} className="contents">
                <p className="flex h-9 items-center font-manrope text-sm font-semibold text-[#17173A]">{a.label}</p>
                <select
                  value={mapping[a.key]}
                  onChange={(e) => setMapping((m) => ({ ...m, [a.key]: e.target.value }))}
                  className="h-9 rounded-[5px] border border-[#DDE2EE] bg-white px-2.5 font-manrope text-[13px] text-[#17173A] outline-none focus:border-[#2F68E5]"
                >
                  {SOURCE_FIELDS.map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </div>

        <SheetFooter className="flex-row justify-end gap-3 border-t border-[#DDE2EE] px-6 py-4 sm:space-x-0">
          <button type="button" className="dc-btn dc-btn-secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </button>
          <button
            type="button"
            className="dc-btn dc-btn-primary"
            onClick={() => {
              onOpenChange(false);
              toast.success("Attribute mapping saved");
            }}
          >
            Save
          </button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
