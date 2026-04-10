import api from './api';

export const aiService = {
  async chat(message: string, history?: Array<{ role: string; content: string }>) {
    const { data } = await api.post('/ai/chat', {
      message,
      history,
    });
    return data;
  },
};
