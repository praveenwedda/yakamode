import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Crown, Flag, Dumbbell, Timer, ChevronRight } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { PlayerAvatar, initialsOf } from '../components/PlayerAvatar';
import { Dice } from '../components/Dice';
import type { DiceHandle } from '../components/Dice';
import { BoardView } from '../components/board/BoardView';
import type { BoardToken } from '../components/board/BoardView';
import { Confetti } from '../components/Confetti';
import { useStore } from '../lib/storeContext';
import { resolveMove, rollDie } from '../lib/engine';
import { playSound } from '../lib/sound';
import type { GameSession, Member, TurnRecord } from '../types';

type Phase = 'idle' | 'rolling' | 'moving' | 'transport' | 'exercise' | 'done';

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function Gameplay() {
  const { classId } = useParams();
  const navigate = useNavigate();
  const { data, getClass, getBoard, getSession, saveSession, updateClass } = useStore();

  const cls = classId ? getClass(classId) : undefined;
  const board = cls ? getBoard(cls.boardId) : undefined;
  const session = classId ? getSession(classId) : undefined;

  const members = useMemo(() => {
    const map = new Map(data.members.map((m) => [m.id, m]));
    return (session?.turnOrder ?? []).map((id) => map.get(id)).filter((m): m is Member => !!m);
  }, [data.members, session?.turnOrder]);

  // Keep a live ref to the session so async sequences read the latest state.
  const sessionRef = useRef<GameSession | undefined>(session);
  sessionRef.current = session;

  const diceRef = useRef<DiceHandle>(null);

  const [phase, setPhase] = useState<Phase>('idle');
  const [pointer, setPointer] = useState(0);
  const [displayPos, setDisplayPos] = useState<Record<string, number>>(
    () => session?.positions ?? {},
  );
  const [lastRoll, setLastRoll] = useState<number | null>(null);
  const [activeExercise, setActiveExercise] = useState<{
    memberId: string;
    name: string;
    mode: 'reps' | 'duration';
    amount: number;
    startedAt: number;
  } | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [banner, setBanner] = useState<string | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [endModal, setEndModal] = useState(false);

  // ── Initialise pointer (resume-safe) ──────────────────────────────────────
  useEffect(() => {
    if (!session) return;
    setDisplayPos(session.positions);
    if (session.turns.length === 0) {
      setPointer(nextOpenIndex(0, session));
    } else {
      const last = session.turns[session.turns.length - 1].memberId;
      const idx = session.turnOrder.indexOf(last);
      setPointer(nextOpenIndex(idx + 1, session));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classId]);

  /** Next turn-order index that hasn't finished yet (wraps around). */
  function nextOpenIndex(from: number, s: GameSession): number {
    const n = s.turnOrder.length;
    for (let i = 0; i < n; i++) {
      const idx = (from + i) % n;
      if (!s.finishedRank.includes(s.turnOrder[idx])) return idx;
    }
    return from % n; // everyone finished
  }

  // ── Exercise count-up timer ───────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'exercise' || !activeExercise) return;
    let raf = 0;
    const tick = () => {
      setElapsedMs(Date.now() - activeExercise.startedAt);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [phase, activeExercise]);

  const allFinished =
    !!session && session.finishedRank.length >= session.turnOrder.length;
  const activeMember = members[pointer];

  // ── Complete the active exercise (called by the player's key) ─────────────
  const completeExercise = useCallback(() => {
    const ex = activeExercise;
    const s = sessionRef.current;
    if (!ex || !s) return;
    const completedAt = Date.now();
    const durationMs = completedAt - ex.startedAt;
    playSound('complete', data.settings.soundEnabled);

    const pending = pendingTurnRef.current;
    if (!pending) return;
    const turn: TurnRecord = {
      ...pending,
      exerciseStartedAt: ex.startedAt,
      exerciseCompletedAt: completedAt,
      durationMs,
    };
    commitTurn(turn);
    setActiveExercise(null);
    setBanner('💚 Complete!');
    setTimeout(() => setBanner(null), 1100);
  }, [activeExercise, data.settings.soundEnabled]);

  // Hold the in-progress turn record between the move and the exercise key.
  const pendingTurnRef = useRef<TurnRecord | null>(null);

  function commitTurn(turn: TurnRecord) {
    const s = sessionRef.current;
    if (!s) return;
    const positions = { ...s.positions, [turn.memberId]: turn.finalBox };
    let finishedRank = s.finishedRank;
    let winnerId = s.winnerId;
    const justWon = turn.finalBox === 100 && !finishedRank.includes(turn.memberId);
    if (justWon) {
      finishedRank = [...finishedRank, turn.memberId];
      if (!winnerId) {
        winnerId = turn.memberId;
        setShowConfetti(true);
        playSound('win', data.settings.soundEnabled);
        setTimeout(() => setShowConfetti(false), 4000);
      }
    }
    const next: GameSession = {
      ...s,
      positions,
      turns: [...s.turns, turn],
      finishedRank,
      winnerId,
    };
    saveSession(next);
    sessionRef.current = next;
    pendingTurnRef.current = null;

    // Advance to the next open player.
    const idx = next.turnOrder.indexOf(turn.memberId);
    setPointer(nextOpenIndex(idx + 1, next));
    setPhase('idle');
  }

  // ── Global key listener: complete on the active player's key only ─────────
  useEffect(() => {
    if (!session) return;
    const assignedKeys = new Set(Object.values(session.keyAssignments));
    const handler = (e: KeyboardEvent) => {
      const key = e.key.length === 1 ? e.key.toUpperCase() : e.key;
      // preventDefault on all assigned keys during play so they don't trigger
      // browser shortcuts.
      if (assignedKeys.has(key)) e.preventDefault();
      if (phase !== 'exercise' || !activeExercise) return;
      const playerKey = session.keyAssignments[activeExercise.memberId];
      if (key === playerKey) completeExercise();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [phase, activeExercise, session, completeExercise]);

  if (!cls || !board || !session) {
    return (
      <div className="grid place-items-center min-h-screen">
        <div className="text-center">
          <p className="text-text-muted mb-4">No active game for this class.</p>
          <Link to={`/classes/${classId ?? ''}`}>
            <Button variant="secondary">Back to class</Button>
          </Link>
        </div>
      </div>
    );
  }

  // ── The roll → move → transport → exercise sequence ───────────────────────
  async function takeTurn() {
    if (phase !== 'idle' || !activeMember) return;
    const s = sessionRef.current!;
    const memberId = activeMember.id;
    const fromBox = s.positions[memberId] ?? 1;
    const value = rollDie();
    setLastRoll(value);

    setPhase('rolling');
    playSound('roll', data.settings.soundEnabled);
    await diceRef.current?.roll(value);

    const move = resolveMove(board!, fromBox, value);

    if (!move.moved) {
      setBanner(`Rolled ${value} — overshoot, stays on ${fromBox}`);
      setTimeout(() => setBanner(null), 1600);
      const turn: TurnRecord = {
        memberId,
        roll: value,
        fromBox,
        landedBox: move.landedBox,
        finalBox: move.finalBox,
        exercise: null,
        exerciseStartedAt: null,
        exerciseCompletedAt: null,
        durationMs: 0,
      };
      await wait(700);
      commitTurn(turn);
      return;
    }

    // Hop cell-by-cell to the landed box.
    setPhase('moving');
    for (let b = fromBox + 1; b <= move.landedBox; b++) {
      setDisplayPos((p) => ({ ...p, [memberId]: b }));
      await wait(150);
    }

    // Snake / ladder transport.
    if (move.transport && move.transportTo != null) {
      setPhase('transport');
      setBanner(
        move.transport === 'ladder'
          ? `🪜 Ladder! Up to ${move.transportTo}`
          : `🐍 Snake! Down to ${move.transportTo}`,
      );
      await wait(450);
      setDisplayPos((p) => ({ ...p, [memberId]: move.transportTo! }));
      await wait(750);
      setBanner(null);
    }

    // Exercise (from the final box, per the build decision).
    if (move.exercise) {
      const startedAt = Date.now();
      pendingTurnRef.current = {
        memberId,
        roll: value,
        fromBox,
        landedBox: move.landedBox,
        finalBox: move.finalBox,
        exercise: move.exercise,
        exerciseStartedAt: startedAt,
        exerciseCompletedAt: null,
        durationMs: 0,
      };
      setElapsedMs(0);
      setActiveExercise({ memberId, ...move.exercise, startedAt });
      setPhase('exercise');
      return; // waits for the player's key
    }

    // No exercise on the final box — record and advance (handles a win too).
    const turn: TurnRecord = {
      memberId,
      roll: value,
      fromBox,
      landedBox: move.landedBox,
      finalBox: move.finalBox,
      exercise: null,
      exerciseStartedAt: null,
      exerciseCompletedAt: null,
      durationMs: 0,
    };
    await wait(400);
    commitTurn(turn);
  }

  function endClass() {
    const s = sessionRef.current!;
    saveSession({ ...s, endedAt: Date.now() });
    updateClass(cls!.id, { status: 'finished' });
    navigate(`/classes/${cls!.id}/results`);
  }

  // Tokens for the board.
  const tokens: BoardToken[] = members.map((m) => ({
    id: m.id,
    color: m.displayColor,
    initials: initialsOf(m),
    box: displayPos[m.id] ?? 1,
  }));

  // Leaderboard: by board position desc, finished players first by rank.
  const leaderboard = [...members].sort((a, b) => {
    const ra = session.finishedRank.indexOf(a.id);
    const rb = session.finishedRank.indexOf(b.id);
    if (ra >= 0 || rb >= 0) {
      if (ra < 0) return 1;
      if (rb < 0) return -1;
      return ra - rb;
    }
    return (displayPos[b.id] ?? 1) - (displayPos[a.id] ?? 1);
  });

  const recentTurns = [...session.turns].slice(-8).reverse();
  const timerColor =
    elapsedMs > 45000 ? 'var(--danger)' : elapsedMs > 20000 ? 'var(--warning)' : 'var(--text-primary)';

  return (
    <div className="min-h-screen flex flex-col">
      {showConfetti && <Confetti />}

      {/* Top bar */}
      <header className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-border bg-base/80 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <span className="af-wordmark text-brand-light text-lg">ANYTIME FITNESS</span>
          <span className="text-text-muted text-sm hidden sm:inline">· {cls.name}</span>
        </div>
        <Button variant="danger" icon={<Flag size={16} />} onClick={() => setEndModal(true)}>
          End class
        </Button>
      </header>

      {/* Three-column gameplay layout (collapses on small screens) */}
      <div className="flex-1 grid grid-cols-1 xl:grid-cols-[300px_1fr_300px] gap-4 p-4 sm:p-6">
        {/* Left rail: leaderboard */}
        <aside className="order-2 xl:order-1 space-y-3">
          <h2 className="text-2xl text-text-primary">Leaderboard</h2>
          {leaderboard.map((m) => {
            const rank = session.finishedRank.indexOf(m.id);
            const isActive = activeMember?.id === m.id && phase !== 'done';
            return (
              <div
                key={m.id}
                className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${
                  isActive
                    ? 'bg-brand/20 border-brand-light/50 shadow-glow'
                    : 'bg-surface border-border'
                }`}
              >
                <PlayerAvatar member={m} size={40} glow={isActive} />
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-text-primary truncate flex items-center gap-1.5">
                    {m.name}
                    {session.winnerId === m.id && (
                      <Crown size={14} className="text-warning" />
                    )}
                  </div>
                  <div className="text-xs text-text-muted">
                    {rank >= 0 ? `Finished #${rank + 1}` : `Box ${displayPos[m.id] ?? 1}`}
                  </div>
                </div>
                <kbd className="numeric text-sm px-2 py-1 rounded bg-base border border-border text-text-muted">
                  {session.keyAssignments[m.id]}
                </kbd>
              </div>
            );
          })}
        </aside>

        {/* Centre: banner, board, dice, exercise */}
        <main className="order-1 xl:order-2 flex flex-col items-center gap-5">
          {/* Active player banner */}
          <AnimatePresence mode="wait">
            <motion.div
              key={banner ?? activeMember?.id ?? 'none'}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="text-center"
            >
              {allFinished ? (
                <h1 className="text-3xl sm:text-4xl text-success uppercase">
                  Everyone finished! 🎉
                </h1>
              ) : banner ? (
                <h1 className="text-2xl sm:text-3xl text-brand-light uppercase">
                  {banner}
                </h1>
              ) : (
                <h1 className="text-2xl sm:text-3xl text-text-primary uppercase flex items-center gap-2">
                  <span style={{ color: activeMember?.displayColor }}>💜</span>
                  {activeMember?.name}'s turn
                </h1>
              )}
            </motion.div>

          </AnimatePresence>

          <div className="w-full max-w-[560px]">
            <BoardView board={board} tokens={tokens} />
          </div>
        </main>

        {/* Right rail: dice + exercise + turn log */}
        <aside className="order-3 space-y-4">
          {/* Dice + roll */}
          <div className="surface-card p-5 flex flex-col items-center gap-4">
            <div className="grid place-items-center min-h-[150px]">
              <Dice ref={diceRef} size={130} initialValue={lastRoll ?? 1} />
            </div>
            {allFinished ? (
              <Button size="lg" full icon={<Flag size={18} />} onClick={endClass}>
                See results
              </Button>
            ) : phase === 'exercise' ? (
              <ExercisePanel
                member={members.find((m) => m.id === activeExercise?.memberId)}
                exercise={activeExercise}
                elapsedMs={elapsedMs}
                timerColor={timerColor}
                playerKey={
                  activeExercise ? session.keyAssignments[activeExercise.memberId] : ''
                }
                onComplete={completeExercise}
              />
            ) : (
              <Button
                size="xl"
                full
                disabled={phase !== 'idle'}
                onClick={takeTurn}
              >
                {phase === 'idle' ? 'Roll' : '…'}
              </Button>
            )}
          </div>

          {/* Turn log */}
          <div className="surface-card p-4">
            <h3 className="text-lg text-text-primary mb-2">Turn log</h3>
            {recentTurns.length === 0 ? (
              <p className="text-xs text-text-muted">No turns yet — roll to start.</p>
            ) : (
              <ul className="space-y-1.5 text-sm">
                {recentTurns.map((t, i) => {
                  const m = members.find((x) => x.id === t.memberId);
                  return (
                    <li key={i} className="flex items-center gap-2 text-text-muted">
                      <span
                        className="h-2 w-2 rounded-full shrink-0"
                        style={{ background: m?.displayColor }}
                      />
                      <span className="text-text-primary">{m?.name}</span>
                      <span className="numeric">rolled {t.roll}</span>
                      <ChevronRight size={12} />
                      <span className="numeric">box {t.finalBox}</span>
                      {t.exercise && (
                        <span className="text-brand-light text-xs">
                          · {t.exercise.name}
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </aside>
      </div>

      <Modal
        open={endModal}
        onClose={() => setEndModal(false)}
        title="End this class?"
        footer={
          <>
            <Button variant="ghost" onClick={() => setEndModal(false)}>
              Keep playing
            </Button>
            <Button variant="danger" icon={<Flag size={16} />} onClick={endClass}>
              End &amp; see results
            </Button>
          </>
        }
      >
        <p className="text-text-muted">
          Ending the class stops play and shows the post-match scoreboard. You can
          always view the results again later from the class page.
        </p>
      </Modal>
    </div>
  );
}

function ExercisePanel({
  member,
  exercise,
  elapsedMs,
  timerColor,
  playerKey,
  onComplete,
}: {
  member?: Member;
  exercise: { name: string; mode: 'reps' | 'duration'; amount: number } | null;
  elapsedMs: number;
  timerColor: string;
  playerKey: string;
  onComplete: () => void;
}) {
  if (!exercise || !member) return null;
  const secs = (elapsedMs / 1000).toFixed(1);
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="w-full rounded-xl border border-brand/40 bg-gradient-to-b from-brand/15 to-transparent p-4 text-center"
    >
      <div className="flex items-center justify-center gap-2 mb-1">
        <PlayerAvatar member={member} size={28} />
        <span className="text-sm text-text-muted">{member.name}</span>
      </div>
      <div className="flex items-center justify-center gap-2 text-brand-light mb-1">
        <Dumbbell size={18} />
        <span className="font-display font-bold text-2xl uppercase text-text-primary">
          {exercise.name}
        </span>
      </div>
      <div className="numeric text-xl text-brand-light mb-3">
        {exercise.mode === 'reps' ? `${exercise.amount} reps` : `${exercise.amount} seconds`}
      </div>
      <div
        className="numeric font-bold tabular-nums mb-3 flex items-center justify-center gap-2"
        style={{ color: timerColor, fontSize: 44, lineHeight: 1 }}
      >
        <Timer size={28} />
        {secs}s
      </div>
      <Button size="lg" full onClick={onComplete}>
        Press{' '}
        <kbd className="numeric mx-1 px-2 rounded bg-black/30 border border-white/20">
          {playerKey}
        </kbd>{' '}
        when done
      </Button>
    </motion.div>
  );
}
