import { create } from 'zustand';

interface ThemeState {
  theme: 'light' | 'dark';
  toggle: () => void;
  setTheme: (t: 'light' | 'dark') => void;
}

// Initialize theme from localStorage safely
const getInitialTheme = (): 'light' | 'dark' => {
  try {
    const saved = localStorage.getItem('tams-theme-value');
    if (saved === 'light' || saved === 'dark') {
      return saved;
    }
  } catch (e) {
    // localStorage quota exceeded or not available
  }

  // Default to the archive's primary light presentation unless a user explicitly changes it.
  return 'light';
};

const saveThemeToStorage = (theme: 'light' | 'dark') => {
  try {
    localStorage.setItem('tams-theme-value', theme);
  } catch (e) {
    // Storage quota exceeded - silently fail, theme will still work in memory
    console.warn('Unable to save theme preference to storage');
  }
};

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: getInitialTheme(),
  toggle: () => {
    const next = get().theme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', next);
    saveThemeToStorage(next);
    set({ theme: next });
  },
  setTheme: (t) => {
    document.documentElement.setAttribute('data-theme', t);
    saveThemeToStorage(t);
    set({ theme: t });
  },
}));
