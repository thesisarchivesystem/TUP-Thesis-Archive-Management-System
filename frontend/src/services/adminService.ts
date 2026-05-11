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
  available_years: number[];
  selected_year: number;
  monthly_submissions: Array<{
    month: string;
    value: number;
  }>;
  course_uploads: Array<{
    label: string;
    name: string;
    value: number;
  }>;
  department_uploads?: Array<{
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

export type AdminThesisRecord = AdminDashboardResponse['recent_uploads'][number];

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
  course_id?: string | null;
  course?: string | null;
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
  dean_head?: string | null;
  dean_head_email?: string | null;
  description?: string | null;
  office_location?: string | null;
  contact_number?: string | null;
  is_active: boolean;
  departments: Array<{
    id: string;
    name: string;
    code?: string | null;
    chairperson?: string | null;
    chairperson_email?: string | null;
    description?: string | null;
    office_location?: string | null;
    contact_number?: string | null;
    is_active: boolean;
    programs: Array<{
      id: string;
      name: string;
      code?: string | null;
      coordinator?: string | null;
      contact_email?: string | null;
      description?: string | null;
      curriculum_type?: string | null;
      year_duration?: string | null;
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

export type AdminThesisAttachment = {
  name: string;
  size?: number | null;
  url?: string | null;
  path?: string | null;
};

export type AdminThesisDetail = {
  id: string;
  title: string;
  abstract?: string | null;
  department: string;
  program?: string | null;
  school_year: string;
  category_id?: string | null;
  category_ids: string[];
  categories: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
  authors: string[];
  status: string;
  is_archived?: boolean;
  file_name?: string | null;
  file_size?: number | null;
  file_url?: string | null;
  supplementary_files: AdminThesisAttachment[];
  adviser_id?: string | null;
  adviser_name?: string | null;
  submitter_name?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type AdminThesisPayload = {
  title: string;
  abstract?: string;
  department: string;
  program?: string;
  category_id: string;
  category_ids: string[];
  school_year: string;
  authors: string[];
  adviser_id?: string;
  confirm_original?: boolean;
  allow_review?: boolean;
  manuscript?: File | null;
  supplementary_files?: File[];
};

export type AdminBestThesisCandidate = {
  id: string;
  title: string;
  author: string;
  authors: string[];
  department?: string | null;
  program?: string | null;
  school_year: string;
  category?: string | null;
  status: string;
  view_count: number;
  approved_at?: string | null;
  archived_at?: string | null;
};

export type AdminBestThesisAward = {
  id: string;
  school_year: string;
  remarks?: string | null;
  awarded_at?: string | null;
  awarded_by_name?: string | null;
  thesis: AdminBestThesisCandidate | null;
};

export type AdminBestThesesResponse = {
  school_years: string[];
  selected_school_year: string;
  current_award: AdminBestThesisAward | null;
  awards: AdminBestThesisAward[];
  candidates: AdminBestThesisCandidate[];
};

export type AdminTicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';
export type AdminTicketPriority = 'low' | 'medium' | 'high';

export type AdminTicketAgent = {
  id: string;
  name: string;
  email: string;
};

export type AdminSupportTicketSummary = {
  id: string;
  reference: string;
  requester_role: string;
  full_name: string;
  email: string;
  subject: string;
  category: string;
  message: string;
  attachment_url?: string | null;
  attachment_access_url?: string | null;
  status: AdminTicketStatus;
  priority: AdminTicketPriority;
  submitted_at?: string | null;
  updated_at?: string | null;
  resolved_at?: string | null;
  requester: {
    id?: string | null;
    name: string;
    email: string;
  };
  assignee: AdminTicketAgent | null;
  replies_count: number;
};

export type AdminSupportTicketReply = {
  id: string;
  author_name: string;
  author_role?: string | null;
  message: string;
  is_system: boolean;
  created_at?: string | null;
};

export type AdminSupportTicketDetail = AdminSupportTicketSummary & {
  replies: AdminSupportTicketReply[];
};

export type AdminSupportTicketsResponse = {
  stats: {
    total: number;
    open: number;
    in_progress: number;
    resolved: number;
  };
  agents: AdminTicketAgent[];
  tickets: AdminSupportTicketSummary[];
};

export const adminService = {
  async getDashboard(params?: {
    year?: number;
    recent_uploads_limit?: number;
    recent_activity_limit?: number;
  }): Promise<AdminDashboardResponse> {
    const { data } = await api.get('/admin/dashboard', { params });
    return data.data;
  },

  async getBestTheses(params?: { school_year?: string }): Promise<AdminBestThesesResponse> {
    const { data } = await api.get('/admin/best-theses', {
      params: {
        school_year: params?.school_year || undefined,
      },
    });
    return data.data;
  },

  async listTheses(): Promise<AdminThesisRecord[]> {
    const { data } = await api.get('/admin/theses');
    return data.data ?? [];
  },

  async appointBestThesis(payload: {
    school_year: string;
    thesis_id: string;
    remarks?: string;
  }): Promise<AdminBestThesisAward> {
    const { data } = await api.post('/admin/best-theses', payload);
    return data.data;
  },

  async removeBestThesis(schoolYear: string): Promise<{ message?: string }> {
    const { data } = await api.delete(`/admin/best-theses/${encodeURIComponent(schoolYear)}`);
    return data;
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

  async getThesis(id: string): Promise<AdminThesisDetail> {
    const { data } = await api.get(`/admin/theses/${id}`);
    return data.data;
  },

  async createThesis(payload: AdminThesisPayload): Promise<AdminThesisDetail> {
    const formData = new FormData();
    formData.append('title', payload.title);
    formData.append('abstract', payload.abstract ?? '');
    formData.append('department', payload.department);
    formData.append('program', payload.program ?? '');
    formData.append('category_id', payload.category_id);
    formData.append('category_ids', JSON.stringify(payload.category_ids));
    formData.append('school_year', payload.school_year);
    formData.append('authors', JSON.stringify(payload.authors));
    formData.append('adviser_id', payload.adviser_id ?? '');
    formData.append('confirm_original', payload.confirm_original ? '1' : '0');
    formData.append('allow_review', payload.allow_review ? '1' : '0');

    if (payload.manuscript) {
      formData.append('manuscript', payload.manuscript);
    }

    (payload.supplementary_files ?? []).forEach((file) => {
      formData.append('supplementary_files[]', file);
    });

    const { data } = await api.post('/admin/theses', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return data.data;
  },

  async updateThesis(id: string, payload: AdminThesisPayload): Promise<AdminThesisDetail> {
    const formData = new FormData();
    formData.append('title', payload.title);
    formData.append('abstract', payload.abstract ?? '');
    formData.append('department', payload.department);
    formData.append('program', payload.program ?? '');
    formData.append('category_id', payload.category_id);
    formData.append('category_ids', JSON.stringify(payload.category_ids));
    formData.append('school_year', payload.school_year);
    formData.append('authors', JSON.stringify(payload.authors));
    formData.append('adviser_id', payload.adviser_id ?? '');
    formData.append('_method', 'PATCH');

    if (payload.manuscript) {
      formData.append('manuscript', payload.manuscript);
    }

    (payload.supplementary_files ?? []).forEach((file) => {
      formData.append('supplementary_files[]', file);
    });

    const { data } = await api.post(`/admin/theses/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return data.data;
  },

  async createCategory(payload: Record<string, unknown>) {
    const { data } = await api.post('/admin/categories', payload);
    return data.data as AdminCategory;
  },

  async updateCategory(id: string, payload: Record<string, unknown>) {
    const { data } = await api.put(`/admin/categories/${id}`, payload);
    return data.data as AdminCategory;
  },

  async listSupportTickets(params?: {
    search?: string;
    status?: string;
    priority?: string;
  }): Promise<AdminSupportTicketsResponse> {
    const { data } = await api.get('/admin/support-tickets', {
      params: {
        search: params?.search || undefined,
        status: params?.status || undefined,
        priority: params?.priority || undefined,
      },
    });
    return data.data;
  },

  async getSupportTicket(id: string): Promise<AdminSupportTicketDetail> {
    const { data } = await api.get(`/admin/support-tickets/${id}`);
    return data.data;
  },

  async updateSupportTicket(id: string, payload: {
    status?: AdminTicketStatus;
    priority?: AdminTicketPriority;
    assigned_to?: string | null;
  }): Promise<AdminSupportTicketDetail> {
    const { data } = await api.patch(`/admin/support-tickets/${id}`, payload);
    return data.data;
  },

  async replySupportTicket(id: string, payload: { message: string }): Promise<AdminSupportTicketDetail> {
    const { data } = await api.post(`/admin/support-tickets/${id}/replies`, payload);
    return data.data;
  },
};
