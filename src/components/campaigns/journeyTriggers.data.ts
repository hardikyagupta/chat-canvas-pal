import { Activity, List, MapPin, Tag, Users, type LucideIcon } from "lucide-react";

/**
 * The 5 trigger/activity categories a journey can start from (Figma
 * reference: the "Trigger" icon-grid picker). Descriptions are ours — the
 * reference only had icon + name — written plain and short, matching how
 * the existing "All triggers" list explains its own options.
 */
export interface JourneyTriggerOption {
  id: string;
  label: string;
  description: string;
  icon: LucideIcon;
  /** Action-oriented sentence shown on the canvas node once picked, e.g.
   *  "When someone joins a segment" — so the journey reads in plain
   *  language rather than showing the raw trigger-type name. */
  nodeLabel: string;
  /** Set only for the "Activity" trigger — the chosen ActivityDefinition
   *  id(s) (journeyActivities.data), so the rest of the journey can look up
   *  this trigger's real payload fields (see the Email node's "User
   *  activity payload" personalize menu). */
  activityIds?: string[];
}

export const JOURNEY_TRIGGER_OPTIONS: JourneyTriggerOption[] = [
  {
    id: "activity",
    label: "Activity",
    description: "A profile does something specific, like viewing or buying an item.",
    icon: Activity,
    // Never shown directly — picking "Activity" always routes into
    // ActivityTriggerConfig, which supplies its own, activity-specific
    // nodeLabel (e.g. "When someone views a product").
    nodeLabel: "When someone does something",
  },
  {
    id: "segment",
    label: "Segment",
    description: "A profile joins a segment for the first time.",
    icon: Users,
    nodeLabel: "When someone joins a segment",
  },
  {
    id: "list",
    label: "List",
    description: "A profile subscribes to a list for the first time.",
    icon: List,
    nodeLabel: "When someone subscribes to a list",
  },
  {
    id: "geofence",
    label: "Geofence",
    description: "A profile enters or leaves a place you've marked on the map.",
    icon: MapPin,
    nodeLabel: "When someone enters or leaves a place",
  },
  {
    id: "merchandising-event",
    label: "Merchandising event",
    description: "Something changes on a product a profile viewed, like its price or stock.",
    icon: Tag,
    nodeLabel: "When a product they viewed changes",
  },
];
