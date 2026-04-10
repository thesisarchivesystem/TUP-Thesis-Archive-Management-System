import api from './api';

export interface VpaaDashboardStats {
  totalFaculty: number;
  departmentChairs: number;
  roleChanges: number;
  newAccounts: number;
  onLeave: number;
}

export interface ActivityLogEntry {
  id: string;
  userId: string;
  action: string;
  description: string;
  timestamp: string;
  user?: {
    name: string;
    email: string;
  };
}

export const vpaaDashboardService = {
  async getDashboard(): Promise<VpaaDashboardStats> {
    try {
      const response = await api.get('/vpaa/dashboard');
      return response.data.data || response.data;
    } catch (error) {
      console.error('Failed to fetch VPAA dashboard:', error);
      throw error;
    }
  },

  async getActivityLog(): Promise<ActivityLogEntry[]> {
    try {
      const response = await api.get('/vpaa/activity-log');
      return response.data.data || response.data || [];
    } catch (error) {
      console.error('Failed to fetch activity log:', error);
      throw error;
    }
  },
};
