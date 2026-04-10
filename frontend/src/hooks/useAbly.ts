import Ably, { ErrorInfo } from 'ably';
import api from '../services/api';

let ablyClient: Ably.Realtime | null = null;

export async function getAblyClient(): Promise<Ably.Realtime> {
  if (ablyClient && ablyClient.connection.state === 'connected') {
    return ablyClient;
  }

  // Fetch a signed token from our Laravel backend
  await api.get('/ably/token');

  ablyClient = new Ably.Realtime({
    authCallback: async (_tokenParams, callback) => {
      try {
        const { data: tokenRequest } = await api.get('/ably/token');
        callback(null, tokenRequest);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unable to fetch Ably token';
        callback(new ErrorInfo(message, 50000, 500), null);
      }
    },
  });

  return ablyClient;
}
