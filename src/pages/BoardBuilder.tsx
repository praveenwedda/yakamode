import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Sparkles,
  Eraser,
  Dumbbell,
  AlertCircle,
  CheckCircle2,
  Waves,
  TrendingUp,
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Field, Input, Select } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { BoardView } from '../components/board/BoardView';
import { useStore } from '../lib/storeContext';
import {
  ALL_BOXES,
  emptyExercises,
  sampleBoard,
  validateBoard,
} from '../lib/board';
import type { Exercise, ExerciseMode } from '../types';

export function BoardBuilder() {
  const { classId } = useParams();
  const { getClass, getBoard, updateBoard } = useStore();
  const cls = classId ? getClass(classId) : undefined;
  const board = cls ? getBoard(cls.boardId) : undefined;

  const [editingBox, setEditingBox] = useState<number | null>(null);
  const [snakeFrom, setSnakeFrom] = useState('');
  const [snakeTo, setSnakeTo] = useState('');
  const [ladderFrom, setLadderFrom] = useState('');
  const [ladderTo, setLadderTo] = useState('');
  const [addError, setAddError] = useState<string | null>(null);

  const validation = useMemo(
    () => (board ? validateBoard(board) : { ok: true, errors: [] }),
    [board],
  );

  if (!cls || !board) {
    return (
      <div className="text-center py-20">
        <p className="text-text-muted mb-4">Class or board not found.</p>
        <Link to="/classes">
          <Button variant="secondary">Back to classes</Button>
        </Link>
      </div>
    );
  }

  const exerciseCount = ALL_BOXES.filter((n) => board.exercises[n]).length;

  function addSnake() {
    setAddError(null);
    const from = Number(snakeFrom);
    const to = Number(snakeTo);
    const err = checkEndpoint(from, to, 'snake');
    if (err) return setAddError(err);
    updateBoard(board!.id, { snakes: [...board!.snakes, { from, to }] });
    setSnakeFrom('');
    setSnakeTo('');
  }

  function addLadder() {
    setAddError(null);
    const from = Number(ladderFrom);
    const to = Number(ladderTo);
    const err = checkEndpoint(from, to, 'ladder');
    if (err) return setAddError(err);
    updateBoard(board!.id, { ladders: [...board!.ladders, { from, to }] });
    setLadderFrom('');
    setLadderTo('');
  }

  /** Per-add quick validation with friendly messages. */
  function checkEndpoint(from: number, to: number, kind: 'snake' | 'ladder'): string | null {
    if (!Number.isInteger(from) || !Number.isInteger(to)) return 'Enter both box numbers.';
    if (from < 1 || from > 100 || to < 1 || to > 100) return 'Boxes must be 1–100.';
    if (kind === 'snake' && from <= to) return 'A snake must go down (head > tail).';
    if (kind === 'ladder' && from >= to) return 'A ladder must go up (bottom < top).';
    if (from === to) return 'Endpoints must differ.';
    // Endpoint-collision check against existing config.
    const used = new Set<number>();
    board!.snakes.forEach((s) => {
      used.add(s.from);
      used.add(s.to);
    });
    board!.ladders.forEach((l) => {
      used.add(l.from);
      used.add(l.to);
    });
    if (used.has(from) || used.has(to))
      return 'A box can only be one snake/ladder endpoint.';
    if (kind === 'snake' && from === 100) return 'No snake head on box 100.';
    if (kind === 'ladder' && from === 1) return 'No ladder bottom on box 1.';
    return null;
  }

  function saveExercise(box: number, ex: Exercise | null) {
    updateBoard(board!.id, {
      exercises: { ...board!.exercises, [box]: ex },
    });
    setEditingBox(null);
  }

  return (
    <div>
      <Link
        to={`/classes/${cls.id}`}
        className="inline-flex items-center gap-1.5 text-text-muted hover:text-text-primary text-sm mb-5"
      >
        <ArrowLeft size={16} /> Back to {cls.name}
      </Link>

      <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="text-4xl sm:text-5xl text-text-primary uppercase">
            Board builder
          </h1>
          <p className="text-text-muted mt-1.5">
            Click any cell to set its exercise. Add snakes &amp; ladders on the right.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            icon={<Sparkles size={16} />}
            onClick={() => updateBoard(board.id, sampleBoard())}
          >
            Load sample
          </Button>
          <Button
            variant="danger"
            icon={<Eraser size={16} />}
            onClick={() =>
              updateBoard(board.id, {
                snakes: [],
                ladders: [],
                exercises: emptyExercises(),
              })
            }
          >
            Clear board
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_360px] gap-6 items-start">
        {/* Live preview */}
        <div className="lg:sticky lg:top-20">
          <BoardView
            board={board}
            onCellClick={setEditingBox}
            selectedBox={editingBox}
          />
          <div className="flex flex-wrap gap-2 mt-4 justify-center">
            <Badge tone="success">{board.snakes.length} snakes</Badge>
            <Badge tone="brand">{board.ladders.length} ladders</Badge>
            <Badge tone="neutral">
              <Dumbbell size={12} /> {exerciseCount} exercises
            </Badge>
          </div>
        </div>

        {/* Controls */}
        <div className="space-y-4">
          {/* Validation status */}
          <Card className={validation.ok ? 'border-success/30' : 'border-danger/30'}>
            {validation.ok ? (
              <div className="flex items-center gap-2 text-success">
                <CheckCircle2 size={18} />
                <span className="text-sm font-medium">Board is valid.</span>
              </div>
            ) : (
              <div>
                <div className="flex items-center gap-2 text-danger mb-2">
                  <AlertCircle size={18} />
                  <span className="text-sm font-medium">
                    {validation.errors.length} issue
                    {validation.errors.length === 1 ? '' : 's'}
                  </span>
                </div>
                <ul className="text-xs text-text-muted space-y-1 list-disc pl-4">
                  {validation.errors.map((e, i) => (
                    <li key={i}>{e}</li>
                  ))}
                </ul>
              </div>
            )}
          </Card>

          {/* Snakes */}
          <Card>
            <div className="flex items-center gap-2 mb-3">
              <Waves size={18} className="text-success" />
              <h3 className="text-xl text-text-primary">Snakes</h3>
            </div>
            <div className="flex gap-2 mb-3">
              <Input
                type="number"
                min={2}
                max={100}
                placeholder="Head"
                value={snakeFrom}
                onChange={(e) => setSnakeFrom(e.target.value)}
              />
              <Input
                type="number"
                min={1}
                max={99}
                placeholder="Tail"
                value={snakeTo}
                onChange={(e) => setSnakeTo(e.target.value)}
              />
              <Button onClick={addSnake} aria-label="Add snake" className="shrink-0">
                <Plus size={16} />
              </Button>
            </div>
            <EndpointList
              items={board.snakes}
              tone="success"
              arrow="↓"
              onRemove={(i) =>
                updateBoard(board.id, {
                  snakes: board.snakes.filter((_, idx) => idx !== i),
                })
              }
              empty="No snakes yet."
            />
          </Card>

          {/* Ladders */}
          <Card>
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp size={18} className="text-warning" />
              <h3 className="text-xl text-text-primary">Ladders</h3>
            </div>
            <div className="flex gap-2 mb-3">
              <Input
                type="number"
                min={1}
                max={99}
                placeholder="Bottom"
                value={ladderFrom}
                onChange={(e) => setLadderFrom(e.target.value)}
              />
              <Input
                type="number"
                min={2}
                max={100}
                placeholder="Top"
                value={ladderTo}
                onChange={(e) => setLadderTo(e.target.value)}
              />
              <Button onClick={addLadder} aria-label="Add ladder" className="shrink-0">
                <Plus size={16} />
              </Button>
            </div>
            <EndpointList
              items={board.ladders}
              tone="warning"
              arrow="↑"
              onRemove={(i) =>
                updateBoard(board.id, {
                  ladders: board.ladders.filter((_, idx) => idx !== i),
                })
              }
              empty="No ladders yet."
            />
          </Card>

          {addError && (
            <p className="text-danger text-sm flex items-center gap-1.5">
              <AlertCircle size={14} /> {addError}
            </p>
          )}
        </div>
      </div>

      {editingBox != null && (
        <ExerciseEditor
          box={editingBox}
          current={board.exercises[editingBox] ?? null}
          onClose={() => setEditingBox(null)}
          onSave={(ex) => saveExercise(editingBox, ex)}
        />
      )}
    </div>
  );
}

