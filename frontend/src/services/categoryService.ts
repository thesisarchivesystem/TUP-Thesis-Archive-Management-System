import api from './api';

export interface CategoryOption {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
}

export const categoryService = {
  async list(): Promise<CategoryOption[]> {
    const response = await api.get('/categories');
    return response.data.data ?? [];
  },
};
