import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { onAdminAuthStateChanged } from "../../lib/auth";

const AuthContext = createContext({
  user: null,
  isAdmin: false,
  isLoading: true,
  error: "",
});

export function AuthProvider({ children }) {
  const [authState, setAuthState] = useState({
    user: null,
    isAdmin: false,
    isLoading: true,
    error: "",
  });

  useEffect(() => {
    return onAdminAuthStateChanged((nextState) => {
      setAuthState({
        user: nextState.user || null,
        isAdmin: Boolean(nextState.isAdmin),
        isLoading: Boolean(nextState.isLoading),
        error: nextState.error || "",
      });
    });
  }, []);

  const value = useMemo(() => authState, [authState]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
