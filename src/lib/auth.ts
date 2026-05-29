// ════════════════════════════════════════════════════════════════════════
// Admin "login" — a CONVENIENCE GATE, NOT real security.
//
// Because this is a 100% static site, any check we perform runs in the user's
// browser and any stored value can be read by anyone technical. This keeps
// casual users out; it is NOT cryptographically secure. Real authentication
// would require a backend (e.g. Firebase Auth) — noted as future work.
//
// We use SubtleCrypto SHA-256 so the plaintext password isn't sitting in
// localStorage, but a determined person can still bypass the gate. Be honest
// about this in the UI and README.
// ════════════════════════════════════════════════════════════════════════

export async function hashPassword(password: string): Promise<string> {
  const data = new TextEncoder().encode(`af-canberra::${password}`);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function verifyPassword(
  password: string,
  hash: string | null,
): Promise<boolean> {
  if (!hash) return false;
  const candidate = await hashPassword(password);
  return candidate === hash;
}

// Session flag (admin is logged in) — kept in sessionStorage so it clears when
// the tab closes but survives in-app navigation / refreshes.
const SESSION_KEY = 'af_canberra_admin_session';

export function setAdminSession(active: boolean): void {
  if (active) sessionStorage.setItem(SESSION_KEY, '1');
  else sessionStorage.removeItem(SESSION_KEY);
}

export function hasAdminSession(): boolean {
  return sessionStorage.getItem(SESSION_KEY) === '1';
}
