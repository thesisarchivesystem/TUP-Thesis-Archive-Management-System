import api from './api';

export interface FacultyLibraryStats {
  total_files: number;
  shared_libraries: number;
  files_needing_review: number;
  storage_used: number;
  last_sync?: string | null;
}

export interface ShareUserOption {
  id: string;
  name: string;
  email: string;
  role: 'vpaa' | 'faculty' | 'student';
  department?: string | null;
  college?: string | null;
}

export interface FacultyLibraryItem {
  id: string;
  title: string;
  type: string;
  author: string;
  department: string;
  college?: string | null;
  program?: string | null;
  category?: string | null;
  year?: string | null;
  file_url?: string | null;
  file_name?: string | null;
  is_draft: boolean;
  share_scope: string;
  share_scope_label: string;
  shared_with_count?: number | null;
  shared_with_users: ShareUserOption[];
  created_at?: string | null;
  shared_at?: string | null;
}

export interface FacultyLibraryResponse {
  department: string;
  college?: string | null;
  stats: FacultyLibraryStats;
  items: FacultyLibraryItem[];
  share_options?: {
    scopes: Array<{ value: string; label: string }>;
  };
}

export interface FacultyLibraryPayload {
  title: string;
  resource_type: string;
  abstract?: string;
  keywords?: string[];
  program?: string;
  category_id: string;
  school_year: string;
  authors?: string[];
  share_scope: 'all_colleges' | 'all_departments' | 'specific_college' | 'specific_department' | 'specific_users';
  target_college?: string;
  target_department?: string;
  recipient_ids?: string[];
  is_draft?: boolean;
  file?: File | null;
  file_url?: string;
  file_name?: string;
}

export const facultyLibraryService = {
  async getLibrary(): Promise<FacultyLibraryResponse> {
    const response = await api.get<{ data: FacultyLibraryResponse }>('/faculty/library-items');
    return response.data.data;
  },

  async searchUsers(search: string): Promise<ShareUserOption[]> {
    const response = await api.get<{ data: ShareUserOption[] }>('/faculty/share-users', {
      params: { search },
    });

    return response.data.data ?? [];
  },

  async createLibraryItem(payload: FacultyLibraryPayload) {
    const formData = new FormData();
    formData.append('title', payload.title);
    formData.append('resource_type', payload.resource_type);
    formData.append('category_id', payload.category_id);
    formData.append('school_year', payload.school_year);
    formData.append('share_scope', payload.share_scope);
    formData.append('is_draft', payload.is_draft ? '1' : '0');

    if (payload.abstract) formData.append('abstract', payload.abstract);
    if (payload.program) formData.append('program', payload.program);
    if (payload.target_college) formData.append('target_college', payload.target_college);
    if (payload.target_department) formData.append('target_department', payload.target_department);
    if (payload.file) formData.append('file', payload.file);
    if (payload.file_url) formData.append('file_url', payload.file_url);
    if (payload.file_name) formData.append('file_name', payload.file_name);

    payload.keywords?.forEach((keyword) => formData.append('keywords[]', keyword));
    payload.authors?.forEach((author) => formData.append('authors[]', author));
    payload.recipient_ids?.forEach((id) => formData.append('recipient_ids[]', id));

    const response = await api.post('/faculty/library-items', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
};
