import { cn } from '../lib/cn';

/**
 * Text-based brand wordmark for Anytime Fitness – Canberra City.
 *
 * IMPORTANT: The official Anytime Fitness logo (the "running man in a circle"
 * + wordmark) is trademarked and is deliberately NOT recreated here. To drop in
 * the real logo later, place your SVG/PNG inside the #brand-logo slot rendered
 * below — see README "Adding the official logo".
 */
export function Wordmark({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      {/* ▼▼▼ Official-logo slot — drop an <img> or inline <svg> in here later ▼▼▼ */}
      <div
        id="brand-logo"
        className="grid place-items-center h-10 w-10 rounded-xl bg-brand/20 border border-brand-light/30 shadow-glow shrink-0"
        aria-hidden
      >
        {/* Placeholder mark: a stylised "AF" monogram (NOT the official logo). */}
        <span className="af-wordmark text-brand-light text-xl leading-none">
          AF
        </span>
      </div>
      {/* ▲▲▲ End official-logo slot ▲▲▲ */}

      <div className="leading-none">
        <div
          className={cn(
            'af-wordmark text-brand-light',
            compact ? 'text-lg' : 'text-2xl',
          )}
          style={{ color: 'var(--brand-purple-l)' }}
        >
          ANYTIME FITNESS
        </div>
        {!compact && (
          <div className="text-text-muted text-xs tracking-wide mt-0.5">
            — Canberra City
          </div>
        )}
      </div>
    </div>
  );
}
