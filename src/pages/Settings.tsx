import { useRef, useState } from 'react';
import {
  Download,
  Upload,
  KeyRound,
  Volume2,
  VolumeX,
  Database,
  ShieldAlert,
  Cloud,
  CloudOff,
  Check,
  LogOut,
} from 'lucide-react';
import { PageHeader } from '../components/PageHeader';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Field, Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { useStore } from '../lib/storeContext';
import { useAuth } from '../lib/authContext';
import { exportData } from '../lib/store';
import { hashPassword, verifyPassword } from '../lib/auth';
import { playSound } from '../lib/sound';

export function Settings() {
  const { data, backend, synced, updateSettings, importAll } = useStore();
  const auth = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);

  const [importPreview, setImportPreview] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [pwModal, setPwModal] = useState(false);

  function handleExport() {
    const { filename, json } = exportData(data);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleFilePicked(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setImportError(null);
      setImportPreview(String(reader.result));
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  function confirmImport() {
    if (!importPreview) return;
    try {
      importAll(importPreview);
      setImportPreview(null);
      setImportError(null);
    } catch (err) {
      setImportError(err instanceof Error ? err.message : 'Import failed.');
    }
  }

  const soundOn = data.settings.soundEnabled;

  return (
    <div>
      <PageHeader title="Settings" subtitle="Backups, security, and preferences." />

      {/* Storage backend status */}
      <Card className="mb-6 flex flex-wrap items-center gap-4">
        <div
          className={`grid place-items-center h-12 w-12 rounded-xl border shrink-0 ${
            backend === 'firebase'
              ? 'bg-success/15 border-success/30 text-success'
              : 'bg-warning/15 border-warning/30 text-warning'
          }`}
        >
          {backend === 'firebase' ? <Cloud size={24} /> : <CloudOff size={24} />}
        </div>
        <div className="flex-1 min-w-[200px]">
          <div className="flex items-center gap-2">
            <h3 className="text-xl text-text-primary">
              {backend === 'firebase' ? 'Cloud sync (Firebase)' : 'Local device storage'}
            </h3>
            {backend === 'firebase' && (
              <Badge tone={synced ? 'success' : 'warning'}>
                {synced ? (
                  <>
                    <Check size={12} /> Connected
                  </>
                ) : (
                  'Connecting…'
                )}
              </Badge>
            )}
          </div>
          <p className="text-text-muted text-sm mt-1">
            {backend === 'firebase'
              ? 'Members, classes, and history are synced to Firestore and shared across all approved trainers and devices in real time. Works offline and syncs when reconnected.'
              : 'Data is stored only in this browser on this device. Configure Firebase (see README) for cross-device sync.'}
          </p>
        </div>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Data backup */}
        <Card>
          <div className="flex items-center gap-3 mb-4">
            <Database className="text-brand-light" size={22} />
            <h3 className="text-2xl text-text-primary">Data backup</h3>
          </div>
          <p className="text-text-muted text-sm mb-4">
            {backend === 'firebase'
              ? 'Your data is already synced to the cloud. Exports are still handy for an extra offline backup or to move data between Firebase projects.'
              : 'Your data lives in this browser on this device only. Export regularly so you can restore it or move to another device.'}
          </p>
          <div className="flex flex-wrap gap-3">
            <Button onClick={handleExport} icon={<Download size={16} />}>
              Export to JSON
            </Button>
            <Button
              variant="secondary"
              onClick={() => fileRef.current?.click()}
              icon={<Upload size={16} />}
            >
              Import from JSON
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              hidden
              onChange={handleFilePicked}
            />
          </div>
          <div className="mt-4 text-xs text-text-muted">
            {data.members.length} members · {data.classes.length} classes stored.
          </div>
        </Card>

        {/* Sound */}
        <Card>
          <div className="flex items-center gap-3 mb-4">
            {soundOn ? (
              <Volume2 className="text-brand-light" size={22} />
            ) : (
              <VolumeX className="text-text-muted" size={22} />
            )}
            <h3 className="text-2xl text-text-primary">Sound</h3>
          </div>
          <p className="text-text-muted text-sm mb-4">
            Dice roll, exercise-complete chime, and winner fanfare. Off by default.
          </p>
          <Button
            variant={soundOn ? 'success' : 'secondary'}
            onClick={() => {
              const next = !soundOn;
              updateSettings({ soundEnabled: next });
              if (next) playSound('complete', true);
            }}
          >
            {soundOn ? 'Sound is ON — tap to mute' : 'Sound is OFF — tap to enable'}
          </Button>
        </Card>

        {/* Security / account */}
        <Card>
          <div className="flex items-center gap-3 mb-4">
            <KeyRound className="text-brand-light" size={22} />
            <h3 className="text-2xl text-text-primary">
              {backend === 'firebase' ? 'Account' : 'Admin password'}
            </h3>
          </div>
          {backend === 'firebase' ? (
            <>
              <p className="text-text-muted text-sm mb-4">
                Signed in as{' '}
                <strong className="text-text-primary">{auth.email}</strong>. Manage
                the password and approved trainers in the Firebase console.
              </p>
              <Button
                variant="secondary"
                icon={<LogOut size={16} />}
                onClick={() => void auth.logout()}
              >
                Sign out
              </Button>
            </>
          ) : (
            <>
              <p className="text-text-muted text-sm mb-4">
                Change the password that gates this app on this device.
              </p>
              <Button variant="secondary" onClick={() => setPwModal(true)}>
                Change password
              </Button>
            </>
          )}
        </Card>

        {/* Honest limitations */}
        <Card>
          <div className="flex items-center gap-3 mb-4">
            <ShieldAlert className="text-warning" size={22} />
            <h3 className="text-2xl text-text-primary">Good to know</h3>
          </div>
          <ul className="space-y-3 text-sm text-text-muted">
            {backend === 'firebase' ? (
              <>
                <li className="flex gap-2">
                  <ShieldAlert size={16} className="text-success shrink-0 mt-0.5" />
                  <span>
                    Real authentication via Firebase Auth. Access is limited to{' '}
                    <strong className="text-text-primary">approved trainer emails</strong>{' '}
                    and enforced by Firestore security rules.
                  </span>
                </li>
                <li className="flex gap-2">
                  <Cloud size={16} className="text-success shrink-0 mt-0.5" />
                  <span>
                    Data lives in Firestore and is shared across approved
                    trainers and devices, with offline support built in.
                  </span>
                </li>
                <li className="flex gap-2">
                  <Database size={16} className="text-brand-light shrink-0 mt-0.5" />
                  <span>
                    The whole dataset is stored in one document — plenty for a
                    gym, but mind Firestore's 1&nbsp;MB document limit if history
                    grows very large over many years.
                  </span>
                </li>
              </>
            ) : (
              <>
                <li className="flex gap-2">
                  <ShieldAlert size={16} className="text-warning shrink-0 mt-0.5" />
                  <span>
                    The admin password keeps casual users out but is{' '}
                    <strong className="text-text-primary">not secure</strong>. A
                    technical user could bypass it on a static site.
                  </span>
                </li>
                <li className="flex gap-2">
                  <Database size={16} className="text-brand-light shrink-0 mt-0.5" />
                  <span>
                    Data is stored only in this browser. Clearing browser data or
                    switching devices loses it — <strong>export regularly</strong>.
                  </span>
                </li>
                <li className="flex gap-2">
                  <Cloud size={16} className="text-brand-light shrink-0 mt-0.5" />
                  <span>
                    Configure Firebase (see README) for real accounts and true
                    cross-device sync.
                  </span>
                </li>
              </>
            )}
          </ul>
        </Card>
      </div>

      {/* Import confirmation */}
      <Modal
        open={importPreview != null}
        onClose={() => setImportPreview(null)}
        title="Import data?"
        footer={
          <>
            <Button variant="ghost" onClick={() => setImportPreview(null)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={confirmImport}>
              Overwrite everything
            </Button>
          </>
        }
      >
        <p className="text-text-muted">
          This will{' '}
          <strong className="text-danger">replace all current data</strong>{' '}
          (members, classes, boards, and game history) with the contents of the
          imported file. This cannot be undone. Export your current data first if
          you might need it.
        </p>
        {importError && <p className="text-danger text-sm mt-3">{importError}</p>}
      </Modal>

      <ChangePasswordModal open={pwModal} onClose={() => setPwModal(false)} />
    </div>
  );
}

function ChangePasswordModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { data, updateSettings } = useStore();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    setError(null);
    setBusy(true);
    try {
      const ok = await verifyPassword(current, data.settings.adminPasswordHash);
      if (!ok) {
        setError('Current password is incorrect.');
        return;
      }
      if (next.length < 4) {
        setError('New password must be at least 4 characters.');
        return;
      }
      updateSettings({ adminPasswordHash: await hashPassword(next) });
      setCurrent('');
      setNext('');
      onClose();
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Change admin password"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={busy}>
            Update password
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Current password">
          <Input
            type="password"
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
          />
        </Field>
        <Field label="New password">
          <Input
            type="password"
            value={next}
            onChange={(e) => setNext(e.target.value)}
          />
        </Field>
        {error && <p className="text-danger text-sm">{error}</p>}
      </div>
    </Modal>
  );
}
