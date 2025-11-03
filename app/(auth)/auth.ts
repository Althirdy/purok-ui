import { safePost } from '@/api/axios';

// Lightweight storage with fallback if AsyncStorage is not installed
let storage: {
  getItem: (k: string) => Promise<string | null>;
  setItem: (k: string, v: string) => Promise<void>;
  multiRemove: (keys: string[]) => Promise<void>;
  multiGet: (keys: string[]) => Promise<[string, string | null][]>;
};

try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const AsyncStorage = require('@react-native-async-storage/async-storage').default;
  storage = AsyncStorage;
} catch {
  const mem: Record<string, string> = (globalThis as any).__MEM_STORE ?? {};
  (globalThis as any).__MEM_STORE = mem;
  storage = {
    async getItem(k) { return mem[k] ?? null; },
    async setItem(k, v) { mem[k] = v; },
    async multiRemove(keys) { keys.forEach(k => delete mem[k]); },
    async multiGet(keys) { return keys.map(k => [k, mem[k] ?? null]); },
  };
}

export type AuthResponse = {
  token: string;
  purokId: string;
  userId?: string;
};

// Login via Purok PIN. Backend endpoint is expected at POST /auth/pin
// Body: { purokId: string, pin: string }
export async function loginWithPin(purokId: string, pin: string): Promise<AuthResponse> {
  const data = await safePost<AuthResponse>(
    '/auth/pin',
    { purokId, pin },
    async () => {
      // Fallback mock: accept PIN 1234 for any purokId in dev without API
      if (pin === '1234') {
        return { token: 'dev-mock-token', purokId };
      }
      throw new Error('Invalid PIN');
    }
  );

  await storage.setItem('auth/token', data.token);
  await storage.setItem('auth/purokId', data.purokId);
  if (data.userId) await storage.setItem('auth/userId', data.userId);
  return data;
}

export async function logout(): Promise<void> {
  await storage.multiRemove(['auth/token', 'auth/purokId', 'auth/userId']);
}

export async function getSession(): Promise<{ token: string | null; purokId: string | null }> {
  const [token, purokId] = await storage.multiGet(['auth/token', 'auth/purokId']).then((pairs) =>
    pairs.map(([, v]) => v)
  );
  return { token, purokId };
}


