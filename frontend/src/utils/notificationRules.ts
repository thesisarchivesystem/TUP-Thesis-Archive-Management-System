import type { NotificationType } from '../types/notification.types';
import type { UserRole } from '../types/user.types';

const notificationTypesByRole: Record<UserRole, NotificationType[]> = {
  student: [
    'new_message',
    'thesis.uploaded',
    'thesis.approved',
    'thesis.rejected',
    'thesis.archived',
  ],
  faculty: [
    'new_message',
    'student.created',
    'student.updated',
    'thesis.submitted',
    'thesis.rejected',
    'extension.requested',
    'department.file_shared',
  ],
  vpaa: [
    'new_message',
    'faculty.created',
    'faculty.updated',
    'faculty.role_changed',
  ],
};

export function isNotificationTypeAllowedForRole(role: UserRole, type: string): type is NotificationType {
  return notificationTypesByRole[role].includes(type as NotificationType);
}
