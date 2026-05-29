// ════════════════════════════════════════════════════════════════════════
// Domain types for Anytime Fitness – Canberra City.
// These describe the entire persisted data model (see src/lib/store.ts).
// ════════════════════════════════════════════════════════════════════════

/** Game types. Only Snakes & Ladders exists today; the enum leaves room for
 *  additional game modes to be added later without a rewrite. */
export type GameType = 'snakes_and_ladders';

export const PLAYER_COLORS = [
  { name: 'Violet', hex: '#9B4DBB' },
  { name: 'Magenta', hex: '#E040FB' },
  { name: 'Cobalt', hex: '#4087FF' },
  { name: 'Teal', hex: '#00BCD4' },
  { name: 'Amber', hex: '#FFC107' },
  { name: 'Coral', hex: '#FF7043' },
] as const;

// ── Members (global, app-wide, permanent) ──────────────────────────────────
export interface Member {
  id: string;
  name: string;
  displayColor: string; // hex from PLAYER_COLORS (editable)
  avatarInitials?: string;
  createdAt: number;
  archived: boolean;
}

// ── Exercises ───────────────────────────────────────────────────────────────
export type ExerciseMode = 'reps' | 'duration';

export interface Exercise {
  name: string;
  mode: ExerciseMode;
  amount: number; // reps count, or seconds for duration. Summed for volume.
}

// ── Board (Snakes & Ladders configuration) ──────────────────────────────────
export interface Snake {
  from: number; // head (higher number)
  to: number; // tail (lower number) — from > to
}

export interface Ladder {
  from: number; // bottom (lower number)
  to: number; // top (higher number) — from < to
}

export type WinRule = 'reach_or_pass' | 'exact';
export type ExerciseTrigger = 'landing_box' | 'final_box';

export interface BoardRules {
  winRule: WinRule;
  exerciseTrigger: ExerciseTrigger;
}

export interface Board {
  id: string;
  snakes: Snake[];
  ladders: Ladder[];
  exercises: Record<number, Exercise | null>; // box 1..100 -> exercise | null
  rules: BoardRules;
}

// ── Classes ──────────────────────────────────────────────────────────────────
export type ClassStatus = 'setup' | 'in_progress' | 'finished';

export interface GymClass {
  id: string;
  name: string;
  date: string; // ISO date (yyyy-mm-dd)
  gameType: GameType;
  boardId: string;
  participantIds: string[];
  status: ClassStatus;
  createdAt: number;
}

// ── Game sessions (live + recorded play state) ───────────────────────────────
export interface TurnRecord {
  memberId: string;
  roll: number;
  fromBox: number;
  landedBox: number; // box after dice move, before transport
  finalBox: number; // box after snake/ladder transport
  exercise: Exercise | null;
  exerciseStartedAt: number | null;
  exerciseCompletedAt: number | null;
  durationMs: number; // active exercise time for this turn
}

export interface GameSession {
  classId: string;
  turnOrder: string[]; // memberIds in play order
  keyAssignments: Record<string, string>; // memberId -> keyboard key
  positions: Record<string, number>; // memberId -> current box
  winnerId: string | null;
  finishedRank: string[]; // memberIds in order they reached 100
  turns: TurnRecord[];
  startedAt: number | null;
  endedAt: number | null;
}

// ── Root persisted shape ──────────────────────────────────────────────────────
export interface AppData {
  schemaVersion: number;
  members: Member[];
  boards: Board[];
  classes: GymClass[];
  sessions: Record<string, GameSession>; // classId -> session
  settings: AppSettings;
}

export interface AppSettings {
  /** Lightweight hash of the admin password. NOT cryptographically secure —
   *  this is a convenience gate only (see README / Settings notes). */
  adminPasswordHash: string | null;
  soundEnabled: boolean;
}
