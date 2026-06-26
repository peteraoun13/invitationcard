"use client";

export default function AdminErrorPage({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <main className="admin-shell">
      <section className="panel">
        <p className="eyebrow">Dashboard error</p>
        <h1>Something could not load.</h1>
        <p className="action-message is-error">{error.message}</p>
        <button className="button button--primary" onClick={reset}>
          Try again
        </button>
      </section>
    </main>
  );
}
