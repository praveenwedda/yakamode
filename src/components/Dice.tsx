import { forwardRef, useImperativeHandle, useRef, useState } from 'react';

export interface DiceHandle {
  /** Tumble and settle on `value` (1–6). Resolves when the animation ends. */
  roll: (value: number) => Promise<void>;
}

// Which face shows each value, and the cube orientation that brings it forward.
const FACE_TARGET: Record<number, { x: number; y: number }> = {
  1: { x: 0, y: 0 },
  2: { x: -90, y: 0 },
  3: { x: 0, y: -90 },
  4: { x: 0, y: 90 },
  5: { x: 90, y: 0 },
  6: { x: 0, y: 180 },
};

// Pip layouts on a 3×3 grid (column, row), 0-indexed.
const PIPS: Record<number, Array<[number, number]>> = {
  1: [[1, 1]],
  2: [[0, 0], [2, 2]],
  3: [[0, 0], [1, 1], [2, 2]],
  4: [[0, 0], [2, 0], [0, 2], [2, 2]],
  5: [[0, 0], [2, 0], [1, 1], [0, 2], [2, 2]],
  6: [[0, 0], [2, 0], [0, 1], [2, 1], [0, 2], [2, 2]],
};

const FACE_VALUE = { front: 1, back: 6, right: 3, left: 4, top: 2, bottom: 5 };
const ROLL_MS = 1150;

function Face({
  value,
  transform,
  size,
}: {
  value: number;
  transform: string;
  size: number;
}) {
  const pad = size * 0.18;
  const pip = size * 0.13;
  return (
    <div
      className="absolute grid"
      style={{
        width: size,
        height: size,
        transform,
        background: 'linear-gradient(145deg, var(--accent-white), #d9d4f0)',
        borderRadius: size * 0.16,
        boxShadow:
          'inset 0 0 12px rgba(123,45,139,0.18), 0 0 0 1px rgba(123,45,139,0.25)',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gridTemplateRows: 'repeat(3, 1fr)',
        padding: pad,
        backfaceVisibility: 'hidden',
      }}
    >
      {Array.from({ length: 9 }).map((_, i) => {
        const col = i % 3;
        const row = Math.floor(i / 3);
        const on = PIPS[value].some(([c, r]) => c === col && r === row);
        return (
          <div key={i} className="grid place-items-center">
            {on && (
              <div
                style={{
                  width: pip,
                  height: pip,
                  borderRadius: '50%',
                  background:
                    'radial-gradient(circle at 35% 30%, var(--brand-purple-l), var(--brand-purple) 70%, var(--brand-purple-d))',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.3)',
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

interface DiceProps {
  size?: number;
  initialValue?: number;
}

export const Dice = forwardRef<DiceHandle, DiceProps>(
  ({ size = 160, initialValue = 1 }, ref) => {
    const t0 = FACE_TARGET[initialValue];
    const [rot, setRot] = useState({ x: t0.x, y: t0.y });
    const [settling, setSettling] = useState(true);
    const spins = useRef(0);

    useImperativeHandle(ref, () => ({
      roll: (value: number) =>
        new Promise<void>((resolve) => {
          const target = FACE_TARGET[value] ?? FACE_TARGET[1];
          // Add several full tumbles on both axes for a weighty roll.
          spins.current += 1;
          const extra = 2 + (spins.current % 3); // vary the tumble each time
          setSettling(false);
          setRot({
            x: target.x + 360 * (extra + 1),
            y: target.y + 360 * extra,
          });
          window.setTimeout(() => {
            setSettling(true);
            resolve();
          }, ROLL_MS);
        }),
    }));

    const half = size / 2;
    const faceTransforms = {
      front: `translateZ(${half}px)`,
      back: `rotateY(180deg) translateZ(${half}px)`,
      right: `rotateY(90deg) translateZ(${half}px)`,
      left: `rotateY(-90deg) translateZ(${half}px)`,
      top: `rotateX(90deg) translateZ(${half}px)`,
      bottom: `rotateX(-90deg) translateZ(${half}px)`,
    };

    return (
      <div style={{ width: size, height: size, perspective: size * 6 }}>
        <div
          style={{
            width: size,
            height: size,
            position: 'relative',
            transformStyle: 'preserve-3d',
            transform: `translateZ(-${half}px) rotateX(${rot.x}deg) rotateY(${rot.y}deg) scale(${settling ? 1 : 0.94})`,
            transition: `transform ${ROLL_MS}ms cubic-bezier(0.175, 0.885, 0.32, 1.275)`,
          }}
        >
          {(Object.keys(faceTransforms) as Array<keyof typeof faceTransforms>).map(
            (k) => (
              <Face
                key={k}
                value={FACE_VALUE[k]}
                transform={faceTransforms[k]}
                size={size}
              />
            ),
          )}
        </div>
      </div>
    );
  },
);
Dice.displayName = 'Dice';
