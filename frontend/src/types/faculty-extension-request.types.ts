export interface FacultyExtensionRequest {
  id: string;
  thesis_id: string;
  student_id: string;
  faculty_id: string;
  requested_deadline: string;
  reason: string;
  status: string;
  created_at: string;
  thesis?: {
    id: string;
    title: string;
    status: string;
  };
  student?: {
    id: string;
    name: string;
    email: string;
  };
}
