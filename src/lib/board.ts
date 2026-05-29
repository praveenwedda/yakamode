// ════════════════════════════════════════════════════════════════════════
// Snakes & Ladders board geometry, validation, and presets.
//
// Geometry note (boustrophedon): box 1 is bottom-left. Row 1 (1–10) runs
// left→right, row 2 (11–20) right→left, alternating, up to 100 at top-left.
// ════════════════════════════════════════════════════════════════════════

import type { Board, Exercise } from '../types';
import { uid } from './ids';

export const BOARD_SIZE = 10; // 10×10
export const CELL = 100; // SVG units per cell
export const BOARD_PX = BOARD_SIZE * CELL; // 1000

export interface Cell {
  n: number;
  col: number; // 0..9 from left
  rowFromBottom: number; // 0..9 from bottom
}

/** Grid position (col, rowFromBottom) for a box number 1..100. */
export function cellGrid(n: number): Cell {
  const idx = n - 1;
  const rowFromBottom = Math.floor(idx / BOARD_SIZE);
  const inRow = idx % BOARD_SIZE;
  const col = rowFromBottom % 2 === 0 ? inRow : BOARD_SIZE - 1 - inRow;
  return { n, col, rowFromBottom };
}

/** Top-left SVG coordinate of a cell. */
export function cellXY(n: number): { x: number; y: number } {
  const { col, rowFromBottom } = cellGrid(n);
  const yRow = BOARD_SIZE - 1 - rowFromBottom; // flip so row 1 sits at the bottom
  return { x: col * CELL, y: yRow * CELL };
}

/** Centre SVG coordinate of a cell. */
export function cellCenter(n: number): { x: number; y: number } {
  const { x, y } = cellXY(n);
  return { x: x + CELL / 2, y: y + CELL / 2 };
}

export const ALL_BOXES = Array.from({ length: 100 }, (_, i) => i + 1);

// ── Factories ────────────────────────────────────────────────────────────
export function emptyExercises(): Record<number, Exercise | null> {
  const map: Record<number, Exercise | null> = {};
  for (const n of ALL_BOXES) map[n] = null;
  return map;
}

export function emptyBoard(): Omit<Board, 'id'> {
  return {
    snakes: [],
    ladders: [],
    exercises: emptyExercises(),
    // Defaults reflect the build decisions: classic exact-100 win, exercise
    // taken from the final box after any snake/ladder transport.
    rules: { winRule: 'exact', exerciseTrigger: 'final_box' },
  };
}

// ── Validation ──────────────────────────────────────────────────────────────
export interface ValidationResult {
  ok: boolean;
  errors: string[];
}

export function validateBoard(board: Pick<Board, 'snakes' | 'ladders'>): ValidationResult {
  const errors: string[] = [];
  const inRange = (n: number) => Number.isInteger(n) && n >= 1 && n <= 100;

  const snakeHeads = new Set<number>();
  const ladderBottoms = new Set<number>();
  // Track every endpoint cell + what occupies it, to catch overlaps.
  const endpoints = new Map<number, string>();

  for (const s of board.snakes) {
    if (!inRange(s.from) || !inRange(s.to)) {
      errors.push(`Snake ${s.from}→${s.to}: boxes must be between 1 and 100.`);
      continue;
    }
    if (s.from <= s.to) {
      errors.push(`Snake ${s.from}→${s.to}: a snake must go down (head > tail).`);
    }
    if (s.from === 100) errors.push('A snake head cannot be on box 100 (the win cell).');
    if (s.to === 1) errors.push('A snake tail on box 1 is not allowed.');
    if (snakeHeads.has(s.from))
      errors.push(`Two snakes share head box ${s.from}.`);
    snakeHeads.add(s.from);
    for (const cell of [s.from, s.to]) {
      if (endpoints.has(cell))
        errors.push(`Box ${cell} is used by more than one snake/ladder endpoint.`);
      endpoints.set(cell, 'snake');
    }
  }

  for (const l of board.ladders) {
    if (!inRange(l.from) || !inRange(l.to)) {
      errors.push(`Ladder ${l.from}→${l.to}: boxes must be between 1 and 100.`);
      continue;
    }
    if (l.from >= l.to) {
      errors.push(`Ladder ${l.from}→${l.to}: a ladder must go up (bottom < top).`);
    }
    if (l.from === 1) errors.push('A ladder cannot start on box 1.');
    if (l.to === 100) {
      // Allowed but worth noting it ends the game instantly — keep it valid.
    }
    if (ladderBottoms.has(l.from))
      errors.push(`Two ladders share bottom box ${l.from}.`);
    ladderBottoms.add(l.from);
    for (const cell of [l.from, l.to]) {
      if (endpoints.has(cell))
        errors.push(`Box ${cell} is used by more than one snake/ladder endpoint.`);
      endpoints.set(cell, 'ladder');
    }
  }

  return { ok: errors.length === 0, errors: Array.from(new Set(errors)) };
}

// ── Sample board (ready-made snakes, ladders, gym exercises) ─────────────────
export function sampleBoard(): Omit<Board, 'id'> {
  const exercises = emptyExercises();
  const set = (n: number, ex: Exercise) => (exercises[n] = ex);

  // A spread of classic gym exercises across the board.
  set(3, { name: 'Squats', mode: 'reps', amount: 15 });
  set(7, { name: 'Push-ups', mode: 'reps', amount: 10 });
  set(11, { name: 'Plank', mode: 'duration', amount: 30 });
  set(16, { name: 'Lunges', mode: 'reps', amount: 12 });
  set(22, { name: 'Mountain Climbers', mode: 'reps', amount: 20 });
  set(28, { name: 'Burpees', mode: 'reps', amount: 8 });
  set(33, { name: 'Wall Sit', mode: 'duration', amount: 40 });
  set(38, { name: 'Jumping Jacks', mode: 'reps', amount: 25 });
  set(44, { name: 'Sit-ups', mode: 'reps', amount: 15 });
  set(49, { name: 'High Knees', mode: 'duration', amount: 30 });
  set(53, { name: 'Tricep Dips', mode: 'reps', amount: 12 });
  set(58, { name: 'Russian Twists', mode: 'reps', amount: 20 });
  set(62, { name: 'Plank', mode: 'duration', amount: 45 });
  set(67, { name: 'Squat Jumps', mode: 'reps', amount: 12 });
  set(71, { name: 'Push-ups', mode: 'reps', amount: 15 });
  set(76, { name: 'Bicycle Crunches', mode: 'reps', amount: 24 });
  set(82, { name: 'Bear Crawl', mode: 'duration', amount: 30 });
  set(87, { name: 'Lunges', mode: 'reps', amount: 16 });
  set(91, { name: 'Burpees', mode: 'reps', amount: 10 });
  set(95, { name: 'Plank', mode: 'duration', amount: 60 });
  set(99, { name: 'Squats', mode: 'reps', amount: 20 });

  return {
    snakes: [
      { from: 17, to: 4 },
      { from: 33, to: 14 },
      { from: 52, to: 29 },
      { from: 64, to: 41 },
      { from: 78, to: 56 },
      { from: 96, to: 75 },
    ],
    ladders: [
      { from: 6, to: 25 },
      { from: 21, to: 39 },
      { from: 36, to: 57 },
      { from: 48, to: 69 },
      { from: 63, to: 81 },
      { from: 79, to: 98 },
    ],
    exercises,
    rules: { winRule: 'exact', exerciseTrigger: 'final_box' },
  };
}

/** Build a fresh persisted board from a config (adds an id). */
export function boardWithId(config: Omit<Board, 'id'>): Board {
  return { ...config, id: uid('brd') };
}
