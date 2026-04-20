import { useEffect } from 'react';
import type { Types } from 'ably';
import { getAblyClient } from './useAbly';
import { useNotificationStore } from '../store/notificationStore';
import type { NotificationType } from '../types/notification.types';

export function useNotificationChannel(userId: string | null) {
  const addNotification = useNotificationStore((s) => s.addNotification);

  useEffect(() => {
    if (!userId) return;

    let channel: Types.RealtimeChannelCallbacks | undefined;

    (async () => {
      const client = await getAblyClient();
      channel = client.channels.get(`private:notifications.${userId}`);

      channel?.subscribe((msg: Types.Message) => {
        const payload = (msg.data ?? {}) as Record<string, unknown>;
        addNotification({
          id: Math.random().toString(36),
          user_id: userId,
          type: (msg.name as NotificationType) || 'new_message',
          title: typeof payload.title === 'string' ? payload.title : 'Notification',
          body: typeof payload.body === 'string' ? payload.body : '',
          data: payload,
          created_at: new Date().toISOString(),
        });
      });
    })();

    return () => {
      channel?.unsubscribe();
    };
  }, [userId, addNotification]);
}
