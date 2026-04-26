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
  user_id: string | null;
  badge: string;
  tone: 'maroon' | 'sky' | 'sage' | 'terracotta' | 'gold';
  request_record: string;
  account: string;
  role: string;
  college: string;
  department: string;
  time: string;
  timestamp: string;
  action: string;
}

export interface FacultyActivityLogResponse {
  summary: FacultyActivitySummary;
  departments: string[];
  logs: FacultyActivityRow[];
}

export const facultyActivityService = {
  async getActivityLog(q?: string): Promise<FacultyActivityLogResponse> {
    const response = await api.get('/faculty/activity-log', {
      params: q?.trim() ? { q: q.trim() } : undefined,
    });
    return response.data.data ?? response.data;
  },
};
