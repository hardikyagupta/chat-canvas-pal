import React from 'react';
import {
  LayoutGrid, MessageSquare, Activity, Database, Settings2,
  FileText, Wrench, Clock, Sparkles, PencilLine, Trash2,
  BookOpen, Search, Brain, type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { DsButton, dsButtonVariants } from '@/components/ui/ds-button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import ChatInput from './ChatInput';
import {
  agentCreatedBy, agentMemory, agentUsage, agentIsActive, agentUsesConversationContext,
  DEFAULT_AGENT_TOOLS, type AgentVisibility, type CustomAgent,
} from '@/data/customAgents';
import { relativeLabelToOffsetMs } from '@/lib/chatMeta';
import type { LhsChatItem } from './LhsSidebar';
import { PencilIcon } from './PencilIcon';

const FONT: React.CSSProperties = { fontFamily: 'Manrope, sans-serif' };

export type AgentTabKey = 'overview' | 'chats' | 'activity' | 'memory' | 'settings';

const TABS: { key: AgentTabKey; label: string; icon: LucideIcon }[] = [
  { key: 'overview', label: 'Overview', icon: LayoutGrid },
  { key: 'chats', label: 'Chats', icon: MessageSquare },
  { key: 'activity', label: 'Activity', icon: Activity },
  { key: 'memory', label: 'Memory', icon: Database },
  { key: 'settings', label: 'Settings', icon: Settings2 },
];

/**
 * Which sections each surface offers.
 *  - 'chat' (co-marketer): the page is where you chat, so Chats lives here and
 *    configuration stays in the RHS panel beside it.
 *  - 'workspace' (L1): chat history lives in the docked chat's own recents, so
 *    Chats drops out and a Settings section takes its place.
 */
const TAB_SETS: Record<'chat' | 'workspace', AgentTabKey[]> = {
  chat: ['overview', 'chats', 'activity', 'memory'],
  workspace: ['overview', 'activity', 'memory', 'settings'],
};

/**
 * Tab strip under the composer. Same recipe as the Reports page's source
 * filters — the tabs ARE DS buttons (selected = primary, rest = tertiary) with
 * the same count badge, so this reads as one system rather than a lookalike.
 */
export const AgentTabStrip: React.FC<{
  active: AgentTabKey;
  onChange: (key: AgentTabKey) => void;
  /** Counts shown as a badge next to a tab, where one is meaningful. */
  counts?: Partial<Record<AgentTabKey, number>>;
  /** Which surface's section set to render. Defaults to the co-marketer's. */
  variant?: 'chat' | 'workspace';
}> = ({ active, onChange, counts, variant = 'chat' }) => (
  <div role="tablist" aria-label="Agent sections" className="flex flex-wrap items-center gap-[8px]">
    {TABS.filter((t) => TAB_SETS[variant].includes(t.key)).map(({ key, label, icon: Icon }) => {
      const isActive = key === active;
      const count = counts?.[key];
      return (
        <button
          key={key}
          type="button"
          role="tab"
          aria-selected={isActive}
          onClick={() => onChange(key)}
          className={cn(
            dsButtonVariants({ variant: isActive ? 'primary' : 'tertiary' }),
            count !== undefined && 'pr-[10px]',
          )}
          style={FONT}
        >
          <Icon className="size-[16px]" />
          {label}
          {count !== undefined && (
            <span
              className={cn(
                'inline-flex items-center justify-center min-w-[18px] h-[18px] px-[5px] rounded-full text-[11px] font-semibold',
                isActive ? 'bg-white/20 text-white' : 'bg-[var(--color-surface-2)] text-[var(--btn-neutral)]',
              )}
            >
              {count}
            </span>
          )}
        </button>
      );
    })}
  </div>
);

/* ── shared bits ──────────────────────────────────────────────────── */

const PanelCard: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <div className={cn('rounded-[16px] border border-[var(--color-line-input)] bg-card', className)}>{children}</div>
);

const PanelHeading: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p className="text-[15px] font-semibold text-[var(--color-ink)]" style={FONT}>{children}</p>
);

const EmptyNote: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <p className={cn('text-[13px] leading-[19px] text-[var(--color-grey-soft)]', className)} style={FONT}>{children}</p>
);

/**
 * Metric card in the AI Dashboard's style: a tinted wrapper carrying the label,
 * with the figure on an inset white card and a qualifier beneath. Same tokens as `AiDashboard`'s performance strip so
 * the two surfaces read as one product.
 */
