export type UserRole = 'vpaa' | 'faculty' | 'student';

export interface User {
  id: string;
  first_name?: string | null;
  last_name?: string | null;
  name: string;
  email: string;
  role: UserRole;
  avatar_url?: string;
  is_active: boolean;
  created_at: string;
  vpaaProfile?: VpaaProfile;
}

export interface VpaaProfile {
  id: string;
  employee_id: string;
  email: string;
  first_name?: string | null;
  last_name?: string | null;
  office?: string | null;
  area_of_oversight?: string | null;
  full_name: string;
  role_title?: string | null;
  office_hours?: string | null;
  updated_at?: string | null;
}

export interface FacultyProfile {
  id: string;
  user_id: string;
  faculty_id: string;
  department: string;
  college?: string | null;
  rank: string;
  faculty_role: 'Dean' | 'Adviser' | 'Co-Adviser';
  assigned_chair_id?: string;
  notes?: string;
  status: 'active' | 'on_leave' | 'inactive';
  user: User;
}

export interface StudentProfile {
  id: string;
  user_id: string;
  student_id: string;
  department: string;
  program: string;
  year_level: number;
  adviser_id: string;
  user: User;
}