function EndpointList({
  items,
  tone,
  arrow,
  onRemove,
  empty,
}: {
  items: Array<{ from: number; to: number }>;
  tone: 'success' | 'warning';
  arrow: string;
  onRemove: (i: number) => void;
  empty: string;
}) {
  if (items.length === 0)
    return <p className="text-xs text-text-muted">{empty}</p>;
  return (
    <ul className="space-y-1.5">
      {items.map((it, i) => (
        <li
          key={i}
          className="flex items-center justify-between bg-base/40 rounded-lg px-3 py-1.5"
        >
          <Badge tone={tone}>
            <span className="numeric">
              {it.from} {arrow} {it.to}
            </span>
          </Badge>
          <button
            onClick={() => onRemove(i)}
            className="text-text-muted hover:text-danger transition-colors"
            aria-label="Remove"
          >
            <Trash2 size={15} />
          </button>
        </li>
      ))}
    </ul>
  );
}

function ExerciseEditor({
  box,
  current,
  onClose,
  onSave,
}: {
  box: number;
  current: Exercise | null;
  onClose: () => void;
  onSave: (ex: Exercise | null) => void;
}) {
  const [name, setName] = useState(current?.name ?? '');
  const [mode, setMode] = useState<ExerciseMode>(current?.mode ?? 'reps');
  const [amount, setAmount] = useState(String(current?.amount ?? 10));
  const [error, setError] = useState<string | null>(null);

  function submit() {
    if (!name.trim()) return setError('Enter an exercise name.');
    const amt = Number(amount);
    if (!Number.isFinite(amt) || amt <= 0) return setError('Amount must be greater than 0.');
    onSave({ name: name.trim(), mode, amount: Math.round(amt) });
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={`Box ${box} exercise`}
      footer={
        <>
          {current && (
            <Button variant="danger" onClick={() => onSave(null)} className="mr-auto">
              Clear exercise
            </Button>
          )}
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit}>Save</Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Exercise name" error={error ?? undefined}>
          <Input
            autoFocus
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError(null);
            }}
            placeholder="e.g. Squats, Plank, Burpees"
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Mode">
            <Select value={mode} onChange={(e) => setMode(e.target.value as ExerciseMode)}>
              <option value="reps">Reps</option>
              <option value="duration">Duration (seconds)</option>
            </Select>
          </Field>
          <Field label={mode === 'reps' ? 'Reps' : 'Seconds'}>
            <Input
              type="number"
              min={1}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </Field>
        </div>
        <p className="text-xs text-text-muted">
          Leave a box without an exercise to make it a free move.
        </p>
      </div>
    </Modal>
  );
}
