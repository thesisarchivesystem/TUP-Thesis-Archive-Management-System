import { useEffect } from 'react';
import type { Types } from 'ably';
import { getAblyClient } from './useAbly';
import { useNotificationStore } from '../store/notificationStore';
import type { NotificationType } from '../types/notification.types';
import type { UserRole } from '../types/user.types';
import { isNotificationTypeAllowedForRole } from '../utils/notificationRules';

export function useNotificationChannel(userId: string | null, role: UserRole | null) {
  const addNotification = useNotificationStore((s) => s.addNotification);

  useEffect(() => {
    if (!userId || !role) return;

    let channel: Types.RealtimeChannelCallbacks | undefined;

    (async () => {
      const client = await getAblyClient();
      channel = client.channels.get(`private:notifications.${userId}`);

      channel?.subscribe((msg: Types.Message) => {
        const payload = (msg.data ?? {}) as Record<string, unknown>;
        const type = ((typeof payload.type === 'string' ? payload.type : msg.name) as NotificationType) || 'new_message';

        if (!isNotificationTypeAllowedForRole(role, type)) {
          return;
        }

        addNotification({
          id: typeof payload.id === 'string' ? payload.id : `${userId}-${msg.id}`,
          user_id: userId,
          type,
          title: typeof payload.title === 'string' ? payload.title : 'Notification',
          body: typeof payload.body === 'string' ? payload.body : '',
          data: (payload.data as Record<string, unknown>) || payload,
          read_at: typeof payload.read_at === 'string' ? payload.read_at : undefined,
          created_at: typeof payload.created_at === 'string' ? payload.created_at : new Date().toISOString(),
        });
      });
    })();

    return () => {
      channel?.unsubscribe();
    };
  }, [userId, role, addNotification]);
}
