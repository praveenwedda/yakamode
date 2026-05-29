// ════════════════════════════════════════════════════════════════════════
// Data-access layer.
//
// THE ONLY MODULE THAT TOUCHES localStorage. Everything else goes through the
// React context (see storeContext.tsx) which wraps these functions. Keeping
// persistence isolated here means the localStorage backend could later be
// swapped for Firebase Firestore (free tier, cross-device sync) by reworking
// just this one file. See README "Future work".
// ════════════════════════════════════════════════════════════════════════

import type { AppData } from '../types';

const STORAGE_KEY = 'af_canberra_v1';
const SCHEMA_VERSION = 1;

export function emptyData(): AppData {
  return {
    schemaVersion: SCHEMA_VERSION,
    members: [],
    boards: [],
    classes: [],
    sessions: {},
    settings: {
      adminPasswordHash: null,
      soundEnabled: false, // sound defaults OFF (per spec §7.5)
    },
  };
}

/** Future-proofing migration hook. As the schema evolves, bump SCHEMA_VERSION
 *  and add stepwise migrations here. Today it just backfills missing fields. */
function migrate(raw: unknown): AppData {
  const base = emptyData();
  if (!raw || typeof raw !== 'object') return base;
  const data = raw as Partial<AppData>;

  // (No older versions to migrate from yet — merge defensively so a partial or
  // hand-edited / imported blob never crashes the app.)
  const merged: AppData = {
    ...base,
    ...data,
    settings: { ...base.settings, ...(data.settings ?? {}) },
    members: data.members ?? [],
    boards: data.boards ?? [],
    classes: data.classes ?? [],
    sessions: data.sessions ?? {},
    schemaVersion: SCHEMA_VERSION,
  };
  return merged;
}

/** Normalise an arbitrary persisted blob (localStorage, import, or Firestore)
 *  into a valid AppData, backfilling defaults and running migrations. */
export function coerce(raw: unknown): AppData {
  return migrate(raw);
}

export function loadData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyData();
    return migrate(JSON.parse(raw));
  } catch (err) {
    console.error('Failed to load app data; starting fresh.', err);
    return emptyData();
  }
}

export function saveData(data: AppData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    console.error('Failed to save app data.', err);
    // Most likely a quota error; surface to the user in calling code if needed.
    throw err;
  }
}

// ── Export / import (first-class backup feature, see spec §6.2) ──────────────
/** Serialise app data for download. Pass the live in-memory data (works for
 *  both the localStorage and Firestore backends); falls back to localStorage. */
export function exportData(data: AppData = loadData()): { filename: string; json: string } {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  return {
    filename: `anytime-fitness-canberra-backup-${stamp}.json`,
    json: JSON.stringify(data, null, 2),
  };
}

/** Parse + validate an imported JSON string. Throws on malformed input. */
export function parseImport(jsonText: string): AppData {
  const parsed = JSON.parse(jsonText);
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('File does not contain a valid backup object.');
  }
  // Minimal shape check before we trust it.
  if (!('members' in parsed) || !('classes' in parsed)) {
    throw new Error('This does not look like an Anytime Fitness backup file.');
  }
  return migrate(parsed);
}

export { STORAGE_KEY, SCHEMA_VERSION };
