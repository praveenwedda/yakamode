import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { CalendarPlus, CalendarDays, Dices, Check } from 'lucide-react';
import { PageHeader } from '../components/PageHeader';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Field, Input } from '../components/ui/Input';
import { EmptyState } from '../components/ui/EmptyState';
import { Badge } from '../components/ui/Badge';
import { useStore } from '../lib/storeContext';
import { emptyBoard } from '../lib/board';
import type { GameType } from '../types';

const STATUS_TONE = {
  setup: 'neutral',
  in_progress: 'warning',
  finished: 'success',
} as const;

// Game catalogue — only Snakes & Ladders today, but presented as a chooser so
// more games can be added later without a rewrite.
const GAMES: { id: GameType; name: string; desc: string; available: boolean }[] = [
  {
    id: 'snakes_and_ladders',
    name: 'Snakes & Ladders',
    desc: 'Land on a box, do the exercise. Snakes slide you down, ladders lift you up.',
    available: true,
  },
];

export function Classes() {
  const { data, createClass, createBoard } = useStore();
  const navigate = useNavigate();
  const [creating, setCreating] = useState(false);

  const sorted = [...data.classes].sort((a, b) => b.createdAt - a.createdAt);

  function handleCreate(input: { name: string; date: string; gameType: GameType }) {
    const board = createBoard(emptyBoard());
    const cls = createClass({
      name: input.name,
      date: input.date,
      gameType: input.gameType,
      boardId: board.id,
      participantIds: [],
      status: 'setup',
    });
    setCreating(false);
    navigate(`/classes/${cls.id}`);
  }

  return (
    <div>
      <PageHeader
        title="Classes"
        subtitle="Each class is one game session with its own board and players."
        action={
          <Button icon={<CalendarPlus size={18} />} size="lg" onClick={() => setCreating(true)}>
            New class
          </Button>
        }
      />

      {sorted.length === 0 ? (
        <Card>
          <EmptyState
            icon={<CalendarDays size={32} />}
            title="No classes yet"
            message="Create a class, build its Snakes & Ladders board, pick players, and play."
            action={
              <Button icon={<CalendarPlus size={18} />} onClick={() => setCreating(true)}>
                Create your first class
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sorted.map((c, i) => (
            <motion.button
              key={c.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              onClick={() => navigate(`/classes/${c.id}`)}
              className="text-left"
            >
              <Card className="h-full hover:border-brand-light/40 transition-colors cursor-pointer">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <Dices className="text-brand-light" size={24} />
                  <Badge tone={STATUS_TONE[c.status]}>
                    {c.status.replace('_', ' ')}
                  </Badge>
                </div>
                <h3 className="text-2xl text-text-primary leading-tight">{c.name}</h3>
                <div className="text-text-muted text-sm mt-1">
                  {c.date} · {c.participantIds.length} player
                  {c.participantIds.length === 1 ? '' : 's'}
                </div>
              </Card>
            </motion.button>
          ))}
        </div>
      )}

      {creating && (
        <ClassCreator onClose={() => setCreating(false)} onCreate={handleCreate} />
      )}
    </div>
  );
}

function ClassCreator({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (input: { name: string; date: string; gameType: GameType }) => void;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const [name, setName] = useState('');
  const [date, setDate] = useState(today);
  const [game, setGame] = useState<GameType>('snakes_and_ladders');
  const [error, setError] = useState<string | null>(null);

  function submit() {
    if (!name.trim()) {
      setError('Give the class a name.');
      return;
    }
    onCreate({ name: name.trim(), date, gameType: game });
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="New class"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit}>Create &amp; build board</Button>
        </>
      }
    >
      <div className="space-y-5">
        <Field label="Class name" error={error ?? undefined}>
          <Input
            autoFocus
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError(null);
            }}
            placeholder="e.g. Tuesday HIIT"
          />
        </Field>

        <Field label="Date">
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>

        <div>
          <span className="block text-sm font-medium text-text-primary mb-2">
            Choose a game
          </span>
          <div className="space-y-2">
            {GAMES.map((g) => (
              <button
                key={g.id}
                type="button"
                disabled={!g.available}
                onClick={() => setGame(g.id)}
                className={`w-full text-left p-4 rounded-xl border transition-colors flex items-start gap-3 ${
                  game === g.id
                    ? 'bg-brand/15 border-brand/40'
                    : 'bg-surface-2 border-border hover:border-brand-light/30'
                } disabled:opacity-40`}
              >
                <div className="mt-0.5">
                  {game === g.id ? (
                    <div className="grid place-items-center h-5 w-5 rounded-full bg-brand text-accent-white">
                      <Check size={13} />
                    </div>
                  ) : (
                    <div className="h-5 w-5 rounded-full border border-border" />
                  )}
                </div>
                <div>
                  <div className="font-medium text-text-primary">{g.name}</div>
                  <div className="text-xs text-text-muted">{g.desc}</div>
                </div>
              </button>
            ))}
          </div>
          <p className="text-xs text-text-muted mt-2">
            More game types can be added in future.
          </p>
        </div>
      </div>
    </Modal>
  );
}
