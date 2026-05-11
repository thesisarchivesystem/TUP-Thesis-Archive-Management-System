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

  if (role === 'admin' && notification.type.startsWith('support.ticket_')) {
    return {
      path: '/admin/tickets',
    };
  }

  if (['support.ticket_in_progress', 'support.ticket_resolved'].includes(notification.type)) {
    return {
      path: `/${role}/support`,
    };
  }

  if (
    role === 'student'
    && thesisId
    && ['thesis.uploaded', 'thesis.approved', 'thesis.certificate_ready', 'thesis.rejected', 'thesis.archived']
      .includes(notification.type)
  ) {
    return {
      path: `/student/my-submissions/${encodeURIComponent(thesisId)}`,
    };
  }

  if (role === 'student' && thesisId && ['extension.approved', 'extension.rejected'].includes(notification.type)) {
    return {
      path: `/student/extension-request?thesis=${encodeURIComponent(thesisId)}`,
      state: extensionRequestId ? { extensionRequestId } : undefined,
    };
  }

  if (role === 'faculty') {
    if ((notification.type === 'thesis.submitted' || notification.type === 'thesis.rejected') && thesisId) {
      return {
        path: `/faculty/manage-thesis/review/${encodeURIComponent(thesisId)}`,
      };
    }

    if (notification.type === 'department.file_shared') {
      return {
        path: '/faculty/students',
      };
    }

    if (notification.type === 'student.created' || notification.type === 'student.updated') {
      return {
        path: '/faculty/my-advisees',
        state: { studentUserId },
      };
    }

    if (notification.type === 'extension.requested') {
      return {
        path: extensionRequestId
          ? `/faculty/manage-thesis/extension-requests/${encodeURIComponent(extensionRequestId)}`
          : '/faculty/manage-thesis/review',
        state: { extensionRequestId, thesisId },
      };
    }
  }

  return null;
}
