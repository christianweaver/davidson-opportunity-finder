import type { FinderReply, OpportunityCard } from "./finder";
import { usesDatabaseOnly } from "./format";

const MAX_SUMMARY_CHARS = 300;

function describeDatabaseCard(card: OpportunityCard): string {
  const details = card.details;
  return [
    `- ${card.name} (from the saved database, last updated February 2025)`,
    `  About: ${(details?.summary ?? "").slice(0, MAX_SUMMARY_CHARS)}`,
    `  Amount: ${details?.amount ?? "Not listed"}`,
    `  Deadlines: ${details?.deadlines ?? "Not listed"}`,
    `  Eligibility: ${details?.eligibility ?? "Not listed"}`,
    `  Link: ${card.sourceUrl ?? "Not listed"}`,
  ].join("\n");
}

export function toHistoryText(reply: FinderReply): string {
  const website = reply.cards.filter((card) => !usesDatabaseOnly(card));
  const database = reply.cards.filter(usesDatabaseOnly);
  const parts = [reply.message];

  if (website.length > 0) {
    const list = website.map((card) => `- ${card.name}: ${card.sourceUrl}`).join("\n");
    parts.push(`Opportunities shown from Davidson's website:\n${list}`);
  }
  if (database.length > 0) {
    const list = database.map(describeDatabaseCard).join("\n");
    parts.push(`Opportunities the app added from its saved database:\n${list}`);
  }

  return parts.join("\n\n");
}