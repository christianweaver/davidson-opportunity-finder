"use client";

import { useState } from "react";
import type { FinderReply, OpportunityCard } from "@/lib/finder";
import GrantCard from "./GrantCard";
import GrantDetails from "./GrantDetails";

const INITIAL_COUNT = 3;

export default function GrantResults({ reply }: { reply: FinderReply }) {
  const [showAll, setShowAll] = useState(false);
  const [selected, setSelected] = useState<OpportunityCard | null>(null);

  const { cards, loginNotices, handshakeSearches, notices } = reply;
  const visible = showAll ? cards : cards.slice(0, INITIAL_COUNT);
  const hiddenCount = cards.length - visible.length;

  return (
    <section className="results">
      {notices.length > 0 && (
        <div className="notices">
          {notices.map((notice) => (
            <p key={notice} className="notice" role="status">
              {notice}
            </p>
          ))}
        </div>
      )}

      {visible.length > 0 && (
        <div className="card-grid">
          {visible.map((card, index) => (
            <GrantCard
              key={`${card.name}-${index}`}
              card={card}
              onLearnMore={() => setSelected(card)}
            />
          ))}
        </div>
      )}

      {(hiddenCount > 0 || (showAll && cards.length > INITIAL_COUNT)) && (
        <div className="results-more">
          {hiddenCount > 0 && (
            <button type="button" className="button button-secondary" onClick={() => setShowAll(true)}>
              Show {hiddenCount} more
            </button>
          )}
          {showAll && cards.length > INITIAL_COUNT && (
            <button type="button" className="button button-quiet" onClick={() => setShowAll(false)}>
              Show fewer
            </button>
          )}
        </div>
      )}

      {loginNotices.length > 0 && (
        <div className="callout">
          <p className="callout-label">Login required</p>
          <h3>Needs your Davidson login</h3>
          <ul className="callout-list">
            {loginNotices.map((notice) => (
              <li key={notice.url}>
                <a className="link" href={notice.url} target="_blank" rel="noopener noreferrer">
                  {notice.name}
                </a>
                : {notice.note}
              </li>
            ))}
          </ul>
        </div>
      )}

      {handshakeSearches.length > 0 && (
        <div className="callout">
          <h3>Try searching Handshake</h3>
          <p>Sign in with your Davidson login, then search for:</p>
          <ul className="term-chips">
            {handshakeSearches.map((term) => (
              <li key={term}>{term}</li>
            ))}
          </ul>
          <a
            className="button button-secondary button-small"
            href="https://davidson.joinhandshake.com/login"
            target="_blank"
            rel="noopener noreferrer"
          >
            Open Handshake
          </a>
        </div>
      )}

      <GrantDetails card={selected} onClose={() => setSelected(null)} />
    </section>
  );
}