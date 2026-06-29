import { useCallback, useEffect, useMemo, useState } from "react";
import { AdminShell, AdminStatus } from "./components/admin/AdminShell.jsx";
import { AuthProvider, useAuth } from "./components/admin/AuthProvider.jsx";
import InvitationExperience from "./components/InvitationExperience.jsx";
import { backendProvider, isBackendConfigured } from "./services/backend";
import AdminDashboardPage from "./pages/AdminDashboardPage.jsx";
import AdminLoginPage from "./pages/AdminLoginPage.jsx";
import FamiliesPage from "./pages/FamiliesPage.jsx";
import FamilyDetailPage from "./pages/FamilyDetailPage.jsx";
import PublicInvitePage from "./pages/PublicInvitePage.jsx";
import RsvpDashboardPage from "./pages/RsvpDashboardPage.jsx";

function normalizePath(pathname) {
  if (pathname.length > 1 && pathname.endsWith("/")) {
    return pathname.slice(0, -1);
  }

  return pathname || "/";
}

function useBrowserRoute() {
  const [path, setPath] = useState(() => normalizePath(window.location.pathname));

  useEffect(() => {
    function handlePopState() {
      setPath(normalizePath(window.location.pathname));
    }

    window.addEventListener("popstate", handlePopState);

    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const navigate = useCallback((nextPath) => {
    const normalizedPath = normalizePath(nextPath);

    if (window.location.pathname !== normalizedPath) {
      window.history.pushState({}, "", normalizedPath);
    }

    setPath(normalizedPath);
    window.scrollTo({ top: 0 });
  }, []);

  return { path, navigate };
}

function BackendConfigStatus() {
  return (
    <AdminStatus
      title="Backend is not configured yet."
      message={
        backendProvider === "firebase"
          ? "Add the Vite Firebase environment variables, then restart the dev server."
          : "Check the PHP API and database credentials on OVH."
      }
    />
  );
}

function ProtectedAdminRoute({ children, currentPath, navigate }) {
  const { user, isLoading, error } = useAuth();

  useEffect(() => {
    document.body.style.overflow = "auto";

    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  useEffect(() => {
    if (!isLoading && !user) {
      navigate("/admin/login");
    }
  }, [isLoading, navigate, user]);

  if (isLoading) {
    return <AdminStatus title="Loading admin..." />;
  }

  if (error) {
    return <AdminStatus title="Could not load admin." message={error} />;
  }

  if (!user) {
    return null;
  }

  return (
    <AdminShell currentPath={currentPath} navigate={navigate}>
      {children}
    </AdminShell>
  );
}

function AdminRoutes({ path, navigate }) {
  const familyDetailMatch = path.match(/^\/admin\/families\/([^/]+)$/);

  if (path === "/admin/login") {
    return <AdminLoginPage navigate={navigate} />;
  }

  if (path === "/admin/families") {
    return (
      <ProtectedAdminRoute currentPath="/admin/families" navigate={navigate}>
        <FamiliesPage navigate={navigate} />
      </ProtectedAdminRoute>
    );
  }

  if (path === "/admin/rsvps") {
    return (
      <ProtectedAdminRoute currentPath="/admin/rsvps" navigate={navigate}>
        <RsvpDashboardPage />
      </ProtectedAdminRoute>
    );
  }

  if (familyDetailMatch) {
    return (
      <ProtectedAdminRoute currentPath="/admin/families" navigate={navigate}>
        <FamilyDetailPage
          familyId={decodeURIComponent(familyDetailMatch[1])}
          navigate={navigate}
        />
      </ProtectedAdminRoute>
    );
  }

  return (
    <ProtectedAdminRoute currentPath="/admin" navigate={navigate}>
      <AdminDashboardPage navigate={navigate} />
    </ProtectedAdminRoute>
  );
}

export default function App() {
  const { path, navigate } = useBrowserRoute();
  const inviteToken = useMemo(() => {
    const match = path.match(/^\/invite\/([^/]+)$/);
    return match ? decodeURIComponent(match[1]) : "";
  }, [path]);
  const isAdminRoute = path === "/admin" || path.startsWith("/admin/");
  const isInviteRoute = Boolean(inviteToken);

  if (isAdminRoute) {
    if (!isBackendConfigured) {
      return <BackendConfigStatus />;
    }

    return (
      <AuthProvider>
        <AdminRoutes path={path} navigate={navigate} />
      </AuthProvider>
    );
  }

  if (isInviteRoute) {
    if (!isBackendConfigured) {
      return <BackendConfigStatus />;
    }

    return <PublicInvitePage token={inviteToken} />;
  }

  return <InvitationExperience hideRsvp />;
}
