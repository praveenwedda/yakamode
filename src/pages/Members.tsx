import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  UserPlus,
  Users,
  Archive,
  ArchiveRestore,
  Pencil,
  BarChart3,
} from 'lucide-react';
import { PageHeader } from '../components/PageHeader';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Field, Input } from '../components/ui/Input';
import { EmptyState } from '../components/ui/EmptyState';
import { Badge } from '../components/ui/Badge';
import { PlayerAvatar } from '../components/PlayerAvatar';
import { useStore } from '../lib/storeContext';
import { PLAYER_COLORS } from '../types';
import type { Member } from '../types';

/** Pick the first palette colour not already used by an active member. */
function nextColor(members: Member[]): string {
  const used = new Set(members.filter((m) => !m.archived).map((m) => m.displayColor));
  const free = PLAYER_COLORS.find((c) => !used.has(c.hex));
  return (free ?? PLAYER_COLORS[members.length % PLAYER_COLORS.length]).hex;
}

export function Members() {
  const { data, addMember, updateMember, setMemberArchived } = useStore();
  const [showArchived, setShowArchived] = useState(false);
  const [editing, setEditing] = useState<Member | 'new' | null>(null);

  const visible = useMemo(
    () => data.members.filter((m) => showArchived || !m.archived),
    [data.members, showArchived],
  );

  return (
    <div>
      <PageHeader
        title="Members"
        subtitle="Your permanent roster — create once, reuse in every class."
        action={
          <Button
            icon={<UserPlus size={18} />}
            size="lg"
            onClick={() => setEditing('new')}
          >
            Add member
          </Button>
        }
      />

      {data.members.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Users size={32} />}
            title="No members yet"
            message="Members are the players. Add your gym community here once and pick them for any class."
            action={
              <Button icon={<UserPlus size={18} />} onClick={() => setEditing('new')}>
                Add your first member
              </Button>
            }
          />
        </Card>
      ) : (
        <>
          <div className="flex items-center justify-between mb-4">
            <span className="text-text-muted text-sm">
              {data.members.filter((m) => !m.archived).length} active
              {data.members.some((m) => m.archived) &&
                ` · ${data.members.filter((m) => m.archived).length} archived`}
            </span>
            {data.members.some((m) => m.archived) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowArchived((v) => !v)}
              >
                {showArchived ? 'Hide archived' : 'Show archived'}
              </Button>
            )}
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {visible.map((m, i) => (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
              >
                <Card className={m.archived ? 'opacity-60' : ''}>
                  <div className="flex items-center gap-3">
                    <PlayerAvatar member={m} size={48} glow={!m.archived} />
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-text-primary truncate">
                        {m.name}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span
                          className="inline-block h-3 w-3 rounded-full"
                          style={{ background: m.displayColor }}
                        />
                        {m.archived && <Badge tone="neutral">Archived</Badge>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border">
                    <Link to={`/members/${m.id}`} className="flex-1">
                      <Button variant="secondary" size="sm" full icon={<BarChart3 size={14} />}>
                        Profile
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditing(m)}
                      aria-label="Edit"
                    >
                      <Pencil size={16} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setMemberArchived(m.id, !m.archived)}
                      aria-label={m.archived ? 'Unarchive' : 'Archive'}
                    >
                      {m.archived ? (
                        <ArchiveRestore size={16} />
                      ) : (
                        <Archive size={16} />
                      )}
                    </Button>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </>
      )}

      {editing && (
        <MemberEditor
          member={editing === 'new' ? null : editing}
          defaultColor={nextColor(data.members)}
          onClose={() => setEditing(null)}
          onSave={(input) => {
            if (editing === 'new') addMember(input);
            else updateMember(editing.id, input);
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}

function MemberEditor({
  member,
  defaultColor,
  onClose,
  onSave,
}: {
  member: Member | null;
  defaultColor: string;
  onClose: () => void;
  onSave: (input: {
    name: string;
    displayColor: string;
    avatarInitials?: string;
  }) => void;
}) {
  const [name, setName] = useState(member?.name ?? '');
  const [color, setColor] = useState(member?.displayColor ?? defaultColor);
  const [initials, setInitials] = useState(member?.avatarInitials ?? '');
  const [error, setError] = useState<string | null>(null);

  function submit() {
    if (!name.trim()) {
      setError('Name is required.');
      return;
    }
    onSave({
      name: name.trim(),
      displayColor: color,
      avatarInitials: initials.trim() || undefined,
    });
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={member ? 'Edit member' : 'Add member'}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit}>{member ? 'Save changes' : 'Add member'}</Button>
        </>
      }
    >
      <div className="space-y-5">
        <div className="flex justify-center">
          <PlayerAvatar
            member={{ name: name || '?', avatarInitials: initials, displayColor: color }}
            size={72}
          />
        </div>

        <Field label="Name" error={error ?? undefined}>
          <Input
            autoFocus
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError(null);
            }}
            placeholder="e.g. Jordan Lee"
          />
        </Field>

        <Field
          label="Avatar initials (optional)"
          hint="Defaults to initials from the name."
        >
          <Input
            value={initials}
            maxLength={2}
            onChange={(e) => setInitials(e.target.value.toUpperCase())}
            placeholder="JL"
          />
        </Field>

        <div>
          <span className="block text-sm font-medium text-text-primary mb-2">
            Token colour
          </span>
          <div className="flex flex-wrap gap-3">
            {PLAYER_COLORS.map((c) => (
              <button
                key={c.hex}
                type="button"
                onClick={() => setColor(c.hex)}
                title={c.name}
                className="h-10 w-10 rounded-full transition-transform hover:scale-110"
                style={{
                  background: c.hex,
                  boxShadow:
                    color === c.hex
                      ? `0 0 0 3px var(--bg-surface-2), 0 0 0 5px ${c.hex}`
                      : 'none',
                }}
                aria-label={c.name}
              />
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}
