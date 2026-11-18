import type { OpportunityCard } from "@/lib/finder";
import { matchLabel, matchLevel, sourceLabel, usesDatabaseOnly } from "@/lib/format";

type Props = {
  card: OpportunityCard;
  onLearnMore: () => void;
};

export default function GrantCard({ card, onLearnMore }: Props) {
  return (
    <article className="grant-card" data-source={usesDatabaseOnly(card) ? "database" : "website"}>
      <p className="match" data-level={matchLevel(card.score)}>
        <span className="match-meter" aria-hidden="true">
          <span />
          <span />
          <span />
        </span>
        {matchLabel(card.score)}
      </p>
      <h3>{card.name}</h3>
      <p className="grant-reason">{card.reason}</p>
      <p className="grant-source">{sourceLabel(card)}</p>
      <div className="grant-actions">
        <button type="button" className="button button-primary button-small" onClick={onLearnMore}>
          Learn more <span className="arrow" aria-hidden="true">&rarr;</span>
        </button>
        {card.sourceUrl && (
          <a className="link" href={card.sourceUrl} target="_blank" rel="noopener noreferrer">
            Official page <span aria-hidden="true">&#8599;</span>
          </a>
        )}
      </div>
    </article>
  );
}
