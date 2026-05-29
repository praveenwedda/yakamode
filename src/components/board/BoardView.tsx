import { useState } from 'react';
import { motion } from 'motion/react';
import {
  ALL_BOXES,
  BOARD_PX,
  CELL,
  cellCenter,
  cellXY,
} from '../../lib/board';
import type { Board } from '../../types';
import { Snake } from './Snake';
import { Ladder } from './Ladder';

export interface BoardToken {
  id: string;
  color: string;
  initials: string;
  box: number;
  /** Optional sub-position for the slide/climb transport animation. */
}

interface BoardViewProps {
  board: Board;
  tokens?: BoardToken[];
  onCellClick?: (box: number) => void;
  selectedBox?: number | null;
  highlightBoxes?: number[];
  className?: string;
}

/** A small hand-drawn dumbbell marker (avoids embedding an icon library inside SVG). */
function Dumbbell({ cx, cy }: { cx: number; cy: number }) {
  return (
    <g transform={`translate(${cx} ${cy})`} opacity={0.9}>
      <rect x={-12} y={-3.5} width={24} height={7} rx={3} fill="var(--brand-purple-l)" />
      <rect x={-16} y={-8} width={6} height={16} rx={2.5} fill="var(--brand-purple-l)" />
      <rect x={10} y={-8} width={6} height={16} rx={2.5} fill="var(--brand-purple-l)" />
    </g>
  );
}

