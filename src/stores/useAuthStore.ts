import { create } from 'zustand';
import { secureStorage } from '@/services/secureStorage';
import {
  login as loginApi,
  signup as signupApi,
  type AuthUser,
  type LoginPayload,
  type SignupPayload,
} from '@/services/mocks/authApi';
import { toSafeMessage } from '@/utils/safeError';
import { logger } from '@/utils/logger';
import { useUserStore } from './useUserStore';
import { useSchedulingStore } from './useSchedulingStore';
import { useWalletStore } from './useWalletStore';
import { useAuditStore } from './useAuditStore';

const TOKEN_KEY = 'ford.auth.token';
const USER_KEY = 'ford.auth.user';

const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 60_000;

export type AuthStatus =
  | 'idle'
  | 'hydrating'
  | 'authenticating'
  | 'authenticated'
  | 'unauthenticated';

type JwtPayload = {
  sub: string;
  role: string;
  iat: number;
  exp: number;
};

function decodeJwtPayload(token: string): JwtPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const b64 = (parts[1] ?? '').replace(/-/g, '+').replace(/_/g, '/');
    const padded = b64.padEnd(b64.length + (4 - (b64.length % 4)) % 4, '=');
    return JSON.parse(atob(padded)) as JwtPayload;
  } catch {
    return null;
  }
}

type AuthState = {
  status: AuthStatus;
  token: string | null;
  user: AuthUser | null;
  error: string | null;
  failedAttempts: number;
  lockedUntil: number | null;
  hydrate: () => Promise<void>;
  login: (payload: LoginPayload) => Promise<void>;
  signup: (payload: SignupPayload) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
};

async function persistSession(token: string, user: AuthUser) {
  await secureStorage.setItem(TOKEN_KEY, token);
  await secureStorage.setItem(USER_KEY, JSON.stringify(user));
}

async function clearSession() {
  await secureStorage.removeItem(TOKEN_KEY);
  await secureStorage.removeItem(USER_KEY);
}

export const useAuthStore = create<AuthState>((set, get) => ({
  status: 'idle',
  token: null,
  user: null,
  error: null,
  failedAttempts: 0,
  lockedUntil: null,

  hydrate: async () => {
    set({ status: 'hydrating' });
    try {
      const [token, rawUser] = await Promise.all([
        secureStorage.getItem(TOKEN_KEY),
        secureStorage.getItem(USER_KEY),
      ]);
      if (token && rawUser) {
        const jwt = decodeJwtPayload(token);
        const now = Math.floor(Date.now() / 1000);
        if (!jwt || jwt.exp < now) {
          await clearSession();
          useAuditStore.getState().log('token_expired');
          logger.security('Token expirado na hidratação — sessão encerrada');
          set({ status: 'unauthenticated', token: null, user: null });
          return;
        }
        set({
          status: 'authenticated',
          token,
          user: JSON.parse(rawUser) as AuthUser,
          error: null,
        });
      } else {
        set({ status: 'unauthenticated', token: null, user: null });
      }
    } catch {
      set({ status: 'unauthenticated', token: null, user: null });
    }
  },

  login: async (payload) => {
    const { failedAttempts, lockedUntil } = get();
    const now = Date.now();

    // Guard: lockout still active (belt-and-suspenders — UI should disable button)
    if (lockedUntil !== null && now < lockedUntil) {
      const remaining = Math.ceil((lockedUntil - now) / 1000);
      throw new Error(`Tente novamente em ${remaining}s.`);
    }

    // Lockout expired — clear and log
    if (lockedUntil !== null && now >= lockedUntil) {
      set({ lockedUntil: null, failedAttempts: 0 });
      useAuditStore.getState().log('lockout_lifted');
    }

    set({ status: 'authenticating', error: null });
    try {
      const { token, user } = await loginApi(payload);
      await persistSession(token, user);
      set({
        status: 'authenticated',
        token,
        user,
        error: null,
        failedAttempts: 0,
        lockedUntil: null,
      });
      useAuditStore.getState().log('login', user.id);
    } catch (err) {
      const nextAttempts = failedAttempts + 1;
      const shouldLock = nextAttempts >= MAX_ATTEMPTS;
      set({
        status: 'unauthenticated',
        error: toSafeMessage(err),
        failedAttempts: shouldLock ? 0 : nextAttempts,
        lockedUntil: shouldLock ? Date.now() + LOCKOUT_DURATION_MS : null,
      });
      useAuditStore.getState().log('login_failed', undefined, { attempt: nextAttempts });
      if (shouldLock) {
        useAuditStore.getState().log('lockout_activated', undefined, {
          duration: LOCKOUT_DURATION_MS / 1000,
        });
        logger.security('Lockout ativado após', MAX_ATTEMPTS, 'tentativas falhas');
      }
      throw err;
    }
  },

  signup: async (payload) => {
    set({ status: 'authenticating', error: null });
    try {
      const { token, user } = await signupApi(payload);
      await persistSession(token, user);
      await useUserStore.getState().clearProfile();
      set({ status: 'authenticated', token, user, error: null });
    } catch (err) {
      set({ status: 'unauthenticated', error: toSafeMessage(err) });
      throw err;
    }
  },

  logout: async () => {
    const user = get().user;
    await clearSession();
    await Promise.all([
      useUserStore.getState().clearProfile(),
      useSchedulingStore.getState().clearBookings(),
      useWalletStore.getState().reset(),
    ]);
    useAuditStore.getState().log('logout', user?.id);
    set({
      status: 'unauthenticated',
      token: null,
      user: null,
      error: null,
      failedAttempts: 0,
      lockedUntil: null,
    });
  },

  clearError: () => set({ error: null }),
}));
