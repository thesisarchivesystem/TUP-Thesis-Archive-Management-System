import api from './api';

export type SearchResultItem = {
  id: string;
  title: string;
  college?: string | null;
  department: string;
  program?: string | null;
  author?: string;
  year?: string | null;
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
    slug?: string;
  };
  categories?: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
};

export type SearchUserContributionItem = {
  id: string;
  title: string;
  type: string;
  status: string;
  created_at?: string | null;
};

export type SearchUserItem = {
  id: string;
  name: string;
  email: string;
  role: 'vpaa' | 'faculty' | 'student';
  role_label: string;
  department?: string | null;
  college?: string | null;
  program?: string | null;
  contributions: {
    theses: number;
    approved_theses: number;
    shared_files: number;
  };
  recent_contributions: {
    theses: SearchUserContributionItem[];
    shared_files: SearchUserContributionItem[];
  };
};

export type SearchResponse = {
  results: {
    theses: SearchResultItem[];
    users: SearchUserItem[];
  };
};

export const searchService = {
  async search(query: string) {
    const { data } = await api.get<SearchResponse>('/search', { params: { q: query } });
    return data;
  },

  async trackClick(thesisId: string, query: string) {
    const { data } = await api.post('/search/click', {
      thesis_id: thesisId,
      query,
    });
    return data;
  },
};
