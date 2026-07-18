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
}

export interface EventMappingData {
  /** standard event id -> detected brand event id (or "none") */
  mappings: Record<string, string>;
}

export interface GuardrailsData {
  requireConsent: boolean;
  frequencyCapPerWeek: number;
  quietHoursStart: string;
  quietHoursEnd: string;
  holdoutPercent: number;
}

interface DecisioningSetupState {
  version: 1;
  status: SetupStatus;
  brandWiki: BrandWikiData | null;
  eventMapping: EventMappingData | null;
  guardrails: GuardrailsData | null;
  processingStartedAt: number | null;
}

/** Real wall-clock length of the simulated processing run (demo-friendly). */
export const PROCESSING_DURATION_MS = 60 * 1000;
/** What the countdown *displays* — the product story is "about 4 hours". */
export const DISPLAY_DURATION_MS = 4 * 60 * 60 * 1000;

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
};

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
