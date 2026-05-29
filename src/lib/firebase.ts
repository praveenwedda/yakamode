// ════════════════════════════════════════════════════════════════════════
// Firebase initialisation (Auth + Firestore).
//
// Config comes from Vite env vars (VITE_FIREBASE_*). The Firebase *web* config
// is NOT a secret — it ships to the browser by design; real security is
// enforced by Firebase Auth + the Firestore rules in `firestore.rules`.
//
// If the config is absent, the app gracefully falls back to localStorage-only
// mode (see store.ts / storeContext.tsx), so it still builds and runs without
// Firebase configured.
// ════════════════════════════════════════════════════════════════════════

import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  type Firestore,
} from 'firebase/firestore';

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY as string | undefined,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string | undefined,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID as string | undefined,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string | undefined,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as
    | string
    | undefined,
  appId: import.meta.env.VITE_FIREBASE_APP_ID as string | undefined,
};

/** True when the minimum config needed to talk to Firebase is present. */
export const isFirebaseConfigured = Boolean(
  config.apiKey && config.authDomain && config.projectId && config.appId,
);

/** Optional client-side allow-list for a clean "not authorised" message.
 *  The authoritative check lives in firestore.rules — this is UX only. */
export const APPROVED_EMAILS = (import.meta.env.VITE_ADMIN_EMAILS as string | undefined)
  ?.split(',')
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean) ?? [];

let app: FirebaseApp | null = null;
let authInstance: Auth | null = null;
let dbInstance: Firestore | null = null;

if (isFirebaseConfigured) {
  app = initializeApp(config as Record<string, string>);
  authInstance = getAuth(app);
  // Firestore with offline persistence (IndexedDB) so the app works offline
  // and syncs when reconnected — replaces the need for a localStorage cache.
  dbInstance = initializeFirestore(app, {
    // Some optional fields (e.g. avatarInitials) can be undefined; let the SDK
    // drop them rather than throwing on write.
    ignoreUndefinedProperties: true,
    // Offline persistence (IndexedDB) so the app works offline and syncs when
    // reconnected — replaces the need for a localStorage cache.
    localCache: persistentLocalCache({
      tabManager: persistentMultipleTabManager(),
    }),
  });
}

export const auth = authInstance;
export const db = dbInstance;

/** Shared-dataset document path (decision: one shared gym dataset). */
export const SHARED_DOC = { collection: 'app', id: 'shared' } as const;

/** Is this email allowed in? If no allow-list is configured, allow any
 *  authenticated user (Firestore rules remain the real gate). */
export function isApprovedEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  if (APPROVED_EMAILS.length === 0) return true;
  return APPROVED_EMAILS.includes(email.toLowerCase());
}
