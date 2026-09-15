import { readJson, remove, writeJson } from './storage';

const STORAGE_KEY = 'asp.admin.session';

export interface StoredSession<U> {
  token: string;
  user: U;
}

/**
 * The signed-in session in localStorage. Kept free of Angular DI so the HTTP
 * interceptor can read the token without depending on AuthService (which
 * itself depends on HttpClient).
 */
export const SessionStore = {
  read<U>(): StoredSession<U> | null {
    const session = readJson<StoredSession<U>>(STORAGE_KEY);
    return session?.token ? session : null;
  },
  write<U>(session: StoredSession<U>): void {
    writeJson(STORAGE_KEY, session);
  },
  token(): string | null {
    return readJson<StoredSession<unknown>>(STORAGE_KEY)?.token ?? null;
  },
  clear(): void {
    remove(STORAGE_KEY);
  },
};
