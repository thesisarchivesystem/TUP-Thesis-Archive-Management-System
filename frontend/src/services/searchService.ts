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

export type SearchFilters = {
  year?: string;
  category?: string;
  program?: string;
  department?: string;
};

export type SearchFilterOptionsResponse = {
  years: string[];
  categories: string[];
  programs: string[];
  departments: string[];
};

export const searchService = {
  async search(query: string, filters: SearchFilters = {}) {
    const params = {
      q: query,
      ...Object.fromEntries(
        Object.entries(filters)
          .map(([key, value]) => [key, value?.trim() ?? ''])
          .filter(([, value]) => value !== ''),
      ),
    };

    const { data } = await api.get<SearchResponse>('/search', { params });
    return data;
  },

  async getFilterOptions() {
    const { data } = await api.get<SearchFilterOptionsResponse>('/search/filter-options');
    return {
      years: data.years ?? [],
      categories: data.categories ?? [],
      programs: data.programs ?? [],
      departments: data.departments ?? [],
    };
  },

  async trackClick(thesisId: string, query: string) {
    const { data } = await api.post('/search/click', {
      thesis_id: thesisId,
      query,
    });
    return data;
  },
};
