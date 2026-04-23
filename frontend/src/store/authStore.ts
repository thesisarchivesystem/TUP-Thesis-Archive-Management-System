import { create } from 'zustand';
import type { User } from '../types/user.types';

type StoredAuthState = {
  user: User | null;
  token: string | null;
  rememberMe: boolean;
};

interface AuthState extends StoredAuthState {
  setAuth: (user: User, token: string, rememberMe?: boolean) => void;
  logout: () => void;
}

const LOCAL_STORAGE_KEY = 'tams-auth';
const SESSION_STORAGE_KEY = 'tams-auth-session';

function parseStoredValue(value: string | null): { user: User | null; token: string | null } | null {
  if (!value) return null;

  try {
    const parsed = JSON.parse(value);

    if (parsed && typeof parsed === 'object' && 'state' in parsed) {
      return {
        user: parsed.state?.user ?? null,
        token: parsed.state?.token ?? null,
      };
    }

    return {
      user: parsed?.user ?? null,
      token: parsed?.token ?? null,
    };
  } catch {
    return null;
  }
}

function readStoredAuth(): StoredAuthState {
  if (typeof window === 'undefined') {
    return { user: null, token: null, rememberMe: false };
  }

  const sessionAuth = parseStoredValue(window.sessionStorage.getItem(SESSION_STORAGE_KEY));
  if (sessionAuth?.token) {
    return { ...sessionAuth, rememberMe: false };
  }

  const localAuth = parseStoredValue(window.localStorage.getItem(LOCAL_STORAGE_KEY));
  if (localAuth?.token) {
    return { ...localAuth, rememberMe: true };
  }

  return { user: null, token: null, rememberMe: false };
}

function persistAuth(user: User, token: string, rememberMe: boolean) {
  if (typeof window === 'undefined') return;

  const payload = JSON.stringify({ user, token });

  if (rememberMe) {
    window.localStorage.setItem(LOCAL_STORAGE_KEY, payload);
    window.sessionStorage.removeItem(SESSION_STORAGE_KEY);
    return;
  }

  window.sessionStorage.setItem(SESSION_STORAGE_KEY, payload);
  window.localStorage.removeItem(LOCAL_STORAGE_KEY);
}

function clearStoredAuth() {
  if (typeof window === 'undefined') return;

  window.localStorage.removeItem(LOCAL_STORAGE_KEY);
  window.sessionStorage.removeItem(SESSION_STORAGE_KEY);
}

const initialAuthState = readStoredAuth();

export const useAuthStore = create<AuthState>()((set) => ({
  ...initialAuthState,
  setAuth: (user, token, rememberMe = false) => {
    persistAuth(user, token, rememberMe);
    set({ user, token, rememberMe });
  },
  logout: () => {
    clearStoredAuth();
    set({ user: null, token: null, rememberMe: false });
  },
}));
