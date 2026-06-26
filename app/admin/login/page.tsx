import { LoginForm } from "@/components/admin/login-form";

export default function AdminLoginPage() {
  return (
    <main className="centered-shell">
      <section className="auth-card">
        <p className="eyebrow">Private admin</p>
        <h1>Welcome back.</h1>
        <p className="muted">
          Log in with the bride or groom admin account to manage invitations.
        </p>
        <LoginForm />
      </section>
    </main>
  );
}
