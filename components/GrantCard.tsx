import type { CSSProperties } from "react";
import type { GrantMatch } from "@/lib/ai";
import { matchLabel } from "@/lib/format";

type Props = {
  match: GrantMatch;
  onLearnMore: () => void;
};

export default function GrantCard({ match, onLearnMore }: Props) {
  const { opportunity, reason, score } = match;
  const shade = { "--match-strength": score / 100 } as CSSProperties;

  return (
    <article className="grant-card" style={shade}>
      <p>{matchLabel(score)}</p>
      <h3>{opportunity.name}</h3>
      <p>{reason}</p>
      <div>
        <button type="button" onClick={onLearnMore}>
          Learn more
        </button>
        {opportunity.sourceUrl && (
          <a href={opportunity.sourceUrl} target="_blank" rel="noopener noreferrer">
            Official page
          </a>
        )}
      </div>
    </article>
  );
}