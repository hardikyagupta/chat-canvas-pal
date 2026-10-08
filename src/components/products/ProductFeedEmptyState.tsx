import illustration from "/campaign-assets/product-feed-empty.svg";

/**
 * Content → Products → Product feed, before any feed exists: the
 * isometric laptop illustration, a one-line explanation and the create CTA.
 */

export default function ProductFeedEmptyState({ onCreate }: { onCreate?: () => void }) {
  return (
    <div className="flex min-h-[560px] flex-1 flex-col items-center justify-center rounded-lg border border-[#DDE2EE] bg-white px-6 py-12 text-center">
      <img src={illustration} alt="" className="w-[351px] max-w-full" />
      <h2 className="mt-2 font-manrope text-base font-bold text-[#17173A]">
        You have not created any product feed
      </h2>
      <p className="mt-2 font-manrope text-sm text-[#6F6F8D]">Get started by creating a new product feed</p>
      <button type="button" onClick={onCreate} className="dc-btn dc-btn-primary mt-6">
        Create product feed
      </button>
    </div>
  );
}
