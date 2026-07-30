export type InsightCardContext = {
  sectionLabel: string;
  badges: string[];
  title: string;
  sub: string;
  badgeTone?: "blue" | "red";
};

export function formatInsightContent(card: InsightCardContext) {
  return `${card.sectionLabel}\n${card.badges.join(" · ")}\n\n${card.title}\n\n${card.sub}`;
}
