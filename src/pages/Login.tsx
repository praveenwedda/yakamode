import { useState } from 'react';
import { motion } from 'motion/react';
import { Lock, ShieldAlert } from 'lucide-react';
import { Wordmark } from '../components/Wordmark';
import { Button } from '../components/ui/Button';
import { Field, Input } from '../components/ui/Input';
import { useStore } from '../lib/storeContext';
import { useAuth } from '../lib/authContext';
import { hashPassword, verifyPassword } from '../lib/auth';

export function Login() {
  const { data, updateSettings } = useStore();
  const { login } = useAuth();
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
        if (password.length < 4) {
          setError('Choose a password of at least 4 characters.');
          return;
        }
        if (password !== confirm) {
          setError('Passwords do not match.');
          return;
        }
        const hash = await hashPassword(password);
        updateSettings({ adminPasswordHash: hash });
        login();
      } else {
        const ok = await verifyPassword(password, data.settings.adminPasswordHash);
        if (!ok) {
          setError('Incorrect password.');
          return;
        }
        login();
      }
    } finally {
      setBusy(false);
    }
  }

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

        <div className="surface-card p-8 shadow-glow-lg">
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
        </div>

        {/* Honest security note (spec §3.1) */}
        <div className="mt-5 flex gap-3 text-xs text-text-muted bg-warning/5 border border-warning/20 rounded-xl p-4">
          <ShieldAlert size={28} className="text-warning shrink-0" />
          <p>
            This password keeps casual users out — it is{' '}
            <strong className="text-text-primary">not cryptographically secure</strong>.
            On a static site the check runs in your browser and a technical user
            could bypass it. Real authentication would need a backend (future
            work). Don't reuse an important password here.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