export function BoardView({
  board,
  tokens = [],
  onCellClick,
  selectedBox,
  highlightBoxes = [],
  className,
}: BoardViewProps) {
  const [hover, setHover] = useState<number | null>(null);
  const highlight = new Set(highlightBoxes);

  // Group tokens by box so we can fan them out when several share a cell.
  const byBox = new Map<number, BoardToken[]>();
  for (const t of tokens) {
    const arr = byBox.get(t.box) ?? [];
    arr.push(t);
    byBox.set(t.box, arr);
  }

  const hoveredExercise = hover != null ? board.exercises[hover] : null;

  return (
    <div className={`relative w-full ${className ?? ''}`}>
      <svg
        viewBox={`-8 -8 ${BOARD_PX + 16} ${BOARD_PX + 16}`}
        className="w-full h-auto rounded-2xl"
        style={{ filter: 'drop-shadow(0 0 40px var(--purple-glow))' }}
        role="img"
        aria-label="Snakes and Ladders board"
      >
        <defs>
          {/* Felt-like board background */}
          <radialGradient id="felt" cx="50%" cy="0%" r="120%">
            <stop offset="0%" stopColor="#2A1A55" />
            <stop offset="55%" stopColor="#1A103D" />
            <stop offset="100%" stopColor="#120B2B" />
          </radialGradient>
          <pattern id="weave" width="28" height="28" patternUnits="userSpaceOnUse">
            <path
              d="M0 14 L14 0 L28 14 L14 28 Z"
              fill="none"
              stroke="rgba(255,255,255,0.04)"
              strokeWidth="1"
            />
          </pattern>
          <linearGradient id="winCell" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#FFF8DC" />
            <stop offset="50%" stopColor="#FFD700" />
            <stop offset="100%" stopColor="#B8860B" />
          </linearGradient>
        </defs>

        {/* Board backing */}
        <rect
          x={-8}
          y={-8}
          width={BOARD_PX + 16}
          height={BOARD_PX + 16}
          rx={28}
          fill="url(#felt)"
          stroke="var(--brand-purple)"
          strokeWidth={3}
        />
        <rect x={0} y={0} width={BOARD_PX} height={BOARD_PX} rx={20} fill="url(#weave)" />

        {/* Cells */}
        {ALL_BOXES.map((n) => {
          const { x, y } = cellXY(n);
          const isWin = n === 100;
          const hasExercise = !!board.exercises[n];
          const isSelected = selectedBox === n;
          const isHighlighted = highlight.has(n);
          return (
            <g
              key={n}
              onClick={onCellClick ? () => onCellClick(n) : undefined}
              onMouseEnter={() => setHover(n)}
              onMouseLeave={() => setHover((h) => (h === n ? null : h))}
              style={{ cursor: onCellClick ? 'pointer' : 'default' }}
            >
              <rect
                x={x + 5}
                y={y + 5}
                width={CELL - 10}
                height={CELL - 10}
                rx={12}
                fill={isWin ? 'rgba(255,215,0,0.08)' : '#221644'}
                stroke={
                  isSelected
                    ? 'var(--brand-purple-l)'
                    : isHighlighted
                      ? 'var(--success)'
                      : isWin
                        ? '#FFD700'
                        : 'rgba(255,255,255,0.07)'
                }
                strokeWidth={isSelected || isHighlighted ? 4 : isWin ? 3 : 1.5}
              />
              {/* Number */}
              <text
                x={x + 13}
                y={y + 28}
                fill={isWin ? '#FFD700' : 'var(--text-muted)'}
                fontFamily="'Barlow Condensed', sans-serif"
                fontWeight={800}
                fontSize={20}
              >
                {n}
              </text>

              {isWin ? (
                // WIN cell — gold star.
                <path
                  d={starPath(x + CELL / 2, y + CELL / 2 + 6, 22, 10)}
                  fill="url(#winCell)"
                  stroke="#B8860B"
                  strokeWidth={1}
                />
              ) : (
                hasExercise && <Dumbbell cx={x + CELL / 2} cy={y + CELL / 2 + 8} />
              )}
            </g>
          );
        })}

        {/* Ladders first, then snakes on top */}
        {board.ladders.map((l, i) => (
          <Ladder key={`l-${i}-${l.from}-${l.to}`} ladder={l} />
        ))}
        {board.snakes.map((s, i) => (
          <Snake key={`s-${i}-${s.from}-${s.to}`} snake={s} index={i} />
        ))}

        {/* Tokens */}
        {[...byBox.entries()].map(([box, group]) =>
          group.map((t, i) => {
            const c = cellCenter(box);
            // Fan multiple tokens around the cell centre.
            const n = group.length;
            const spread = n > 1 ? 18 : 0;
            const angle = (i / Math.max(1, n)) * Math.PI * 2;
            const tx = c.x + Math.cos(angle) * spread;
            const ty = c.y + Math.sin(angle) * spread - 6;
            return (
              <motion.g
                key={t.id}
                initial={false}
                animate={{ x: tx, y: ty }}
                transition={{ type: 'spring', stiffness: 200, damping: 22 }}
              >
                <circle r={20} fill={t.color} opacity={0.35} />
                <circle
                  r={16}
                  fill={t.color}
                  stroke="#fff"
                  strokeWidth={2.5}
                  style={{ filter: `drop-shadow(0 0 8px ${t.color})` }}
                />
                <text
                  textAnchor="middle"
                  dy={5}
                  fill="#fff"
                  fontFamily="'Barlow Condensed', sans-serif"
                  fontWeight={800}
                  fontSize={15}
                >
                  {t.initials}
                </text>
              </motion.g>
            );
          }),
        )}
      </svg>

      {/* Exercise tooltip (HTML overlay positioned via viewBox percentages) */}
      {hover != null && hoveredExercise && (
        <div
          className="pointer-events-none absolute z-20 -translate-x-1/2 -translate-y-full"
          style={{
            left: `${((cellXY(hover).x + CELL / 2) / BOARD_PX) * 100}%`,
            top: `${((cellXY(hover).y) / BOARD_PX) * 100}%`,
          }}
        >
          <div className="mb-1 px-3 py-1.5 rounded-lg bg-surface-2 border border-brand/40 shadow-glow whitespace-nowrap">
            <div className="font-medium text-text-primary text-sm">
              {hoveredExercise.name}
            </div>
            <div className="text-xs text-brand-light numeric">
              {hoveredExercise.mode === 'reps'
                ? `${hoveredExercise.amount} reps`
                : `${hoveredExercise.amount}s`}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/** Generate an SVG star polygon path centred at (cx, cy). */
function starPath(cx: number, cy: number, outer: number, inner: number): string {
  const pts: string[] = [];
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = (Math.PI / 5) * i - Math.PI / 2;
    pts.push(`${(cx + Math.cos(a) * r).toFixed(1)} ${(cy + Math.sin(a) * r).toFixed(1)}`);
  }
  return `M${pts.join(' L')} Z`;
}
