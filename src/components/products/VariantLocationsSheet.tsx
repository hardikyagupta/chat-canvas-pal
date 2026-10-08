import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import type { VariantLocation } from "./productLocations";

const GRID = "grid-cols-[1.1fr_1fr_1fr_90px_150px]";

const money = (currency: string, n: number) => `${currency} ${n.toFixed(2)}`;

/**
 * Side drawer opened from a variant's Locations count on the product details
 * page: the variant's price, stock and availability in each location.
 * Sits above the full-screen details page, hence the raised z-index.
 */
export default function VariantLocationsSheet({
  productName,
  currency,
  locations,
  open,
  onClose,
}: {
  productName: string;
  currency: string;
  locations: VariantLocation[];
  open: boolean;
  onClose: () => void;
}) {
  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent
        side="right"
        overlayClassName="z-[100]"
        className="z-[101] flex w-[720px] flex-col gap-0 p-0 sm:max-w-[720px]"
      >
        <SheetHeader className="border-b border-[#DDE2EE] px-6 py-5 text-left">
          <SheetTitle className="font-manrope text-base font-bold text-[#17173A]">
            Locations — {productName}
          </SheetTitle>
          <SheetDescription className="font-manrope text-[13px] text-[#6F6F8D]">
            {locations.length} {locations.length === 1 ? "location" : "locations"}
          </SheetDescription>
        </SheetHeader>

        <div className="scroll-slim min-h-0 flex-1 overflow-y-auto px-6 py-4">
          <div className="overflow-hidden rounded-lg border border-[#DDE2EE]">
            <div className={`grid ${GRID} h-11 items-center border-b border-[#DDE2EE] bg-[#F7F9FC] font-manrope text-[13px] font-medium text-[#6F6F8D]`}>
              <span className="px-4">Location</span>
              <span className="px-4 text-right">Retail price</span>
              <span className="px-4 text-right">Sales price</span>
              <span className="px-4 text-right">Quantity</span>
              <span className="px-4">Availability</span>
            </div>
            {locations.map((l) => (
              <div
                key={l.city}
                className={`grid ${GRID} min-h-[48px] items-center border-b border-[#EDF0F7] font-manrope text-sm text-[#17173A] last:border-b-0`}
              >
                <span className="px-4">{l.city}</span>
                <span className="px-4 text-right">{money(currency, l.retail)}</span>
                <span className="px-4 text-right">{money(currency, l.sales)}</span>
                <span className="px-4 text-right">{l.quantity}</span>
                <span className="px-4">
                  <span
                    className={`inline-flex items-center whitespace-nowrap rounded-[3px] border px-2 py-[2px] text-[11px] font-bold uppercase leading-4 tracking-[0.6px] ${
                      l.inStock
                        ? "border-[#80E0C2] bg-[#F0FFFB] text-[#4DB88C]"
                        : "border-[#C9CCD7] bg-[#F4F5F8] text-[#6E7191]"
                    }`}
                  >
                    {l.inStock ? "Active" : "Out of stock"}
                  </span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
