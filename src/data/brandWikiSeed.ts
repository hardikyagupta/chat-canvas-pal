export type WikiFileStatus = 'validated' | 'derived' | 'llm-synthesised' | 'uploaded';

export interface BrandWikiSeedItem {
  id: string;
  category: string;
  name: string;
  fileName: string;
  status: WikiFileStatus;
  content: string;
  useWhen?: string;
}

export const BRAND_WIKI_CATEGORIES = [
  'audience',
  'brand',
  'campaigns',
  'intelligence',
  'journeys',
  'ontology',
  'playbooks',
] as const;

export const BRAND_WIKI_SEED: BrandWikiSeedItem[] = [
  {
    id: 'bw-audience-apps',
    category: 'audience',
    name: 'Apps and sites',
    fileName: 'apps-and-sites.md',
    status: 'validated',
    content:
      '# Apps & sites\n\nPrimary touchpoints include the iOS app, Android app, and mobile web storefront. Push and in-app messaging are enabled on native apps; web supports browser notifications for logged-in users.',
  },
  {
    id: 'bw-audience-attrs',
    category: 'audience',
    name: 'Attributes',
    fileName: 'attributes.md',
    status: 'validated',
    content:
      '# Audience attributes\n\nCore profile fields: lifecycle stage, preferred channel, last purchase date, loyalty tier, and city tier. Custom traits are synced nightly from the CDP.',
  },
  {
    id: 'bw-audience-lists',
    category: 'audience',
    name: 'Contact lists',
    fileName: 'contact-lists.md',
    status: 'validated',
    content:
      '# Contact lists\n\nStatic lists cover VIP members, churn-risk cohorts, and newsletter subscribers. Dynamic lists refresh on campaign send based on segment rules.',
  },
  {
    id: 'bw-audience-events',
    category: 'audience',
    name: 'Events',
    fileName: 'events.md',
    status: 'derived',
    content:
      '# Audience events\n\nTracked behaviours include product viewed, add to cart, checkout started, purchase completed, and support ticket opened. Event volume peaks on weekends.',
  },
  {
    id: 'bw-brand-overview',
    category: 'brand',
    name: 'Brand overview',
    fileName: 'overview.md',
    status: 'llm-synthesised',
    content:
      '# Brand overview\n\nNorthwind Home is a premium home-goods retailer focused on sustainable materials and timeless design. Voice is warm, confident, and never pushy — we educate before we sell.',
  },
  {
    id: 'bw-campaigns-perf',
    category: 'campaigns',
    name: 'Campaign performance',
    fileName: 'performance.md',
    status: 'derived',
    content:
      '# Campaign performance\n\nWhatsApp and email drive the highest incremental conversions. Push performs best for flash sales; paid social is used mainly for acquisition, not retention.',
  },
  {
    id: 'bw-campaigns-top',
    category: 'campaigns',
    name: 'Top campaigns',
    fileName: 'top-campaigns.md',
    status: 'derived',
    content:
      '# Top campaigns\n\nQ2 standouts: Summer refresh (WhatsApp, +18% CTR), Loyalty win-back (email, +9% repeat purchase), and New-arrival drops (push, +12% same-day orders).',
  },
  {
    id: 'bw-intel-index',
    category: 'intelligence',
    name: 'Intelligence index',
    fileName: 'index.md',
    status: 'llm-synthesised',
    content:
      '# Intelligence index\n\nAggregated insights from CRM, commerce, and support data. Updated weekly with trend summaries, anomaly flags, and recommended actions for lifecycle marketing.',
  },
  {
    id: 'bw-journeys-overview',
    category: 'journeys',
    name: 'Journeys overview',
    fileName: 'overview.md',
    status: 'derived',
    content:
      '# Journeys overview\n\nActive journeys: welcome series, browse abandonment, post-purchase nurture, and win-back. Entry triggers are event-based with 24h attribution windows.',
  },
  {
    id: 'bw-ontology-html',
    category: 'ontology',
    name: 'Ontology graph',
    fileName: 'graph.html',
    status: 'derived',
    content:
      '# Ontology graph (HTML)\n\nInteractive entity-relationship view linking customers, products, campaigns, and channels. Export generated from the knowledge graph service.',
  },
  {
    id: 'bw-ontology-json',
    category: 'ontology',
    name: 'Ontology data',
    fileName: 'graph.json',
    status: 'derived',
    content:
      '# Ontology graph (JSON)\n\nMachine-readable schema: nodes (Customer, Order, SKU, Campaign) and edges (purchased, targeted_by, belongs_to). Used by the decisioning engine for context retrieval.',
  },
  {
    id: 'bw-playbooks-start',
    category: 'playbooks',
    name: 'Getting started',
    fileName: 'getting-started.md',
    status: 'validated',
    content:
      '# Playbooks — getting started\n\nStandard operating procedures for campaign launch, A/B testing, and post-send analysis. Each playbook links to templates and approval checklists.',
  },
];
