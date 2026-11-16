import { askOpportunityFinder, type ChatTurn, type GrantMatch } from "./ai";
import { formatAmount, formatDeadlines, formatEligibility } from "./format";
import { researchOpportunities, type LoginNotice } from "./research";
import type { Profile } from "./profile";

export type OpportunityCard = {
  name: string;
  source: "website" | "database";
  sourceUrl: string | null;
  summary: string;
  reason: string;
  score: number;
  amount: string | null;
  deadlines: string | null;
  eligibility: string | null;
  howToApply: string[];
  nextSteps: string[];
  contact: string | null;
};

export type FinderReply = {
  message: string;
  cards: OpportunityCard[];
  loginNotices: LoginNotice[];
  handshakeSearches: string[];
  notices: string[];
};

const NAME_STOP_WORDS = new Set([
  "the", "and", "of", "for", "in", "a", "grant", "grants", "fund", "funds",
  "fellowship", "fellowships", "program", "programs", "scholarship", "scholarships",
  "internship", "internships", "summer", "research", "davidson", "college",
  "endowment", "award",
]);

function nameWords(name: string): Set<string> {
  return new Set(
    name
      .toLowerCase()
      .replace(/['’]/g, "")
      .split(/[^a-z0-9]+/)
      .filter((word) => word.length > 1 && !NAME_STOP_WORDS.has(word)),
  );
}

function sameOpportunity(nameA: string, nameB: string): boolean {
  const a = nameWords(nameA);
  const b = nameWords(nameB);
  const [smaller, larger] = a.size <= b.size ? [a, b] : [b, a];
  if (smaller.size === 0) return false;
  return [...smaller].every((word) => larger.has(word));
}

function fromDatabase(match: GrantMatch): OpportunityCard {
  const { opportunity } = match;
  return {
    name: opportunity.name,
    source: "database",
    sourceUrl: opportunity.sourceUrl,
    summary: opportunity.description,
    reason: match.reason,
    score: match.score,
    amount: formatAmount(opportunity),
    deadlines: `Last listed: ${formatDeadlines(opportunity)}`,
    eligibility: formatEligibility(opportunity),
    howToApply: opportunity.applicationSteps,
    nextSteps: [],
    contact: opportunity.contact,
  };
}

export async function findOpportunities(
    history: ChatTurn[],
    profile: Profile | null = null,
  ): Promise<FinderReply> {
    const [research, database] = await Promise.allSettled([
      researchOpportunities(history, profile),
      askOpportunityFinder(history, profile),
    ]);

  if (research.status === "rejected" && database.status === "rejected") {
    console.error("Research failed:", research.reason);
    console.error("Database check failed:", database.reason);
    throw new Error("Both searches failed.");
  }

  const reply: FinderReply = {
    message: "",
    cards: [],
    loginNotices: [],
    handshakeSearches: [],
    notices: [],
  };

  if (research.status === "fulfilled") {
    const { message, opportunities, loginNotices, handshakeSearches, pagesRead, usage } =
      research.value;
    reply.message = message;
    reply.loginNotices = loginNotices;
    reply.handshakeSearches = handshakeSearches;
    reply.cards.push(...opportunities.map((item) => ({ ...item, source: "website" as const })));

    console.log(
      `Research: ${pagesRead.length} pages, ${usage.inputTokens} tokens in, ${usage.outputTokens} out, about $${usage.estimatedCost.toFixed(4)}`,
    );
  } else {
    console.error("Research failed:", research.reason);
    reply.notices.push(
      "I couldn't search Davidson's website just now, so these results come only from our saved database.",
    );
  }

  if (database.status === "fulfilled") {
    const earlierReplies = history
      .filter((turn) => turn.role === "Assistant")
      .map((turn) => turn.text)
      .join("\n");

    for (const match of database.value.matches) {
      const alreadyShown =
        earlierReplies.includes(match.opportunity.name) ||
        reply.cards.some((card) => sameOpportunity(card.name, match.opportunity.name));
      if (!alreadyShown) reply.cards.push(fromDatabase(match));
    }
    if (!reply.message) reply.message = database.value.message;
    } else {
        console.error("Database check failed:", database.reason);
    }

  const databaseCount = reply.cards.filter((card) => card.source === "database").length;
  if (databaseCount > 0 && research.status === "fulfilled") {
    const options = databaseCount === 1 ? "option" : "options";
    reply.notices.push(
      `I also found ${databaseCount} more ${options} in our saved database, which was last updated in February 2025.`,
    );
  }

  reply.cards.sort((a, b) => b.score - a.score);
  return reply;
}