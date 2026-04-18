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
    const nestedData = response.data?.data;

    if (Array.isArray(nestedData)) {
      return nestedData;
    }

    return nestedData?.categories?.map((category: { id: string; label?: string; name?: string; slug: string; description?: string | null }) => ({
      id: category.id,
      name: category.label ?? category.name ?? 'Uncategorized',
      slug: category.slug,
      description: category.description ?? null,
    })) ?? [];
  },
};
