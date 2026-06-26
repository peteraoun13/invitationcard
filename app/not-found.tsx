import Link from "next/link";

export default function NotFoundPage() {
  return (
    <main className="centered-shell">
      <section className="auth-card">
        <p className="eyebrow">Not found</p>
        <h1>This page is unavailable.</h1>
        <p className="muted">
          The invitation link may be incorrect or no longer active.
        </p>
        <Link className="button button--secondary" href="/">
          Return home
        </Link>
      </section>
    </main>
  );
}
