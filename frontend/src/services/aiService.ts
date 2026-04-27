// frontend/src/services/aiService.ts

import api from './api';

export const aiService = {
  async chat(
    message: string,
    history?: Array<{ role: string; content: string }>,
    context?: {
      role?: string;
      page?: string;
      section?: string;
      path?: string;
    }
  ) {
    const { data } = await api.post('/ai/chat', {
      message,
      history,
      context,
    });
    return data;
  },
};