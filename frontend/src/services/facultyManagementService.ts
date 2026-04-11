import api from './api';
import type { FacultyProfile } from '../types/user.types';

export interface FacultyAccountPayload {
  name: string;
  email: string;
  temporary_password: string;
  faculty_id: string;
  department: string;
  rank?: string;
  faculty_role: string;
  assigned_chair_id?: string;
  notes?: string;
}

export interface FacultyUpdatePayload {
  rank?: string;
  faculty_role?: string;
  assigned_chair_id?: string;
  notes?: string;
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
    const response = await api.get<FacultyListResponse>('/vpaa/faculty');
    return response.data.data ?? [];
  },

  async createFacultyAccount(payload: FacultyAccountPayload): Promise<FacultyProfile> {
    const response = await api.post<FacultyRecordResponse>('/vpaa/faculty', payload);
    return response.data.data;
  },

  async updateFacultyAccount(id: string, payload: FacultyUpdatePayload): Promise<FacultyProfile> {
    const response = await api.put<FacultyRecordResponse>(`/vpaa/faculty/${id}`, payload);
    return response.data.data;
  },

  async updateFacultyStatus(id: string, payload: FacultyStatusPayload): Promise<FacultyProfile> {
    const response = await api.patch<FacultyRecordResponse>(`/vpaa/faculty/${id}/status`, payload);
    return response.data.data;
  },
};
