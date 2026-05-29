// ════════════════════════════════════════════════════════════════════════
// Snakes & Ladders move engine. Pure functions — given a board and a position,
// resolve a roll into the landing box, any transport, the triggered exercise,
// and whether the turn wins.
//
// Build decisions baked into the defaults (board.rules):
//   · winRule 'exact'        → must land exactly on 100; overshoot = no move.
//   · exerciseTrigger 'final_box' → exercise comes from the box after transport.
// Both are configurable per board so the alternative rules still work.
// ════════════════════════════════════════════════════════════════════════

import type { Board, Exercise } from '../types';

export function rollDie(): number {
  // Fair 1–6. crypto for a little extra randomness quality where available.
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const buf = new Uint32Array(1);
    crypto.getRandomValues(buf);
    return (buf[0] % 6) + 1;
  }
  return Math.floor(Math.random() * 6) + 1;
}

export type TransportKind = 'snake' | 'ladder' | null;

export interface MoveResult {
  roll: number;
  fromBox: number;
  landedBox: number; // box after the dice move, before transport
  finalBox: number; // box after snake/ladder transport
  transport: TransportKind;
  transportTo: number | null;
  moved: boolean; // false on an overshoot no-move
  exercise: Exercise | null;
  won: boolean;
}

export function resolveMove(board: Board, fromBox: number, roll: number): MoveResult {
  const { winRule, exerciseTrigger } = board.rules;
  let landedBox: number;
  let moved = true;

  const target = fromBox + roll;
  if (winRule === 'exact') {
    if (target > 100) {
      // Overshoot — stay put, no exercise this turn.
      landedBox = fromBox;
      moved = false;
    } else {
      landedBox = target;
    }
  } else {
    // reach_or_pass: cap at 100, overshoot still advances to 100.
    landedBox = Math.min(target, 100);
  }

  // Transport (only if we actually moved to a new box).
  let finalBox = landedBox;
  let transport: TransportKind = null;
  let transportTo: number | null = null;
  if (moved) {
    const snake = board.snakes.find((s) => s.from === landedBox);
    const ladder = board.ladders.find((l) => l.from === landedBox);
    if (snake) {
      transport = 'snake';
      transportTo = snake.to;
      finalBox = snake.to;
    } else if (ladder) {
      transport = 'ladder';
      transportTo = ladder.to;
      finalBox = ladder.to;
    }
  }

  const exerciseBox = exerciseTrigger === 'final_box' ? finalBox : landedBox;
  const exercise = moved ? (board.exercises[exerciseBox] ?? null) : null;

  const won =
    winRule === 'exact' ? finalBox === 100 : finalBox >= 100;

  return {
    roll,
    fromBox,
    landedBox,
    finalBox,
    transport,
    transportTo,
    moved,
    exercise,
    won,
  };
}
