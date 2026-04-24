import api from './api';
import type { UserRole } from '../types/user.types';

export interface VpaaCategoryThesis {
  id: string;
  title: string;
  author: string;
  authors?: string[];
  abstract?: string | null;
  year: string | number | null;
  department: string;
  program?: string | null;
  school_year?: string | null;
  keywords: string[];
  approved_at?: string | null;
}

export interface VpaaCategory {
  id: string;
  slug: string;
  label: string;
  description?: string | null;
  document_count: number;
  updated_at?: string | null;
  theses: VpaaCategoryThesis[];
}

interface RawCategoryThesis {
  id?: string;
  title?: string;
  author?: string;
  authors?: string[];
  abstract?: string | null;
  year?: string | number | null;
  department?: string;
  program?: string | null;
  school_year?: string | null;
  keywords?: string[];
  approved_at?: string | null;
  created_at?: string | null;
}

interface RawCategory {
  id?: string;
  slug?: string;
  label?: string;
  name?: string;
  description?: string | null;
  document_count?: number;
  thesis_count?: number;
  updated_at?: string | null;
  latest_approved_at?: string | null;
  theses?: RawCategoryThesis[];
}

interface CategoriesResponseShape {
  data?: {
    data?: { categories?: RawCategory[] } | RawCategory[];
    categories?: RawCategory[];
  };
}

const normalizeThesis = (thesis: RawCategoryThesis): VpaaCategoryThesis => ({
  id: thesis.id ?? crypto.randomUUID(),
  title: thesis.title ?? 'Untitled thesis',
  author: thesis.author ?? thesis.authors?.filter(Boolean).join(', ') ?? 'Unknown author',
  authors: Array.isArray(thesis.authors) ? thesis.authors.filter(Boolean) : [],
  abstract: thesis.abstract ?? null,
  year: thesis.year ?? null,
  department: thesis.department ?? 'Unknown department',
  program: thesis.program ?? null,
  school_year: thesis.school_year ?? null,
  keywords: Array.isArray(thesis.keywords) ? thesis.keywords.filter(Boolean) : [],
  approved_at: thesis.approved_at ?? thesis.created_at ?? null,
});

const normalizeCategory = (category: RawCategory): VpaaCategory => ({
  id: category.id ?? crypto.randomUUID(),
  slug: category.slug ?? '',
  label: category.label ?? category.name ?? 'Uncategorized',
  description: category.description ?? null,
  document_count: Number(category.document_count ?? category.thesis_count ?? 0),
  updated_at: category.updated_at ?? category.latest_approved_at ?? null,
  theses: Array.isArray(category.theses) ? category.theses.map(normalizeThesis) : [],
});

const mapCategoriesResponse = (response: CategoriesResponseShape): VpaaCategory[] => {
  const payload = response.data;
  const nestedData = payload?.data;
  const rawCategories = Array.isArray(nestedData)
    ? nestedData
    : nestedData?.categories ?? payload?.categories ?? [];

  return rawCategories
    .filter((category): category is RawCategory => Boolean(category))
    .map(normalizeCategory)
    .filter((category) => Boolean(category.slug));
};

export const vpaaCategoriesService = {
  async list(role?: UserRole | null): Promise<VpaaCategory[]> {
    const endpoints = role === 'vpaa'
      ? ['/vpaa/categories', '/categories']
      : ['/categories'];

    let lastError: unknown;

    for (const endpoint of endpoints) {
      try {
        const response = await api.get(endpoint);
        return mapCategoriesResponse(response);
      } catch (error) {
        lastError = error;
      }
    }

    throw lastError;
  },
};
