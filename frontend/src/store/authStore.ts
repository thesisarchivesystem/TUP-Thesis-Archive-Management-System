import { create } from 'zustand';
import type { User, UserRole } from '../types/user.types';

type StoredAuthState = {
  user: User | null;
  token: string | null;
  rememberMe: boolean;
};

type ForcedLogoutNotice = {
  title: string;
  message: string;
  redirectPath: string;
};

interface AuthState extends StoredAuthState {
  forcedLogoutNotice: ForcedLogoutNotice | null;
  setAuth: (user: User, token: string, rememberMe?: boolean) => void;
  updateUser: (updates: Partial<User>) => void;
  showForcedLogoutNotice: (message?: string) => void;
  logout: () => void;
}

const LOCAL_STORAGE_KEY = 'tams-auth';
const SESSION_STORAGE_KEY = 'tams-auth-session';
const DEFAULT_FORCED_LOGOUT_MESSAGE = 'Your account has been disabled, so this browser session will be logged out.';

export function getLoginPathForRole(role?: UserRole | null) {
  if (role === 'admin') {
    return '/admin/login';
  }

  if (role === 'student') {
    return '/sign-in/student';
  }

  return '/sign-in/faculty';
}

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
  forcedLogoutNotice: null,
  setAuth: (user, token, rememberMe = false) => {
    persistAuth(user, token, rememberMe);
    set({ user, token, rememberMe, forcedLogoutNotice: null });
  },
  updateUser: (updates) => {
    set((state) => {
      if (!state.user || !state.token) {
        return state;
      }

      const nextUser = { ...state.user, ...updates };
      persistAuth(nextUser, state.token, state.rememberMe);

      return { user: nextUser };
    });
  },
  showForcedLogoutNotice: (message) => {
    set((state) => {
      if (!state.user || state.forcedLogoutNotice) {
        return state;
      }

      return {
        forcedLogoutNotice: {
          title: 'Account Disabled',
          message: message?.trim() || DEFAULT_FORCED_LOGOUT_MESSAGE,
          redirectPath: getLoginPathForRole(state.user.role),
        },
      };
    });
  },
  logout: () => {
    clearStoredAuth();
    set({ user: null, token: null, rememberMe: false, forcedLogoutNotice: null });
  },
}));
