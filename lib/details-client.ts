import type { OpportunityDetails } from "./details";
import type { OpportunityCard } from "./finder";
import type { Profile } from "./profile";

const requests = new Map<string, Promise<OpportunityDetails>>();

export function loadDetails(
  card: OpportunityCard,
  profile: Profile | null,
): Promise<OpportunityDetails> {
  if (card.details) return Promise.resolve(card.details);

  const key = `${card.sourceUrl}|${card.name}`;
  let request = requests.get(key);

  if (!request) {
    request = fetch("/api/details", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: card.name, sourceUrl: card.sourceUrl, profile }),
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