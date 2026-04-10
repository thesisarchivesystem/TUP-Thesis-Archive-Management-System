import { useEffect } from 'react';
import type { Types } from 'ably';
import { getAblyClient } from './useAbly';
import type { Message } from '../types/message.types';

export function useChatChannel(
  conversationId: string | null,
  onMessage: (msg: Message) => void
) {
  useEffect(() => {
    if (!conversationId) return;

    let channel: Types.RealtimeChannelCallbacks | undefined;

    (async () => {
      const client = await getAblyClient();
      channel = client.channels.get(`private:conversation.${conversationId}`);

      channel?.subscribe('message.new', (ablyMsg: Types.Message) => {
        onMessage(ablyMsg.data as Message);
      });
    })();

    return () => {
      channel?.unsubscribe();
    };
  }, [conversationId]);
}
