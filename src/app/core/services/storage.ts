/**
 * Defensive wrapper around localStorage.
 *
 * Storage is unavailable in a few real situations — Safari private browsing,
 * a locked-down corporate browser, a test runner without a DOM. None of those
 * should stop the portal loading, so every access degrades to a no-op rather
 * than throwing.
 */
function available(): Storage | null {
  try {
    return typeof localStorage !== 'undefined' ? localStorage : null;
  } catch {
    return null;
  }
}

export function readJson<T>(key: string): T | null {
  try {
    const raw = available()?.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function writeJson(key: string, value: unknown): void {
  try {
    available()?.setItem(key, JSON.stringify(value));
  } catch {
    // Quota exceeded or storage disabled — the in-memory signal still holds
    // the value for this session, which is enough.
  }
}

export function remove(key: string): void {
  try {
    available()?.removeItem(key);
  } catch {
    // Nothing to do.
  }
}
