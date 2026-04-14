import api from './api';
import type { UserRole } from '../types/user.types';

export interface VpaaCategoryThesis {
  id: string;
  title: string;
  author: string;
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

const mapCategoriesResponse = (response: { data: { data?: { categories?: VpaaCategory[] } | VpaaCategory[]; categories?: VpaaCategory[] } }) => {
  const nestedData = response.data.data;

  if (Array.isArray(nestedData)) {
    return nestedData;
  }

  return nestedData?.categories ?? response.data.categories ?? [];
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
