import api from './api';

export const notificationService = {
  async list() {
    const { data } = await api.get('/notifications');
    return data;
  },

  async markRead(id: string) {
    const { data } = await api.patch(`/notifications/${id}/read`);
    return data;
  },

  async markAllRead() {
    const { data } = await api.patch('/notifications/read-all');
    return data;
  },
};
