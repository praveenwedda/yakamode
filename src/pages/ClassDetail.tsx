import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  LayoutGrid,
  Users,
  Play,
  Trophy,
  Trash2,
  Pencil,
  Dumbbell,
  AlertTriangle,
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { Field, Input } from '../components/ui/Input';
import { PlayerAvatar } from '../components/PlayerAvatar';
import { useStore } from '../lib/storeContext';
import { ALL_BOXES } from '../lib/board';

export function ClassDetail() {
  const { classId } = useParams();
  const navigate = useNavigate();
  const { data, getClass, getBoard, updateClass, deleteClass } = useStore();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [editing, setEditing] = useState(false);

  const cls = classId ? getClass(classId) : undefined;
  if (!cls) {
    return (
      <div className="text-center py-20">
        <p className="text-text-muted mb-4">Class not found.</p>
        <Link to="/classes">
          <Button variant="secondary">Back to classes</Button>
        </Link>
      </div>
    );
  }

  const board = getBoard(cls.boardId);
  const exerciseCount = board
    ? ALL_BOXES.filter((n) => board.exercises[n]).length
    : 0;
  const boardReady = !!board && (board.snakes.length > 0 || board.ladders.length > 0 || exerciseCount > 0);
  const participants = cls.participantIds
    .map((id) => data.members.find((m) => m.id === id))
    .filter(Boolean);

  return (
    <div>
      <Link
        to="/classes"
        className="inline-flex items-center gap-1.5 text-text-muted hover:text-text-primary text-sm mb-5"
      >
        <ArrowLeft size={16} /> All classes
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-4xl sm:text-5xl text-text-primary uppercase">
              {cls.name}
            </h1>
            <Badge
              tone={
                cls.status === 'finished'
                  ? 'success'
                  : cls.status === 'in_progress'
                    ? 'warning'
                    : 'neutral'
              }
            >
              {cls.status.replace('_', ' ')}
            </Badge>
          </div>
          <p className="text-text-muted mt-1.5">
            {cls.date} · Snakes &amp; Ladders
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" icon={<Pencil size={16} />} onClick={() => setEditing(true)}>
            Edit
          </Button>
          <Button
            variant="danger"
            icon={<Trash2 size={16} />}
            onClick={() => setConfirmDelete(true)}
          >
            Delete
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Board */}
        <Card>
          <div className="flex items-center gap-3 mb-4">
            <LayoutGrid className="text-brand-light" size={22} />
            <h3 className="text-2xl text-text-primary">Board</h3>
          </div>
          {boardReady ? (
            <div className="flex flex-wrap gap-2 mb-5">
              <Badge tone="success">{board!.snakes.length} snakes</Badge>
              <Badge tone="brand">{board!.ladders.length} ladders</Badge>
              <Badge tone="neutral">
                <Dumbbell size={12} /> {exerciseCount} exercises
              </Badge>
            </div>
          ) : (
            <p className="text-text-muted text-sm mb-5">
              No board configured yet. Add snakes, ladders, and exercises.
            </p>
          )}
          <Link to={`/classes/${cls.id}/board`}>
            <Button variant="secondary" full>
              {boardReady ? 'Edit board' : 'Build board'}
            </Button>
          </Link>
        </Card>

        {/* Players */}
        <Card>
          <div className="flex items-center gap-3 mb-4">
            <Users className="text-brand-light" size={22} />
            <h3 className="text-2xl text-text-primary">Players</h3>
          </div>
          {participants.length > 0 ? (
            <div className="flex flex-wrap gap-2 mb-5">
              {participants.map(
                (m) => m && <PlayerAvatar key={m.id} member={m} size={40} />,
              )}
            </div>
          ) : (
            <p className="text-text-muted text-sm mb-5">
              No players selected yet. Choose them during setup.
            </p>
          )}
          <Link to={`/classes/${cls.id}/setup`}>
            <Button variant="secondary" full>
              {participants.length > 0 ? 'Edit setup' : 'Choose players & setup'}
            </Button>
          </Link>
        </Card>
      </div>

      {/* Primary action */}
      <Card glow className="mt-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-2xl text-text-primary">
            {cls.status === 'finished'
              ? 'Class finished'
              : cls.status === 'in_progress'
                ? 'Game in progress'
                : 'Ready to play?'}
          </h3>
          <p className="text-text-muted text-sm mt-1">
            {cls.status === 'finished'
              ? 'View the post-match scoreboard and player stats.'
              : 'Build the board and pick players, then start the game.'}
          </p>
        </div>
        <div className="flex gap-3">
          {cls.status === 'finished' && (
            <Link to={`/classes/${cls.id}/results`}>
              <Button size="lg" icon={<Trophy size={18} />}>
                View results
              </Button>
            </Link>
          )}
          {cls.status === 'in_progress' && (
            <Link to={`/classes/${cls.id}/play`}>
              <Button size="lg" icon={<Play size={18} />}>
                Resume game
              </Button>
            </Link>
          )}
          {cls.status === 'setup' && (
            <Link to={`/classes/${cls.id}/setup`}>
              <Button
                size="lg"
                icon={<Play size={18} />}
                disabled={!boardReady}
              >
                Set up &amp; play
              </Button>
            </Link>
          )}
        </div>
      </Card>

      {confirmDelete && (
        <Modal
          open
          onClose={() => setConfirmDelete(false)}
          title="Delete this class?"
          footer={
            <>
              <Button variant="ghost" onClick={() => setConfirmDelete(false)}>
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={() => {
                  deleteClass(cls.id);
                  navigate('/classes');
                }}
              >
                Delete class
              </Button>
            </>
          }
        >
          <div className="flex gap-3 text-text-muted">
            <AlertTriangle className="text-danger shrink-0" size={22} />
            <p>
              This permanently removes the class, its board, and its game history.
              Members are <strong className="text-text-primary">not</strong> affected
              — they stay on your roster. This cannot be undone.
            </p>
          </div>
        </Modal>
      )}

      {editing && (
        <EditClassModal
          name={cls.name}
          date={cls.date}
          onClose={() => setEditing(false)}
          onSave={(patch) => {
            updateClass(cls.id, patch);
            setEditing(false);
          }}
        />
      )}
    </div>
  );
}

function EditClassModal({
  name,
  date,
  onClose,
  onSave,
}: {
  name: string;
  date: string;
  onClose: () => void;
  onSave: (patch: { name: string; date: string }) => void;
}) {
  const [n, setN] = useState(name);
  const [d, setD] = useState(date);
  return (
    <Modal
      open
      onClose={onClose}
      title="Edit class"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => onSave({ name: n.trim() || name, date: d })}>
            Save
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Class name">
          <Input value={n} onChange={(e) => setN(e.target.value)} />
        </Field>
        <Field label="Date">
          <Input type="date" value={d} onChange={(e) => setD(e.target.value)} />
        </Field>
      </div>
    </Modal>
  );
}
