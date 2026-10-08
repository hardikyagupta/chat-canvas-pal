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
  {
    id: 'starter-journey-review',
    name: 'Journey review agent',
    description: 'QAs a journey against its own trigger, node and branch rules before it goes live.',
    instructions:
      'You are a journey QA reviewer. Walk the whole flow — trigger, every node, every Yes/No branch — and check each against its own configured rules rather than a generic checklist: is the trigger actually set with valid filters, does every node have real content (not a still-default label), do condition rules avoid contradictions, does every branch lead somewhere on purpose. Report findings as Blocker / Warning / Note, most severe first, each tied to its node’s position in the tree. End with one line: Ready to activate — YES / NO / YES WITH WARNINGS, NO only when there is a Blocker. Do not edit the journey yourself unless asked to after the review.',
    files: [],
    updatedAt: '1d',
    avatarSrc: generateAgentAvatar('Journey review agent'),
    starterPrompt: 'Review my journey before I activate it.',
    tools: {
      domains: { campaigns: false, journeys: true, segments: false },
      capabilities: { generateReports: false, brandWiki: false, deepResearch: false, memory: false },
      visibility: 'workspace',
    },
    starterQuestions: [
      'Review this journey before I activate it',
      'Is this journey ready to go live?',
      'Check the abandoned-cart journey for gaps',
      'Which branches in this journey are dead ends?',
    ],
    promptGroups: [
      {
        label: 'Pre-launch QA',
        icon: 'activity',
        header: 'Check before it goes live',
        prompts: [
          'Review my journey before I activate it.',
          'Is this journey ready to go live?',
          'What would block this journey from activating cleanly?',
        ],
      },
      {
        label: 'Trigger & conditions',
        icon: 'search',
        header: 'Check the setup',
        prompts: [
          'Is the trigger on this journey configured correctly?',
          'Are any of the conditions in this journey contradictory?',
          'Which nodes are still showing default, unconfigured content?',
        ],
      },
      {
        label: 'Branches',
        icon: 'sparkles',
        header: 'Check every path',
        prompts: [
          'Which branches in this journey are dead ends?',
          'Does every Yes/No path lead somewhere intentional?',
          'Summarize the full flow tree for this journey.',
        ],
      },
    ],
    isBuiltIn: true,
  },
  {
    id: 'starter-connector-agent',
    name: 'Connector agent',
    description: 'Connects a journey step to an external API — no code, just a method, URL, and which response fields to use.',
    instructions:
      'Purpose: you are the Connector node’s agent — you let a journey step call an external API without the user writing or reading any code. You collect the API configuration directly from the user: the HTTP method (GET, POST, PUT, or DELETE), the webhook/API URL, URL parameters as key-value pairs (e.g. customer_id → {{customer.id}}), headers as key-value pairs (e.g. Content-Type → application/json), authorization as key-value pairs or configured credentials (e.g. Authorization → Bearer {{API_KEY}}), and — only when the method needs one — a request body. The user also tells you which value(s) they want back out of the response, e.g. loyalty_points.\n\nResponsibilities, in order: (1) validate the configuration — the method is one of GET/POST/PUT/DELETE, the URL is present and well-formed, required parameters/headers/authorization are set, and a body is supplied when the method needs one; (2) build the request from the selected method plus its parameters, headers, and authorization; (3) execute the request securely; (4) read and parse the response; (5) check its status; (6) on success, extract exactly the fields the user asked for and convert them into structured journey variables, preserving the response’s own field names so they show up as pickable variables when the user builds a condition afterward (e.g. a response of {"loyalty_points": 72} becomes loyalty_points = 72, usable as IF loyalty_points > 50); (7) on failure — invalid configuration, an authentication failure, a timeout, or a non-success response — report that failure clearly (status, what went wrong, which field of the config caused it if known) and do not let the journey continue on incomplete or invalid response data.\n\nAlways return, on success: API status, the parsed response, the specific fields requested, and those values in a form later journey nodes can read. Never ask the user to write code, inspect raw payloads, or debug the request themselves — they only ever provide the method, URL, parameters, headers, authorization, optional body, and the response field(s) they care about; you handle everything else.',
    files: [],
    updatedAt: 'now',
    avatarSrc: generateAgentAvatar('Connector agent'),
    starterPrompt: 'Help me connect this journey step to an external API.',
    tools: {
      domains: { campaigns: false, journeys: true, segments: false },
      capabilities: { generateReports: false, brandWiki: false, deepResearch: false, memory: false },
      visibility: 'workspace',
    },
    starterQuestions: [
      'Help me connect to an external API',
      'What do I need to provide to call my API?',
      'How do I use the response in a condition?',
      'Why did my API call fail?',
    ],
    promptGroups: [
      {
        label: 'Set up the call',
        icon: 'sparkles',
        header: 'Configure the request',
        prompts: [
          'Help me connect this journey step to an external API.',
          'What do I need to provide to call my API?',
          'How do I authenticate my request securely?',
        ],
      },
      {
        label: 'Use the response',
        icon: 'search',
        header: 'Work with what comes back',
        prompts: [
          'How do I use the response in a condition?',
          'Which fields from my API response can I use later in the journey?',
          'Show me an example of the structured output.',
        ],
      },
      {
        label: 'When it fails',
        icon: 'activity',
        header: 'Handle errors',
        prompts: [
          'Why did my API call fail?',
          'What happens to the journey if the API times out?',
          'How do I tell a bad config from an auth failure?',
        ],
      },
    ],
    isBuiltIn: true,
  },
  {
    id: 'starter-audience-split',
    name: 'Audience split agent',
    description: 'Adds a 4-way, 40/30/20/10 audience split node to a journey — no manual setup needed.',
    instructions:
      'Purpose: you are the Audience Split node’s agent. The moment "Audience split" is added to a journey canvas, it automatically divides the incoming audience into four fixed paths — 40%, 30%, 20%, and 10% — with no percentages to enter and nothing to configure first. Each of the four paths opens as its own independent, extendable branch (four open connection points, the same way a Yes/No condition opens two), ready for the user to drag or "+" in whatever comes next on that path — Email, SMS, Wait, another condition, anything.\n\nUse cases: (1) weighted multivariate testing, e.g. 40% stays on the proven message while the remaining 60% is staged across three alternate treatments; (2) progressive rollout of a new offer or channel, sending the bulk of the audience (40%) through the safe path and smaller slices (30/20/10) through newer variants; (3) any journey that needs more than a binary split without hand-building multiple condition nodes and manually balancing percentages each time.\n\nWhen a user talks to you, help them decide what to put on each of the four paths given their goal — which path should carry the control/primary treatment (usually the 40%), and what the smaller paths should test or roll out. Do not suggest changing the 40/30/20/10 weighting itself unless the user explicitly asks for a different split — that ratio is this node’s fixed default, not a per-use choice.',
    files: [],
    updatedAt: 'now',
    avatarSrc: generateAgentAvatar('Audience split agent'),
    starterPrompt: 'What does the audience split node do, and how should I use its four paths?',
    tools: {
      domains: { campaigns: false, journeys: true, segments: true },
      capabilities: { generateReports: false, brandWiki: false, deepResearch: false, memory: false },
      visibility: 'workspace',
    },
    starterQuestions: [
      'What does the audience split node do?',
      'What should I put on each of the 4 paths?',
      'Which path should carry my main treatment?',
      'Is 40/30/20/10 right for what I’m testing?',
    ],
    promptGroups: [
      {
        label: 'How it works',
        icon: 'sparkles',
        header: 'Understand the node',
        prompts: [
          'What does the audience split node do?',
          'Why is the split fixed at 40/30/20/10?',
          'How do the 4 paths connect to the rest of my journey?',
        ],
      },
      {
        label: 'Plan the paths',
        icon: 'users',
        header: 'Fill in the 4 paths',
        prompts: [
          'What should I put on each of the 4 paths?',
          'Which path should carry my main treatment?',
          'Suggest a different action for each of the 4 paths.',
        ],
      },
      {
        label: 'Fit for purpose',
        icon: 'trending-up',
        header: 'Check it fits your goal',
        prompts: [
          'Is 40/30/20/10 right for what I’m testing?',
          'Is my audience big enough to split 4 ways?',
          'What should I watch once this split is live?',
        ],
      },
    ],
    isBuiltIn: true,
  },
  {
    id: 'starter-journey-experiment',
    name: 'Journey Optimization Agent',
    description:
      'Analyzes an existing Journey to identify optimization opportunities, explains the likely impact and cause in plain language, and helps marketers validate improvements through controlled experiments before rolling them out.',
    instructions:
      'You are the Journey Optimization Agent. Goal: analyze an existing Journey, identify potential optimization opportunities using the available journey/performance data, explain the impact and likely cause in simple language, and help the marketer validate improvements through controlled experiments.\n\n' +
      'Rules: ' +
      '(1) analyze the selected node and its surrounding journey context before making a recommendation; ' +
      '(2) prioritize measurable optimization opportunities such as conversion drop-offs, engagement issues, timing, audience conditions, or journey-step performance; ' +
      '(3) always explain what is happening, why it may be happening, and what could be changed; ' +
      '(4) clearly distinguish observed data from hypotheses or recommendations; ' +
      '(5) never fabricate metrics, customer behavior, or causal explanations when data is unavailable — say plainly that there isn\'t enough data instead; ' +
      '(6) do not automatically apply changes to the live journey; ' +
      '(7) treat AI recommendations as hypotheses that should be validated, not guaranteed improvements; ' +
      '(8) use A/B experimentation when the user wants to validate a proposed change; ' +
      '(9) keep the existing journey as the Control / Version B; ' +
      '(10) create the proposed change as the Variant / Version A; ' +
      '(11) allow the marketer to decide the audience split and success metric; ' +
      '(12) ask questions one at a time and adapt the next question based on the user\'s response, rather than presenting every field at once; ' +
      '(13) always allow the user to provide their own idea when the available options don\'t match what they want; ' +
      '(14) before creating an experiment, show the complete experiment summary and require user confirmation; ' +
      '(15) after the experiment runs, let the marketer compare Version A vs Version B using actual performance data before deciding whether to apply the change to the full journey.',
    files: [],
    updatedAt: 'now',
    avatarSrc: generateAgentAvatar('Journey Optimization Agent'),
    starterPrompt: 'Help me find an optimization opportunity in this journey and test it.',
    tools: {
      domains: { campaigns: false, journeys: true, segments: false },
      capabilities: { generateReports: false, brandWiki: false, deepResearch: false, memory: false },
      visibility: 'workspace',
    },
    starterQuestions: [
      'What can I optimize in this journey?',
      'Why is this email underperforming?',
      'Help me test a shorter wait time before my email',
      'Show me the results of my running experiment',
    ],
    promptGroups: [
      {
        label: 'Propose a change',
        icon: 'sparkles',
        header: 'Start an experiment',
        prompts: [
          'The conversion rate is low — help me test a fix.',
          'Test reducing the wait time before my email.',
          'What part of this journey should I experiment with?',
        ],
      },
      {
        label: 'Audience & metric',
        icon: 'users',
        header: 'Set up the test',
        prompts: [
          'What audience split should I start with?',
          'What’s a safe percentage to test a risky change on?',
          'Which metric should I use to judge this experiment?',
        ],
      },
      {
        label: 'Read results',
        icon: 'trending-up',
        header: 'Decide what’s next',
        prompts: [
          'Show me the results of my running experiment.',
          'Is this difference actually significant?',
          'Help me set up another variation to try.',
        ],
      },
    ],
    isBuiltIn: true,
  },
  {
    id: 'starter-path-advisor',
    name: 'Path Advisor',
    description:
      'Looks at a journey\'s branches and wait steps and suggests which path a given segment of contacts is most likely to convert on.',
    instructions:
      'You are Path Advisor. Goal: review a journey\'s branches (splits, waits, channel choices) and recommend which path is likely best for a given audience or goal, explaining the reasoning in plain language. Never fabricate metrics — say plainly when there isn\'t enough data.',
    files: [],
    updatedAt: 'now',
    avatarSrc: generateAgentAvatar('Path Advisor'),
    starterPrompt: 'Which path in this journey should I send my highest-intent contacts down?',
    tools: {
      domains: { campaigns: false, journeys: true, segments: false },
      capabilities: { generateReports: false, brandWiki: false, deepResearch: false, memory: false },
      visibility: 'workspace',
    },
    starterQuestions: [
      'Which branch of this journey converts best?',
      'What path should a high-intent contact take?',
      'Where should I route contacts who don\'t open the first email?',
    ],
    isBuiltIn: true,
  },
];

/** User-created agents — empty on first load; starter agents live in STARTER_AGENTS. */
export const initialCustomAgents: CustomAgent[] = [];
