import React, { createContext, useContext, useState } from "react";

/**
 * Decisioning engine setup state — the three onboarding configs (brand wiki,
 * event mapping, guardrails), the overall status, and the processing clock.
 * Held in memory only: a refresh resets the whole flow back to the empty
 * state, which keeps the prototype easy to re-demo from scratch.
 */

export type SetupStatus = "not_started" | "configuring" | "processing" | "ready";

export interface BrandWikiData {
  files: { name: string; size: number }[];
  brandName: string;
  brandVoice: string;
  audience: string;
  /** Website the brand details were imported/fetched from, if any. */
  website?: string;
  /** Answers to the detailed brand questionnaire, keyed by question id. */
  answers: Record<string, string>;
}

/** A blank brand wiki — the starting point for every surface that edits one. */
export const EMPTY_BRAND_WIKI: BrandWikiData = {
  files: [],
  brandName: "",
  brandVoice: "",
  audience: "",
  website: "",
  answers: {},
};

/** A user-defined event row: a name they typed, mapped to a detected brand event. */
export interface CustomEventMapping {
  id: string;
  label: string;
  /** detected brand event id, or "none" */
  mappedTo: string;
}

export interface EventMappingData {
  /** standard event id -> detected brand event id (or "none") */
  mappings: Record<string, string>;
  /** user-added custom events */
  customEvents?: CustomEventMapping[];
}

export interface GuardrailsData {
  requireConsent: boolean;
  frequencyCapPerWeek: number;
  quietHoursStart: string;
  quietHoursEnd: string;
  holdoutPercent: number;
}

export type ObjectiveStatus = "live" | "paused" | "draft";

/** A launched decisioning objective, shown as a card in the ready state. */
export interface LaunchedObjective {
  id: string;
  title: string;
  description: string;
  status: ObjectiveStatus;
  /** Goal / intent the engine is optimising toward. */
  goal: string;
  channels: string;
  revenue: string;
}

interface DecisioningSetupState {
  version: 1;
  status: SetupStatus;
  brandWiki: BrandWikiData | null;
  eventMapping: EventMappingData | null;
  guardrails: GuardrailsData | null;
  processingStartedAt: number | null;
  objectives: LaunchedObjective[];
}

/** Real wall-clock length of the simulated processing run (demo-friendly). */
export const PROCESSING_DURATION_MS = 10 * 1000;

export const STANDARD_EVENTS = [
  { id: "page_view", label: "Page view" },
  { id: "product_view", label: "Product view" },
  { id: "add_to_cart", label: "Add to cart" },
  { id: "checkout_started", label: "Checkout started" },
  { id: "purchase", label: "Purchase" },
  { id: "search", label: "Search" },
] as const;

/** Events "detected" from the brand's stream — demo data. */
export const DETECTED_EVENTS = [
  { id: "screen_open", label: "screen_open" },
  { id: "item_viewed", label: "item_viewed" },
  { id: "add_to_bag", label: "add_to_bag" },
  { id: "begin_checkout", label: "begin_checkout" },
  { id: "order_success", label: "order_success" },
  { id: "search_query", label: "search_query" },
] as const;

export const DEFAULT_EVENT_MAPPINGS: Record<string, string> = {
  page_view: "screen_open",
  product_view: "item_viewed",
  add_to_cart: "add_to_bag",
  checkout_started: "begin_checkout",
  purchase: "order_success",
  search: "search_query",
};

export const DEFAULT_GUARDRAILS: GuardrailsData = {
  requireConsent: true,
  frequencyCapPerWeek: 3,
  quietHoursStart: "22:00",
  quietHoursEnd: "07:00",
  holdoutPercent: 5,
};

interface DecisioningSetupContextValue extends DecisioningSetupState {
  saveBrandWiki: (data: BrandWikiData) => void;
  saveEventMapping: (data: EventMappingData) => void;
  saveGuardrails: (data: GuardrailsData) => void;
  startProcessing: () => void;
  markReady: () => void;
  /** Dev/demo escape hatch — jump the processing clock to done. */
  simulateCompletion: () => void;
  resetSetup: () => void;
  /** Launch a new objective; returns the created objective's id. */
  launchObjective: (data?: Partial<Omit<LaunchedObjective, "id">>) => string;
  /** Save a work-in-progress objective as a draft; returns its id. */
  saveDraftObjective: (data?: Partial<Omit<LaunchedObjective, "id" | "status">>) => string;
  duplicateObjective: (id: string) => void;
  pauseObjective: (id: string) => void;
  resumeObjective: (id: string) => void;
  archiveObjective: (id: string) => void;
  deleteObjective: (id: string) => void;
  /** All three configs saved — Review & confirm becomes available. */
  allConfigured: boolean;
  configuredCount: number;
}

