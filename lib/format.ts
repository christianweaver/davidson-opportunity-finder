import type { OpportunityCard } from "./finder";
import type { ClassYear, Opportunity } from "./types";

const YEAR_LABELS: Record<ClassYear, string> = {
  "first-year": "First-years",
  sophomore: "Sophomores",
  junior: "Juniors",
  senior: "Seniors",
};

export function formatAmount(opportunity: Opportunity): string {
  const { text } = opportunity.awardAmount;
  return text === "No information" ? "Not listed" : text;
}

export function formatDeadlines(opportunity: Opportunity): string {
  const deadlines = opportunity.deadlines.map((d) =>
    d.label ? `${d.label}: ${d.text}` : d.text,
  );
  return deadlines.join("; ") || "Not listed";
}

export function formatEligibility(opportunity: Opportunity): string {
  const { classYears, notes } = opportunity.eligibility;
  const parts: string[] = [];

  if (classYears) {
    parts.push(`Open to ${classYears.map((year) => YEAR_LABELS[year]).join(", ")}.`);
  }
  if (notes) parts.push(notes);

  return parts.join(" ") || "Not listed. Check the official page.";
}

// 1–3, shown as how many steps of the match meter are filled in.
export function matchLevel(score: number): 1 | 2 | 3 {
  if (score >= 80) return 3;
  if (score >= 50) return 2;
  return 1;
}

export function matchLabel(score: number): string {
  return ["Could work", "Good match", "Strong match"][matchLevel(score) - 1];
}

export const DATABASE_NOTE = "From our saved database (last updated Feb 2025)";

// Database matches that link to an official page get their details scraped from
// that page, so only cards with no page actually rely on the saved database.
export function usesDatabaseOnly(card: OpportunityCard): boolean {
  return card.source === "database" && !card.sourceUrl;
}

export function sourceLabel(card: OpportunityCard): string {
  return usesDatabaseOnly(card) ? DATABASE_NOTE : "From Davidson's website";
}