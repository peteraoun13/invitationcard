import { useEffect, useState } from "react";
import { signInAdmin } from "../lib/auth";
import { useAuth } from "../components/admin/AuthProvider.jsx";

export default function AdminLoginPage({ navigate }) {
  const { user, isLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoading && user) {
      navigate("/admin");
    }
  }, [isLoading, navigate, user]);

  useEffect(() => {
    document.body.style.overflow = "auto";

    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      await signInAdmin(email, password);
      navigate("/admin");
    } catch (loginError) {
      setError(loginError.message || "The email or password is incorrect.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="admin-login-page">
      <section className="admin-login-card admin-login-card--refined">
        <div className="admin-login-brand-panel" aria-hidden="true">
          <p className="admin-login-monogram">J &amp; H</p>
          <span className="admin-login-rule" />
          <p className="admin-eyebrow">Wedding Admin</p>
          <h1>Invitation Control</h1>
          <p>
            Manage families, private links, guest counts, and RSVP responses from
            one calm workspace.
          </p>
        </div>

        <div className="admin-login-form-panel">
          <p className="admin-eyebrow">Private Access</p>
          <h2>Welcome back.</h2>
          <p className="admin-muted">
            Sign in with the bride or groom admin account.
          </p>

          <form className="admin-form admin-form--login" onSubmit={handleSubmit}>
            <label>
              <span>Email</span>
              <input
                autoComplete="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </label>

            <label>
              <span>Password</span>
              <input
                autoComplete="current-password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </label>

            <button className="admin-button admin-button--primary" disabled={isSubmitting}>
              {isSubmitting ? "Logging in..." : "Log In"}
            </button>

            {error && (
              <p className="admin-alert admin-alert--error" role="alert">
                {error}
              </p>
            )}
          </form>
        </div>
      </section>
    </main>
  );
}
