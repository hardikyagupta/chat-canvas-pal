import { useState } from "react";
import L1Nav from "@/components/campaigns/L1Nav";
import TopNav from "@/components/campaigns/TopNav";
import CatalogsTab from "@/components/products/CatalogsTab";
import AllProductsTab from "@/components/products/AllProductsTab";
import ProductFeedDrawer from "@/components/products/ProductFeedDrawer";
import ProductFeedEmptyState from "@/components/products/ProductFeedEmptyState";
import ReplenishmentListing from "@/components/products/replenishment/ReplenishmentListing";
import { toast } from "sonner";

const TABS = ["Catalogs", "All products", "Product feed", "Replenishment"] as const;
type ProductsTab = (typeof TABS)[number];

/**
 * Content → Products, reached from the Products row of the Content L2 flyout.
 * Same shell as the other listing pages (L1 rail, top bar, scrolling content
 * column) with a tab strip for Catalogs, All products, Product feed and
 * Replenishment.
 */
export default function Products() {
  const [tab, setTab] = useState<ProductsTab>("Catalogs");
  // Replenishment portals its search field and Configuration CTA into this
  // node, so they sit on the tab row the way the other tabs' actions do. Held
  // in state (not a ref) so the listing re-renders once the node exists.
  const [feedOpen, setFeedOpen] = useState(false);
  const [actionSlot, setActionSlot] = useState<HTMLDivElement | null>(null);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#F4F8FF]">
      <L1Nav active="content" activeContentItem="products" />

      <div className="flex min-w-0 flex-1 flex-col p-2">
        <TopNav showCoMarketerNudge={false} />

        <div className="scroll-slim mt-2 flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto px-2 pt-4">
          <h1 className="font-manrope text-[20px] font-bold leading-tight text-[#17173A]">Products</h1>

          <div className="mt-5 flex items-end justify-between gap-4">
            <div className="flex items-center gap-6">
              {TABS.map((t) => {
                const isActive = t === tab;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTab(t)}
                    className="relative shrink-0 whitespace-nowrap pb-2 pt-0.5 font-manrope text-[15px] tracking-[0.29px] transition-colors"
                  >
                    <span className={isActive ? "font-bold text-[#2F68E5]" : "font-medium text-[#6F6F8D] hover:text-[#17173A]"}>
                      {t}
                    </span>
                    {isActive && (
                      <span className="absolute inset-x-0 bottom-0 h-[3px] rounded-full bg-[#2F68E5]" />
                    )}
                  </button>
                );
              })}
            </div>
            {(tab === "Replenishment" || tab === "All products") && <div ref={setActionSlot} className="mb-2 flex shrink-0 items-center gap-2" />}
          </div>

          <div className="flex min-h-0 flex-1 flex-col pb-8 pt-4">
            {tab === "Catalogs" && (
              <CatalogsTab
                onImportLogs={() => toast("Import logs will open here.")}
                onAddCatalog={() => toast("Adding a catalog will open here.")}
              />
            )}
            {tab === "Replenishment" && <ReplenishmentListing actionSlot={actionSlot} />}
            {tab === "All products" && <AllProductsTab actionSlot={actionSlot} />}
            {tab === "Product feed" && (
              <ProductFeedEmptyState onCreate={() => setFeedOpen(true)} />
            )}
          </div>
        </div>
      </div>

      {/* Remounted per open so each feed starts from a blank form. */}
      {feedOpen && <ProductFeedDrawer open onClose={() => setFeedOpen(false)} />}
    </div>
  );
}
