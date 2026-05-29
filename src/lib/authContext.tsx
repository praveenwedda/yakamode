import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { ReactNode } from 'react';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from 'firebase/auth';
import { hasAdminSession, setAdminSession } from './auth';
import { auth, isApprovedEmail, isFirebaseConfigured } from './firebase';

export type AuthMode = 'firebase' | 'local';

interface AuthContextValue {
  mode: AuthMode;
  /** True once we know the auth state (avoids flashing the login screen). */
  ready: boolean;
  /** Authenticated AND allowed to use the app. */
  isAdmin: boolean;
  /** Signed in but the email isn't on the approved allow-list. */
  notApproved: boolean;
  email: string | null;

  // Firebase email/password
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;

  // Local convenience-gate fallback
  loginLocal: () => void;

  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const mode: AuthMode = isFirebaseConfigured ? 'firebase' : 'local';

  // ── Firebase state ───────────────────────────────────────────────────────
  const [user, setUser] = useState<User | null>(null);
  const [fbReady, setFbReady] = useState(false);

  useEffect(() => {
    if (mode !== 'firebase' || !auth) {
      setFbReady(true);
      return;
    }
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setFbReady(true);
    });
    return unsub;
  }, [mode]);

  // ── Local convenience-gate state ──────────────────────────────────────────
  const [localAdmin, setLocalAdmin] = useState<boolean>(() => hasAdminSession());

  const signIn = useCallback(async (email: string, password: string) => {
    if (!auth) throw new Error('Firebase is not configured.');
    await signInWithEmailAndPassword(auth, email.trim(), password);
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    if (!auth) throw new Error('Firebase is not configured.');
    await createUserWithEmailAndPassword(auth, email.trim(), password);
  }, []);

  const loginLocal = useCallback(() => {
    setAdminSession(true);
    setLocalAdmin(true);
  }, []);

  const logout = useCallback(async () => {
    if (mode === 'firebase' && auth) {
      await signOut(auth);
    } else {
      setAdminSession(false);
      setLocalAdmin(false);
    }
  }, [mode]);

  const value = useMemo<AuthContextValue>(() => {
    if (mode === 'firebase') {
      const approved = isApprovedEmail(user?.email);
      return {
        mode,
        ready: fbReady,
        isAdmin: !!user && approved,
        notApproved: !!user && !approved,
        email: user?.email ?? null,
        signIn,
        signUp,
        loginLocal,
        logout,
      };
    }
    return {
      mode,
      ready: true,
      isAdmin: localAdmin,
      notApproved: false,
      email: null,
      signIn,
      signUp,
      loginLocal,
      logout,
    };
  }, [mode, fbReady, user, localAdmin, signIn, signUp, loginLocal, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
