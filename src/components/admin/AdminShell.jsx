import { signOutAdmin } from "../../lib/auth";
import { useAuth } from "./AuthProvider.jsx";

function AdminNavLink({ currentPath, navigate, to, children }) {
  const isActive = currentPath === to;

  return (
    <a
      className={isActive ? "admin-nav__link is-active" : "admin-nav__link"}
      href={to}
      onClick={(event) => {
        event.preventDefault();
        navigate(to);
      }}
    >
      {children}
    </a>
  );
}

export function AdminShell({ children, currentPath, navigate }) {
  const { user } = useAuth();

  async function handleSignOut() {
    await signOutAdmin();
    navigate("/admin/login");
  }

  return (
    <main className="admin-app">
      <header className="admin-header">
        <a
          className="admin-brand"
          href="/admin"
          onClick={(event) => {
            event.preventDefault();
            navigate("/admin");
          }}
        >
          <span>J &amp; H</span>
          <small>Wedding Admin</small>
        </a>

        <nav className="admin-nav" aria-label="Admin navigation">
          <AdminNavLink currentPath={currentPath} navigate={navigate} to="/admin">
            Dashboard
          </AdminNavLink>
          <AdminNavLink
            currentPath={currentPath}
            navigate={navigate}
            to="/admin/families"
          >
            Families
          </AdminNavLink>
          <AdminNavLink currentPath={currentPath} navigate={navigate} to="/admin/rsvps">
            RSVPs
          </AdminNavLink>
        </nav>

        <div className="admin-session">
          <span>{user?.email}</span>
          <button className="admin-button admin-button--ghost" type="button" onClick={handleSignOut}>
            Sign Out
          </button>
        </div>
      </header>

      <section className="admin-content">{children}</section>
    </main>
  );
}

export function AdminStatus({ title, message }) {
  return (
    <main className="admin-app admin-app--center">
      <section className="admin-card admin-status-card">
        <p className="admin-eyebrow">Wedding Admin</p>
        <h1>{title}</h1>
        {message && <p>{message}</p>}
      </section>
    </main>
  );
}
