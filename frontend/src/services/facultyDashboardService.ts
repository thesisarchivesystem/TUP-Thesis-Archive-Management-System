import api from './api';

export interface FacultyDashboardStats {
  assignedStudents: number;
  pendingReviews: number;
  approvedThesis: number;
  totalSubmissions: number;
}

export interface Submission {
  id: string;
  title: string;
  studentName: string;
  studentEmail: string;
  status: 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected';
  submittedAt: string;
  views: number;
}

export const facultyDashboardService = {
  async getDashboard(): Promise<FacultyDashboardStats> {
    try {
      const response = await api.get('/faculty/dashboard');
      return response.data.data || response.data;
    } catch (error) {
      console.error('Failed to fetch faculty dashboard:', error);
      throw error;
    }
  },

  async getRecentSubmissions(): Promise<Submission[]> {
    try {
      const response = await api.get('/faculty/thesis-submissions');
      return response.data.data || response.data || [];
    } catch (error) {
      console.error('Failed to fetch recent submissions:', error);
      throw error;
    }
  },
};
