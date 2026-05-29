import { useMemo } from 'react';

/** A lightweight brand-purple + white confetti burst (CSS only). */
export function Confetti({ count = 80 }: { count?: number }) {
  const pieces = useMemo(
    () =>
      Array.from({ length: count }).map((_, i) => {
        const colors = ['#7B2D8B', '#A054C4', '#F4F2FF', '#E040FB', '#FFD700'];
        return {
          id: i,
          left: Math.random() * 100,
          delay: Math.random() * 0.6,
          duration: 2.4 + Math.random() * 1.8,
          color: colors[i % colors.length],
          size: 6 + Math.random() * 8,
          rotate: Math.random() * 360,
        };
      }),
    [count],
  );

  return (
    <div className="pointer-events-none fixed inset-0 z-[60] overflow-hidden" aria-hidden>
      {pieces.map((p) => (
        <span
          key={p.id}
          style={{
            position: 'absolute',
            top: '-5vh',
            left: `${p.left}%`,
            width: p.size,
            height: p.size * 0.4,
            background: p.color,
            borderRadius: 2,
            transform: `rotate(${p.rotate}deg)`,
            animation: `confetti-fall ${p.duration}s linear ${p.delay}s forwards`,
          }}
        />
      ))}
    </div>
  );
}
