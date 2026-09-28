import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { registerUser, loginUser, logoutUser, fetchCurrentUser } from '../api/authApi';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  // On first load, ask the backend if the httpOnly session cookie is still valid.
  // This is what lets a refresh keep you logged in instead of bouncing to /login.
  useEffect(() => {
    let cancelled = false;

    fetchCurrentUser()
      .then((body) => {
        if (!cancelled) setUser(body.user);
      })
      .catch(() => {
        if (!cancelled) setUser(null);
      })
      .finally(() => {
        if (!cancelled) setIsCheckingSession(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const register = useCallback(async (credentials) => {
    const body = await registerUser(credentials);
    setUser(body.user);
    return body.user;
  }, []);

  const login = useCallback(async (credentials) => {
    const body = await loginUser(credentials);
    setUser(body.user);
    return body.user;
  }, []);

  const logout = useCallback(async () => {
    await logoutUser();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isCheckingSession, register, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside an AuthProvider.');
  }
  return ctx;
}
