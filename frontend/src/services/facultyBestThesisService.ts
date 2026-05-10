import api from './api';

export type FacultyBestThesisCandidate = {
  id: string;
  title: string;
  author: string;
  authors: string[];
  adviser_name?: string | null;
  school_year: string;
  department?: string | null;
  program?: string | null;
  category?: string | null;
  categories?: Array<{ id: string; name: string; slug?: string }>;
  archived_at?: string | null;
};

export type FacultyBestThesisAward = {
  id: string;
  school_year: string;
  status: 'appointed';
  awarded_by_name?: string | null;
  awarded_at?: string | null;
  thesis: FacultyBestThesisCandidate;
};

export type FacultyBestThesisResponse = {
  school_years: string[];
  selected_school_year: string;
  current_award: FacultyBestThesisAward | null;
  candidates: FacultyBestThesisCandidate[];
  history: FacultyBestThesisAward[];
};

export const facultyBestThesisService = {
  async getBestTheses(params?: { school_year?: string }): Promise<FacultyBestThesisResponse> {
    const { data } = await api.get('/faculty/best-theses', {
      params: {
        school_year: params?.school_year || undefined,
      },
    });

    return data.data;
  },

  async appointBestThesis(payload: { school_year: string; thesis_id: string }): Promise<FacultyBestThesisAward> {
    const { data } = await api.post('/faculty/best-theses', payload);
    return data.data;
  },
};
