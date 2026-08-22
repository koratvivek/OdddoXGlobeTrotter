import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  apiClient,
  clearAuthToken,
  getAuthToken,
  setAuthToken,
} from "@/lib/apiClient";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  const bootstrap = useCallback(async () => {
    const token = getAuthToken();
    if (!token) {
      setUser(null);
      setReady(true);
      return;
    }
    try {
      const me = await apiClient("/auth/me");
      setUser(me);
    } catch {
      clearAuthToken();
      setUser(null);
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  const login = useCallback(async (email, password, remember = true) => {
    const { access_token: token } = await apiClient("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    setAuthToken(token, remember);
    const me = await apiClient("/auth/me");
    setUser(me);
    return me;
  }, []);

  const signup = useCallback(async (payload) => {
    const { access_token: token } = await apiClient("/auth/signup", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    setAuthToken(token, true);
    const me = await apiClient("/auth/me");
    setUser(me);
    return me;
  }, []);

  const logout = useCallback(() => {
    clearAuthToken();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      ready,
      isAuthenticated: Boolean(user),
      login,
      signup,
      logout,
      setUser,
      refreshUser: bootstrap,
    }),
    [user, ready, login, signup, logout, bootstrap],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
