import api from './api';
import type { StudentAdviserOption } from './thesisService';
import type { Thesis } from '../types/thesis.types';

export interface FacultyThesisPayload {
  title: string;
  abstract?: string;
  department?: string;
  program?: string;
  category_id: string;
  category_ids?: string[];
  school_year: string;
  authors?: string;
  adviser_id?: string;
  submission_mode: 'draft' | 'submit';
  confirm_original: boolean;
  allow_review: boolean;
  manuscript?: File | null;
  supplementary_files?: File[];
}

export const facultyThesisService = {
  async create(payload: FacultyThesisPayload) {
    const formData = new FormData();
    formData.append('title', payload.title);
    formData.append('abstract', payload.abstract ?? '');
    formData.append('department', payload.department ?? '');
    formData.append('program', payload.program ?? '');
    formData.append('category_id', payload.category_id);
    formData.append('category_ids', JSON.stringify(payload.category_ids ?? [payload.category_id].filter(Boolean)));
    formData.append('school_year', payload.school_year);
    formData.append('authors', payload.authors ?? '');
    formData.append('adviser_id', payload.adviser_id ?? '');
    formData.append('submission_mode', payload.submission_mode);

    if (payload.submission_mode === 'submit') {
      formData.append('confirm_original', payload.confirm_original ? '1' : '0');
      formData.append('allow_review', payload.allow_review ? '1' : '0');
    }

    if (payload.manuscript) {
      formData.append('manuscript', payload.manuscript);
    }

    (payload.supplementary_files ?? []).forEach((file) => {
      formData.append('supplementary_files[]', file);
    });

    const { data } = await api.post('/faculty/theses', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return data;
  },

  async update(id: string, payload: FacultyThesisPayload) {
    const formData = new FormData();
    formData.append('title', payload.title);
    formData.append('abstract', payload.abstract ?? '');
    formData.append('department', payload.department ?? '');
    formData.append('program', payload.program ?? '');
    formData.append('category_id', payload.category_id);
    formData.append('category_ids', JSON.stringify(payload.category_ids ?? [payload.category_id].filter(Boolean)));
    formData.append('school_year', payload.school_year);
    formData.append('authors', payload.authors ?? '');
    formData.append('adviser_id', payload.adviser_id ?? '');
    formData.append('submission_mode', payload.submission_mode);
    formData.append('_method', 'PATCH');

    if (payload.submission_mode === 'submit') {
      formData.append('confirm_original', payload.confirm_original ? '1' : '0');
      formData.append('allow_review', payload.allow_review ? '1' : '0');
    }

    if (payload.manuscript) {
      formData.append('manuscript', payload.manuscript);
    }

    (payload.supplementary_files ?? []).forEach((file) => {
      formData.append('supplementary_files[]', file);
    });

    const { data } = await api.post(`/faculty/theses/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return data;
  },

  async myTheses() {
    const { data } = await api.get<{ data?: Thesis[] }>('/faculty/my-theses');
    return data;
  },

  async archive(id: string) {
    const { data } = await api.patch<{ data?: Thesis }>(`/faculty/theses/${id}/archive`);
    return data;
  },

  async delete(id: string) {
    const { data } = await api.delete<{ message?: string }>(`/faculty/theses/${id}`);
    return data;
  },

  async advisers() {
    const { data } = await api.get<{ data?: StudentAdviserOption[] }>('/faculty/advisers');
    return data.data ?? [];
  },
};
