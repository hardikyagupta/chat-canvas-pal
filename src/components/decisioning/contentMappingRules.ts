import { EMAIL_TEMPLATES } from "./emailTemplates";

/**
 * Shared resolution rules between the Content step (ContentMapping.tsx, the
 * editor) and the Preview step (ObjectiveJourneyPreview.tsx, the read-only
 * recap), so "what template does this audience/cohort/channel slot resolve
 * to" never drifts between the two.
 */

export type SubCohort = { id: string; label: string; count: number };
export type Audience = { id: string; name: string; count: number; subCohorts: SubCohort[] };
export type Template = { id: string; name: string; type: string };

export const TEMPLATES: Record<string, Template> = Object.fromEntries(
  Object.values(EMAIL_TEMPLATES).map((t) => [t.id, { id: t.id, name: t.name, type: t.type }]),
);

// The engine's default main-audience template per channel.
export const CHANNEL_DEFAULT: Record<string, string> = {
  email: "912",
  sms: "742",
  push: "915",
  webpush: "603",
};

// Template suggestions offered in the gallery for each channel. Email rotates
// across all 8 templates by audience position (see EMAIL_ROTATION), so every
// template surfaces somewhere; the other channels keep a fixed pool.
export const CHANNEL_POOL: Record<string, string[]> = {
  sms: ["742", "915", "603", "868"],
  push: ["915", "603", "912", "774"],
  webpush: ["603", "912", "337", "664"],
};

// Email galleries show exactly 4 templates per audience/cohort, but the set of
// 4 rotates by the audience's position so all 8 real templates get used across
// the flow (keyed by index, not id, since audiences are supplied dynamically).
export const EMAIL_ROTATION: string[][] = [
  ["912", "868", "664", "337"],
  ["774", "742", "915", "603"],
  ["912", "664", "774", "915"],
  ["868", "337", "742", "603"],
];

/** Full key for a mapping slot: audience + channel + scope ("parent" | cohortId). */
export function slotKey(audienceId: string, channelId: string, scope: string) {
  return `${audienceId}::${channelId}::${scope}`;
}

/** Position of a scope within its audience: parent = 0, sub-cohorts follow. */
export function scopeIndex(audience: Audience, scope: string): number {
  if (scope === "parent") return 0;
  const i = audience.subCohorts.findIndex((c) => c.id === scope);
  return i < 0 ? 0 : i + 1;
}

/** The pool of template IDs offered/recommended for a channel + audience. */
export function poolFor(channelId: string, audiences: Audience[], activeAudienceId: string): string[] {
  if (channelId === "email") {
    const audIndex = Math.max(0, audiences.findIndex((a) => a.id === activeAudienceId));
    return EMAIL_ROTATION[audIndex % EMAIL_ROTATION.length];
  }
  return CHANNEL_POOL[channelId] ?? [];
}

/**
 * Resolve the template for an audience/channel/scope slot: an explicit
 * assignment wins (flagged as an override); otherwise fall back to a
 * pool-based recommendation, then the channel default.
 */
export function resolveAssignedOrRecommended(
  audiences: Audience[],
  assignments: Record<string, string>,
  audienceId: string,
  channelId: string,
  scope: string,
): { template: Template; isOverride: boolean } {
  const key = slotKey(audienceId, channelId, scope);
  const direct = assignments[key];
  if (direct && TEMPLATES[direct]) {
    return { template: TEMPLATES[direct], isOverride: true };
  }

  const audience = audiences.find((a) => a.id === audienceId);
  const pool = poolFor(channelId, audiences, audienceId);
  const idx = audience ? scopeIndex(audience, scope) : 0;
  const recommended = pool[idx % pool.length] ?? CHANNEL_DEFAULT[channelId];
  return { template: TEMPLATES[recommended], isOverride: false };
}
