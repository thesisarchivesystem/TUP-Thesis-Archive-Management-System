import type { AppNotification } from '../types/notification.types';
import type { UserRole } from '../types/user.types';

type NotificationNavigationTarget = {
  path: string;
  state?: Record<string, unknown>;
};

const asString = (value: unknown): string | null =>
  typeof value === 'string' && value.trim() !== '' ? value : null;

export function getNotificationNavigationTarget(
  role: UserRole,
  notification: AppNotification,
): NotificationNavigationTarget | null {
  const thesisId = asString(notification.data?.thesis_id);
  const conversationId = asString(notification.data?.conversation_id);
  const messageId = asString(notification.data?.message_id);
  const facultyUserId = asString(notification.data?.faculty_user_id);
  const studentUserId = asString(notification.data?.student_user_id);
  const extensionRequestId = asString(notification.data?.extension_request_id);

  if (notification.type === 'new_message' && conversationId) {
    return {
      path: `/${role}/messages`,
      state: {
        conversationId,
        messageId,
      },
    };
  }

  if (role === 'student' && thesisId) {
    return {
      path: `/student/my-submissions/${encodeURIComponent(thesisId)}`,
    };
  }

  if (role === 'faculty') {
    if (notification.type === 'thesis.submitted' && thesisId) {
      return {
        path: `/faculty/manage-thesis/review/${encodeURIComponent(thesisId)}`,
      };
    }

    if (notification.type === 'department.file_shared') {
      return {
        path: '/faculty/students',
        state: { thesisId },
      };
    }

    if (notification.type === 'student.created') {
      return {
        path: '/faculty/my-advisees',
        state: { studentUserId },
      };
    }

    if (notification.type === 'extension.requested') {
      return {
        path: '/faculty/manage-thesis/review',
        state: { extensionRequestId, thesisId },
      };
    }
  }

  if (role === 'vpaa') {
    if (notification.type === 'faculty.created' || notification.type === 'faculty.role_changed') {
      return {
        path: '/vpaa/my-advisees',
        state: { facultyUserId },
      };
    }
  }

  return null;
}