const MetricCard: React.FC<{
  label: string;
  value: string;
  sub: string;
}> = ({ label, value, sub }) => (
  <div className="flex flex-1 flex-col overflow-hidden rounded-[8px] bg-[#ECEFF5]">
    <div className="flex items-center py-2 pl-4 pr-2">
      <p className="font-manrope text-[14px] font-bold text-[#17173A]">{label}</p>
    </div>
    <div className="flex flex-1 px-1 pb-1">
      <div className="flex flex-1 flex-col gap-1 rounded-[8px] border-[0.25px] border-[#DCDCDC] bg-white px-3 py-4">
        <p className="font-manrope text-[32px] font-bold leading-none text-[#17173A]">{value}</p>
        <p className="font-manrope text-[12px] leading-[17px] text-[#6F6F8D]">{sub}</p>
      </div>
    </div>
  </div>
);

/** Label / value pair used by About. `action` rides the right edge (the edit
 *  pencil); `multiline` lets a long value wrap and keep its line breaks, clamped
 *  to 4 lines so a long brief can't run away with the card — the pencil opens
 *  the full text. Same clamp the RHS config panel uses. */
const InfoRow: React.FC<{
  label: string; value: React.ReactNode; last?: boolean;
  action?: React.ReactNode; multiline?: boolean;
}> = ({ label, value, last, action, multiline }) => (
  <div
    className={cn(
      'flex items-start justify-between gap-[12px] px-[16px] py-[12px]',
      !last && 'border-b border-[var(--color-line)]',
    )}
  >
    <div className="flex min-w-0 flex-col gap-[2px]">
      <span className="text-[13px] leading-[18px] text-[var(--color-grey)]" style={FONT}>{label}</span>
      <span
        className={cn(
          'text-[13px] text-[var(--color-ink)]',
          multiline
            ? 'leading-[20px] whitespace-pre-wrap break-words line-clamp-4'
            : 'leading-[18px]',
        )}
        style={FONT}
      >
        {value}
      </span>
    </div>
    {action ? <div className="shrink-0">{action}</div> : null}
  </div>
);

/** Icon-only edit affordance — matches the RHS config panel's pencils. */
const EditPencil: React.FC<{ onClick: () => void; label: string }> = ({ onClick, label }) => (
  <button
    type="button"
    onClick={onClick}
    aria-label={label}
    title={label}
    className="flex items-center justify-center size-[28px] rounded-[8px] text-[var(--color-charcoal)] transition-colors hover:bg-[oklch(0_0_0_/_0.06)]"
  >
    <PencilIcon className="size-[15px]" />
  </button>
);

const Pill: React.FC<{ children: React.ReactNode; tone?: 'neutral' | 'success' }> = ({ children, tone = 'neutral' }) => (
  <span
    className={cn(
      'inline-flex items-center rounded-full px-[8px] py-[2px] text-[11px] font-medium',
      tone === 'success'
        ? 'bg-[color-mix(in_oklch,var(--color-success)_14%,transparent)] text-[color:color-mix(in_oklch,var(--color-success)_75%,var(--color-ink))]'
        : 'bg-[var(--color-surface-2)] text-[color:var(--color-grey)]',
    )}
    style={FONT}
  >
    {children}
  </span>
);

/* ── derivations ──────────────────────────────────────────────────── */

const enabledDomains = (agent: CustomAgent): string[] => {
  const d = agent.tools?.domains ?? DEFAULT_AGENT_TOOLS.domains;
  return [d.campaigns && 'Campaigns', d.journeys && 'Journeys', d.segments && 'Segments'].filter(Boolean) as string[];
};

const CAPABILITY_LABELS: { key: keyof CustomAgent['tools']['capabilities']; label: string; icon: LucideIcon }[] = [
  { key: 'generateReports', label: 'Generate reports', icon: FileText },
  { key: 'brandWiki', label: 'Brand Wiki', icon: BookOpen },
  { key: 'deepResearch', label: 'Deep research', icon: Search },
  { key: 'memory', label: 'Memory', icon: Brain },
];

const enabledCapabilities = (agent: CustomAgent) => {
  const c = agent.tools?.capabilities ?? DEFAULT_AGENT_TOOLS.capabilities;
  return CAPABILITY_LABELS.filter(({ key }) => c[key]);
};

