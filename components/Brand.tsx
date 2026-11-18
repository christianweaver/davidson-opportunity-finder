// The NextStep wordmark: a small staircase that draws itself in, then the name.
export default function Brand() {
  return (
    <span className="brand">
      <svg className="brand-mark" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M3 21h6v-6h6V9h6V3" pathLength={1} />
      </svg>
      NextStep
    </span>
  );
}
