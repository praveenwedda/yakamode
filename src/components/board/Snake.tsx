import { useId } from 'react';
import { cellCenter } from '../../lib/board';
import type { Snake as SnakeType } from '../../types';

/**
 * A flowing, characterful snake from head (high box) to tail (low box).
 * Body: emerald→green gradient with a scale-pattern overlay and a glossy
 * highlight. Head: white eyes + red pupils + a forked red tongue. Gentle idle
 * slither via a CSS transform oscillation anchored near the head.
 */
export function Snake({ snake, index }: { snake: SnakeType; index: number }) {
  const uid = useId().replace(/:/g, '');
  const head = cellCenter(snake.from);
  const tail = cellCenter(snake.to);

  const dx = tail.x - head.x;
  const dy = tail.y - head.y;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  const px = -uy; // unit perpendicular
  const py = ux;

  // Build a smooth slithering polyline: sinusoidal perpendicular displacement.
  const waves = Math.max(1.5, Math.min(3.5, len / 220));
  const amp = Math.min(34, len * 0.12);
  const STEPS = 40;
  const pts: Array<[number, number]> = [];
  for (let i = 0; i <= STEPS; i++) {
    const t = i / STEPS;
    // Taper the wave so the head and tail sit on their cell centres.
    const envelope = Math.sin(t * Math.PI);
    const disp = Math.sin(t * Math.PI * waves) * amp * envelope;
    const x = head.x + dx * t + px * disp;
    const y = head.y + dy * t + py * disp;
    pts.push([x, y]);
  }
  const d = pts
    .map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`)
    .join(' ');

  const headR = 26;
  // Tongue points outward from the head, away from the body.
  const tBase = { x: head.x - ux * headR, y: head.y - uy * headR };
  const tEnd = { x: head.x - ux * (headR + 26), y: head.y - uy * (headR + 26) };
  const fork = 9;
  const tongue = `M${tBase.x} ${tBase.y} L${tEnd.x} ${tEnd.y} M${tEnd.x} ${tEnd.y} l${px * fork - ux * 4} ${py * fork - uy * 4} M${tEnd.x} ${tEnd.y} l${-px * fork - ux * 4} ${-py * fork - uy * 4}`;

  // Eyes sit on the head, offset to each side along the perpendicular.
  const eyeOff = 10;
  const eyeFwd = 6;
  const eyeL = { x: head.x + px * eyeOff - ux * eyeFwd, y: head.y + py * eyeOff - uy * eyeFwd };
  const eyeR = { x: head.x - px * eyeOff - ux * eyeFwd, y: head.y - py * eyeOff - uy * eyeFwd };

  return (
    <g
      style={{
        // Stagger each snake's idle animation so they don't move in lockstep.
        animation: `snake-slither-${uid} ${4 + (index % 3)}s ease-in-out infinite`,
        transformOrigin: `${head.x}px ${head.y}px`,
      }}
    >
      <style>{`
        @keyframes snake-slither-${uid} {
          0%, 100% { transform: rotate(0deg); }
          50% { transform: rotate(${index % 2 === 0 ? 1.1 : -1.1}deg); }
        }
        @media (prefers-reduced-motion: reduce) {
          [data-snake="${uid}"] { animation: none !important; }
        }
      `}</style>

      <defs>
        <linearGradient id={`snakeBody-${uid}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#76FF03" />
          <stop offset="45%" stopColor="#43A047" />
          <stop offset="100%" stopColor="#1B5E20" />
        </linearGradient>
        <pattern
          id={`scales-${uid}`}
          width="14"
          height="14"
          patternUnits="userSpaceOnUse"
          patternTransform={`rotate(${(Math.atan2(dy, dx) * 180) / Math.PI})`}
        >
          <path
            d="M0 7 A7 7 0 0 1 14 7 M-7 14 A7 7 0 0 1 7 14 M7 14 A7 7 0 0 1 21 14"
            fill="none"
            stroke="rgba(0,0,0,0.25)"
            strokeWidth="1.5"
          />
        </pattern>
      </defs>

      {/* Soft shadow under the body */}
      <path
        d={d}
        fill="none"
        stroke="rgba(0,0,0,0.35)"
        strokeWidth={30}
        strokeLinecap="round"
        strokeLinejoin="round"
        transform="translate(3 5)"
      />
      {/* Main gradient body */}
      <path
        data-snake={uid}
        d={d}
        fill="none"
        stroke={`url(#snakeBody-${uid})`}
        strokeWidth={26}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Scale texture */}
      <path
        d={d}
        fill="none"
        stroke={`url(#scales-${uid})`}
        strokeWidth={26}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.55}
      />
      {/* Glossy highlight core */}
      <path
        d={d}
        fill="none"
        stroke="rgba(220,255,180,0.45)"
        strokeWidth={6}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.6}
      />

      {/* Forked tongue */}
      <path
        d={tongue}
        stroke="#F0476B"
        strokeWidth={3}
        strokeLinecap="round"
        fill="none"
      />

      {/* Head */}
      <circle
        cx={head.x}
        cy={head.y}
        r={headR}
        fill={`url(#snakeBody-${uid})`}
        stroke="rgba(0,0,0,0.3)"
        strokeWidth={2}
      />
      <circle cx={head.x} cy={head.y} r={headR} fill="rgba(220,255,180,0.12)" />
      {/* Eyes */}
      <circle cx={eyeL.x} cy={eyeL.y} r={6} fill="#fff" />
      <circle cx={eyeR.x} cy={eyeR.y} r={6} fill="#fff" />
      <circle cx={eyeL.x} cy={eyeL.y} r={2.6} fill="#C1121F" />
      <circle cx={eyeR.x} cy={eyeR.y} r={2.6} fill="#C1121F" />
    </g>
  );
}