const relTime = (label?: string) => (!label ? '—' : label === 'now' ? 'just now' : `${label} ago`);

/* ── Overview ─────────────────────────────────────────────────────── */

/** Seconds as the shortest honest phrasing — "42s", "1m 42s", "1h 2m". */
const formatDuration = (seconds: number): string => {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const rem = seconds % 60;
  if (m < 60) return rem ? `${m}m ${rem}s` : `${m}m`;
  const h = Math.floor(m / 60);
  return m % 60 ? `${h}h ${m % 60}m` : `${h}h`;
};

/**
 * The four headline figures — what a marketer judges an agent on: how much it
 * runs, how reliably it finishes, whether people come back, and how long it
 * takes. Exported on its own because the L1 workspace variant lifts this row
 * above the tab strip, where those answers land without a click.
 *
 * A brand-new agent has no runs, so the three rates read "—" rather than 0% —
 * which would claim it failed everything.
 */
export const AgentKpiRow: React.FC<{ agent: CustomAgent }> = ({ agent }) => {
  const usage = agentUsage(agent);
  const hasRuns = usage.runs > 0;

  return (
    <div className="flex flex-wrap gap-6">
      <MetricCard label="Runs" value={String(usage.runs)} sub="This month" />
      <MetricCard
        label="Success rate"
        value={hasRuns ? `${usage.successRate}%` : '—'}
        sub="Runs completed successfully"
      />
      <MetricCard
        label="Repeat usage"
        value={hasRuns ? `${usage.repeatUsage}%` : '—'}
        sub="Users who came back"
      />
      <MetricCard
        label="Avg. completion time"
        value={hasRuns ? formatDuration(usage.avgCompletionSeconds) : '—'}
        sub="Per run"
      />
    </div>
  );
};

/**
 * The agent's particulars — what the Overview tab holds beside the figures.
 *
 * Passing the two edit handlers (the L1 workspace variant does) turns this into
 * the place the agent is edited from: name and description get a pencil onto the
 * details modal, and the instructions show in full rather than as a word count.
 * Without them it stays read-only, which is what the co-marketer surface wants —
 * it edits from the RHS panel instead.
 */
export const AgentAboutCard: React.FC<{
  agent: CustomAgent;
  chats: LhsChatItem[];
  onEditDetails?: () => void;
  onEditInstructions?: () => void;
  /** False drops the "About this agent" label — the workspace variant is alone
   *  in its tab, so the tab name already says what this is. The co-marketer's
   *  Overview keeps it, where it separates the card from the KPI row above. */
  showHeading?: boolean;
}> = ({ agent, chats, onEditDetails, onEditInstructions, showHeading = true }) => {
  const domains = enabledDomains(agent);
  const visibility = (agent.tools?.visibility ?? 'workspace') === 'workspace';
  // Everyone who shows up as an owner on this agent's chats, plus the author.
  const people = new Set<string>([agentCreatedBy(agent), ...chats.map((c) => c.owner).filter(Boolean) as string[]]);

  return (
    <div className="flex flex-col gap-[10px]">
      {showHeading ? <PanelHeading>About this agent</PanelHeading> : null}
      <PanelCard>
        {/* One row, one pencil: the details modal edits the pair together, so
            splitting them put two identical affordances on the same target. */}
        {onEditDetails ? (
          <InfoRow
            label="Name and description"
            action={<EditPencil onClick={onEditDetails} label="Edit name and description" />}
            value={
              <span className="flex flex-col gap-[2px]">
                <span className="text-[13px] leading-[18px] text-[var(--color-ink)]">{agent.name}</span>
                <span className="text-[13px] leading-[18px] text-[var(--color-grey)]">
                  {agent.description || 'No description yet.'}
                </span>
              </span>
            }
          />
        ) : (
          <InfoRow label="Description" value={agent.description || 'No description yet.'} />
        )}
        <InfoRow
          label="Instructions"
          multiline={!!onEditInstructions}
          value={
            onEditInstructions
              ? (agent.instructions?.trim() || 'Not set yet — add instructions to tailor how this agent responds.')
              : agent.instructions
                ? `${agent.instructions.trim().split(/\s+/).length} words`
                : 'Not set yet'
          }
          action={onEditInstructions ? <EditPencil onClick={onEditInstructions} label="Edit instructions" /> : undefined}
        />
        <InfoRow label="Created by" value={agentCreatedBy(agent)} />
        <InfoRow label="Last edited" value={relTime(agent.updatedAt)} />
        <InfoRow
          label="Scope"
          value={domains.length ? domains.join(', ') : 'No domains enabled'}
        />
        <InfoRow
          label="Visibility"
          value={<Pill tone={visibility ? 'success' : 'neutral'}>{visibility ? 'Workspace (whole team)' : 'Private to you'}</Pill>}
        />
        <InfoRow
          label="People"
          value={`${people.size} ${people.size === 1 ? 'person has' : 'people have'} worked with this agent`}
          last
        />
      </PanelCard>
    </div>
  );
};

