import { useState } from "react";
import { LogOut, X } from "lucide-react";
import Dropdown from "./Dropdown";
import { journeys } from "./journeys.data";
import {
  DEFAULT_REMOVE_FROM_JOURNEY_SETTING,
  describeRemoveFromJourney,
  isRemoveFromJourneyValid,
  type RemoveFromJourneySetting,
} from "./journeyRemoveFromJourney.data";

/** This account's real journeys, same list the Journeys page shows —
 *  displayed with spaces instead of underscores, purely cosmetic. */
const JOURNEY_OPTIONS = journeys.map((j) => ({ value: j.name, label: j.name.replace(/_/g, " ") }));

/**
 * "Remove from Journey" action node — its one setting is which other
 * journey to pull the contact out of. Single required field, so the whole
 * screen is just that field plus the header/footer chrome every other
 * config screen here uses.
 */
export default function RemoveFromJourneyConfig({
  initial,
  onCancel,
  onSave,
}: {
  initial?: RemoveFromJourneySetting;
  onCancel: () => void;
  /** Called with the sentence to show on the canvas node, and the raw
   *  setting (so it can be persisted for re-editing later). */
  onSave: (nodeLabel: string, setting: RemoveFromJourneySetting) => void;
}) {
  const [setting, setSetting] = useState<RemoveFromJourneySetting>(initial ?? DEFAULT_REMOVE_FROM_JOURNEY_SETTING);
  // Only shows the "Required" error once the user has actually tried to
  // save with nothing picked — an empty required field on first open would
  // otherwise read as a pre-existing mistake rather than just unset.
  const [touched, setTouched] = useState(false);

  const valid = isRemoveFromJourneyValid(setting);
  const showError = touched && !valid;

  const handleSave = () => {
    if (!valid) {
      setTouched(true);
      return;
    }
    onSave(describeRemoveFromJourney(setting), setting);
  };

  return (
    <>
      {/* Header */}
      <div className="flex items-start gap-3 px-6 pt-6">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[#EBD2FF]">
          <LogOut className="h-[18px] w-[18px] text-[#9449DF]" strokeWidth={2} />
        </span>
        <div className="flex-1">
          <h2 className="font-manrope text-[16px] font-bold leading-tight text-[#17173A]">
            Remove from Journey
          </h2>
          <p className="mt-1 font-manrope text-[12.5px] text-[#6F6F8D]">
            Pull this contact out of another journey they may be in.
          </p>
        </div>
        <button
          type="button"
          aria-label="Close"
          onClick={onCancel}
          className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center text-[#6F6F8D] transition-colors hover:text-[#17173A]"
        >
          <X className="h-5 w-5" strokeWidth={2} />
        </button>
      </div>

      <div className="mt-3 border-t border-[#EBEBF5]" />

      {/* Body */}
      <div className="scroll-slim min-h-0 flex-1 overflow-y-auto px-5 py-4">
        <label className="block font-manrope text-[13px] font-bold text-[#17173A]">
          Journey name
          <span className="ml-0.5 text-[#E5484D]">*</span>
        </label>
        <Dropdown
          value={setting.journeyName}
          options={JOURNEY_OPTIONS}
          onChange={(v) => setSetting({ journeyName: v })}
          placeholder="Journey name"
          widthClass="mt-2 w-full"
          heightClass="h-10"
          className={showError ? "border-[#E5484D] bg-[#FDF0EF]" : undefined}
        />
        {showError && <p className="mt-1.5 font-manrope text-[12px] text-[#E5484D]">Required</p>}
      </div>

      <div className="border-t border-[#EBEBF5]" />

      {/* Footer */}
      <div className="flex items-center justify-end px-6 py-4">
        <button type="button" onClick={handleSave} className="dc-btn dc-btn-primary">
          Save
        </button>
      </div>
    </>
  );
}
