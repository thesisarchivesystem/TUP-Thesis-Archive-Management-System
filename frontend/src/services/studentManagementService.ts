import api from './api';
import type { StudentProfile } from '../types/user.types';

export interface StudentAccountPayload {
  name: string;
  email: string;
  temporary_password: string;
  student_id: string;
  department: string;
  program: string;
  year_level?: number;
}

type StudentListResponse = {
  data?: StudentProfile[];
};

type StudentRecordResponse = {
  data: StudentProfile;
};

export const studentManagementService = {
  async listStudents(): Promise<StudentProfile[]> {
    const response = await api.get<StudentListResponse>('/faculty/students');
    return response.data.data ?? [];
  },

  async createStudentAccount(payload: StudentAccountPayload): Promise<StudentProfile> {
    const response = await api.post<StudentRecordResponse>('/faculty/students', payload);
    return response.data.data;
  },
};
