// Custom agents created by the user (Claude-Projects-style). Each agent carries
// its own instructions and reference files, edited within the session. This is a
// prototype store — like reports.ts / defaultChats, it lives in React state only
// (no backend / persistence), so the list resets on refresh.

import { generateAgentAvatar } from '@/lib/agentAvatar';

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
}

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
  },
];

/** User-created agents — empty on first load; starter agents live in STARTER_AGENTS. */
export const initialCustomAgents: CustomAgent[] = [];
