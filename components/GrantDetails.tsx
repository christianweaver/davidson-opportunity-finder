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
    <>
      <h3>{title}</h3>
      <ol>
        {steps.map((step, index) => (
          <li key={index}>{step}</li>
        ))}
      </ol>
    </>
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
    <dialog ref={dialogRef} onClose={onClose}>
      {card && (
        <>
          <h2>{card.name}</h2>
          <p>{sourceLabel(card.source)}</p>

          <h3>Why it might fit</h3>
          <p>{card.reason}</p>

          <h3>About</h3>
          <p>{card.summary}</p>

          <dl>
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

          {card.sourceUrl && (
            <a href={card.sourceUrl} target="_blank" rel="noopener noreferrer">
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