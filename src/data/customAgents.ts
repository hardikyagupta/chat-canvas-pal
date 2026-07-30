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
  /** Soft-gradient avatar (data URI), derived from the name. */
  avatarSrc?: string;
  /** Suggested first prompt, pre-filled into the composer on the agent's page. */
  starterPrompt?: string;
  /** Domains, capabilities, and visibility this agent can use. */
  tools?: AgentTools;
  /** Clickable prompts shown when this agent is active in chat. */
  starterQuestions?: string[];
}

// Seeded with the Monthly report agent so the page has content on first load,
// and so the scripted report-generation chat has an agent to run under.
export const MONTHLY_REPORT_AGENT_NAME = 'Monthly report agent';

export const initialCustomAgents: CustomAgent[] = [
  {
    id: 'default-agent',
    name: MONTHLY_REPORT_AGENT_NAME,
    description: "Turns last month's campaign data into a polished, executive-ready performance report.",
    instructions: '',
    files: [],
    updatedAt: 'now',
    avatarSrc: generateAgentAvatar(MONTHLY_REPORT_AGENT_NAME),
    starterPrompt: "Generate last month's marketing performance report.",
    tools: DEFAULT_AGENT_TOOLS,
    starterQuestions: DEFAULT_STARTER_QUESTIONS,
  },
];
