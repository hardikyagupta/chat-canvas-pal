// Custom agents created by the user (Claude-Projects-style). Each agent carries
// its own instructions and reference files, edited within the session. This is a
// prototype store — like reports.ts / defaultChats, it lives in React state only
// (no backend / persistence), so the list resets on refresh.

import { generateAgentAvatar } from '@/lib/agentAvatar';
import { CURRENT_USER_NAME } from '@/lib/chatMeta';

export type AgentFileKind = 'upload' | 'text' | 'github';

export interface AgentFile {
  id: string;
  title: string;
  kind: AgentFileKind;
  /** Pasted text (kind === 'text'). */
  content?: string;
  /** Byte size for uploaded files (kind === 'upload'). */
  size?: number;
}

export type AgentVisibility = 'private' | 'workspace';

export interface AgentTools {
  domains: {
    campaigns: boolean;
    journeys: boolean;
    segments: boolean;
  };
  capabilities: {
    generateReports: boolean;
    brandWiki: boolean;
    deepResearch: boolean;
    memory: boolean;
  };
  visibility: AgentVisibility;
}

export const DEFAULT_AGENT_TOOLS: AgentTools = {
  domains: { campaigns: true, journeys: true, segments: false },
  capabilities: { generateReports: true, brandWiki: true, deepResearch: false, memory: false },
  visibility: 'workspace',
};

export const DEFAULT_STARTER_QUESTIONS = [
  'Run my weekly review',
  'What were the biggest movers last week?',
  'How did last week compare to the week before?',
  'Turn last weekly roll-up into a report',
];

/**
 * A topic chip plus the prompts behind it. `icon` names a lucide icon, resolved
 * where it renders so this data file stays free of component imports.
 */
export interface AgentPromptGroup {
  label: string;
  icon: 'trending-up' | 'file-text' | 'activity' | 'dollar-sign' | 'mouse-pointer-click'
    | 'users' | 'megaphone' | 'calendar' | 'search' | 'sparkles';
  /** Optional header above the prompts; defaults to "Suggested prompts". */
  header?: string;
  prompts: string[];
}

/** Used by agents that don't define their own — mirrors the weekly-review flow. */
export const DEFAULT_PROMPT_GROUPS: AgentPromptGroup[] = [
  {
    label: 'Weekly review',
    icon: 'calendar',
    header: 'Review the week',
    prompts: [
      'Run my weekly review.',
      'What were the biggest movers last week?',
      'How did last week compare to the week before?',
    ],
  },
  {
    label: 'Performance',
    icon: 'trending-up',
    header: 'Dig into performance',
    prompts: [
      'Which campaigns over- and under-performed, and why?',
      'Where did engagement drop the most this month?',
      'Show the trend behind the headline numbers.',
    ],
  },
  {
    label: 'Reporting',
    icon: 'file-text',
    header: 'Turn it into a report',
    prompts: [
      'Turn the last roll-up into a report.',
      'Build an exec-ready summary of this month.',
      'Draft a one-page update for the leadership team.',
    ],
  },
];

