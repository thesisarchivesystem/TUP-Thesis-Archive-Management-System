import api from './api';

export interface StudentDashboardStats {
  mySubmissions: number;
  totalViews: number;
  pendingReview: number;
  approved: number;
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
  async getDashboard(): Promise<StudentDashboardStats> {
    try {
      const response = await api.get('/student/dashboard');
      return response.data.data || response.data;
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
