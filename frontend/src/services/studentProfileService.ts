import api from './api';

export interface StudentProfileView {
  id: string;
  student_id: string;
  first_name?: string | null;
  last_name?: string | null;
  suffix?: string | null;
  full_name: string;
  email: string;
  mobile: string | null;
  college?: string | null;
  department: string;
  program: string;
  section?: string | null;
  year_level: number | null;
  thesis_title: string | null;
  adviser_name: string | null;
  adviser_email: string | null;
  defense_schedule: string | null;
  status: string;
  editable_by: string;
  updated_at: string | null;
}

type StudentProfileResponse = {
  data: StudentProfileView;
};

export const studentProfileService = {
  async getProfile(): Promise<StudentProfileView> {
    const response = await api.get<StudentProfileResponse>('/student/profile');
    return response.data.data;
  },
};
