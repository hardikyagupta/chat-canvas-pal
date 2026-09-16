import StepCard from "./StepCard";
import MultiSelectDropdown from "./MultiSelectDropdown";
import { APP_OPTIONS } from "./appOptions.data";

export interface AssetsValues {
  /** Which registered apps this campaign's creative/assets are pulled from. */
  selectedAssets: string[];
}

export const EMPTY_ASSETS: AssetsValues = {
  selectedAssets: [],
};

/** Ahead of Audience — which app(s) this send's assets belong to, so the
 *  steps after it (targeting, message) know what they're built against. */
export default function CampaignAssetsStep({
  values,
  onChange,
}: {
  values: AssetsValues;
  onChange: (patch: Partial<AssetsValues>) => void;
}) {
  return (
    <StepCard wide>
      <MultiSelectDropdown
        label="Select asset(s)"
        required
        options={APP_OPTIONS}
        value={values.selectedAssets}
        onChange={(selectedAssets) => onChange({ selectedAssets })}
      />
    </StepCard>
  );
}