/** Figures + particulars together — what the co-marketer's Overview tab shows. */
export const AgentOverviewPanel: React.FC<{ agent: CustomAgent; chats: LhsChatItem[] }> = ({ agent, chats }) => (
  <div className="flex flex-col gap-[16px]">
    <AgentKpiRow agent={agent} />
    <AgentAboutCard agent={agent} chats={chats} />
  </div>
);

/* ── Activity ─────────────────────────────────────────────────────── */

type ActivityEntry = { id: string; icon: LucideIcon; text: string; who?: string; time: string; offset: number };

/**
 * A timeline built only from what the agent actually carries: its chats (each
 * one an exchange, newest first) plus the two lifecycle beats we know — when it
 * was authored and when it was last edited. Sorted by the coarse relative label
 * the prototype stores, using the same parser the chat history uses.
 */
export const AgentActivityPanel: React.FC<{ agent: CustomAgent; chats: LhsChatItem[] }> = ({ agent, chats }) => {
  const entries: ActivityEntry[] = React.useMemo(() => {
    const out: ActivityEntry[] = chats.map((chat) => ({
      id: `chat-${chat.id}`,
      icon: MessageSquare,
      text: chat.title,
      who: chat.owner ?? agentCreatedBy(agent),
      time: relTime(chat.time),
      offset: relativeLabelToOffsetMs(chat.time),
    }));

    if (agent.lastExecutedAt) {
      out.push({
        id: 'ran',
        icon: Sparkles,
        text: 'Agent ran and produced a result',
        who: 'Automated run',
        time: relTime(agent.lastExecutedAt),
        offset: relativeLabelToOffsetMs(agent.lastExecutedAt),
      });
    }
    out.push({
      id: 'edited',
      icon: PencilLine,
      text: 'Agent configuration last updated',
      who: agentCreatedBy(agent),
      time: relTime(agent.updatedAt),
      offset: relativeLabelToOffsetMs(agent.updatedAt),
    });

    return out.sort((a, b) => a.offset - b.offset);
  }, [agent, chats]);

  return (
    <div className="flex flex-col">
      <PanelCard className="p-[16px]">
        <ol className="flex flex-col">
          {entries.map((entry, i) => {
            const Icon = entry.icon;
            const last = i === entries.length - 1;
            return (
              <li key={entry.id} className="flex gap-[12px]">
                {/* Rail — dot plus the connector down to the next beat. */}
                <div className="flex flex-col items-center">
                  <span className="flex size-[26px] shrink-0 items-center justify-center rounded-full bg-[var(--color-surface-1)]">
                    <Icon className="size-[13px] text-[var(--color-slate)]" />
                  </span>
                  {!last && <span className="w-px flex-1 bg-[var(--color-line)]" />}
                </div>
                <div className={cn('flex min-w-0 flex-1 items-start justify-between gap-[12px]', last ? 'pb-0' : 'pb-[16px]')}>
                  <div className="flex min-w-0 flex-col gap-[2px]">
                    <span className="text-[13px] leading-[18px] text-[var(--color-ink)]" style={FONT}>{entry.text}</span>
                    {entry.who && (
                      <span className="text-[12px] leading-[16px] text-[var(--color-grey-soft)]" style={FONT}>{entry.who}</span>
                    )}
                  </div>
                  <span className="shrink-0 text-[12px] leading-[16px] text-[var(--color-grey)] whitespace-nowrap" style={FONT}>
                    {entry.time}
                  </span>
                </div>
              </li>
            );
          })}
        </ol>
      </PanelCard>
    </div>
  );
};

/* ── Memory ───────────────────────────────────────────────────────── */

