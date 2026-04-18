import api from './api';

export interface FacultyActivitySummary {
  actions_today: number;
  approvals: number;
  files_shared: number;
  notes_added: number;
  last_activity: string;
}

export interface FacultyActivityRow {
  id: string;
  badge: string;
  tone: 'maroon' | 'sky' | 'sage' | 'terracotta' | 'gold';
  request_record: string;
  account: string;
  department: string;
  time: string;
  timestamp: string;
  action: string;
}

export interface FacultyActivityLogResponse {
  summary: FacultyActivitySummary;
  logs: FacultyActivityRow[];
}

export const facultyActivityService = {
  async getActivityLog(): Promise<FacultyActivityLogResponse> {
    const response = await api.get('/faculty/activity-log');
    return response.data.data ?? response.data;
  },
};
