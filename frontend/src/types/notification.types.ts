export type NotificationType =
  | 'thesis.approved'
  | 'thesis.archived'
  | 'thesis.rejected'
  | 'thesis.submitted'
  | 'thesis.uploaded'
  | 'extension.requested'
  | 'new_message'
  | 'faculty.created'
  | 'student.created'
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
