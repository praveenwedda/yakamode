// ════════════════════════════════════════════════════════════════════════
// Derived statistics. Computed on read from GameSession.turns — we never store
// redundant aggregates (spec §4).
// ════════════════════════════════════════════════════════════════════════

import type { GameSession, GymClass, TurnRecord } from '../types';

export interface VolumeStats {
  reps: number; // total reps across 'reps'-mode exercises
  seconds: number; // total seconds across 'duration'-mode exercises
  exerciseCount: number; // number of completed exercises
}

/** Sum workout volume for a set of turn records. */
export function turnsVolume(turns: TurnRecord[]): VolumeStats {
  let reps = 0;
  let seconds = 0;
  let exerciseCount = 0;
  for (const t of turns) {
    if (!t.exercise || t.exerciseCompletedAt == null) continue;
    exerciseCount += 1;
    if (t.exercise.mode === 'reps') reps += t.exercise.amount;
    else seconds += t.exercise.amount;
  }
  return { reps, seconds, exerciseCount };
}

/** Volume for a whole session (all players). */
export function classVolume(session: GameSession): VolumeStats {
  return turnsVolume(session.turns);
}

export interface TimingStats {
  totalActiveMs: number; // total time spent actively doing exercises
  avgMs: number; // average completion time per exercise
  fastestMs: number | null; // fastest single exercise
}

export function turnsTiming(turns: TurnRecord[]): TimingStats {
  const completed = turns.filter(
    (t) => t.exercise && t.exerciseCompletedAt != null && t.durationMs > 0,
  );
  if (completed.length === 0) {
    return { totalActiveMs: 0, avgMs: 0, fastestMs: null };
  }
  const totalActiveMs = completed.reduce((s, t) => s + t.durationMs, 0);
  const fastestMs = Math.min(...completed.map((t) => t.durationMs));
  return {
    totalActiveMs,
    avgMs: Math.round(totalActiveMs / completed.length),
    fastestMs,
  };
}

export interface MemberClassStats {
  memberId: string;
  volume: VolumeStats;
  timing: TimingStats;
  rolls: number;
  finalBox: number;
  finishRank: number | null; // 1-based rank in finishedRank, or null
  isWinner: boolean;
}

/** Per-member breakdown for a single session. */
export function memberStatsForSession(
  session: GameSession,
  memberId: string,
): MemberClassStats {
  const turns = session.turns.filter((t) => t.memberId === memberId);
  const rankIdx = session.finishedRank.indexOf(memberId);
  return {
    memberId,
    volume: turnsVolume(turns),
    timing: turnsTiming(turns),
    rolls: turns.length,
    finalBox: session.positions[memberId] ?? 1,
    finishRank: rankIdx >= 0 ? rankIdx + 1 : null,
    isWinner: session.winnerId === memberId,
  };
}

/** All participants' stats for a session, in turn order. */
export function allMemberStats(session: GameSession): MemberClassStats[] {
  return session.turnOrder.map((id) => memberStatsForSession(session, id));
}

// ── Formatting helpers ──────────────────────────────────────────────────────
export function formatMs(ms: number): string {
  if (ms <= 0) return '0.0s';
  const s = ms / 1000;
  if (s < 60) return `${s.toFixed(1)}s`;
  const m = Math.floor(s / 60);
  const rem = Math.round(s % 60);
  return `${m}m ${rem}s`;
}

export function formatVolume(v: VolumeStats): string {
  const parts: string[] = [];
  if (v.reps > 0) parts.push(`${v.reps} reps`);
  if (v.seconds > 0) parts.push(`${v.seconds} s`);
  parts.push(`${v.exerciseCount} exercise${v.exerciseCount === 1 ? '' : 's'}`);
  return parts.join(' · ');
}

// ── Cross-class history (member profile / improvement charts) ────────────────
export interface MemberClassPoint {
  classId: string;
  name: string;
  date: string;
  createdAt: number;
  reps: number;
  seconds: number;
  volumeTotal: number; // reps + seconds, a single "effort" number for trends
  exerciseCount: number;
  avgMs: number; // average completion time (lower = faster/fitter)
  finalBox: number;
  isWinner: boolean;
}

/** Every class a member has played, oldest → newest. */
export function memberHistory(
  classes: GymClass[],
  sessions: Record<string, GameSession>,
  memberId: string,
): MemberClassPoint[] {
  const points: MemberClassPoint[] = [];
  for (const cls of classes) {
    const session = sessions[cls.id];
    if (!session || !session.turnOrder.includes(memberId)) continue;
    // Only count classes that were actually played (have turns or finished).
    if (session.turns.length === 0 && cls.status !== 'finished') continue;
    const s = memberStatsForSession(session, memberId);
    points.push({
      classId: cls.id,
      name: cls.name,
      date: cls.date,
      createdAt: cls.createdAt,
      reps: s.volume.reps,
      seconds: s.volume.seconds,
      volumeTotal: s.volume.reps + s.volume.seconds,
      exerciseCount: s.volume.exerciseCount,
      avgMs: s.timing.avgMs,
      finalBox: s.finalBox,
      isWinner: s.isWinner,
    });
  }
  return points.sort((a, b) => a.createdAt - b.createdAt);
}

export interface MemberLifetime {
  classesPlayed: number;
  totalReps: number;
  totalSeconds: number;
  totalExerciseMs: number;
  wins: number;
  fastestMs: number | null;
  bestVolume: number;
}

export function memberLifetime(history: MemberClassPoint[]): MemberLifetime {
  return history.reduce<MemberLifetime>(
    (acc, p) => ({
      classesPlayed: acc.classesPlayed + 1,
      totalReps: acc.totalReps + p.reps,
      totalSeconds: acc.totalSeconds + p.seconds,
      totalExerciseMs: acc.totalExerciseMs + p.avgMs * p.exerciseCount,
      wins: acc.wins + (p.isWinner ? 1 : 0),
      fastestMs:
        p.avgMs > 0
          ? acc.fastestMs == null
            ? p.avgMs
            : Math.min(acc.fastestMs, p.avgMs)
          : acc.fastestMs,
      bestVolume: Math.max(acc.bestVolume, p.volumeTotal),
    }),
    {
      classesPlayed: 0,
      totalReps: 0,
      totalSeconds: 0,
      totalExerciseMs: 0,
      wins: 0,
      fastestMs: null,
      bestVolume: 0,
    },
  );
}
