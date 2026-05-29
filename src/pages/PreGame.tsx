import { useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Keyboard,
  Users,
  Dices,
  Crown,
  Trophy,
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { EmptyState } from '../components/ui/EmptyState';
import { PlayerAvatar, initialsOf } from '../components/PlayerAvatar';
import { Dice } from '../components/Dice';
import type { DiceHandle } from '../components/Dice';
import { useStore } from '../lib/storeContext';
import { rollDie } from '../lib/engine';
import { playSound } from '../lib/sound';
import type { GameSession, Member } from '../types';

type Step = 'participants' | 'keys' | 'toss';

const KEY_CHOICES = 'QWERTYUIOPASDFGHJKLZXCVBNM1234567890'.split('');

export function PreGame() {
  const { classId } = useParams();
  const navigate = useNavigate();
  const { data, getClass, updateClass, getSession, saveSession } = useStore();
  const cls = classId ? getClass(classId) : undefined;
  const existing = classId ? getSession(classId) : undefined;

  const activeMembers = useMemo(
    () => data.members.filter((m) => !m.archived),
    [data.members],
  );

  const [step, setStep] = useState<Step>('participants');
  const [selected, setSelected] = useState<string[]>(
    existing?.turnOrder ?? cls?.participantIds ?? [],
  );
  const [keys, setKeys] = useState<Record<string, string>>(
    existing?.keyAssignments ?? {},
  );
  const [order, setOrder] = useState<string[]>(existing?.turnOrder ?? []);

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

  const selectedMembers = selected
    .map((id) => activeMembers.find((m) => m.id === id))
    .filter((m): m is Member => !!m);

  function toggle(id: string) {
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  }

  function startGame(finalOrder: string[]) {
    const positions: Record<string, number> = {};
    finalOrder.forEach((id) => (positions[id] = 1));
    const session: GameSession = {
      classId: cls!.id,
      turnOrder: finalOrder,
      keyAssignments: keys,
      positions,
      winnerId: null,
      finishedRank: [],
      turns: [],
      startedAt: Date.now(),
      endedAt: null,
    };
    saveSession(session);
    updateClass(cls!.id, {
      participantIds: finalOrder,
      status: 'in_progress',
    });
    navigate(`/classes/${cls!.id}/play`);
  }

  return (
    <div>
      <Link
        to={`/classes/${cls.id}`}
        className="inline-flex items-center gap-1.5 text-text-muted hover:text-text-primary text-sm mb-5"
      >
        <ArrowLeft size={16} /> Back to {cls.name}
      </Link>

      <h1 className="text-4xl sm:text-5xl text-text-primary uppercase mb-2">
        Game setup
      </h1>

      {/* Stepper */}
      <div className="flex items-center gap-2 mb-8 text-sm">
        {(
          [
            ['participants', 'Players', Users],
            ['keys', 'Keys', Keyboard],
            ['toss', 'The toss', Dices],
          ] as const
        ).map(([s, label, Icon], i) => {
          const idx = ['participants', 'keys', 'toss'].indexOf(step);
          const active = step === s;
          const done = idx > i;
          return (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${
                  active
                    ? 'bg-brand/20 border-brand/40 text-text-primary'
                    : done
                      ? 'border-success/30 text-success'
                      : 'border-border text-text-muted'
                }`}
              >
                {done ? <Check size={14} /> : <Icon size={14} />}
                {label}
              </div>
              {i < 2 && <div className="w-6 h-px bg-border" />}
            </div>
          );
        })}
      </div>

      {step === 'participants' && (
        <ParticipantStep
          members={activeMembers}
          selected={selected}
          onToggle={toggle}
          onNext={() => setStep('keys')}
        />
      )}

      {step === 'keys' && (
        <KeyStep
          members={selectedMembers}
          keys={keys}
          setKeys={setKeys}
          onBack={() => setStep('participants')}
          onNext={() => setStep('toss')}
        />
      )}

      {step === 'toss' && (
        <TossStep
          members={selectedMembers}
          order={order}
          setOrder={setOrder}
          soundEnabled={data.settings.soundEnabled}
          onBack={() => setStep('keys')}
          onStart={startGame}
        />
      )}
    </div>
  );
}

// ── Step 1: participants ─────────────────────────────────────────────────────
function ParticipantStep({
  members,
  selected,
  onToggle,
  onNext,
}: {
  members: Member[];
  selected: string[];
  onToggle: (id: string) => void;
  onNext: () => void;
}) {
  if (members.length === 0) {
    return (
      <Card>
        <EmptyState
          icon={<Users size={32} />}
          title="No active members"
          message="Add members to your roster before setting up a class."
          action={
            <Link to="/members">
              <Button>Go to Members</Button>
            </Link>
          }
        />
      </Card>
    );
  }
  return (
    <div>
      <p className="text-text-muted mb-4">
        Select who's playing this class. ({selected.length} selected)
      </p>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
        {members.map((m) => {
          const on = selected.includes(m.id);
          return (
            <button
              key={m.id}
              onClick={() => onToggle(m.id)}
              className={`flex items-center gap-3 p-4 rounded-xl border text-left transition-colors ${
                on
                  ? 'bg-brand/15 border-brand/40'
                  : 'bg-surface border-border hover:border-brand-light/30'
              }`}
            >
              <PlayerAvatar member={m} size={44} glow={on} />
              <span className="flex-1 font-medium text-text-primary">{m.name}</span>
              <div
                className={`grid place-items-center h-6 w-6 rounded-full border ${
                  on ? 'bg-brand border-brand text-accent-white' : 'border-border'
                }`}
              >
                {on && <Check size={14} />}
              </div>
            </button>
          );
        })}
      </div>
      <div className="flex justify-end">
        <Button
          size="lg"
          icon={<ArrowRight size={18} />}
          disabled={selected.length < 2}
          onClick={onNext}
        >
          {selected.length < 2 ? 'Pick at least 2 players' : 'Assign keys'}
        </Button>
      </div>
    </div>
  );
}

// ── Step 2: key assignment ───────────────────────────────────────────────────
function KeyStep({
  members,
  keys,
  setKeys,
  onBack,
  onNext,
}: {
  members: Member[];
  keys: Record<string, string>;
  setKeys: (k: Record<string, string>) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const [capturing, setCapturing] = useState<string | null>(null);
  const capturingRef = useRef<string | null>(null);
  capturingRef.current = capturing;

  // Capture the next keypress for the active member, enforcing uniqueness.
  function beginCapture(memberId: string) {
    setCapturing(memberId);
    const handler = (e: KeyboardEvent) => {
      const id = capturingRef.current;
      if (!id) return;
      e.preventDefault();
      if (e.key === 'Escape') {
        setCapturing(null);
        window.removeEventListener('keydown', handler);
        return;
      }
      const key = e.key.length === 1 ? e.key.toUpperCase() : e.key;
      // Reject if already used by someone else.
      const takenBy = Object.entries(keys).find(([mid, k]) => k === key && mid !== id);
      if (takenBy) return; // ignore, wait for a free key
      setKeys({ ...keys, [id]: key });
      setCapturing(null);
      window.removeEventListener('keydown', handler);
    };
    window.addEventListener('keydown', handler);
  }

  const used = new Set(Object.values(keys));
  const allAssigned = members.every((m) => keys[m.id]);

  return (
    <div>
      <p className="text-text-muted mb-4">
        Give each player a unique key — the one they'll press to mark an exercise
        complete during play. Click "Assign" then press a key, or pick one below.
      </p>
      <div className="space-y-3 mb-6">
        {members.map((m) => (
          <Card key={m.id} className="flex items-center gap-4">
            <PlayerAvatar member={m} size={44} />
            <span className="flex-1 font-medium text-text-primary">{m.name}</span>
            {keys[m.id] ? (
              <kbd className="numeric text-2xl px-4 py-1.5 rounded-lg bg-brand/20 border border-brand/40 text-brand-light min-w-[3rem] text-center">
                {keys[m.id]}
              </kbd>
            ) : (
              <span className="text-text-muted text-sm">No key</span>
            )}
            <Button
              variant={capturing === m.id ? 'success' : 'secondary'}
              size="sm"
              onClick={() => beginCapture(m.id)}
            >
              {capturing === m.id ? 'Press a key…' : keys[m.id] ? 'Reassign' : 'Assign'}
            </Button>
          </Card>
        ))}
      </div>

      {/* Quick-pick grid */}
      {capturing && (
        <Card className="mb-6">
          <p className="text-sm text-text-muted mb-3">
            …or pick a key for{' '}
            <strong className="text-text-primary">
              {members.find((m) => m.id === capturing)?.name}
            </strong>
            :
          </p>
          <div className="flex flex-wrap gap-2">
            {KEY_CHOICES.map((k) => {
              const taken = used.has(k) && keys[capturing] !== k;
              return (
                <button
                  key={k}
                  disabled={taken}
                  onClick={() => {
                    setKeys({ ...keys, [capturing]: k });
                    setCapturing(null);
                  }}
                  className="numeric h-9 w-9 rounded-lg border border-border text-text-primary hover:border-brand-light/50 hover:bg-brand/10 disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
                >
                  {k}
                </button>
              );
            })}
          </div>
        </Card>
      )}

      <div className="flex justify-between">
        <Button variant="ghost" onClick={onBack} icon={<ArrowLeft size={18} />}>
          Back
        </Button>
        <Button
          size="lg"
          icon={<ArrowRight size={18} />}
          disabled={!allAssigned}
          onClick={onNext}
        >
          {allAssigned ? 'Run the toss' : 'Assign all keys first'}
        </Button>
      </div>
    </div>
  );
}

// ── Step 3: the toss (animated roll-off) ─────────────────────────────────────
function TossStep({
  members,
  order,
  setOrder,
  soundEnabled,
  onBack,
  onStart,
}: {
  members: Member[];
  order: string[];
  setOrder: (o: string[]) => void;
  soundEnabled: boolean;
  onBack: () => void;
  onStart: (order: string[]) => void;
}) {
  const diceRef = useRef<DiceHandle>(null);
  const [rolls, setRolls] = useState<Record<string, number[]>>({});
  const [activeId, setActiveId] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(order.length > 0);

  // Compare players by their roll sequence, highest first (tie-break by next roll).
  function compareSeq(a: number[], b: number[]): number {
    for (let i = 0; i < Math.max(a.length, b.length); i++) {
      const av = a[i] ?? -1;
      const bv = b[i] ?? -1;
      if (av !== bv) return bv - av;
    }
    return 0;
  }

  async function runToss() {
    setRunning(true);
    setDone(false);
    const seq: Record<string, number[]> = {};
    members.forEach((m) => (seq[m.id] = []));

    // Round 1: everyone rolls once.
    let contenders = members.map((m) => m.id);
    let round = 0;
    while (contenders.length > 0 && round < 8) {
      for (const id of contenders) {
        setActiveId(id);
        const value = rollDie();
        playSound('roll', soundEnabled);
        await diceRef.current?.roll(value);
        seq[id] = [...seq[id], value];
        setRolls({ ...seq });
        await wait(250);
      }
      // Find groups still tied on their full sequence and re-roll just those.
      const groups = new Map<string, string[]>();
      for (const id of contenders) {
        const key = seq[id].join('-');
        groups.set(key, [...(groups.get(key) ?? []), id]);
      }
      contenders = [...groups.values()].filter((g) => g.length > 1).flat();
      round += 1;
    }

    setActiveId(null);
    const finalOrder = [...members]
      .sort((a, b) => compareSeq(seq[a.id], seq[b.id]))
      .map((m) => m.id);
    setOrder(finalOrder);
    setRunning(false);
    setDone(true);
  }

  const ranked = done
    ? order.map((id) => members.find((m) => m.id === id)!).filter(Boolean)
    : [];

  return (
    <div>
      <p className="text-text-muted mb-6">
        Everyone rolls — highest goes first. Ties re-roll automatically.
      </p>

      <div className="grid lg:grid-cols-[320px_1fr] gap-8 items-start">
        {/* The die */}
        <div className="flex flex-col items-center gap-6">
          <div className="grid place-items-center min-h-[200px]">
            <Dice ref={diceRef} size={170} />
          </div>
          {activeId && (
            <div className="flex items-center gap-2 text-text-primary">
              <PlayerAvatar
                member={members.find((m) => m.id === activeId)!}
                size={32}
              />
              <span className="font-medium">
                {members.find((m) => m.id === activeId)?.name} rolling…
              </span>
            </div>
          )}
          {!running && !done && (
            <Button size="xl" icon={<Dices size={22} />} onClick={runToss}>
              Roll the toss
            </Button>
          )}
          {!running && done && (
            <Button variant="secondary" onClick={runToss}>
              Re-run toss
            </Button>
          )}
        </div>

        {/* Results */}
        <div>
          {!done ? (
            <div className="grid sm:grid-cols-2 gap-3">
              {members.map((m) => (
                <Card
                  key={m.id}
                  className={`flex items-center gap-3 ${activeId === m.id ? 'border-brand-light/60 shadow-glow' : ''}`}
                >
                  <PlayerAvatar member={m} size={40} />
                  <span className="flex-1 font-medium text-text-primary">
                    {m.name}
                  </span>
                  <span className="numeric text-2xl text-brand-light">
                    {rolls[m.id]?.length ? rolls[m.id].join(' · ') : '—'}
                  </span>
                </Card>
              ))}
            </div>
          ) : (
            <AnimatePresence>
              <div className="space-y-3">
                {ranked.map((m, i) => (
                  <motion.div
                    key={m.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.12 }}
                  >
                    <Card
                      className={`flex items-center gap-4 ${i === 0 ? 'border-warning/40 shadow-glow' : ''}`}
                    >
                      <div className="numeric text-3xl text-text-muted w-10 text-center">
                        {i + 1}
                      </div>
                      <PlayerAvatar member={m} size={44} />
                      <span className="flex-1 font-medium text-text-primary text-lg">
                        {m.name}
                      </span>
                      {i === 0 ? (
                        <Badge tone="warning">
                          <Crown size={12} /> First
                        </Badge>
                      ) : (
                        <span className="text-text-muted text-sm">
                          {initialsOf(m)}
                        </span>
                      )}
                    </Card>
                  </motion.div>
                ))}
              </div>
            </AnimatePresence>
          )}
        </div>
      </div>

      <div className="flex justify-between mt-8">
        <Button variant="ghost" onClick={onBack} icon={<ArrowLeft size={18} />}>
          Back
        </Button>
        <Button
          size="xl"
          icon={<Trophy size={22} />}
          disabled={!done}
          onClick={() => onStart(order)}
        >
          Start game
        </Button>
      </div>
    </div>
  );
}

function wait(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
