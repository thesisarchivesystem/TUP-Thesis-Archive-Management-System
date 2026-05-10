import type { NotificationType } from '../types/notification.types';
import type { UserRole } from '../types/user.types';

const notificationTypesByRole: Record<UserRole, NotificationType[]> = {
  student: [
    'new_message',
    'thesis.uploaded',
    'thesis.approved',
    'thesis.certificate_ready',
    'thesis.rejected',
    'thesis.archived',
    'extension.approved',
    'extension.rejected',
    'support.ticket_in_progress',
    'support.ticket_resolved',
  ],
  faculty: [
    'new_message',
    'student.created',
    'student.updated',
    'thesis.submitted',
    'thesis.rejected',
    'extension.requested',
    'department.file_shared',
    'support.ticket_in_progress',
    'support.ticket_resolved',
  ],
  admin: [],
};

export function isNotificationTypeAllowedForRole(role: UserRole, type: string): type is NotificationType {
  return notificationTypesByRole[role].includes(type as NotificationType);
}
