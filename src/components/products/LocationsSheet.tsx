import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import type { LocationStock } from "./productLocations";

const nf = new Intl.NumberFormat("en-US");
const GRID = "grid-cols-[1.2fr_1fr_1.2fr_90px_80px]";

/**
 * Side drawer listing where a product's stock sits — state, city, district,
 * pin code and the quantity held there. The footer total is the product's
 * quantity, so it always agrees with the Quantity column.
 */
export default function LocationsSheet({
  productTitle,
  locations,
  onClose,
}: {
  productTitle: string | null;
  locations: LocationStock[];
  onClose: () => void;
}) {
  const total = locations.reduce((sum, l) => sum + l.quantity, 0);

  return (
    <Sheet open={productTitle !== null} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="flex w-[720px] flex-col gap-0 p-0 sm:max-w-[720px]">
        <SheetHeader className="border-b border-[#DDE2EE] px-6 py-5 text-left">
          <SheetTitle className="font-manrope text-base font-bold text-[#17173A]">
            Available locations ({locations.length})
          </SheetTitle>
          <SheetDescription className="font-manrope text-[13px] text-[#6F6F8D]">
            Stock of <span className="font-semibold text-[#17173A]">{productTitle}</span> by location.
          </SheetDescription>
        </SheetHeader>

        <div className="scroll-slim min-h-0 flex-1 overflow-y-auto px-6 py-4">
          <div className="overflow-hidden rounded-lg border border-[#DDE2EE]">
            <div className={`grid ${GRID} h-11 items-center border-b border-[#DDE2EE] bg-[#F7F9FC] font-manrope text-[13px] font-medium text-[#6F6F8D]`}>
              <span className="px-4">State</span>
              <span className="px-4">City</span>
              <span className="px-4">District</span>
              <span className="px-4">Pin code</span>
              <span className="px-4 text-right">Quantity</span>
            </div>
            {locations.map((l) => (
              <div
                key={l.pinCode}
                className={`grid ${GRID} min-h-[48px] items-center border-b border-[#EDF0F7] font-manrope text-sm text-[#17173A]`}
              >
                <span className="px-4">{l.state}</span>
                <span className="px-4">{l.city}</span>
                <span className="px-4">{l.district}</span>
                <span className="px-4">{l.pinCode}</span>
                <span className="px-4 text-right">{nf.format(l.quantity)}</span>
              </div>
            ))}
            <div className={`grid ${GRID} h-12 items-center bg-[#F7F9FC] font-manrope text-sm font-bold text-[#17173A]`}>
              <span className="col-span-4 px-4">Total quantity</span>
              <span className="px-4 text-right">{nf.format(total)}</span>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
