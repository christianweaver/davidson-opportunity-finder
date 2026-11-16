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
      <p className="match-pill">{matchLabel(card.score)}</p>
      <h3>{card.name}</h3>
      <p className="grant-reason">{card.reason}</p>
      <p className="grant-source">{sourceLabel(card.source)}</p>
      <div className="grant-actions">
        <button type="button" className="button button-primary button-small" onClick={onLearnMore}>
          Learn more
        </button>
        {card.sourceUrl && (
          <a className="link" href={card.sourceUrl} target="_blank" rel="noopener noreferrer">
            Official page
          </a>
        )}
      </div>
    </article>
  );
}