export interface CustomAgent {
  id: string;
  name: string;
  description: string;
  /** Project instructions; '' until the user sets them. */
  instructions: string;
  files: AgentFile[];
  /** Relative "edited" time label, e.g. "2h". "now" for freshly created. */
  updatedAt: string;
  /**
   * Relative "last run" time label, e.g. "3d". Undefined means the agent has
   * never been executed — the table view shows "N/A".
   */
  lastExecutedAt?: string;
  /** Soft-gradient avatar (data URI), derived from the name. */
  avatarSrc?: string;
  /** Suggested first prompt, pre-filled into the composer on the agent's page. */
  starterPrompt?: string;
  /** Domains, capabilities, and visibility this agent can use. */
  tools?: AgentTools;
  /** Clickable prompts shown when this agent is active in chat. */
  starterQuestions?: string[];
  /**
   * Topic chips under the agent's composer. Tapping one attaches it to the
   * composer and swaps the row for that topic's suggested prompts — the same
   * two-step the chat homepage uses. Falls back to DEFAULT_PROMPT_GROUPS.
   */
  promptGroups?: AgentPromptGroup[];
  /** Pre-built agents shipped with the product — not deletable by the user. */
  isBuiltIn?: boolean;
  /** Who authored the agent. Unset on the starter agents (they're Netcore's) and
   *  on anything created before this was tracked — see `agentCreatedBy`. */
  createdBy?: string;
  /** What this agent has learned about the user. Unset falls back to
   *  DEFAULT_AGENT_MEMORY — see `agentMemory`. */
  memory?: AgentMemory;
  /** How much this agent is used and what it produced — see `agentUsage`.
   *  Unset (a freshly created agent) reads as zeros. */
  usage?: AgentUsage;
  /**
   * Whether the agent carries previous conversations into a new chat as
   * context. Unset means on — an agent you've talked to before should not
   * start cold by default.
   */
  useConversationContext?: boolean;
  /**
   * Whether the agent is available to use. Unset means active; turning it off
   * keeps the agent and its configuration but takes it out of circulation.
   */
  isActive?: boolean;
}

/** Agents are on and context-aware unless they say otherwise. */
export const agentUsesConversationContext = (agent: CustomAgent): boolean =>
  agent.useConversationContext ?? true;

export const agentIsActive = (agent: CustomAgent): boolean => agent.isActive ?? true;

/** One themed block of the memory summary. */
export interface AgentMemorySection {
  heading: string;
  body: string;
}

/**
 * What an agent has picked up about how this user works. Prototype content —
 * there's no extraction behind it — but shaped the way a real summary would be:
 * prose the user can read and correct, plus the facts they asked it to keep.
 */
export interface AgentMemory {
  /** Coarse relative label, same vocabulary as chat times ('now', '11m', '2h'). */
  updatedAt: string;
  sections: AgentMemorySection[];
  /** Things the user explicitly told it to remember, newest first. */
  notes?: string[];
}

export const DEFAULT_AGENT_MEMORY: AgentMemory = {
  updatedAt: '11m',
  sections: [
    {
      heading: 'Overview',
      body:
        "You run lifecycle marketing at Netcore and lean on this agent for the weekly and monthly read on performance. " +
        "You care about outcomes first — revenue, conversions, retention — and treat opens and clicks as diagnostics rather than headline numbers. " +
        "You would rather see three things worth acting on than a complete dump of every metric.",
    },
    {
      heading: 'Reporting preferences',
      body:
        "You want the exec summary at the top, then channel mix, then what changed against the prior period, and you always ask for the delta in absolute terms alongside the percentage. " +
        "Week-on-week is your default comparison; month-on-month for anything going to leadership. " +
        "You ask for deliverability to be ruled out before creative gets blamed for a drop, and you like every claim tied back to the campaign or segment it came from.",
    },
    {
      heading: 'Channels and audience',
      body:
        "Email and WhatsApp carry most of your volume, with web push as a secondary nudge channel. " +
        "The segments you return to most are lapsed high-value buyers, first-time purchasers inside their first 30 days, and the festive-season cohort you rebuild each quarter. " +
        "You have flagged frequency capping as a recurring worry on WhatsApp and expect it called out when send volume climbs.",
    },
    {
      heading: 'Working style',
      body:
        "You prefer plain language over marketing vocabulary, short paragraphs, and a clear rationale you can forward to product and engineering without rewriting it. " +
        "When something looks off you want the caveat stated up front rather than buried. " +
        "You typically review on Monday mornings and want the roll-up ready before then.",
    },
  ],
  notes: [
    'Always quote revenue in INR with the USD figure in brackets.',
    'Exclude internal test campaigns (anything prefixed "test") from every roll-up.',
    'Priya owns deliverability — loop her in when bounce rate moves more than a point.',
  ],
};

