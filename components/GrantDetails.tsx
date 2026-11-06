"use client";

import { useEffect, useRef } from "react";
import type { GrantMatch } from "@/lib/ai";
import { formatAmount, formatDeadlines, formatEligibility } from "@/lib/format";

type Props = {
  match: GrantMatch | null;
  onClose: () => void;
};

export default function GrantDetails({ match, onClose }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (match && !dialog.open) dialog.showModal();
    if (!match && dialog.open) dialog.close();
  }, [match]);

  return (
    <dialog ref={dialogRef} onClose={onClose}>
      {match && (
        <>
          <h2>{match.opportunity.name}</h2>
          {match.opportunity.office && <p>{match.opportunity.office}</p>}

          <h3>Why it might fit</h3>
          <p>{match.reason}</p>

          <h3>About</h3>
          <p>{match.opportunity.description}</p>

          <dl>
            <dt>Amount</dt>
            <dd>{formatAmount(match.opportunity)}</dd>
            <dt>Last listed deadline</dt>
            <dd>{formatDeadlines(match.opportunity)}</dd>
            <dt>Eligibility</dt>
            <dd>{formatEligibility(match.opportunity)}</dd>
            {match.opportunity.contact && (
              <>
                <dt>Contact</dt>
                <dd>{match.opportunity.contact}</dd>
              </>
            )}
          </dl>

          {match.opportunity.applicationSteps.length > 0 && (
            <>
              <h3>How to apply</h3>
              <ol>
                {match.opportunity.applicationSteps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
            </>
          )}

          {match.opportunity.notes && (
            <>
              <h3>Notes</h3>
              <p>{match.opportunity.notes}</p>
            </>
          )}

          {match.opportunity.sourceUrl && (
            <a href={match.opportunity.sourceUrl} target="_blank" rel="noopener noreferrer">
              View the official page
            </a>
          )}
          <button type="button" onClick={onClose}>
            Close
          </button>
        </>
      )}
    </dialog>
  );
}