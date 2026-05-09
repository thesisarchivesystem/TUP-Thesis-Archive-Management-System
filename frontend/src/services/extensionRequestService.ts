import api from './api';
import type { ExtensionRequest } from '../types/extension-request.types';
import type { FacultyExtensionRequest } from '../types/faculty-extension-request.types';

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

  async getForStudentByThesis(thesisId: string) {
    const { data } = await api.get<{ data?: ExtensionRequest | null }>(`/student/extension-requests/thesis/${thesisId}`);
    return data.data ?? null;
  },

  async listForFaculty() {
    const { data } = await api.get<{ data?: FacultyExtensionRequest[] }>('/faculty/extension-requests');
    return data;
  },

  async getForFaculty(id: string) {
    const { data } = await api.get<{ data?: FacultyExtensionRequest }>(`/faculty/extension-requests/${id}`);
    return data.data ?? null;
  },

  async decide(id: string, status: 'approved' | 'rejected') {
    const { data } = await api.patch<{ data?: FacultyExtensionRequest; message?: string }>(`/faculty/extension-requests/${id}`, { status });
    return data;
  },
};
