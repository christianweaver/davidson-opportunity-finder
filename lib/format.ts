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

export function matchLabel(score: number): string {
  if (score >= 80) return "Strong match";
  if (score >= 50) return "Good match";
  return "Could work";
}