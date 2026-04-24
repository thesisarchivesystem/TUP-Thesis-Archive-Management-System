import api from './api';
import type { ExtensionRequest } from '../types/extension-request.types';

export interface CreateExtensionRequestPayload {
  thesis_id: string;
  requested_deadline: string;
  reason: string;
}

export const extensionRequestService = {
  async create(payload: CreateExtensionRequestPayload) {
    const { data } = await api.post<{ data: ExtensionRequest; message: string }>('/extension-requests', payload);
    return data;
  },

  async listForFaculty() {
    const { data } = await api.get<{ data?: ExtensionRequest[] }>('/faculty/extension-requests');
    return data;
  },
};
