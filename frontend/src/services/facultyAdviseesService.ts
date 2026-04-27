import api from './api';
import type { StudentProfile } from '../types/user.types';

export interface FacultyAdviseeSummary {
  total_advisees: number;
  active_proposals: number;
  on_track?: number;
  for_defense: number;
  needs_guidance: number;
  new_this_term: number;
  info_changed?: number;
}

export interface FacultyAdviseeRecord {
  id: string;
  student_id: string;
  student_name: string;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  program: string;
  department: string;
  year_level?: number | null;
  status: 'Active' | 'On Track' | 'Needs Guidance';
  status_tone: 'gold' | 'sage' | 'terracotta';
  action: 'Open' | 'Review' | 'Checklist';
  last_update?: string | null;
  proposal_count: number;
  approved_count: number;
  needs_guidance: boolean;
  is_recent: boolean;
  info_changed?: boolean;
  adviser_name: string;
}

export interface FacultyAdviseesResponse {
  department: string;
  adviser_name: string;
  next_student_id: string;
  summary: FacultyAdviseeSummary;
  advisees: FacultyAdviseeRecord[];
}

export interface StudentAccountPayload {
  first_name: string;
  last_name: string;
  suffix?: string;
  email: string;
  temporary_password: string;
  student_id?: string;
  department: string;
  program: string;
  year_level?: number;
}

type StudentRecordResponse = {
  data: StudentProfile;
};

export const facultyAdviseesService = {
  async getAdvisees(): Promise<FacultyAdviseesResponse> {
    const response = await api.get('/faculty/advisees');
    return response.data.data ?? response.data;
  },

  async createStudentAccount(payload: StudentAccountPayload): Promise<StudentProfile> {
    const response = await api.post<StudentRecordResponse>('/faculty/students', payload);
    return response.data.data;
  },

  async updateStudentAccount(studentId: string, payload: StudentAccountPayload): Promise<StudentProfile> {
    const response = await api.put<StudentRecordResponse>(`/faculty/students/${studentId}`, payload);
    return response.data.data;
  },

  async removeStudentAccount(studentId: string): Promise<void> {
    await api.delete(`/faculty/students/${studentId}`);
  },
};
