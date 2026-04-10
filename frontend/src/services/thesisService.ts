import api from './api';
import type { Thesis } from '../types/thesis.types';

export const thesisService = {
  async list() {
    const { data } = await api.get('/thesis');
    return data;
  },

  async get(id: string) {
    const { data } = await api.get(`/thesis/${id}`);
    return data;
  },

  async create(thesis: Partial<Thesis>) {
    const { data } = await api.post('/thesis', thesis);
    return data;
  },

  async update(id: string, thesis: Partial<Thesis>) {
    const { data } = await api.patch(`/thesis/${id}`, thesis);
    return data;
  },

  async submit(id: string) {
    const { data } = await api.post(`/thesis/${id}/submit`);
    return data;
  },

  async review(id: string, status: 'approved' | 'rejected', remarks: string, reason?: string) {
    const { data } = await api.patch(`/faculty/thesis/${id}/review`, {
      status,
      adviser_remarks: remarks,
      rejection_reason: reason,
    });
    return data;
  },

  async pendingReview() {
    const { data } = await api.get('/faculty/thesis-submissions');
    return data;
  },

  async approved() {
    const { data } = await api.get('/faculty/approved-thesis');
    return data;
  },

  async mySubmissions() {
    const { data } = await api.get('/student/my-submissions');
    return data;
  },

  async recentlyViewed() {
    const { data } = await api.get('/student/recently-viewed');
    return data;
  },
};
