import api from './api';

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

export const vpaaCategoriesService = {
  async list(): Promise<VpaaCategory[]> {
    const response = await api.get('/categories');
    return response.data.data?.categories ?? response.data.categories ?? [];
  },
};