/** One settings row: title + supporting copy on the left, its control right. */
const SettingRow: React.FC<{
  title: string; children: React.ReactNode; control?: React.ReactNode; last?: boolean;
}> = ({ title, children, control, last }) => (
  <div
    className={cn(
      'flex items-start justify-between gap-[16px] px-[16px] py-[14px]',
      !last && 'border-b border-[var(--color-line)]',
    )}
  >
    <div className="flex min-w-0 flex-col gap-[3px]">
      <span className="text-[14px] font-semibold leading-[20px] text-[var(--color-ink)]" style={FONT}>{title}</span>
      <span className="max-w-[560px] text-[13px] leading-[19px] text-[var(--color-grey)]" style={FONT}>{children}</span>
    </div>
    {control ? <div className="shrink-0 pt-[2px]">{control}</div> : null}
  </div>
);

/** Inline text button used inside the supporting copy. */
const InlineLink: React.FC<{ onClick: () => void; children: React.ReactNode }> = ({ onClick, children }) => (
  <button
    type="button"
    onClick={onClick}
    className="underline underline-offset-2 text-[var(--color-ink)] hover:text-[var(--color-royal)] transition-colors"
    style={FONT}
  >
    {children}
  </button>
);

/**
 * Memory is a real tools capability, so the switch writes straight through to
 * the agent. Everything sits in one card, divided into sections: the switch, the
 * summary it has built, the individual things it was told to remember (each
 * removable on the spot), and a composer to ask about or add to any of it.
 */
