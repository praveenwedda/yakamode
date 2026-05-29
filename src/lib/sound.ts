// ════════════════════════════════════════════════════════════════════════
// Tiny generated sound effects via the Web Audio API — no audio files needed,
// keeps the bundle lean. Default OFF; gated behind the Settings sound toggle.
// ════════════════════════════════════════════════════════════════════════

export type SoundName = 'roll' | 'complete' | 'win';

let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    const Ctor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
  }
  return ctx;
}

function tone(
  ac: AudioContext,
  freq: number,
  start: number,
  duration: number,
  type: OscillatorType = 'sine',
  gain = 0.12,
) {
  const osc = ac.createOscillator();
  const env = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, ac.currentTime + start);
  env.gain.setValueAtTime(0.0001, ac.currentTime + start);
  env.gain.exponentialRampToValueAtTime(gain, ac.currentTime + start + 0.01);
  env.gain.exponentialRampToValueAtTime(
    0.0001,
    ac.currentTime + start + duration,
  );
  osc.connect(env).connect(ac.destination);
  osc.start(ac.currentTime + start);
  osc.stop(ac.currentTime + start + duration + 0.02);
}

/**
 * Play a sound effect. `enabled` must be passed from settings — callers should
 * not play anything when sound is muted. Safe to call without user gesture in
 * most browsers after the first interaction.
 */
export function playSound(name: SoundName, enabled: boolean): void {
  if (!enabled) return;
  const ac = getCtx();
  if (!ac) return;
  if (ac.state === 'suspended') void ac.resume();

  switch (name) {
    case 'roll': {
      // Quick rattle-tumble: descending noisy blips.
      for (let i = 0; i < 6; i++) {
        tone(ac, 220 + Math.random() * 400, i * 0.05, 0.05, 'square', 0.05);
      }
      break;
    }
    case 'complete': {
      // Bright two-note confirm.
      tone(ac, 660, 0, 0.12, 'triangle', 0.12);
      tone(ac, 990, 0.1, 0.18, 'triangle', 0.12);
      break;
    }
    case 'win': {
      // Little fanfare arpeggio.
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((f, i) => tone(ac, f, i * 0.12, 0.3, 'sawtooth', 0.1));
      break;
    }
  }
}
