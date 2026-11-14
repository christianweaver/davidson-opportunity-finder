"use client";

import { useEffect, useId, useRef } from "react";
import type { GrantMatch } from "@/lib/ai";
import { formatAmount, formatDeadlines, formatEligibility } from "@/lib/format";

type Props = {
  match: GrantMatch | null;
  onClose: () => void;
};

export default function GrantDetails({ match, onClose }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (match && !dialog.open) dialog.showModal();
    if (!match && dialog.open) dialog.close();
  }, [match]);

  return (
    <dialog
      ref={dialogRef}
      className="details"
      onClose={onClose}
      aria-labelledby={titleId}
    >
      {match && (
        <>
          <div className="details-top">
            <button type="button" className="text-button" onClick={onClose}>
              Close
            </button>
          </div>

          <div className="details-body">
            <h2 id={titleId}>{match.opportunity.name}</h2>
            {match.opportunity.office && <p className="details-office">{match.opportunity.office}</p>}

            <section className="details-section">
              <h3>Why it might fit</h3>
              <p>{match.reason}</p>
            </section>

            <section className="details-section">
              <h3>About</h3>
              <p>{match.opportunity.description}</p>
            </section>

            <dl className="facts">
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
              <section className="details-section">
                <h3>How to apply</h3>
                <ol className="steps">
                  {match.opportunity.applicationSteps.map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ol>
              </section>
            )}

            {match.opportunity.notes && (
              <section className="details-section">
                <h3>Notes</h3>
                <p>{match.opportunity.notes}</p>
              </section>
            )}

            <div className="details-footer">
              {match.opportunity.sourceUrl && (
                <a
                  className="link"
                  href={match.opportunity.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View the official page
                </a>
              )}
              <button type="button" className="button button-outline" onClick={onClose}>
                Close
              </button>
            </div>
          </div>
        </>
      )}
    </dialog>
  );
}
