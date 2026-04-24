import api from './api';

export interface ActivityLogEntry {
  id: string;
  userId: string;
  action: string;
  description: string;
  timestamp: string;
  user?: {
    name: string;
    avatar_url?: string | null;
  };
}

export interface VpaaActivitySummary {
  actions_today: number;
  approvals: number;
  account_updates: number;
  last_activity: string;
}

export interface VpaaActivityRow {
  id: string;
  user_id?: string | null;
  badge: string;
  tone: 'maroon' | 'sky' | 'sage' | 'terracotta' | 'gold';
  request_record: string;
  account: string;
  role: string;
  college: string;
  time: string;
  timestamp: string;
  action: string;
}

export interface VpaaActivityLogResponse {
  summary: VpaaActivitySummary;
  colleges?: string[];
  logs: VpaaActivityRow[];
}

export interface VpaaDashboardStats {
  total_faculty: number;
  deans: number;
  role_changes_this_month: number;
  new_accounts_this_month: number;
  on_leave: number;
}

export interface VpaaDashboardThesis {
  id: string;
  title: string;
  author: string;
  year: string | null;
  department: string;
  program?: string | null;
  category?: string | null;
  keywords?: string[];
  view_count: number;
  approved_at?: string | null;
}

export interface DailyQuote {
  id: string;
  body: string;
  author: string;
  quote_date: string;
  is_active: boolean;
}

export interface VpaaDashboardResponse {
  stats: VpaaDashboardStats;
  recent_activity: ActivityLogEntry[];
  recent_theses: VpaaDashboardThesis[];
  top_searches: VpaaDashboardThesis[];
}

export const vpaaDashboardService = {
  async getDashboard(): Promise<VpaaDashboardResponse> {
    try {
      const response = await api.get('/vpaa/dashboard');
      return response.data.data || response.data;
    } catch (error) {
      console.error('Failed to fetch VPAA dashboard:', error);
      throw error;
    }
  },

  async getActivityLog(): Promise<VpaaActivityLogResponse> {
    try {
      const response = await api.get('/vpaa/activity-log');
      return response.data.data || response.data;
    } catch (error) {
      console.error('Failed to fetch activity log:', error);
      throw error;
    }
  },

  async getDailyQuote(): Promise<DailyQuote | null> {
    try {
      const response = await api.get('/vpaa/daily-quote');
      return response.data.data ?? null;
    } catch (error) {
      console.error('Failed to fetch daily quote:', error);
      throw error;
    }
  },
};
