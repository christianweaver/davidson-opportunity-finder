import type { OpportunityDetails } from "./details";
import type { OpportunityCard } from "./finder";
import type { Profile } from "./profile";

export type LoadedDetails = {
  details: OpportunityDetails;
  from: "website" | "database";
};

const requests = new Map<string, Promise<OpportunityDetails>>();

function fetchLiveDetails(
  card: OpportunityCard,
  sourceUrl: string,
  profile: Profile | null,
): Promise<OpportunityDetails> {
  const key = `${sourceUrl}|${card.name}`;
  let request = requests.get(key);

  if (!request) {
    request = fetch("/api/details", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: card.name, sourceUrl, profile }),
    }).then(async (response) => {
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Couldn't load the details.");
      return data as OpportunityDetails;
    });

    request.catch(() => requests.delete(key));
    requests.set(key, request);
  }

  return request;
}

export async function loadDetails(
  card: OpportunityCard,
  profile: Profile | null,
): Promise<LoadedDetails> {
  if (card.sourceUrl) {
    try {
      const details = await fetchLiveDetails(card, card.sourceUrl, profile);
      return { details, from: "website" };
    } catch (error) {
      if (!card.details) throw error;
    }
  }

  if (card.details) return { details: card.details, from: "database" };
  throw new Error("No details are available for this opportunity.");
}