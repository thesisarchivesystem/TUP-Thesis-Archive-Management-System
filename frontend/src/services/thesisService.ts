import api from './api';
import type { Thesis } from '../types/thesis.types';

export interface StudentThesisPayload {
  title: string;
  abstract?: string;
  keywords?: string;
  department: string;
  program?: string;
  category_id: string;
  school_year: string;
  authors?: string | string[];
  adviser_id?: string;
  manuscript?: File | null;
  supplementary_files?: File[];
}

const buildStudentUploadFormData = (payload: StudentThesisPayload) => {
  const formData = new FormData();
  formData.append('title', payload.title);
  formData.append('abstract', payload.abstract ?? '');
  formData.append('keywords', JSON.stringify(
    (payload.keywords ?? '')
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean),
  ));
  formData.append('department', payload.department);
  formData.append('program', payload.program ?? '');
  formData.append('category_id', payload.category_id);
  formData.append('school_year', payload.school_year);
  formData.append('adviser_id', payload.adviser_id ?? '');
  const normalizedAuthors = Array.isArray(payload.authors)
    ? payload.authors
    : (payload.authors ?? '')
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
  formData.append('authors', JSON.stringify(normalizedAuthors));

  if (payload.manuscript) {
    formData.append('manuscript', payload.manuscript);
  }

  (payload.supplementary_files ?? []).forEach((file) => {
    formData.append('supplementary_files[]', file);
  });

  return formData;
};

export interface StudentAdviserOption {
  id: string;
  faculty_profile_id: string;
  name: string;
  email: string;
  department: string;
  faculty_role: string;
  rank?: string | null;
}

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

  async createStudentUpload(payload: StudentThesisPayload) {
    const formData = buildStudentUploadFormData(payload);

    const { data } = await api.post('/thesis', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      transformRequest: [(requestData) => requestData],
    });

    return data;
  },

  async updateStudentUpload(id: string, payload: StudentThesisPayload) {
    const formData = buildStudentUploadFormData(payload);

    const { data } = await api.post(`/thesis/${id}?_method=PATCH`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      transformRequest: [(requestData) => requestData],
    });

    return data;
  },

  async update(id: string, thesis: Partial<Thesis>) {
    const { data } = await api.patch(`/thesis/${id}`, thesis);
    return data;
  },

  async delete(id: string) {
    const { data } = await api.delete(`/thesis/${id}`);
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

  async advisers() {
    const { data } = await api.get<{ data?: StudentAdviserOption[] }>('/student/advisers');
    return data.data ?? [];
  },

  async recentlyViewed() {
    const { data } = await api.get('/student/recently-viewed');
    return data;
  },

  async getManuscriptAccessUrl(id: string) {
    const { data } = await api.get<{ data?: { url?: string } }>(`/thesis/${id}/manuscript`);
    return data.data?.url ?? null;
  },
};
