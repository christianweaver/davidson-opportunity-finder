"use client";

import { useEffect, useRef } from "react";
import type { OpportunityCard } from "@/lib/finder";
import { sourceLabel } from "@/lib/format";

type Props = {
  card: OpportunityCard | null;
  onClose: () => void;
};

function StepList({ title, steps }: { title: string; steps: string[] }) {
  if (steps.length === 0) return null;

  return (
    <section className="details-section">
      <h3>{title}</h3>
      <ol className="steps">
        {steps.map((step, index) => (
          <li key={index}>{step}</li>
        ))}
      </ol>
    </section>
  );
}

export default function GrantDetails({ card, onClose }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (card && !dialog.open) dialog.showModal();
    if (!card && dialog.open) dialog.close();
  }, [card]);

  return (
    <dialog ref={dialogRef} className="details" onClose={onClose} aria-labelledby="details-title">
      {card && (
        <>
          <div className="details-top">
            <button type="button" className="details-close" onClick={onClose} aria-label="Close">
              <span aria-hidden="true">&times;</span>
            </button>
          </div>

          <div className="details-body">
            <h2 id="details-title">{card.name}</h2>
            <p className="details-source">{sourceLabel(card.source)}</p>

            <section className="details-section">
              <h3>Why it might fit</h3>
              <p>{card.reason}</p>
            </section>

            <section className="details-section">
              <h3>About</h3>
              <p>{card.summary}</p>
            </section>

            <dl className="facts">
              <dt>Amount</dt>
              <dd>{card.amount ?? "Not listed"}</dd>
              <dt>Deadlines</dt>
              <dd>{card.deadlines ?? "Not listed"}</dd>
              <dt>Eligibility</dt>
              <dd>{card.eligibility ?? "Not listed"}</dd>
              {card.contact && (
                <>
                  <dt>Contact</dt>
                  <dd>{card.contact}</dd>
                </>
              )}
            </dl>

            <StepList title="Next steps" steps={card.nextSteps} />
            <StepList title="How to apply" steps={card.howToApply} />

            <div className="details-footer">
              {card.sourceUrl && (
                <a
                  className="button button-secondary"
                  href={card.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View the official page
                </a>
              )}
              <button type="button" className="button button-primary" onClick={onClose}>
                Close
              </button>
            </div>
          </div>
        </>
      )}
    </dialog>
  );
}