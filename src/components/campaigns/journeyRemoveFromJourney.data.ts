/**
 * "Remove from Journey" action node — takes the contact out of a *different*
 * journey the moment this step runs (e.g. pull them out of a win-back
 * journey once they've converted here). Its one setting is which journey to
 * remove them from, picked from this account's real journey list
 * (journeys.data) rather than free text.
 */

export interface RemoveFromJourneySetting {
  journeyName: string;
}

export const DEFAULT_REMOVE_FROM_JOURNEY_SETTING: RemoveFromJourneySetting = { journeyName: "" };

export function isRemoveFromJourneyValid(s: RemoveFromJourneySetting): boolean {
  return s.journeyName.trim() !== "";
}

/** The sentence shown on the canvas node once saved, e.g.
 *  'Remove them from "Win_Back_Inactive_Users"'. */
export function describeRemoveFromJourney(s: RemoveFromJourneySetting): string {
  return s.journeyName ? `Remove them from "${s.journeyName}"` : "Remove them from the journey";
}
