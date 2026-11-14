import type { CSSProperties } from "react";
import type { GrantMatch } from "@/lib/ai";
import { matchLabel } from "@/lib/format";

type Props = {
  match: GrantMatch;
  onLearnMore: () => void;
};

export default function GrantCard({ match, onLearnMore }: Props) {
  const { opportunity, reason, score } = match;
  const shade = {
    "--match-strength": Math.min(1, Math.max(0.2, score / 100)),
  } as CSSProperties;

  return (
    <article className="grant-card" style={shade}>
      <p className="match-pill">{matchLabel(score)}</p>
      <h3>{opportunity.name}</h3>
      <p className="grant-reason">{reason}</p>
      <div className="grant-actions">
        <button type="button" className="button button-outline" onClick={onLearnMore}>
          Learn more
        </button>
        {opportunity.sourceUrl && (
          <a
            className="link"
            href={opportunity.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            Official page
          </a>
        )}
      </div>
    </article>
  );
}
