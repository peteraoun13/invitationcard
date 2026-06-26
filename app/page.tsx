import Link from "next/link";

export default function HomePage() {
  return (
    <main className="centered-shell">
      <section className="auth-card">
        <p className="eyebrow">Wedding invitation system</p>
        <h1>Jad &amp; Hala</h1>
        <p className="muted">
          Manage private family links, guest lists, and RSVP responses.
        </p>
        <Link className="button button--primary" href="/admin">
          Open admin
        </Link>
      </section>
    </main>
  );
}
