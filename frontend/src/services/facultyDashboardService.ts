import api from './api';

export interface FacultyDashboardStats {
  assigned_students: number;
  pending_reviews: number;
  approved_thesis: number;
  rejected_thesis: number;
  total_submissions: number;
}

export interface FacultyDashboardThesis {
  id: string;
  title: string;
  author: string;
  submitter_name?: string | null;
  year: string | null;
  department: string;
  program?: string | null;
  category?: string | null;
  view_count: number;
  approved_at?: string | null;
  created_at?: string | null;
}

export interface FacultyDailyQuote {
  id: string;
  body: string;
  author: string;
  quote_date: string;
  is_active: boolean;
}

export interface FacultyDashboardResponse {
  stats?: FacultyDashboardStats;
  recent_theses?: FacultyDashboardThesis[];
  top_searches?: FacultyDashboardThesis[];
  daily_quote?: FacultyDailyQuote | null;
}

interface FacultySubmissionApiRecord {
  id: string;
  title: string;
  status: 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected';
  submitted_at?: string | null;
  created_at?: string | null;
  submitter?: {
    name?: string | null;
  } | null;
}

interface FacultySubmissionListResponse {
  data?: FacultySubmissionApiRecord[];
}

export interface FacultySubmission {
  id: string;
  title: string;
  status: 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected';
  submitterName: string;
  submittedAt: string | null;
  submittedAtLabel: string;
}

const formatSubmissionDate = (value?: string | null) => {
  if (!value) return 'Recently updated';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Recently updated';

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

export const facultyDashboardService = {
  async getDashboard(): Promise<FacultyDashboardResponse> {
    try {
      const response = await api.get<FacultyDashboardResponse>('/faculty/dashboard');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch faculty dashboard:', error);
      throw error;
    }
  },

  async getRecentSubmissions(): Promise<FacultySubmission[]> {
    try {
      const response = await api.get<FacultySubmissionListResponse>('/faculty/thesis-submissions');
      return (response.data.data ?? []).map((submission) => {
        const submittedAt = submission.submitted_at ?? submission.created_at ?? null;

        return {
          id: submission.id,
          title: submission.title,
          status: submission.status,
          submitterName: submission.submitter?.name ?? 'Student',
          submittedAt,
          submittedAtLabel: formatSubmissionDate(submittedAt),
        };
      });
    } catch (error) {
      console.error('Failed to fetch recent submissions:', error);
      throw error;
    }
  },
};
