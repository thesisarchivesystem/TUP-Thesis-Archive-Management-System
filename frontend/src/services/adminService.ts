import api from './api';

export type AdminDashboardResponse = {
  stats: Record<string, number>;
  dashboard_metrics: {
    total_theses: number;
    approved: number;
    under_review: number;
    revisions_needed: number;
    monthly_growth_percentage: number;
  };
  monthly_submissions: Array<{
    month: string;
    value: number;
  }>;
  department_uploads: Array<{
    label: string;
    name: string;
    value: number;
  }>;
  recent_uploads: Array<{
    id: string;
    title: string;
    author: string;
    category?: string | null;
    status: string;
    department?: string | null;
    program?: string | null;
    created_at?: string | null;
  }>;
  recent_activity: Array<{
    id: string;
    title: string;
    actor: string;
    action: string;
    tone: 'green' | 'blue' | 'orange' | 'rose';
    timestamp?: string | null;
    relative_time?: string | null;
  }>;
  system_statistics: Record<string, number>;
};

export type AdminManagedUser = {
  id: string;
  name: string;
  first_name: string;
  last_name: string;
  suffix?: string | null;
  email: string;
  role: 'faculty' | 'student';
  is_active: boolean;
  faculty_id?: string | null;
  student_id?: string | null;
  college_id?: string | null;
  college?: string | null;
  department_id?: string | null;
  department?: string | null;
  program_id?: string | null;
  program?: string | null;
  section_id?: string | null;
  section?: string | null;
  year_level?: number | null;
  rank?: string | null;
  faculty_role?: string | null;
  created_at?: string | null;
};

export type AdminStructureCollege = {
  id: string;
  name: string;
  code?: string | null;
  is_active: boolean;
  departments: Array<{
    id: string;
    name: string;
    code?: string | null;
    is_active: boolean;
    programs: Array<{
      id: string;
      name: string;
      code?: string | null;
      is_active: boolean;
      sections: Array<{
        id: string;
        name: string;
        code?: string | null;
        is_active: boolean;
      }>;
    }>;
  }>;
};

export type AdminCategory = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  sort_order: number;
  is_active: boolean;
};

export const adminService = {
  async getDashboard(): Promise<AdminDashboardResponse> {
    const { data } = await api.get('/admin/dashboard');
    return data.data;
  },

  async listUsers(role?: 'faculty' | 'student', search?: string): Promise<AdminManagedUser[]> {
    const { data } = await api.get('/admin/users', {
      params: {
        role: role || undefined,
        search: search || undefined,
      },
    });
    return data.data ?? [];
  },

  async createUser(payload: Record<string, unknown>) {
    const { data } = await api.post('/admin/users', payload);
    return data.data as AdminManagedUser;
  },

  async updateUser(id: string, payload: Record<string, unknown>) {
    const { data } = await api.put(`/admin/users/${id}`, payload);
    return data.data as AdminManagedUser;
  },

  async updateUserStatus(id: string, is_active: boolean) {
    const { data } = await api.patch(`/admin/users/${id}/status`, { is_active });
    return data.data as AdminManagedUser;
  },

  async listStructure(): Promise<AdminStructureCollege[]> {
    const { data } = await api.get('/admin/structure');
    return data.data ?? [];
  },

  async createCollege(payload: Record<string, unknown>) {
    const { data } = await api.post('/admin/colleges', payload);
    return data.data;
  },

  async updateCollege(id: string, payload: Record<string, unknown>) {
    const { data } = await api.put(`/admin/colleges/${id}`, payload);
    return data.data;
  },

  async createDepartment(payload: Record<string, unknown>) {
    const { data } = await api.post('/admin/departments', payload);
    return data.data;
  },

  async updateDepartment(id: string, payload: Record<string, unknown>) {
    const { data } = await api.put(`/admin/departments/${id}`, payload);
    return data.data;
  },

  async createProgram(payload: Record<string, unknown>) {
    const { data } = await api.post('/admin/programs', payload);
    return data.data;
  },

  async updateProgram(id: string, payload: Record<string, unknown>) {
    const { data } = await api.put(`/admin/programs/${id}`, payload);
    return data.data;
  },

  async createSection(payload: Record<string, unknown>) {
    const { data } = await api.post('/admin/sections', payload);
    return data.data;
  },

  async updateSection(id: string, payload: Record<string, unknown>) {
    const { data } = await api.put(`/admin/sections/${id}`, payload);
    return data.data;
  },

  async listCategories(): Promise<AdminCategory[]> {
    const { data } = await api.get('/admin/categories');
    return data.data ?? [];
  },

  async createCategory(payload: Record<string, unknown>) {
    const { data } = await api.post('/admin/categories', payload);
    return data.data as AdminCategory;
  },

  async updateCategory(id: string, payload: Record<string, unknown>) {
    const { data } = await api.put(`/admin/categories/${id}`, payload);
    return data.data as AdminCategory;
  },
};
