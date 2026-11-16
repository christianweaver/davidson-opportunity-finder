"use client";

import { useEffect, useRef, useState } from "react";
import type { OpportunityCard } from "@/lib/finder";
import { sourceLabel } from "@/lib/format";
import type { Profile } from "@/lib/profile";
import { loadDetails, type LoadedDetails } from "@/lib/details-client";

type Props = {
  card: OpportunityCard | null;
  profile: Profile | null;
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

export default function GrantDetails({ card, profile, onClose }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [fetched, setFetched] = useState<{
    card: OpportunityCard;
    result: LoadedDetails | null;
    failed: boolean;
  } | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (card && !dialog.open) dialog.showModal();
    if (!card && dialog.open) dialog.close();
  }, [card]);

  useEffect(() => {
    if (!card) return;

    let cancelled = false;

    loadDetails(card, profile)
      .then((data) => {
        if (!cancelled) setFetched({ card, result: data, failed: false });
      })
      .catch(() => {
        if (!cancelled) setFetched({ card, result: null, failed: true });
      });

    return () => {
      cancelled = true;
    };
  }, [card, profile]);

  const current = fetched?.card === card ? fetched : null;
  const details = current?.result?.details ?? card?.details ?? null;
  const from = current?.result?.from ?? (card?.details ? "database" : "website");
  const status: "ready" | "loading" | "error" = details
    ? "ready"
    : current?.failed
      ? "error"
      : "loading";

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

            {status === "loading" && (
              <p className="details-status" role="status">
                Loading details...
              </p>
            )}
            {status === "error" && (
              <p className="details-status" role="alert">
                Couldn&apos;t load the details. You can still check the official page below.
              </p>
            )}

            {details && (
              <>
              <p className="details-source">
                {from === "website" ? "Details from Davidson's website" : sourceLabel("database")}
              </p>

              <section className="details-section">
                <h3>About</h3>
                <p>{details.summary}</p>
              </section>

              <dl className="facts">
                <dt>Amount</dt>
                <dd>{details.amount ?? "Not listed"}</dd>
                <dt>Deadlines</dt>
                <dd>{details.deadlines ?? "Not listed"}</dd>
                <dt>Eligibility</dt>
                <dd>{details.eligibility ?? "Not listed"}</dd>
                {details.contact && (
                  <>
                    <dt>Contact</dt>
                    <dd>{details.contact}</dd>
                  </>
                )}
              </dl>

              <StepList title="Next steps" steps={details.nextSteps} />
              <StepList title="How to apply" steps={details.howToApply} />
              </>
            )}

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