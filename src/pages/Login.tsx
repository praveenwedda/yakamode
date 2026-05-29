import { useState } from 'react';
import { motion } from 'motion/react';
import { Lock, ShieldAlert, Cloud, LogOut, UserX } from 'lucide-react';
import { Wordmark } from '../components/Wordmark';
import { Button } from '../components/ui/Button';
import { Field, Input } from '../components/ui/Input';
import { useStore } from '../lib/storeContext';
import { useAuth } from '../lib/authContext';
import { hashPassword, verifyPassword } from '../lib/auth';

export function Login() {
  const auth = useAuth();
  if (auth.mode === 'firebase') {
    return auth.notApproved ? <NotApproved /> : <FirebaseLogin />;
  }
  return <LocalLogin />;
}

// ── Firebase email/password ──────────────────────────────────────────────────
function FirebaseLogin() {
  const { signIn, signUp } = useAuth();
  const [creating, setCreating] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (creating) await signUp(email, password);
      else await signIn(email, password);
    } catch (err) {
      setError(friendlyAuthError(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Shell>
      <div className="flex items-center gap-3 mb-6">
        <div className="grid place-items-center h-11 w-11 rounded-xl bg-brand/20 border border-brand/30 text-brand-light">
          <Lock size={20} />
        </div>
        <div>
          <h1 className="text-2xl text-text-primary">
            {creating ? 'Create trainer account' : 'Trainer login'}
          </h1>
          <p className="text-text-muted text-sm flex items-center gap-1.5">
            <Cloud size={13} /> Synced across devices via Firebase
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Email">
          <Input
            type="email"
            autoFocus
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="trainer@gym.com"
          />
        </Field>
        <Field label="Password">
          <Input
            type="password"
            autoComplete={creating ? 'new-password' : 'current-password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
        </Field>

        {error && (
          <p className="text-sm text-danger" role="alert">
            {error}
          </p>
        )}

        <Button type="submit" size="lg" full disabled={busy}>
          {busy ? 'Please wait…' : creating ? 'Create account' : 'Sign in'}
        </Button>
      </form>

      <button
        onClick={() => {
          setCreating((c) => !c);
          setError(null);
        }}
        className="mt-4 text-sm text-text-muted hover:text-brand-light transition-colors w-full text-center"
      >
        {creating
          ? 'Already have an account? Sign in'
          : "First time? Create the trainer account"}
      </button>

      <div className="mt-5 flex gap-3 text-xs text-text-muted bg-brand/5 border border-brand/20 rounded-xl p-4">
        <ShieldAlert size={26} className="text-brand-light shrink-0" />
        <p>
          Access is restricted to approved trainer emails. If your email isn't on
          the list you'll be able to sign in but won't be able to load the gym's
          data.
        </p>
      </div>
    </Shell>
  );
}

// ── Signed in but not on the approved allow-list ─────────────────────────────
function NotApproved() {
  const { email, logout } = useAuth();
  return (
    <Shell>
      <div className="text-center">
        <div className="mx-auto grid place-items-center h-14 w-14 rounded-2xl bg-danger/15 border border-danger/30 text-danger mb-4">
          <UserX size={26} />
        </div>
        <h1 className="text-2xl text-text-primary mb-2">Not authorised</h1>
        <p className="text-text-muted text-sm mb-6">
          You're signed in as <strong className="text-text-primary">{email}</strong>,
          but that email isn't on the approved trainer list for this gym. Ask an
          admin to add it, then sign in again.
        </p>
        <Button variant="secondary" full icon={<LogOut size={16} />} onClick={() => void logout()}>
          Sign out
        </Button>
      </div>
    </Shell>
  );
}

// ── Local convenience gate (no Firebase configured) ──────────────────────────
function LocalLogin() {
  const { data, updateSettings } = useStore();
  const { loginLocal } = useAuth();
  const isFirstRun = !data.settings.adminPasswordHash;

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (isFirstRun) {
        if (password.length < 4) return setError('Choose a password of at least 4 characters.');
        if (password !== confirm) return setError('Passwords do not match.');
        updateSettings({ adminPasswordHash: await hashPassword(password) });
        loginLocal();
      } else {
        const ok = await verifyPassword(password, data.settings.adminPasswordHash);
        if (!ok) return setError('Incorrect password.');
        loginLocal();
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <Shell>
      <div className="flex items-center gap-3 mb-6">
        <div className="grid place-items-center h-11 w-11 rounded-xl bg-brand/20 border border-brand/30 text-brand-light">
          <Lock size={20} />
        </div>
        <div>
          <h1 className="text-2xl text-text-primary">
            {isFirstRun ? 'Set admin password' : 'Trainer login'}
          </h1>
          <p className="text-text-muted text-sm">
            {isFirstRun
              ? 'First run — create the password for this device.'
              : 'Enter the admin password to continue.'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Password">
          <Input
            type="password"
            autoFocus
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete={isFirstRun ? 'new-password' : 'current-password'}
          />
        </Field>
        {isFirstRun && (
          <Field label="Confirm password">
            <Input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="••••••••"
              autoComplete="new-password"
            />
          </Field>
        )}
        {error && (
          <p className="text-sm text-danger" role="alert">
            {error}
          </p>
        )}
        <Button type="submit" size="lg" full disabled={busy}>
          {isFirstRun ? 'Create & enter' : 'Enter'}
        </Button>
      </form>

      <div className="mt-5 flex gap-3 text-xs text-text-muted bg-warning/5 border border-warning/20 rounded-xl p-4">
        <ShieldAlert size={28} className="text-warning shrink-0" />
        <p>
          This password keeps casual users out — it is{' '}
          <strong className="text-text-primary">not cryptographically secure</strong>.
          For real cross-device accounts, configure Firebase (see README).
        </p>
      </div>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-full grid place-items-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="flex justify-center mb-8">
          <Wordmark />
        </div>
        <div className="surface-card p-8 shadow-glow-lg">{children}</div>
      </motion.div>
    </div>
  );
}

/** Map Firebase auth error codes to friendly messages. */
function friendlyAuthError(err: unknown): string {
  const code = (err as { code?: string })?.code ?? '';
  switch (code) {
    case 'auth/invalid-email':
      return 'That email address looks invalid.';
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Incorrect email or password.';
    case 'auth/email-already-in-use':
      return 'An account with that email already exists — sign in instead.';
    case 'auth/weak-password':
      return 'Password should be at least 6 characters.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please wait a moment and try again.';
    case 'auth/network-request-failed':
      return 'Network error — check your connection.';
    default:
      return (err as Error)?.message ?? 'Sign-in failed. Please try again.';
  }
}
