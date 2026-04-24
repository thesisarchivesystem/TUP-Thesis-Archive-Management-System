import type { Thesis } from './thesis.types';
import type { User } from './user.types';

export interface ExtensionRequest {
  id: string;
  thesis_id: string;
  student_id: string;
  faculty_id: string;
  requested_deadline: string;
  reason: string;
  status: string;
  created_at: string;
  thesis?: Thesis;
  student?: User;
  faculty?: User;
}