/** The memory a given agent carries, falling back to the shared prototype set. */
export const agentMemory = (agent: CustomAgent): AgentMemory => agent.memory ?? DEFAULT_AGENT_MEMORY;

/**
 * Per-agent usage telemetry. Prototype values — a real deployment would report
 * these — but they are the numbers a marketer judges an agent on: how much it
 * runs, whether those runs land, whether people come back, and how long it takes.
 */
export interface AgentUsage {
  /** Runs in the current month. */
  runs: number;
  /** Share of those runs that completed successfully, 0-100. */
  successRate: number;
  /** Share of users who came back to this agent after a first run, 0-100. */
  repeatUsage: number;
  /** Mean wall-clock seconds a run takes. */
  avgCompletionSeconds: number;
}

/** A brand-new agent has done nothing yet — no invented history. */
export const ZERO_AGENT_USAGE: AgentUsage = {
  runs: 0, successRate: 0, repeatUsage: 0, avgCompletionSeconds: 0,
};

export const agentUsage = (agent: CustomAgent): AgentUsage => agent.usage ?? ZERO_AGENT_USAGE;

/** Author shown for the pre-built agents that ship with the product. */
export const NETCORE_AUTHOR = 'Netcore';

/**
 * Who to credit for an agent: the stored author, else Netcore for the starter
 * agents, else the signed-in user (anything they made before this was tracked).
 */
export const agentCreatedBy = (agent: CustomAgent): string =>
  agent.createdBy ?? (agent.isBuiltIn ? NETCORE_AUTHOR : CURRENT_USER_NAME);

export const MONTHLY_REPORT_AGENT_NAME = 'Monthly report agent';

