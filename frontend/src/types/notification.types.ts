export type NotificationType =
  | 'thesis.approved'
  | 'thesis.rejected'
  | 'new_message'
  | 'faculty.created'
  | 'student.created';

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
