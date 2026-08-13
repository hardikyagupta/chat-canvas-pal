import { Switch } from "@/components/ui/switch";
import StepCard from "./StepCard";

export interface SetupValues {
  name: string;
  tags: string;
  gaTracking: boolean;
  conversionTracking: boolean;
}

const NAME_LIMIT = 100;

const fieldClass =
  "h-10 w-full rounded-md border border-[#DDE2EE] bg-[#F7F9FC] px-3 font-manrope text-sm text-[#17173A] outline-none transition-colors placeholder:text-[#A0A0A0] focus:border-[#2F68E5] focus:bg-white";

function ToggleRow({
  title,
  description,
  checked,
  onChange,
}: {
  title: string;
  description: React.ReactNode;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-md border border-[#DDE2EE] p-4">
      <div>
        <p className="font-manrope text-sm font-bold text-[#17173A]">{title}</p>
        <p className="mt-1 font-manrope text-xs leading-[18px] text-[#6F6F8D]">{description}</p>
      </div>
      <Switch
        checked={checked}
        onCheckedChange={onChange}
        className="shrink-0 data-[state=checked]:bg-[#00C48C]"
      />
    </div>
  );
}

/** Setup step for an Email campaign — the only fully-built step so far. */
export default function CampaignSetupStep({
  values,
  onChange,
}: {
  values: SetupValues;
  onChange: (patch: Partial<SetupValues>) => void;
}) {
  return (
    <StepCard title="Campaign details" description="Specify basic details for this campaign">
      <div className="mb-7">
        <label className="mb-1.5 block font-manrope text-sm font-semibold text-[#17173A]">
          Campaign name <span className="text-[#FC5E02]">*</span>
        </label>
        <input
          type="text"
          value={values.name}
          onChange={(e) => onChange({ name: e.target.value.slice(0, NAME_LIMIT) })}
          placeholder="Ex: MyCampaign"
          className={fieldClass}
        />
        <p className="mt-1 text-right font-manrope text-[11px] text-[#6F6F8D]">
          {values.name.length}/{NAME_LIMIT}
        </p>
      </div>

      <div className="mb-8">
        <label className="mb-1.5 block font-manrope text-sm font-semibold text-[#17173A]">
          Add tags
        </label>
        <input
          type="text"
          value={values.tags}
          onChange={(e) => onChange({ tags: e.target.value })}
          placeholder="Ex: Festive, Q3"
          className={fieldClass}
        />
      </div>

      <div className="mb-5">
        <h2 className="font-manrope text-base font-bold text-[#17173A]">Advanced</h2>
        <p className="mt-1 font-manrope text-sm leading-5 text-[#6F6F8D]">
          Track your campaign performance to measure traffic and conversion. Set default values for
          Google Analytics tracking and conversion goal in global advanced settings.
        </p>
      </div>

      <div className="space-y-3">
        <ToggleRow
          title="GA tracking"
          description={
            <>
              Track performance of your campaign with UTM parameters{" "}
              <a href="#" className="text-[#2F68E5] underline">
                learn more
              </a>
            </>
          }
          checked={values.gaTracking}
          onChange={(v) => onChange({ gaTracking: v })}
        />
        <ToggleRow
          title="Conversion tracking"
          description="Activity which represents a conversion for your campaign."
          checked={values.conversionTracking}
          onChange={(v) => onChange({ conversionTracking: v })}
        />
      </div>
    </StepCard>
  );
}
