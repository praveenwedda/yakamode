import { createContext, useCallback, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import { hasAdminSession, setAdminSession } from './auth';

interface AuthContextValue {
  isAdmin: boolean;
  login: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAdmin, setIsAdmin] = useState<boolean>(() => hasAdminSession());

  const login = useCallback(() => {
    setAdminSession(true);
    setIsAdmin(true);
  }, []);

  const logout = useCallback(() => {
    setAdminSession(false);
    setIsAdmin(false);
  }, []);

  return (
    <AuthContext.Provider value={{ isAdmin, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
