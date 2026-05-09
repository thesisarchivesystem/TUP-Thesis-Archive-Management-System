export interface FacultyExtensionRequest {
  id: string;
  thesis_id: string;
  student_id: string;
  faculty_id: string;
  requested_deadline: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  thesis?: {
    id: string;
    title: string;
    status: string;
    abstract?: string | null;
    authors?: string[] | null;
    revision_due_at?: string | null;
  };
  student?: {
    id: string;
    name: string;
    email: string;
  };
}
