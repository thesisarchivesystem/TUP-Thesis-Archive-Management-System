import api from './api';

export interface StudentDashboardThesis {
  id: string;
  title: string;
  author: string;
  authors?: string[];
  abstract?: string | null;
  submitter_name?: string | null;
  year: string | null;
  college?: string | null;
  department: string;
  program?: string | null;
  category?: string | null;
  categories?: Array<{ id: string; name: string; slug: string }>;
  keywords?: string[];
  view_count: number;
  archived_at?: string | null;
  approved_at?: string | null;
  updated_at?: string | null;
  created_at?: string | null;
}

export interface StudentDailyQuote {
  id: string;
  body: string;
  author: string;
  quote_date: string;
  is_active: boolean;
}

export interface StudentDashboardResponse {
  recent_theses?: StudentDashboardThesis[];
  top_searches?: StudentDashboardThesis[];
  daily_quote?: StudentDailyQuote | null;
}

export interface MySubmission {
  id: string;
  title: string;
  abstract: string;
  status: 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected';
  submittedAt: string | null;
  views: number;
  adviser: {
    name: string;
    email: string;
  } | null;
  rejectionReason?: string;
}

export const studentDashboardService = {
  async getDashboard(): Promise<StudentDashboardResponse> {
    try {
      const response = await api.get<StudentDashboardResponse>('/student/dashboard');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch student dashboard:', error);
      throw error;
    }
  },

  async getMySubmissions(): Promise<MySubmission[]> {
    try {
      const response = await api.get('/student/my-submissions');
      return response.data.data || response.data || [];
    } catch (error) {
      console.error('Failed to fetch my submissions:', error);
      throw error;
    }
  },
};