const DEFAULT_STATE: DecisioningSetupState = {
  version: 1,
  status: "not_started",
  brandWiki: null,
  eventMapping: null,
  guardrails: null,
  processingStartedAt: null,
  objectives: [],
};

/** Demo defaults for a freshly launched objective (mirrors the Figma card). */
const DEFAULT_OBJECTIVE: Omit<LaunchedObjective, "id"> = {
  title: "Repeat purchase objective is running",
  description:
    "Monitoring one-time buyers and triggering re-engagement across selected channels.",
  status: "live",
  goal: "Repeat purchase",
  channels: "Email, App push, SMS, Web Push",
  revenue: "$3130",
};

let objectiveSeq = 0;
const nextObjectiveId = () => `obj-${++objectiveSeq}-${Date.now()}`;

const DecisioningSetupContext = createContext<DecisioningSetupContextValue | null>(null);

export const DecisioningSetupProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [state, setState] = useState<DecisioningSetupState>(DEFAULT_STATE);

  const configuredCount = [state.brandWiki, state.eventMapping, state.guardrails].filter(
    Boolean
  ).length;

  const value: DecisioningSetupContextValue = {
    ...state,
    saveBrandWiki: (data) =>
      setState((s) => ({
        ...s,
        brandWiki: data,
        status: s.status === "not_started" ? "configuring" : s.status,
      })),
    saveEventMapping: (data) =>
      setState((s) => ({
        ...s,
        eventMapping: data,
        status: s.status === "not_started" ? "configuring" : s.status,
      })),
    saveGuardrails: (data) =>
      setState((s) => ({
        ...s,
        guardrails: data,
        status: s.status === "not_started" ? "configuring" : s.status,
      })),
    startProcessing: () =>
      setState((s) => ({ ...s, status: "processing", processingStartedAt: Date.now() })),
    markReady: () => setState((s) => ({ ...s, status: "ready" })),
    simulateCompletion: () =>
      setState((s) => ({
        ...s,
        processingStartedAt: Date.now() - PROCESSING_DURATION_MS,
      })),
    resetSetup: () => setState(DEFAULT_STATE),
    launchObjective: (data) => {
      const id = nextObjectiveId();
      setState((s) => ({
        ...s,
        status: "ready",
        objectives: [{ ...DEFAULT_OBJECTIVE, ...data, id }, ...s.objectives],
      }));
      return id;
    },
    saveDraftObjective: (data) => {
      const id = nextObjectiveId();
      setState((s) => ({
        ...s,
        status: "ready",
        objectives: [
          {
            ...DEFAULT_OBJECTIVE,
            title: "Untitled objective",
            description: "Draft — finish setup to launch this objective.",
            // Drafts start with no computed values; the card shows hyphens
            // for anything the user hasn't filled in yet.
            goal: "",
            channels: "",
            revenue: "",
            ...data,
            status: "draft",
            id,
          },
          ...s.objectives,
        ],
      }));
      return id;
    },
    duplicateObjective: (id) =>
      setState((s) => {
        const source = s.objectives.find((o) => o.id === id);
        if (!source) return s;
        const index = s.objectives.findIndex((o) => o.id === id);
        const copy: LaunchedObjective = {
          ...source,
          id: nextObjectiveId(),
          title: `${source.title} (copy)`,
        };
        const objectives = [...s.objectives];
        objectives.splice(index + 1, 0, copy);
        return { ...s, objectives };
      }),
    pauseObjective: (id) =>
      setState((s) => ({
        ...s,
        objectives: s.objectives.map((o) =>
          o.id === id ? { ...o, status: "paused" } : o
        ),
      })),
    resumeObjective: (id) =>
      setState((s) => ({
        ...s,
        objectives: s.objectives.map((o) =>
          o.id === id ? { ...o, status: "live" } : o
        ),
      })),
    archiveObjective: (id) =>
      setState((s) => ({
        ...s,
        objectives: s.objectives.filter((o) => o.id !== id),
      })),
    deleteObjective: (id) =>
      setState((s) => ({
        ...s,
        objectives: s.objectives.filter((o) => o.id !== id),
      })),
    allConfigured: configuredCount === 3,
    configuredCount,
  };

  return (
    <DecisioningSetupContext.Provider value={value}>
      {children}
    </DecisioningSetupContext.Provider>
  );
};

export function useDecisioningSetup(): DecisioningSetupContextValue {
  const ctx = useContext(DecisioningSetupContext);
  if (!ctx) throw new Error("useDecisioningSetup must be used within DecisioningSetupProvider");
  return ctx;
}

/**
 * Same context, but null instead of a throw when the provider is absent. For
 * components that are reusable outside the decisioning tree — the settings
 * brand wiki, say — and should degrade rather than crash.
 */
export function useDecisioningSetupOptional(): DecisioningSetupContextValue | null {
  return useContext(DecisioningSetupContext);
}
