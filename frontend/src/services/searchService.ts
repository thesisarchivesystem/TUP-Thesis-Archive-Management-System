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
};
