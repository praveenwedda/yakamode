import { useId } from 'react';
import { cellCenter } from '../../lib/board';
import type { Ladder as LadderType } from '../../types';

/**
 * A premium metallic ladder: two gold→champagne rails with evenly spaced rungs,
 * a soft golden drop-shadow, and a gentle shimmer animation.
 */
export function Ladder({ ladder }: { ladder: LadderType }) {
  const uid = useId().replace(/:/g, '');
  const bottom = cellCenter(ladder.from);
  const top = cellCenter(ladder.to);

  const dx = top.x - bottom.x;
  const dy = top.y - bottom.y;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  const px = -uy; // perpendicular unit
  const py = ux;

  const half = 17; // half rail separation
  const railW = 6;

  // Rail endpoints, offset to each side.
  const rail = (sign: number) => ({
    x1: bottom.x + px * half * sign,
    y1: bottom.y + py * half * sign,
    x2: top.x + px * half * sign,
    y2: top.y + py * half * sign,
  });
  const left = rail(1);
  const right = rail(-1);

  // Rungs every ~46 units along the ladder, inset from the ends.
  const rungGap = 46;
  const count = Math.max(2, Math.floor(len / rungGap));
  const rungs: Array<{ x1: number; y1: number; x2: number; y2: number }> = [];
  for (let i = 0; i <= count; i++) {
    const t = (i + 0.5) / (count + 1);
    const cx = bottom.x + dx * t;
    const cy = bottom.y + dy * t;
    rungs.push({
      x1: cx + px * half,
      y1: cy + py * half,
      x2: cx - px * half,
      y2: cy - py * half,
    });
  }

  const angle = (Math.atan2(dy, dx) * 180) / Math.PI;

  return (
    <g>
      <defs>
        <linearGradient
          id={`ladder-${uid}`}
          gradientUnits="userSpaceOnUse"
          x1={bottom.x - px * half}
          y1={bottom.y - py * half}
          x2={bottom.x + px * half}
          y2={bottom.y + py * half}
          gradientTransform={`rotate(${angle} ${bottom.x} ${bottom.y})`}
        >
          <stop offset="0%" stopColor="#B8860B" />
          <stop offset="45%" stopColor="#FFD700" />
          <stop offset="70%" stopColor="#FFF8DC" />
          <stop offset="100%" stopColor="#B8860B" />
        </linearGradient>
        <filter id={`ladderShadow-${uid}`} x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="4" stdDeviation="5" floodColor="#FFD700" floodOpacity="0.25" />
        </filter>
      </defs>

      <g
        filter={`url(#ladderShadow-${uid})`}
        style={{ animation: `ladder-shimmer 3.5s ease-in-out infinite` }}
      >
        {/* Rungs (drawn under the rails) */}
        {rungs.map((r, i) => (
          <line
            key={i}
            x1={r.x1}
            y1={r.y1}
            x2={r.x2}
            y2={r.y2}
            stroke={`url(#ladder-${uid})`}
            strokeWidth={5}
            strokeLinecap="round"
          />
        ))}
        {/* Rails */}
        {[left, right].map((r, i) => (
          <line
            key={i}
            x1={r.x1}
            y1={r.y1}
            x2={r.x2}
            y2={r.y2}
            stroke={`url(#ladder-${uid})`}
            strokeWidth={railW}
            strokeLinecap="round"
          />
        ))}
        {/* Specular highlight along the inner edge of each rail */}
        {[left, right].map((r, i) => (
          <line
            key={`h${i}`}
            x1={r.x1}
            y1={r.y1}
            x2={r.x2}
            y2={r.y2}
            stroke="rgba(255,255,255,0.5)"
            strokeWidth={1.5}
            strokeLinecap="round"
          />
        ))}
      </g>
    </g>
  );
}
