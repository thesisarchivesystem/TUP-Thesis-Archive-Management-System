import api from './api';

export const authService = {
  async login(identifier: string, password: string) {
    const { data } = await api.post('/auth/login', { identifier, password });
    return data;
  },

  async logout() {
    return api.post('/auth/logout');
  },

  async getCurrentUser() {
    const { data } = await api.get('/auth/me');
    return data;
  },

  async forgotPassword(payload: { identifier: string }) {
    const { data } = await api.post('/auth/forgot-password', payload);
    return data;
  },

  async resetPassword(payload: {
    token: string;
    email: string;
    password: string;
    password_confirmation: string;
  }) {
    const { data } = await api.post('/auth/reset-password', payload);
    return data;
  },
};
