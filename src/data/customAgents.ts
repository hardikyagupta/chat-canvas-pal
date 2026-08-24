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
  /** Pre-built agents shipped with the product — not deletable by the user. */
  isBuiltIn?: boolean;
}

export const MONTHLY_REPORT_AGENT_NAME = 'Monthly report agent';

export const STARTER_AGENTS: CustomAgent[] = [
  {
    id: 'starter-monthly-report',
    name: MONTHLY_REPORT_AGENT_NAME,
    description: "Turns last month's campaign data into a polished, executive-ready performance report.",
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
    isBuiltIn: true,
  },
  {
    id: 'starter-campaign-launch',
    name: 'Campaign launch coach',
    description: 'Plans go-live checklists, channel sequencing, and pre-flight QA before campaigns go live.',
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
    isBuiltIn: true,
  },
  {
    id: 'starter-channel-health',
    name: 'Channel health analyst',
    description: 'Spots delivery drops, engagement dips, and channel mix imbalances before they compound.',
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
    isBuiltIn: true,
  },
  {
    id: 'starter-audience-strategist',
    name: 'Audience strategist',
    description: 'Turns segment data into targeting recommendations, persona snapshots, and growth opportunities.',
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
    isBuiltIn: true,
  },
  {
    id: 'starter-market-pulse',
    name: 'Market pulse scout',
    description: 'Surfaces competitor moves, category trends, and messaging angles for your next brief.',
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
    isBuiltIn: true,
  },
];

/** User-created agents — empty on first load; starter agents live in STARTER_AGENTS. */
export const initialCustomAgents: CustomAgent[] = [];
