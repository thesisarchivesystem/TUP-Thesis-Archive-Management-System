export type NotificationType =
  | 'thesis.approved'
  | 'thesis.archived'
  | 'thesis.rejected'
  | 'thesis.submitted'
  | 'thesis.uploaded'
  | 'extension.requested'
  | 'extension.approved'
  | 'extension.rejected'
  | 'new_message'
  | 'faculty.created'
  | 'faculty.updated'
  | 'student.created'
  | 'student.updated'
  | 'faculty.role_changed'
  | 'department.file_shared';

export interface AppNotification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string;
  data: Record<string, unknown>;
  read_at?: string;
  created_at: string;
}
