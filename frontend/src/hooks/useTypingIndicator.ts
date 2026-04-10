import { useEffect, useState, useRef } from 'react';
import type { Types } from 'ably';
import { getAblyClient } from './useAbly';

export function useTypingIndicator(conversationId: string | null, myUserId: string) {
  const [typingUserId, setTypingUserId] = useState<string | null>(null);
  const channelRef = useRef<Types.RealtimeChannelCallbacks | null>(null);

  useEffect(() => {
    if (!conversationId) return;

    (async () => {
      const client = await getAblyClient();
      const ch = client.channels.get(`private:conversation.${conversationId}`);
      channelRef.current = ch;

      ch.subscribe('typing', (msg: Types.Message) => {
        const { user_id, is_typing } = msg.data as { user_id: string; is_typing: boolean };
        if (user_id !== myUserId) {
          setTypingUserId(is_typing ? user_id : null);
        }
      });
    })();

    return () => {
      channelRef.current?.unsubscribe('typing');
    };
  }, [conversationId, myUserId]);

  const publishTyping = async (isTyping: boolean) => {
    channelRef.current?.publish('typing', { user_id: myUserId, is_typing: isTyping });
  };

  return { typingUserId, publishTyping };
}
