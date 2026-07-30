import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AgentTools } from '@/data/customAgents';

const FONT = { fontFamily: 'Manrope, sans-serif' } as const;
const COLUMN_HEADING = 'text-[11px] font-semibold uppercase tracking-[0.6px] text-[var(--color-grey-soft)]';

function ToolCheckbox({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-[8px] py-[3px]">
      <button
        type="button"
        role="checkbox"
        aria-checked={checked}
        onClick={onChange}
        className={cn(
          'flex size-[16px] shrink-0 items-center justify-center rounded-[4px] border transition-colors',
          checked
            ? 'border-[var(--color-royal)] bg-[var(--color-royal)] text-white'
            : 'border-[var(--color-line-input)] bg-white text-transparent',
        )}
      >
        <Check className="size-[11px]" strokeWidth={3} />
      </button>
      <span className="text-[13px] text-[var(--color-ink)]" style={FONT}>{label}</span>
    </label>
  );
}

function ToolRadio({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-[8px] py-[3px]">
      <button
        type="button"
        role="radio"
        aria-checked={checked}
        onClick={onChange}
        className={cn(
          'flex size-[16px] shrink-0 items-center justify-center rounded-full border transition-colors',
          checked ? 'border-[var(--color-royal)] bg-white' : 'border-[var(--color-line-input)] bg-white',
        )}
      >
        {checked ? <span className="size-[8px] rounded-full bg-[var(--color-royal)]" /> : null}
      </button>
      <span className="text-[13px] text-[var(--color-ink)]" style={FONT}>{label}</span>
    </label>
  );
}

interface AgentToolsConfigPanelProps {
  value: AgentTools;
  onChange: (value: AgentTools) => void;
}

/** Inline domains / capabilities / visibility picker — shared by create and edit flows. */
export const AgentToolsConfigPanel: React.FC<AgentToolsConfigPanelProps> = ({ value, onChange }) => (
  <div className="rounded-[12px] bg-[var(--color-surface-0)] px-[14px] py-[14px]">
    <div className="flex flex-col gap-[16px]">
      <div className="flex flex-col gap-[6px]">
        <span className={COLUMN_HEADING} style={FONT}>Domains</span>
        <ToolCheckbox
          label="Campaigns"
          checked={value.domains.campaigns}
          onChange={() => onChange({ ...value, domains: { ...value.domains, campaigns: !value.domains.campaigns } })}
        />
        <ToolCheckbox
          label="Journeys"
          checked={value.domains.journeys}
          onChange={() => onChange({ ...value, domains: { ...value.domains, journeys: !value.domains.journeys } })}
        />
        <ToolCheckbox
          label="Segments"
          checked={value.domains.segments}
          onChange={() => onChange({ ...value, domains: { ...value.domains, segments: !value.domains.segments } })}
        />
      </div>

      <div className="flex flex-col gap-[6px]">
        <span className={COLUMN_HEADING} style={FONT}>Capabilities</span>
        <ToolCheckbox
          label="Generate reports"
          checked={value.capabilities.generateReports}
          onChange={() => onChange({ ...value, capabilities: { ...value.capabilities, generateReports: !value.capabilities.generateReports } })}
        />
        <ToolCheckbox
          label="Brand Wiki"
          checked={value.capabilities.brandWiki}
          onChange={() => onChange({ ...value, capabilities: { ...value.capabilities, brandWiki: !value.capabilities.brandWiki } })}
        />
        <ToolCheckbox
          label="Deep research"
          checked={value.capabilities.deepResearch}
          onChange={() => onChange({ ...value, capabilities: { ...value.capabilities, deepResearch: !value.capabilities.deepResearch } })}
        />
        <ToolCheckbox
          label="Memory"
          checked={value.capabilities.memory}
          onChange={() => onChange({ ...value, capabilities: { ...value.capabilities, memory: !value.capabilities.memory } })}
        />
      </div>

      <div className="flex flex-col gap-[6px]">
        <span className={COLUMN_HEADING} style={FONT}>Visibility</span>
        <div className="flex flex-wrap items-center gap-x-[20px] gap-y-[6px]">
          <ToolRadio
            label="Private (only me)"
            checked={value.visibility === 'private'}
            onChange={() => onChange({ ...value, visibility: 'private' })}
          />
          <ToolRadio
            label="Workspace (whole team)"
            checked={value.visibility === 'workspace'}
            onChange={() => onChange({ ...value, visibility: 'workspace' })}
          />
        </div>
      </div>
    </div>
  </div>
);
