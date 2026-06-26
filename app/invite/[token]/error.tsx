"use client";

export default function InviteErrorPage({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <main className="invite-shell">
      <section className="invite-card">
        <p className="eyebrow">Invitation error</p>
        <h1>We could not load this invitation.</h1>
        <p className="action-message is-error">{error.message}</p>
        <button className="button button--primary" onClick={reset}>
          Try again
        </button>
      </section>
    </main>
  );
}
