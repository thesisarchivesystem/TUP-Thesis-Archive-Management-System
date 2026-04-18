import api from './api';

export interface FacultyLibraryStats {
  total_files: number;
  shared_libraries: number;
  files_needing_review: number;
  storage_used: number;
  last_sync?: string | null;
}

export interface FacultyLibraryItem {
  id: string;
  title: string;
  author: string;
  department: string;
  program?: string | null;
  category?: string | null;
  year?: string | null;
  file_url?: string | null;
  file_name?: string | null;
  created_at?: string | null;
}

export interface FacultyLibraryResponse {
  department: string;
  stats: FacultyLibraryStats;
  items: FacultyLibraryItem[];
}

export interface FacultyLibraryPayload {
  title: string;
  abstract?: string;
  keywords?: string[];
  program?: string;
  category_id: string;
  school_year: string;
  authors?: string[];
  file_url?: string;
  file_name?: string;
}

export const facultyLibraryService = {
  async getLibrary(): Promise<FacultyLibraryResponse> {
    const response = await api.get<{ data: FacultyLibraryResponse }>('/faculty/library-items');
    return response.data.data;
  },

  async createLibraryItem(payload: FacultyLibraryPayload) {
    const response = await api.post('/faculty/library-items', payload);
    return response.data;
  },
};
