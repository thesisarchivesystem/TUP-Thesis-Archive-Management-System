import api from './api';
import type { VpaaProfile } from '../types/user.types';

export type UpdateVpaaProfilePayload = {
  email: string;
  mobile: string;
  office: string;
  first_name: string;
  last_name: string;
  role_title: string;
  supervised_units: string;
  office_hours: string;
  signature_title: string;
};

export const vpaaProfileService = {
  async getProfile(): Promise<VpaaProfile> {
    const response = await api.get('/vpaa/profile');
    return response.data.data;
  },

  async updateProfile(payload: UpdateVpaaProfilePayload): Promise<VpaaProfile> {
    const response = await api.put('/vpaa/profile', payload);
    return response.data.data;
  },
};
