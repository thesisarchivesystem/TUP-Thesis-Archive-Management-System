import api from './api';
import type { AdminStructureCollege } from './adminService';
import type { FacultyProfile } from '../types/user.types';

export interface FacultyAccountPayload {
  first_name: string;
  last_name: string;
  suffix?: string;
  email: string;
  temporary_password: string;
  faculty_id?: string;
  department: string;
  college?: string;
  rank?: string;
  faculty_role: string;
  assigned_chair_id?: string;
}

export interface FacultyUpdatePayload {
  first_name: string;
  last_name: string;
  suffix?: string;
  email: string;
  temporary_password?: string;
  faculty_id: string;
  department: string;
  college?: string;
  rank?: string;
  faculty_role: string;
  assigned_chair_id?: string;
}

export interface FacultyStatusPayload {
  status: 'active' | 'on_leave' | 'inactive';
}

type FacultyListResponse = {
  data?: FacultyProfile[];
};

type FacultyRecordResponse = {
  data: FacultyProfile;
};

export const facultyManagementService = {
  async listFaculty(): Promise<FacultyProfile[]> {
    const response = await api.get<FacultyListResponse>('/admin/users', { params: { role: 'faculty' } });
    return response.data.data ?? [];
  },

  async listStructure(): Promise<AdminStructureCollege[]> {
    const response = await api.get<{ data?: AdminStructureCollege[] }>('/admin/structure');
    return response.data.data ?? [];
  },

  async createFacultyAccount(payload: FacultyAccountPayload): Promise<FacultyProfile> {
    const response = await api.post<FacultyRecordResponse>('/admin/users', { ...payload, role: 'faculty' });
    return response.data.data;
  },

  async updateFacultyAccount(id: string, payload: FacultyUpdatePayload): Promise<FacultyProfile> {
    const response = await api.put<FacultyRecordResponse>(`/admin/users/${id}`, { ...payload, role: 'faculty' });
    return response.data.data;
  },

  async updateFacultyStatus(id: string, payload: FacultyStatusPayload): Promise<FacultyProfile> {
    const response = await api.patch<FacultyRecordResponse>(`/admin/users/${id}/status`, payload);
    return response.data.data;
  },

  async removeFacultyAccount(id: string): Promise<void> {
    await api.patch(`/admin/users/${id}/status`, { status: 'inactive' });
  },
};
