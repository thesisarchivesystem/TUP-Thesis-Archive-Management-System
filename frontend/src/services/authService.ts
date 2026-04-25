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
};
