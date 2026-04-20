import api from './api';

export type SearchResultItem = {
  id: string;
  title: string;
  department: string;
  program?: string | null;
  authors?: string[];
  keywords?: string[];
  created_at?: string;
  submitter?: {
    id: string;
    name: string;
  };
  category?: {
    id: string;
    name: string;
  };
};

export const searchService = {
  async search(query: string) {
    const { data } = await api.get<{ results: SearchResultItem[] }>('/search', { params: { q: query } });
    return data;
  },
};
