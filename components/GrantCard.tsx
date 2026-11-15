import type { CSSProperties } from "react";
import type { OpportunityCard } from "@/lib/finder";
import { matchLabel, sourceLabel } from "@/lib/format";

type Props = {
  card: OpportunityCard;
  onLearnMore: () => void;
};

export default function GrantCard({ card, onLearnMore }: Props) {
  const shade = { "--match-strength": card.score / 100 } as CSSProperties;

  return (
    <article className="grant-card" data-source={card.source} style={shade}>
      <p>{matchLabel(card.score)}</p>
      <h3>{card.name}</h3>
      <p>{card.reason}</p>
      <p>{sourceLabel(card.source)}</p>
      <div>
        <button type="button" onClick={onLearnMore}>
          Learn more
        </button>
        {card.sourceUrl && (
          <a href={card.sourceUrl} target="_blank" rel="noopener noreferrer">
            Official page
          </a>
        )}
      </div>
    </article>
  );
}