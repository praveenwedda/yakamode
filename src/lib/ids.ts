/** Small id helper. crypto.randomUUID is available in all evergreen browsers;
 *  the fallback keeps things working in older/embedded webviews. */
export function uid(prefix = ''): string {
  const raw =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  return prefix ? `${prefix}_${raw}` : raw;
}
