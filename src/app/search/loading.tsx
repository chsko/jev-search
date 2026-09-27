export default function Loading() {
  return (
    <div
      role="status"
      aria-label="Jev is thinking"
      className="animate-pulse rounded-2xl border border-line bg-surface p-6"
    >
      <div className="h-3 w-24 rounded bg-track" />
      <div className="mt-4 h-9 w-48 rounded bg-track" />
      <div className="mt-6 h-2 w-full rounded bg-track" />
    </div>
  );
}