export const AgentMemoryPanel: React.FC<{
  agent: CustomAgent;
  onToggleMemory: (next: boolean) => void;
  onEditInstructions: () => void;
  /** Keep something the user typed into the composer. */
  onRemember: (note: string) => void;
  /** Drop one remembered item. */
  onForget: (note: string) => void;
}> = ({ agent, onToggleMemory, onEditInstructions, onRemember, onForget }) => {
  const on = (agent.tools?.capabilities ?? DEFAULT_AGENT_TOOLS.capabilities).memory;
  const memory = agentMemory(agent);
  const notes = memory.notes ?? [];
  const divider = 'border-b border-[var(--color-line)]';

  return (
    <div className="flex flex-col gap-[10px]">
      <PanelCard className="overflow-hidden">
        <SettingRow
          title="Enable memory"
          last={!on}
          control={<Switch checked={on} onCheckedChange={onToggleMemory} aria-label="Enable memory" />}
        >
          {on ? (
            <>
              This agent carries context between chats instead of starting cold each time — the
              metrics you care about, how you like reports framed, the segments you keep coming back to.
            </>
          ) : (
            <>
              Turn memory on and this agent carries context between chats instead of starting cold
              each time. Nothing is remembered while it is off.
            </>
          )}
        </SettingRow>

        {on ? (
          <>
            {/* The summary it has built — prose the user can read and correct. */}
            <div className={cn('flex flex-col gap-[14px] px-[16px] py-[14px]', divider)}>
              <div className="flex flex-col gap-[3px]">
                <span className="text-[14px] font-semibold leading-[20px] text-[var(--color-ink)]" style={FONT}>
                  Memory summary
                </span>
                <span className="max-w-[560px] text-[13px] leading-[19px] text-[var(--color-grey)]" style={FONT}>
                  What this agent has picked up from your chats and files, updated{' '}
                  {memory.updatedAt === 'now' ? 'just now' : `${memory.updatedAt} ago`}. Use{' '}
                  <InlineLink onClick={onEditInstructions}>instructions</InlineLink> for anything you
                  want it to always keep in mind.
                </span>
              </div>
              {memory.sections.map((section) => (
                <div key={section.heading} className="flex flex-col gap-[4px]">
                  <h3 className="text-[13px] font-semibold text-[var(--color-ink)]" style={FONT}>{section.heading}</h3>
                  <p className="text-[13px] leading-[20px] text-[var(--color-charcoal)]" style={FONT}>{section.body}</p>
                </div>
              ))}
            </div>

            {/* The individual things it was told to remember, each removable. */}
            <div className={cn('flex flex-col', divider)}>
              <div className="flex items-center gap-[8px] px-[16px] pt-[14px] pb-[8px]">
                <span className="text-[14px] font-semibold leading-[20px] text-[var(--color-ink)]" style={FONT}>
                  Saved memories
                </span>
                <span className="text-[12px] text-[var(--color-grey-soft)]" style={FONT}>
                  {notes.length === 0 ? 'none yet' : notes.length}
                </span>
              </div>
              {notes.length > 0 ? (
                <div className="flex flex-col px-[16px] pb-[14px]">
                  {notes.map((note) => (
                    <div
                      key={note}
                      className="group flex items-start justify-between gap-[12px] rounded-[10px] border border-[var(--color-line-input)] bg-[var(--color-surface-0)] px-[12px] py-[9px] mt-[6px] first:mt-0"
                    >
                      <span className="min-w-0 text-[13px] leading-[19px] text-[var(--color-charcoal)]" style={FONT}>
                        {note}
                      </span>
                      <button
                        type="button"
                        onClick={() => onForget(note)}
                        aria-label={`Forget: ${note}`}
                        title="Forget this"
                        className="flex size-[24px] shrink-0 items-center justify-center rounded-[7px] text-[var(--color-grey)] opacity-0 transition-[opacity,color,background-color] hover:bg-[oklch(0_0_0_/_0.06)] hover:text-[var(--color-danger)] focus-visible:opacity-100 group-hover:opacity-100"
                      >
                        <Trash2 className="size-[14px]" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="px-[16px] pb-[14px] text-[13px] leading-[19px] text-[var(--color-grey-soft)]" style={FONT}>
                  Nothing saved yet. Tell the agent below what to keep in mind and it shows up here.
                </p>
              )}
            </div>

            {/* Ask about the summary, or add something to remember. */}
            <div className="px-[16px] py-[14px]">
              <ChatInput
                layout="linear"
                flat
                showAddButton={false}
                placeholder="Ask or update"
                onSend={(message) => {
                  const note = message.trim();
                  if (note) onRemember(note);
                }}
              />
            </div>
          </>
        ) : null}
      </PanelCard>

      <EmptyNote className="px-[2px]">
        Memory applies to this agent only — turning it off here does not affect your other agents.
      </EmptyNote>
    </div>
  );
};

/* ── Settings ─────────────────────────────────────────────────────── */

/**
 * The workspace variant's Settings section. Access reads and writes the
 * agent's existing `tools.visibility` rather than introducing a second notion
 * of who can use it — so this and the About card's Visibility row can never
 * disagree. Deleting lives on the header button, not here.
 */
export const AgentSettingsPanel: React.FC<{
  agent: CustomAgent;
  onSetVisibility: (visibility: AgentVisibility) => void;
  onToggleConversationContext: (next: boolean) => void;
  onToggleActive: (next: boolean) => void;
  onCustomizeReports: () => void;
}> = ({ agent, onSetVisibility, onToggleConversationContext, onToggleActive, onCustomizeReports }) => {
  const visibility = agent.tools?.visibility ?? DEFAULT_AGENT_TOOLS.visibility;

  return (
    <PanelCard className="overflow-hidden">
      <SettingRow
        title="Access"
        control={
          <Select value={visibility} onValueChange={(v) => onSetVisibility(v as AgentVisibility)}>
            <SelectTrigger
              className="h-[36px] w-[220px] rounded-[10px] border-[var(--color-line-input)] text-[13px]"
              style={FONT}
              aria-label="Who can use this agent"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="workspace" className="text-[13px]" style={FONT}>Everyone can use</SelectItem>
              <SelectItem value="private" className="text-[13px]" style={FONT}>Only me</SelectItem>
            </SelectContent>
          </Select>
        }
      >
        Choose who can use this agent.
      </SettingRow>

      <SettingRow
        title="Conversation context"
        control={
          <Switch
            checked={agentUsesConversationContext(agent)}
            onCheckedChange={onToggleConversationContext}
            aria-label="Use previous conversations as context"
          />
        }
      >
        Use previous conversations with this agent as context.
      </SettingRow>

      <SettingRow
        title="Agent status"
        control={
          <Switch
            checked={agentIsActive(agent)}
            onCheckedChange={onToggleActive}
            aria-label="Agent status"
          />
        }
      >
        Allow people to use this agent.
      </SettingRow>

      <SettingRow
        title="Customize reports"
        last
        control={<DsButton variant="tertiary" onClick={onCustomizeReports}>Customize</DsButton>}
      >
        Choose how this agent lays out the reports it generates — which sections appear, in what order,
        and how the numbers are framed.
      </SettingRow>
    </PanelCard>
  );
};
