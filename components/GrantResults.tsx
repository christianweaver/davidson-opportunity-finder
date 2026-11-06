"use client";

import { useState } from "react";
import type { GrantMatch } from "@/lib/ai";
import GrantCard from "./GrantCard";
import GrantDetails from "./GrantDetails";

const INITIAL_COUNT = 3;

export default function GrantResults({ matches }: { matches: GrantMatch[] }) {
  const [showAll, setShowAll] = useState(false);
  const [selected, setSelected] = useState<GrantMatch | null>(null);

  if (matches.length === 0) return null;

  const visible = showAll ? matches : matches.slice(0, INITIAL_COUNT);
  const hiddenCount = matches.length - visible.length;

  return (
    <section>
      {visible.map((match, index) => (
        <GrantCard
          key={`${match.opportunity.id}-${index}`}
          match={match}
          onLearnMore={() => setSelected(match)}
        />
      ))}

      {hiddenCount > 0 && (
        <button type="button" onClick={() => setShowAll(true)}>
          Show {hiddenCount} more
        </button>
      )}
      {showAll && matches.length > INITIAL_COUNT && (
        <button type="button" onClick={() => setShowAll(false)}>
          Show fewer
        </button>
      )}

      <GrantDetails match={selected} onClose={() => setSelected(null)} />
    </section>
  );
}