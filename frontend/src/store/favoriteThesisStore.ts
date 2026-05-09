import { create } from 'zustand';

export type FavoriteRole = 'vpaa' | 'faculty' | 'student' | 'admin';

export type FavoriteThesis = {
  id: string;
  role: FavoriteRole;
  title: string;
  author: string;
  authors?: string[];
  submitter_name?: string | null;
  college?: string | null;
  department: string;
  program?: string | null;
  category?: string | null;
  categories?: Array<{ id?: string; name: string; slug?: string }>;
  keywords?: string[];
  year?: string | null;
  school_year?: string | null;
  archived_at?: string | null;
  approved_at?: string | null;
  updated_at?: string | null;
  created_at?: string | null;
  status?: string | null;
  favorited_at: string;
};

const FAVORITE_THESES_STORAGE_KEY = 'tams-favorite-theses';

const readFavoriteTheoriesFromStorage = (): FavoriteThesis[] => {
  try {
    const raw = localStorage.getItem(FAVORITE_THESES_STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed.filter((item): item is FavoriteThesis =>
      item
      && typeof item === 'object'
      && typeof item.id === 'string'
      && typeof item.role === 'string'
      && typeof item.title === 'string'
      && typeof item.department === 'string'
      && typeof item.author === 'string'
      && typeof item.favorited_at === 'string');
  } catch {
    return [];
  }
};

const saveFavoriteTheoriesToStorage = (favorites: FavoriteThesis[]) => {
  try {
    localStorage.setItem(FAVORITE_THESES_STORAGE_KEY, JSON.stringify(favorites));
  } catch {
    // Keep working in memory if storage is unavailable.
  }
};

type FavoriteThesisState = {
  favorites: FavoriteThesis[];
  toggleFavorite: (favorite: Omit<FavoriteThesis, 'favorited_at'>) => boolean;
  removeFavorite: (role: FavoriteRole, thesisId: string) => void;
  isFavorite: (role: FavoriteRole, thesisId: string) => boolean;
};

export const useFavoriteThesisStore = create<FavoriteThesisState>((set, get) => ({
  favorites: readFavoriteTheoriesFromStorage(),
  toggleFavorite: (favorite) => {
    const currentFavorites = get().favorites;
    const existingFavorite = currentFavorites.find((item) => item.role === favorite.role && item.id === favorite.id);

    if (existingFavorite) {
      const nextFavorites = currentFavorites.filter((item) => !(item.role === favorite.role && item.id === favorite.id));
      saveFavoriteTheoriesToStorage(nextFavorites);
      set({ favorites: nextFavorites });
      return false;
    }

    const nextFavorite: FavoriteThesis = {
      ...favorite,
      favorited_at: new Date().toISOString(),
    };
    const nextFavorites = [nextFavorite, ...currentFavorites];

    saveFavoriteTheoriesToStorage(nextFavorites);
    set({ favorites: nextFavorites });
    return true;
  },
  removeFavorite: (role, thesisId) => {
    const nextFavorites = get().favorites.filter((item) => !(item.role === role && item.id === thesisId));
    saveFavoriteTheoriesToStorage(nextFavorites);
    set({ favorites: nextFavorites });
  },
  isFavorite: (role, thesisId) => get().favorites.some((item) => item.role === role && item.id === thesisId),
}));
