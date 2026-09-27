import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { api } from "../api/client.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem("user");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem("token"));

  const refreshUser = useCallback(async () => {
    const t = localStorage.getItem("token");
    if (!t) return;
    try {
      const data = await api("/api/me", { token: t });
      setUser(data.user);
      localStorage.setItem("user", JSON.stringify(data.user));
    } catch {
      /* token invalid */
    }
  }, []);

  useEffect(() => {
    if (token) refreshUser();
  }, [token, refreshUser]);

  const login = useCallback((nextToken, nextUser) => {
    localStorage.setItem("token", nextToken);
    localStorage.setItem("user", JSON.stringify(nextUser));
    setToken(nextToken);
    setUser(nextUser);
  }, []);

  const logout = useCallback(async () => {
    const t = localStorage.getItem("token");
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
    if (t) {
      try {
        await api("/api/logout", { method: "POST", token: t });
      } catch {
        /* ignore */
      }
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(token),
      isAdmin: Boolean(user?.isAdmin),
      login,
      logout,
      refreshUser,
    }),
    [user, token, login, logout, refreshUser]
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