export const STARTER_AGENTS: CustomAgent[] = [
  {
    id: 'starter-monthly-report',
    name: MONTHLY_REPORT_AGENT_NAME,
    description: "Turns last month's data into an exec-ready report.",
    instructions:
      'You are a marketing performance analyst. Lead with outcomes (revenue, conversions, ROI), then channel mix, then what changed vs prior period. Flag delivery issues before blaming creative. End with 3 prioritized recommendations.',
    files: [],
    updatedAt: '2d',
    lastExecutedAt: '5h',
    avatarSrc: generateAgentAvatar(MONTHLY_REPORT_AGENT_NAME),
    starterPrompt: "Generate last month's marketing performance report.",
    tools: {
      domains: { campaigns: true, journeys: true, segments: false },
      capabilities: { generateReports: true, brandWiki: true, deepResearch: false, memory: false },
      visibility: 'workspace',
    },
    starterQuestions: DEFAULT_STARTER_QUESTIONS,
    promptGroups: [
      {
        label: 'Monthly roll-up',
        icon: 'calendar',
        header: 'Build the monthly view',
        prompts: [
          "Generate last month's marketing performance report.",
          'Summarize which channels drove conversions last month.',
          'What changed versus the month before?',
        ],
      },
      {
        label: 'Revenue',
        icon: 'dollar-sign',
        header: 'Follow the revenue',
        prompts: [
          'Which campaigns contributed the most revenue last month?',
          'Compare Q2 revenue against the prior quarter.',
          'Where are we spending most for the least return?',
        ],
      },
      {
        label: 'Exec summary',
        icon: 'file-text',
        header: 'Package it for leadership',
        prompts: [
          'Draft an exec-ready summary with wins, gaps and next actions.',
          'Give me three prioritized recommendations for next month.',
          'Turn this into a one-page board update.',
        ],
      },
    ],
    isBuiltIn: true,
    usage: { runs: 128, successRate: 94, repeatUsage: 68, avgCompletionSeconds: 102 },
  },
  {
    id: 'starter-campaign-launch',
    name: 'Campaign launch coach',
    description: 'Plans checklists and QA before campaigns go live.',
    instructions:
      'You are a campaign operations lead. Break launches into timeline, audience, creative, channels, and measurement. Surface risks early (list hygiene, frequency caps, tracking). Prefer actionable checklists over long prose.',
    files: [],
    updatedAt: '2d',
    lastExecutedAt: '1d',
    avatarSrc: generateAgentAvatar('Campaign launch coach'),
    starterPrompt: 'Help me plan the launch for our next campaign.',
    tools: {
      domains: { campaigns: true, journeys: true, segments: false },
      capabilities: { generateReports: false, brandWiki: true, deepResearch: false, memory: true },
      visibility: 'workspace',
    },
    starterQuestions: [
      'Build a go-live checklist for next week',
      'Which channels should we lead with?',
      'Review my launch timeline for gaps',
      'What could go wrong before we hit send?',
    ],
    promptGroups: [
      {
        label: 'Launch plan',
        icon: 'calendar',
        header: 'Plan the launch',
        prompts: [
          'Help me plan the launch for our next campaign.',
          'Review my launch timeline for gaps.',
          'Which channels should we lead with, and in what order?',
        ],
      },
      {
        label: 'Pre-flight QA',
        icon: 'activity',
        header: 'Check before you send',
        prompts: [
          'Build a pre-flight QA checklist for the festive push.',
          'What could go wrong before we hit send?',
          'Check list hygiene, frequency caps and tracking for this launch.',
        ],
      },
      {
        label: 'Audience',
        icon: 'users',
        header: 'Get the audience right',
        prompts: [
          'Who should we target first for this launch?',
          'Suggest a hold-out group so we can measure lift.',
          'How should we sequence sends across segments?',
        ],
      },
    ],
    isBuiltIn: true,
    usage: { runs: 76, successRate: 91, repeatUsage: 54, avgCompletionSeconds: 148 },
  },
  {
    id: 'starter-channel-health',
    name: 'Channel health analyst',
    description: 'Spots delivery drops and dips before they spread.',
    instructions:
      'You diagnose channel performance like a lifecycle marketer. Compare delivery, open/click, and conversion rates across email, SMS, push, and WhatsApp. Call out the metric that moved first, then hypothesize root cause. Recommend one quick win and one structural fix.',
    files: [],
    updatedAt: '2d',
    lastExecutedAt: '3d',
    avatarSrc: generateAgentAvatar('Channel health analyst'),
    starterPrompt: 'Which channels need attention this week?',
    tools: {
      domains: { campaigns: true, journeys: true, segments: true },
      capabilities: { generateReports: true, brandWiki: false, deepResearch: true, memory: false },
      visibility: 'workspace',
    },
    starterQuestions: [
      'Why is WhatsApp underdelivering?',
      'Compare email vs push performance this month',
      'Where should I shift budget next?',
      'Summarize channel health for leadership',
    ],
    promptGroups: [
      {
        label: 'Needs attention',
        icon: 'activity',
        header: 'See what needs attention',
        prompts: [
          'Which channels need attention this week?',
          'Show me delivery drops in the last 14 days.',
          'Flag anything trending the wrong way before it compounds.',
        ],
      },
      {
        label: 'Deliverability',
        icon: 'megaphone',
        header: 'Chase down delivery',
        prompts: [
          'Check email deliverability after the domain change.',
          'Which sender identities are hurting delivery rates?',
          'Where are messages being sent but never landing?',
        ],
      },
      {
        label: 'Engagement',
        icon: 'mouse-pointer-click',
        header: 'Look at engagement',
        prompts: [
          'Which campaigns have high opens but low conversions?',
          'Compare CTR by channel against the prior period.',
          'Where is engagement dipping fastest?',
        ],
      },
    ],
    isBuiltIn: true,
    usage: { runs: 213, successRate: 97, repeatUsage: 74, avgCompletionSeconds: 46 },
  },
  {
    id: 'starter-audience-strategist',
    name: 'Audience strategist',
    description: 'Turns segment data into targeting recommendations.',
    instructions:
      'You are a CRM and audience strategist. Think in segments, lifecycle stages, and incremental lift. Tie every recommendation to a business outcome (retention, reactivation, LTV). Use plain language — avoid jargon unless the user does first.',
    files: [],
    updatedAt: '2d',
    avatarSrc: generateAgentAvatar('Audience strategist'),
    starterPrompt: 'Which segments should I prioritize this quarter?',
    tools: {
      domains: { campaigns: false, journeys: true, segments: true },
      capabilities: { generateReports: true, brandWiki: true, deepResearch: false, memory: true },
      visibility: 'workspace',
    },
    starterQuestions: [
      'Who are our highest-value segments right now?',
      'Suggest a win-back audience to build',
      'Map segments to journey stages',
      'Find overlap between two campaign audiences',
    ],
    promptGroups: [
      {
        label: 'Segments',
        icon: 'users',
        header: 'Prioritize segments',
        prompts: [
          'Which segments should I prioritize this quarter?',
          'Find lapsed high-value buyers worth a win-back.',
          'Which segments are growing, and which are shrinking?',
        ],
      },
      {
        label: 'Targeting',
        icon: 'search',
        header: 'Sharpen targeting',
        prompts: [
          'Turn last quarter’s data into targeting recommendations.',
          'Who should we exclude from the next send, and why?',
          'Suggest a segment for a first-purchase nudge.',
        ],
      },
      {
        label: 'Personas',
        icon: 'sparkles',
        header: 'Understand the people',
        prompts: [
          'Build a persona snapshot for our best customers.',
          'What separates repeat buyers from one-time buyers?',
          'Which traits predict churn in the next 30 days?',
        ],
      },
    ],
    isBuiltIn: true,
    usage: { runs: 41, successRate: 88, repeatUsage: 61, avgCompletionSeconds: 226 },
  },
  {
    id: 'starter-market-pulse',
    name: 'Market pulse scout',
    description: 'Surfaces competitor moves and category trends.',
    instructions:
      'You are a competitive intelligence analyst for marketers. Summarize what competitors are doing, what is shifting in the category, and where our positioning has room to differentiate. Cite assumptions clearly and suggest messaging hooks for the next campaign brief.',
    files: [],
    updatedAt: '2d',
    lastExecutedAt: '6d',
    avatarSrc: generateAgentAvatar('Market pulse scout'),
    starterPrompt: 'What should we know about competitors this week?',
    tools: {
      domains: { campaigns: true, journeys: false, segments: false },
      capabilities: { generateReports: false, brandWiki: true, deepResearch: true, memory: false },
      visibility: 'workspace',
    },
    starterQuestions: [
      'Summarize competitor campaign activity',
      'What trends are shaping our category?',
      'Draft a positioning brief for Q4',
      'Find gaps in our messaging vs peers',
    ],
    promptGroups: [
      {
        label: 'Competitors',
        icon: 'search',
        header: 'Watch the competition',
        prompts: [
          'What should we know about competitors this week?',
          'Which competitor moves are worth responding to?',
          'How is our positioning holding up against theirs?',
        ],
      },
      {
        label: 'Trends',
        icon: 'trending-up',
        header: 'Track the category',
        prompts: [
          'What category trends are picking up right now?',
          'Which seasonal moments should we plan for next?',
          'What changed in the market since last month?',
        ],
      },
      {
        label: 'Messaging',
        icon: 'megaphone',
        header: 'Find the angle',
        prompts: [
          'Suggest messaging angles for our next brief.',
          'Which hooks are working in our category?',
          'Where is our messaging sounding like everyone else?',
        ],
      },
    ],
    isBuiltIn: true,
    usage: { runs: 57, successRate: 92, repeatUsage: 45, avgCompletionSeconds: 134 },
  },
];

/** User-created agents — empty on first load; starter agents live in STARTER_AGENTS. */
export const initialCustomAgents: CustomAgent[] = [];
