export type UserRole = 'faculty' | 'student' | 'admin';

export interface User {
  id: string;
  first_name?: string | null;
  last_name?: string | null;
  suffix?: string | null;
  name: string;
  email: string;
  role: UserRole;
  avatar_url?: string;
  is_active: boolean;
  created_at: string;
  faculty?: FacultyProfile | null;
  student?: StudentProfile | null;
}

export interface FacultyProfile {
  id: string;
  user_id: string;
  faculty_id: string;
  department: string;
  college?: string | null;
  rank: string;
  faculty_role: 'Adviser' | 'Chairperson' | 'Dean/Head' | string;
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
